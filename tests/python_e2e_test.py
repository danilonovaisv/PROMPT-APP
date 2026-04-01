from playwright.sync_api import sync_playwright
import sys

def run_test():
    print("Starting playwright test...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print("Navigating to http://localhost:5173...")
        page.goto('http://localhost:5173')
        
        print("Waiting for networkidle...")
        page.wait_for_load_state('networkidle')
        
        title = page.title()
        print(f"Page title: {title}")
        
        # Save a screenshot
        page.screenshot(path='/tmp/inspect.png', full_page=True)
        print("Screenshot saved to /tmp/inspect.png")
        
        # Check if basic elements are present
        body_text = page.locator('body').inner_text()
        print(f"Body text snippet: {body_text[:100]}...")
        
        # Look for headers or specific text
        if "PROMPT-APP" in title or "Carregando" in body_text:
            print("TEST SUCCESS: Page loaded successfully.")
        else:
            print("WARNING: Might not have loaded the correct application content.")
            
        browser.close()

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        print(f"Test failed with error: {e}")
        sys.exit(1)
