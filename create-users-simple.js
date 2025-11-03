/**
 * Simple script to create user accounts using Firebase Auth and Realtime Database
 *
 * Prerequisites:
 * 1. Make sure you're logged into Firebase CLI: firebase login
 * 2. Run with: node create-users-simple.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';

// Your Firebase config (from .env)
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
const db = getDatabase(app);

async function createAccount(email, password, displayName, role, phoneNumber = '', jobTitle = '') {
  try {
    console.log(`\n📝 Creating ${role} account: ${email}`);

    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log(`✅ Auth user created: ${user.uid}`);

    // Create database profile
    const profileData = {
      email: email,
      displayName: displayName,
      phoneNumber: phoneNumber,
      jobTitle: jobTitle,
      role: role,
      createdBy: 'admin-script',
      createdAt: Date.now(),
      disabled: false
    };

    await set(ref(db, `v2/users/${user.uid}`), profileData);
    console.log(`✅ Database profile created`);

    // If supervisor, add to supervisors list
    if (role === 'supervisor') {
      await set(ref(db, `v2/supervisors/${user.uid}`), true);
      console.log(`✅ Added to supervisors list`);
    }

    console.log(`\n🎉 ${role.toUpperCase()} CREATED SUCCESSFULLY!`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${displayName}`);
    console.log(`   Password: ${password}`);

    return user;
  } catch (error) {
    console.error(`❌ Error creating ${role}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('\n=== Equipment Inspection System - User Creation ===\n');

  // You can customize these values:

  // SUPERVISOR ACCOUNT
  const supervisorData = {
    email: 'supervisor2@example.com',
    password: 'Supervisor123!',
    displayName: 'Sarah Johnson',
    role: 'supervisor',
    phoneNumber: '555-0102',
    jobTitle: 'Site Supervisor'
  };

  // EMPLOYEE ACCOUNT
  const employeeData = {
    email: 'operator2@example.com',
    password: 'Operator123!',
    displayName: 'Mike Smith',
    role: 'employee',
    phoneNumber: '555-0103',
    jobTitle: 'Equipment Operator'
  };

  try {
    // Create supervisor
    await createAccount(
      supervisorData.email,
      supervisorData.password,
      supervisorData.displayName,
      supervisorData.role,
      supervisorData.phoneNumber,
      supervisorData.jobTitle
    );

    // Small delay between creations
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create employee
    await createAccount(
      employeeData.email,
      employeeData.password,
      employeeData.displayName,
      employeeData.role,
      employeeData.phoneNumber,
      employeeData.jobTitle
    );

    console.log('\n✅ ALL USERS CREATED SUCCESSFULLY!\n');
    console.log('You can now log in with these credentials.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
