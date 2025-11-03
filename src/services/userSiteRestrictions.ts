/**
 * User Site Restrictions Service
 *
 * Manages which job sites a user is allowed to view
 * Useful for limiting contractors or temporary supervisors to specific sites
 */

import { ref, set, get, remove } from "firebase/database";
import { rtdb } from "../firebase";

/**
 * Restrict a user to specific job sites
 * @param userId - Firebase user ID
 * @param siteIds - Array of job site IDs the user can access
 */
export async function setUserSiteRestrictions(userId: string, siteIds: string[]): Promise<void> {
  const restrictionsRef = ref(rtdb, `/v2/userSiteRestrictions/${userId}`);

  // Convert array to object: { [siteId]: true }
  const restrictions: Record<string, true> = {};
  siteIds.forEach(siteId => {
    restrictions[siteId] = true;
  });

  await set(restrictionsRef, restrictions);
}

/**
 * Get a user's site restrictions
 * @param userId - Firebase user ID
 * @returns Array of allowed site IDs, or null if no restrictions
 */
export async function getUserSiteRestrictions(userId: string): Promise<string[] | null> {
  const restrictionsRef = ref(rtdb, `/v2/userSiteRestrictions/${userId}`);
  const snapshot = await get(restrictionsRef);

  if (!snapshot.exists()) {
    return null; // No restrictions = can see all sites
  }

  const restrictions = snapshot.val();
  return Object.keys(restrictions);
}

/**
 * Remove all restrictions for a user (allow access to all sites)
 * @param userId - Firebase user ID
 */
export async function removeUserSiteRestrictions(userId: string): Promise<void> {
  const restrictionsRef = ref(rtdb, `/v2/userSiteRestrictions/${userId}`);
  await remove(restrictionsRef);
}

/**
 * Add a single site to user's allowed list
 * @param userId - Firebase user ID
 * @param siteId - Job site ID to add
 */
export async function addSiteToUser(userId: string, siteId: string): Promise<void> {
  const siteRef = ref(rtdb, `/v2/userSiteRestrictions/${userId}/${siteId}`);
  await set(siteRef, true);
}

/**
 * Remove a single site from user's allowed list
 * @param userId - Firebase user ID
 * @param siteId - Job site ID to remove
 */
export async function removeSiteFromUser(userId: string, siteId: string): Promise<void> {
  const siteRef = ref(rtdb, `/v2/userSiteRestrictions/${userId}/${siteId}`);
  await remove(siteRef);
}

/**
 * Check if a user can view a specific site
 * @param userId - Firebase user ID
 * @param siteId - Job site ID to check
 * @returns true if user can view this site
 */
export async function canUserViewSite(userId: string, siteId: string): Promise<boolean> {
  const allowedSites = await getUserSiteRestrictions(userId);

  // No restrictions = can view all sites
  if (allowedSites === null) return true;

  // Check if site is in allowed list
  return allowedSites.includes(siteId);
}
