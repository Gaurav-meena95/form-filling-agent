from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Dict
from src.form_detector import detect_form_fields
from src.rag_retriever import retrieve_and_match
from src.form_filler import fill_form

# State that flows through all nodes
class AgentState(TypedDict):
    form_url: str
    detected_fields: List[str]
    matched_data: Dict[str, str]
    status: str

# Node 1 - Detect form fields
def detect_fields_node(state: AgentState) -> AgentState:
    print("\n[Node 1] Detecting form fields...")
    fields = detect_form_fields(state["form_url"])
    return {**state, "detected_fields": fields, "status": "fields_detected"}

# Node 2 - Retrieve and match from ChromaDB
def match_fields_node(state: AgentState) -> AgentState:
    print("\n[Node 2] Matching fields with ChromaDB...")
    matched = retrieve_and_match(state["detected_fields"])
    return {**state, "matched_data": matched, "status": "fields_matched"}

# Node 3 - Fill form and wait for user
def fill_form_node(state: AgentState) -> AgentState:
    print("\n[Node 3] Filling form...")
    fill_form(state["form_url"], state["matched_data"], state["detected_fields"])
    return {**state, "status": "completed"}

# Build LangGraph
def build_agent():
    graph = StateGraph(AgentState)
    
    graph.add_node("detect_fields", detect_fields_node)
    graph.add_node("match_fields", match_fields_node)
    graph.add_node("fill_form", fill_form_node)
    
    graph.set_entry_point("detect_fields")
    graph.add_edge("detect_fields", "match_fields")
    graph.add_edge("match_fields", "fill_form")
    graph.add_edge("fill_form", END)
    
    return graph.compile()