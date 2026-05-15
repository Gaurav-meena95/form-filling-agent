import chromadb
# pyrefly: ignore [missing-import]
from chromadb.utils import embedding_functions
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import os
import json
from backend.src.form_filler import load_learned_answers

# Load environment variables
dotenv_paths = [
    os.path.join(os.path.dirname(__file__), '..', '..', '.env.development'),
    os.path.join(os.path.dirname(__file__), '..', '..', '.env.production'),
    os.path.join(os.path.dirname(__file__), '..', '..', '.env')
]
for path in dotenv_paths:
    if os.path.exists(path):
        load_dotenv(dotenv_path=path)
        break

# Database connection
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
    """Retrieve info from ChromaDB and match with form fields using LLM"""
    
    retrieved_chunks = set()
    
    # 1. Fetch all stored docs
    all_stored = collection.get()
    all_docs = all_stored.get("documents", [])
    if all_docs:
        # Create a full context from all stored resumes and manual entries
        full_context = "\n\n---\n\n".join([doc for doc in all_docs if doc])
        retrieved_chunks.add(full_context)
            
    # 2. Semantic search for specific fields
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
    
    # 3. Add Learned Answers (Prioritized)
    learned = load_learned_answers()
    learned_context = ""
    if learned:
        learned_context = "\n\n### USER'S PREVIOUSLY CORRECTED ANSWERS (HIGH PRIORITY):\n"
        for field, val in learned.items():
            learned_context += f"- {field}: {val}\n"
    
    final_context = relevant_info + learned_context
    print(f"Retrieved {len(retrieved_chunks)} unique chunks and {len(learned)} learned answers.")
    
    # Step 2 - LLM matches retrieved info with form fields
    prompt = ChatPromptTemplate.from_template("""
    You are an intelligent job application assistant filling a form for the candidate.

    Complete candidate profile:
    {relevant_info}

    Form fields to fill:
    {fields}

    Field mapping rules (apply these strictly):
    - "Current City" or "City" = extract city from address/location in resume
    - "Current role title" or "Role" = most recent job title from internships
    - "Total years of experience" = count from internship dates, return NUMBER ONLY (e.g. "1")
    - "Years of experience with NodeJS" = check skills, if not mentioned return "0"  
    - "Expected annual CTC" or "Expected CTC" = "8-12 LPA" for freshers
    - "Link to resume" or "Resume link" = null (cannot provide)
    - "LinkedIn profile" or "LinkedIn" = extract LinkedIn URL if present in resume
    - "Makes you right fit" = write 3-4 sentences about relevant skills and projects
    - "AI agents experience" = mention LangChain, LangGraph projects specifically
    - "How quickly can you join" or "Notice period" = "Immediate"
    - "Referred by" = null
    - "Applied previously" = "No"
    - "Additional notes" = null
    - "Remote setup" = "Very comfortable"
    - For radio button options like "Very comfortable (Remote preference)" = return null, handle separately
    - For YES/NO questions about previous application = "No"

    Return ONLY valid JSON, no extra text.
    Example:
    {{
      "Full Name": "Gaurav Meena",
      "Current City": "Sonipat",
      "Current role title": "Web Developer Intern",
      "Total years of experience": "1",
      "Years of experience with NodeJS": "1",
      "Expected annual CTC": "8-12",
      "Makes you right fit": "I am a full-stack developer...",
      "How quickly can you join": "Immediate",
      "Applied previously": "No"
    }}
    """)
    
    chain = prompt | llm
    response = chain.invoke({
        "relevant_info": final_context,
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
        print(f"Failed to parse LLM response: {e}")
        return {}
    
    # Remove null values - only keep matched fields
    matched = {k: v for k, v in data.items() if v is not None}
    print(f"Matched {len(matched)} fields successfully.")
    
    return matched

def match_stateless(form_fields: list, profile_context: str, learned_context: str = "") -> dict:
    """Stateless matching for production use, but including local DB if available"""
    
    # 1. Start with Profile Context from Extension (Truncated to avoid token overflow)
    if len(profile_context) > 2000:
        profile_context = profile_context[:2000] + "..."
    retrieved_chunks = [f"Manual Profile Data: {profile_context}"]
    
    # 2. Try to get data from ChromaDB (if any resume was uploaded)
    try:
        all_stored = collection.get()
        all_docs = all_stored.get("documents", [])
        if all_docs:
            # ONLY TAKE THE LAST DOCUMENT to prevent token limit errors
            latest_doc = all_docs[-1]
            # Cap the length to roughly 3000 words to be safe
            if len(latest_doc) > 10000:
                latest_doc = latest_doc[:10000] + "..."
            retrieved_chunks.append(f"Resume Data: {latest_doc}")
    except Exception as e:
        print(f"ChromaDB not available in stateless match: {e}")

    # 3. Load backend's learned answers
    backend_learned = load_learned_answers()
    backend_learned_str = ""
    if backend_learned:
        backend_learned_str = "\n".join([f"- {f}: {v}" for f, v in backend_learned.items()])
        if len(backend_learned_str) > 5000:
            backend_learned_str = backend_learned_str[:5000] + "..."

    final_context = "\n".join(retrieved_chunks)
    
    # Truncate frontend learned context if it's too large
    if len(learned_context) > 5000:
        learned_context = learned_context[:5000] + "..."    
    if backend_learned_str or learned_context:
        final_context += "\n\n### USER'S PREVIOUSLY CORRECTED ANSWERS (HIGH PRIORITY):\n"
        if backend_learned_str:
            final_context += backend_learned_str + "\n"
        if learned_context:
            final_context += learned_context

    prompt = ChatPromptTemplate.from_template("""
    You are an expert job application assistant. Your task is to match the candidate's profile with the provided form fields.
    Be extremely intelligent and flexible. Labels might have numbers (e.g. "1. Name"), extra text (e.g. "Full Name (as per adhaar)"), or different casing.

    CONTEXT:
    {relevant_info}

    FIELDS TO FILL:
    {fields}

    STRICT MATCHING RULES:
    1. You MUST use the EXACT field names provided in the "FIELDS TO FILL" list as the keys in your JSON response. Do not shorten or clean the keys.
    2. The JSON MUST BE FLAT. Do not use nested objects or categories. Every key must be at the root level.
    3. If you see "Name" or "Full Name" or "Given Name" in a messy field string, use the candidate's full name.
    4. If you see "City" or "Location", extract the city from the address.
    5. For "CTC", "Salary", or "Expectations", if not specified, use "8-12 LPA".
    6. For "GitHub", "LinkedIn", "Portfolio", extract the exact URL.
    7. For multiline text/essays, write a professional 3-4 sentence paragraph.
    8. If the context has a "PREVIOUSLY CORRECTED ANSWER" for a similar field, ALWAYS use it.
    9. If you are 70% sure about a match, PROVIDE IT. Do not be overly cautious.
    10. If no data is found at all, return null for that exact key.

    Return ONLY a FLAT, valid JSON object with keys matching the input EXACTLY.
    """)
    
    # Check for API Key
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("ERROR: GROQ_API_KEY is missing! Cannot proceed.")
        return {}

    # Debug: Print the context being sent to AI
    print(f"\n--- DEBUG: AI CONTEXT LENGTHS ---")
    print(f"Profile Context len: {len(profile_context)}")
    print(f"Resume Data len (chunks): {len(''.join(retrieved_chunks))}")
    print(f"Backend Learned len: {len(backend_learned_str)}")
    print(f"Frontend Learned len: {len(learned_context)}")
    print(f"Total Context len: {len(final_context)}")
    print(f"---------------------------------\n")
    print(f"Fields to match: {form_fields}")
    print("--- DEBUG: CALLING AI NOW (Waiting for Groq)... ---")

    try:
        chain = prompt | llm
        response = chain.invoke({
            "relevant_info": final_context,
            "fields": ", ".join(form_fields)
        })
        
        print("--- DEBUG: AI RESPONDED! ---")
        raw = response.content.strip()
        print(f"--- DEBUG: AI RAW RESPONSE ---\n{raw}\n------------------------------")

        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start == -1 or end == 0:
            print("No JSON found in AI response.")
            return {}
        
        data = json.loads(raw[start:end])
        
        # Flatten nested JSON just in case LLM disobeys rules
        def extract_flat_kv(d):
            flat = {}
            if isinstance(d, dict):
                for k, v in d.items():
                    if isinstance(v, dict):
                        flat.update(extract_flat_kv(v))
                    else:
                        flat[k] = v
            return flat
            
        flat_data = extract_flat_kv(data)
        matched = {k: v for k, v in flat_data.items() if v is not None}
        print(f"Successfully matched {len(matched)} fields.")
        return matched

    except Exception as e:
        print(f"!!! CRITICAL ERROR in match_stateless: {str(e)}")
        import traceback
        traceback.print_exc()
        return {}
