import { test, expect } from '@playwright/test';

test.describe('Data Explorer & Search Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as Analyst before testing explorer
    await page.goto('/login');
    await page.fill('input#email', 'analyst@datascope.internal');
    await page.fill('input#password', 'AnalystScope2024!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('loads explorer table and displays live records count', async ({ page }) => {
    await page.goto('/dashboard/explorer');
    
    // Check page header
    await expect(page.locator('h1')).toContainText(/Data Explorer/i);

    // Verify virtual table renders rows
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
    const count = await tableRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('filters dataset records by search query and updates URL parameters', async ({ page }) => {
    await page.goto('/dashboard/explorer');

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search records"]');
    await searchInput.fill('Healthcare');

    // Wait for debounced search and URL sync
    await page.waitForURL(/search=Healthcare/, { timeout: 5000 });
    expect(page.url()).toContain('search=Healthcare');
  });

  test('paginates forward and restores state on browser back/forward', async ({ page }) => {
    await page.goto('/dashboard/explorer');

    // Check pagination exists
    const nextBtn = page.locator('button:has-text("Next")');
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForURL(/page=2/, { timeout: 5000 });
      expect(page.url()).toContain('page=2');

      // Test browser back button navigation
      await page.goBack();
      await page.waitForURL(/page=1|^((?!page=2).)*$/, { timeout: 5000 });
    }
  });
});

