# InterviewBot — AI-Powered Interview Assistant

**InterviewBot** is a React-based AI-powered interview assistant that simulates a real interview process. It provides:

* **Interviewee Chat (Candidate View):** A chatbot-driven, timed interview session with AI-generated questions.
* **Interviewer Dashboard (Recruiter View):** A centralized panel to track candidate performance, scores, and summaries.

This ensures structured interviews, automated scoring, and a consistent experience for both sides.

---

## 🔑 Features

### 👤 Interviewee (Chat)

* Upload **Resume (PDF/DOCX)**.
* Extracts **Name, Email, Phone** automatically (asks for missing info).
* AI-driven **6-question interview** (2 Easy → 2 Medium → 2 Hard).
* **Timers per question**: Easy (20s), Medium (60s), Hard (120s).
* Auto-submit answers when timer ends.
* AI calculates a **final score** and generates a **short candidate summary**.
* Supports **pause/resume** with a **“Welcome Back” modal**.

### 🧑‍💻 Interviewer (Dashboard)

* View **all candidates ordered by score**.
* Access **chat history, profile details, and AI summary** for each candidate.
* **Search & sort** candidates by name, score, or other fields.
* Fully synced with the candidate chat flow.

---

## 🌍 Live Deployment

Backend (Render): https://interviewbot-5611.onrender.com

## ⚙️ Tech Stack

Frontend: React + Vite + TypeScript

Backend: Node.js + Express

Database: PostgreSQL

Deployment: Render

---

## 🏗️ Implementation Highlights

1. **Resume Parser**: Extracts candidate details from uploaded resumes.
2. **Chat Flow Manager**: Handles interview sequence, timers, and question progression.
3. **Scoring Engine**: AI evaluates responses and generates a performance summary.
4. **Dashboard View**: Lists all candidates with search/sort and detailed logs.
5. **Persistence Layer**: Saves progress locally and restores sessions after reload.

---

## 📊 Results / Benefits

* Recruiters can **compare candidates objectively** with automated scoring.
* Candidates get a **consistent and structured interview experience**.
* System ensures **no lost progress** with local persistence.
* Provides a **scalable solution** for conducting multiple interviews simultaneously.

---

## 📥 Getting Started

### Clone & Install

```bash
git clone https://github.com/sonalm3214/InterviewBot.git
cd InterviewBot
npm install
npm start
```

### Build for Production

```bash
npm run build
```

---

## 🔮 Future Enhancements

* Multi-role interview support (Frontend, Backend, ML, etc.).
* Cloud-based storage for cross-device persistence.
* More detailed feedback reports for candidate improvement.

