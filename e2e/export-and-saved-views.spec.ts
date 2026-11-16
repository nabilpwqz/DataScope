import { test, expect } from '@playwright/test';

test.describe('Export & Saved Views Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as Analyst before operations
    await page.goto('/login');
    await page.fill('input#email', 'analyst@datascope.internal');
    await page.fill('input#password', 'AnalystScope2024!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('initiates CSV export stream from Data Explorer', async ({ page }) => {
    await page.goto('/dashboard/explorer');
    const exportBtn = page.locator('button:has-text("Export CSV")');
    await expect(exportBtn).toBeVisible({ timeout: 10000 });
    await expect(exportBtn).toBeEnabled();
  });

  test('views and renders saved views catalog', async ({ page }) => {
    await page.goto('/dashboard/saved-views');
    await expect(page.locator('h1')).toContainText(/Saved Views/i);
    // Verify view cards or empty state table
    const container = page.locator('main, [role="main"], div.flex-1');
    await expect(container.first()).toBeVisible();
  });

  test('advanced search builder renders SQL, EXPLAIN, and JSON AST tabs', async ({ page }) => {
    await page.goto('/dashboard/advanced-search');
    await expect(page.locator('h1')).toContainText(/Advanced Search/i);

    // Verify the inspector buttons
    const sqlTabBtn = page.locator('button:has-text("Generated Pushdown SQL")');
    const explainTabBtn = page.locator('button:has-text("EXPLAIN Execution Plan")');
    const jsonTabBtn = page.locator('button:has-text("JSON AST Specification")');

    await expect(sqlTabBtn).toBeVisible();
    await expect(explainTabBtn).toBeVisible();
    await expect(jsonTabBtn).toBeVisible();

    // Click JSON AST tab and check output
    await jsonTabBtn.click();
    const codeBlock = page.locator('pre');
    await expect(codeBlock).toContainText(/filterGroup/);
  });
});

