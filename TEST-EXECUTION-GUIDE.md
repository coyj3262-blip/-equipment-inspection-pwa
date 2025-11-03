# Equipment Inspection System - Test Execution Guide

## Quick Start

```bash
# Install dependencies (if not done)
npm install

# Install Playwright browsers
npx playwright install

# Run all tests
npx playwright test

# View results
npx playwright show-report
```

## Test Execution Checklist

### Before Running Tests

- [ ] Ensure production site is accessible: https://inspection-v2-580043464912.web.app
- [ ] Verify test credentials are valid (see tests/README.md)
- [ ] Check Firebase services are running
- [ ] Ensure stable internet connection

### Running Full Test Suite

```bash
# Complete test run (all features, all browsers)
npx playwright test

# Quick run (chromium only, faster)
npx playwright test --project=chromium

# Watch mode (re-run on changes)
npx playwright test --ui
```

### Running Tests by Feature

```bash
# Authentication tests
npx playwright test tests/supervisor/auth.spec.ts
npx playwright test tests/employee/auth.spec.ts

# Job site features
npx playwright test tests/supervisor/job-sites.spec.ts

# JSA management
npx playwright test tests/supervisor/jsa-management.spec.ts

# Time tracking & GPS
npx playwright test tests/supervisor/time-history.spec.ts
npx playwright test tests/employee/clock-in-out.spec.ts

# Document sharing
npx playwright test tests/supervisor/documents.spec.ts

# Personnel tracking
npx playwright test tests/supervisor/personnel-dashboard.spec.ts

# Employee features
npx playwright test tests/employee/views.spec.ts
```

### Running Tests by Role

```bash
# All supervisor tests
npx playwright test tests/supervisor/

# All employee tests
npx playwright test tests/employee/
```

## Test Execution Scenarios

### Scenario 1: Pre-Deployment Verification

```bash
# Run full suite with retries
npx playwright test --retries=2

# Check report
npx playwright show-report
```

**Expected Outcome**: All tests pass, no critical failures

### Scenario 2: Feature-Specific Testing

When working on a specific feature:

```bash
# Example: Testing JSA updates
npx playwright test tests/supervisor/jsa-management.spec.ts --headed

# Debug specific test
npx playwright test --grep "should filter JSAs by job site" --debug
```

### Scenario 3: Cross-Browser Verification

```bash
# Run on all browsers
npx playwright test --project=chromium --project=firefox --project=webkit

# Mobile testing
npx playwright test --project="Mobile Chrome" --project="Mobile Safari"
```

### Scenario 4: Smoke Testing (Quick Verification)

```bash
# Run critical path tests only
npx playwright test --grep "should successfully login|should clock in"
```

## Understanding Test Results

### Passing Tests ✅
```
✓ tests/supervisor/auth.spec.ts:5:1 › should load login page successfully (2s)
```
- Feature works as expected
- No action needed

### Failing Tests ❌
```
✗ tests/supervisor/job-sites.spec.ts:23:1 › should create new job site (30s)
  Error: Timeout 30000ms exceeded
```
- Check screenshot in `test-results/`
- Review trace file for detailed steps
- Verify feature works manually on production

### Skipped Tests ⊘
```
⊘ tests/employee/views.spec.ts:45:1 › should acknowledge SOPs
```
- Feature not available/testable
- Conditional check failed (e.g., no data)
- Not a failure

## Test Reports

### HTML Report (Recommended)
```bash
npx playwright show-report
```
- Interactive UI
- Screenshots and videos
- Detailed step-by-step traces
- Filter by status, browser, etc.

### Console Output
```bash
npx playwright test --reporter=list
```
- Real-time progress
- Quick pass/fail status

### JSON Output
```bash
npx playwright test --reporter=json > results.json
```
- Machine-readable results
- For CI/CD integration

## Debugging Failed Tests

### Step 1: Review Screenshot
```bash
# Screenshots saved in test-results/
open test-results/[test-name]/test-failed-1.png
```

### Step 2: Watch Video
```bash
# Videos saved for failed tests
open test-results/[test-name]/video.webm
```

### Step 3: Inspect Trace
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```
- Shows every action
- Network requests
- Console logs
- DOM snapshots

### Step 4: Run in Debug Mode
```bash
npx playwright test --debug --grep "failing test name"
```
- Pauses before each action
- Inspect page interactively
- Step through test

### Step 5: Run Headed
```bash
npx playwright test --headed --grep "failing test name"
```
- Watch test execute in real browser
- See visual issues

## Common Issues & Solutions

### Issue: Tests timing out

**Solution**:
```bash
# Increase timeout
npx playwright test --timeout=60000
```

Or update `playwright.config.ts`:
```typescript
timeout: 60 * 1000, // 60 seconds
```

### Issue: GPS tests failing

**Cause**: GPS permissions not granted

**Solution**: Tests already include permission grants. If still failing:
1. Check if production requires HTTPS for geolocation
2. Verify GPS coordinates are realistic
3. Review browser console for permission errors

### Issue: Authentication failures

**Solution**:
1. Verify credentials in `tests/fixtures/auth.ts`
2. Check if test accounts exist in Firebase
3. Ensure Firebase Auth is enabled
4. Try logging in manually first

### Issue: Intermittent failures

**Solution**:
1. Add explicit waits: `await page.waitForLoadState('networkidle')`
2. Increase timeout for specific assertion
3. Use `toBeVisible({ timeout: 10000 })`
4. Check for race conditions

### Issue: Element not found

**Solution**:
1. Verify selector in browser DevTools
2. Check if element is in viewport
3. Wait for element: `await page.waitForSelector('.my-element')`
4. Check if feature is behind feature flag

## Performance Benchmarks

Expected test execution times:

| Test Suite | Tests | Time (Chromium) |
|-----------|-------|-----------------|
| Supervisor Auth | 7 | ~30 seconds |
| Job Sites | 10 | ~60 seconds |
| JSA Management | 12 | ~90 seconds |
| Personnel Dashboard | 10 | ~45 seconds |
| Time History | 13 | ~75 seconds |
| Documents | 18 | ~120 seconds |
| Employee Auth | 12 | ~60 seconds |
| Clock In/Out | 14 | ~90 seconds |
| Employee Views | 16 | ~90 seconds |
| **Total** | **112** | **~10 minutes** |

*Note: Times vary based on network speed and production server response*

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/playwright.yml`:

```yaml
name: Playwright Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run tests
        run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
test:
  image: mcr.microsoft.com/playwright:latest
  script:
    - npm ci
    - npx playwright install
    - npx playwright test
  artifacts:
    when: always
    paths:
      - playwright-report/
    expire_in: 1 week
```

## Scheduled Testing

### Daily Smoke Tests
```bash
# Cron job (every day at 6 AM)
0 6 * * * cd /path/to/project && npx playwright test --grep "should successfully login|should clock in" && npx playwright show-report
```

### Pre-Deployment Tests
```bash
# Run before deploying
npm run test:e2e  # Add to package.json scripts
```

Add to `package.json`:
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:report": "playwright show-report"
  }
}
```

## Best Practices

1. **Run tests regularly** - Daily or before each deployment
2. **Review failures immediately** - Don't let them accumulate
3. **Update tests with UI changes** - Keep selectors current
4. **Test on multiple browsers** - Don't just rely on Chromium
5. **Check mobile viewports** - Many users access on mobile
6. **Monitor test execution time** - Optimize slow tests
7. **Keep test data clean** - Use isolated test accounts
8. **Document new features** - Update test suite for new functionality

## Reporting Issues

When reporting test failures:

1. Include test name and file
2. Attach screenshot from `test-results/`
3. Include trace file if available
4. Note which browser(s) failed
5. Include console errors
6. Describe expected vs actual behavior
7. Note if issue reproduces manually

## Maintenance Schedule

- **Weekly**: Review test results, fix flaky tests
- **Monthly**: Update dependencies, review coverage
- **Quarterly**: Audit test suite, remove obsolete tests
- **Per Release**: Full regression testing on all browsers

---

**Next Steps**:
1. Run `npx playwright test` to execute full test suite
2. Review report with `npx playwright show-report`
3. Address any failures
4. Integrate into CI/CD pipeline

**Support**: See tests/README.md for detailed documentation
