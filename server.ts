import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/gemini/parse", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured in the Secrets panel.");
      }
      const { prompt } = req.body;
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a proactive task assistant. Extract tasks from the user's braindump. Assign a priority (High, Medium, Low), a deadline if applicable (e.g. 'This Friday'), and an urgency score from 1-10 (10 being most urgent). Propose 1-3 actionable subtasks if the task is complex.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING, description: "Main task title" },
                priority: { type: Type.STRING, description: "High, Medium, or Low" },
                deadline: { type: Type.STRING, description: "Human readable deadline extracted" },
                urgency: { type: Type.NUMBER },
                subtasks: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Suggested subtasks for breaking down the task"
                }
              },
              required: ["id", "title", "priority", "urgency", "subtasks"]
            }
          }
        }
      });
      res.json({ result: JSON.parse(response.text) });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/execute", async (req, res) => {
    try {
       if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured in the Secrets panel.");
       }
       const { task, action } = req.body;
       const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Task: ${task}\nRequested Action: ${action}\nProvide a helpful draft, outline, or actionable advice to immediately help the user complete this task. Format the response nicely.`,
      });
      res.json({ result: response.text });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/schedule", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured in the Secrets panel.");
      }
      const { tasks } = req.body;
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Here are my current tasks: ${JSON.stringify(tasks)}. Please build a logical timeline for today allocating these tasks.`,
        config: {
          systemInstruction: "You are an expert time-management assistant. Given a list of tasks, return a daily schedule grouping them into realistic timeframes (e.g. 9:00 AM - 10:30 AM). Keep it realistic and add brief advice on how to tackle each block. Return an array of blocks.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                timeFrame: { type: Type.STRING, description: "e.g., 09:00 AM - 10:30 AM" },
                taskId: { type: Type.STRING },
                taskTitle: { type: Type.STRING },
                advice: { type: Type.STRING, description: "Short, crisp 1 sentence actionable advice for this block" }
              },
              required: ["timeFrame", "taskId", "taskTitle", "advice"]
            }
          }
        }
      });
      res.json({ result: JSON.parse(response.text) });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
