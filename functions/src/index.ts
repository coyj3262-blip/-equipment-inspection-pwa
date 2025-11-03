import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp({
  databaseURL: "https://equipment-inspection-sys-615a9-default-rtdb.firebaseio.com",
});

// Export all user management functions
export {
  createEmployee,
  updateEmployeeProfile,
  disableEmployee,
  enableEmployee,
  resetEmployeePassword,
  listEmployees,
} from "./userManagement";
