/**
 * Clear All Metric Data
 *
 * Removes ALL time tracking data AND job sites (which contain metric values)
 * Preserves: user accounts, JSAs, SOPs, inspections, etc.
 *
 * Run this before switching to imperial-only system
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

async function countRecords(path) {
  const snapshot = await db.ref(path).once('value');
  if (!snapshot.exists()) return 0;

  let count = 0;
  snapshot.forEach(() => {
    count++;
  });
  return count;
}

async function deleteNode(path, label) {
  try {
    const count = await countRecords(path);
    if (count === 0) {
      console.log(`   ${label}: No data to delete`);
      return 0;
    }

    await db.ref(path).remove();
    console.log(`   ✅ ${label}: Deleted ${count} record(s)`);
    return count;
  } catch (error) {
    console.error(`   ❌ ${label}: Error - ${error.message}`);
    return 0;
  }
}

async function main() {
  console.log('\n=== Clear All Metric Data - Imperial Units Migration ===\n');
  console.log('⚠️  This will delete:');
  console.log('   ❌ Time entries (all users)');
  console.log('   ❌ Active sessions');
  console.log('   ❌ Site personnel records');
  console.log('   ❌ Site time history');
  console.log('   ❌ Supervisor alerts');
  console.log('   ❌ Job sites (contain radiusMeters)\n');
  console.log('✅ PRESERVED:');
  console.log('   ✓ User accounts');
  console.log('   ✓ JSAs & SOPs');
  console.log('   ✓ Equipment inspections');
  console.log('   ✓ Daily reports\n');

  console.log('🗑️  Starting cleanup...\n');

  try {
    let totalDeleted = 0;

    // Delete all time tracking data
    totalDeleted += await deleteNode('/v2/timeEntries', 'Time Entries');
    totalDeleted += await deleteNode('/v2/activeSessions', 'Active Sessions');
    totalDeleted += await deleteNode('/v2/sitePersonnel', 'Site Personnel');
    totalDeleted += await deleteNode('/v2/siteTimeEntries', 'Site Time History');
    totalDeleted += await deleteNode('/v2/supervisorAlerts', 'Supervisor Alerts');

    // Delete job sites (they contain radiusMeters which is metric)
    totalDeleted += await deleteNode('/v2/jobSites', 'Job Sites');

    console.log('\n✅ CLEANUP COMPLETE!');
    console.log(`   Total records deleted: ${totalDeleted}\n`);
    console.log('📝 Next steps:');
    console.log('1. Deploy imperial-only code changes');
    console.log('2. Create new job sites with imperial units (radius in feet)');
    console.log('3. Test clock-in/out with new job sites');
    console.log('4. Verify all distances show in feet/miles\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
