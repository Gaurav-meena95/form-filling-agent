from playwright.async_api import Page

async def detect_form_fields(page: Page, form_url: str) -> list:
    """Detect all field labels on the current page with robust selectors"""
    
    print(f"Opening form in new tab: {form_url}")
    await page.goto(form_url)
    
    # Wait for the form to load - Google Forms use .Qr7Oae for question containers
    try:
        await page.wait_for_selector('.Qr7Oae', timeout=10000)
    except:
        print("Warning: Specific Google Form containers not found, using generic wait.")
        await page.wait_for_timeout(3000)
    
    # Strategy 1: Google Forms specific (Labels are in .M7eMe)
    labels = await page.query_selector_all('.M7eMe')
    field_names = []
    
    for label in labels:
        text = (await label.inner_text()).strip()
        if text:
            # Clean up the text (remove * for required fields)
            text = text.replace('*', '').strip()
            field_names.append(text)
    
    # Strategy 2: Fallback for generic forms (labels, placeholders, or aria-labels)
    if not field_names:
        print("Strategy 1 failed, trying generic detection...")
        # Check for standard label elements
        standard_labels = await page.query_selector_all('label')
        for l in standard_labels:
            text = (await l.inner_text()).strip()
            if text: field_names.append(text)
            
        # Check for placeholders/aria-labels if still empty
        if not field_names:
            generic_inputs = await page.query_selector_all('input[placeholder], input[aria-label], textarea[placeholder]')
            for l in generic_inputs:
                text = (await l.get_attribute('placeholder')) or (await l.get_attribute('aria-label'))
                if text and text.strip():
                    field_names.append(text.strip())
        
    # Strategy 3: Absolute fallback (Field numbering)
    if not field_names:
        print("Strategy 2 failed, using auto-numbering fallback...")
        inputs = await page.query_selector_all('input[type="text"], input[type="email"], textarea')
        field_names = [f"Field_{i+1}" for i in range(len(inputs))]
    
    # Remove duplicates while preserving order
    unique_fields = []
    seen = set()
    for field in field_names:
        if field not in seen:
            unique_fields.append(field)
            seen.add(field)
    
    print(f"Detected fields ({len(unique_fields)}): {unique_fields}")
    return unique_fields