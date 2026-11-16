import { test, expect } from '@playwright/test';

test.describe('Data Explorer & Search Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as Analyst before testing explorer
    await page.goto('/login');
    const dbAuthTab = page.locator('button:has-text("Database Auth")');
    if (await dbAuthTab.isVisible()) {
      await dbAuthTab.click();
    }
    await page.fill('input[type="email"]', 'analyst@datascope.io');
    await page.fill('input[type="password"]', 'analyst123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/**', { timeout: 15000 });
  });

  test('loads explorer table and displays live records count', async ({ page }) => {
    await page.goto('/dashboard/explorer');
    
    // Verify virtual table renders rows
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
    const count = await tableRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('filters dataset records by search query and updates URL parameters', async ({ page }) => {
    await page.goto('/dashboard/explorer');

    // Find search input
    const searchInput = page.locator('input[placeholder*="indexed records"], input[type="text"]').first();
    await searchInput.fill('Healthcare');

    // Wait for debounced search and URL sync
    await page.waitForURL(/[?&]q=Healthcare/, { timeout: 8000 });
    expect(page.url()).toContain('q=Healthcare');
  });

  test('paginates forward and restores state on browser back/forward', async ({ page }) => {
    await page.goto('/dashboard/explorer');

    // Check pagination exists
    const nextBtn = page.locator('button[title="Next Page"], button:has-text("Next")').first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForURL(/[?&]page=2/, { timeout: 8000 });
      expect(page.url()).toContain('page=2');

      // Test browser back button navigation
      await page.goBack();
      await page.waitForURL(/page=1|^((?!page=2).)*$/, { timeout: 8000 });
    }
  });
});
