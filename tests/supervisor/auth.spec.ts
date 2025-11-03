import { test, expect } from '@playwright/test';
import { CREDENTIALS, login, logout } from '../fixtures/auth';

test.describe('Supervisor Authentication', () => {
  test('should load login page successfully', async ({ page }) => {
    await page.goto('/');

    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check for app branding/title
    await expect(page).toHaveTitle(/Equipment Inspector Pro/i);
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(
      page.locator('text=/Authentication failed|invalid|incorrect|wrong|error/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login with supervisor credentials', async ({ page }) => {
    await login(page, CREDENTIALS.supervisor.email, CREDENTIALS.supervisor.password);

    // Should redirect to home or supervisor hub
    await expect(page).toHaveURL(/\/(supervisor-hub|dashboard|home)/);

    // Should see supervisor-specific navigation or content
    await expect(page.getByRole('heading', { name: /Supervisor Hub/i })).toBeVisible({
      timeout: 10000
    });
  });

  test('should access Supervisor Hub after login', async ({ page }) => {
    await login(page, CREDENTIALS.supervisor.email, CREDENTIALS.supervisor.password);

    // Navigate to supervisor hub
    await page.goto('/supervisor-hub');

    // Check for Management Tools section
    await expect(page.getByRole('heading', { name: /Management Tools/i })).toBeVisible();

    // Check for key supervisor features
    await expect(page.getByRole('link', { name: /JSA Management/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Personnel Tracking/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Job Sites/i })).toBeVisible();
  });

  test('should successfully logout', async ({ page }) => {
    await login(page, CREDENTIALS.supervisor.email, CREDENTIALS.supervisor.password);

    // Find and click logout
    await logout(page);

    // Should redirect back to login
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('should maintain session after page reload', async ({ page, context }) => {
    await login(page, CREDENTIALS.supervisor.email, CREDENTIALS.supervisor.password);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be logged in
    await expect(page.getByRole('heading', { name: /Supervisor Hub/i })).toBeVisible({
      timeout: 10000
    });
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Try to access protected route without login
    await page.goto('/supervisor-hub');

    // Should redirect to login
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  });
});
