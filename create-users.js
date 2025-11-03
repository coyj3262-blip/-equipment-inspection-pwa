/**
 * Script to create user accounts for the Equipment Inspection System
 *
 * Usage:
 *   node create-users.js
 *
 * This script creates:
 * 1. A supervisor account
 * 2. A non-supervisor (employee) account
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { createInterface } from 'readline';

// Initialize Firebase Admin SDK
// Make sure you have your service account key available
const serviceAccount = JSON.parse(
  readFileSync('./firebase-service-account.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://equipment-inspection-sys-615a9-default-rtdb.firebaseio.com'
});

const db = admin.database();
const auth = admin.auth();

// Readline interface for user input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createUser(userData) {
  try {
    // Create auth user
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      disabled: false
    });

    console.log(`✅ Created auth user: ${userRecord.uid}`);

    // Create database profile
    const profileData = {
      email: userData.email,
      displayName: userData.displayName,
      phoneNumber: userData.phoneNumber || '',
      jobTitle: userData.jobTitle || '',
      role: userData.role,
      createdBy: 'admin-script',
      createdAt: Date.now(),
      disabled: false
    };

    await db.ref(`v2/users/${userRecord.uid}`).set(profileData);
    console.log(`✅ Created database profile at v2/users/${userRecord.uid}`);

    // If supervisor, add to supervisors list
    if (userData.role === 'supervisor') {
      await db.ref(`v2/supervisors/${userRecord.uid}`).set(true);
      console.log(`✅ Added to supervisors list`);
    }

    console.log(`\n🎉 User created successfully!`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   Password: ${userData.password}\n`);

    return userRecord;
  } catch (error) {
    console.error(`❌ Error creating user:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('\n=== Equipment Inspection System - User Creation ===\n');

  // Create supervisor account
  console.log('📋 CREATING SUPERVISOR ACCOUNT\n');

  const supervisorEmail = await question('Supervisor Email: ');
  const supervisorPassword = await question('Supervisor Password: ');
  const supervisorName = await question('Supervisor Display Name: ');
  const supervisorPhone = await question('Supervisor Phone (optional): ');
  const supervisorTitle = await question('Supervisor Job Title (optional): ');

  await createUser({
    email: supervisorEmail,
    password: supervisorPassword,
    displayName: supervisorName,
    phoneNumber: supervisorPhone,
    jobTitle: supervisorTitle || 'Supervisor',
    role: 'supervisor'
  });

  // Create employee account
  console.log('\n📋 CREATING EMPLOYEE (NON-SUPERVISOR) ACCOUNT\n');

  const employeeEmail = await question('Employee Email: ');
  const employeePassword = await question('Employee Password: ');
  const employeeName = await question('Employee Display Name: ');
  const employeePhone = await question('Employee Phone (optional): ');
  const employeeTitle = await question('Employee Job Title (optional): ');

  await createUser({
    email: employeeEmail,
    password: employeePassword,
    displayName: employeeName,
    phoneNumber: employeePhone,
    jobTitle: employeeTitle || 'Operator',
    role: 'employee'
  });

  console.log('\n✅ All users created successfully!\n');

  rl.close();
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
