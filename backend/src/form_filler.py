import json
import os
import shutil
import tempfile

# File where we save learned answers
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
            print(f"⚠️ Warning: Detected corruption in {LEARNED_ANSWERS_PATH}: {e}")
            
            # Attempt to recover from backup if it exists
            if os.path.exists(BACKUP_ANSWERS_PATH):
                print(f"🔄 Attempting recovery from backup: {BACKUP_ANSWERS_PATH}")
                try:
                    with open(BACKUP_ANSWERS_PATH, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception as b_e:
                    print(f"❌ Critical Error: Backup also corrupted: {b_e}")
                    # If both are corrupted, we return empty to avoid crash,
                    # but we WON'T overwrite the corrupted files unless save_learned_answer is called.
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

    # Update state
    answers[clean_field] = clean_value
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(LEARNED_ANSWERS_PATH), exist_ok=True)
    
    # 1. Create a backup of the current state before writing
    if os.path.exists(LEARNED_ANSWERS_PATH):
        try:
            shutil.copy2(LEARNED_ANSWERS_PATH, BACKUP_ANSWERS_PATH)
        except Exception as e:
            print(f"⚠️ Backup failed: {e}")

    # 2. Atomic Write: Write to a temporary file first
    try:
        # Create a temporary file in the same directory to ensure it's on the same partition
        fd, temp_path = tempfile.mkstemp(dir=os.path.dirname(LEARNED_ANSWERS_PATH), suffix=".tmp")
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as tmp:
                json.dump(answers, tmp, indent=2)
                tmp.flush()
                os.fsync(tmp.fileno()) # Force write to physical disk
            
            # 3. Rename the temporary file to the final destination
            # This is an atomic operation on most filesystems
            os.replace(temp_path, LEARNED_ANSWERS_PATH)
            print(f"✅ Securely saved and backed up: {clean_field}")
            
        except Exception as e:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise e
            
    except Exception as e:
        print(f"❌ Critical Error: Failed to save learned answers: {e}")

def get_learned_answer(field_name: str) -> str | None:
    """Check if we have a learned answer for this field"""
    answers = load_learned_answers()
    return answers.get(field_name.strip().lower())