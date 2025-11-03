/**
 * Fix Job Sites - Add Missing Location Data
 *
 * Adds proper location coordinates and radius to job sites
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Load service account key
const serviceAccount = JSON.parse(
  readFileSync('./firebase-service-account-2.json', 'utf8')
);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://equipment-inspection-sys-615a9-default-rtdb.firebaseio.com'
});

const db = admin.database();

// Sample locations (using different areas in Tennessee as examples)
const locationFixes = {
  'North Quarry': {
    location: { lat: 35.1495, lng: -90.0490 }, // Memphis area
    radius: 328, // 328ft (100m equivalent)
    address: '1234 Mining Rd, Memphis, TN'
  },
  'South Construction': {
    location: { lat: 35.0456, lng: -85.3097 }, // Chattanooga area
    radius: 328, // 328ft (100m equivalent)
    address: '5678 Builder Ave, Chattanooga, TN'
  },
  'East Farm': {
    location: { lat: 36.1627, lng: -86.7816 }, // Nashville area
    radius: 328, // 328ft (100m equivalent)
    address: '9012 Rural Rt 5, Nashville, TN'
  }
};

async function main() {
  console.log('\n=== Fixing Job Sites Location Data ===\n');

  try {
    const snapshot = await db.ref('/v2/jobSites').once('value');

    if (!snapshot.exists()) {
      console.log('❌ No job sites found!');
      process.exit(1);
    }

    const updates = {};
    let fixCount = 0;

    snapshot.forEach((childSnapshot) => {
      const site = childSnapshot.val();
      const siteId = childSnapshot.key;
      const siteName = site.name;

      // Check if location data is missing
      if (!site.location || site.location.lat === undefined || site.radius === undefined) {
        console.log(`🔧 Fixing: ${siteName}`);

        const fix = locationFixes[siteName];
        if (fix) {
          updates[`/v2/jobSites/${siteId}/location`] = fix.location;
          updates[`/v2/jobSites/${siteId}/radius`] = fix.radius;
          updates[`/v2/jobSites/${siteId}/address`] = fix.address;
          updates[`/v2/jobSites/${siteId}/updatedAt`] = admin.database.ServerValue.TIMESTAMP;

          console.log(`   ✅ Location: ${fix.location.lat}, ${fix.location.lng}`);
          console.log(`   ✅ Radius: ${fix.radius}ft`);
          fixCount++;
        } else {
          console.log(`   ⚠️  No fix defined for "${siteName}"`);
        }
      } else {
        console.log(`✓ ${siteName} - Already has location data`);
      }
    });

    if (fixCount === 0) {
      console.log('\n✅ All job sites have proper location data!');
      process.exit(0);
    }

    console.log(`\n📝 Applying ${fixCount} fix(es)...`);
    await db.ref().update(updates);

    console.log('✅ Job sites fixed!\n');
    console.log('Next step: Try clocking in again\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
