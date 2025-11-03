/**
 * Time Tracking & Job Site Types
 *
 * Core data structures for clock-in/out system with GPS verification
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface JobSite {
  id: string;
  name: string;
  location: Coordinates;
  radius: number; // Verification radius in feet (default: 328ft)
  radiusMeters?: number; // Legacy support (was stored in feet despite name)
  address: string;
  active: boolean;
  createdBy: string; // uid
  createdAt: number;
  updatedAt?: number;
}

export interface TimeEntry {
  id: string;
  userId: string;
  userName: string; // Denormalized for display
  siteId: string;
  siteName: string; // Denormalized for display
  clockInAt: number; // UTC timestamp
  clockOutAt?: number; // UTC timestamp
  coords: Coordinates;
  accuracy: number; // GPS accuracy in feet
  distance: number; // Distance from site center in feet
  withinRadius: boolean;
  timezoneOffset: number; // Minutes from UTC
  status: "active" | "completed" | "flagged";
  flagReason?: string;
  approvedBy?: string; // uid of supervisor who approved
  approvedAt?: number;
  autoClockOut?: boolean; // If clocked out automatically
}

export interface ActiveSession {
  userId: string;
  userName: string;
  siteId: string;
  siteName: string;
  clockInAt: number;
  coords: Coordinates;
  accuracy: number; // GPS accuracy in feet
}

export interface SitePersonnel {
  userId: string;
  userName: string;
  clockInAt: number;
  coords: Coordinates;
  accuracy: number; // GPS accuracy in feet
}

export interface SupervisorAlert {
  id: string;
  type: "out_of_radius" | "poor_accuracy" | "late_sync" | "gps_denied";
  userId: string;
  userName: string;
  siteId: string;
  siteName: string;
  distance?: number; // Distance from site in feet (for out_of_radius)
  accuracy?: number; // GPS accuracy in feet (for poor_accuracy)
  timestamp: number;
  acknowledged: boolean;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  entryId?: string; // Link to time entry
}

export interface LocationResult {
  coords: Coordinates;
  accuracy: number; // GPS accuracy in feet
  timestamp: number;
  denied?: boolean;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  distance: number; // Distance in feet
  effectiveRadius: number; // Effective radius in feet
  reason?: string;
}

// For offline queue
export interface PendingClockIn {
  id: string;
  userId: string;
  userName: string;
  siteId: string;
  siteName: string;
  timestamp: number;
  coords: Coordinates;
  accuracy: number; // GPS accuracy in feet
  synced: boolean;
}

export interface PendingClockOut {
  id: string;
  userId: string;
  timestamp: number;
  synced: boolean;
}

// Helper type for creating new job sites
export type NewJobSite = Omit<JobSite, "id" | "createdAt" | "updatedAt">;

// Helper type for creating time entries (before ID generation)
export type NewTimeEntry = Omit<TimeEntry, "id">;
