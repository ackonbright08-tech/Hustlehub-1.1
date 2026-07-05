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
