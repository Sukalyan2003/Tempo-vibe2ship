# Hackathon Submission: Tempo - The Proactive Priority Assistant

**Problem Statement Selected:** The Last-Minute Life Saver

## 1. Concept & Ideation
The challenge presented was clear: to build an AI-powered productivity companion that proactively assists users in planning, prioritizing, and completing tasks before deadlines are missed. 

We realized that traditional to-do lists fail because they rely entirely on the user's executive function. Users have to manually categorize, date, and schedule tasks, which often becomes a chore in itself. 

**Our Solution - Tempo:** 
Tempo abstracts away the administrative burden of task management using the reasoning power of the **Gemini 3.5 Flash** model. It features a chaotic "Brain Dump" where users can speak or type their rambling thoughts. Tempo acts as a deeply agentic companion that transforms this unstructured data into a structured system, complete with urgency scores, auto-generated subtasks, immersive focus modes, and dynamic daily schedules.

## 2. Key Features & Agentic Depth

Tempo directly addresses the "Agentic Depth" requirement (20% evaluation weight) through the following autonomous mechanisms:

### A. Intelligent Braindump & NLP Ingestion
- **How it works:** Users use the **Voice Input** or text field to pour out everything on their mind (e.g., "I gotta email Sarah by noon and also buy dog food sometime today"). 
- **The Agent:** A backend Express endpoint uses `@google/genai` with **Structured JSON Outputs** to extract task titles, assign explicit priorities (Low/Medium/High), compute a smart Urgency Score out of 10, and identify human-readable deadlines.

### B. Auto-Breakdown of Complex Assignments
- **How it works:** Overwhelming tasks often cause procrastination. 
- **The Agent:** During the parsing phase, Gemini automatically generates 1-3 actionable, bite-sized subtasks for any complex item, reducing the barrier to getting started.

### C. Proactive Execution Engine
- **How it works:** A "Proactive Execute" button lives on every task. 
- **The Agent:** Clicking it triggers an autonomous workflow where Gemini immediately begins working on the task. For example, if the task is "Write Biology Report," the agent will draft an outline or introductory paragraph, returning it in a clean Markdown-rendered modal. This is the difference between *reminding* a user and *helping* them.

### D. Algorithmic Daily Planner
- **How it works:** A dedicated "Auto-plan day" capability.
- **The Agent:** Tempo takes the user's active tasks, feeds them to Gemini as context, and generates a logical chronological timeline for the day (e.g., "09:00 AM - 10:30 AM"). It provides realistic time constraints and a sentence of specialized advice on tackling the block efficiently.

### E. Immersive Focus Mode (Zero Distraction)
- **How it works:** A full-screen Pomodoro-style timer (25 minutes) that strips away the rest of the application UI. It features a large countdown, a checklist of subtasks, and a one-click completion trigger to keep the user deeply locked into singular execution.

## 3. Product Experience & Design
- **Mental Load Reduction:** The UI groups tasks intelligently by Urgency Score and Priority, automatically promoting critical imminent tasks (Urgency >= 7) to the top of the queue with clear visual distinction (Red vs Indigo badges).
- **Gamification & Habits:** Features a durable Habit Tracker with "streaks", along with a visual Productivity Score that promotes achieving "Inbox Zero."
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

## 5. Evaluation Matrix Alignment
1. **Problem Solving (20%):** Proves that productivity tools can take action (Proactive Execute) rather than just send notifications.
2. **Agentic Depth (20%):** Extensive use of Gemini structured objects, array generation, and dynamic planning schemas.
3. **Usage of Google Technologies (15%):** Deployed live via Google AI Studio's infrastructure and deeply leverages the Gemini API.
4. **Product Experience (10%):** Crisp, minimalist UI adhering to "Literal Labelling" rules preventing "AI-slop" clutter.
5. **Technical Implementation (10%) & Completeness (5%):** A full-stack Typescript application with testing suites, durable local storage hooks, and backend proxy routing.

## 6. Future Roadmap
- **Calendar Bi-directional Sync:** Connect Google Workspace APIs (`set_up_oauth`) to physically insert the Gemini-generated blocks into the user's actual Google Calendar.
- **Context-Aware Notifications:** Service workers to trigger browser-level pings when urgency thresholds are crossed.
