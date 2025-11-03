/**
 * Script to set supervisor custom claims on a user account
 * Run this once to fix the supervisor permissions issue
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Check if service account file exists
let serviceAccount;
try {
  serviceAccount = JSON.parse(
    readFileSync('./firebase-service-account.json', 'utf8')
  );
} catch (error) {
  console.error('\n❌ firebase-service-account.json not found!');
  console.error('\nTo create one:');
  console.error('1. Go to Firebase Console → Project Settings → Service Accounts');
  console.error('2. Click "Generate New Private Key"');
  console.error('3. Save the file as firebase-service-account.json in this directory\n');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://equipment-inspection-sys-615a9-default-rtdb.firebaseio.com'
});

const TARGET_EMAIL = 'coyjacobs@mtaftlogging.com';

async function setSupervisorClaim() {
  try {
    console.log(`\n🔍 Looking up user: ${TARGET_EMAIL}`);

    const userRecord = await admin.auth().getUserByEmail(TARGET_EMAIL);
    console.log(`✅ Found user: ${userRecord.uid}`);

    // Set supervisor custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'supervisor',
      supervisor: true
    });

    console.log(`✅ Set supervisor custom claims on ${TARGET_EMAIL}`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Claims: { role: 'supervisor', supervisor: true }`);

    // Also make sure they're in the database with supervisor role
    const db = admin.database();
    const userRef = db.ref(`/v2/users/${userRecord.uid}`);
    const snapshot = await userRef.once('value');

    if (snapshot.exists()) {
      await userRef.update({ role: 'supervisor' });
      console.log(`✅ Updated role in database to 'supervisor'`);
    } else {
      console.log(`⚠️  User profile not found in database at /v2/users/${userRecord.uid}`);
    }

    console.log('\n🎉 Done! The user must log out and log back in for claims to take effect.\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

setSupervisorClaim();
