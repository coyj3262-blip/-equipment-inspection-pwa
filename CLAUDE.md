# Equipment Inspection System - Project Memory

## Project Overview
Firebase-hosted web application for managing equipment inspections, JSAs (Job Safety Analyses), SOPs, and personnel tracking in construction/industrial environments.

**Live URL:** https://inspection-v2-580043464912.web.app
**Firebase Project:** equipment-inspection-sys-615a9
**Dev Server:** http://localhost:5174
**GitHub:** https://github.com/coyj3262-blip/-equipment-inspection-pwa

### Repository Status (Updated Nov 3, 2025)
- **Active Folder:** `C:\Users\coyj3\inspection-v2-clean` (synced with GitHub and live site)
- **Archived:** `inspection-v2-archive-20251103.tar.gz` (old development version, frozen Oct 18, 2025)
- GitHub repository fully synced with production code as of Nov 3, 2025

## Tech Stack
- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Backend:** Firebase
  - Realtime Database (RTDB)
  - Authentication (Email/Password)
  - Storage (File uploads)
  - Hosting

## Key Features

### Supervisor Hub (`/supervisor-hub`)
Central management dashboard for supervisors with two sections:

**Management Tools (Primary):**
- 📋 JSA Management - Create/manage Job Safety Analyses
- 🔍 Inspection History - Review completed inspections
- 👥 Personnel Tracking - Real-time crew location/clock-in tracking

**Administrative Tools (Secondary):**
- ✓ SOP Acknowledgments - Track operator compliance
- 📍 Job Sites - Manage locations and geofences
- 🔔 Alerts & Notifications - GPS alerts and system notifications

**Design:** Clean Data Dashboard layout with color-coded left borders (blue, green, purple, orange, pink, red)

### JSA Management (`/supervisor/jsas`)
- 3-step wizard for creating JSAs (Basic Info → Hazards/Controls → PPE/Publish)
- Job site filtering dropdown
- **Default filter:** "Today" (shows today's JSAs first)
- **Smart sorting:** Today's JSAs → newest effective date → newest created
- Active/Create tabs with real-time signature tracking
- SOP document attachments support

### Other Key Pages
- `/inspect` - Equipment inspection checklist runner
- `/history` - Inspection history viewer
- `/time-clock` - Personnel clock in/out
- `/personnel` - Real-time personnel tracking dashboard
- `/library` - JSA and SOP library for operators
- `/job-sites` - Job site management with geofencing

## Recent Changes

### Complete Metric System Removal (Oct 21, 2025)
- ✅ **IMPERIAL UNITS ONLY - Metric System Completely Removed:**
  - Rewrote Haversine formula to calculate in feet directly (Earth radius: 20,902,230.97ft)
  - GPS browser data (meters) auto-converts to feet
  - Database field renamed: `radiusMeters` → `radius` (stores feet)
  - Cleared all existing data (18 records) containing metric values
  - Validation ranges: 164-16404ft (minimum 164ft, max ~3 miles)
  - All TypeScript types updated to feet
  - All UI components display feet/miles only
  - Format functions: `formatDistance()`, `formatRadius()` use feet
  - Admin scripts updated for imperial units
  - **Zero metric references remaining in codebase**

### Imperial Units & UI Reorganization (Oct 21, 2025) - SUPERSEDED BY COMPLETE REMOVAL
- ✅ **Converted All Distances to Imperial:**
  - Added conversion utilities to `geolocation.ts`:
    - `metersToFeet()` - 1m = 3.28084ft
    - `metersToMiles()` - 1m = 0.000621371mi
    - `formatDistance()` - Smart formatting (feet for <1000ft, miles for ≥1000ft)
    - `formatRadius()` - Optimized for smaller distances
  - Updated all components to display feet/miles (NEVER meters):
    - MapView.tsx - GPS accuracy, distances in imperial
    - InteractiveMap.tsx - Radius slider "164ft - 1640ft"
    - JobSites.tsx - Live imperial conversion display

- ✅ **Operator-Grouped History (Accordion View):**
  - Created `OperatorHistoryAccordion.tsx` component
  - Groups time entries by operator with expandable sections
  - Shows summary: operator name, total hours, entry count, active badge
  - Individual entry cards retain all details (time, duration, on-site status, maps)
  - Updated SitePersonnelHistory.tsx to use accordion layout instead of flat chronological list

- ✅ **Personnel Dashboard Site Filter:**
  - Added visible site dropdown filter at top of PersonnelDashboard
  - Shows personnel count per site in dropdown options
  - "All Sites" option to view everyone across all locations
  - Integrates with existing JobSiteFilterContext

- ✅ **Job Site Form Enhancements:**
  - Address field confirmed as required (existing validation)
  - Added live imperial unit display next to radius input
  - Shows both metric value (for storage) and imperial conversion (for users)

### Map Features & GPS Visualization (Oct 20, 2025)
- ✅ **Interactive Job Site Creation:**
  - Added toggle between "Manual Entry" and "Use Map" modes
  - Draggable pin for precise location placement
  - Live radius preview (50m - 500m slider)
  - Click-to-place or drag marker functionality
  - Coordinates auto-update as pin moves

- ✅ **Clock-In/Out Location Maps:**
  - Expandable "Show Location Map" buttons on time entries
  - Visual GPS verification with color-coded markers:
    - 🔵 Blue = Job site center
    - 🟢 Green = Within radius (verified)
    - 🟠 Orange = Outside radius (flagged)
  - Verification radius circle overlay
  - Interactive popups with distance, accuracy, and status

- ✅ **Components Created:**
  - `MapView.tsx` - Reusable map display component
  - `InteractiveMap.tsx` - Editable map for site creation
  - `TimeEntryMap.tsx` - Wrapper that fetches site data for time entries

- ✅ **Pages Updated:**
  - `TimeHistory.tsx` - Added expandable maps to personal time log
  - `SitePersonnelHistory.tsx` - Added maps to supervisor site history
  - `JobSites.tsx` - Added interactive map mode for creating/editing sites

- 📦 **Dependencies Added:**
  - `leaflet` - Open-source mapping library
  - `react-leaflet` - React components for Leaflet
  - `@types/leaflet` - TypeScript definitions

### Bug Fixes & Data Cleanup (Oct 20, 2025)
- ✅ Fixed clock-in/out supervisor view showing undefined/missing data
- ✅ Cleaned all test time tracking data from database
- ✅ Fixed job sites missing location coordinates and radius values
- ✅ Created data management scripts:
  - `cleanup-time-data.js` - Remove all time tracking test data
  - `check-jobsites.js` - Verify job site location data
  - `fix-jobsites-locations.js` - Add missing coordinates to existing sites
- ✅ Added sample locations for 3 job sites (Memphis, Chattanooga, Nashville areas)

### User Account Creation (Oct 19, 2025)
- ✅ Created admin scripts for user account creation
- ✅ Added two new test accounts:
  - **Supervisor:** supervisor@mtaftlogging.com / Supervisor123! (UID: UmHpOIOvdMhOctTclIxWUNAf3fx1)
  - **Employee:** operator@mtaftlogging.com / Operator123! (UID: Drlek5fjAzQnLr6NvPV1lhWlRSE3)
- ✅ Installed firebase-admin package for server-side user management
- ✅ Created user management scripts:
  - `create-users-admin.js` - Admin script using service account (working)
  - `create-accounts-auto.js` - Client-side script via Cloud Functions
  - `set-supervisor-claim.js` - Script to fix supervisor custom claims
- 📝 **Note:** Original supervisor account (coyjacobs@mtaftlogging.com) may need custom claims update for full Cloud Function access

### Supervisor Hub Redesign (Oct 18, 2025)
- ✅ Replaced large gradient tile grid (2-column) with compact Data Dashboard layout
- ✅ Added color-coded visual hierarchy with left borders and icon backgrounds
- ✅ Removed quick stats tiles (Active JSAs, Inspections Today, Crew On Site)
- ✅ Split tools into "Management" and "Administrative" sections
- ✅ All tools visible without scrolling

### JSA Management Improvements (Oct 18, 2025)
- ✅ Added job site filter dropdown (synced with global JobSiteFilterContext)
- ✅ Changed default filter from "All" to "Today"
- ✅ Implemented smart sorting (today's JSAs first, then by effective date)
- ✅ Respects supervisor site restrictions (if assigned to specific site)

## Architecture Notes

### Context Providers
- `AuthContext` - User authentication state
- `JobSiteFilterContext` - Global job site filtering (used by Supervisor Hub, JSA Management, Personnel Tracking)
- `SupervisorAccessContext` - Supervisor role verification

### Key Hooks
- `useJsaData(siteId?)` - Fetches and filters JSAs by site
- `useJobSiteFilter()` - Global job site selection state
- `useUserRole()` - User role and permissions
- `useActiveSession()` - Time clock active session tracking

### File Structure
```
src/
├── components/
│   ├── maps/        # Map components
│   │   ├── MapView.tsx           # Display clock-in/out locations
│   │   ├── InteractiveMap.tsx    # Create/edit job sites
│   │   └── TimeEntryMap.tsx      # Wrapper for time entry maps
│   ├── time/        # Time tracking components
│   │   └── OperatorHistoryAccordion.tsx  # Grouped time entries by operator
│   └── ui/          # Reusable UI components
├── context/         # React context providers
├── hooks/           # Custom React hooks
├── pages/           # Page components (routes)
├── services/        # Firebase service layer
├── firebase.ts      # Firebase config
└── App.tsx          # Main app with routing
```

## User Management

### Active Accounts
1. **Original Supervisor:** coyjacobs@mtaftlogging.com (may need custom claims fix)
2. **Test Supervisor:** supervisor@mtaftlogging.com / Supervisor123!
3. **Test Employee:** operator@mtaftlogging.com / Operator123!

### Creating New Users
**Option 1: Admin Script (Requires Service Account)**
```bash
# Service account key saved as: firebase-service-account-2.json
node create-users-admin.js
```

**Option 2: Via Cloud Functions (Requires Authenticated Supervisor)**
```bash
# Requires supervisor with custom claims set
node create-accounts-auto.js
```

**Option 3: Set Custom Claims on Existing Account**
```bash
# Fix supervisor permissions on existing account
node set-supervisor-claim.js
```

### Cloud Functions
Deployed user management functions (us-central1):
- `createEmployee` - Create new employee/supervisor accounts
- `updateEmployeeProfile` - Update user profiles
- `disableEmployee` / `enableEmployee` - Account management
- `resetEmployeePassword` - Generate password reset links
- `listEmployees` - Get all users

**Note:** Cloud Functions require custom claims (`supervisor: true` or `role: "supervisor"`) for authorization.

## Deployment
```bash
npm run build              # Build for production
firebase deploy --only hosting --project equipment-inspection-sys-615a9
```

**Last deployed:** November 2, 2025 at 6:26 AM EST
**GitHub Repository:** https://github.com/coyj3262-blip/-equipment-inspection-pwa
**Working Directory:** C:\Users\coyj3\inspection-v2-clean

### Deployment History
- Nov 2, 2025 - Latest production deployment (current live version)
- Oct 21, 2025 - Imperial Units & UI Reorganization
- Oct 20, 2025 - Map Features & GPS Visualization

## Development
```bash
npm run dev                # Start dev server on port 5173/5174
```

## Data Management Scripts

### Time Tracking Cleanup
```bash
# Remove all time tracking test data (entries, sessions, personnel, alerts)
node cleanup-time-data.js
```

### Job Site Management
```bash
# Check job sites for missing/invalid location data
node check-jobsites.js

# Fix job sites with missing coordinates/radius
node fix-jobsites-locations.js
```

### User Account Management
```bash
# Create users via Firebase Admin SDK (requires service account)
node create-users-admin.js

# Set supervisor custom claims on existing account
node set-supervisor-claim.js
```

## Notes
- Uses Tailwind's `navy-900` color for primary branding
- Orange (`orange-500`) used for CTAs and active states
- Mobile-first design with responsive layouts
- Bottom navigation for mobile app feel
- Maps powered by Leaflet + Esri World Imagery satellite tiles (no API keys required)
- All distance/radius measurements displayed in imperial units (feet/miles)
