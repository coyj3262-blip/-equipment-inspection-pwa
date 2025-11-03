/**
 * OperatorHistoryAccordion Component
 *
 * Groups time entries by operator in an expandable accordion layout
 * Features:
 * - Operator summary with total hours and entry count
 * - Expandable sections showing all clock-in/out entries
 * - Individual entry cards with map option
 * - Status badges (On Site, Active, Completed, Flagged)
 */

import { useState } from "react";
import type { TimeEntry } from "../../types/timeTracking";
import TimeEntryMap from "../maps/TimeEntryMap";

interface OperatorHistoryAccordionProps {
  entries: TimeEntry[];
}

interface OperatorGroup {
  userId: string;
  userName: string;
  entries: TimeEntry[];
  totalHours: number;
}

export default function OperatorHistoryAccordion({
  entries,
}: OperatorHistoryAccordionProps) {
  const [expandedOperators, setExpandedOperators] = useState<Set<string>>(
    new Set()
  );
  const [expandedMaps, setExpandedMaps] = useState<Set<string>>(new Set());

  // Group entries by operator
  const operatorGroups: OperatorGroup[] = Object.values(
    entries.reduce((acc, entry) => {
      const key = entry.userId;
      if (!acc[key]) {
        acc[key] = {
          userId: entry.userId,
          userName: entry.userName,
          entries: [],
          totalHours: 0,
        };
      }
      acc[key].entries.push(entry);

      // Calculate hours for completed entries
      if (entry.clockOutAt) {
        const hours = (entry.clockOutAt - entry.clockInAt) / (1000 * 60 * 60);
        acc[key].totalHours += hours;
      }

      return acc;
    }, {} as Record<string, OperatorGroup>)
  ).sort((a, b) => b.entries[0].clockInAt - a.entries[0].clockInAt); // Sort by most recent

  const toggleOperator = (userId: string) => {
    setExpandedOperators((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const toggleMap = (entryId: string) => {
    setExpandedMaps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  if (operatorGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {operatorGroups.map((group) => {
        const isExpanded = expandedOperators.has(group.userId);
        const hasActiveSession = group.entries.some(
          (e) => e.status === "active" && !e.clockOutAt
        );

        return (
          <div
            key={group.userId}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
            {/* Operator Header - Clickable to expand/collapse */}
            <button
              onClick={() => toggleOperator(group.userId)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-white font-bold text-lg">
                  {group.userName.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="text-left">
                  <div className="font-bold text-lg text-slate-900">
                    {group.userName}
                  </div>
                  <div className="text-sm text-slate-600">
                    {group.entries.length} {group.entries.length === 1 ? "entry" : "entries"}
                    {" • "}
                    {group.totalHours.toFixed(1)}h total
                    {hasActiveSession && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expand/Collapse Icon */}
              <div
                className={`text-slate-400 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              >
                ▼
              </div>
            </button>

            {/* Expandable Content - Entry List */}
            {isExpanded && (
              <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
                {group.entries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    expandedMap={expandedMaps.has(entry.id)}
                    onToggleMap={() => toggleMap(entry.id)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Individual Entry Card Component
interface EntryCardProps {
  entry: TimeEntry;
  expandedMap: boolean;
  onToggleMap: () => void;
}

function EntryCard({ entry, expandedMap, onToggleMap }: EntryCardProps) {
  const onSite = entry.withinRadius ?? false;
  const stillActive = entry.status === "active" && !entry.clockOutAt;

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      {/* Header: Site + Badges */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h5 className="font-semibold text-slate-900">
          {entry.siteName || "Unknown Site"}
        </h5>
        <div className="flex gap-2">
          {/* On Site Badge */}
          <span
            className={`px-2 py-1 rounded-full text-xs font-bold ${
              onSite
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-orange-100 text-orange-700 border border-orange-300"
            }`}
          >
            {onSite ? "✓ On Site" : "⚠ Off Site"}
          </span>
          {/* Status Badge */}
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
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
          <span className="font-semibold text-slate-700 min-w-[70px]">
            Clock In:
          </span>
          <span>{formatTime(entry.clockInAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 min-w-[70px]">
            Clock Out:
          </span>
          <span>
            {entry.clockOutAt
              ? formatTime(entry.clockOutAt)
              : stillActive
              ? "Still active"
              : "—"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 min-w-[70px]">
            Duration:
          </span>
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
              <span className="font-semibold text-yellow-900">⚠ </span>
              <span className="text-yellow-800">{entry.flagReason}</span>
            </div>
          )}
          {entry.approvedBy && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800 font-semibold whitespace-nowrap">
              ✓ Approved
            </div>
          )}
        </div>
      )}

      {/* Map Toggle Button */}
      <button
        onClick={onToggleMap}
        className="w-full py-2 px-4 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
      >
        <span>📍</span>
        <span>{expandedMap ? "Hide Map" : "Show Location Map"}</span>
      </button>

      {/* Expandable Map */}
      {expandedMap && entry.coords && (
        <div className="mt-3 animate-fadeIn">
          <TimeEntryMap entry={entry} height="250px" />
        </div>
      )}
    </div>
  );
}
