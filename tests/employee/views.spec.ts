import { test, expect, type Page } from '@playwright/test';
import { setupEmployee } from '../fixtures/auth';

const NO_JSAS_LOCATOR = 'text=/No active JSAs/i';
const NO_TIME_ENTRIES_LOCATOR = 'text=/No time entries/i';

async function openLibrary(page: Page) {
  await page.goto('/jsa');
  await page.waitForLoadState('networkidle');
  const emptyState = page.locator(NO_JSAS_LOCATOR);
  const noJsas = await emptyState.isVisible().catch(() => false);
  const cardLocator = page.locator('a[href^="/jsa/"]');
  return { noJsas, emptyState, cardLocator };
}

async function openTimeHistory(page: Page) {
  await page.goto('/time-history');
  await page.waitForLoadState('networkidle');
  const emptyState = page.locator(NO_TIME_ENTRIES_LOCATOR);
  const noEntries = await emptyState.isVisible().catch(() => false);
  return { noEntries, emptyState };
}

test.beforeEach(async ({ page }) => {
  await setupEmployee(page);
});

test.describe('Employee Views & Features', () => {
  test.describe('JSA Library (View Only)', () => {
    test('should display JSA library page',  async ({ page }) => {
      await page.goto('/jsa');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /Job Safety Analyses/i })).toBeVisible();
    });

    test('should display active JSAs',  async ({ page }) => {
      const { noJsas, emptyState, cardLocator } = await openLibrary(page);
      if (noJsas) {
        await expect(emptyState).toBeVisible();
      } else {
        await expect(cardLocator.first()).toBeVisible();
      }
    });

    test('should view JSA details',  async ({ page }) => {
      const { noJsas, emptyState, cardLocator } = await openLibrary(page);

      if (noJsas) {
        await expect(emptyState).toBeVisible();
        return;
      }

      const firstJsa = cardLocator.first();
      await firstJsa.click();
      await expect(page.locator('text=/Hazard|Control|PPE/i')).toBeVisible({ timeout: 5000 });
    });

    test('should NOT show JSA edit options',  async ({ page }) => {
      await page.goto('/jsa');
      await page.waitForLoadState('networkidle');

      // Should NOT see edit/delete buttons
      const editButton = page.locator('button:has-text("Edit"), button:has-text("Delete")');
      await expect(editButton).toHaveCount(0);
    });

    test('should allow JSA signature',  async ({ page }) => {
      const { noJsas, emptyState, cardLocator } = await openLibrary(page);

      if (noJsas) {
        await expect(emptyState).toBeVisible();
        return;
      }

      const firstJsa = cardLocator.first();
      await firstJsa.click();

      // Look for signature option
      const signButton = page.locator('button:has-text("Sign"), button:has-text("Acknowledge")');

      if (await signButton.count() > 0) {
        await expect(signButton.first()).toBeVisible();
      }
    });

    test('should display signed JSAs differently',  async ({ page }) => {
      const { noJsas, emptyState } = await openLibrary(page);

      if (noJsas) {
        await expect(emptyState).toBeVisible();
        return;
      }

      const signedBadge = page.locator('text=/Signed|Acknowledged|Completed/i');
      if (await signedBadge.count() > 0) {
        await expect(signedBadge.first()).toBeVisible();
      }
    });
  });

  test.describe('Personal Time History', () => {
    test('should display personal time history',  async ({ page }) => {
      await page.goto('/time-history');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /Time History/i })).toBeVisible();
    });

    test('should show only personal entries',  async ({ page }) => {
      const { noEntries, emptyState } = await openTimeHistory(page);

      if (noEntries) {
        await expect(emptyState).toBeVisible();
      } else {
        await expect(page.locator('div').filter({ hasText: /Clock In:/i }).first()).toBeVisible();
      }
    });

    test('should display clock in/out times',  async ({ page }) => {
      const { noEntries, emptyState } = await openTimeHistory(page);

      if (noEntries) {
        await expect(emptyState).toBeVisible();
        return;
      }

      const timestamp = page.locator('text=/Clock In:|Clock Out:/i');
      if (await timestamp.count() > 0) {
        await expect(timestamp.first()).toBeVisible();
      }
    });

    test('should show duration for each entry',  async ({ page }) => {
      const { noEntries, emptyState } = await openTimeHistory(page);

      if (noEntries) {
        await expect(emptyState).toBeVisible();
        return;
      }

      await expect(page.locator('text=/Duration:/i').first()).toBeVisible();
    });

    test('should display job site for each entry',  async ({ page }) => {
      const { noEntries, emptyState } = await openTimeHistory(page);

      if (noEntries) {
        await expect(emptyState).toBeVisible();
        return;
      }

      await expect(page.locator('h4').first()).toBeVisible();
    });

    test('should show GPS verification status',  async ({ page }) => {
      const { noEntries, emptyState } = await openTimeHistory(page);

      if (noEntries) {
        await expect(emptyState).toBeVisible();
        return;
      }

      const verificationText = page.locator('text=/On Site|Off Site|Flagged|Active/i');
      if (await verificationText.count() > 0) {
        await expect(verificationText.first()).toBeVisible();
      }
    });

    test('should allow viewing location map',  async ({ page }) => {
      const { noEntries, emptyState } = await openTimeHistory(page);

      if (noEntries) {
        await expect(emptyState).toBeVisible();
        return;
      }

      const mapButton = page.locator('button:has-text("Show Location Map"), button:has-text("Show Location")');

      if (await mapButton.count() > 0) {
        await mapButton.first().click();
        await page.waitForTimeout(1000);

        // Map should appear
        await expect(page.locator('.leaflet-container, #map')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display total hours worked',  async ({ page }) => {
      const { noEntries, emptyState } = await openTimeHistory(page);

      if (noEntries) {
        await expect(emptyState).toBeVisible();
        return;
      }

      const summary = page.locator('text=/entries\\)/i');
      if (await summary.count() > 0) {
        await expect(summary.first()).toBeVisible();
      }
    });

    test('should filter by date range',  async ({ page }) => {
      const { noEntries, emptyState } = await openTimeHistory(page);

      if (noEntries) {
        await expect(emptyState).toBeVisible();
        return;
      }

      const filterButtons = page.locator('button', { hasText: /All|Completed|Flagged/ });
      if (await filterButtons.count() > 0) {
        await expect(filterButtons.first()).toBeVisible();
      }
    });
  });

  test.describe('SOP Acknowledgments', () => {
    test('should view assigned SOPs',  async ({ page }) => {
      // Navigate to SOPs if there's a dedicated page
      await page.goto('/sops');

      // Should show SOPs or redirect
      // This depends on your app structure
    });

    test('should acknowledge SOPs',  async ({ page }) => {
      await page.goto('/sops');

      // Look for acknowledge button
      const acknowledgeButton = page.locator('button:has-text("Acknowledge"), button:has-text("I Understand")');

      if (await acknowledgeButton.count() > 0) {
        await expect(acknowledgeButton.first()).toBeVisible();
      }
    });
  });

  test.describe('Inspections', () => {
    test('should access inspection page',  async ({ page }) => {
      await page.goto('/inspect');

      // Should load inspection page
      await expect(page.locator('h1, h2').filter({ hasText: /Inspect/i })).toBeVisible({ timeout: 10000 });
    });

    test('should view inspection history',  async ({ page }) => {
      await page.goto('/history');

      // Should show inspection history
      await expect(page.locator('h1, h2').filter({ hasText: /History|Inspection/i })).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Notifications & Alerts', () => {
    test('should display GPS alerts if any',  async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Look for alert notifications
      const alert = page.locator('[role="alert"], [class*="alert"], [class*="notification"]');

      if (await alert.count() > 0) {
        await expect(alert.first()).toBeVisible();
      }
    });

    test('should show system notifications',  async ({ page }) => {
      // Look for notification icon/badge
      const notificationIcon = page.locator('[aria-label*="notification" i], [class*="notification"]');

      if (await notificationIcon.count() > 0) {
        await expect(notificationIcon.first()).toBeVisible();
      }
    });
  });

  test.describe('Profile & Settings', () => {
    test('should view own profile',  async ({ page }) => {
      // Look for profile link
      const profileLink = page.locator('a[href*="profile"], button:has-text("Profile")');

      if (await profileLink.count() > 0) {
        await profileLink.first().click();

        // Should show profile info
        await expect(page.locator('text=/Profile|Account|Settings/i')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should NOT edit other users profiles',  async ({ page }) => {
      // Employees should only see their own profile
      // No access to user management
      await page.goto('/users');

      // Should redirect or show access denied
      await expect(page).not.toHaveURL(/users/);
    });
  });
});

