from playwright.sync_api import sync_playwright

def fill_form(form_url: str, matched_data: dict, detected_fields: list):
    """Fill form with matched data and wait for user to submit"""
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        page.goto(form_url)
        print("Form opened!")
        page.wait_for_timeout(3000)
        
        inputs = page.query_selector_all('div[role="listitem"] input')
        
        filled_count = 0
        skipped_count = 0
        
        for i, input_field in enumerate(inputs):
            if i >= len(detected_fields):
                break
            
            field_name = detected_fields[i]
            
            if field_name in matched_data:
                # Field matched - fill it
                input_field.click()
                input_field.fill(matched_data[field_name])
                print(f"Filled: {field_name} -> {matched_data[field_name]}")
                filled_count += 1
            else:
                # Field not matched - skip for user
                print(f"Skipped (not found in DB): {field_name}")
                skipped_count += 1
            
            page.wait_for_timeout(500)
        
        print(f"\nSummary: {filled_count} filled, {skipped_count} skipped by agent")
        print("Waiting for user to fill remaining fields and submit...")
        
        # Wait for user to submit - 3 minute timeout
        page.wait_for_url("**/formResponse**", timeout=180000)
        print("Form submitted successfully!")
        
        browser.close()