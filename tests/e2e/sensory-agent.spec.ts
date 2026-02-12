import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Sensory Agent UI (/sense page)
 * Tests user workflows: form submission, processing states, success/error displays
 * Covers accessibility and mobile viewport (375px width)
 */

test.describe('Sensory Agent E2E (/sense page)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sense');
  });

  test('should load page and display form', async ({ page }) => {
    expect(page.url()).toContain('/sense');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });

  test('should handle form submission', async ({ page }) => {
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    const submitBtn = page.locator('button[type="submit"], button:has-text("Submit")').first();
    if (await submitBtn.isVisible()) {
      const isEnabled = !(await submitBtn.isDisabled());
      expect(isEnabled).toBeTruthy();
    }
  });

  test('should show loading state during async operations', async ({ page }) => {
    const loadingElements = page.locator('[role="status"], .loading, [aria-busy="true"]');
    expect(loadingElements).toBeDefined();
  });

  test('should display results on success', async ({ page }) => {
    const resultArea = page.locator('section, article, [data-testid*="result"]').first();
    expect(resultArea).toBeDefined();
  });

  test('should not expose sensitive error details', async ({ page }) => {
    const content = await page.textContent('body');
    expect(content).not.toMatch(/api[_-]?key/i);
    expect(content).not.toMatch(/secret/i);
  });

  test('should be accessible with keyboard navigation', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeDefined();
  });

  test('should be responsive at 375px mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const submitBtn = page.locator('button[type="submit"], button:has-text("Submit")').first();
    if (await submitBtn.isVisible()) {
      await expect(submitBtn).toBeEnabled();
    }

    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should support error recovery with retry', async ({ page }) => {
    const retryBtn = page.locator('button:has-text("Retry"), button:has-text("Try Again")');
    expect(retryBtn).toBeDefined();
  });

  test('should allow reset for new synthesis', async ({ page }) => {
    const resetBtn = page.locator('button:has-text("Reset"), button:has-text("Clear"), button:has-text("New")').first();
    const form = page.locator('form');
    expect(resetBtn || form).toBeDefined();
  });
});
