/**
 * Cleanup Time Tracking Test Data
 *
 * Removes all clock-in/out test data from Firebase Realtime Database
 * Preserves user accounts and job sites
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
  console.log('\n=== Equipment Inspection System - Time Data Cleanup ===\n');
  console.log('⚠️  This will delete ALL time tracking data:');
  console.log('   - Time entries (all users)');
  console.log('   - Active sessions');
  console.log('   - Site personnel records');
  console.log('   - Site time history');
  console.log('   - Supervisor alerts\n');
  console.log('✅ User accounts and job sites will be PRESERVED\n');

  console.log('🗑️  Starting cleanup...\n');

  try {
    let totalDeleted = 0;

    // Delete all time tracking data
    totalDeleted += await deleteNode('/v2/timeEntries', 'Time Entries');
    totalDeleted += await deleteNode('/v2/activeSessions', 'Active Sessions');
    totalDeleted += await deleteNode('/v2/sitePersonnel', 'Site Personnel');
    totalDeleted += await deleteNode('/v2/siteTimeEntries', 'Site Time History');
    totalDeleted += await deleteNode('/v2/supervisorAlerts', 'Supervisor Alerts');

    console.log('\n✅ CLEANUP COMPLETE!');
    console.log(`   Total records deleted: ${totalDeleted}\n`);
    console.log('Next steps:');
    console.log('1. Start dev server: npm run dev');
    console.log('2. Check empty states on:');
    console.log('   - /personnel (Personnel Dashboard)');
    console.log('   - /time-history (Time History)');
    console.log('   - /job-sites/:id/history (Site History)');
    console.log('3. Test fresh clock-in with test accounts');
    console.log('4. Verify data displays correctly\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
