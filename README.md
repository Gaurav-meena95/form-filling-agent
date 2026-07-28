# 🤖 AutoFill AI: The Ultimate Form-Filling Agent

AutoFill AI is a production-ready Chrome Extension that automates complex web forms using Agentic AI. No more repetitive typing or context switching—our AI agent understands your background and fills forms with human-like precision.

[Live Demo](https://drive.google.com/file/d/1z9_G9OeqY-JHOL130gmrqb-q1CaoWbPv/view?usp=sharing) • [Live Backend](https://form-filling-agent.onrender.com)

---

## ✨ Features
- **🚀 One-Click AutoFill**: Detects and fills complex forms in seconds.
- **📄 AI Resume Intelligence**: Extracts and learns background information from PDF resumes.
- **🚀 Dual Environment Support**: Easily toggle between **Local Development** (`http://localhost:3000`) and **Production Backend** (`https://form-filling-agent.onrender.com`).
- **🔒 Privacy First**: Profile data and learned answers are stored locally in your browser & isolated storage.
- **🌍 Stateless API**: Scalable FastAPI backend powered by Groq (Llama-3.3-70b-versatile).
- **🎨 Premium UI**: Glassmorphic Chrome Extension popup and React/Vite landing page.

---

## 🚀 Quick Start Guide

### 1. Install the Chrome Extension
1. Download or clone this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **"Developer mode"** (toggle in top right).
4. Click **"Load unpacked"** and select the `extension` folder from this repository.
5. **Pin** AutoFill AI to your browser toolbar!

### 2. Set Up Your Profile & Environment
1. Click the **AutoFill AI** extension icon.
2. Choose your environment at the top:
   - Select **Pro** for cloud backend (`https://form-filling-agent.onrender.com`).
   - Select **Local** if running backend locally (`http://localhost:3000`).
3. Add your context:
   - **Resume Tab**: Click **"Choose PDF File"** to upload your resume.
   - **Profile Tab**: Fill in manual details (Name, Email, Phone, College, Skills, etc.) and click **"Update Profile"**.

### 3. Fill Your First Form
1. Navigate to any web page containing a job application or custom form.
2. Open the extension and click **"Magic Fill Form"**.
3. Watch as the AI detects fields, contextually maps your profile, and populates the form automatically!

---

## 💻 Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js & npm (for frontend)
- [Groq API Key](https://console.groq.com/)

---

### 1. Backend Setup (FastAPI)

```bash
# Navigate to project root directory
cd form-filling-agent

# Create & activate a virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment configuration file
cp .env.development .env
# Ensure GROQ_API_KEY is set inside your .env or .env.development file:
# GROQ_API_KEY=gsk_your_groq_api_key_here

# Start local server (Port 3000)
uvicorn backend.main:app --host 0.0.0.0 --port 3000 --reload
# OR use the helper script:
# bash scripts/start_backend.sh
```

---

### 2. Extension Setup for Local Backend

1. Open extension popup in Chrome.
2. Click the **Local** button under **Environment** at the top.
3. Check status badge shows **`ONLINE (LOCAL)`**.

---

### 3. Frontend Setup (React / Vite Landing Page)

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🛠️ Production Architecture

```
┌────────────────────────────────┐
│   Chrome Extension (Frontend)  │
│ - Content & Popup Scripts      │
│ - Local Chrome Storage         │
│ - Env Selector (Local/Pro)     │
└──────────────┬─────────────────┘
               │ HTTP API Requests
               ▼
┌────────────────────────────────┐
│    FastAPI Backend (Python)    │
│ - Ingestion & ChromaDB RAG     │
│ - Groq (Llama-3.3-70b) LLM     │
│ - Atomic Learned Answers       │
└────────────────────────────────┘
```

- **Backend**: FastAPI, LangChain, Groq LLM (`llama-3.3-70b-versatile`), ChromaDB vector store. Hosted on Render (Docker Runtime).
- **Extension**: Vanilla JavaScript, Manifest V3, HTML5, CSS3 Glassmorphism.
- **Frontend**: React 18, Vite, Tailwind CSS. Hosted on Vercel.

---

## 📄 License & Attribution

Built with ❤️ by [Gaurav Meena](https://github.com/Gaurav-meena95)

