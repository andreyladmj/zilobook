import unittest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys

class ZilobookFlowTest(unittest.TestCase):
    def setUp(self):
        # Configure Chrome to run headlessly or normally
        options = webdriver.ChromeOptions()
        # Uncomment the line below to run headlessly
        # options.add_argument("--headless")
        options.add_argument("--window-size=1440,900")
        options.add_argument("--disable-gpu")
        
        self.driver = webdriver.Chrome(options=options)
        self.driver.implicitly_wait(10)
        self.base_url = "http://localhost:3000"

    def tearDown(self):
        self.driver.quit()

    def test_professional_workflow(self):
        driver = self.driver
        
        # 1. Open Landing Page and Check Theme Switchers
        print("Navigating to landing page...")
        driver.get(self.base_url)
        self.assertIn("Zilobook", driver.title)
        
        # Verify landing page loads and contains logo/brand Z
        brand_link = driver.find_element(By.LINK_TEXT, "Z")
        self.assertTrue(brand_link.is_displayed())

        # 2. Navigate to Login Page
        print("Navigating to Login Page...")
        login_btn = driver.find_element(By.LINK_TEXT, "Log In")
        login_btn.click()
        
        # Wait for login URL
        WebDriverWait(driver, 5).until(EC.url_contains("/login"))
        
        # 3. Fill and Submit Credentials
        print("Entering Professional credentials...")
        phone_input = driver.find_element(By.XPATH, "//input[@type='tel' or @placeholder='+380...']")
        password_input = driver.find_element(By.XPATH, "//input[@type='password']")
        
        # Clear fields (cmd+A or ctrl+A then backspace to ensure pre-filled credentials are removed)
        phone_input.send_keys(Keys.CONTROL + "a")
        phone_input.send_keys(Keys.BACKSPACE)
        phone_input.send_keys("+380501110001")
        
        password_input.send_keys(Keys.CONTROL + "a")
        password_input.send_keys(Keys.BACKSPACE)
        password_input.send_keys("password123")
        
        # Submit form
        submit_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Sign In') or contains(text(), 'Log In')]")
        submit_btn.click()
        
        # Wait for redirect to Dashboard
        print("Waiting for Dashboard redirection...")
        WebDriverWait(driver, 10).until(EC.url_contains("/dashboard"))
        self.assertIn("/dashboard", driver.current_url)
        print("Logged in successfully as Professional!")

        # 4. Walkthrough Dashboard Sidebar Sections
        sidebar_sections = ["Dashboard", "Calendar", "Locations", "Staff", "Clients", "Settings"]
        for section in sidebar_sections:
            print(f"Testing sidebar link: {section}")
            link = driver.find_element(By.XPATH, f"//a[contains(., '{section}')]")
            link.click()
            time.sleep(1) # wait briefly for page render
            
            # Simple page assertions
            if section == "Settings":
                self.assertIn("/dashboard/settings", driver.current_url)
                # Verify settings inputs are displayed
                lead_time_input = driver.find_element(By.XPATH, "//input[@type='number']")
                self.assertTrue(lead_time_input.is_displayed())
            elif section == "Calendar":
                self.assertIn("/dashboard/calendar", driver.current_url)

        # 5. Create a New Slot on Calendar page
        print("Navigating to Calendar slot creator...")
        driver.get(f"{self.base_url}/dashboard/calendar/new?date=2026-06-12&time=14:00")
        
        # Wait for form to load
        WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Create New Slot')]")))
        
        # Fill in Notes / Details
        notes_textarea = driver.find_element(By.XPATH, "//textarea")
        notes_textarea.send_keys("Selenium Test Slot - Open")
        
        # Click Create Appointment Button
        create_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Create Appointment')]")
        create_btn.click()
        
        # Wait for redirection back to calendar
        print("Waiting for redirection after slot creation...")
        WebDriverWait(driver, 10).until(EC.url_contains("/dashboard/calendar"))
        
        # 6. Log out
        print("Logging out...")
        # Find Sign Out button in sidebar (the bottom item)
        sign_out_btn = driver.find_element(By.XPATH, "//button[contains(., 'Sign Out')]")
        sign_out_btn.click()
        
        # Wait for landing page redirect
        WebDriverWait(driver, 5).until(EC.url_to_be(f"{self.base_url}/"))
        print("Logged out successfully!")

    def test_client_login(self):
        driver = self.driver
        print("Testing Client Login...")
        driver.get(f"{self.base_url}/login")
        
        phone_input = driver.find_element(By.XPATH, "//input[@type='tel' or @placeholder='+380...']")
        password_input = driver.find_element(By.XPATH, "//input[@type='password']")
        
        # Clear fields
        phone_input.send_keys(Keys.CONTROL + "a")
        phone_input.send_keys(Keys.BACKSPACE)
        phone_input.send_keys("+380504440001")
        
        password_input.send_keys(Keys.CONTROL + "a")
        password_input.send_keys(Keys.BACKSPACE)
        password_input.send_keys("password123")
        
        submit_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Sign In') or contains(text(), 'Log In')]")
        submit_btn.click()
        
        # Client login redirects back to landing page or explore
        WebDriverWait(driver, 5).until(EC.url_to_be(f"{self.base_url}/"))
        print("Client logged in successfully!")

if __name__ == "__main__":
    unittest.main()
