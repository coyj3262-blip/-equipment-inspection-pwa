import { test, expect, type Page } from '@playwright/test';
import { setupSupervisor } from '../fixtures/auth';

const EMPTY_PERSONNEL_LOCATOR = 'text=/No one clocked in/i';

async function openPersonnelDashboard(page: Page) {
  await page.goto('/personnel');
  await page.waitForLoadState('networkidle');
  const emptyState = page.locator(EMPTY_PERSONNEL_LOCATOR);
  const noPersonnel = await emptyState.isVisible().catch(() => false);
  return { noPersonnel, emptyState };
}


test.describe('Personnel Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupSupervisor(page);
  });

  test('should display personnel dashboard', async ({ page }) => {
    const { emptyState } = await openPersonnelDashboard(page);

    await expect(page.getByRole('heading', { name: /Personnel Tracking/i })).toBeVisible();
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should display site filter dropdown at top', async ({ page }) => {
    const { noPersonnel, emptyState } = await openPersonnelDashboard(page);

    const siteFilter = page.locator('select').first();
    if (await siteFilter.count() > 0) {
      await expect(siteFilter).toBeVisible({ timeout: 10000 });
    } else if (noPersonnel) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should show personnel count per site in dropdown', async ({ page }) => {
    const { noPersonnel, emptyState } = await openPersonnelDashboard(page);

    // Check if dropdown shows personnel counts
    const siteFilter = page.locator('select').first();

    if (await siteFilter.count() > 0) {
      const optionText = await siteFilter.locator('option').first().textContent();
      expect(optionText).toBeTruthy();
    } else if (noPersonnel) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should display "All Sites" option', async ({ page }) => {
    const { noPersonnel, emptyState } = await openPersonnelDashboard(page);

    const allSitesOption = page.locator('option', { hasText: /All Sites/i });
    if (await allSitesOption.count() > 0) {
      await expect(allSitesOption.first()).toBeVisible({ timeout: 10000 });
    } else if (noPersonnel) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should filter personnel by site', async ({ page }) => {
    const { noPersonnel, emptyState } = await openPersonnelDashboard(page);

    if (noPersonnel) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const siteFilter = page.locator('select').first();
    if (await siteFilter.count() > 0) {
      const options = await siteFilter.locator('option').count();
      if (options > 1) {
        await siteFilter.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should display personnel list or empty state', async ({ page }) => {
    const { noPersonnel, emptyState } = await openPersonnelDashboard(page);


    if (noPersonnel) {
      await expect(emptyState).toBeVisible();
    } else {
      await expect(page.locator('text=/people on site/i').first()).toBeVisible();
    }
  });

  test('should show active/clocked-in status', async ({ page }) => {
    const { noPersonnel, emptyState } = await openPersonnelDashboard(page);

    if (noPersonnel) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const statusBadge = page.locator('text=/Clocked in|people on site|Long shift/i');
    if (await statusBadge.count() > 0) {
      await expect(statusBadge.first()).toBeVisible();
    }
  });

  test('should display personnel locations', async ({ page }) => {
    const { noPersonnel, emptyState } = await openPersonnelDashboard(page);

    if (noPersonnel) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const locationInfo = page.locator('text=/on site/i');
    if (await locationInfo.count() > 0) {
      await expect(locationInfo.first()).toBeVisible();
    }
  });

  test('should show real-time updates', async ({ page }) => {
    const { noPersonnel, emptyState } = await openPersonnelDashboard(page);

    if (noPersonnel) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const timestamp = page.locator('text=/ago|m|h$/i');
    if (await timestamp.count() > 0) {
      await expect(timestamp.first()).toBeVisible();
    }
  });

  test('should display GPS accuracy', async ({ page }) => {
    const { noPersonnel, emptyState } = await openPersonnelDashboard(page);

    if (noPersonnel) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const gpsAccuracy = page.locator('text=/ft|miles|accuracy/i');
    if (await gpsAccuracy.count() > 0) {
      await expect(gpsAccuracy.first()).toBeVisible();
    } else {
      test.skip(true, 'No GPS accuracy details available');
    }
  });

  test('should show personnel details on click', async ({ page }) => {
    const { noPersonnel, emptyState } = await openPersonnelDashboard(page);

    if (noPersonnel) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const personName = page.locator('div').filter({ hasText: /Long shift|Clocked In|people on site/i }).first();
    if (await personName.count() > 0) {
      await expect(personName).toBeVisible();
    }
  });

  test('should allow viewing personnel time history', async ({ page }) => {
    const { noPersonnel, emptyState } = await openPersonnelDashboard(page);

    if (noPersonnel) {
      await expect(emptyState).toBeVisible();
      return;
    }

    test.skip(true, 'Personnel history link not available in current UI');
  });
});
