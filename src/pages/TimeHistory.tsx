/**
 * TimeHistory Page
 *
 * Personal time log showing all clock-in/out entries
 * Displays duration, approval status, and GPS verification
 */

import { useState, useEffect } from "react";
import { getTimeEntries } from "../services/timeClock";
import type { TimeEntry } from "../types/timeTracking";
import Header from "../components/ui/Header";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import TimeEntryMap from "../components/maps/TimeEntryMap";

export default function TimeHistory() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed" | "flagged">("all");
  const [expandedMaps, setExpandedMaps] = useState<Set<string>>(new Set());

  const toggleMap = (entryId: string) => {
    setExpandedMaps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      const data = await getTimeEntries();
      setEntries(data);
    } catch (error) {
      console.error("Error loading time entries:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(clockIn: number, clockOut?: number): string {
    if (!clockOut) return "In progress";

    const diff = clockOut - clockIn;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) {
      return `${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  }

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const filteredEntries = entries.filter((entry) => {
    if (filter === "all") return true;
    return entry.status === filter;
  });

  // Group entries by date
  const groupedEntries: Record<string, TimeEntry[]> = {};
  filteredEntries.forEach((entry) => {
    const dateKey = formatDate(entry.clockInAt);
    if (!groupedEntries[dateKey]) {
      groupedEntries[dateKey] = [];
    }
    groupedEntries[dateKey].push(entry);
  });

  if (loading) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <Header title="Time History" subtitle="Loading your time log..." />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <Header title="Time History" subtitle="No entries yet" />
        <div className="max-w-2xl mx-auto p-4">
          <EmptyState
            icon="â±ï¸"
            title="No time entries"
            description="Your clock-in/out history will appear here."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header
        title="Time History"
        subtitle={`${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
      />

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-sm p-2 border border-slate-200 flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              filter === "all"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            All ({entries.length})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`flex-1 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              filter === "completed"
                ? "bg-green-500 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Completed (
            {entries.filter((e) => e.status === "completed").length})
          </button>
          <button
            onClick={() => setFilter("flagged")}
            className={`flex-1 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              filter === "flagged"
                ? "bg-yellow-500 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Flagged ({entries.filter((e) => e.status === "flagged").length})
          </button>
        </div>

        {/* Entries by Date */}
        {Object.keys(groupedEntries).length === 0 ? (
          <EmptyState
            icon="ðŸ”"
            title="No entries match filter"
            description="Try selecting a different filter."
          />
        ) : (
          Object.keys(groupedEntries).map((dateKey) => (
            <div key={dateKey} className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 px-1">
                {dateKey}
              </h3>
              <div className="space-y-3">
                {groupedEntries[dateKey].map((entry) => {
                  const onSite = entry.withinRadius ?? false;
                  const stillActive = entry.status === "active" && !entry.clockOutAt;

                  return (
                    <div
                      key={entry.id}
                      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow"
                    >
                      {/* Header: Site Name + Badges */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h4 className="font-bold text-slate-900 text-lg">
                          {entry.siteName || "Unknown Site"}
                        </h4>
                        <div className="flex gap-2">
                          {/* On Site Badge */}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              onSite
                                ? "bg-green-100 text-green-700 border border-green-300"
                                : "bg-orange-100 text-orange-700 border border-orange-300"
                            }`}
                          >
                            {onSite ? "âœ“ On Site" : "âš  Off Site"}
                          </span>
                          {/* Status Badge */}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              entry.status === "active"
                                ? "bg-blue-100 text-blue-700"
                                : entry.status === "completed"
                                ? "bg-slate-100 text-slate-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {entry.status === "active"
                              ? "Active"
                              : entry.status === "completed"
                              ? "Completed"
                              : "Flagged"}
                          </span>
                        </div>
                      </div>

                      {/* Time Info */}
                      <div className="text-sm text-slate-600 space-y-1 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700 min-w-[70px]">Clock In:</span>
                          <span>{formatTime(entry.clockInAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700 min-w-[70px]">Clock Out:</span>
                          <span>
                            {entry.clockOutAt
                              ? formatTime(entry.clockOutAt)
                              : stillActive
                              ? "Still active"
                              : "â€”"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700 min-w-[70px]">Duration:</span>
                          <span className="font-semibold text-slate-900">
                            {formatDuration(entry.clockInAt, entry.clockOutAt)}
                          </span>
                        </div>
                      </div>

                      {/* Flag/Approval Info */}
                      {(entry.flagReason || entry.approvedBy) && (
                        <div className="flex gap-2 mb-3">
                          {entry.flagReason && (
                            <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs">
                              <span className="font-semibold text-yellow-900">âš  </span>
                              <span className="text-yellow-800">{entry.flagReason}</span>
                            </div>
                          )}
                          {entry.approvedBy && (
                            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800 font-semibold whitespace-nowrap">
                              âœ“ Approved
                            </div>
                          )}
                        </div>
                      )}

                      {/* Map Toggle Button */}
                      <button
                        onClick={() => toggleMap(entry.id)}
                        className="w-full py-2 px-4 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <span>ðŸ“</span>
                        <span>{expandedMaps.has(entry.id) ? "Hide Map" : "Show Location Map"}</span>
                      </button>

                      {/* Expandable Map */}
                      {expandedMaps.has(entry.id) && entry.coords && (
                        <div className="mt-3 animate-fadeIn">
                          <TimeEntryMap entry={entry} height="250px" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

