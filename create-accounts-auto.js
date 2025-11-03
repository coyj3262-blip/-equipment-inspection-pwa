/**
 * Automated script to create user accounts with pre-set values
 *
 * CUSTOMIZE THE VALUES BELOW, then run: node create-accounts-auto.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDQgMwkd2WIxGqXDDrw_f1UzJAjYG-FRIU",
  authDomain: "equipment-inspection-sys-615a9.firebaseapp.com",
  databaseURL: "https://equipment-inspection-sys-615a9-default-rtdb.firebaseio.com",
  projectId: "equipment-inspection-sys-615a9",
  storageBucket: "equipment-inspection-sys-615a9.firebasestorage.app",
  appId: "1:580043464912:web:d28a43d46d3d920cbabed5"
};

// ============================================================
// CUSTOMIZE THESE VALUES
// ============================================================

// YOUR existing supervisor credentials (to authenticate)
const EXISTING_SUPERVISOR = {
  email: 'coyjacobs@mtaftlogging.com',
  password: 'bulldozer97'
};

// NEW supervisor account to create
const NEW_SUPERVISOR = {
  email: 'supervisor@mtaftlogging.com',
  password: 'Supervisor123!',
  displayName: 'Sarah Johnson',
  phoneNumber: '555-0201',
  jobTitle: 'Site Supervisor',
  role: 'supervisor'
};

// NEW employee account to create
const NEW_EMPLOYEE = {
  email: 'operator@mtaftlogging.com',
  password: 'Operator123!',
  displayName: 'Mike Thompson',
  phoneNumber: '555-0202',
  jobTitle: 'Equipment Operator',
  role: 'employee'
};

// ============================================================
// END CUSTOMIZATION
// ============================================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

async function createAccount(userData) {
  try {
    console.log(`\n📝 Creating ${userData.role}: ${userData.email}`);

    const createEmployee = httpsCallable(functions, 'createEmployee');
    const result = await createEmployee(userData);

    console.log(`\n✅ ${userData.role.toUpperCase()} CREATED!`);
    console.log(`   UID: ${result.data.uid}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Name: ${userData.displayName}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   Password: ${userData.password}`);

    return result.data;
  } catch (error) {
    console.error(`\n❌ Error creating ${userData.role}:`, error.message);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    throw error;
  }
}

async function main() {
  console.log('\n=== Equipment Inspection System - User Creation ===\n');

  // Authenticate as existing supervisor
  console.log('🔐 Authenticating...');
  try {
    await signInWithEmailAndPassword(
      auth,
      EXISTING_SUPERVISOR.email,
      EXISTING_SUPERVISOR.password
    );
    console.log('✅ Authenticated as supervisor\n');
  } catch (error) {
    console.error('\n❌ Authentication failed:', error.message);
    console.error('\n⚠️  Make sure to update EXISTING_SUPERVISOR credentials in the script!\n');
    process.exit(1);
  }

  // Create new supervisor
  await createAccount(NEW_SUPERVISOR);
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Create new employee
  await createAccount(NEW_EMPLOYEE);

  console.log('\n\n🎉 ALL USERS CREATED SUCCESSFULLY!\n');
  console.log('Login credentials:\n');
  console.log(`Supervisor: ${NEW_SUPERVISOR.email} / ${NEW_SUPERVISOR.password}`);
  console.log(`Employee:   ${NEW_EMPLOYEE.email} / ${NEW_EMPLOYEE.password}\n`);

  process.exit(0);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
