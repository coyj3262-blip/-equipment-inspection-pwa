/**
 * TimeEntryMap Component
 *
 * Wrapper component that fetches job site data and displays map for a time entry
 */

import { useEffect, useState } from "react";
import { getJobSite } from "../../services/jobSites";
import type { TimeEntry, JobSite } from "../../types/timeTracking";
import MapView from "./MapView";
import LoadingSpinner from "../ui/LoadingSpinner";

interface TimeEntryMapProps {
  entry: TimeEntry;
  height?: string;
}

export default function TimeEntryMap({ entry, height = "250px" }: TimeEntryMapProps) {
  const [site, setSite] = useState<JobSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSite() {
      if (!entry.siteId) {
        setError("No site ID available");
        setLoading(false);
        return;
      }

      try {
        const siteData = await getJobSite(entry.siteId);
        setSite(siteData);
      } catch (err) {
        console.error("Failed to load site for map:", err);
        setError("Failed to load site location");
      } finally {
        setLoading(false);
      }
    }

    loadSite();
  }, [entry.siteId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8" style={{ height }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="bg-slate-50 rounded-xl p-4 text-center text-sm text-slate-600" style={{ height }}>
        <div>❌ {error || "Site location not available"}</div>
      </div>
    );
  }

  // Check if site has valid location
  if (!site.location || site.location.lat === undefined || site.location.lng === undefined) {
    return (
      <div className="bg-slate-50 rounded-xl p-4 text-center text-sm text-slate-600" style={{ height }}>
        <div>📍 Site location coordinates not configured</div>
      </div>
    );
  }

  return (
    <MapView
      siteLocation={site.location}
      siteName={entry.siteName || site.name}
      userLocation={entry.coords}
      userName={entry.userName}
      radiusMeters={site.radius || 328}
      withinRadius={entry.withinRadius ?? false}
      distance={entry.distance || 0}
      accuracy={entry.accuracy}
      height={height}
    />
  );
}
