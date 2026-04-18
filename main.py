from playwright.sync_api import sync_playwright
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import os
import json

load_dotenv()

FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdOMBMwJcpqw8MUADwN-Njaf4C_8alqoJ2a64omYcZ_z6BYQA/viewform"

user_profile = """
i am gaurav meena.
I live in Sonipat.
My email is gaurav@example.com.
number 7724014495 
"""

form_fields = ["Email","Full Name", "City","number"]

def get_data_from_llm(profile, fields):
    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model="llama-3.3-70b-versatile"
    )
    
    prompt = ChatPromptTemplate.from_template("""
    You are a form filling assistant.
    
    User details:
    {profile}
    
    Form has exactly these fields:
    {fields}
    
    Extract the correct value for each field from user details.
    Return ONLY a JSON object, nothing else, no extra fields.
    
    Example: {{"Full Name": "John Doe", "Email": "john@example.com", "City": "Delhi"}}
    """)
    
    chain = prompt | llm
    response = chain.invoke({
        "profile": profile,
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
print("Getting data from LLM...")
data = get_data_from_llm(user_profile, form_fields)
print(f"LLM decided: {data}")

print("\nFilling form...")
fill_form(data)