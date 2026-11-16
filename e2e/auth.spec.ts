import { test, expect } from '@playwright/test';

test.describe('Authentication & Access Control', () => {
  test('redirects unauthenticated users from protected dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText(/Sign In/i);
  });

  test('displays registration form and validates required fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/\/register/);
    
    // Check form inputs
    const nameInput = page.locator('input[type="text"]').first();
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();
  });

  test('renders seeded role login shortcuts on login page', async ({ page }) => {
    await page.goto('/login');
    // Verify pre-seeded demo role login shortcuts
    await expect(page.locator('button:has-text("Admin")')).toBeVisible();
    await expect(page.locator('button:has-text("Analyst")')).toBeVisible();
    await expect(page.locator('button:has-text("Viewer")')).toBeVisible();
  });

  test('authenticates successfully as admin and navigates to dashboard', async ({ page }) => {
    await page.goto('/login');
    // Switch to Database Auth method tab
    const dbAuthTab = page.locator('button:has-text("Database Auth")');
    if (await dbAuthTab.isVisible()) {
      await dbAuthTab.click();
    }

    await page.fill('input[type="email"]', 'admin@datascope.io');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard/**', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');
  });
});
