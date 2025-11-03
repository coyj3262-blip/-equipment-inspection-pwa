# Quick Start - Testing Guide

## 🚀 Run Tests Now

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all tests
npm test

# View results
npm run test:report
```

## 📊 What Gets Tested

✅ **Supervisor Features** (70 tests)
- Login & authentication
- Job site management (create, edit, maps, GPS)
- JSA management (wizard, filtering, signatures)
- Personnel dashboard (real-time tracking)
- Time history (GPS verification, accordion view)
- Document sharing (upload, KMZ preview, permissions)

✅ **Employee Features** (50 tests)
- Login & access restrictions
- Clock in/out with GPS verification
- Personal time history
- JSA library (view only)
- Maps and location features

## 🎯 Common Commands

```bash
# Run specific tests
npm run test:supervisor        # Supervisor tests only
npm run test:employee          # Employee tests only

# Debug mode
npm run test:headed            # Watch tests run in browser
npm run test:debug             # Step-by-step debugging
npm run test:ui                # Interactive UI mode

# Run single file
npx playwright test tests/supervisor/auth.spec.ts
```

## 📝 Test Credentials

**Supervisor**
```
Email: coyjacobs@mtaftlogging.com
Password: bulldozer97
```

**Employee**
```
Email: operator@mtaftlogging.com
Password: Operator123!
```

## 📚 Documentation

| File | Purpose |
|------|---------|
| `tests/README.md` | Complete testing guide |
| `TEST-EXECUTION-GUIDE.md` | How to run tests |
| `TEST-COVERAGE-MATRIX.md` | Detailed coverage breakdown |
| `TESTING-SUMMARY.md` | Executive summary |

## ⚡ Quick Tips

1. **First time?** Run `npx playwright install`
2. **Test failing?** Check `test-results/` for screenshots
3. **Need help?** See `tests/README.md`
4. **CI/CD?** Examples in `TEST-EXECUTION-GUIDE.md`

## 🎉 You're Ready!

Run `npm test` and see your app tested across:
- 120+ test cases
- All major features
- Multiple browsers
- Mobile viewports
- Both user roles

**Expected run time**: ~10 minutes (Chromium only)

---

**Pro Tip**: Use `npm run test:ui` for interactive test exploration!
