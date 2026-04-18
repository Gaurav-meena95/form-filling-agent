from playwright.sync_api import sync_playwright

def detect_form_fields(form_url: str) -> list:
    """Open form and detect all field labels"""
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        print(f"Opening form: {form_url}")
        page.goto(form_url)
        page.wait_for_timeout(3000)
        
        # Try to get field labels
        labels = page.query_selector_all('div[role="listitem"] .M7eMe')
        field_names = []
        
        for label in labels:
            text = label.inner_text().strip()
            if text:
                field_names.append(text)
        
        # Fallback - if labels not found count inputs
        if not field_names:
            inputs = page.query_selector_all('div[role="listitem"] input')
            field_names = [f"Field_{i+1}" for i in range(len(inputs))]
        
        print(f"Detected fields: {field_names}")
        browser.close()
    
    return field_names