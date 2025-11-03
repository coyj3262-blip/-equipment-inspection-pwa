# Equipment Inspection System - Comprehensive Test Suite

## Overview

This comprehensive Playwright test suite covers all major features of the Equipment Inspection System across both supervisor and employee roles. Tests run against the production environment at `https://inspection-v2-580043464912.web.app`.

## Test Coverage

### Supervisor Tests (`tests/supervisor/`)
- ✅ **Authentication** (`auth.spec.ts`) - Login, logout, session management, access control
- ✅ **Job Site Management** (`job-sites.spec.ts`) - CRUD operations, map features, imperial units, GPS
- ✅ **JSA Management** (`jsa-management.spec.ts`) - Creation wizard, filtering, sorting, signatures
- ✅ **Personnel Dashboard** (`personnel-dashboard.spec.ts`) - Real-time tracking, site filtering, GPS status
- ✅ **Time History** (`time-history.spec.ts`) - Accordion view, GPS verification, location maps
- ✅ **Document Sharing** (`documents.spec.ts`) - Upload, KMZ preview, permissions, file management

### Employee Tests (`tests/employee/`)
- ✅ **Authentication** (`auth.spec.ts`) - Login, role restrictions, limited access verification
- ✅ **Clock In/Out** (`clock-in-out.spec.ts`) - GPS verification, job site selection, time tracking
- ✅ **Employee Views** (`views.spec.ts`) - JSA library, personal time history, inspections, SOPs

## Test Credentials

### Supervisor Accounts
```javascript
// Primary supervisor
Email: coyjacobs@mtaftlogging.com
Password: bulldozer97

// Test supervisor
Email: supervisor@mtaftlogging.com
Password: Supervisor123!
```

### Employee Account
```javascript
Email: operator@mtaftlogging.com
Password: Operator123!
```

## Installation

Install Playwright and dependencies:

```bash
npm install
npx playwright install
```

## Running Tests

### Run all tests
```bash
npx playwright test
```

### Run specific test file
```bash
npx playwright test tests/supervisor/auth.spec.ts
```

### Run tests for specific role
```bash
# Supervisor tests only
npx playwright test tests/supervisor/

# Employee tests only
npx playwright test tests/employee/
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests on mobile viewports
```bash
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

### Debug tests
```bash
npx playwright test --debug
```

### Run single test
```bash
npx playwright test --grep "should successfully login"
```

## Test Reports

### View HTML report
```bash
npx playwright show-report
```

### View test results
```bash
# HTML report (after tests complete)
npx playwright show-report

# JSON results
cat test-results/results.json
```

## Test Structure

### Fixtures (`tests/fixtures/auth.ts`)
- **CREDENTIALS** - Test user credentials
- **login()** - Reusable login helper
- **logout()** - Reusable logout helper
- **supervisorTest** - Pre-authenticated supervisor fixture
- **employeeTest** - Pre-authenticated employee fixture

### Test Organization
```
tests/
├── fixtures/
│   └── auth.ts              # Authentication helpers and fixtures
├── supervisor/
│   ├── auth.spec.ts         # Supervisor authentication
│   ├── job-sites.spec.ts    # Job site management
│   ├── jsa-management.spec.ts
│   ├── personnel-dashboard.spec.ts
│   ├── time-history.spec.ts
│   └── documents.spec.ts
└── employee/
    ├── auth.spec.ts         # Employee authentication & restrictions
    ├── clock-in-out.spec.ts # Time tracking with GPS
    └── views.spec.ts        # JSA library, time history, etc.
```

## Key Test Features

### 🔐 Authentication Testing
- Login/logout flows
- Session persistence
- Role-based access control
- Protected route verification

### 🗺️ GPS & Location Features
- GPS accuracy verification
- Distance calculations in imperial units (feet/miles)
- Location map displays
- Geofencing validation
- Color-coded verification markers

### 📊 Data Management
- CRUD operations for job sites, JSAs, documents
- Form validation
- Real-time updates
- Search and filtering

### 📱 Mobile Testing
- Responsive design verification
- Touch interactions
- Mobile-specific viewports
- PWA functionality

### 🎯 Imperial Units
- All distance measurements in feet/miles
- NO metric units (meters/kilometers)
- GPS accuracy in feet
- Job site radius in feet

## Test Patterns

### Using Authentication Fixtures
```typescript
import { supervisorTest } from '../fixtures/auth';

test('my test', supervisorTest, async ({ authenticatedPage: page }) => {
  // Already logged in as supervisor
  await page.goto('/supervisor-hub');
  // ... test logic
});
```

### GPS Mocking
```typescript
test('clock in with GPS', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({
    latitude: 35.1495,
    longitude: -90.0490
  });

  await page.goto('/time-clock');
  // ... test GPS-dependent features
});
```

### Conditional Testing (Handle Empty States)
```typescript
const items = page.locator('.item');

if (await items.count() > 0) {
  // Test with data
  await expect(items.first()).toBeVisible();
} else {
  // Test empty state
  await expect(page.locator('text=/No items/i')).toBeVisible();
}
```

## Configuration

Test configuration is in `playwright.config.ts`:

- **Base URL**: https://inspection-v2-580043464912.web.app
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Screenshots**: On failure
- **Videos**: Retained on failure
- **Traces**: On first retry

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run tests
  run: npx playwright test

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Check network connectivity
- Verify production site is accessible

### Authentication failures
- Verify test credentials are correct
- Check Firebase authentication is enabled
- Ensure test accounts exist in production

### GPS/Location tests failing
- GPS features require permission grants
- Check geolocation context setup
- Verify coordinates are within job site radius

### Flaky tests
- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Use `toBeVisible({ timeout: 10000 })` for slow-loading elements
- Check for race conditions

## Best Practices

1. **Use fixtures** for authentication instead of logging in each test
2. **Grant permissions** explicitly for GPS/location tests
3. **Wait for network idle** after navigation: `await page.waitForLoadState('networkidle')`
4. **Handle empty states** gracefully with conditional checks
5. **Use specific locators** (test IDs, roles) over generic selectors
6. **Test both success and error paths**
7. **Keep tests independent** - don't rely on test order
8. **Clean up test data** if creating records during tests

## Coverage Summary

| Feature Area | Supervisor Tests | Employee Tests | Total |
|-------------|-----------------|----------------|-------|
| Authentication | 7 | 12 | 19 |
| Job Sites | 10 | 0 | 10 |
| JSA Management | 12 | 6 | 18 |
| Personnel/Time | 10 | 8 | 18 |
| Documents | 18 | 0 | 18 |
| Clock In/Out | 0 | 14 | 14 |
| GPS/Maps | 13 | 10 | 23 |
| **Total** | **70** | **50** | **120+** |

## Maintenance

- **Update credentials** in `tests/fixtures/auth.ts` if accounts change
- **Update base URL** in `playwright.config.ts` for different environments
- **Add new tests** following existing patterns in respective role folders
- **Review failures** regularly and update selectors as UI evolves

## Support

For issues or questions:
1. Check Playwright documentation: https://playwright.dev
2. Review test output and screenshots in `test-results/`
3. Run with `--debug` flag for step-by-step debugging
4. Check production site manually to verify expected behavior

---

**Last Updated**: October 29, 2025
**Test Framework**: Playwright v1.55.1
**Target Environment**: Production (inspection-v2-580043464912.web.app)
