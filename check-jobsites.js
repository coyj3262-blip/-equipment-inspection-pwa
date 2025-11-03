/**
 * Check Job Sites Data
 *
 * Verify job sites have proper location coordinates
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

async function main() {
  console.log('\n=== Job Sites Location Data Check ===\n');

  try {
    const snapshot = await db.ref('/v2/jobSites').once('value');

    if (!snapshot.exists()) {
      console.log('❌ No job sites found in database!');
      process.exit(1);
    }

    console.log('Found job sites:\n');

    snapshot.forEach((childSnapshot) => {
      const site = childSnapshot.val();
      console.log(`📍 ${site.name || 'Unknown'}`);
      console.log(`   ID: ${childSnapshot.key}`);
      console.log(`   Active: ${site.active ? '✅' : '❌'}`);
      console.log(`   Location: ${JSON.stringify(site.location)}`);
      console.log(`   Radius: ${site.radius}ft`);
      console.log(`   Address: ${site.address || 'N/A'}`);

      // Check for missing/invalid location data
      if (!site.location) {
        console.log(`   ⚠️  WARNING: No location object!`);
      } else if (site.location.lat === undefined || site.location.lng === undefined) {
        console.log(`   ⚠️  WARNING: Missing lat/lng coordinates!`);
      } else if (site.location.lat === 0 && site.location.lng === 0) {
        console.log(`   ⚠️  WARNING: Coordinates are 0,0 (likely placeholder)`);
      }

      // Check for missing/invalid radius
      if (!site.radius) {
        console.log(`   ⚠️  WARNING: No radius value!`);
      } else if (site.radius < 164) {
        console.log(`   ⚠️  WARNING: Radius too small (< 164ft minimum)`);
      }
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
