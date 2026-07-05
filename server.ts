import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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
    return res.json(parsedJson);

  } catch (error: any) {
    console.error("Gemini Parsing Error:", error);
    return res.status(500).json({
      error: "Failed to parse gig description using Gemini AI.",
      details: error.message || error
    });
  }
});

// Verification code store for mock SMS verification
const verificationCodes = new Map<string, string>();

// Helper to verify our lightweight phone session token
function verifyPhoneToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  if (token.startsWith("hustlehub_token_")) {
    return token.substring("hustlehub_token_".length);
  }
  return null;
}

// 1. Mock SMS sending endpoint
app.post("/api/auth/send-code", (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  // Generate a random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes.set(phone, code);

  console.log(`[SMS MOCK] Verification code for ${phone} is: ${code}`);

  // Return the code in response so user doesn't have to check terminal logs,
  // while also permitting "123456" as a universal bypass
  return res.json({
    success: true,
    message: `Verification SMS sent successfully to ${phone}`,
    code, // user can auto-fill this code
  });
});

// 2. Mock SMS verification endpoint
app.post("/api/auth/verify-code", (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: "Phone number and code are required" });
  }

  const storedCode = verificationCodes.get(phone);
  if (code === "123456" || code === storedCode) {
    // Generate a lightweight session token
    const token = `hustlehub_token_${phone}`;
    verificationCodes.delete(phone); // clean up

    return res.json({
      success: true,
      token,
      phone,
    });
  }

  return res.status(400).json({ error: "Invalid verification code. Please try again." });
});

// 3. Post Gig with google sheet sync capability
app.post("/api/gigs", async (req, res) => {
  const authHeader = req.headers.authorization;
  const phone = verifyPhoneToken(authHeader);

  if (!phone) {
    return res.status(401).json({ error: "Unauthorized. Please log in first." });
  }

  const {
    id,
    title,
    category,
    customCategory,
    budget,
    whatsapp,
    location,
    posterName,
    duration,
    requirements,
    createdAt,
  } = req.body;

  const googleToken = req.headers["x-google-token"] as string;
  const spreadsheetId = req.headers["x-spreadsheet-id"] as string;

  // Build the complete gig object with phone ownership
  const gig = {
    id: id || `gig-${Date.now()}`,
    title,
    category,
    customCategory,
    budget: parseFloat(budget) || 0,
    whatsapp,
    location,
    posterName,
    duration: duration || "One-time",
    requirements: Array.isArray(requirements) ? requirements : [],
    createdAt: createdAt || new Date().toISOString(),
    userPhone: phone,
  };

  // If connected to Google Sheets, append directly to Google Sheet
  if (googleToken && spreadsheetId) {
    try {
      // 1. Fetch metadata to get the sheet name
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: { Authorization: `Bearer ${googleToken}` },
      });
      if (!metaRes.ok) {
        throw new Error("Failed to fetch spreadsheet metadata in Google Sheets");
      }
      const metaData = await metaRes.json();
      const sheetName = metaData.sheets?.[0]?.properties?.title || "Sheet1";

      // 2. Format row data (matching GoogleSheetsSync export columns)
      // Columns: Gig ID, Title, Category, Budget (GHS), WhatsApp Contact, Location, Poster Name, Duration, Key Requirements, Created At, Description, User Phone
      const rowValue = [
        gig.id,
        gig.title,
        gig.customCategory || gig.category,
        gig.budget,
        `+${gig.whatsapp}`,
        gig.location,
        gig.posterName,
        gig.duration,
        gig.requirements.join(", "),
        gig.createdAt,
        req.body.description || "",
        phone // userPhone
      ];

      // 3. Append row
      const appendRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${googleToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [rowValue],
          }),
        }
      );

      if (!appendRes.ok) {
        const errorText = await appendRes.text();
        console.error("Google Sheets append failed:", errorText);
        throw new Error("Failed to append new row to Google Sheets");
      }
    } catch (sheetError: any) {
      console.error("Google Sheets sync error on post:", sheetError);
      // We still return the gig to allow client-side fallback/save
    }
  }

  return res.json({ success: true, gig });
});

// 4. Delete Gig endpoint with Google Sheets row removal
app.delete("/api/delete-gig/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  const phone = verifyPhoneToken(authHeader);

  if (!phone) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.params;
  const googleToken = req.headers["x-google-token"] as string;
  const spreadsheetId = req.headers["x-spreadsheet-id"] as string;

  if (googleToken && spreadsheetId) {
    try {
      // 1. Get spreadsheet metadata for sheet ID & title
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(sheetId,title))`, {
        headers: { Authorization: `Bearer ${googleToken}` },
      });
      if (!metaRes.ok) {
        throw new Error("Failed to retrieve spreadsheet metadata");
      }
      const meta = await metaRes.json();
      const firstSheet = meta.sheets?.[0]?.properties;
      const sheetId = firstSheet?.sheetId || 0;
      const sheetName = firstSheet?.title || "Sheet1";

      // 2. Fetch all values
      const valRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:L1000`, {
        headers: { Authorization: `Bearer ${googleToken}` },
      });
      if (!valRes.ok) {
        throw new Error("Failed to read spreadsheet rows");
      }
      const valData = await valRes.json();
      const rows = valData.values as string[][];

      if (rows && rows.length > 1) {
        // Find row index where column 0 (Gig ID) matches the target ID
        let foundIndex = -1;
        for (let i = 1; i < rows.length; i++) {
          if (rows[i] && rows[i][0] === id) {
            foundIndex = i;
            break;
          }
        }

        if (foundIndex !== -1) {
          const rowUserPhone = rows[foundIndex][11] || "";
          // Clean phone inputs to match securely
          const cleanPhone1 = phone.replace(/\D/g, "");
          const cleanPhone2 = rowUserPhone.replace(/\D/g, "");

          if (cleanPhone1 !== cleanPhone2) {
            return res.status(403).json({ error: "Forbidden. You do not own this post." });
          }

          // Delete row via batchUpdate
          const deleteRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${googleToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              requests: [
                {
                  deleteDimension: {
                    range: {
                      sheetId,
                      dimension: "ROWS",
                      startIndex: foundIndex,
                      endIndex: foundIndex + 1,
                    },
                  },
                },
              ],
            }),
          });

          if (!deleteRes.ok) {
            const errTxt = await deleteRes.text();
            console.error("Failed to delete row from Google Sheets:", errTxt);
            throw new Error("Failed to complete Google Sheet deletion request");
          }
        }
      }
    } catch (err: any) {
      console.error("Google Sheets delete error:", err);
      return res.status(500).json({ error: "Failed to delete gig from Google Sheets", details: err.message });
    }
  }

  return res.json({ success: true, message: "Gig deleted successfully." });
});

// 5. Account and Gigs permanent wiping
app.post("/api/auth/delete-account", async (req, res) => {
  const authHeader = req.headers.authorization;
  const phone = verifyPhoneToken(authHeader);

  if (!phone) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const googleToken = req.headers["x-google-token"] as string;
  const spreadsheetId = req.headers["x-spreadsheet-id"] as string;

  if (googleToken && spreadsheetId) {
    try {
      // 1. Get spreadsheet metadata for sheet ID & title
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(sheetId,title))`, {
        headers: { Authorization: `Bearer ${googleToken}` },
      });
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const firstSheet = meta.sheets?.[0]?.properties;
        const sheetId = firstSheet?.sheetId || 0;
        const sheetName = firstSheet?.title || "Sheet1";

        // 2. Fetch all values
        const valRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:L1000`, {
          headers: { Authorization: `Bearer ${googleToken}` },
        });

        if (valRes.ok) {
          const valData = await valRes.json();
          const rows = valData.values as string[][];

          if (rows && rows.length > 1) {
            const cleanPhoneTarget = phone.replace(/\D/g, "");
            const indicesToDelete: number[] = [];

            for (let i = 1; i < rows.length; i++) {
              if (rows[i]) {
                const rowUserPhone = (rows[i][11] || "").replace(/\D/g, "");
                if (rowUserPhone === cleanPhoneTarget) {
                  indicesToDelete.push(i);
                }
              }
            }

            if (indicesToDelete.length > 0) {
              // Build delete requests in descending order to avoid shift errors
              const deleteRequests = indicesToDelete
                .sort((a, b) => b - a)
                .map(index => ({
                  deleteDimension: {
                    range: {
                      sheetId,
                      dimension: "ROWS",
                      startIndex: index,
                      endIndex: index + 1,
                    },
                  },
                }));

              const deleteRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${googleToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  requests: deleteRequests,
                }),
              });

              if (!deleteRes.ok) {
                const errTxt = await deleteRes.text();
                console.error("Failed to batch delete account rows:", errTxt);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Google Sheets wipe account error:", err);
      // We continue to complete local logout/wiping
    }
  }

  return res.json({ success: true, message: "Account and posts wiped completely." });
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
