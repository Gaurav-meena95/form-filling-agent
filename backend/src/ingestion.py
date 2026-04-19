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

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract all text from a PDF file"""
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

def store_from_pdf(pdf_path: str):
    """Extract text from PDF and ADD to existing ChromaDB - never delete old data"""
    print(f"Reading PDF: {pdf_path}")
    text = extract_text_from_pdf(pdf_path)
    
    # Generate unique ID based on filename and timestamp
    import time
    file_id = f"resume_{os.path.basename(pdf_path)}_{int(time.time())}"
    
    # DON'T delete existing data - just add new resume
    collection.add(
        documents=[text],
        ids=[file_id],
        metadatas=[{"source": "pdf", "filename": os.path.basename(pdf_path)}]
    )
    print(f"PDF content added to ChromaDB! Total documents: {collection.count()}")

def store_from_manual(profile_data: dict):
    """Store manually typed user profile in ChromaDB - never delete old data"""
    import time
    documents = []
    ids = []
    metadatas = []

    timestamp = int(time.time())
    for key, value in profile_data.items():
        documents.append(f"{key}: {value}")
        ids.append(f"{key.lower().replace(' ', '_')}_{timestamp}")
        metadatas.append({"field": key, "value": value})

    # DON'T delete existing data - just add new entries
    collection.add(
        documents=documents,
        ids=ids,
        metadatas=metadatas
    )
    print(f"Manual profile added! Total documents: {collection.count()}")

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