# 🤖 AutoFill AI: The Ultimate Form-Filling Agent

AutoFill AI is a production-ready Chrome Extension that automates complex web forms using Agentic AI. No more repetitive typing or context switching—our AI agent understands your background and fills forms with human-like precision.

**Live Backend:** `https://form-filling-agent.onrender.com`

---

## ✨ Features
- **🚀 One-Click AutoFill**: Detects and fills complex forms in seconds.
- **📄 AI Resume Intelligence**: Learns from your PDF resume and profile.
- **🔒 Privacy First**: Your profile data is stored locally in your browser.
- **🌍 Stateless API**: Scalable backend hosted on Render for global access.
- **🎨 Premium UI**: Modern glassmorphism dashboard and extension popup.

---

## 🚀 Quick Start Guide

### 1. Install the Chrome Extension
Since we are in developer mode, follow these steps:
1. **Download** or Clone this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **"Developer mode"** (top right).
4. Click **"Load unpacked"** and select the `extension` folder from this repo.
5. **Pin** AutoFill AI for easy access!

### 2. Set Up Your Profile
1. Click the AutoFill AI icon in your toolbar.
2. Go to the **Profile** tab.
3. Upload your **Resume (PDF)** or fill in your details manually.
4. Hit **Save Profile**. Your data is now saved locally and ready to use.

### 3. Fill Your First Form
1. Navigate to any job application or web form.
2. Open the extension and click **"Fill This Form"**.
3. Watch as the AI detects fields, matches your data, and populates the form instantly.

---

## 🛠️ Production Architecture

### **Backend (Python/FastAPI)**
- **Hosted on**: Render (Docker Runtime)
- **AI Model**: Groq (Llama-3.3-70b-versatile)
- **Logic**: Stateless matching—accepts user context per request for infinite scalability and privacy.

### **Frontend (React/Vite)**
- **Design**: Premium SaaS Landing Page with animations.
- **Purpose**: Directs users on how to install and use the extension.

---

## 💻 Local Development
If you want to run the backend locally:
```bash
# Install dependencies
pip install -r requirements.txt

# Start local server
uvicorn backend.main:app --host 0.0.0.0 --port 3000
```
Then, update the **Backend URL** in the extension's **Settings** tab to `http://localhost:3000`.

---

Built with ❤️ by [Gaurav Meena](https://github.com/Gaurav-meena95)
