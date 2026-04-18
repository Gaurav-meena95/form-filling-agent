from playwright.async_api import Page
import json
import os

# File where we save learned answers
LEARNED_ANSWERS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "learned_answers.json")

def load_learned_answers() -> dict:
    """Load previously learned answers from file"""
    if os.path.exists(LEARNED_ANSWERS_PATH):
        with open(LEARNED_ANSWERS_PATH, "r") as f:
            return json.load(f)
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

async def fill_form(page: Page, form_url: str, matched_data: dict, detected_fields: list):
    """Fill form - handles text, radio, checkbox, dropdown, textarea"""
    
    print("Beginning automated filling...")
    print(f"Matched data: {matched_data}")
    
    # Merge matched_data with learned answers
    learned = load_learned_answers()
    for field in detected_fields:
        key = field.strip().lower()
        if field not in matched_data and key in learned:
            matched_data[field] = learned[key]
            print(f"Using learned answer for: {field} -> {learned[key]}")
    
    await page.wait_for_timeout(2000)
    
    question_containers = await page.query_selector_all('.Qr7Oae')
    print(f"Total question containers found: {len(question_containers)}")
    
    filled_count = 0
    skipped_fields = []  # Track skipped fields for learning
    
    for container in question_containers:
        try:
            # Get field label
            label_el = await container.query_selector('.M7eMe')
            if not label_el:
                continue
            
            field_name = (await label_el.inner_text()).strip().replace('*', '').strip()
            
            if field_name not in matched_data:
                print(f"Skipped (no data): {field_name}")
                skipped_fields.append(field_name)
                continue
            
            value = str(matched_data[field_name])
            print(f"Attempting: {field_name} -> {value}")
            
            # --- Text Input ---
            text_input = await container.query_selector('input[type="text"], input[type="email"], input[type="tel"]')
            if text_input:
                await text_input.scroll_into_view_if_needed()
                await text_input.click()
                await text_input.fill(value)
                print(f"Filled text: {field_name}")
                filled_count += 1
                await page.wait_for_timeout(300)
                continue
            
            # --- Textarea ---
            textarea = await container.query_selector('textarea')
            if textarea:
                await textarea.scroll_into_view_if_needed()
                await textarea.click()
                await textarea.fill(value)
                print(f"Filled textarea: {field_name}")
                filled_count += 1
                await page.wait_for_timeout(300)
                continue
            
            # --- Radio Buttons ---
            radio_options = await container.query_selector_all('div[role="radio"]')
            if radio_options:
                matched = False
                for option in radio_options:
                    # Get text from YEVVod div next to it
                    parent = await option.evaluate_handle('el => el.closest("label")')
                    label_div = await parent.query_selector('.YEVVod')
                    if not label_div:
                        continue
                    option_text = (await label_div.inner_text()).strip().lower()
                    answer_value = await option.get_attribute('data-answer-value')
                    
                    if (option_text == value.strip().lower() or 
                        (answer_value and answer_value.strip().lower() == value.strip().lower())):
                        await option.scroll_into_view_if_needed()
                        await option.click()
                        print(f"Selected radio: {field_name} -> {option_text}")
                        filled_count += 1
                        matched = True
                        break
                if not matched:
                    print(f"Radio not matched: {field_name} -> {value}")
                    skipped_fields.append(field_name)
                await page.wait_for_timeout(300)
                continue
            
            # --- Checkboxes ---
            checkbox_options = await container.query_selector_all('div[role="checkbox"]')
            if checkbox_options:
                values_to_check = [v.strip().lower() for v in value.split(",")]
                matched = False
                for option in checkbox_options:
                    parent = await option.evaluate_handle('el => el.closest("label")')
                    label_div = await parent.query_selector('.YEVVod')
                    if not label_div:
                        continue
                    option_text = (await label_div.inner_text()).strip().lower()
                    answer_value = await option.get_attribute('data-answer-value')
                    
                    if (option_text in values_to_check or 
                        (answer_value and answer_value.strip().lower() in values_to_check)):
                        await option.scroll_into_view_if_needed()
                        await option.click()
                        print(f"Checked: {field_name} -> {option_text}")
                        matched = True
                        filled_count += 1
                await page.wait_for_timeout(300)
                continue
            
            # --- Dropdown ---
            dropdown = await container.query_selector('.MocG8c, select')
            if dropdown:
                tag = await dropdown.evaluate('el => el.tagName.toLowerCase()')
                if tag == 'select':
                    await dropdown.select_option(label=value)
                    print(f"Selected native dropdown: {field_name} -> {value}")
                    filled_count += 1
                else:
                    await dropdown.scroll_into_view_if_needed()
                    await dropdown.click()
                    await page.wait_for_timeout(500)
                    options = await page.query_selector_all('.vRMGwf, .OA0qNb')
                    matched = False
                    for option in options:
                        option_text = (await option.inner_text()).strip().lower()
                        if option_text == value.strip().lower():
                            await option.click()
                            print(f"Selected dropdown: {field_name} -> {value}")
                            filled_count += 1
                            matched = True
                            break
                    if not matched:
                        # Close dropdown
                        await page.keyboard.press('Escape')
                        print(f"Dropdown option not found: {field_name}")
                        skipped_fields.append(field_name)
                await page.wait_for_timeout(300)
                continue

        except Exception as e:
            print(f"Error on field '{field_name}': {e}")
            skipped_fields.append(field_name)
    
    print(f"\nSummary: {filled_count} filled, {len(skipped_fields)} skipped")
    
    if skipped_fields:
        print(f"Skipped fields (user should fill): {skipped_fields}")
        print("\nWaiting for user to fill remaining fields...")
        print("Agent will learn from what you fill in...")
        
        # Watch for form submission to learn from user input
        try:
            await page.wait_for_url("**/formResponse**", timeout=300000)
            print("Form submitted! Saving learned answers...")
            
            # Re-read filled values before submission
            containers = await page.query_selector_all('.Qr7Oae')
            for container in containers:
                try:
                    label_el = await container.query_selector('.M7eMe')
                    if not label_el:
                        continue
                    field = (await label_el.inner_text()).strip().replace('*', '').strip()
                    
                    if field not in skipped_fields:
                        continue
                    
                    # Read what user typed
                    text_input = await container.query_selector('input[type="text"], input[type="email"], textarea, input[type="tel"]')
                    if text_input:
                        user_value = await text_input.input_value()
                        if user_value.strip():
                            save_learned_answer(field, user_value.strip())
                except:
                    pass
        except:
            print("Timeout or form closed.")
    
    print("Done!")