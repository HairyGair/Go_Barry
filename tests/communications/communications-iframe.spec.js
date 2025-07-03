// tests/communications/communications-iframe.spec.js
// Communications Platform iframe integration tests

import { test, expect } from '@playwright/test';

test.describe('Communications Platform - iframe Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the communications platform
    await page.goto('/');
    
    // Login as supervisor for testing
    await page.click('[data-testid="supervisor-screen-button"]');
    
    // Wait for login form and authenticate
    await page.fill('[data-testid="badge-input"]', 'AG003');
    await page.click('[data-testid="login-button"]');
    
    // Wait for supervisor screen to load
    await page.waitForSelector('[data-testid="communications-button"]');
    
    // Click Communications button
    await page.click('[data-testid="communications-button"]');
    
    // Wait for communications platform to load
    await page.waitForSelector('[data-testid="communications-platform"]');
  });

  test('should load Email Integration iframe', async ({ page }) => {
    // Click Email Integration tile
    await page.click('[data-testid="email-integration-tile"]');
    
    // Wait for iframe to appear
    const iframe = page.frameLocator('[data-testid="email-iframe"]');
    
    // Check if iframe loads (may show Outlook login)
    await expect(iframe.locator('body')).toBeVisible({ timeout: 10000 });
    
    // Check for either Outlook interface or login form
    const outlookElements = [
      iframe.locator('[data-testid="outlook-interface"]'),
      iframe.locator('input[type="email"]'),
      iframe.locator('.ms-Signin'),
      iframe.locator('[aria-label*="email"]')
    ];
    
    // At least one Outlook-related element should be present
    let foundOutlookElement = false;
    for (const element of outlookElements) {
      try {
        await element.waitFor({ timeout: 3000 });
        foundOutlookElement = true;
        break;
      } catch (e) {
        // Continue checking other elements
      }
    }
    
    expect(foundOutlookElement).toBe(true);
  });

  test('should load 8x8 VoIP iframe', async ({ page }) => {
    // Click 8x8 VoIP tile
    await page.click('[data-testid="voip-integration-tile"]');
    
    // Wait for iframe to appear
    const iframe = page.frameLocator('[data-testid="voip-iframe"]');
    
    // Check if iframe loads (may show 8x8 login)
    await expect(iframe.locator('body')).toBeVisible({ timeout: 10000 });
    
    // Check for 8x8-related elements
    const voipElements = [
      iframe.locator('[data-testid="8x8-interface"]'),
      iframe.locator('input[type="tel"]'),
      iframe.locator('.voip-dialer'),
      iframe.locator('[class*="8x8"]'),
      iframe.locator('[aria-label*="phone"]'),
      iframe.locator('[aria-label*="call"]')
    ];
    
    // At least one VoIP-related element should be present
    let foundVoipElement = false;
    for (const element of voipElements) {
      try {
        await element.waitFor({ timeout: 3000 });
        foundVoipElement = true;
        break;
      } catch (e) {
        // Continue checking other elements
      }
    }
    
    expect(foundVoipElement).toBe(true);
  });

  test('should load SharePoint iframe', async ({ page }) => {
    // Click SharePoint tile
    await page.click('[data-testid="sharepoint-integration-tile"]');
    
    // Wait for iframe to appear
    const iframe = page.frameLocator('[data-testid="sharepoint-iframe"]');
    
    // Check if iframe loads
    await expect(iframe.locator('body')).toBeVisible({ timeout: 10000 });
    
    // Check for SharePoint-related elements
    const sharepointElements = [
      iframe.locator('[data-testid="sharepoint-interface"]'),
      iframe.locator('[class*="sharepoint"]'),
      iframe.locator('[class*="sp-"]'),
      iframe.locator('[aria-label*="sharepoint"]'),
      iframe.locator('[title*="SharePoint"]')
    ];
    
    // At least one SharePoint-related element should be present
    let foundSharePointElement = false;
    for (const element of sharepointElements) {
      try {
        await element.waitFor({ timeout: 3000 });
        foundSharePointElement = true;
        break;
      } catch (e) {
        // Continue checking other elements
      }
    }
    
    expect(foundSharePointElement).toBe(true);
  });

  test('should handle iframe errors gracefully', async ({ page }) => {
    // Intercept iframe requests and simulate network error
    await page.route('**/apps.8x8.com/**', route => {
      route.abort('failed');
    });
    
    // Click VoIP tile (should show error handling)
    await page.click('[data-testid="voip-integration-tile"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="iframe-error-message"]')).toBeVisible();
    
    // Should show retry button
    await expect(page.locator('[data-testid="iframe-retry-button"]')).toBeVisible();
  });

  test('should switch between communication components', async ({ page }) => {
    // Test navigation between different communication tools
    
    // Start with Ticketer
    await page.click('[data-testid="ticketer-tile"]');
    await expect(page.locator('[data-testid="ticketer-interface"]')).toBeVisible();
    
    // Switch to Email
    await page.click('[data-testid="email-integration-tile"]');
    await expect(page.locator('[data-testid="email-iframe"]')).toBeVisible();
    
    // Switch to VoIP
    await page.click('[data-testid="voip-integration-tile"]');
    await expect(page.locator('[data-testid="voip-iframe"]')).toBeVisible();
    
    // Switch back to Ticketer
    await page.click('[data-testid="ticketer-tile"]');
    await expect(page.locator('[data-testid="ticketer-interface"]')).toBeVisible();
  });

  test('should log communication activities', async ({ page }) => {
    // Click Ticketer and send a test message
    await page.click('[data-testid="ticketer-tile"]');
    
    // Fill in message details
    await page.fill('[data-testid="message-input"]', 'Test message for drivers');
    await page.selectOption('[data-testid="route-select"]', '21');
    
    // Send message
    await page.click('[data-testid="send-message-button"]');
    
    // Check for success confirmation
    await expect(page.locator('[data-testid="message-sent-confirmation"]')).toBeVisible();
    
    // Verify activity was logged (could check backend or UI indicator)
    await expect(page.locator('[data-testid="recent-activity"]')).toContainText('Message sent');
  });
});

test.describe('Communications Platform - Responsive Design', () => {
  test('should adapt to mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.click('[data-testid="supervisor-screen-button"]');
    
    // Login
    await page.fill('[data-testid="badge-input"]', 'AG003');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to communications
    await page.click('[data-testid="communications-button"]');
    
    // Check mobile layout
    await expect(page.locator('[data-testid="communications-platform"]')).toHaveClass(/mobile-layout/);
    
    // Communication tiles should stack vertically
    const tiles = page.locator('[data-testid*="-tile"]');
    const firstTile = tiles.first();
    const secondTile = tiles.nth(1);
    
    const firstBox = await firstTile.boundingBox();
    const secondBox = await secondTile.boundingBox();
    
    // Second tile should be below first tile (stacked)
    expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height);
  });

  test('should adapt to tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    await page.click('[data-testid="supervisor-screen-button"]');
    
    // Login
    await page.fill('[data-testid="badge-input"]', 'AG003');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to communications
    await page.click('[data-testid="communications-button"]');
    
    // Check tablet layout
    await expect(page.locator('[data-testid="communications-platform"]')).toHaveClass(/tablet-layout/);
  });
});

test.describe('Communications Platform - Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="supervisor-screen-button"]');
    
    // Login
    await page.fill('[data-testid="badge-input"]', 'AG003');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to communications
    await page.click('[data-testid="communications-button"]');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    // First focusable element should receive focus
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Continue tabbing through all communication tiles
    const tiles = page.locator('[data-testid*="-tile"]');
    const tileCount = await tiles.count();
    
    for (let i = 0; i < tileCount; i++) {
      await page.keyboard.press('Tab');
      // Each tile should be focusable
      const currentFocus = page.locator(':focus');
      await expect(currentFocus).toBeVisible();
    }
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="supervisor-screen-button"]');
    
    // Login
    await page.fill('[data-testid="badge-input"]', 'AG003');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to communications
    await page.click('[data-testid="communications-button"]');
    
    // Check ARIA labels on main elements
    await expect(page.locator('[data-testid="communications-platform"]')).toHaveAttribute('aria-label');
    await expect(page.locator('[data-testid="ticketer-tile"]')).toHaveAttribute('aria-label');
    await expect(page.locator('[data-testid="email-integration-tile"]')).toHaveAttribute('aria-label');
    await expect(page.locator('[data-testid="voip-integration-tile"]')).toHaveAttribute('aria-label');
  });
});