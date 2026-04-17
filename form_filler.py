from playwright.sync_api import sync_playwright

FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdOMBMwJcpqw8MUADwN-Njaf4C_8alqoJ2a64omYcZ_z6BYQA/viewform"

user_data = [
    "Gaurav Meena",
    "gaurav@example.com", 
    "Sonipat"
]

def fill_form():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        page.goto(FORM_URL)
        print("Form khul gaya!")
        
        # Google Form fully load hone do
        page.wait_for_timeout(3000)
        
        # Google Form ka actual selector ye hota hai
        inputs = page.query_selector_all('div[role="listitem"] input')
        print(f"Kitne fields mile: {len(inputs)}")
        
        if len(inputs) == 0:
            print("Koi field nahi mila - selectors check karte hain")
            # Page ka HTML print karo debug ke liye
            all_inputs = page.query_selector_all('input')
            print(f"Total inputs on page: {len(all_inputs)}")
        
        for i, input_field in enumerate(inputs[:len(user_data)]):
            value = user_data[i]
            input_field.click()
            input_field.fill(value)
            print(f"Field {i+1} fill ho gaya: {value}")
            page.wait_for_timeout(500)
        
        page.wait_for_timeout(3000)
        browser.close()
        print("Done!")

fill_form()