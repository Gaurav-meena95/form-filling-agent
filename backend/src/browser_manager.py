from playwright.async_api import async_playwright
import os

class BrowserManager:
    _instance = None
    
    def __init__(self):
        self.playwright = None
        self.context = None
        self.is_connected = False
        self.user_data_dir = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), 
            "..", 
            "user_data"
        )
        
    @classmethod
    async def get_instance(cls):
        if cls._instance is None:
            cls._instance = BrowserManager()
            await cls._instance._setup()
        return cls._instance
    
    async def _setup(self):
        """Launch persistent browser - saves login sessions in user_data folder"""
        os.makedirs(self.user_data_dir, exist_ok=True)
        self.playwright = await async_playwright().start()
        
        print("Launching persistent browser...")
        self.context = await self.playwright.chromium.launch_persistent_context(
            user_data_dir=self.user_data_dir,
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--start-maximized"
            ],
            slow_mo=300
        )
        self.is_connected = True
        print("Browser launched! Login sessions will be saved automatically.")
        
    async def get_page(self):
        """Open a new tab in the persistent browser"""
        try:
            if not self.context:
                await self._setup()
            return await self.context.new_page()
        except Exception as e:
            print(f"Page creation failed: {e}. Re-initializing...")
            BrowserManager._instance = None
            await self._setup()
            return await self.context.new_page()

    async def close(self):
        """Clean shutdown"""
        try:
            if self.context:
                await self.context.close()
        except:
            pass
        try:
            if self.playwright:
                await self.playwright.stop()
        except:
            pass
        BrowserManager._instance = None