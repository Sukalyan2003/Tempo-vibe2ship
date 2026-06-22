<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Tempo &mdash; The Proactive Priority Assistant

**Tempo** is a proactive priority companion designed to help people who are overwhelmed, behind, or frozen. Built as an entry for the Google AI Studio hackathon ("Last-Minute Life Saver" problem statement), Tempo focuses on reducing friction and making the "next right action" completely obvious.

## Problem Statement
When everything is overdue and urgent, traditional task lists cause paralysis. Tempo combats this by shrinking vague tasks into unscary, actionable subtasks, auto-escalating priority based on real deadlines, and pro-actively stepping in to help execute drafts so users aren't left staring at a blank page.

## Key Features
- **Multimodal Brain Dump**: Type, talk, or capture an image (like a receipt or whiteboard). Tempo parses it into structured tasks with ISO deadlines and subtasks via `gemini-2.5-flash`.
- **Proactive Execution & Draft Saves**: Let Tempo draft that dreaded email, outline that report, or list those steps right onto the task card. Save drafts back onto the task to instantly revisit them.
- **Background Auto-Escalation & Notifications**: As deadlines approach, Tempo automatically raises urgency, pushes an in-browser notification, and highlights "Needs Attention Now". Tasks can be snoozed or dismissed.
- **Resurface Lingering Work**: Tasks without deadlines that sit untouched for days are gently resurfaced in a dedicated "Lingering" section, preventing them from falling through the cracks forever.
- **Dynamic Eisenhower Matrix**: View your workload prioritized logically into Do First, Schedule, Quick Wins, and Eliminate based on smart urgency algorithms.
- **Algorithmic Daily Planner**: Let Tempo automatically build a realistic chronological schedule for the day out of your active tasks, persisting safely across reloads.
- **Sustainable Focus Mode**: Select a task, hit Focus, and work through its subtasks with an automated timer. Completing a sprint notifies you to take a structured break and increments your daily stats.
- **Insights Dashboard**: A compact view of your momentum—see complete rates, active habits, completed sprints, and tasks done today.

## Powered by Google
- **Gemini Flash (`gemini-2.5-flash`)** processing text and multi-part image base64 payloads behind a secured Express server, utilizing Structured JSON Schema outputs (`@google/genai`).
- API keys stay completely out of the browser.
- Universal `TEMPO_SYSTEM` system instruction enforcing practical time-awareness and grounded execution.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set `GEMINI_API_KEY` in `.env.local` or environment variables.
3. Run the app:
   `npm run build && npm start` Or `npm run dev` for dev mode.

