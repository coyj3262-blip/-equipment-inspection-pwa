import { test as base, Page } from '@playwright/test';

/**
 * Test credentials for authentication
 */
export const CREDENTIALS = {
  supervisor: {
    email: 'coyjacobs@mtaftlogging.com',
    password: 'bulldozer97',
    role: 'supervisor'
  },
  testSupervisor: {
    email: 'supervisor@mtaftlogging.com',
    password: 'Supervisor123!',
    role: 'supervisor'
  },
  employee: {
    email: 'operator@mtaftlogging.com',
    password: 'Operator123!',
    role: 'employee'
  }
};

/**
 * Login helper function
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/');

  // Wait for login form to render
  await page.waitForSelector('input[type="email"]', { timeout: 30000 });

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  const loginError = page.locator(
    '[data-testid="auth-error"], text=/invalid|incorrect|failed|try again/i'
  );

  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForLoadState('networkidle'),
  ]);

  const redirected = await page
    .waitForURL(
      (url) => !url.pathname.startsWith('/login'),
      { timeout: 30000 }
    )
    .then(
      () => true,
      () => false
    );

  if (!redirected) {
    const errorVisible = await loginError.first().isVisible().catch(() => false);
    throw new Error(
      `Login failed for ${email}.` +
        (errorVisible ? ' Authentication error message displayed.' : ' No redirect detected.')
    );
  }

  // Wait for Firebase auth state to settle and user data to load
  // Look for common user indicators in the UI (email, profile menu, username)
  await page.waitForTimeout(1000); // Allow Firebase auth state to propagate

  // Wait for either a user email display or navigation menu to confirm auth is complete
  await Promise.race([
    page.waitForSelector('nav', { timeout: 10000 }),
    page.waitForSelector('header', { timeout: 10000 }),
    page.waitForTimeout(2000), // Fallback: give minimum time for auth to settle
  ]).catch(() => {
    // Ignore if selectors not found, continue with timeout-based wait
  });

  // Additional wait for any async data loading
  await page.waitForLoadState('networkidle');
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  // Look for logout/profile menu
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');

  if (await logoutButton.count() > 0) {
    await logoutButton.first().click();
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Extended test fixture with authenticated supervisor
 */
export const supervisorTest = base.extend<{
  authenticatedPage: Page
}>({
  authenticatedPage: async ({ page }, use) => {
    await login(page, CREDENTIALS.supervisor.email, CREDENTIALS.supervisor.password);
    await use(page);
    await logout(page);
  },
});

/**
 * Extended test fixture with authenticated employee
 */
export const employeeTest = base.extend<{
  authenticatedPage: Page
}>({
  authenticatedPage: async ({ page }, use) => {
    await login(page, CREDENTIALS.employee.email, CREDENTIALS.employee.password);
    await use(page);
    await logout(page);
  },
});

/**
 * Helper function to setup authenticated supervisor for a test
 */
export async function setupSupervisor(page: Page) {
  await login(page, CREDENTIALS.supervisor.email, CREDENTIALS.supervisor.password);
}

/**
 * Helper function to setup authenticated employee for a test
 */
export async function setupEmployee(page: Page) {
  await login(page, CREDENTIALS.employee.email, CREDENTIALS.employee.password);
}
