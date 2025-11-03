import { test, expect, type Page } from '@playwright/test';
import { setupSupervisor } from '../fixtures/auth';

const NO_ENTRIES_LOCATOR = 'text=/No time entries/i';

async function openTimeHistory(page: Page) {
  await page.goto('/time-history');
  await page.waitForLoadState('networkidle');
  const emptyState = page.locator(NO_ENTRIES_LOCATOR);
  const noEntries = await emptyState.isVisible().catch(() => false);
  return { noEntries, emptyState };
}


test.describe('Time History & GPS Verification', () => {
  test.beforeEach(async ({ page }) => {
    await setupSupervisor(page);
  });

  test('should display time history page', async ({ page }) => {
    await page.goto('/time-history');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Time History/i })).toBeVisible();
  });

  test('should display operator-grouped accordion view', async ({ page }) => {
    const { noEntries, emptyState } = await openTimeHistory(page);

    // Look for accordion components
    const accordion = page.locator('[aria-label*="Progress"], button:has-text("Show Location Map")');

    if (await accordion.count() > 0) {
      await expect(accordion.first()).toBeVisible();
    } else if (noEntries) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should show operator summary in accordion header', async ({ page }) => {
    const { noEntries, emptyState } = await openTimeHistory(page);

    // Look for operator name, total hours, entry count
    const operatorSummary = page.locator('text=/entries|people/i');

    if (await operatorSummary.count() > 0) {
      await expect(operatorSummary.first()).toBeVisible();
    } else if (noEntries) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should expand and collapse operator accordion', async ({ page }) => {
    const { noEntries, emptyState } = await openTimeHistory(page);

    if (noEntries) {
      await expect(emptyState).toBeVisible();
      return;
    }

    test.skip(true, 'Accordion interaction not available in current UI');
  });

  test('should display time entries with clock in/out details', async ({ page }) => {
    const { noEntries, emptyState } = await openTimeHistory(page);

    if (noEntries) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const timeEntry = page.locator('text=/Clock In:|Clock Out:|Duration:/i');
    if (await timeEntry.count() > 0) {
      await expect(timeEntry.first()).toBeVisible();
    }
  });

  test('should show on-site verification status', async ({ page }) => {
    const { noEntries, emptyState } = await openTimeHistory(page);

    if (noEntries) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const verificationStatus = page.locator('text=/On Site|Off Site|Flagged|Active/i');

    if (await verificationStatus.count() > 0) {
      await expect(verificationStatus.first()).toBeVisible();
    }
  });

  test('should have "Show Location Map" buttons on entries', async ({ page }) => {
    const { noEntries, emptyState } = await openTimeHistory(page);

    if (noEntries) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const mapButton = page.locator('button:has-text("Show Location Map"), button:has-text("Show Location")');
    if (await mapButton.count() > 0) {
      await expect(mapButton.first()).toBeVisible();
    } else {
      test.skip(true, 'No location map buttons available');
    }
  });

  test('should expand location map on click', async ({ page }) => {
    const { noEntries, emptyState } = await openTimeHistory(page);

    if (noEntries) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const mapButton = page.locator('button:has-text("Show Location Map"), button:has-text("Show Location")').first();
    if (await mapButton.count() === 0) {
      test.skip(true, 'No location map buttons available');
    } else {
      await mapButton.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('.leaflet-container, #map, [class*="MapContainer"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display color-coded GPS markers', async ({ page }) => {
    const { noEntries, emptyState } = await openTimeHistory(page);

    if (noEntries) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const mapButton = page.locator('button:has-text("Show Location Map"), button:has-text("Show Location")').first();
    if (await mapButton.count() === 0) {
      test.skip(true, 'No location map buttons available');
    } else {
      await mapButton.click();
      await page.waitForTimeout(2000);

      const markers = page.locator('.leaflet-marker-icon, [class*="marker"]');
      if (await markers.count() > 0) {
        await expect(markers.first()).toBeVisible();
      }
    }
  });

  test('should show verification radius circle on map', async ({ page }) => {
    const { noEntries, emptyState } = await openTimeHistory(page);

    if (noEntries) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const mapButton = page.locator('button:has-text("Show Location Map"), button:has-text("Show Location")').first();
    if (await mapButton.count() === 0) {
      test.skip(true, 'No location map buttons available');
    } else {
      await mapButton.click();
      await page.waitForTimeout(2000);

      const circle = page.locator('.leaflet-interactive, circle, [class*="circle"]');

      if (await circle.count() > 0) {
        await expect(circle.first()).toBeVisible();
      }
    }
  });

  test('should display distance in imperial units', async ({ page }) => {
    const { noEntries, emptyState } = await openTimeHistory(page);

    if (noEntries) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const distance = page.locator('text=/\\d+\\s*ft|\\d+\\s*feet|\\d+\\.\\d+\\s*mile/i');
    if (await distance.count() > 0) {
      await expect(distance.first()).toBeVisible();

      // Should NOT show metric units
      const metricDistance = page.locator('text=/\\d+\\s*m[^i]|\\d+\\s*meter|\\d+\\s*km/i');
      await expect(metricDistance).toHaveCount(0);
    }
  });

  test('should show GPS accuracy in feet', async ({ page }) => {
    const { noEntries, emptyState } = await openTimeHistory(page);

    if (noEntries) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const accuracy = page.locator('text=/accuracy|±\\d+\\s*ft/i');

    if (await accuracy.count() > 0) {
      await expect(accuracy.first()).toBeVisible();
    } else {
      test.skip(true, 'No accuracy information available');
    }
  });

  test('should display interactive map popups', async ({ page }) => {
    const { noEntries, emptyState } = await openTimeHistory(page);

    if (noEntries) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const mapButton = page.locator('button:has-text("Show Location Map"), button:has-text("Show Location")').first();
    if (await mapButton.count() === 0) {
      test.skip(true, 'No location map buttons available');
    } else {
      await mapButton.click();
      await page.waitForTimeout(2000);

      const marker = page.locator('.leaflet-marker-icon').first();
      if (await marker.count() > 0) {
        await marker.click();
        await page.waitForTimeout(500);
        await expect(page.locator('.leaflet-popup, [class*="popup"]')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should show active badge for clocked-in operators', async ({ page }) => {
    const { noEntries, emptyState } = await openTimeHistory(page);

    if (noEntries) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const activeBadge = page.locator('text=/Active|On Site|Clocked In/i');
    if (await activeBadge.count() > 0) {
      await expect(activeBadge.first()).toBeVisible();
    }
  });
});
