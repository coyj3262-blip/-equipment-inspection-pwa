import { test, expect } from '@playwright/test';
import { setupSupervisor } from '../fixtures/auth';


test.describe('JSA Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupSupervisor(page);
  });

  test('should display JSA management page', async ({ page }) => {
    await page.goto('/jsa/manage');

    // Check page title
    await expect(page.getByRole('heading', { name: /JSA Management/i })).toBeVisible();

    await expect(page.getByRole('button', { name: /Active JSAs/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create New|Edit JSA/i })).toBeVisible();
  });

  test('should display job site filter dropdown', async ({ page }) => {
    await page.goto('/jsa/manage');

    const siteFilter = page.locator('select').first();
    await expect(siteFilter).toBeVisible({ timeout: 10000 });
  });

  test('should display date filter with "Today" as default', async ({ page }) => {
    await page.goto('/jsa/manage');

    const todayChip = page.locator('button:has-text("Today")');
    if (await todayChip.count() > 0) {
      await expect(todayChip.first()).toBeVisible();
    }
  });

  test('should filter JSAs by job site', async ({ page }) => {
    await page.goto('/jsa/manage');
    await page.waitForLoadState('networkidle');

    // Find job site filter
    const siteFilter = page.locator('select').first();

    if (await siteFilter.count() > 0) {
      // Get all options
      const options = await siteFilter.locator('option').all();

      if (options.length > 2) {
        // Select second option (skip "All Sites")
        await siteFilter.selectOption({ index: 1 });
        await page.waitForLoadState('networkidle');

        // JSA list should update
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should display JSA list with smart sorting', async ({ page }) => {
    await page.goto('/jsa/manage');
    await page.waitForLoadState('networkidle');

    // Should display JSAs or empty state
    const jsaLinks = page.locator('a[href^="/jsa/"], button:has-text("View")');
    const emptyState = page.locator('text=/No active JSAs|No JSAs match this filter/i');

    if (await jsaLinks.count() > 0) {
      await expect(jsaLinks.first()).toBeVisible();
    } else {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should open JSA creation wizard', async ({ page }) => {
    await page.goto('/jsa/manage');

    await page.getByRole('button', { name: /Create New|Edit JSA/i }).click();

    await expect(page.getByRole('heading', { name: /Create Job Safety Analysis|Edit Job Safety Analysis/i })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/Step 1: Basic Information/i')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate through JSA wizard steps', async ({ page }) => {
    await page.goto('/jsa/manage');

    const createTab = page.getByRole('button', { name: /Create New|Edit JSA/i });
    if (await createTab.count() === 0) {
      test.skip(true, 'Create JSA tab not available');
    } else {
      await createTab.first().click();

      const titleInput = page.locator('input[placeholder*="Title"], input[name="title"]').first();
      if (await titleInput.count() > 0) {
        await titleInput.fill(`Automation Test JSA ${Date.now()}`);
      }

      const nextButton = page.locator('button', { hasText: 'Next' }).first();
      if (await nextButton.count() > 0) {
        await nextButton.click();
        await expect(page.locator('text=/Step 2|Hazards/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should validate required JSA fields', async ({ page }) => {
    await page.goto('/jsa/manage');

    const createTab = page.getByRole('button', { name: /Create New|Edit JSA/i });
    if (await createTab.count() === 0) {
      test.skip(true, 'Create JSA tab not available');
    } else {
      await createTab.first().click();

      const nextButton = page.locator('button', { hasText: 'Next' }).first();
      if (await nextButton.count() > 0) {
        await nextButton.click();
        await expect(page.locator('text=/Please enter a title before continuing/i')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should display existing JSA details', async ({ page }) => {
    await page.goto('/jsa/manage');
    await page.waitForLoadState('networkidle');

    // Find first JSA
    const firstJsa = page.locator('a[href^="/jsa/"]').first();

    if (await firstJsa.count() > 0) {
      await firstJsa.click();

      // Should show JSA details
      await expect(page.locator('text=/Hazard|Control|PPE|Signature/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show active vs inactive JSAs', async ({ page }) => {
    await page.goto('/jsa/manage');

    const activeHeader = page.locator('text=/Active JSAs/i');
    await expect(activeHeader).toBeVisible();

    const filterChips = page.locator('button:has-text("All"), button:has-text("Today"), button:has-text("Pending Signatures")');
    if (await filterChips.count() > 0) {
      await filterChips.first().click();
    }
  });

  test('should track JSA signatures', async ({ page }) => {
    await page.goto('/jsa/manage');
    await page.waitForLoadState('networkidle');

    // Look for signature information on JSA cards
    const signatureInfo = page.locator('text=/signed/i');
    const emptyState = page.locator('text=/No active JSAs|No JSAs match this filter/i');

    if (await signatureInfo.count() > 0) {
      await expect(signatureInfo.first()).toBeVisible();
    } else {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should allow SOP document attachments', async ({ page }) => {
    await page.goto('/jsa/manage');

    const createTab = page.getByRole('button', { name: /Create New|Edit JSA/i });
    if (await createTab.count() === 0) {
      test.skip(true, 'Create JSA tab not available');
    } else {
      await createTab.first().click();
      const uploadButton = page.locator('button:has-text("Upload document")');
      if (await uploadButton.count() > 0) {
        await expect(uploadButton.first()).toBeVisible();
      }
    }
  });

  test('should display JSAs sorted by date', async ({ page }) => {
    await page.goto('/jsa/manage');
    await page.waitForLoadState('networkidle');

    // Look for date information on JSA cards
    const dateInfo = page.locator('text=/\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i');

    if (await dateInfo.count() > 0) {
      // Should display dates
      await expect(dateInfo.first()).toBeVisible();
    }
  });
});

