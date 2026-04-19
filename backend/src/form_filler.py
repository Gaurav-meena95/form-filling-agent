import json
import os

# File where we save learned answers
LEARNED_ANSWERS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "learned_answers.json")

def load_learned_answers() -> dict:
    """Load previously learned answers from file"""
    if os.path.exists(LEARNED_ANSWERS_PATH):
        with open(LEARNED_ANSWERS_PATH, "r") as f:
            try:
                return json.load(f)
            except:
                return {}
    return {}

def save_learned_answer(field_name: str, value: str):
    """Save a new learned answer to file"""
    answers = load_learned_answers()
    answers[field_name.strip().lower()] = value
    os.makedirs(os.path.dirname(LEARNED_ANSWERS_PATH), exist_ok=True)
    with open(LEARNED_ANSWERS_PATH, "w") as f:
        json.dump(answers, f, indent=2)
    print(f"Learned and saved: {field_name} -> {value}")

def get_learned_answer(field_name: str) -> str | None:
    """Check if we have a learned answer for this field"""
    answers = load_learned_answers()
    return answers.get(field_name.strip().lower())