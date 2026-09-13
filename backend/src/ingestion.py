import chromadb
from chromadb.utils import embedding_functions
from pypdf import PdfReader
import os

# Initialize ChromaDB
_base_dir = os.path.dirname(os.path.abspath(__file__))
_db_path = os.path.join(_base_dir, "..", "data", "user_profiles")
os.makedirs(_db_path, exist_ok=True)
client = chromadb.PersistentClient(path=_db_path)
embedding_fn = embedding_functions.DefaultEmbeddingFunction()
collection = client.get_or_create_collection(
    name="user_profile",
    embedding_function=embedding_fn
)

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from backend.src.form_filler import save_multiple_learned_answers
import json

def get_llm():
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    try:
        return ChatGroq(api_key=api_key, model=model, temperature=0.1)
    except Exception:
        return ChatGroq(api_key=api_key, model="openai/gpt-oss-20b", temperature=0.1)

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract all text from a PDF file"""
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

def extract_kv_from_text(text: str) -> dict:
    """Use LLM to extract key-value pairs from resume text"""
    prompt = ChatPromptTemplate.from_template("""
    Extract key information from the following resume text as a JSON object.
    Focus on common form fields like Full Name, Email, Phone, Current City, GitHub, LinkedIn, Portfolio, College, Degree, Graduation Year, Skills, and Experience Summary.
    
    Rules:
    - Use clear, short keys (e.g., "Full Name", "Email", "Phone", "Current City", "GitHub", "LinkedIn", "Skills")
    - If a field is not found, do not include it.
    - Return ONLY valid JSON.
    
    Resume Text:
    {text}
    """)
    
    try:
        llm_instance = get_llm()
        chain = prompt | llm_instance
        response = chain.invoke({"text": text[:8000]})
        raw = response.content.strip()
        if "```" in raw:
            lines = raw.splitlines()
            filtered = [l for l in lines if not l.strip().startswith("```")]
            raw = "\n".join(filtered).strip()
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(raw[start:end])
        return {}
    except Exception as e:
        print(f"Error extracting KV from PDF: {e}")
        return {}

def store_from_pdf(pdf_path: str):
    """Extract text from PDF and ADD to existing ChromaDB AND learned_answers.json"""
    print(f"Reading PDF: {pdf_path}")
    text = extract_text_from_pdf(pdf_path)
    
    # 1. Store full text in ChromaDB
    import time
    file_id = f"resume_{os.path.basename(pdf_path)}_{int(time.time())}"
    collection.add(
        documents=[text],
        ids=[file_id],
        metadatas=[{"source": "pdf", "filename": os.path.basename(pdf_path)}]
    )
    print(f"PDF content added to ChromaDB.")

    # 2. Extract and Store Key-Value pairs in JSON
    print("Extracting Key-Value pairs for learned_answers.json...")
    kv_data = extract_kv_from_text(text)
    if kv_data:
        save_multiple_learned_answers(kv_data)
        print(f"Extracted and saved {len(kv_data)} fields from PDF.")

def store_from_manual(profile_data: dict):
    """Store manually typed user profile in ChromaDB and learned_answers.json"""
    import time
    documents = []
    ids = []
    metadatas = []

    timestamp = int(time.time())
    for key, value in profile_data.items():
        if value:
            documents.append(f"{key}: {value}")
            ids.append(f"{key.lower().replace(' ', '_')}_{timestamp}")
            metadatas.append({"field": key, "value": str(value)})

    # DON'T delete existing data - just add new entries
    if documents:
        collection.add(
            documents=documents,
            ids=ids,
            metadatas=metadatas
        )
    
    # Save to learned answers for auto-fill learning
    if profile_data:
        save_multiple_learned_answers(profile_data)
    print(f"Manual profile added and learned! Total documents: {collection.count()}")

if __name__ == "__main__":
    # Test with manual data
    profile = {
        "Full Name": "Gaurav Meena",
        "Email": "gaurav@example.com",
        "City": "Sonipat",
        "Phone": "9876543210",
        "College": "MDU Rohtak",
        "Year": "2nd Year",
        "Branch": "Computer Science"
    }
    store_from_manual(profile)