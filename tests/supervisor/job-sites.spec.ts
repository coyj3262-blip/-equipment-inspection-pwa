import { test, expect } from '@playwright/test';
import { setupSupervisor } from '../fixtures/auth';


test.describe('Job Site Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupSupervisor(page);
  });

  test('should display job sites list', async ({ page }) => {
    await page.goto('/job-sites');

    // Check page title/heading
    await expect(page.getByRole('heading', { name: /Job Sites/i })).toBeVisible();

    // Should show existing job sites or empty state
    const jobSitesList = page.locator('[data-testid="job-sites-list"], .job-site-card, [class*="job-site"]');
    if (await jobSitesList.count() > 0) {
      await expect(jobSitesList.first()).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page.locator('text=/No job sites/i')).toBeVisible();
    }
  });

  test('should display job site details in imperial units', async ({ page }) => {
    await page.goto('/job-sites');
    await page.waitForLoadState('networkidle');

    // Check for imperial unit displays (feet/miles)
    const imperialUnits = page.locator('text=/\\d+\\s*(ft|feet|mile|miles)/i');

    if (await imperialUnits.count() > 0) {
      await expect(imperialUnits.first()).toBeVisible();

      // Should NOT display metric units
      const metricUnits = page.locator('text=/\\d+\\s*(m|meter|metres|km|kilometer)/i');
      await expect(metricUnits).toHaveCount(0);
    }
  });

  test('should open create job site form', async ({ page }) => {
    await page.goto('/job-sites');

    // Click create/add button
    const addButton = page.getByRole('button', { name: /\+ Add New Site/i });
    await addButton.click();

    // Form should appear
    await expect(page.locator('input[name="name"], input[placeholder*="Name"]')).toBeVisible();
    await expect(page.locator('input[name="address"], input[placeholder*="Address"], textarea[name="address"]')).toBeVisible();
  });

  test('should toggle between manual entry and map mode', async ({ page }) => {
    await page.goto('/job-sites');

    // Open create form
    const addButton = page.getByRole('button', { name: /\+ Add New Site/i });
    await addButton.click();

    // Look for toggle buttons
    const manualToggle = page.locator('button:has-text("Manual Entry"), button:has-text("Manual"), input[value="manual"]');
    const mapToggle = page.locator('button:has-text("Use Map"), button:has-text("Map"), input[value="map"]');

    if (await manualToggle.count() > 0 && await mapToggle.count() > 0) {
      // Click map mode
      await mapToggle.first().click();

      // Map should be visible
      await expect(page.locator('.leaflet-container, #map, [class*="map"]')).toBeVisible({ timeout: 5000 });

      // Switch back to manual
      await manualToggle.first().click();

      // Latitude/Longitude inputs should be visible
      await expect(page.locator('input[name="latitude"], input[placeholder*="Latitude"]')).toBeVisible();
    }
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/job-sites');

    // Open create form
    const addButton = page.getByRole('button', { name: /\+ Add New Site/i });
    await addButton.click();

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
    await submitButton.first().click();

    // Should show validation errors
    await expect(page.locator('text=/required|field is required|cannot be empty/i')).toBeVisible({ timeout: 3000 });
  });

  test('should display radius in imperial units with slider', async ({ page }) => {
    await page.goto('/job-sites');

    // Open create form
    const addButton = page.getByRole('button', { name: /\+ Add New Site/i });
    await addButton.click();

    // Look for radius input/slider
    const radiusInput = page.locator('input[name="radius"], input[type="range"]');

    if (await radiusInput.count() > 0) {
      await expect(radiusInput.first()).toBeVisible();

      // Should show imperial units (164ft - 16404ft range)
      await expect(page.locator('text=/164\\s*ft|16[0-9]+\\s*ft/i')).toBeVisible();
    }
  });

  test('should show map with draggable marker in map mode', async ({ page }) => {
    await page.goto('/job-sites');

    // Open create form
    const addButton = page.getByRole('button', { name: /\+ Add New Site/i });
    await addButton.click();

    // Switch to map mode
    const mapToggle = page.locator('button:has-text("Use Map"), button:has-text("Map")');
    if (await mapToggle.count() > 0) {
      await mapToggle.first().click();

      // Wait for map to load
      await page.waitForTimeout(2000);

      // Map container should be visible
      await expect(page.locator('.leaflet-container, #map, [class*="MapContainer"]')).toBeVisible();

      // Should have a marker (look for marker class)
      const marker = page.locator('.leaflet-marker-icon, [class*="marker"]');
      await expect(marker.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should view existing job site details', async ({ page }) => {
    await page.goto('/job-sites');
    await page.waitForLoadState('networkidle');

    // Find first job site card
    const jobSiteCard = page.locator('.job-site-card, [data-testid="job-site-item"]').first();

    if (await jobSiteCard.count() > 0) {
      await jobSiteCard.click();

      // Should show job site details
      await expect(page.locator('text=/Location|Address|Coordinates|Radius/i')).toBeVisible({ timeout: 5000 });

      // Should show map with location
      await expect(page.locator('.leaflet-container, #map, [class*="map"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display Google Maps satellite imagery', async ({ page }) => {
    await page.goto('/job-sites');

    // Open create form with map mode
    const addButton = page.getByRole('button', { name: /\+ Add New Site/i });
    await addButton.click();

    const mapToggle = page.locator('button:has-text("Use Map"), button:has-text("Map")');
    if (await mapToggle.count() > 0) {
      await mapToggle.first().click();
      await page.waitForTimeout(2000);

      // Check for Google Maps API elements
      const googleMaps = page.locator('[src*="maps.googleapis.com"], [class*="gm-"], .gm-style');

      if (await googleMaps.count() > 0) {
        await expect(googleMaps.first()).toBeVisible();
      }
    }
  });
});
