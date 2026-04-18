from src.ingestion import store_from_manual, store_from_pdf
from src.agent import build_agent
import os

# ---- STEP 1: Store your profile ----
# Option A - Manual profile
user_profile = {
    "Full Name": "Gaurav Meena",
    "Email": "gaurav@example.com",
    "City": "Sonipat",
    "Phone": "9876543210",
    "College": "MDU Rohtak",
    "Year": "2nd Year",
    "Branch": "Computer Science"
}
store_from_manual(user_profile)

# Option B - Upload resume PDF (uncomment to use)
# store_from_pdf("uploads/resume.pdf")

# ---- STEP 2: Run agent ----
FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdOMBMwJcpqw8MUADwN-Njaf4C_8alqoJ2a64omYcZ_z6BYQA/viewform"

agent = build_agent()

initial_state = {
    "form_url": FORM_URL,
    "detected_fields": [],
    "matched_data": {},
    "status": "starting"
}

result = agent.invoke(initial_state)
print(f"\nAgent finished with status: {result['status']}")