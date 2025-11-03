/**
 * Create users using Firebase Admin SDK (no auth required)
 *
 * This bypasses the Cloud Function and creates users directly.
 * Requires firebase-admin package and service account key.
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
const auth = admin.auth();

async function createAccount(userData) {
  try {
    console.log(`\n📝 Creating ${userData.role}: ${userData.email}`);

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      disabled: false
    });

    console.log(`✅ Auth user created: ${userRecord.uid}`);

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role: userData.role,
      supervisor: userData.role === 'supervisor'
    });

    console.log(`✅ Custom claims set`);

    // Create database profile
    const profileData = {
      email: userData.email,
      displayName: userData.displayName,
      phoneNumber: userData.phoneNumber || '',
      jobTitle: userData.jobTitle || '',
      role: userData.role,
      createdBy: 'admin-script',
      createdAt: admin.database.ServerValue.TIMESTAMP,
      disabled: false
    };

    await db.ref(`/v2/users/${userRecord.uid}`).set(profileData);
    console.log(`✅ Database profile created`);

    console.log(`\n🎉 ${userData.role.toUpperCase()} CREATED!`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Name: ${userData.displayName}`);
    console.log(`   Password: ${userData.password}`);

    return userRecord;
  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    throw error;
  }
}

async function main() {
  console.log('\n=== Equipment Inspection System - User Creation (Admin) ===\n');

  const supervisor = {
    email: 'supervisor@mtaftlogging.com',
    password: 'Supervisor123!',
    displayName: 'Sarah Johnson',
    phoneNumber: '555-0201',
    jobTitle: 'Site Supervisor',
    role: 'supervisor'
  };

  const employee = {
    email: 'operator@mtaftlogging.com',
    password: 'Operator123!',
    displayName: 'Mike Thompson',
    phoneNumber: '555-0202',
    jobTitle: 'Equipment Operator',
    role: 'employee'
  };

  try {
    await createAccount(supervisor);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await createAccount(employee);

    console.log('\n\n🎉 ALL USERS CREATED SUCCESSFULLY!\n');
    console.log('Login credentials:\n');
    console.log(`Supervisor: ${supervisor.email} / ${supervisor.password}`);
    console.log(`Employee:   ${employee.email} / ${employee.password}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
