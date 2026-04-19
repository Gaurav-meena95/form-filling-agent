# 🤖 AutoFill AI Agent

AutoFill AI is a next-generation form automation assistant that uses Agentic AI to fill complex web forms in seconds. It combines the power of **LangGraph**, **Playwright**, and **RAG (Retrieval-Augmented Generation)** to understand your profile and apply it to any form.

## ❓ Why AutoFill AI? (The Problem)

Filling out job applications, government forms, or surveys is often a soul-crushing experience. 
- **Repetitive Entry**: Typing your name, email, and experience for the 100th time.
- **Context Switching**: Endless copying and pasting from your resume or LinkedIn profile.
- **Complexity**: Forms with dynamic fields or multi-paged layouts that static autofills can't handle.

## 💡 The Solution

AutoFill AI turns your browser into an intelligent agent. Instead of a simple "copy-paste" tool, it uses a **Large Language Model (LLM)** to:
1. **Understand your profile**: It analyzes your PDF resume and stores it in a searchable local database.
2. **Read any form**: It scans the web page, identifies required fields (even non-standard ones), and understands their context.
3. **Execute Precisely**: It fills the fields, selects dropdowns, and handles checkboxes with human-like precision.

## ⚙️ How It Works

The magic happens in a three-stage pipeline:

1. **Ingestion (RAG)**: When you upload a resume, the system parses the text and creates embeddings stored in **ChromaDB**. This allows the agent to "retrieve" the most relevant part of your experience for any specific form field.
2. **Reasoning (LangGraph)**: We use a state-aware AI flow. The agent doesn't just guess; it checks the page, detects field types, matches them with your data, and plans its next move.
3. **Action (Playwright)**: The agent controls a real browser instance. It can connect to your **existing Chrome session**, meaning it works even behind logins like LinkedIn, Greenhouse, or Workday.




## ✨ Features

- **📄 Smart Ingestion**: Upload your PDF resume once, and the agent learns everything about you.
- **🧠 LangGraph Brain**: Uses structured AI flows to detect fields, match data, and fill forms precisely.
- **🌐 Live Browser Integration**: Connect directly to your existing Chrome session to reuse your logins and cookies.
- **💾 Local First**: Your data stays on your machine in a local ChromaDB vector store.
- **⚡ Lightning Fast**: Fill 50+ fields in under 10 seconds.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: FastAPI, Playwright (Automation), LangGraph (AI Workflow).
- **AI/ML**: Groq LLM (Llama 3), ChromaDB (Vector Store), LangChain.

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js & npm

### 2. Setup Backend (Local)
The backend manages the browser automation and AI logic.

```bash
# Clone the repository
git clone https://github.com/Gaurav-meena95/form-filling-agent.git
cd form-filling-agent

# Set up virtual environment
python -m venv venv
source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt
playwright install chromium

# Start the backend server
uvicorn backend.main:app --host 0.0.0.0 --port 3000
```

### 3. Setup Frontend
The frontend provides the dashboard for managing your profile and running the agent.

```bash
cd frontend
npm install
npm run dev
```

## 🔒 Live Session Mode (Recommended)

To allow the agent to fill forms using your **actual Google/LinkedIn/Workday accounts** (without re-logging), start your Chrome browser with remote debugging enabled:

**On Mac:**
```bash
open -a "Google Chrome" --args --remote-debugging-port=9222
```

The agent will detect this window and show a **"LIVE SESSION"** badge in the dashboard.

## 📝 Usage

1. **Profile Setup**: Upload your resume (PDF) in the "Resume Upload" section or fill in details manually. This information is stored securely in your local vector database.
2. **Launch Browser (Optional)**: If you want to use your logged-in accounts (LinkedIn, Indeed, etc.), start Chrome with remote debugging (see [Live Session Mode](#-live-session-mode-recommended)).
3. **Trigger Agent**: Enter the URL of the form you want to fill and click **"Start Form Filling"**.
4. **Watch & Verify**: The agent will navigate to the page, detect the fields, and fill them. You can review and submit the form manually once it's done.

---

Built with ❤️ by [Gaurav Meena](https://github.com/Gaurav-meena95)
