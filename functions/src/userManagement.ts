import {onCall, HttpsError, CallableRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

/**
 * Password validation helper
 * Requirements: min 8 chars, 1 number, 1 uppercase letter
 */
function validatePassword(password: string): {valid: boolean; error?: string} {
  if (password.length < 8) {
    return {valid: false, error: "Password must be at least 8 characters long"};
  }
  if (!/\d/.test(password)) {
    return {valid: false, error: "Password must contain at least one number"};
  }
  if (!/[A-Z]/.test(password)) {
    return {valid: false, error: "Password must contain at least one uppercase letter"};
  }
  return {valid: true};
}

/**
 * Verify caller has supervisor custom claim
 */
function verifySupervisor(request: CallableRequest): void {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be logged in to perform this operation"
    );
  }

  const isSupervisor = request.auth.token.supervisor === true ||
                      request.auth.token.role === "supervisor";

  if (!isSupervisor) {
    throw new HttpsError(
      "permission-denied",
      "Only supervisors can perform this operation"
    );
  }
}

/**
 * Create a new employee with email/password authentication
 * Sets custom claims and creates user profile in /v2/users/{uid}
 */
export const createEmployee = onCall(async (request) => {
  try {
    // Verify supervisor access
    verifySupervisor(request);

    const {email, password, displayName, role} = request.data;

    // Validate required fields
    if (!email || !password || !displayName || !role) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: email, password, displayName, and role are required"
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid email format"
      );
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new HttpsError(
        "invalid-argument",
        passwordValidation.error || "Password validation failed"
      );
    }

    // Validate role
    if (role !== "employee" && role !== "supervisor") {
      throw new HttpsError(
        "invalid-argument",
        "Role must be either 'employee' or 'supervisor'"
      );
    }

    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    });

    logger.info(`Created auth user ${userRecord.uid} for ${email}`);

    try {
      // Set custom claims
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role,
        supervisor: role === "supervisor",
      });

      logger.info(`Set custom claims for user ${userRecord.uid}: role=${role}`);

      // Create user profile in Realtime Database
      const userProfile = {
        email,
        displayName,
        role,
        phoneNumber: request.data.phoneNumber || "",
        jobTitle: request.data.jobTitle || "",
        createdBy: request.auth!.uid,
        createdAt: admin.database.ServerValue.TIMESTAMP,
        updatedAt: admin.database.ServerValue.TIMESTAMP,
        disabled: false,
      };

      await admin.database().ref(`/v2/users/${userRecord.uid}`).set(userProfile);

      logger.info(`Created user profile for ${userRecord.uid} in /v2/users`);

      return {
        success: true,
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        role,
      };
    } catch (error) {
      // Rollback: delete auth user if profile creation fails
      await admin.auth().deleteUser(userRecord.uid);
      logger.error(`Rolled back user creation for ${userRecord.uid}`, error);
      throw error;
    }
  } catch (error: unknown) {
    if (error instanceof HttpsError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.error("Error in createEmployee:", error);
    throw new HttpsError("internal", `Failed to create employee: ${errorMessage}`);
  }
});

/**
 * Update employee profile
 * Allows updating displayName, phoneNumber, and jobTitle
 */
export const updateEmployeeProfile = onCall(async (request) => {
  try {
    // Verify supervisor access
    verifySupervisor(request);

    const {uid, updates} = request.data;

    if (!uid) {
      throw new HttpsError(
        "invalid-argument",
        "User ID (uid) is required"
      );
    }

    if (!updates || typeof updates !== "object") {
      throw new HttpsError(
        "invalid-argument",
        "Updates object is required"
      );
    }

    // Verify user exists
    const userRecord = await admin.auth().getUser(uid);
    if (!userRecord) {
      throw new HttpsError("not-found", "User not found");
    }

    // Prepare allowed updates
    const allowedFields = ["displayName", "phoneNumber", "jobTitle"];
    const profileUpdates: {[key: string]: unknown} = {
      updatedAt: admin.database.ServerValue.TIMESTAMP,
    };

    // Update Firebase Auth displayName if provided
    const authUpdates: {displayName?: string} = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === "displayName" && typeof value === "string") {
          authUpdates.displayName = value;
          profileUpdates[key] = value;
        } else if (typeof value === "string") {
          profileUpdates[key] = value;
        }
      }
    }

    // Update Firebase Auth if displayName changed
    if (authUpdates.displayName) {
      await admin.auth().updateUser(uid, authUpdates);
      logger.info(`Updated auth displayName for user ${uid}`);
    }

    // Update Realtime Database profile
    await admin.database().ref(`/v2/users/${uid}`).update(profileUpdates);

    logger.info(`Updated profile for user ${uid}:`, profileUpdates);

    return {
      success: true,
      uid,
      updatedFields: Object.keys(profileUpdates),
    };
  } catch (error: unknown) {
    if (error instanceof HttpsError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.error("Error in updateEmployeeProfile:", error);
    throw new HttpsError("internal", `Failed to update profile: ${errorMessage}`);
  }
});

/**
 * Disable an employee account
 * Sets disabled flag in both Auth and RTDB
 */
export const disableEmployee = onCall(async (request) => {
  try {
    // Verify supervisor access
    verifySupervisor(request);

    const {uid} = request.data;

    if (!uid) {
      throw new HttpsError(
        "invalid-argument",
        "User ID (uid) is required"
      );
    }

    // Verify user exists
    const userRecord = await admin.auth().getUser(uid);
    if (!userRecord) {
      throw new HttpsError("not-found", "User not found");
    }

    // Disable in Firebase Auth
    await admin.auth().updateUser(uid, {disabled: true});

    // Update database profile
    await admin.database().ref(`/v2/users/${uid}`).update({
      disabled: true,
      disabledAt: admin.database.ServerValue.TIMESTAMP,
      disabledBy: request.auth!.uid,
      updatedAt: admin.database.ServerValue.TIMESTAMP,
    });

    logger.info(`Disabled user ${uid} by supervisor ${request.auth!.uid}`);

    return {
      success: true,
      uid,
      message: "Employee account has been disabled",
    };
  } catch (error: unknown) {
    if (error instanceof HttpsError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.error("Error in disableEmployee:", error);
    throw new HttpsError("internal", `Failed to disable employee: ${errorMessage}`);
  }
});

/**
 * Enable an employee account (re-enable previously disabled account)
 */
export const enableEmployee = onCall(async (request) => {
  try {
    // Verify supervisor access
    verifySupervisor(request);

    const {uid} = request.data;

    if (!uid) {
      throw new HttpsError(
        "invalid-argument",
        "User ID (uid) is required"
      );
    }

    // Verify user exists
    const userRecord = await admin.auth().getUser(uid);
    if (!userRecord) {
      throw new HttpsError("not-found", "User not found");
    }

    // Enable in Firebase Auth
    await admin.auth().updateUser(uid, {disabled: false});

    // Update database profile
    await admin.database().ref(`/v2/users/${uid}`).update({
      disabled: false,
      enabledAt: admin.database.ServerValue.TIMESTAMP,
      enabledBy: request.auth!.uid,
      updatedAt: admin.database.ServerValue.TIMESTAMP,
    });

    logger.info(`Enabled user ${uid} by supervisor ${request.auth!.uid}`);

    return {
      success: true,
      uid,
      message: "Employee account has been enabled",
    };
  } catch (error: unknown) {
    if (error instanceof HttpsError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.error("Error in enableEmployee:", error);
    throw new HttpsError("internal", `Failed to enable employee: ${errorMessage}`);
  }
});

/**
 * Send password reset email to an employee
 */
export const resetEmployeePassword = onCall(async (request) => {
  try {
    // Verify supervisor access
    verifySupervisor(request);

    const {email} = request.data;

    if (!email) {
      throw new HttpsError(
        "invalid-argument",
        "Email address is required"
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid email format"
      );
    }

    // Verify user exists
    const userRecord = await admin.auth().getUserByEmail(email);
    if (!userRecord) {
      throw new HttpsError("not-found", "User not found");
    }

    // Generate password reset link
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    logger.info(`Generated password reset link for ${email} by supervisor ${request.auth!.uid}`);

    return {
      success: true,
      email,
      resetLink,
      message: "Password reset link generated. Send this link to the employee securely.",
    };
  } catch (error: unknown) {
    if (error instanceof HttpsError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.error("Error in resetEmployeePassword:", error);
    throw new HttpsError("internal", `Failed to reset password: ${errorMessage}`);
  }
});

/**
 * Get all employees (supervisor only)
 */
export const listEmployees = onCall(async (request) => {
  try {
    // Verify supervisor access
    verifySupervisor(request);

    // Get all users from Realtime Database
    const snapshot = await admin.database().ref("/v2/users").once("value");
    const users = snapshot.val();

    if (!users) {
      return {
        success: true,
        employees: [],
      };
    }

    const employees = Object.entries(users).map(([uid, profile]: [string, unknown]) => ({
      uid,
      ...(profile as object),
    }));

    return {
      success: true,
      employees,
    };
  } catch (error: unknown) {
    if (error instanceof HttpsError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.error("Error in listEmployees:", error);
    throw new HttpsError("internal", `Failed to list employees: ${errorMessage}`);
  }
});
