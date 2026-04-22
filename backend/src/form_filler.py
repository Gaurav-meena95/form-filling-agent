import json
import os
import shutil
import tempfile

# Path to learned answers file
LEARNED_ANSWERS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "learned_answers.json")
BACKUP_ANSWERS_PATH = LEARNED_ANSWERS_PATH + ".bak"

def load_learned_answers() -> dict:
    """
    Load previously learned answers from file with corruption detection.
    If the file exists but is corrupted, attempt to recover from backup.
    """
    if os.path.exists(LEARNED_ANSWERS_PATH):
        try:
            with open(LEARNED_ANSWERS_PATH, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if not content:
                    raise ValueError("File is empty")
                return json.loads(content)
        except (json.JSONDecodeError, ValueError, Exception) as e:
            print(f"Warning: Data corruption in {LEARNED_ANSWERS_PATH}: {e}")
            
            # Recovery from backup
            if os.path.exists(BACKUP_ANSWERS_PATH):
                print(f"Attempting recovery from backup: {BACKUP_ANSWERS_PATH}")
                try:
                    with open(BACKUP_ANSWERS_PATH, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception as b_e:
                    print(f"Error: Backup also corrupted: {b_e}")
                    return {}
            return {}
    return {}

def save_learned_answer(field_name: str, value: str):
    """
    Save a new learned answer using ATOMIC WRITE and AUTOMATIC BACKUP.
    Ensures that data is never lost even if the system crashes mid-write.
    """
    if not field_name or value is None:
        return

    answers = load_learned_answers()
    clean_field = field_name.strip().lower()
    clean_value = str(value).strip()

    # Intelligence: Check if value is actually different
    if clean_field in answers and answers[clean_field] == clean_value:
        return

    answers[clean_field] = clean_value
    os.makedirs(os.path.dirname(LEARNED_ANSWERS_PATH), exist_ok=True)
    
    # 1. Create backup
    if os.path.exists(LEARNED_ANSWERS_PATH):
        try:
            shutil.copy2(LEARNED_ANSWERS_PATH, BACKUP_ANSWERS_PATH)
        except Exception as e:
            print(f"Backup failed: {e}")

    # 2. Atomic Write
    try:
        fd, temp_path = tempfile.mkstemp(dir=os.path.dirname(LEARNED_ANSWERS_PATH), suffix=".tmp")
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as tmp:
                json.dump(answers, tmp, indent=2)
                tmp.flush()
                os.fsync(tmp.fileno())
            
            os.replace(temp_path, LEARNED_ANSWERS_PATH)
            print(f"Saved: {clean_field}")
            
        except Exception as e:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise e
            
    except Exception as e:
        print(f"Error: Failed to save learned answers: {e}")

def get_learned_answer(field_name: str) -> str | None:
    """Check for a learned answer for a field"""
    answers = load_learned_answers()
    return answers.get(field_name.strip().lower())