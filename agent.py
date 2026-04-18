from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import os
import json

load_dotenv()

llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.3-70b-versatile"
)

user_profile = """
my name is gaurav meena i am from sonipat haryana and my email id is gaurav@exaple.com my mobile number is 773445je454
"""

form_fields = ["Full Name", "Email", "City",'number']

prompt = ChatPromptTemplate.from_template("""
you are a form filling assistant

User  details:
{profile}

Form fields:
{fields}

Extract the value for each field from the user details.
Return the response in JSON format only.

Example format:
{{"Full Name": "John Doe", "Email": "john@example.com", "City": "Delhi"}}
""")

chain = prompt | llm

response = chain.invoke({
    "profile": user_profile,
    "fields": ", ".join(form_fields)
})

print("LLM ka jawab:")
print(response.content)


data = json.loads(response.content)
print("\nParsed data:")
for field, value in data.items():
    print(f"{field}: {value}")