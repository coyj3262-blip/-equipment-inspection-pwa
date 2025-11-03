/**
 * TimeClock Page
 *
 * Main clock-in/out interface with GPS verification
 */

import { useState, useEffect } from "react";
import { useActiveSession } from "../hooks/useActiveSession";
import { clockIn, clockOut } from "../services/timeClock";
import { auth } from "../firebase";
import { getAllJobSites } from "../services/jobSites";
import { useToast } from "../hooks/useToast";
import type { JobSite } from "../types/timeTracking";
import Header from "../components/ui/Header";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import GPSPermissionPrompt from "../components/GPSPermissionPrompt";

export default function TimeClock() {
  const { session, isClockedIn } = useActiveSession();
  const [jobSites, setJobSites] = useState<JobSite[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(true);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [pendingClockIn, setPendingClockIn] = useState(false);
  const [showForceClockOutDialog, setShowForceClockOutDialog] = useState(false);
  const toast = useToast();

  // Load job sites
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const sites = await getAllJobSites(true); // Only active sites
        if (cancelled) return;
        setJobSites(sites);
        if (sites.length > 0) {
          setSelectedSiteId((current) => current || sites[0].id);
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Error loading job sites:", error);
        toast.error("Failed to load job sites");
      } finally {
        if (!cancelled) {
          setLoadingSites(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  function formatElapsedTime(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  async function handleClockInClick() {
    if (!selectedSiteId) {
      toast.warning("Please select a job site");
      return;
    }

    setPendingClockIn(true);
    await attemptClockInFlow();
  }

  async function attemptClockInFlow() {
    const user = auth.currentUser;
    if (!user) {
      toast.error("Not authenticated");
      setPendingClockIn(false);
      return;
    }

    // Show permission prompt if this is the first time
    const hasShownPrompt = localStorage.getItem("gps-permission-shown");
    if (!hasShownPrompt) {
      setShowPermissionPrompt(true);
      return;
    }

    await performClockIn();
  }

  async function performClockIn() {
    setLoading(true);
    try {
      const result = await clockIn(selectedSiteId);

      if (result.success) {
        if (result.withinRadius) {
          toast.success(result.message);
        } else {
          toast.warning(`${result.message}\nSupervisor has been notified.`);
        }
      }
    } catch (error) {
      console.error("Clock-in error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to clock in"
      );
    } finally {
      setLoading(false);
      setPendingClockIn(false);
    }
  }

  async function handleClockOutClick() {
    setLoading(true);
    try {
      const result = await clockOut();
      toast.success(
        `${result.message}\nDuration: ${formatElapsedTime(result.duration)}`
      );
    } catch (error) {
      console.error("Clock-out error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to clock out"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleForceClockOut() {
    setLoading(true);
    try {
      // Force clear the stuck session
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const { ref, update } = await import("firebase/database");
      const { rtdb } = await import("../firebase");
      const { path } = await import("../backend.paths");

      // Remove active session and site personnel entry
      const updates: Record<string, null> = {};
      updates[path("activeSessions", user.uid)] = null;

      // Try to remove from site personnel (we don't know which site, so we'll just clear session)
      await update(ref(rtdb), updates);

      toast.success("Force clock out successful! Refresh the page.");

      // Reload the page after a short delay
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error("Force clock-out error:", error);
      toast.error("Failed to force clock out");
    } finally {
      setLoading(false);
    }
  }

  function handlePermissionAllow() {
    localStorage.setItem("gps-permission-shown", "true");
    setShowPermissionPrompt(false);
    if (pendingClockIn) {
      performClockIn();
    }
  }

  function handlePermissionDeny() {
    localStorage.setItem("gps-permission-shown", "true");
    setShowPermissionPrompt(false);
    toast.warning(
      "Location denied. Supervisor approval required for clock-in."
    );
    if (pendingClockIn) {
      performClockIn(); // Will create flagged entry
    }
  }

  if (loadingSites) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header title="Time Clock" subtitle="Loading job sites..." />
      </div>
    );
  }

  if (jobSites.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header
          title="Time Clock"
          subtitle="No active job sites available"
        />
        <div className="max-w-2xl mx-auto p-4 text-center text-slate-600">
          <p>Contact your supervisor to add job sites.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header
        title="Time Clock"
        subtitle={
          isClockedIn
            ? `Clocked in to ${session?.siteName}`
            : "Clock in to start your shift"
        }
      />

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Current Status Card */}
        {isClockedIn && session ? (
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">âœ“</span>
                  <span className="text-lg font-bold">Clocked In</span>
                </div>
                <div className="text-green-50">
                  <div className="font-semibold text-xl">{session.siteName}</div>
                  <div className="text-sm mt-1">
                    {new Date(session.clockInAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <Button
                onClick={handleClockOutClick}
                loading={loading}
                disabled={loading}
                className="w-full bg-white text-green-600 hover:bg-green-50"
                size="lg"
              >
                {loading ? "Clocking Out..." : "Clock Out"}
              </Button>

              <button
                onClick={() => setShowForceClockOutDialog(true)}
                disabled={loading}
                className="w-full text-xs text-slate-500 hover:text-orange-600 font-medium transition-colors underline"
              >
                Having trouble? Force clock out
              </button>
            </div>
          </div>
        ) : (
          /* Clock-In Card */
          <div className="bg-white rounded-2xl shadow-card p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Job Site <span className="text-error">*</span>
              </label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-200 p-4 text-lg shadow-sm transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
              >
                {jobSites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
              {selectedSiteId && (
                <div className="mt-2 text-xs text-slate-500">
                  {
                    jobSites.find((s) => s.id === selectedSiteId)?.address
                  }
                </div>
              )}
            </div>

            <Button
              onClick={handleClockInClick}
              loading={loading}
              disabled={loading || !selectedSiteId}
              className="w-full"
              size="lg"
            >
              {loading ? "Clocking In..." : "Clock In"}
            </Button>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <div className="font-semibold flex items-center gap-2 mb-2">
                <span>ðŸ“</span> GPS Verification
              </div>
              <p className="text-xs leading-relaxed">
                Your location will be verified when you clock in. Make sure
                you're at the job site before clocking in.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* GPS Permission Prompt */}
      <GPSPermissionPrompt
        isOpen={showPermissionPrompt}
        onAllow={handlePermissionAllow}
        onDeny={handlePermissionDeny}
      />

      {/* Force Clock Out Confirmation */}
      <ConfirmDialog
        isOpen={showForceClockOutDialog}
        title="Force Clock Out?"
        message="This will clear your active session and clock you out immediately. Use this only if you're having technical issues."
        confirmLabel="Force Clock Out"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          setShowForceClockOutDialog(false);
          handleForceClockOut();
        }}
        onCancel={() => setShowForceClockOutDialog(false)}
      />
    </div>
  );
}

