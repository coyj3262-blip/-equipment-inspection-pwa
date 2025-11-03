/**
 * PersonnelDashboard Page
 *
 * Live view of all personnel clocked in across all job sites
 * Real-time updates with elapsed time counters
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAllActiveSessions } from "../hooks/useSitePersonnel";
import { getAllJobSites } from "../services/jobSites";
import type { JobSite } from "../types/timeTracking";
import Header from "../components/ui/Header";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import { useUserRole } from "../hooks/useUserRole";
import { useJobSiteFilter } from "../context/JobSiteFilterContext";

export default function PersonnelDashboard() {
  const { bySite, totalCount, loading: loadingSessions } = useAllActiveSessions();
  const { selectedSiteId } = useJobSiteFilter();
  const [jobSites, setJobSites] = useState<Record<string, JobSite>>({});
  const [loadingSites, setLoadingSites] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const { isSupervisor, loading: loadingRole } = useUserRole();

  // Load job sites
  useEffect(() => {
    loadSites();
  }, []);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadSites() {
    try {
      const sites = await getAllJobSites();
      const sitesMap: Record<string, JobSite> = {};
      sites.forEach((site) => {
        sitesMap[site.id] = site;
      });
      setJobSites(sitesMap);
    } catch (error) {
      console.error("Error loading job sites:", error);
    } finally {
      setLoadingSites(false);
    }
  }

  function formatSimpleElapsed(clockInAt: number): string {
    const diff = currentTime - clockInAt;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  }

  function isLongShift(clockInAt: number): boolean {
    const hours = (currentTime - clockInAt) / (1000 * 60 * 60);
    return hours > 10;
  }

  if (loadingSessions || loadingSites) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <Header
          title="Personnel Tracking"
          subtitle="Loading active personnel..."
        />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <Header
          title="Personnel Tracking"
          subtitle="No active personnel"
        />
        <div className="max-w-2xl mx-auto p-4">
          <EmptyState
            icon="ðŸ‘¥"
            title="No one clocked in"
            description="When personnel clock in, they'll appear here."
          />
        </div>
      </div>
    );
  }

  // Get site IDs that have personnel, filtered by selected site if any
  const activeSiteIds = Object.keys(bySite).filter(
    siteId => !selectedSiteId || siteId === selectedSiteId
  );

  const { setSelectedSiteId } = useJobSiteFilter();

  // Get all sites with active personnel
  const allActiveSiteIds = Object.keys(bySite);

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header
        title="Personnel Tracking"
        subtitle={`${totalCount} ${totalCount === 1 ? "person" : "people"} clocked in`}
      />

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Site Filter Dropdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Filter by Job Site
          </label>
          <select
            value={selectedSiteId || ""}
            onChange={(e) => setSelectedSiteId(e.target.value || null)}
            className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-900 font-medium focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
          >
            <option value="">All Sites ({allActiveSiteIds.length})</option>
            {allActiveSiteIds.map((siteId) => {
              const site = jobSites[siteId];
              const personnelCount = bySite[siteId]?.length || 0;
              return (
                <option key={siteId} value={siteId}>
                  {site?.name || "Unknown Site"} ({personnelCount})
                </option>
              );
            })}
          </select>
        </div>

        {/* Personnel by Site */}
        {activeSiteIds.map((siteId) => {
          const site = jobSites[siteId];
          const personnel = bySite[siteId];

          return (
            <div
              key={siteId}
              className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden"
            >
              {/* Site Header */}
              <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">
                      {site?.name || "Unknown Site"}
                    </h3>
                    <p className="text-sm text-slate-300 mt-0.5">
                      {personnel.length}{" "}
                      {personnel.length === 1 ? "person" : "people"} on site
                    </p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur">
                    <span className="text-2xl">ðŸ“</span>
                  </div>
                </div>
              </div>

              {/* Personnel List */}
              <div className="divide-y divide-slate-200">
                {personnel.map((person) => {
                  const longShift = isLongShift(person.clockInAt);

                  return (
                    <div
                      key={person.userId}
                      className="px-5 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-white font-bold">
                            {person.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">
                                {person.userName}
                              </span>
                              {/* Long shift warning */}
                              {longShift && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                                  Long shift
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Simplified elapsed time */}
                        <div className="text-sm text-slate-500">
                          {formatSimpleElapsed(person.clockInAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-right">
                {!loadingRole && isSupervisor ? (
                  <Link
                    to={`/job-sites/${siteId}/history`}
                    className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                  >
                    View history â†’
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-slate-400">
                    Supervisor history
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Refresh Notice */}
        <div className="text-center text-xs text-slate-500 py-4">
          <p>Updates automatically in real-time</p>
          <p className="mt-1">Elapsed times update every minute</p>
        </div>
      </div>
    </div>
  );
}

