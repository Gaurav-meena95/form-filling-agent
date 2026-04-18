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
    
    # Step 1 - Retrieve relevant info for each field
    retrieved_info = []
    for field in form_fields:
        result = collection.query(
            query_texts=[field],
            n_results=1
        )
        if result.get("documents") and len(result["documents"]) > 0 and result["documents"][0]:
            retrieved_info.append(result["documents"][0][0])
    
    relevant_info = "\n".join(retrieved_info)
    print(f"Retrieved from ChromaDB:\n{relevant_info}")
    
    # Step 2 - LLM matches retrieved info with form fields
    prompt = ChatPromptTemplate.from_template("""
    You are an intelligent form filling assistant helping a job applicant.
    
    Complete user profile from resume:
    {relevant_info}
    
    Form fields to fill:
    {fields}
    
    Instructions:
    - For name, email, phone: extract directly from profile
    - For qualification: include degree, college, grade
    - For experience questions: write 3-4 professional sentences based on their skills and projects
    - For "approach to testing" type questions: write a thoughtful answer based on their background
    - For Yes/No availability: return exactly "Yes"
    - For stipend: return "15000"
    - For notice period: return "Immediate"
    - For file upload fields like "Resume": return null
    - For radio/multiple choice fields you are unsure about: return null
    - Return ONLY a valid JSON object, nothing else
    
    Example:
    {{
      "Full Name": "Gaurav Meena",
      "Do you have experience?": "Yes, I have worked as a Frontend Developer Intern at Gistly AI where I built reusable components and fixed bugs following professional standards.",
      "Expected monthly stipend": "15000",
      "Notice Period": "Immediate",
      "Resume": null
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
    print(f"Matched fields: {matched}")
    
    return matched