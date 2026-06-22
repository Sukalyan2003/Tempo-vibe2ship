# Prompt & Ideation Log

## Problem Statement Selection
**The Last-Minute Life Saver**
*Challenge:* Build an AI-powered productivity companion that proactively assists users in planning, prioritizing, and completing tasks before deadlines are missed. Moving beyond passive reminders to helping users take meaningful action.

## Ideation & Solution Overview
We want to build a "Task Companion" that acts not just as a to-do list, but as a proactive assistant with strong **agentic depth** (20% evaluation weight). 

**Key Objectives:**
1. **Intelligent Ingestion:** Users drop a chaotic braindump (e.g., "Gotta pay the electricity bill by Friday, finish the biology report for Monday, and call mom sometime this weekend"). The model parses these into structured tasks with clear deadlines, categories, and priority levels.
2. **Proactive Planning & Sub-task Generation:** For larger tasks (e.g., "biology report"), the assistant autonomously breaks them down into smaller milestones (research, draft, review) and schedules them in the available time blocks.
3. **Action Execution:** To differentiate from traditional reminders, the assistant will offer "Action" buttons. For example, if the task is "write report", the assistant can generate a draft or outline using Gemini API.
4. **Context & Urgency View:** A dashboard that highlights what needs attention *right now* based on a calculated urgency score rather than just static due dates.

## Selected Tech Stack & Google Technologies
- **Frontend UI:** React + Tailwind CSS (Mobile-first, clean, literal labeling).
- **Backend/AI:** Express + Vite server handling secure API routing.
- **AI Integration:** `@google/genai` (Gemini API) using Structured Outputs (JSON Schema) to parse natural language into tasks, and prompt-based text generation for action execution (e.g., writing drafts).
- **Potential Extension:** Authentication and Calendar integration via Google Workspace APIs (if time and scope permit).

## Execution Plan
**Phase 1: Foundation (Standard)**
- Set up a full-stack architecture (Express + Vite).
- Build the core data models (Task, Subtask) in memory or client-storage first.

**Phase 2: Agentic Depth (Complex)**
- Implement the "Brain Dump" input powered by Gemini API.
- Implement the "Auto-Breakdown" functionality where Gemini splits complex tasks into actionable steps.
- Add "Execute" actions where Gemini helps complete the task (e.g., summarizing research, drafting emails).
- **Added "Auto-Schedule" feature:** The agent autonomously reviews all active tasks and computes an optimized daily timeline block-by-block. 
- **Action Dashboard Modal Improvements:** Addressed empty states and markdown renderer dependencies (`@tailwindcss/typography`) so execution guides show up nicely.

**Phase 3: Polish & Hackathon Artifacts (Standard)**
- Refine the UX/UI (animations, spacing, empty states).
- Configured **Durable Local Storage** via custom hooks so tasks and habits persist reliably matching "Product completeness" evaluation parameters.
- **Unit Testing:** Added Vitest + React Testing Library, and wrote end-to-end component tests to fulfill the user's "automated test suites" request and boost Technical Implementation marks.
- **Fail-safes for API Keys:** Added rigorous error handling backend + frontend to detect unconfigured API Keys and explain that Gemini API can be used in AI Studio for free without a credit card.
- Compile the Google Doc description required for submission.

## Conclusion for Hackathon Viability
Yes, this project is substantial enough for a hackathon. It tackles the **"Agentic Depth" (20%)** requirement directly (which is the heaviest weighted score) by:
- Autonomous extraction (Braindump vs standard input)
- Autonomous breakdown (Subtasks)
- Proactive generation (Execution steps)
- Algorithmic orchestration (Daily schedule builder)

To improve it further during the hackathon (if time permits):
1. Wire up actual OAuth connection to Google Calendar (so the scheduled items actually map out the user's GCAL).
2. Use Gemini Structured Outputs for Calendar events format schema.

