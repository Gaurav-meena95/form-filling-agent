from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Dict, Any
from backend.src.form_detector import detect_form_fields
from backend.src.rag_retriever import retrieve_and_match
from backend.src.form_filler import fill_form
from backend.src.browser_manager import BrowserManager

# State that flows through all nodes
class AgentState(TypedDict):
    form_url: str
    detected_fields: List[str]
    matched_data: Dict[str, str]
    status: str
    page: Any # Playwright Page object

# Node 1 - Detect form fields
async def detect_fields_node(state: AgentState) -> AgentState:
    print("\n[Node 1] Detecting form fields...")
    
    # Get shareable browser context and open a new tab in the same window
    manager = await BrowserManager.get_instance()
    page = await manager.get_page()
    
    fields = await detect_form_fields(page, state["form_url"])
    return {**state, "detected_fields": fields, "page": page, "status": "fields_detected"}

# Node 2 - Retrieve and match from ChromaDB
async def match_fields_node(state: AgentState) -> AgentState:
    print("\n[Node 2] Matching fields with ChromaDB...")
    matched = retrieve_and_match(state["detected_fields"])
    return {**state, "matched_data": matched, "status": "fields_matched"}

# Node 3 - Fill form and wait for user
async def fill_form_node(state: AgentState) -> AgentState:
    print("\n[Node 3] Filling form...")
    await fill_form(state["page"], state["form_url"], state["matched_data"], state["detected_fields"])
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