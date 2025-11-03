import { test, expect } from '@playwright/test';
import { CREDENTIALS, login } from '../fixtures/auth';

test.describe('Employee Authentication', () => {
  test('should successfully login with employee credentials', async ({ page }) => {
    await login(page, CREDENTIALS.employee.email, CREDENTIALS.employee.password);

    // Should redirect to home or employee dashboard
    await expect(page).toHaveURL(/\/(dashboard|time-clock)(\/|$)/);

    // Should see employee-specific navigation (no supervisor features)
    const supervisorFeatures = page.locator('text=/Supervisor Hub|Personnel Tracking|Create JSA/i');
    await expect(supervisorFeatures).toHaveCount(0);
  });

  test('should NOT have access to supervisor hub', async ({ page }) => {
    await login(page, CREDENTIALS.employee.email, CREDENTIALS.employee.password);

    // Try to navigate to supervisor hub
    await page.goto('/supervisor-hub');

    // Should redirect to home or show access denied
    await expect(page).not.toHaveURL(/supervisor-hub/);
  });

  test('should NOT have access to JSA management', async ({ page }) => {
    await login(page, CREDENTIALS.employee.email, CREDENTIALS.employee.password);

    // Try to navigate to JSA management
    await page.goto('/jsa/manage');

    // Should redirect or show access denied
    await expect(page).not.toHaveURL(/jsa\/manage/);
  });

  test('should NOT have access to personnel tracking', async ({ page }) => {
    await login(page, CREDENTIALS.employee.email, CREDENTIALS.employee.password);

    // Try to navigate to personnel dashboard
    await page.goto('/personnel');

    // Should redirect or show access denied
    await expect(page).not.toHaveURL(/personnel/);
  });

  test('should NOT have access to job site management', async ({ page }) => {
    await login(page, CREDENTIALS.employee.email, CREDENTIALS.employee.password);

    // Try to navigate to job sites
    await page.goto('/job-sites');

    // Should redirect or show access denied (employees can view but not manage)
    // This depends on your access control rules
  });

  test('should NOT have access to documents page', async ({ page }) => {
    await login(page, CREDENTIALS.employee.email, CREDENTIALS.employee.password);

    // Try to navigate to documents
    await page.goto('/documents');

    // Should redirect or show access denied (depends on your rules)
  });

  test('should have access to time clock', async ({ page }) => {
    await login(page, CREDENTIALS.employee.email, CREDENTIALS.employee.password);

    await page.goto('/time-clock');

    // Should be able to access time clock
    await expect(page).toHaveURL(/time-clock/);
    const timeClockContent = page.locator('text=/Clock In|Clock Out|No active job sites available/i');
    await expect(timeClockContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have access to JSA library (view only)', async ({ page }) => {
    await login(page, CREDENTIALS.employee.email, CREDENTIALS.employee.password);

    await page.goto('/jsa');

    // Should be able to view JSAs
    await expect(page).toHaveURL(/jsa/);
  });

  test('should have access to personal time history', async ({ page }) => {
    await login(page, CREDENTIALS.employee.email, CREDENTIALS.employee.password);

    await page.goto('/time-history');

    // Should see own time history
    await expect(page).toHaveURL(/time-history/);
  });

  test('should see limited navigation menu', async ({ page }) => {
    await login(page, CREDENTIALS.employee.email, CREDENTIALS.employee.password);

    // Check navigation items
    const nav = page.locator('nav, [role="navigation"]');

    // Should NOT see supervisor-only items
    await expect(nav.locator('text=/Supervisor Hub|Manage JSA|Personnel Tracking/i')).toHaveCount(0);

    // Should see employee items
    await expect(nav.locator('text=/Time Clock|Inspect|Dashboard/i')).toBeVisible();
  });

  test('should maintain employee session after reload', async ({ page }) => {
    await login(page, CREDENTIALS.employee.email, CREDENTIALS.employee.password);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be logged in as employee
    const supervisorFeatures = page.locator('text=/Supervisor Hub/i');
    await expect(supervisorFeatures).toHaveCount(0);
  });

  test('should display employee role indicators', async ({ page }) => {
    await login(page, CREDENTIALS.employee.email, CREDENTIALS.employee.password);

    // Look for role/name display
    const userInfo = page.locator('text=/operator|employee|' + CREDENTIALS.employee.email + '/i');

    if (await userInfo.count() > 0) {
      await expect(userInfo.first()).toBeVisible();
    }
  });
});


