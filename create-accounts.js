/**
 * Script to create user accounts using the deployed Cloud Functions
 *
 * This script:
 * 1. Logs in as an existing supervisor (required for Cloud Function auth)
 * 2. Calls the createEmployee Cloud Function to create both accounts
 *
 * Usage: node create-accounts.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { createInterface } from 'readline';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDQgMwkd2WIxGqXDDrw_f1UzJAjYG-FRIU",
  authDomain: "equipment-inspection-sys-615a9.firebaseapp.com",
  databaseURL: "https://equipment-inspection-sys-615a9-default-rtdb.firebaseio.com",
  projectId: "equipment-inspection-sys-615a9",
  storageBucket: "equipment-inspection-sys-615a9.firebasestorage.app",
  appId: "1:580043464912:web:d28a43d46d3d920cbabed5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

// Readline interface for user input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAccount(userData) {
  try {
    console.log(`\n📝 Creating ${userData.role} account: ${userData.email}`);

    const createEmployee = httpsCallable(functions, 'createEmployee');
    const result = await createEmployee(userData);

    console.log(`✅ ${userData.role.toUpperCase()} CREATED SUCCESSFULLY!`);
    console.log(`   UID: ${result.data.uid}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Name: ${userData.displayName}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   Password: ${userData.password}`);

    return result.data;
  } catch (error) {
    console.error(`❌ Error creating ${userData.role}:`, error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    throw error;
  }
}

async function main() {
  console.log('\n=== Equipment Inspection System - User Creation ===\n');

  // First, authenticate as an existing supervisor
  console.log('⚠️  You must be logged in as a supervisor to create accounts.\n');

  const supervisorEmail = await question('Your supervisor email: ');
  const supervisorPassword = await question('Your supervisor password: ');

  try {
    await signInWithEmailAndPassword(auth, supervisorEmail, supervisorPassword);
    console.log('✅ Authenticated successfully\n');
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    rl.close();
    process.exit(1);
  }

  // Get details for NEW supervisor account
  console.log('📋 CREATING NEW SUPERVISOR ACCOUNT\n');

  const newSupervisorEmail = await question('New Supervisor Email: ');
  const newSupervisorPassword = await question('New Supervisor Password: ');
  const newSupervisorName = await question('New Supervisor Display Name: ');
  const newSupervisorPhone = await question('New Supervisor Phone (optional): ');
  const newSupervisorTitle = await question('New Supervisor Job Title (optional): ');

  await createAccount({
    email: newSupervisorEmail,
    password: newSupervisorPassword,
    displayName: newSupervisorName,
    phoneNumber: newSupervisorPhone || '',
    jobTitle: newSupervisorTitle || 'Supervisor',
    role: 'supervisor'
  });

  // Small delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Get details for employee account
  console.log('\n📋 CREATING EMPLOYEE (NON-SUPERVISOR) ACCOUNT\n');

  const employeeEmail = await question('Employee Email: ');
  const employeePassword = await question('Employee Password: ');
  const employeeName = await question('Employee Display Name: ');
  const employeePhone = await question('Employee Phone (optional): ');
  const employeeTitle = await question('Employee Job Title (optional): ');

  await createAccount({
    email: employeeEmail,
    password: employeePassword,
    displayName: employeeName,
    phoneNumber: employeePhone || '',
    jobTitle: employeeTitle || 'Operator',
    role: 'employee'
  });

  console.log('\n✅ ALL USERS CREATED SUCCESSFULLY!\n');
  console.log('Users can now log in with their credentials.\n');

  rl.close();
  process.exit(0);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  rl.close();
  process.exit(1);
});
