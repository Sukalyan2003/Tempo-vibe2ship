# Hackathon Submission: Tempo - The Proactive Priority Assistant

**Problem Statement Selected:** The Last-Minute Life Saver

## 1. Concept & Ideation
The challenge presented was clear: to build an AI-powered productivity companion that proactively assists users in planning, prioritizing, and completing tasks before deadlines are missed. 

We realized that traditional to-do lists fail because they rely entirely on the user's executive function. Users have to manually categorize, date, and schedule tasks, which often becomes a chore in itself. 

**Our Solution - Tempo:** 
Tempo abstracts away the administrative burden of task management using the reasoning power of the **Gemini 2.5 Flash** model. It features a chaotic "Brain Dump" where users can speak or type their rambling thoughts. Tempo doesn't just store tasks — it acts on them: scoring urgency, generating subtasks, drafting first steps, escalating what's slipping, and building a daily plan. Its design principle is bounded agency — it does real work on your behalf while keeping you in control of anything consequential.

## 2. Key Features & How Tempo Acts

Tempo moves beyond passive reminders by taking action at each stage of getting something done — capture, prioritize, break down, execute, and follow through — without ever acting behind the user's back:

### A. Intelligent Braindump & Multimodal Ingestion
- **How it works:** Users can speak, type their rambling thoughts, or upload an image (e.g., a photo of a syllabus or a receipt). 
- **What it does:** A backend Express endpoint uses `@google/genai` (handling both text and base64 images) with **Structured JSON Outputs** to extract task titles, assign explicit priorities (Low/Medium/High), compute a smart Urgency Score out of 10, and identify ISO 8601 deadlines.

### B. Auto-Escalation, "Snooze," & True Proactivity
- **How it works:** Time is constantly monitored.
- **What it does:** As deadlines approach, Tempo automatically escalates task urgency in the background, triggers a "Needs Attention Now" banner, and dispatches native browser notifications for tasks that become at-risk or overdue—preventing last-minute disasters without spamming the user. Users can proactively "Snooze" (e.g. 1 hour) or "Dismiss" these escalations.

### C. Resurfacing Lingering Work
- **How it works:** Untouched, undated work normally dies on traditional to-do lists.
- **What it does:** Tempo automatically tags metadata (`createdAt`, `lastTouched`) and gently surfaces stale items in a dedicated "Lingering" section, asking an empathetic question ("This has been sitting a while — still relevant?").

### D. Auto-Breakdown of Complex Assignments
- **How it works:** Overwhelming tasks often cause procrastination. 
- **What it does:** During the parsing phase, Gemini automatically generates actionable, bite-sized subtasks with estimated time completions. Users can recursively "break down further" if a subtask is still too large.

### E. Proactive Execution Engine & Draft Persistence
- **How it works:** A "Proactive Execute" button lives on every task. 
- **What it does:** Clicking it has Gemini draft the actual deliverable — an email, an outline, a quick-start guide — so the user starts from something concrete instead of a blank page. This is the core difference between reminding and helping. 
- **Persistence:** Generated drafts can be seamlessly saved back onto the task card and reopened instantly without re-prompting the model, closing the gap from "suggestion" to "action".

### F. Algorithmic Daily Planner
- **How it works:** A dedicated "Auto-plan day" capability.
- **What it does:** Tempo takes the user's active tasks, feeds them to Gemini as context, and generates a logical chronological timeline for the day (e.g., "09:00 AM - 10:30 AM"). It provides realistic time constraints and a sentence of specialized advice on tackling the block efficiently. The schedule is saved to local storage to survive browser reloads.

### G. Dynamic Eisenhower Matrix & Workload Management
- **How it works:** A secondary layout option categorizes tasks into Do First, Schedule, Quick Wins, and Eliminate.
- **What it does:** Tasks are routed into these quadrants based on a combination of their algorithmic Urgency Score and explicitly assigned Priority properties.

### H. Smart Focus Mode & Sustainable Sprints
- **How it works:** A full-screen immersive timer that strips away the rest of the application UI. 
- **What it does:** The timer automatically sets its duration not to a generic 25 minutes, but logically to the estimated completion time of the specific subtask you are focusing on. Checking off a subtask rolls to the next silently. Completing a sprint suggests a healthy break, increments a daily sprint counter, and fires a native desktop notification to encourage sustainable velocity.

## 3. Product Experience & Design
- **Mental Load Reduction:** The UI groups tasks intelligently by Urgency Score and Priority, automatically promoting critical imminent tasks (Urgency >= 7) to the top of the queue with clear visual distinction (Red vs Indigo badges).
- **Gamification & Insights:** Features a durable Habit Tracker with "streaks", along with a compact Insights Dashboard detailing completed tasks, sprint counts, active habits, and a visual Productivity Score that promotes achieving "Inbox Zero."
- **Data Persistence:** Utilizing custom React Hooks, the entire application leverages `localStorage` to completely persist the user's tasks, schedule state, and habits securely inside their client browser session without requiring database setup.

## 4. Technical Implementation & Architecture

**Frontend:**
- **Framework:** React 19 + TypeScript + Vite.
- **Styling:** Tailwind CSS V4 for a fluid, responsive, clean design. Implemented `@tailwindcss/typography` to elegantly format Gemini's execution drafts.
- **Testing Capabilities:** Integrated `Vitest` and `@testing-library/react`. End-to-end component testing is configured to guarantee robustness.

**Backend & APIs:**
- **Framework:** Express.js + Vite Server Middleware.
- **Google AI Studio Integration:** Uses the `@google/genai` TypeScript SDK. The server securely proxies all prompts so that the user's `GEMINI_API_KEY` is completely hidden from network tabs and browsers. 
- **Fail-Safes:** Includes robust error handling to inform the user gracefully if their AI Studio sandbox secrets are missing.

## 5. Why It Matters

Tempo's bet is that productivity tools fail when they stop at reminding. Every part of Tempo is built to reduce the cost of starting and to carry a task toward done: it turns a chaotic brain-dump into a prioritized plan, drafts the work itself, and proactively resurfaces what's slipping — escalating urgency and re-planning as deadlines move, always with the user in control. It is a single-screen, zero-setup companion that takes meaningful action, not just notifications.

## 6. Future Roadmap
- **Conversational agent (Gemini function calling):** a natural-language command layer that creates, reschedules, and breaks down tasks through tool-calls — turning today's button-driven actions into a single "tell Tempo what you need" interface.
- **Calendar Bi-directional Sync:** Connect Google Workspace APIs (`set_up_oauth`) to physically insert the Gemini-generated blocks into the user's actual Google Calendar.
- **Context-Aware Notifications:** Service workers to trigger browser-level pings when urgency thresholds are crossed.
