import chromadb
from chromadb.utils import embedding_functions
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import os
import json

load_dotenv()

# Connect to existing ChromaDB
client = chromadb.PersistentClient(path="./data/user_profiles")
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
        if result["documents"][0]:
            retrieved_info.append(result["documents"][0][0])
    
    relevant_info = "\n".join(retrieved_info)
    print(f"Retrieved from ChromaDB:\n{relevant_info}")
    
    # Step 2 - LLM matches retrieved info with form fields
    prompt = ChatPromptTemplate.from_template("""
    You are a form filling assistant.
    
    Information retrieved from user database:
    {relevant_info}
    
    Form fields to fill:
    {fields}
    
    Rules:
    - Only fill fields where you have confident matching data
    - If data for a field is missing or uncertain, use null
    - Return ONLY a valid JSON object, nothing else
    
    Example: {{"Full Name": "John Doe", "Email": null, "City": "Delhi"}}
    """)
    
    chain = prompt | llm
    response = chain.invoke({
        "relevant_info": relevant_info,
        "fields": ", ".join(form_fields)
    })
    
    # Parse JSON safely
    raw = response.content.strip()
    start = raw.find("{")
    end = raw.rfind("}") + 1
    data = json.loads(raw[start:end])
    
    # Remove null values - only keep matched fields
    matched = {k: v for k, v in data.items() if v is not None}
    print(f"Matched fields: {matched}")
    
    return matched