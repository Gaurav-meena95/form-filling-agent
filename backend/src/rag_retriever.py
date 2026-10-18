import chromadb
# pyrefly: ignore [missing-import]
from chromadb.utils import embedding_functions
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import os
import json
from typing import Union, Optional
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

AVAILABLE_MODELS = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]

def get_llm(model_name: str = None):
    """Get working Groq model with fallback"""
    api_key = os.getenv("GROQ_API_KEY")
    target_model = model_name or os.getenv("GROQ_MODEL", AVAILABLE_MODELS[0])
    return ChatGroq(
        api_key=api_key,
        model=target_model,
        temperature=0.1
    )

llm = get_llm()

NOISY_KEYS = {
    'password', 'verify new password', 'single line text', 'multi line text',
    'authenticity token', 'draft', 'dummy field just to avoid empty submit',
    'rger', 'comment', 'submit', 'next', 'back', 'cancel', 'reset'
}

def clean_key(k: str) -> str:
    if not k:
        return ""
    import re
    cleaned = re.sub(r'^\d+[\.\)]\s*', '', str(k))
    cleaned = re.sub(r'\s*\b(single|multi)\s+line\s+text\.?', '', cleaned, flags=re.I)
    return cleaned.strip().lower()

def extract_json_from_response(raw: str) -> dict:
    """Robustly extract JSON dictionary from LLM response"""
    if not raw:
        return {}
    clean = raw.strip()
    if "```" in clean:
        lines = clean.splitlines()
        filtered = [l for l in lines if not l.strip().startswith("```")]
        clean = "\n".join(filtered).strip()
    
    start = clean.find("{")
    end = clean.rfind("}") + 1
    if start == -1 or end <= start:
        print(f"Warning: No JSON object found in response: {clean[:200]}")
        return {}
    
    json_str = clean[start:end]
    try:
        return json.loads(json_str)
    except Exception:
        import re
        try:
            sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', ' ', json_str)
            return json.loads(sanitized)
        except Exception as err:
            print(f"Failed to parse LLM JSON response: {err}")
            return {}

def build_combined_learned(backend_learned: dict, learned_context: Union[str, dict]) -> dict:
    """Merge backend and extension learned answers, deduplicating and cleaning keys"""
    combined = {}
    if backend_learned and isinstance(backend_learned, dict):
        for k, v in backend_learned.items():
            if k and v is not None:
                combined[clean_key(k)] = str(v).strip()
                
    if learned_context:
        try:
            extra = json.loads(learned_context) if isinstance(learned_context, str) else learned_context
            if isinstance(extra, dict):
                for k, v in extra.items():
                    if k and v is not None:
                        combined[clean_key(k)] = str(v).strip()
        except Exception:
            pass
            
    return {k: v for k, v in combined.items() if k not in NOISY_KEYS and len(k) > 1 and v}

def heuristic_field_match(fields: list, learned_dict: dict, profile_dict: dict = None) -> dict:
    """Instant deterministic matcher for standard form fields as high-speed baseline/fallback"""
    matched = {}
    profile = profile_dict or {}
    from datetime import datetime
    today_str = datetime.now().strftime('%Y-%m-%d')
    
    def find_in_dict(patterns, d):
        for pat in patterns:
            if pat in d and d[pat]:
                return d[pat]
        for k, v in d.items():
            for pat in patterns:
                if pat in k and v:
                    return v
        return None

    for f in fields:
        fn = f.lower().strip()
        fn_clean = clean_key(fn)
        
        # 1. Exact or cleaned key match
        if fn in learned_dict:
            matched[f] = learned_dict[fn]
            continue
        if fn_clean in learned_dict:
            matched[f] = learned_dict[fn_clean]
            continue
            
        # 2. Date
        if fn == 'date':
            matched[f] = today_str
            continue
        if 'birth' in fn or 'dob' in fn:
            val = find_in_dict(['date of birth', 'dob'], learned_dict) or find_in_dict(['date of birth', 'dob'], profile)
            if val: matched[f] = val; continue
            
        # 3. Name
        if 'name' in fn and not any(w in fn for w in ['university', 'institute', 'college', 'company']):
            val = profile.get('Full Name') or find_in_dict(['full name', 'enter full name', 'name', 'given name'], learned_dict)
            if val: matched[f] = val; continue
            
        # 4. Email
        if 'email' in fn:
            val = profile.get('Email') or find_in_dict(['email address', 'email id', 'email'], learned_dict)
            if val: matched[f] = val; continue
            
        # 5. Phone / Contact / WhatsApp
        if any(w in fn for w in ['contact', 'mobile', 'phone', 'whatsapp']):
            val = profile.get('Phone') or find_in_dict(['contact number', 'phone number', 'phone'], learned_dict)
            if val: matched[f] = val; continue
            
        # 6. Address / City / Location
        if 'address' in fn or 'city' in fn or 'location' in fn:
            val = find_in_dict(['address line 1', 'address', 'nearest city', 'current city'], learned_dict)
            if val: matched[f] = val; continue
            
        # 7. Gender
        if 'gender' in fn:
            val = find_in_dict(['gender'], learned_dict)
            if val: matched[f] = val; continue
            
        # 8. University / Institute / College
        if any(w in fn for w in ['university', 'institute', 'college']):
            val = profile.get('College') or find_in_dict(['enter college name (full)', 'school or university', 'college'], learned_dict)
            if val and val != 'NOT IN LIST': matched[f] = val; continue
            
        # 9. Qualification / Degree
        if any(w in fn for w in ['degree', 'qualification']):
            val = find_in_dict(['department', 'course / program + year', 'undergraduate degree'], learned_dict)
            if val: matched[f] = val; continue
            
        # 10. Passing Year
        if 'year' in fn and any(w in fn for w in ['pass', 'highest', 'degree', 'graduat']):
            val = profile.get('Year') or find_in_dict(['undergraduation year', 'year'], learned_dict)
            if val: matched[f] = val; continue
            
        # 11. Years of experience
        if 'experience' in fn and any(w in fn for w in ['year', 'number', 'total']):
            val = find_in_dict(['how many years of total professional experience do you have?'], learned_dict)
            if val: matched[f] = val; continue
            
        # 12. Experience details
        if 'experience' in fn and any(w in fn for w in ['detail', 'role', 'position', 'employer', 'profile']):
            val = profile.get('Experience Summary') or find_in_dict(['collaborated with teams to build reusable', 'elaborate your experience on building ai agents or leveraging ai for development'], learned_dict)
            if val: matched[f] = val; continue
            
        # 13. Justify / Fit / Why
        if any(w in fn for w in ['justify', 'fit', 'why']):
            for k, v in learned_dict.items():
                if 'right fit' in k:
                    matched[f] = v
                    break
            if f in matched: continue
            
        # 14. Resume / CV
        if 'resume' in fn or 'cv' in fn:
            for k, v in learned_dict.items():
                if 'resume' in k and str(v).startswith('http'):
                    matched[f] = v
                    break
            continue

    return matched

def get_relevant_learned_summary(fields: list, combined_learned: dict, max_chars: int = 2500) -> str:
    """Select top relevant learned answers strictly within token budget"""
    import re
    field_words = set()
    for f in fields:
        field_words.update(re.findall(r'[a-z0-9]+', f.lower()))
        
    scored = []
    for k, v in combined_learned.items():
        k_words = set(re.findall(r'[a-z0-9]+', k))
        overlap = len(k_words & field_words)
        # Boost fundamental profile keys
        if any(core in k for core in ['name', 'email', 'phone', 'birth', 'gender', 'degree', 'college', 'university', 'experience', 'resume', 'fit', 'address', 'city']):
            overlap += 2
        if overlap > 0:
            scored.append((overlap, k, v))
            
    scored.sort(key=lambda x: -x[0])
    lines = []
    curr_len = 0
    for score, k, v in scored[:25]:
        line = f"- {k}: {v}"
        if curr_len + len(line) > max_chars:
            break
        lines.append(line)
        curr_len += len(line)
    return "\n".join(lines)

def retrieve_and_match(form_fields: list) -> dict:
    """Retrieve info from ChromaDB and match with form fields with token budget safety"""
    retrieved_chunks = []
    
    # 1. Semantic search for specific fields with tight limit
    for field in form_fields[:10]:
        try:
            result = collection.query(query_texts=[field], n_results=1)
            if result.get("documents"):
                for doc_list in result["documents"]:
                    for doc in doc_list:
                        if doc and len(doc.strip()) > 0:
                            retrieved_chunks.append(doc[:600])
        except Exception:
            pass
            
    resume_context = "\n".join(retrieved_chunks[:3])
    backend_learned = load_learned_answers()
    combined_learned = build_combined_learned(backend_learned, {})
    
    heuristic_matched = heuristic_field_match(form_fields, combined_learned)
    learned_summary = get_relevant_learned_summary(form_fields, combined_learned, max_chars=2500)
    
    prompt = ChatPromptTemplate.from_template("""
    You are an intelligent job application assistant filling a form for the candidate.
    
    CANDIDATE INFO:
    {relevant_info}
    
    FIELDS TO FILL:
    {fields}
    
    RULES:
    1. Return ONLY a valid JSON object.
    2. Use the EXACT field names provided in FIELDS TO FILL as keys.
    3. Return concise, accurate values for each matched field. If no information is found, use null.
    """)
    
    final_context = f"{resume_context}\n\n{learned_summary}".strip()
    
    for model_name in AVAILABLE_MODELS:
        try:
            current_llm = get_llm(model_name)
            chain = prompt | current_llm
            response = chain.invoke({
                "relevant_info": final_context,
                "fields": ", ".join(form_fields)
            })
            raw_data = extract_json_from_response(response.content)
            
            # Merge heuristic with LLM
            merged = {}
            for f in form_fields:
                llm_val = raw_data.get(f)
                if llm_val is not None and str(llm_val).strip() and str(llm_val).lower() not in ['null', 'none']:
                    merged[f] = str(llm_val).strip()
                elif f in heuristic_matched:
                    merged[f] = heuristic_matched[f]
            return merged
        except Exception as e:
            print(f"Model {model_name} failed in retrieve_and_match: {e}")
            
    return heuristic_matched

def match_stateless(form_fields: list, profile_context: str, learned_context: str = "") -> dict:
    """Stateless matching with strict token budgeting (prevents 413 TPM limit) and heuristic fallback"""
    
    # 1. Parse manual profile
    profile_dict = {}
    if profile_context:
        try:
            profile_dict = json.loads(profile_context) if isinstance(profile_context, str) else profile_context
        except Exception:
            pass
            
    # 2. Build deduplicated learned answers
    backend_learned = load_learned_answers()
    combined_learned = build_combined_learned(backend_learned, learned_context)
    
    # 3. Compute instant heuristic baseline
    heuristic_matched = heuristic_field_match(form_fields, combined_learned, profile_dict)
    print(f"Heuristic matched {len(heuristic_matched)} of {len(form_fields)} fields.")
    
    # 4. Compact context construction (STRICT <= 4500 chars to never exceed Groq 8000 TPM)
    learned_summary = get_relevant_learned_summary(form_fields, combined_learned, max_chars=2200)
    
    profile_str = ""
    if profile_dict:
        profile_str = "Candidate Profile:\n" + "\n".join([f"- {k}: {v}" for k, v in profile_dict.items() if v])
        profile_str = profile_str[:1200]
    elif profile_context and not profile_dict:
        profile_str = f"Candidate Profile: {str(profile_context)[:1200]}"
        
    resume_summary = ""
    try:
        all_stored = collection.get()
        all_docs = all_stored.get("documents", [])
        if all_docs:
            for doc in all_docs[-1:]:
                if doc:
                    resume_summary = f"Resume Summary:\n{doc[:1000]}"
    except Exception as e:
        print(f"ChromaDB lookup skipped: {e}")
        
    final_context = f"{profile_str}\n\n{resume_summary}\n\n{learned_summary}".strip()
    
    from datetime import datetime
    today_str = datetime.now().strftime('%Y-%m-%d')
    
    prompt = ChatPromptTemplate.from_template("""
    You are an expert job application assistant. Your task is to match candidate data with form fields.
    Today's date is: {today}
    
    CANDIDATE INFORMATION:
    {relevant_info}
    
    FIELDS TO FILL:
    {fields}
    
    RULES:
    1. Return ONLY a FLAT, valid JSON object with keys matching EXACTLY the strings in FIELDS TO FILL.
    2. For 'Date', return {today}.
    3. Use candidate data to accurately populate each field.
    4. For missing fields, set the value to null.
    """)
    
    # Try models in priority order with automatic failover
    for model_name in AVAILABLE_MODELS:
        try:
            current_llm = get_llm(model_name)
            chain = prompt | current_llm
            response = chain.invoke({
                "relevant_info": final_context,
                "fields": ", ".join(form_fields),
                "today": today_str
            })
            
            raw = response.content.strip()
            data = extract_json_from_response(raw)
            
            # Flatten just in case
            flat_data = {}
            for k, v in data.items():
                if isinstance(v, dict):
                    flat_data.update(v)
                else:
                    flat_data[k] = v
                    
            # Merge heuristic with LLM
            merged = {}
            for f in form_fields:
                llm_val = flat_data.get(f)
                if llm_val is not None and str(llm_val).strip() and str(llm_val).lower() not in ['null', 'none']:
                    merged[f] = str(llm_val).strip()
                elif f in heuristic_matched:
                    merged[f] = heuristic_matched[f]
                    
            print(f"Successfully matched {len(merged)} fields using {model_name}.")
            return merged
            
        except Exception as e:
            print(f"Warning: Model {model_name} failed: {e}. Trying fallback...")
            
    # If all LLM calls fail, return heuristic results
    print("All LLM attempts failed. Returning heuristic matches.")
    return heuristic_matched

