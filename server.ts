import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory store for SMS verification codes and user sessions
const verificationCodes = new Map<string, string>();
const userSessions = new Map<string, string>();

// Helper to get verified phone from authorization header
const getVerifiedPhone = (req: express.Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  return userSessions.get(token) || null;
};

// 1. Send SMS Code
app.post("/api/auth/send-code", (req, res) => {
  const { phone } = req.body;
  if (!phone || typeof phone !== "string") {
    return res.status(400).json({ error: "Missing or invalid phone parameter" });
  }

  // Generate 6-digit random code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes.set(phone, code);

  console.log(`[SMS SANDBOX] Sending 6-digit verification code to ${phone}: ${code}`);

  return res.json({
    success: true,
    message: `Verification code sent. (SANDBOX MODE: Your verification code is ${code})`,
    code
  });
});

// 2. Verify SMS Code
app.post("/api/auth/verify-code", (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: "Missing phone or code parameters" });
  }

  const storedCode = verificationCodes.get(phone);
  if (!storedCode || storedCode !== code) {
    return res.status(400).json({ error: "Invalid or expired verification code" });
  }

  verificationCodes.delete(phone); // clear code

  // Generate token
  const token = "token-" + Math.random().toString(36).substring(2) + Date.now().toString(36);
  userSessions.set(token, phone);

  return res.json({
    success: true,
    token,
    phone
  });
});

// 3. Delete Gig Row from Google Sheet (Verifies ownership)
app.delete("/api/delete-gig/:id", async (req, res) => {
  const { id } = req.params;
  const verifiedPhone = getVerifiedPhone(req);

  if (!verifiedPhone) {
    return res.status(401).json({ error: "Unauthorized. Please login." });
  }

  const googleToken = req.headers["x-google-token"] as string;
  const spreadsheetId = req.headers["x-spreadsheet-id"] as string;

  if (!googleToken || !spreadsheetId) {
    return res.status(400).json({ error: "Missing Google authorization or Spreadsheet ID" });
  }

  try {
    // Fetch spreadsheet metadata to find the real sheet name
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${googleToken}` },
    });

    if (!metaRes.ok) {
      throw new Error(`Failed to fetch spreadsheet metadata: ${metaRes.statusText}`);
    }

    const metaData = await metaRes.json();
    const sheetName = metaData.sheets?.[0]?.properties?.title || 'Sheet1';
    const sheetId = metaData.sheets?.[0]?.properties?.sheetId || 0;

    // Fetch values from A1 to L1000 (including User Phone in L column)
    const sheetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:L1000`, {
      headers: { Authorization: `Bearer ${googleToken}` },
    });

    if (!sheetRes.ok) {
      throw new Error(`Failed to read spreadsheet values: ${sheetRes.statusText}`);
    }

    const sheetData = await sheetRes.json();
    const rows = sheetData.values as string[][];

    if (!rows || rows.length <= 1) {
      return res.status(404).json({ error: "No gigs found in spreadsheet" });
    }

    // Find row with matching id and verifiedPhone
    let foundRowIndex = -1;
    const cleanVerifiedPhone = verifiedPhone.replace(/\D/g, "");

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row && row[0] === id) {
        const rowPhone = (row[11] || '').replace(/\D/g, "");
        if (rowPhone === cleanVerifiedPhone) {
          foundRowIndex = i;
          break;
        }
      }
    }

    if (foundRowIndex === -1) {
      return res.status(403).json({ error: "Forbidden. You do not own this gig or it does not exist." });
    }

    // Delete the row
    const deleteRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${googleToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: foundRowIndex,
                endIndex: foundRowIndex + 1
              }
            }
          }
        ]
      })
    });

    if (!deleteRes.ok) {
      const errText = await deleteRes.text();
      throw new Error(`Failed to delete row from spreadsheet: ${errText}`);
    }

    return res.json({ success: true, message: "Gig deleted from Google Sheet successfully" });

  } catch (error: any) {
    console.error("Delete Gig Error:", error);
    return res.status(500).json({ error: error.message || "Failed to delete gig from Google Sheet" });
  }
});

// 4. Wipe User Account (removes all of user's posts from Google Sheets and clears session)
app.post("/api/auth/wipe-account", async (req, res) => {
  const verifiedPhone = getVerifiedPhone(req);

  if (!verifiedPhone) {
    return res.status(401).json({ error: "Unauthorized. Please login." });
  }

  const googleToken = req.headers["x-google-token"] as string;
  const spreadsheetId = req.headers["x-spreadsheet-id"] as string;

  try {
    if (googleToken && spreadsheetId) {
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: { Authorization: `Bearer ${googleToken}` },
      });

      if (metaRes.ok) {
        const metaData = await metaRes.json();
        const sheetName = metaData.sheets?.[0]?.properties?.title || 'Sheet1';
        const sheetId = metaData.sheets?.[0]?.properties?.sheetId || 0;

        const sheetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:L1000`, {
          headers: { Authorization: `Bearer ${googleToken}` },
        });

        if (sheetRes.ok) {
          const sheetData = await sheetRes.json();
          const rows = sheetData.values as string[][];

          if (rows && rows.length > 1) {
            const rowIndicesToDelete: number[] = [];
            const cleanVerifiedPhone = verifiedPhone.replace(/\D/g, "");

            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (row) {
                const rowPhone = (row[11] || '').replace(/\D/g, "");
                if (rowPhone === cleanVerifiedPhone) {
                  rowIndicesToDelete.push(i);
                }
              }
            }

            // Delete rows in reverse order to maintain indices
            if (rowIndicesToDelete.length > 0) {
              rowIndicesToDelete.sort((a, b) => b - a);
              const requests = rowIndicesToDelete.map(rowIndex => ({
                deleteDimension: {
                  range: {
                    sheetId: sheetId,
                    dimension: "ROWS",
                    startIndex: rowIndex,
                    endIndex: rowIndex + 1
                  }
                }
              }));

              await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${googleToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ requests })
              });
            }
          }
        }
      }
    }

    // Clear backend session
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      userSessions.delete(token);
    }

    return res.json({ success: true, message: "Account wiped successfully and posts deleted from Google Sheet" });

  } catch (error: any) {
    console.error("Wipe Account Error:", error);
    return res.status(500).json({ error: error.message || "Failed to wipe account" });
  }
});

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API endpoint to parse raw gig text using Gemini
app.post("/api/parse-gig", async (req, res) => {
  const { rawText } = req.body;

  if (!rawText || typeof rawText !== "string") {
    return res.status(400).json({ error: "Missing or invalid rawText field" });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Raw User Input: "${rawText}"`,
      config: {
        systemInstruction: `You are the automated backend data engine for HustleHub Ghana. Your primary role is to take raw, user-submitted text from the "+ Post" form and convert it into a perfectly structured JSON object ready to be appended as a new row in the connected Google Sheets database.

Analyze the user's input and extract these exact fields:
1. "title": A concise, clear name for the gig.
2. "category": Categorize it into one of these exact options: "Delivery & Transit", "Tech & Social Media", "Teaching & Writing", "Handwork & Repair", "Fashion & Hair", "Agric & Business", or "Other".
3. "payout": The budget formatted strictly as GH₵ followed by the amount (e.g., GH₵150). If not specified, set it as "Negotiable".
4. "location": The specific neighborhood or city in Ghana (e.g., "Osu, Accra" or "Tema Community 25").
5. "description": A clean, readable summary of what needs to be done.

Output Rules:
- Return ONLY a raw JSON object containing these keys.
- Do not include any markdown formatting (like \`\`\`json), background text, or conversational chat.
- If details are messy, use your knowledge of Ghanaian context to clean them up professionally before generating the JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A concise, clear name for the gig.",
            },
            category: {
              type: Type.STRING,
              description: "Must be exactly one of: Delivery & Transit, Tech & Social Media, Teaching & Writing, Handwork & Repair, Fashion & Hair, Agric & Business, or Other.",
            },
            payout: {
              type: Type.STRING,
              description: "The budget formatted strictly as GH₵ followed by the amount (e.g., GH₵150). If not specified, set it as 'Negotiable'.",
            },
            location: {
              type: Type.STRING,
              description: "The specific neighborhood or city in Ghana (e.g., 'Osu, Accra' or 'Tema Community 25').",
            },
            description: {
              type: Type.STRING,
              description: "A clean, readable summary of what needs to be done.",
            },
          },
          required: ["title", "category", "payout", "location", "description"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini API");
    }

    const parsedJson = JSON.parse(resultText.trim());

    // Write to Google Sheet if synchronization details are provided
    const { googleAccessToken, spreadsheetId, userPhone, posterName, whatsapp } = req.body;
    if (googleAccessToken && spreadsheetId && userPhone) {
      try {
        const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
        });
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          const sheetName = metaData.sheets?.[0]?.properties?.title || 'Sheet1';
          
          const gigId = "gig-" + Date.now();
          const budgetNum = parseFloat((parsedJson.payout || "").replace(/[^\d.]/g, "")) || 0;
          const cleanWhatsApp = (whatsapp || userPhone || "").replace(/\D/g, "");

          const newRow = [
            gigId,
            parsedJson.title,
            (parsedJson.category || "other").toLowerCase(),
            budgetNum,
            `+${cleanWhatsApp}`,
            parsedJson.location,
            posterName || "Community Poster",
            "One-time",
            "", // Key requirements
            new Date().toISOString(),
            parsedJson.description,
            userPhone
          ];

          const appendRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${googleAccessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                values: [newRow],
              }),
            }
          );
          if (appendRes.ok) {
            console.log(`[Google Sheets] Parsed gig appended to sheet: ${gigId}`);
            parsedJson.id = gigId;
            parsedJson.userPhone = userPhone;
          } else {
            console.error(`[Google Sheets] Append failed: ${await appendRes.text()}`);
          }
        }
      } catch (sheetErr) {
        console.error("Failed to append parsed gig to Google Sheet:", sheetErr);
      }
    }

    return res.json(parsedJson);

  } catch (error: any) {
    console.error("Gemini Parsing Error:", error);
    return res.status(500).json({
      error: "Failed to parse gig description using Gemini AI.",
      details: error.message || error
    });
  }
});

// Setup Vite Dev Server / Static Files middleware
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupVite();
