import chromadb
from chromadb.utils import embedding_functions
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import os
import json

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

# Connect to existing ChromaDB
_base_dir = os.path.dirname(os.path.abspath(__file__))
client = chromadb.PersistentClient(path=os.path.join(_base_dir, "..", "data", "user_profiles"))
embedding_fn = embedding_functions.DefaultEmbeddingFunction()
collection = client.get_or_create_collection(
    name="user_profile",
    embedding_function=embedding_fn
)

llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.3-70b-versatile"
)

def retrieve_and_match(form_fields: list) -> dict:
    """Retrieve relevant info from ChromaDB and match with form fields using LLM"""
    
    # Step 1 - Retrieve ALL stored profile data
    retrieved_chunks = set()
    
    # 1. Broad query to get ALL stored documents
    all_stored = collection.get()
    all_docs = all_stored.get("documents", [])
    if all_docs:
        # Create a full context from all stored resumes and manual entries
        full_context = "\n\n---\n\n".join([doc for doc in all_docs if doc])
        retrieved_chunks.add(full_context)
            
    # 2. Semantic search for each form field for better accuracy
    for field in form_fields:
        result = collection.query(
            query_texts=[field],
            n_results=3
        )
        if result.get("documents"):
            for doc_list in result["documents"]:
                for doc in doc_list:
                    if doc: retrieved_chunks.add(doc)
    
    relevant_info = "\n".join(list(retrieved_chunks))
    print(f"Retrieved {len(retrieved_chunks)} unique chunks from ChromaDB")
    
    # Step 2 - LLM matches retrieved info with form fields
    prompt = ChatPromptTemplate.from_template("""
    You are an intelligent job application form filling assistant.

    Here is the candidate's complete resume data:
    {relevant_info}

    The form has these fields that need to be filled:
    {fields}

    Instructions:
    - Semantically match each field with the resume data even if names don't match exactly
    - "Contact" = phone number, "University" = college name, "Organization" = company name
    - For experience fields: write professional 3-4 sentence answers based on resume
    - For "Have you built any app" type questions: describe projects from resume
    - For "AI tools" questions: mention LangChain, LangGraph from skills
    - For CTC/salary fields: write "Fresher - Not Applicable" if student
    - For "Notice Period": write "Immediate"  
    - For programming languages: list from skills section
    - For achievements: summarize certifications and hackathons
    - For file upload fields like "Resume" or "Updated Resume": return null
    - Return ONLY a valid JSON object, no extra text

    Example format:
    {{
      "Full Name": "Gaurav Meena",
      "Contact": "+917724014495",
      "University": "Newton School of Technology, Rishihood University",
      "Notice Period": "Immediate",
      "Updated Resume": null
    }}
    """)
    
    chain = prompt | llm
    response = chain.invoke({
        "relevant_info": relevant_info,
        "fields": ", ".join(form_fields)
    })
    
    # Parse JSON safely
    raw = response.content.strip()
    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start == -1 or end == 0:
            print(f"Error: No JSON found in LLM response: {raw}")
            return {}
        data = json.loads(raw[start:end])
    except Exception as e:
        print(f"Failed to parse LLM response as JSON: {e}")
        print(f"Raw response: {raw}")
        return {}
    
    # Remove null values - only keep matched fields
    matched = {k: v for k, v in data.items() if v is not None}
    print(f"Matched {len(matched)} fields successfully.")
    
    return matched