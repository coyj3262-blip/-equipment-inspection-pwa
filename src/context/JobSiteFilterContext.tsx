/**
 * Job Site Filter Context
 *
 * Provides global job site filtering for supervisors
 * Also handles user-level job site restrictions
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { ref, get } from "firebase/database";
import { rtdb, auth } from "../firebase";
import { getAllJobSites } from "../services/jobSites";
import type { JobSite } from "../types/timeTracking";

interface JobSiteFilterContextValue {
  // Current filter
  selectedSiteId: string | null; // null = "All Sites"
  setSelectedSiteId: (siteId: string | null) => void;

  // Available sites
  availableSites: JobSite[];
  loadingSites: boolean;

  // User restrictions
  allowedSiteIds: string[] | null; // null = no restrictions (can see all)
  isRestricted: boolean;

  // Helper
  canViewSite: (siteId: string) => boolean;
}

const JobSiteFilterContext = createContext<JobSiteFilterContextValue | undefined>(undefined);

interface JobSiteFilterProviderProps {
  children: ReactNode;
}

export function JobSiteFilterProvider({ children }: JobSiteFilterProviderProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [availableSites, setAvailableSites] = useState<JobSite[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [allowedSiteIds, setAllowedSiteIds] = useState<string[] | null>(null);

  // Load available sites and user restrictions
  useEffect(() => {
    loadSitesAndRestrictions();
  }, []);

  async function loadSitesAndRestrictions() {
    setLoadingSites(true);
    try {
      // Load all job sites
      const sites = await getAllJobSites();
      setAvailableSites(sites.filter(site => site.active));

      // Check if current user has site restrictions
      const user = auth.currentUser;
      if (user) {
        const restrictionsRef = ref(rtdb, `/v2/userSiteRestrictions/${user.uid}`);
        const snapshot = await get(restrictionsRef);

        if (snapshot.exists()) {
          const restrictions = snapshot.val();
          // restrictions is { [siteId]: true, [siteId]: true }
          const allowedIds = Object.keys(restrictions);
          setAllowedSiteIds(allowedIds);

          // If restricted, auto-select first allowed site
          if (allowedIds.length > 0) {
            setSelectedSiteId(allowedIds[0]);
          }
        } else {
          setAllowedSiteIds(null); // No restrictions
        }
      }
    } catch (error) {
      console.error("Error loading sites/restrictions:", error);
    } finally {
      setLoadingSites(false);
    }
  }

  const isRestricted = allowedSiteIds !== null;

  const canViewSite = (siteId: string): boolean => {
    if (!isRestricted) return true; // No restrictions
    return allowedSiteIds?.includes(siteId) ?? false;
  };

  // Filter available sites based on restrictions
  const filteredAvailableSites = isRestricted
    ? availableSites.filter(site => allowedSiteIds?.includes(site.id))
    : availableSites;

  const value: JobSiteFilterContextValue = {
    selectedSiteId,
    setSelectedSiteId,
    availableSites: filteredAvailableSites,
    loadingSites,
    allowedSiteIds,
    isRestricted,
    canViewSite,
  };

  return (
    <JobSiteFilterContext.Provider value={value}>
      {children}
    </JobSiteFilterContext.Provider>
  );
}

export function useJobSiteFilter() {
  const context = useContext(JobSiteFilterContext);
  if (!context) {
    throw new Error("useJobSiteFilter must be used within JobSiteFilterProvider");
  }
  return context;
}
