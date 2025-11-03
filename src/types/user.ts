/**
 * User Management Types
 *
 * Core data structures for user profiles and roles
 */

export type UserRole = "employee" | "supervisor";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  jobTitle?: string;
  photoURL?: string;
  role: UserRole;
  createdBy: string; // uid of supervisor who created this user
  createdAt: number;
  updatedAt?: number;
  disabled: boolean;
}

export interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  phoneNumber?: string;
  jobTitle?: string;
}

export interface UpdateUserData {
  displayName?: string;
  phoneNumber?: string;
  jobTitle?: string;
  role?: UserRole;
}

export interface UpdateProfileData {
  displayName?: string;
  phoneNumber?: string;
  jobTitle?: string;
}

export type NewUser = Omit<User, "uid" | "createdAt" | "updatedAt">;
