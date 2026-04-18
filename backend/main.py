from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from src.ingestion import store_from_pdf
from src.agent import build_agent
from pydantic import BaseModel

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class AgentRequest(BaseModel):
    url: str

@app.get("/")
async def root():
    return {"message": "Form Filling Agent API is running"}

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Process PDF into ChromaDB
    store_from_pdf(file_path)
    
    return {"message": "Resume uploaded and processed successfully", "filename": file.filename}

@app.post("/run-agent")
async def run_agent(request: AgentRequest):
    agent = build_agent()
    
    initial_state = {
        "form_url": request.url,
        "detected_fields": [],
        "matched_data": {},
        "status": "starting"
    }
    
    # Run agent flow
    result = agent.invoke(initial_state)
    
    return {"status": result["status"], "message": "Agent finished execution"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)