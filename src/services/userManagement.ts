/**
 * User Management Service
 *
 * Client wrapper for Firebase Cloud Functions user management operations
 */

import { ref, get, update, onValue, off } from "firebase/database";
import { updatePassword, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { rtdb, auth } from "../firebase";
import { path } from "../backend.paths";
import type { User, UpdateUserData, UpdateProfileData } from "../types/user";

// Initialize Cloud Functions
const functions = getFunctions();

/**
 * Get all users from the database
 * Returns array of users with their UIDs
 */
export async function getAllUsers(): Promise<User[]> {
  const usersRef = ref(rtdb, path("users"));
  const snapshot = await get(usersRef);

  if (!snapshot.exists()) {
    return [];
  }

  const usersData = snapshot.val();
  const users: User[] = [];

  for (const [uid, userData] of Object.entries(usersData)) {
    users.push({
      uid,
      ...(userData as Omit<User, "uid">),
    });
  }

  // Sort by displayName
  users.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return users;
}

/**
 * Subscribe to real-time user list updates
 */
export function subscribeToUsers(
  callback: (users: User[]) => void
): () => void {
  const usersRef = ref(rtdb, path("users"));

  const listener = (snapshot: any) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const usersData = snapshot.val();
    const users: User[] = [];

    for (const [uid, userData] of Object.entries(usersData)) {
      users.push({
        uid,
        ...(userData as Omit<User, "uid">),
      });
    }

    // Sort by displayName
    users.sort((a, b) => a.displayName.localeCompare(b.displayName));

    callback(users);
  };

  onValue(usersRef, listener);

  return () => {
    off(usersRef, "value", listener);
  };
}

/**
 * Get a single user by UID
 */
export async function getUser(uid: string): Promise<User | null> {
  const userRef = ref(rtdb, path("users", uid));
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    uid,
    ...snapshot.val(),
  } as User;
}

/**
 * Update user profile data (supervisor only for other users)
 * Calls Cloud Function to update both Firebase Auth and RTDB profile
 */
export async function updateUser(
  uid: string,
  updates: UpdateUserData
): Promise<void> {
  const updateEmployeeProfile = httpsCallable(functions, 'updateEmployeeProfile');
  await updateEmployeeProfile({ uid, updates });
}

/**
 * Update current user's own profile
 * Updates both Firebase Auth profile and database profile
 */
export async function updateOwnProfile(
  updates: UpdateProfileData
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Not authenticated");
  }

  // Update Auth profile
  if (updates.displayName) {
    await updateProfile(currentUser, {
      displayName: updates.displayName,
    });
  }

  // Update database profile
  const userRef = ref(rtdb, path("users", currentUser.uid));
  const payload: any = {
    ...updates,
    updatedAt: Date.now(),
  };

  await update(userRef, payload);
}

/**
 * Disable a user account (supervisor only)
 * Calls Cloud Function to disable in both Firebase Auth and RTDB
 */
export async function disableUser(uid: string): Promise<void> {
  const disableEmployee = httpsCallable(functions, 'disableEmployee');
  await disableEmployee({ uid });
}

/**
 * Enable a user account (supervisor only)
 * Calls Cloud Function to enable in both Firebase Auth and RTDB
 */
export async function enableUser(uid: string): Promise<void> {
  const enableEmployee = httpsCallable(functions, 'enableEmployee');
  await enableEmployee({ uid });
}

/**
 * Send password reset email
 */
export async function resetUserPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Change current user's password
 */
export async function changePassword(newPassword: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Not authenticated");
  }

  await updatePassword(currentUser, newPassword);
}

/**
 * Create a new user (supervisor only)
 * Calls Cloud Function to create Firebase Auth user + profile in RTDB
 */
export async function createUser(data: {
  email: string;
  password: string;
  displayName: string;
  role: "employee" | "supervisor";
  phoneNumber?: string;
  jobTitle?: string;
}): Promise<{ uid: string; email: string }> {
  const createEmployee = httpsCallable(functions, 'createEmployee');
  const result = await createEmployee(data);
  const resultData = result.data as { uid: string; email: string };
  return { uid: resultData.uid, email: resultData.email };
}
