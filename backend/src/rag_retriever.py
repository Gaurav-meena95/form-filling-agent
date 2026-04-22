import chromadb
from chromadb.utils import embedding_functions
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import os
import json
from backend.src.form_filler import load_learned_answers

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
    
    # 3. Add Learned Answers (High Priority)
    learned = load_learned_answers()
    learned_context = ""
    if learned:
        learned_context = "\n\n### USER'S PREVIOUSLY CORRECTED ANSWERS (HIGH PRIORITY):\n"
        for field, val in learned.items():
            learned_context += f"- {field}: {val}\n"
    
    final_context = relevant_info + learned_context
    print(f"Retrieved {len(retrieved_chunks)} unique chunks from ChromaDB and {len(learned)} learned answers.")
    
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
        print(f"Failed to parse LLM response as JSON: {e}")
        print(f"Raw response: {raw}")
        return {}
    
    # Remove null values - only keep matched fields
    matched = {k: v for k, v in data.items() if v is not None}
    print(f"Matched {len(matched)} fields successfully.")
    
    return matched

def match_stateless(form_fields: list, profile_context: str, learned_context: str = "") -> dict:
    """Stateless version of matching for production use (data sent in request)"""
    
    final_context = f"Candidate Profile:\n{profile_context}"
    if learned_context:
        final_context += "\n\n### USER'S PREVIOUSLY CORRECTED ANSWERS (HIGH PRIORITY):\n" + learned_context

    prompt = ChatPromptTemplate.from_template("""
    You are an intelligent job application assistant. Match the candidate's profile with the form fields.

    CONTEXT:
    {relevant_info}

    FIELDS TO FILL:
    {fields}

    RULES:
    - "Email Id (RU domain)" = university email (.edu.in)
    - "Enrollment No" = search for student ID or registration numbers
    - "LeetCode Profile" = find LeetCode URL
    - "CodeChef Profile" = find CodeChef URL
    - "mid level and hard level problems solved" = search for problem counts in profile
    - "DSA Knowledge" = Answer "Yes" if student has CS/IT background or skills.
    - If no data is found, return null. Return ONLY valid JSON.
    """)
    
    chain = prompt | llm
    response = chain.invoke({
        "relevant_info": final_context,
        "fields": ", ".join(form_fields)
    })
    
    try:
        raw = response.content.strip()
        start = raw.find("{")
        end = raw.rfind("}") + 1
        data = json.loads(raw[start:end])
        return {k: v for k, v in data.items() if v is not None}
    except:
        return {}
