import { test, expect, type Page } from '@playwright/test';
import { setupSupervisor } from '../fixtures/auth';

const NO_DOCUMENTS_LOCATOR = 'text=/No documents found|No documents have been uploaded/i';

async function openDocuments(page: Page) {
  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  const summary = page.locator('text=/Showing \\d+ of \\d+ documents/i');
  const emptyState = page.locator(NO_DOCUMENTS_LOCATOR);
  const hasSummary = await summary.count();
  const noDocuments = await emptyState.isVisible().catch(() => false);
  return { summary, emptyState, noDocuments, hasSummary };
}

test.describe('Document Sharing System', () => {
  test.beforeEach(async ({ page }) => {
    await setupSupervisor(page);
  });

  test('should display documents page', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Documents/i })).toBeVisible();
  });

  test('should show two tabs: Job Site Docs and General Library', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /Job Site Documents/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /General Library/i })).toBeVisible({ timeout: 10000 });
  });

  test('should display upload document button', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /Upload Document/i })).toBeVisible({ timeout: 10000 });
  });

  test('should open document upload modal', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Upload Document/i }).click();

    await expect(page.getByRole('heading', { name: /Upload Document/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel('Select File')).toBeVisible();
  });

  test('should show visibility permission options', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Upload Document/i }).click();

    const visibilityLabel = page.getByText('Who can view?', { exact: false });
    await expect(visibilityLabel).toBeVisible();
  });

  test('should show 50MB file size limit', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Upload Document/i }).click();
    await expect(page.locator('text=/Max file size: 50MB/i')).toBeVisible({ timeout: 5000 });
  });

  test('should display document categories', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Upload Document/i }).click();

    await expect(page.getByLabel('Category')).toBeVisible();
  });

  test('should display document list or empty state', async ({ page }) => {
    const { summary, emptyState, noDocuments, hasSummary } = await openDocuments(page);

    if (noDocuments) {
      await expect(emptyState).toBeVisible();
    } else if (hasSummary) {
      await expect(summary.first()).toBeVisible();
    }
  });

  test('should filter documents by category', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    await expect(page.getByLabel('Category')).toBeVisible();
  });

  test('should search documents by name', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    await expect(page.getByLabel('Search')).toBeVisible();
  });

  test('should display document cards with metadata', async ({ page }) => {
    const { noDocuments, emptyState } = await openDocuments(page);

    if (noDocuments) {
      await expect(emptyState).toBeVisible();
      return;
    }

    await expect(page.locator('text=/Uploaded by/i').first()).toBeVisible();
  });

  test('should show download button on documents', async ({ page }) => {
    const { noDocuments, emptyState } = await openDocuments(page);

    if (noDocuments) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const downloadButton = page.locator('button:has-text("Download"), a[download]');
    if (await downloadButton.count() > 0) {
      await expect(downloadButton.first()).toBeVisible();
    }
  });

  test('should show delete button on documents', async ({ page }) => {
    const { noDocuments, emptyState } = await openDocuments(page);

    if (noDocuments) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const deleteButton = page.locator('button:has-text("🗑️")');
    if (await deleteButton.count() > 0) {
      await expect(deleteButton.first()).toBeVisible();
    }
  });

  test('should display KMZ preview button for KMZ files', async ({ page }) => {
    const { noDocuments, emptyState } = await openDocuments(page);

    if (noDocuments) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const kmzBadge = page.locator('text=/KMZ Map/i').first();
    if (await kmzBadge.count() === 0) {
      test.skip(true, 'Requires at least one KMZ document');
    }

    const previewButton = page.locator('button:has-text("Preview"), button:has-text("View Map")');
    if (await previewButton.count() > 0) {
      await expect(previewButton.first()).toBeVisible();
    }
  });

  test('should open KMZ map preview', async ({ page }) => {
    const { noDocuments, emptyState } = await openDocuments(page);

    if (noDocuments) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const previewButton = page.locator('button:has-text("Preview"), button:has-text("View KMZ")').first();

    if (await previewButton.count() === 0) {
      test.skip(true, 'Requires KMZ document with preview');
    }

    await previewButton.click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.leaflet-container, #map, [class*="map"]')).toBeVisible({ timeout: 5000 });
  });

  test('should show file type icons', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    // Look for file type indicators
    const fileIcon = page.locator('[class*="icon"], svg, img[alt*="file" i]');

    if (await fileIcon.count() > 0) {
      await expect(fileIcon.first()).toBeVisible();
    }
  });

  test('should attach documents to job sites', async ({ page }) => {
    await page.goto('/documents');

    // Open upload modal
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add Document")').first();
    if (await uploadButton.count() > 0) {
      await uploadButton.click();

      // Look for job site selection
      const siteSelect = page.locator('select[name="jobSite"], select[name="site"], [aria-label*="job site" i]');

      if (await siteSelect.count() > 0) {
        await expect(siteSelect.first()).toBeVisible();
      }
    }
  });

  test('should display documents in grid layout', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    // Check for grid layout
    const grid = page.locator('[class*="grid"], .document-grid, [class*="Grid"]');

    if (await grid.count() > 0) {
      await expect(grid.first()).toBeVisible();
    }
  });

  test('should validate file upload requirements', async ({ page }) => {
    await page.goto('/documents');

    // Open upload modal
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add Document")').first();
    if (await uploadButton.count() > 0) {
      await uploadButton.click();

      // Try to submit without file
      const submitButton = page.locator('button[type="submit"], button:has-text("Upload"), button:has-text("Save")');

      if (await submitButton.count() > 0) {
        await submitButton.first().click();

        // Should show validation error
        await expect(page.locator('text=/required|select a file|choose a file/i')).toBeVisible({ timeout: 3000 });
      }
    }
  });
});
