/**
 * SitePersonnelHistory Page
 *
 * Supervisor view showing who is currently clocked in at a job site
 * plus a historical log of recent clock-ins/outs.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../components/ui/Header";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import { useSitePersonnel } from "../hooks/useSitePersonnel";
import { useSiteHistory } from "../hooks/useSiteHistory";
import { getJobSite } from "../services/jobSites";
import type { JobSite } from "../types/timeTracking";
import { formatRadius } from "../services/geolocation";
import OperatorHistoryAccordion from "../components/time/OperatorHistoryAccordion";

export default function SitePersonnelHistory() {
  const { siteId } = useParams<{ siteId: string }>();
  const [site, setSite] = useState<JobSite | null>(null);
  const [loadingSite, setLoadingSite] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    personnel,
    loading: loadingPersonnel,
    error: personnelError,
  } = useSitePersonnel(siteId ?? null);
  const {
    entries,
    loading: loadingHistory,
    error: historyError,
  } = useSiteHistory(siteId ?? null, 100);

  useEffect(() => {
    const currentSiteId = siteId;
    if (!currentSiteId) {
      setSite(null);
      setLoadingSite(false);
      setError("Missing job site ID");
      return;
    }

    async function loadSite(id: string) {
      setLoadingSite(true);
      try {
        const data = await getJobSite(id);
        setSite(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load job site:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load job site"
        );
      } finally {
        setLoadingSite(false);
      }
    }

    void loadSite(currentSiteId);
  }, [siteId]);

  const isLoading = loadingSite || loadingPersonnel || loadingHistory;
  const combinedError = error || personnelError || historyError;

  const stats = useMemo(() => {
    const lastEntry = entries[0];
    return {
      activeCount: personnel.length,
      totalEntries: entries.length,
      lastClockIn: lastEntry?.clockInAt ?? null,
    };
  }, [entries, personnel.length]);

  if (isLoading) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <Header title="Job Site History" subtitle="Loadingâ€¦" />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!site || combinedError) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <Header title="Job Site History" subtitle="Unable to load site data" />
        <div className="max-w-2xl mx-auto p-4">
          <EmptyState
            icon="ðŸ“"
            title="Job site unavailable"
            description={
              combinedError ||
              "We couldn't load this job site's details. Please return to the job site list."
            }
          />
          <div className="mt-4">
            <Link
              to="/job-sites"
              className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
            >
              â† Back to Job Sites
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header
        title={site.name}
        subtitle="Live personnel status and clock history"
      />

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/job-sites"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            â† Back to Job Sites
          </Link>
          <Link
            to="/job-sites"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Manage Sites
          </Link>
        </div>

        {/* Site Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{site.name}</h2>
              <p className="text-sm text-slate-600 mt-0.5">{site.address}</p>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                site.active
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {site.active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-700">
                Verification Radius:
              </span>
              <div className="font-mono text-slate-900">
                {formatRadius(site.radius)}
              </div>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Coordinates:</span>
              <div className="font-mono text-slate-900 truncate">
                {site.location.lat.toFixed(6)}, {site.location.lng.toFixed(6)}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-slate-900">
                {stats.activeCount}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Currently Clocked In
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">
                {stats.totalEntries}
              </div>
              <div className="text-xs text-slate-600 mt-1">Total Sessions</div>
            </div>
            <div>
              <div className="text-xs text-slate-600">Last Clock-In</div>
              <div className="text-sm font-semibold text-slate-900 mt-1">
                {stats.lastClockIn
                  ? formatTimestamp(stats.lastClockIn)
                  : "â€”"}
              </div>
            </div>
          </div>
        </div>

        {/* Active Personnel */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Currently Clocked In
            </h3>
            <span className="text-xs text-slate-500">
              {stats.activeCount} {stats.activeCount === 1 ? "person" : "people"}
            </span>
          </div>

          {personnel.length === 0 ? (
            <EmptyState
              icon="âœ…"
              title="No one on site right now"
              description="When personnel clock in to this job site, you'll see them here."
            />
          ) : (
            <div className="bg-white rounded-2xl shadow-card border border-slate-200 divide-y divide-slate-200">
              {personnel.map((person) => (
                <div key={person.userId} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-white font-bold">
                        {person.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {person.userName}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Clocked in {formatRelativeTime(person.clockInAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        {formatDuration(person.clockInAt)}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Elapsed
                      </div>
                    </div>
                  </div>
                  {person.accuracy > 0 && (
                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                      <span>ðŸ“</span>
                      <span>
                        GPS accuracy Â±{Math.round(person.accuracy)}m
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* History - Grouped by Operator */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Clock History by Operator
            </h3>
            <span className="text-xs text-slate-500">
              Last {entries.length} entries
            </span>
          </div>

          {entries.length === 0 ? (
            <EmptyState
              icon="ðŸ“„"
              title="No history yet"
              description="Once personnel clock in to this job site you'll see a log here."
            />
          ) : (
            <OperatorHistoryAccordion entries={entries} />
          )}
        </section>
      </div>
    </div>
  );
}

// Helper functions for "Currently Clocked In" section
function formatDuration(clockInAt: number, clockOutAt?: number): string {
  const end = clockOutAt ?? Date.now();
  const diff = end - clockInAt;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.round(diff / (1000 * 60));
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

