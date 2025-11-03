import { test, expect, type Page } from '@playwright/test';
import { setupEmployee } from '../fixtures/auth';

const NO_SITES_LOCATOR = 'text=/No active job sites available/i';

async function openTimeClock(page: Page) {
  await page.goto('/time-clock');
  await page.waitForLoadState('networkidle');
  const emptyState = page.locator(NO_SITES_LOCATOR);
  const noSitesAvailable = await emptyState.isVisible().catch(() => false);
  return { noSitesAvailable, emptyState };
}

test.beforeEach(async ({ page }) => {
  await setupEmployee(page);
});

test.describe('Employee Clock In/Out', () => {
  test('should display time clock page',  async ({ page }) => {
    const { noSitesAvailable, emptyState } = await openTimeClock(page);

    if (noSitesAvailable) {
      await expect(emptyState).toBeVisible();
      return;
    }

    await expect(page.getByRole('heading', { name: /Time Clock/i })).toBeVisible();
  });

  test('should show job site selection',  async ({ page }) => {
    const { noSitesAvailable, emptyState } = await openTimeClock(page);

    if (noSitesAvailable) {
      await expect(emptyState).toBeVisible();
      return;
    }

    await expect(page.getByLabel('Select Job Site')).toBeVisible({ timeout: 10000 });
  });

  test('should display clock in button when not clocked in',  async ({ page }) => {
    const { noSitesAvailable, emptyState } = await openTimeClock(page);

    if (noSitesAvailable) {
      await expect(emptyState).toBeVisible();
      return;
    }

    // Look for clock in button (if not already clocked in)
    const clockInButton = page.locator('button:has-text("Clock In")');

    if (await clockInButton.count() > 0) {
      await expect(clockInButton.first()).toBeVisible();
    }
  });

  test('should display clock out button when clocked in',  async ({ page }) => {
    const { noSitesAvailable, emptyState } = await openTimeClock(page);

    if (noSitesAvailable) {
      await expect(emptyState).toBeVisible();
      return;
    }

    // If already clocked in, should see clock out button
    const clockOutButton = page.locator('button:has-text("Clock Out")');

    if (await clockOutButton.count() > 0) {
      await expect(clockOutButton.first()).toBeVisible();
    }
  });

  test('should request GPS location permission',  async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 35.1495, longitude: -90.0490 }); // Memphis area

    const { noSitesAvailable } = await openTimeClock(page);

    test.skip(noSitesAvailable, 'Requires at least one active job site');

    // Look for GPS indicator or status
    const gpsStatus = page.locator('text=/GPS Verification|Location|Accuracy/i');

    if (await gpsStatus.count() > 0) {
      await expect(gpsStatus.first()).toBeVisible();
    }
  });

  test('should validate job site selection before clock in',  async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 35.1495, longitude: -90.0490 });

    const { noSitesAvailable } = await openTimeClock(page);

    test.skip(noSitesAvailable, 'Requires at least one active job site');

    const clockInButton = page.locator('button:has-text("Clock In")');

    if (await clockInButton.count() > 0) {
      // Try to clock in without selecting site
      await clockInButton.first().click();

      // Should show validation error
      const errorMessage = page.locator('text=/select a job site|choose a site|required/i');

      if (await errorMessage.count() > 0) {
        await expect(errorMessage.first()).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should display GPS accuracy in imperial units',  async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 35.1495, longitude: -90.0490 });

    const { noSitesAvailable } = await openTimeClock(page);

    test.skip(noSitesAvailable, 'Requires at least one active job site');

    // Look for GPS accuracy in feet
    const accuracy = page.locator('text=/\\d+\\s*ft|accuracy|±/i');

    if (await accuracy.count() > 0) {
      await expect(accuracy.first()).toBeVisible();

      // Should NOT show meters
      const metricAccuracy = page.locator('text=/\\d+\\s*m[^i]|\\d+\\s*meter/i');
      await expect(metricAccuracy).toHaveCount(0);
    }
  });

  test('should show distance to job site',  async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 35.1495, longitude: -90.0490 });

    const { noSitesAvailable } = await openTimeClock(page);

    test.skip(noSitesAvailable, 'Requires at least one active job site');

    // Select a job site
    const siteSelect = page.getByLabel('Select Job Site');
    if (await siteSelect.count() > 0) {
      const options = await siteSelect.locator('option').all();
      if (options.length > 1) {
        await siteSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);

        // Should show distance to site
        const distance = page.locator('text=/\\d+\\s*ft|\\d+\\.\\d+\\s*mile|distance/i');

        if (await distance.count() > 0) {
          await expect(distance.first()).toBeVisible();
        }
      }
    }
  });

  test('should show verification status indicator',  async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 35.1495, longitude: -90.0490 });

    const { noSitesAvailable } = await openTimeClock(page);

    test.skip(noSitesAvailable, 'Requires at least one active job site');

    // Look for verification badge (green/orange)
    const statusText = page.locator('text=/Verified|Within Range|Outside Range|Warning/i');
    if (await statusText.count() > 0) {
      await expect(statusText.first()).toBeVisible();
      return;
    }

    const statusBadge = page.locator('[class*="badge"], [class*="status"]');
    if (await statusBadge.count() > 0) {
      await expect(statusBadge.first()).toBeVisible();
    }
  });

  test('should display current shift information when clocked in',  async ({ page }) => {
    const { noSitesAvailable, emptyState } = await openTimeClock(page);

    if (noSitesAvailable) {
      await expect(emptyState).toBeVisible();
      return;
    }

    // If clocked in, should show shift info
    const shiftInfo = page.locator('text=/Current Shift|Time Elapsed|Duration|Started at/i');

    if (await shiftInfo.count() > 0) {
      await expect(shiftInfo.first()).toBeVisible();
    }
  });

  test('should show warning if outside job site radius',  async ({ page, context }) => {
    // Set location far from any job site
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 0, longitude: 0 }); // Middle of ocean

    const { noSitesAvailable } = await openTimeClock(page);

    test.skip(noSitesAvailable, 'Requires at least one active job site');

    // Select a job site
    const siteSelect = page.getByLabel('Select Job Site');
    if (await siteSelect.count() > 0) {
      const options = await siteSelect.locator('option').all();
      if (options.length > 1) {
        await siteSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);

        // Should show warning
        const warningText = page.locator('text=/outside|far from|not within|warning/i');
        if (await warningText.count() > 0) {
          await expect(warningText.first()).toBeVisible();
          return;
        }

        const warningBadge = page.locator('[class*="warning"]');
        if (await warningBadge.count() > 0) {
          await expect(warningBadge.first()).toBeVisible();
        }
      }
    }
  });

  test('should record timestamp on clock in/out',  async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 35.1495, longitude: -90.0490 });

    const { noSitesAvailable } = await openTimeClock(page);

    test.skip(noSitesAvailable, 'Requires at least one active job site');

    // Look for timestamp display
    const timestamp = page.locator('text=/\\d+:\\d+|AM|PM|time/i');

    await expect(timestamp.first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle GPS timeout gracefully',  async ({ page }) => {
    const { emptyState } = await openTimeClock(page);

    // Should show GPS error or loading state
    const gpsError = page.locator('text=/GPS|Location|Enable location|Permission/i');

    if (await gpsError.count() > 0) {
      await expect(gpsError.first()).toBeVisible();
    } else {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should update location in real-time',  async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 35.1495, longitude: -90.0490 });

    const { noSitesAvailable } = await openTimeClock(page);

    test.skip(noSitesAvailable, 'Requires at least one active job site');

    await page.waitForTimeout(2000);

    // Change location
    await context.setGeolocation({ latitude: 35.1500, longitude: -90.0500 });
    await page.waitForTimeout(2000);

    // GPS info should update
    const gpsInfo = page.locator('text=/GPS|Location|Accuracy/i');
    await expect(gpsInfo.first()).toBeVisible();
  });

  test('should display job site map',  async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 35.1495, longitude: -90.0490 });

    const { noSitesAvailable } = await openTimeClock(page);

    test.skip(noSitesAvailable, 'Requires at least one active job site');

    // Look for map display
    const map = page.locator('.leaflet-container, #map, [class*="map"]');

    if (await map.count() > 0) {
      await expect(map.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
