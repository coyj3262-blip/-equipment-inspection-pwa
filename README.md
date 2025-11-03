# Equipment Inspection System

A comprehensive mobile-first Progressive Web App (PWA) for construction site operations including equipment inspections, Job Safety Analysis (JSA), Standard Operating Procedures (SOP), time tracking, personnel management, and job site coordination.

**Tech Stack:** React 19, TypeScript, Vite, Firebase (Auth, Realtime Database, Storage, Cloud Functions)

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with Realtime Database, Storage, and Cloud Functions enabled

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
   VITE_RTDB_ROOT=/v2
   ```

3. **Deploy Firebase security rules:**
   ```bash
   firebase deploy --only database,storage
   ```

4. **Install and deploy Cloud Functions:**
   ```bash
   cd functions
   npm install
   npm run build
   cd ..
   firebase deploy --only functions
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

   Open http://localhost:5173

---

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server with HMR
npm run dev

# Type-check and build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## Firebase Deployment

```bash
# Deploy everything
firebase deploy

# Deploy hosting only
firebase deploy --only hosting

# Deploy security rules only
firebase deploy --only database,storage

# Deploy Cloud Functions only
firebase deploy --only functions
```

---

## Project Structure

```
├── src/
│   ├── components/      # Reusable UI components
│   │   └── ui/         # Base components (Button, Card, Header, etc.)
│   ├── pages/          # Route components
│   ├── services/       # Business logic & Firebase operations
│   ├── hooks/          # Custom React hooks
│   ├── context/        # Global state providers
│   ├── config/         # Static configuration (equipment checklists)
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Helper functions
├── functions/          # Firebase Cloud Functions
│   └── src/
│       ├── index.ts
│       └── userManagement.ts
├── public/             # Static assets
└── firebase.json       # Firebase configuration
```

---

## Core Features

### Supervisor Hub
- Clean Data Dashboard layout with color-coded management tools
- Organized into Management Tools (JSA, Inspections, Personnel) and Administrative Tools (SOPs, Sites, Alerts)
- Job site filtering with context-aware restrictions
- Real-time statistics and status updates

### Equipment Inspections
- Pre-operation checklists for dozers, excavators, loaders, farm tractors
- Pass/Fail/NA status with photo uploads
- Digital signature capture
- Real-time submission to Firebase

### Job Safety Analysis (JSA)
- 3-step wizard for creating JSAs (Basic Info → Hazards/Controls → PPE/Publish)
- Job site filtering with smart sorting (today's JSAs first)
- Default "Today" filter for quick daily access
- Digital signature workflow for employee acknowledgment
- SOP document attachments support
- Archive/restore functionality

### Standard Operating Procedures (SOP)
- Upload and manage PDF documents (10MB limit)
- Equipment-specific SOP requirements
- Mandatory acknowledgment before inspections
- Supervisor view of all acknowledgments

### Time Tracking
- GPS-validated clock in/out
- Geofencing for job sites (configurable radius)
- Real-time personnel tracking
- Session history with location data

### User Management
- Supervisor-managed email/password authentication
- Role-based access control (employee/supervisor)
- Cloud Functions for user CRUD operations
- Custom claims for authorization

---

## Firebase Configuration

### Realtime Database Structure
All data lives under `/v2/` namespace:
- `/inspections/{id}` - Equipment inspection records
- `/jsas/{id}` - Job Safety Analyses
- `/sops/{id}` - Standard Operating Procedures
- `/timeSessions/{id}` - Time tracking sessions
- `/jobSites/{id}` - Job site definitions with geofencing
- `/users/{uid}` - User profiles and roles

### Security Rules
- Deny-by-default at root
- Authentication required for all operations
- Owner-only writes for user data
- Supervisor role escalation via `/v2/users/{uid}/role`

### Storage
- `/sops/{sopId}/{filename}` - SOP PDFs (10MB limit)
- `/inspections/{inspectionId}/photos/{fileName}` - Inspection photos (10MB limit, images only)

---

## Creating Your First Supervisor

After deployment, create a supervisor account:

1. **Via Firebase Console:**
   - Go to Firebase Console → Authentication
   - Add user with email/password
   - Note the UID
   - Go to Realtime Database → `/v2/users/{uid}`
   - Create user profile:
     ```json
     {
       "email": "supervisor@company.com",
       "displayName": "Admin User",
       "role": "supervisor",
       "createdAt": {".sv": "timestamp"},
       "createdBy": "system",
       "disabled": false
     }
     ```

2. **Use Cloud Function (after first supervisor exists):**
   - Navigate to `/users` in the app
   - Use the UserManagement page to create additional supervisors

---

## Environment Variables

### Required
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_FIREBASE_DATABASE_URL` - Realtime Database URL

### Optional
- `VITE_RTDB_ROOT` - Database root path (default: `/v2`)

---

## Tech Stack Details

- **React 19** - UI library with latest features
- **TypeScript 5.8** - Type safety
- **Vite 7** - Fast build tool with HMR
- **Firebase 12** - Backend as a Service
  - Authentication (Email/Password)
  - Realtime Database (NoSQL)
  - Cloud Storage (File uploads)
  - Cloud Functions (Serverless backend)
- **Tailwind CSS 3** - Utility-first styling
- **React Router 7** - Client-side routing

---

## License

Proprietary - Internal use only

---

## Support

For issues or questions, contact your development team.
