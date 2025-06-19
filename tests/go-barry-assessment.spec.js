import { test, expect } from '@playwright/test';

test.describe('Go BARRY App Assessment', () => {
  test('should load main page and check for login functionality', async ({ page }) => {
    // Navigate to Go BARRY
    await page.goto('/browser-main');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for assessment
    await page.screenshot({ path: 'go-barry-main.png' });
    
    // Check if we can find login elements
    const loginButton = page.locator('text=Login').or(page.locator('button:has-text("Login")'));
    const badgeInput = page.locator('input[placeholder*="badge"]').or(page.locator('input[type="text"]'));
    
    console.log('Page title:', await page.title());
    console.log('Login button visible:', await loginButton.isVisible().catch(() => false));
    console.log('Badge input visible:', await badgeInput.isVisible().catch(() => false));
  });

  test('should check display screen functionality', async ({ page }) => {
    // Navigate to display screen
    await page.goto('/display-screen');
    
    // Wait for content
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'display-screen.png' });
    
    // Check for common display elements
    const mapElement = page.locator('#map').or(page.locator('.map-container'));
    const alertsList = page.locator('.alerts').or(page.locator('[data-testid="alerts"]'));
    
    console.log('Display screen loaded');
    console.log('Map visible:', await mapElement.isVisible().catch(() => false));
    console.log('Alerts visible:', await alertsList.isVisible().catch(() => false));
  });
});
