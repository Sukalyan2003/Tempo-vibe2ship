import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const TEMPO_SYSTEM = `You are Tempo — a proactive priority companion. Your job is not to remind people about their lives; it is to help them actually move. People come to you overwhelmed, behind, or frozen. You exist to lower the cost of starting and to make the next right action obvious.

OPERATING PHILOSOPHY
1. Systems over willpower. Never assume motivation. Reduce friction instead. Every task you touch should leave the user with the smallest possible first move — something they could start in under two minutes. Big, vague tasks cause paralysis; your job is to shrink them until they are unscary.
2. One thing at a time. Attention is the scarce resource. When everything feels urgent, identify the single action that matters most right now and make it unmistakable. Protect the user from their own to-do list.
3. Anchor effort to meaning. People act when the stake is real. Where it helps, briefly connect a task to its consequence or payoff so doing it feels worth it — without lecturing or inventing facts.
4. Hold the plan lightly. Plans break; life happens. When deadlines slip, adapt the plan calmly and immediately. Never shame, scold, or guilt. Treat a missed task as new information, not a failure — re-plan and move forward.
5. Be a doer, not a notifier. When asked to help with a task, produce the actual first artifact — a draft, an outline, a checklist, a concrete starting sentence — not advice about how one might begin.
6. Resurface before it's too late. Quietly bring slipping or time-sensitive items back to the surface ahead of the deadline, not after.

HOW YOU COMMUNICATE
- Plain and concrete. Write as if explaining to a smart, stressed friend with no time. Short sentences. No jargon, no hype, no filler like "leverage," "unlock," "supercharge," or emoji clutter.
- Specific over generic. "Open the portal and find your account number" beats "gather your materials." Estimate realistic time when useful.
- Calm and steady. Reassuring, never frantic — even when the task is overdue.
- Honest about limits. If a deadline or detail is ambiguous, infer the most reasonable interpretation and note the assumption in one short phrase. Never fabricate dates, facts, or details you don't have.

GUARDRAILS
- Respect the structured-output schema you are given exactly; return only what is requested, nothing extra.
- Be realistic about time and capacity. Do not pack an impossible day. If the workload exceeds the available time, say so and suggest what to defer.
- Reason about deadlines relative to the current date and time you are given — never to a guessed "today."
- Every recommendation should help the user finish, not just feel organized.`;

let lastWorkingModel: string | null = null;

async function generateWithRetry(ai: GoogleGenAI, params: any, retries = 2) {
  let fallbackModels = [params.model || "gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro", "gemini-1.5-flash", "gemini-1.5-pro"];
  
  if (lastWorkingModel && fallbackModels.includes(lastWorkingModel)) {
    fallbackModels = [lastWorkingModel, ...fallbackModels.filter(m => m !== lastWorkingModel)];
  }
  
  for (let m = 0; m < fallbackModels.length; m++) {
    const currentModel = fallbackModels[m];
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await ai.models.generateContent({ ...params, model: currentModel });
        lastWorkingModel = currentModel;
        return res;
      } catch (error: any) {
        const errMessage = error?.message?.toLowerCase() || "";
        const errStatus = error?.status || error?.error?.status || "";
        const errCode = error?.status || error?.error?.code || error?.code || 0;
        
        const isQuotaOrRateLimit = 
          errStatus === "RESOURCE_EXHAUSTED" || 
          errCode === 429 || 
          errMessage.includes("429") ||
          errMessage.includes("quota") || 
          errMessage.includes("rate limit");
          
        const isTransient = 
          errStatus === "UNAVAILABLE" || 
          errCode === 503 ||
          errMessage.includes("503");
          
        if (isQuotaOrRateLimit) {
          console.warn(`[Model Fallback] Rate limit reached for ${currentModel}. Switching to next model...`);
          if (m === fallbackModels.length - 1) throw error; // No more models
          break; // Break inner retry loop to switch to the NEXT model immediately
        }
        
        if (!isTransient) {
          // If completely unexpected, switch to next model
          if (m === fallbackModels.length - 1) throw error;
          break; 
        }
        
        // It's a 503 transient error, retry the same model with delay
        if (i === retries) {
          if (m === fallbackModels.length - 1) throw error;
          break; 
        }
        console.warn(`Gemini API 503 with model ${currentModel}. Retrying in ${1000 * (i + 1)}ms...`);
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  const taskResponseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        title: { type: Type.STRING, description: "Main task title" },
        priority: { type: Type.STRING, description: "High, Medium, or Low" },
        deadline: { type: Type.STRING, description: "Human readable deadline extracted" },
        dueDate: { type: Type.STRING, description: "ISO 8601 date-time string of the inferred due date" },
        urgency: { type: Type.NUMBER },
        subtasks: {
          type: Type.ARRAY,
          items: { 
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              estimatedMinutes: { type: Type.NUMBER }
            },
            required: ["title", "estimatedMinutes"]
          },
          description: "Suggested subtasks for breaking down the task"
        }
      },
      required: ["id", "title", "priority", "urgency", "subtasks"]
    }
  };

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
      
      const response = await generateWithRetry(ai, {
        model: "gemini-2.5-flash",
        contents: `Today is: ${new Date().toISOString()}.\nPrompt: ${prompt}`,
        config: {
          systemInstruction: Object.values({ TEMPO_SYSTEM, ext: "You are a proactive task assistant. Extract tasks from the user's braindump. Assign a priority (High, Medium, Low), a deadline if applicable (e.g. 'This Friday'), a dueDate (ISO 8601 date string representing the inferred deadline based on the current date), and an urgency score from 1-10 (10 being most urgent). Propose 1-3 actionable subtasks if the task is complex." }).join("\n\n"),
          responseMimeType: "application/json",
          responseSchema: taskResponseSchema as any,
          tools: [{ googleSearch: {} }]
        }
      });
      let citations = [];
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        citations = response.candidates[0].groundingMetadata.groundingChunks.map((c: any) => c.web?.uri).filter(Boolean);
      }
      let parsedResult;
      try {
        parsedResult = JSON.parse(response.text);
      } catch (e) {
        throw new Error("Received malformed JSON from the AI model. Please try again.");
      }
      res.json({ result: parsedResult, citations });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/parse-image", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured in the Secrets panel.");
      }
      const { imagePart, prompt } = req.body;
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
      
      const contents = [
        { text: `Today is: ${new Date().toISOString()}.\nPrompt/Context: ${prompt || "Extract tasks from this image."}` },
        imagePart
      ];
      
      const response = await generateWithRetry(ai, {
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction: Object.values({ TEMPO_SYSTEM, ext: "You are a proactive task assistant. Extract tasks from the user's document or image. Assign a priority (High, Medium, Low), a deadline if applicable, a dueDate (ISO 8601 date string representing the inferred deadline based on the current date), and an urgency score from 1-10 (10 being most urgent). Propose 1-3 actionable subtasks if the task is complex." }).join("\n\n"),
          responseMimeType: "application/json",
          responseSchema: taskResponseSchema as any,
          tools: [{ googleSearch: {} }]
        }
      });
      let citations = [];
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        citations = response.candidates[0].groundingMetadata.groundingChunks.map((c: any) => c.web?.uri).filter(Boolean);
      }
      let parsedResult;
      try {
        parsedResult = JSON.parse(response.text);
      } catch (e) {
        throw new Error("Received malformed JSON from the AI model. Please try again.");
      }
      res.json({ result: parsedResult, citations });
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
      
      const response = await generateWithRetry(ai, {
        model: "gemini-2.5-flash",
        contents: `Today is: ${new Date().toISOString()}.\nTask: ${task}\nRequested Action: ${action}\nProvide a helpful draft, outline, or actionable advice to immediately help the user complete this task. Enrich the response with real-world facts, links, or context. Format the response nicely.`,
        config: {
          systemInstruction: TEMPO_SYSTEM,
          tools: [{ googleSearch: {} }]
        }
      });
      
      let citations: string[] = [];
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        citations = response.candidates[0].groundingMetadata.groundingChunks.map((c: any) => c.web?.uri).filter(Boolean);
      }

      res.json({ result: response.text, citations });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/breakdown", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured in the Secrets panel.");
      }
      const { taskTitle, subtaskTitle } = req.body;
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
      const response = await generateWithRetry(ai, {
        model: "gemini-2.5-flash",
        contents: `Today is: ${new Date().toISOString()}.\nTask: ${taskTitle}\nSubtask: ${subtaskTitle}\nBreak this subtask down into 2-4 smaller, highly actionable steps with time estimates.`,
        config: {
          systemInstruction: TEMPO_SYSTEM,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                estimatedMinutes: { type: Type.NUMBER }
              },
              required: ["title", "estimatedMinutes"]
            }
          }
        }
      });
      let parsedResult;
      try {
        parsedResult = JSON.parse(response.text);
      } catch (e) {
        throw new Error("Received malformed JSON from the AI model. Please try again.");
      }
      res.json({ result: parsedResult });
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
      
      const response = await generateWithRetry(ai, {
        model: "gemini-2.5-flash",
        contents: `Today is: ${new Date().toISOString()}.\nHere are my current tasks: ${JSON.stringify(tasks)}. Please build a logical timeline for today allocating these tasks.`,
        config: {
          systemInstruction: Object.values({ TEMPO_SYSTEM, ext: "You are an expert time-management assistant. Given a list of tasks, return a daily schedule grouping them into realistic timeframes (e.g. 9:00 AM - 10:30 AM). Keep it realistic and add brief advice on how to tackle each block. Return an array of blocks." }).join("\n\n"),
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
      let parsedResult;
      try {
        parsedResult = JSON.parse(response.text);
      } catch (e) {
        throw new Error("Received malformed JSON from the AI model. Please try again.");
      }
      res.json({ result: parsedResult });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/agent", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured in the Secrets panel.");
      }
      const { prompt, tasks } = req.body;
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      
      const response = await generateWithRetry(ai, {
        model: "gemini-2.5-flash",
        contents: `Today is: ${new Date().toISOString()}.\nCurrent Tasks: ${JSON.stringify(tasks)}\n\nUser command: ${prompt}`,
        config: {
          systemInstruction: Object.values({ 
            TEMPO_SYSTEM, 
            ext: "You are the conversational interface for Tempo. Execute user intent via tools. Always explain your planned action or answer the user directly if no tools are needed. Try to use answerQuestion to provide conversational info."
          }).join("\n\n"),
          tools: [{
            functionDeclarations: [
              {
                name: "createTask",
                description: "Create a new task when the user asks.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    priority: { type: Type.STRING, description: "High, Medium, Low" },
                    dueDate: { type: Type.STRING, description: "ISO 8601 or null" }
                  },
                  required: ["title", "priority"]
                }
              },
              {
                name: "rescheduleTask",
                description: "Reschedule an existing task.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    taskId: { type: Type.STRING },
                    newDueDate: { type: Type.STRING, description: "ISO 8601 date-time string corresponding to the new time" }
                  },
                  required: ["taskId", "newDueDate"]
                }
              },
              {
                name: "breakdownTask",
                description: "Break a task down into subtasks.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    taskId: { type: Type.STRING }
                  },
                  required: ["taskId"]
                }
              },
              {
                name: "completeTask",
                description: "Mark a task as complete.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    taskId: { type: Type.STRING }
                  },
                  required: ["taskId"]
                }
              },
              {
                name: "planDay",
                description: "Plan the day automatically."
              },
              {
                name: "answerQuestion",
                description: "Answer a question about the user's workload, or reply conversationally.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    answer: { type: Type.STRING }
                  },
                  required: ["answer"]
                }
              }
            ]
          }]
        }
      });

      // functionCalls on the first candidate
      let functionCalls: any[] = [];
      let text = "";
      if (response.candidates && response.candidates.length > 0) {
        const parts = response.candidates[0].content.parts;
        text = parts.filter((p: any) => p.text).map((p: any) => p.text).join("\n");
        functionCalls = parts.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);
      } else {
        text = response.text || "";
        functionCalls = response.functionCalls || [];
      }
      
      res.json({ result: { functionCalls, text } });
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
