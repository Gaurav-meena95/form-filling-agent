import os
from dotenv import load_dotenv

# Load environment variables at the very beginning
env_state = os.getenv('ENV_STATE', 'dev')
if env_state == 'prod':
    dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env.production')
else:
    dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env.development')

# Fallback to .env if specific file doesn't exist
if not os.path.exists(dotenv_path):
    dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')

load_dotenv(dotenv_path=dotenv_path)

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
from backend.src.ingestion import store_from_pdf, store_from_manual
from backend.src.rag_retriever import retrieve_and_match, match_stateless
from backend.src.form_filler import save_learned_answer, save_multiple_learned_answers, load_learned_answers
from pydantic import BaseModel
from typing import Optional, Union

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class MatchFieldsRequest(BaseModel):
    fields: list[str]

class LearnRequest(BaseModel):
    field: Optional[str] = None
    value: Optional[str] = None
    data: Optional[dict] = None

class StatelessMatchRequest(BaseModel):
    fields: list[str]
    profile_context: str
    learned_context: str = ""

class RunAgentRequest(BaseModel):
    url: str

@app.get("/")
async def root():
    return {"message": "AutoFill AI API is running", "status": "online"}

@app.get("/learned")
async def get_all_learned():
    """Return all learned answers from backend knowledge base"""
    return load_learned_answers()

@app.get("/browser-status")
async def browser_status():
    """Status endpoint for frontend dashboard"""
    return {
        "is_connected": True,
        "mode": "live",
        "message": "Chrome Extension is the active form filler"
    }

@app.post("/run-agent")
async def run_agent(request: RunAgentRequest):
    """Run agent endpoint for web dashboard"""
    return {
        "status": "completed",
        "message": f"Form URL registered: {request.url}. Open the form in your browser and click 'Magic Fill Form' in the AutoFill AI extension!"
    }

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Process PDF into ChromaDB and extract learned fields
    store_from_pdf(file_path)
    
    return {"message": "Resume uploaded and processed successfully", "filename": file.filename}

@app.post("/manual-profile")
async def manual_profile(data: dict):
    # Process manual profile into ChromaDB and learned_answers
    store_from_manual(data)
    save_multiple_learned_answers(data)
    return {"message": "Manual profile stored and learned successfully"}

@app.post("/match-fields")
async def match_fields(request: MatchFieldsRequest):
    """Query RAG for matching values"""
    try:
        matched = retrieve_and_match(request.fields)
        return {"matched": matched}
    except Exception as e:
        return {"matched": {}, "error": str(e)}

@app.post("/match-fields-stateless")
async def match_fields_stateless(request: StatelessMatchRequest):
    """Stateless matching for production (no DB dependency)"""
    try:
        matched = match_stateless(request.fields, request.profile_context, request.learned_context)
        return {"matched": matched}
    except Exception as e:
        return {"matched": {}, "error": str(e)}

@app.post("/learn")
async def learn_from_user(request: Union[LearnRequest, dict]):
    """Save user correction or multiple learned fields"""
    try:
        if isinstance(request, dict):
            field = request.get("field")
            value = request.get("value")
            data = request.get("data")
        else:
            field = request.field
            value = request.value
            data = request.data
            
        if data and isinstance(data, dict):
            save_multiple_learned_answers(data)
            return {"status": "success", "count": len(data)}
        elif field and value is not None:
            save_learned_answer(field, value)
            return {"status": "success", "field": field}
        return {"status": "ignored", "message": "No valid field or data provided"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
        
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3000))
    uvicorn.run(app, host="0.0.0.0", port=port)