from playwright.sync_api import sync_playwright
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from profile_store import store_profile, retrieve_relevant_info
from dotenv import load_dotenv
import os
import json

load_dotenv()

FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdOMBMwJcpqw8MUADwN-Njaf4C_8alqoJ2a64omYcZ_z6BYQA/viewform"


user_profile = {
    "Full Name": "Gaurav Meena",
    "Email": "gaurav@example.com",
    "City": "Sonipat",
    "Phone": "9876543210",
    "College": "MDU Rohtak",
    "Year": "2nd Year",
    "Branch": "Computer Science"
}


form_fields = ["Full Name", "Email", "City","number"]

def get_data_from_llm(relevant_info, fields):
    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model="llama-3.3-70b-versatile"
    )
    
    prompt = ChatPromptTemplate.from_template("""
    You are a form filling assistant.
    
    Relevant user information retrieved from database:
    {relevant_info}
    
    Form has exactly these fields:
    {fields}
    
    Extract the correct value for each field.
    Return ONLY a JSON object, nothing else, no extra fields.
    
    Example: {{"Full Name": "John Doe", "Email": "john@example.com", "City": "Delhi"}}
    """)
    
    chain = prompt | llm
    response = chain.invoke({
        "relevant_info": relevant_info,
        "fields": ", ".join(fields)
    })
    
    return json.loads(response.content)

def fill_form(data):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        page.goto(FORM_URL)
        print("Form opened!")
        
        page.wait_for_timeout(3000)
        
        inputs = page.query_selector_all('div[role="listitem"] input')
        print(f"Fields found: {len(inputs)}")
        
        values = list(data.values())
        
        for i, input_field in enumerate(inputs[:len(values)]):
            input_field.click()
            input_field.fill(values[i])
            print(f"Filled: {list(data.keys())[i]} -> {values[i]}")
            page.wait_for_timeout(500)
        
        page.wait_for_timeout(3000)
        browser.close()
        print("Done!")

# Main flow
print("Step 1: Storing profile in ChromaDB...")
store_profile(user_profile)

print("\nStep 2: Retrieving relevant info from database...")
relevant_info = retrieve_relevant_info(form_fields)
print(f"Retrieved:\n{relevant_info}")

print("\nStep 3: Getting structured data from LLM...")
data = get_data_from_llm(relevant_info, form_fields)
print(f"LLM decided: {data}")

print("\nStep 4: Filling form...")
fill_form(data)