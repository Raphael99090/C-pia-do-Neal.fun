import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple JSON Database
const DB_FILE = path.join(__dirname, "database.json");

interface LeaderboardEntry {
  game: string;
  name: string;
  score: number;
  date: string;
}

interface Database {
  leaderboards: LeaderboardEntry[];
  likes: Record<string, number>;
}

const defaultDb: Database = { leaderboards: [], likes: {} };

function readDb(): Database {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Error reading DB", e);
  }
  return defaultDb;
}

function saveDb(db: Database) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving DB", e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // === BACKEND DATABASE ENDPOINTS ===

  let _geminiAI: GoogleGenAI | null = null;
  function getGeminiAI(): GoogleGenAI {
    if (!_geminiAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }
      _geminiAI = new GoogleGenAI({ apiKey });
    }
    return _geminiAI;
  }

  app.get("/api/leaderboard/:game", (req, res) => {
    const db = readDb();
    const game = req.params.game;
    const scores = db.leaderboards
      .filter((e) => e.game === game)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    res.json(scores);
  });

  app.post("/api/leaderboard/:game", (req, res) => {
    const db = readDb();
    const game = req.params.game;
    const { name, score } = req.body;
    
    if (!name || typeof score !== "number") {
      return res.status(400).json({ error: "Invalid name or score" });
    }

    db.leaderboards.push({
      game,
      name: name.substring(0, 20), // limit length
      score,
      date: new Date().toISOString(),
    });

    saveDb(db);
    res.json({ success: true });
  });

  app.get("/api/likes/:game", (req, res) => {
    const db = readDb();
    const game = req.params.game;
    res.json({ likes: db.likes[game] || 0 });
  });

  app.post("/api/likes/:game", (req, res) => {
    const db = readDb();
    const game = req.params.game;
    db.likes[game] = (db.likes[game] || 0) + 1;
    saveDb(db);
    res.json({ likes: db.likes[game] });
  });

  // Alchemy Game Combination Endpoint
  app.post("/api/alchemy/combine", async (req, res) => {
    try {
      const { prompt } = req.body;
      const geminiAI = getGeminiAI();
      const response = await geminiAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
          responseSchema: {
            type: "object" as any,
            properties: {
              name: { type: "string" as any },
              icon: { type: "string" as any },
              color: { type: "string" as any },
            },
            required: ["name", "icon", "color"],
          },
        },
      });

      const text = response.text;
      if (!text) {
        return res.status(500).json({ error: "No response text" });
      }

      res.json(JSON.parse(text));
    } catch (error) {
      console.error("Alchemy API Error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Moral Dilemmas Generation Endpoint
  app.post("/api/dilemmas/generate", async (req, res) => {
    try {
      const { prompt } = req.body;
      const geminiAI = getGeminiAI();
      const response = await geminiAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.9,
          responseSchema: {
            type: "object" as any,
            properties: {
              title: { type: "string" as any },
              description: { type: "string" as any },
              optionA: {
                type: "object" as any,
                properties: {
                  text: { type: "string" as any },
                  consequence: { type: "string" as any },
                  impact: { type: "string" as any }
                },
                required: ["text", "consequence", "impact"]
              },
              optionB: {
                type: "object" as any,
                properties: {
                  text: { type: "string" as any },
                  consequence: { type: "string" as any },
                  impact: { type: "string" as any }
                },
                required: ["text", "consequence", "impact"]
              }
            },
            required: ["title", "description", "optionA", "optionB"]
          }
        },
      });

      const text = response.text;
      if (!text) {
        return res.status(500).json({ error: "No response text" });
      }

      res.json(JSON.parse(text));
    } catch (error) {
      console.error("Dilemmas API Error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
