/**
 * Time Clock Service
 *
 * Core clock-in/out logic with GPS verification, atomic writes,
 * and supervisor alert generation.
 */

import { ref, get, update, query, orderByChild, limitToLast } from "firebase/database";
import { rtdb, auth } from "../firebase";
import { path } from "../backend.paths";
import type {
  TimeEntry,
  ActiveSession,
  JobSite,
  SupervisorAlert,
} from "../types/timeTracking";
import {
  getCurrentLocation,
  isWithinRadius,
  isAccuracyAcceptable,
} from "./geolocation";
import { getJobSite } from "./jobSites";

/**
 * Clock in to a job site
 *
 * Process:
 * 1. Get current GPS location
 * 2. Validate against site radius
 * 3. Check for existing active session (auto clock-out if needed)
 * 4. Create time entry with atomic multi-path write
 * 5. Send supervisor alert if outside radius
 *
 * @throws Error if user not authenticated or location denied
 */
export async function clockIn(siteId: string): Promise<{
  success: boolean;
  entryId: string;
  withinRadius: boolean;
  distance: number;
  message: string;
}> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Must be authenticated to clock in");
  }

  const userName = user.displayName?.trim() || user.email?.split('@')[0] || 'Unknown';

  // Get job site details
  const site = await getJobSite(siteId);
  if (!site) {
    throw new Error(`Job site ${siteId} not found`);
  }

  if (!site.active) {
    throw new Error(`Job site ${site.name} is inactive`);
  }

  // Get current location
  const location = await getCurrentLocation();

  if (location.denied || location.error) {
    // GPS denied - create flagged entry requiring supervisor approval
    return await createFlaggedEntry(
      user.uid,
      userName,
      site,
      "gps_denied",
      location.error || "Location permission denied"
    );
  }

  // Validate location against site radius
  const validation = isWithinRadius(
    location.coords,
    location.accuracy,
    site.location,
    site.radius
  );

  // Check accuracy
  const poorAccuracy = !isAccuracyAcceptable(location.accuracy);

  // Check for existing active session
  const existingSession = await getActiveSession(user.uid);
  if (existingSession) {
    // Auto clock-out from old site
    await clockOut(user.uid, {
      reason: "auto_clockout",
      newSiteId: siteId,
    });
  }

  // Create time entry
  const entryId = generateTimeEntryId();
  const timestamp = Date.now();
  const timezoneOffset = new Date().getTimezoneOffset();

  const timeEntry: TimeEntry = {
    id: entryId,
    userId: user.uid,
    userName,
    siteId: site.id,
    siteName: site.name,
    clockInAt: timestamp,
    coords: location.coords,
    accuracy: location.accuracy,
    distance: validation.distance,
    withinRadius: validation.valid,
    timezoneOffset,
    status: validation.valid && !poorAccuracy ? "active" : "flagged",
  };

  // Add optional flagReason only if it exists
  if (poorAccuracy) {
    timeEntry.flagReason = `Poor GPS accuracy (${Math.round(location.accuracy)}ft)`;
  } else if (validation.reason) {
    timeEntry.flagReason = validation.reason;
  }

  // Atomic multi-path write
  const updates: Record<string, unknown> = {};

  // 1. Time entry
  updates[path("timeEntries", user.uid, entryId)] = timeEntry;

  // 2. Active session
  const activeSession: ActiveSession = {
    userId: user.uid,
    userName,
    siteId: site.id,
    siteName: site.name,
    clockInAt: timestamp,
    coords: location.coords,
    accuracy: location.accuracy,
  };
  updates[path("activeSessions", user.uid)] = activeSession;

  // 3. Site personnel
  updates[path("sitePersonnel", site.id, user.uid)] = {
    userId: user.uid,
    userName,
    clockInAt: timestamp,
    coords: location.coords,
    accuracy: location.accuracy,
  };

  // 4. Site history (for supervisor reporting)
  updates[path("siteTimeEntries", site.id, entryId)] = {
    ...timeEntry,
  };

  await update(ref(rtdb), updates);

  // Send supervisor alert if needed
  if (!validation.valid || poorAccuracy) {
    await sendSupervisorAlert(
      timeEntry,
      !validation.valid ? "out_of_radius" : "poor_accuracy"
    );
  }

  return {
    success: true,
    entryId,
    withinRadius: validation.valid,
    distance: validation.distance,
    message: validation.valid
      ? `Clocked in to ${site.name}`
      : `Clocked in to ${site.name} (${validation.reason})`,
  };
}

/**
 * Clock out from current active session
 *
 * @param userId User ID (defaults to current user)
 * @param options Optional metadata about clock-out
 */
export async function clockOut(
  userId?: string,
  options?: {
    reason?: string;
    newSiteId?: string;
  }
): Promise<{
  success: boolean;
  duration: number;
  message: string;
}> {
  const user = auth.currentUser;
  const targetUserId = userId || user?.uid;

  if (!targetUserId) {
    throw new Error("Must be authenticated to clock out");
  }

  // Get active session
  const activeSession = await getActiveSession(targetUserId);
  if (!activeSession) {
    throw new Error("No active session found");
  }

  const clockOutTime = Date.now();
  const duration = clockOutTime - activeSession.clockInAt;

  // Find the time entry
  const entryRef = ref(rtdb, path("timeEntries", targetUserId));
  const snapshot = await get(entryRef);

  let entryId: string | null = null;
  if (snapshot.exists()) {
    // Find the active entry for this site
    snapshot.forEach((childSnapshot) => {
      const entry = childSnapshot.val() as TimeEntry;
      if (
        entry.status === "active" &&
        entry.siteId === activeSession.siteId &&
        entry.clockInAt === activeSession.clockInAt
      ) {
        entryId = childSnapshot.key;
      }
    });
  }

  if (!entryId) {
    throw new Error("Could not find active time entry");
  }

  // Atomic multi-path write
  const updates: Record<string, unknown> = {};

  // 1. Update time entry
  updates[path("timeEntries", targetUserId, entryId, "clockOutAt")] =
    clockOutTime;
  updates[path("timeEntries", targetUserId, entryId, "status")] =
    options?.reason === "auto_clockout" ? "completed" : "completed";
  if (options?.reason === "auto_clockout") {
    updates[path("timeEntries", targetUserId, entryId, "autoClockOut")] = true;
  }

  // 2. Remove active session
  updates[path("activeSessions", targetUserId)] = null;

  // 3. Remove from site personnel
  updates[path("sitePersonnel", activeSession.siteId, targetUserId)] = null;

  // 4. Update site history entry
  updates[path("siteTimeEntries", activeSession.siteId, entryId, "clockOutAt")] =
    clockOutTime;
  updates[path("siteTimeEntries", activeSession.siteId, entryId, "status")] =
    options?.reason === "auto_clockout" ? "completed" : "completed";
  if (options?.reason === "auto_clockout") {
    updates[path("siteTimeEntries", activeSession.siteId, entryId, "autoClockOut")] = true;
  }

  await update(ref(rtdb), updates);

  return {
    success: true,
    duration,
    message: options?.newSiteId
      ? `Clocked out from ${activeSession.siteName} (auto)`
      : `Clocked out from ${activeSession.siteName}`,
  };
}

/**
 * Get active session for a user
 */
export async function getActiveSession(
  userId?: string
): Promise<ActiveSession | null> {
  const user = auth.currentUser;
  const targetUserId = userId || user?.uid;

  if (!targetUserId) {
    return null;
  }

  const snapshot = await get(ref(rtdb, path("activeSessions", targetUserId)));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val();
}

/**
 * Get all time entries for a user
 */
export async function getTimeEntries(
  userId?: string,
  limit?: number
): Promise<TimeEntry[]> {
  const user = auth.currentUser;
  const targetUserId = userId || user?.uid;

  if (!targetUserId) {
    return [];
  }

  const snapshot = await get(ref(rtdb, path("timeEntries", targetUserId)));

  if (!snapshot.exists()) {
    return [];
  }

  const entries: TimeEntry[] = [];
  snapshot.forEach((childSnapshot) => {
    entries.push({
      id: childSnapshot.key!,
      ...childSnapshot.val(),
    });
  });

  // Sort by clock-in time (newest first)
  entries.sort((a, b) => b.clockInAt - a.clockInAt);

  return limit ? entries.slice(0, limit) : entries;
}

/**
 * Get recent time entries for a specific job site
 */
export async function getSiteTimeEntries(
  siteId: string,
  limit?: number
): Promise<TimeEntry[]> {
  const siteRef = ref(rtdb, path("siteTimeEntries", siteId));
  const siteQuery = limit
    ? query(siteRef, orderByChild("clockInAt"), limitToLast(limit))
    : siteRef;

  const snapshot = await get(siteQuery);

  if (!snapshot.exists()) {
    return [];
  }

  const entries: TimeEntry[] = [];
  snapshot.forEach((childSnapshot) => {
    entries.push({
      id: childSnapshot.key!,
      ...childSnapshot.val(),
    });
  });

  entries.sort((a, b) => b.clockInAt - a.clockInAt);
  return entries;
}

/**
 * Send alert to supervisors
 */
async function sendSupervisorAlert(
  entry: TimeEntry,
  type: "out_of_radius" | "poor_accuracy" | "gps_denied"
): Promise<void> {
  // Get all supervisors
  const supervisors = await getAllSupervisors();

  const alertId = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const timestamp = Date.now();

  const alert: Omit<SupervisorAlert, "id"> = {
    type,
    userId: entry.userId,
    userName: entry.userName,
    siteId: entry.siteId,
    siteName: entry.siteName,
    distance: entry.distance,
    accuracy: entry.accuracy,
    timestamp,
    acknowledged: false,
    entryId: entry.id,
  };

  // Send alert to all supervisors
  const updates: Record<string, unknown> = {};
  for (const supervisorId of supervisors) {
    updates[path("supervisorAlerts", supervisorId, alertId)] = alert;
  }

  if (Object.keys(updates).length > 0) {
    await update(ref(rtdb), updates);
  }
}

/**
 * Get all supervisor user IDs
 */
async function getAllSupervisors(): Promise<string[]> {
  const snapshot = await get(ref(rtdb, path("users")));

  if (!snapshot.exists()) {
    return [];
  }

  const supervisors: string[] = [];
  snapshot.forEach((childSnapshot) => {
    const userData = childSnapshot.val();
    if (userData.role === "supervisor") {
      supervisors.push(childSnapshot.key!);
    }
  });

  return supervisors;
}

/**
 * Create a flagged entry when GPS is unavailable
 */
async function createFlaggedEntry(
  userId: string,
  userName: string,
  site: JobSite,
  _type: "gps_denied",
  reason: string
): Promise<{
  success: boolean;
  entryId: string;
  withinRadius: boolean;
  distance: number;
  message: string;
}> {
  const entryId = generateTimeEntryId();
  const timestamp = Date.now();
  const timezoneOffset = new Date().getTimezoneOffset();

  const timeEntry: TimeEntry = {
    id: entryId,
    userId,
    userName,
    siteId: site.id,
    siteName: site.name,
    clockInAt: timestamp,
    coords: { lat: 0, lng: 0 }, // No location available
    accuracy: 0,
    distance: 0,
    withinRadius: false,
    timezoneOffset,
    status: "flagged",
  };

  // Add flagReason if provided
  if (reason) {
    timeEntry.flagReason = reason;
  }

  // Atomic multi-path write
  const updates: Record<string, unknown> = {};

  updates[path("timeEntries", userId, entryId)] = timeEntry;

  const activeSession: ActiveSession = {
    userId,
    userName,
    siteId: site.id,
    siteName: site.name,
    clockInAt: timestamp,
    coords: { lat: 0, lng: 0 },
    accuracy: 0,
  };
  updates[path("activeSessions", userId)] = activeSession;
  updates[path("sitePersonnel", site.id, userId)] = {
    userId,
    userName,
    clockInAt: timestamp,
    coords: { lat: 0, lng: 0 },
    accuracy: 0,
  };

  updates[path("siteTimeEntries", site.id, entryId)] = {
    ...timeEntry,
  };

  await update(ref(rtdb), updates);

  // Send supervisor alert
  await sendSupervisorAlert(timeEntry, "gps_denied");

  return {
    success: true,
    entryId,
    withinRadius: false,
    distance: 0,
    message: `Clocked in to ${site.name} (requires supervisor approval - ${reason})`,
  };
}

/**
 * Generate unique time entry ID
 */
function generateTimeEntryId(): string {
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Approve a flagged time entry (supervisor only)
 */
export async function approveTimeEntry(
  userId: string,
  entryId: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Must be authenticated to approve entries");
  }

  const entrySnapshot = await get(ref(rtdb, path("timeEntries", userId, entryId)));
  if (!entrySnapshot.exists()) {
    throw new Error("Time entry not found");
  }

  const entry = entrySnapshot.val() as TimeEntry;
  const siteId = entry.siteId;

  const updates: Record<string, unknown> = {};
  updates[path("timeEntries", userId, entryId, "status")] = "active";
  updates[path("timeEntries", userId, entryId, "approvedBy")] = user.uid;
  updates[path("timeEntries", userId, entryId, "approvedAt")] = Date.now();
  updates[path("siteTimeEntries", siteId, entryId, "status")] = "active";
  updates[path("siteTimeEntries", siteId, entryId, "approvedBy")] = user.uid;
  updates[path("siteTimeEntries", siteId, entryId, "approvedAt")] = Date.now();

  await update(ref(rtdb), updates);
}
