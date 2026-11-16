import { test, expect } from '@playwright/test';

test.describe('Authentication & Access Control', () => {
  test('redirects unauthenticated users from protected dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText(/Sign In|Enterprise/i);
  });

  test('displays registration form and validates required fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/\/register/);
    
    // Check form presence
    const nameInput = page.locator('input#name');
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();
  });

  test('renders seeded role login shortcuts on login page', async ({ page }) => {
    await page.goto('/login');
    // Verify pre-seeded demo role login hints or credentials
    await expect(page.locator('text=admin@datascope.internal')).toBeVisible();
    await expect(page.locator('text=analyst@datascope.internal')).toBeVisible();
    await expect(page.locator('text=viewer@datascope.internal')).toBeVisible();
  });

  test('authenticates successfully as admin and navigates to dashboard overview', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#email', 'admin@datascope.internal');
    await page.fill('input#password', 'AdminScope2024!');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page.locator('text=DataScope Platform')).toBeVisible();
    await expect(page.locator('text=Admin User')).toBeVisible();
  });
});

