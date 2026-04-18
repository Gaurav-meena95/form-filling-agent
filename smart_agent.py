from playwright.sync_api import sync_playwright
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from profile_store import store_profile, retrieve_relevant_info
from dotenv import load_dotenv
from typing import TypedDict, List, Dict
import os
import json

load_dotenv()

# ---- State Definition ----
# LangGraph mein har node is state ko read/update karta hai
class AgentState(TypedDict):
    form_url: str
    detected_fields: List[str]
    matched_data: Dict[str, str]
    status: str

# ---- LLM Setup ----
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.3-70b-versatile"
)

# ---- Node 1: Form Open + Fields Detect ----
def detect_fields_node(state: AgentState) -> AgentState:
    print("\n[Node 1] Opening form and detecting fields...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        page.goto(state["form_url"])
        page.wait_for_timeout(3000)
        
        # Saare field labels dhundho
        labels = page.query_selector_all('div[role="listitem"] .M7eMe')
        field_names = []
        
        for label in labels:
            text = label.inner_text().strip()
            if text:
                field_names.append(text)
        
        # Agar labels nahi mile toh LLM se detect karwao
        if not field_names:
            print("Labels directly nahi mile, LLM se detect karte hain...")
            inputs = page.query_selector_all('div[role="listitem"] input')
            field_names = [f"Field_{i+1}" for i in range(len(inputs))]
        
        print(f"Detected fields: {field_names}")
        browser.close()
    
    return {**state, "detected_fields": field_names, "status": "fields_detected"}

# ---- Node 2: ChromaDB se Match Karo ----
def match_fields_node(state: AgentState) -> AgentState:
    print("\n[Node 2] Matching fields with ChromaDB...")
    
    detected = state["detected_fields"]
    
    # RAG se relevant info lo
    relevant_info = retrieve_relevant_info(detected)
    print(f"Retrieved from DB:\n{relevant_info}")
    
    # LLM se structured data lo
    prompt = ChatPromptTemplate.from_template("""
    You are a form filling assistant.
    
    Information available from user database:
    {relevant_info}
    
    Form fields detected:
    {fields}
    
    Rules:
    - Only fill fields where you have confident data from the database
    - If data for a field is not available or uncertain, use null for that field
    - Return ONLY a JSON object, nothing else
    
    Example: {{"Full Name": "John Doe", "Email": null, "City": "Delhi"}}
    """)
    
    chain = prompt | llm
    response = chain.invoke({
        "relevant_info": relevant_info,
        "fields": ", ".join(detected)
    })
    
    # JSON parse karo
    raw = response.content.strip()
    # Extra text hata do agar LLM ne kuch extra likha
    start = raw.find("{")
    end = raw.rfind("}") + 1
    data = json.loads(raw[start:end])
    
    # Sirf non-null values rakho
    matched = {k: v for k, v in data.items() if v is not None}
    print(f"Matched data: {matched}")
    
    return {**state, "matched_data": matched, "status": "fields_matched"}

# ---- Node 3: Form Fill Karo + User ka Wait Karo ----
def fill_and_wait_node(state: AgentState) -> AgentState:
    print("\n[Node 3] Filling form and waiting for user...")
    
    matched_data = state["matched_data"]
    detected_fields = state["detected_fields"]
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        page.goto(state["form_url"])
        page.wait_for_timeout(3000)
        
        inputs = page.query_selector_all('div[role="listitem"] input')
        
        filled_count = 0
        skipped_count = 0
        
        for i, input_field in enumerate(inputs):
            if i >= len(detected_fields):
                break
                
            field_name = detected_fields[i]
            
            if field_name in matched_data:
                # Field match mili — fill karo
                input_field.click()
                input_field.fill(matched_data[field_name])
                print(f"Filled: {field_name} -> {matched_data[field_name]}")
                filled_count += 1
            else:
                # Field match nahi mili — skip karo
                print(f"Skipped (not in DB): {field_name}")
                skipped_count += 1
            
            page.wait_for_timeout(500)
        
        print(f"\nSummary: {filled_count} filled, {skipped_count} skipped")
        print("Waiting for user to fill remaining fields and submit...")
        
        # User ke submit karne ka wait karo
        # Jab tak form page hai tab tak wait karo
        page.wait_for_url("**/formResponse**", timeout=120000)
        print("Form submitted by user!")
        
        browser.close()
    
    return {**state, "status": "completed"}

# ---- LangGraph Build Karo ----
def build_agent():
    graph = StateGraph(AgentState)
    
    # Nodes add karo
    graph.add_node("detect_fields", detect_fields_node)
    graph.add_node("match_fields", match_fields_node)
    graph.add_node("fill_and_wait", fill_and_wait_node)
    
    # Edges — flow define karo
    graph.set_entry_point("detect_fields")
    graph.add_edge("detect_fields", "match_fields")
    graph.add_edge("match_fields", "fill_and_wait")
    graph.add_edge("fill_and_wait", END)
    
    return graph.compile()

# ---- Main ----
if __name__ == "__main__":
    # Pehle profile store karo
    user_profile = {
        "Full Name": "Gaurav Meena",
        "Email": "gaurav@example.com",
        "City": "Sonipat",
        "Phone": "9876543210",
        "College": "MDU Rohtak",
        "Year": "2nd Year",
        "Branch": "Computer Science"
    }
    
    print("Storing profile in ChromaDB...")
    store_profile(user_profile)
    
    # Agent run karo
    agent = build_agent()
    
    initial_state = {
        "form_url": "https://docs.google.com/forms/d/e/1FAIpQLSdOMBMwJcpqw8MUADwN-Njaf4C_8alqoJ2a64omYcZ_z6BYQA/viewform",
        "detected_fields": [],
        "matched_data": {},
        "status": "starting"
    }
    
    result = agent.invoke(initial_state)
    print(f"\nFinal status: {result['status']}")