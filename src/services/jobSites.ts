/**
 * Job Sites Service
 *
 * CRUD operations for job site management
 * Supervisor-only write access enforced by Firebase rules
 */

import { ref, set, get, update, remove } from "firebase/database";
import { rtdb, auth } from "../firebase";
import { path } from "../backend.paths";
import type { JobSite, NewJobSite } from "../types/timeTracking";

/**
 * Create a new job site
 *
 * @throws Error if user is not authenticated
 */
export async function createJobSite(data: NewJobSite): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Must be authenticated to create job site");
  }

  const siteId = generateSiteId();
  const timestamp = Date.now();
  const radiusValue =
    typeof data.radius === "number"
      ? data.radius
      : (data as { radiusMeters?: number }).radiusMeters;

  if (typeof radiusValue !== "number" || Number.isNaN(radiusValue)) {
    throw new Error("Job site radius is required");
  }

  const jobSite: Omit<JobSite, "id"> = {
    ...data,
    radius: radiusValue,
    radiusMeters: radiusValue,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await set(ref(rtdb, path("jobSites", siteId)), jobSite);

  return siteId;
}

/**
 * Update an existing job site
 *
 * @throws Error if site doesn't exist
 */
export async function updateJobSite(
  siteId: string,
  data: Partial<Omit<JobSite, "id" | "createdAt" | "createdBy">>
): Promise<void> {
  const siteRef = ref(rtdb, path("jobSites", siteId));
  const snapshot = await get(siteRef);

  if (!snapshot.exists()) {
    throw new Error(`Job site ${siteId} not found`);
  }

  const updates: Record<string, unknown> = {
    ...data,
    updatedAt: Date.now(),
  };

  if (data.radius !== undefined) {
    updates.radius = data.radius;
    updates.radiusMeters = data.radius;
  }
  const radiusMetersFromPayload = (data as { radiusMeters?: number }).radiusMeters;
  if (radiusMetersFromPayload !== undefined && data.radius === undefined) {
    updates.radius = radiusMetersFromPayload;
    updates.radiusMeters = radiusMetersFromPayload;
  }

  await update(siteRef, updates);
}

/**
 * Get a single job site by ID
 *
 * @returns JobSite or null if not found
 */
export async function getJobSite(siteId: string): Promise<JobSite | null> {
  const snapshot = await get(ref(rtdb, path("jobSites", siteId)));

  if (!snapshot.exists()) {
    return null;
  }

  const value = snapshot.val() ?? {};
  const radiusValue =
    typeof value.radius === "number"
      ? value.radius
      : typeof value.radiusMeters === "number"
      ? value.radiusMeters
      : 328;

  return {
    id: siteId,
    ...value,
    radius: radiusValue,
    radiusMeters: value.radiusMeters ?? radiusValue,
  };
}

/**
 * Get all job sites
 *
 * @param activeOnly If true, only return active sites
 */
export async function getAllJobSites(activeOnly = false): Promise<JobSite[]> {
  const snapshot = await get(ref(rtdb, path("jobSites")));

  if (!snapshot.exists()) {
    return [];
  }

  const sites: JobSite[] = [];
  snapshot.forEach((childSnapshot) => {
    const value = childSnapshot.val() ?? {};
    const radiusValue =
      typeof value.radius === "number"
        ? value.radius
        : typeof value.radiusMeters === "number"
        ? value.radiusMeters
        : 328;

    const site: JobSite = {
      id: childSnapshot.key!,
      ...value,
      radius: radiusValue,
      radiusMeters: value.radiusMeters ?? radiusValue,
    };

    if (!activeOnly || site.active) {
      sites.push(site);
    }
  });

  // Sort by name
  return sites.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Mark a job site as inactive
 *
 * Soft delete - doesn't remove from database, just sets active = false
 */
export async function deactivateJobSite(siteId: string): Promise<void> {
  await updateJobSite(siteId, { active: false });
}

/**
 * Mark a job site as active
 */
export async function activateJobSite(siteId: string): Promise<void> {
  await updateJobSite(siteId, { active: true });
}

/**
 * Permanently delete a job site
 *
 * WARNING: This cannot be undone. Consider using deactivateJobSite instead.
 */
export async function deleteJobSite(siteId: string): Promise<void> {
  await remove(ref(rtdb, path("jobSites", siteId)));
}

/**
 * Search job sites by name
 */
export async function searchJobSites(query: string): Promise<JobSite[]> {
  const allSites = await getAllJobSites(true); // Only active sites
  const lowerQuery = query.toLowerCase();

  return allSites.filter(
    (site) =>
      site.name.toLowerCase().includes(lowerQuery) ||
      site.address.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Generate a unique site ID
 */
function generateSiteId(): string {
  return `site-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Validate job site data before create/update
 *
 * @throws Error if validation fails
 */
export function validateJobSite(data: Partial<NewJobSite>): void {
  if (data.name !== undefined && data.name.trim().length === 0) {
    throw new Error("Job site name cannot be empty");
  }

  if (data.address !== undefined && data.address.trim().length === 0) {
    throw new Error("Job site address cannot be empty");
  }

  if (data.location) {
    if (data.location.lat < -90 || data.location.lat > 90) {
      throw new Error("Invalid latitude (must be between -90 and 90)");
    }
    if (data.location.lng < -180 || data.location.lng > 180) {
      throw new Error("Invalid longitude (must be between -180 and 180)");
    }
  }

  if (data.radius !== undefined) {
    if (data.radius < 164) {
      throw new Error("Radius must be at least 164 feet");
    }
    if (data.radius > 16404) {
      throw new Error("Radius cannot exceed 16404 feet (about 3 miles)");
    }
  }
}
