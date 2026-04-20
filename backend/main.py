from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from backend.src.ingestion import store_from_pdf, store_from_manual
from backend.src.rag_retriever import retrieve_and_match
from backend.src.form_filler import save_learned_answer
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

app = FastAPI()

# Enable CORS for frontend and extension
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
    field: str
    value: str

@app.get("/")
async def root():
    return {"message": "AutoFill AI API is running"}

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

@app.post("/match-fields")
async def match_fields(request: MatchFieldsRequest):
    """Query RAG to match values for detected fields"""
    try:
        matched = retrieve_and_match(request.fields)
        return {"matched": matched}
    except Exception as e:
        return {"matched": {}, "error": str(e)}

@app.post("/learn")
async def learn_from_user(request: LearnRequest):
    """Save user-filled value for future use"""
    try:
        save_learned_answer(request.field, request.value)
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
        
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3000))
    uvicorn.run(app, host="0.0.0.0", port=port)