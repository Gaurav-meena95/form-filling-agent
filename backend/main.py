from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from backend.src.ingestion import store_from_pdf, store_from_manual
from backend.src.agent import build_agent
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

from contextlib import asynccontextmanager
from backend.src.browser_manager import BrowserManager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize browser
    await BrowserManager.get_instance()
    yield
    # Shutdown: Close browser
    manager = await BrowserManager.get_instance()
    await manager.close()

app = FastAPI(lifespan=lifespan)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class AgentRequest(BaseModel):
    url: str

@app.get("/")
async def root():
    return {"message": "Form Filling Agent API is running"}

@app.get("/browser-status")
async def browser_status():
    print("DEBUG: /browser-status endpoint hit")
    manager = await BrowserManager.get_instance()
    return {
        "is_connected": manager.is_connected,
        "mode": "live" if manager.is_connected else "isolated"
    }

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Process PDF into ChromaDB
    store_from_pdf(file_path)
    
    return {"message": "Resume uploaded and processed successfully", "filename": file.filename}

@app.post("/manual-profile")
async def manual_profile(data: dict):
    # Process manual JSON data into ChromaDB
    store_from_manual(data)
    return {"message": "Manual profile stored successfully"}

@app.post("/run-agent")
async def run_agent(request: AgentRequest):
    try:
        print(f"Received request to run agent for URL: {request.url}")
        agent = build_agent()
        
        initial_state = {
            "form_url": request.url,
            "detected_fields": [],
            "matched_data": {},
            "status": "starting",
            "page": None
        }
        
        # Run agent flow
        result = await agent.ainvoke(initial_state)
        return {"status": result["status"], "message": "Agent finished execution"}
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"CRITICAL ERROR in run_agent:\n{error_detail}")
        return {"status": "error", "message": f"Agent failed: {str(e)}", "detail": error_detail}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3000))
    uvicorn.run(app, host="0.0.0.0", port=port)