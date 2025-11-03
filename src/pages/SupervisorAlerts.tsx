/**
 * SupervisorAlerts Page
 *
 * Manage GPS verification alerts for out-of-radius clock-ins,
 * poor accuracy, and permission denials
 */

import { useSupervisorAlerts, acknowledgeAlert, dismissAlert } from "../hooks/useSupervisorAlerts";
import { approveTimeEntry } from "../services/timeClock";
import { useToast } from "../hooks/useToast";
import Header from "../components/ui/Header";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import { formatDistance } from "../services/geolocation";

export default function SupervisorAlerts() {
  const { alerts, unreadCount, loading, byType } = useSupervisorAlerts();
  const toast = useToast();

  async function handleAcknowledge(alertId: string) {
    try {
      await acknowledgeAlert(alertId);
      toast.success("Alert acknowledged");
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      toast.error("Failed to acknowledge alert");
    }
  }

  async function handleDismiss(alertId: string) {
    try {
      await dismissAlert(alertId);
      toast.success("Alert dismissed");
    } catch (error) {
      console.error("Error dismissing alert:", error);
      toast.error("Failed to dismiss alert");
    }
  }

  async function handleApprove(userId: string, entryId: string, alertId: string) {
    try {
      await approveTimeEntry(userId, entryId);
      await acknowledgeAlert(alertId);
      toast.success("Time entry approved");
    } catch (error) {
      console.error("Error approving entry:", error);
      toast.error("Failed to approve entry");
    }
  }

  function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getAlertIcon(type: string): string {
    switch (type) {
      case "out_of_radius":
        return "âš ï¸";
      case "poor_accuracy":
        return "ðŸ“";
      case "gps_denied":
        return "ðŸš«";
      case "late_sync":
        return "ðŸ”„";
      default:
        return "â„¹ï¸";
    }
  }

  function getAlertTitle(type: string): string {
    switch (type) {
      case "out_of_radius":
        return "Out of Radius";
      case "poor_accuracy":
        return "Poor GPS Accuracy";
      case "gps_denied":
        return "GPS Permission Denied";
      case "late_sync":
        return "Late Sync";
      default:
        return "Alert";
    }
  }

  if (loading) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <Header title="Supervisor Alerts" subtitle="Loading alerts..." />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <Header title="Supervisor Alerts" subtitle="No alerts" />
        <div className="max-w-2xl mx-auto p-4">
          <EmptyState
            icon="âœ…"
            title="All clear!"
            description="No alerts require your attention."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header
        title="Supervisor Alerts"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread ${unreadCount === 1 ? "alert" : "alerts"}`
            : "All alerts reviewed"
        }
      />

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Stats Card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {byType("out_of_radius").length}
              </div>
              <div className="text-xs text-slate-600 mt-1">Out of Radius</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {byType("poor_accuracy").length}
              </div>
              <div className="text-xs text-slate-600 mt-1">Poor Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {byType("gps_denied").length}
              </div>
              <div className="text-xs text-slate-600 mt-1">GPS Denied</div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-2xl shadow-sm border-2 p-5 transition-all ${
                alert.acknowledged
                  ? "border-slate-200 opacity-60"
                  : "border-orange-300 shadow-md"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getAlertIcon(alert.type)}</div>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      {getAlertTitle(alert.type)}
                    </h4>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {alert.userName} â€¢ {alert.siteName}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  {formatTimestamp(alert.timestamp)}
                </div>
              </div>

              {/* Details */}
              <div className="bg-slate-50 rounded-xl p-3 space-y-2 mb-3">
                {alert.distance !== undefined && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Distance from site:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatDistance(alert.distance)}
                    </span>
                  </div>
                )}
                {alert.accuracy !== undefined && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">GPS Accuracy:</span>
                    <span
                      className={`font-mono font-semibold ${
                        alert.accuracy > 100
                          ? "text-orange-600"
                          : "text-slate-900"
                      }`}
                    >
                      Â±{Math.round(alert.accuracy)}m
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {!alert.acknowledged ? (
                <div className="flex gap-2">
                  {alert.entryId && (
                    <Button
                      onClick={() =>
                        handleApprove(alert.userId, alert.entryId!, alert.id)
                      }
                      size="sm"
                      className="flex-1 bg-green-500 hover:bg-green-600"
                    >
                      Approve Entry
                    </Button>
                  )}
                  <Button
                    onClick={() => handleAcknowledge(alert.id)}
                    size="sm"
                    className="flex-1 bg-slate-500 hover:bg-slate-600"
                  >
                    Acknowledge
                  </Button>
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              ) : (
                <div className="text-xs text-green-600 flex items-center gap-2">
                  <span>âœ“</span>
                  <span>
                    Acknowledged on{" "}
                    {alert.acknowledgedAt &&
                      formatTimestamp(alert.acknowledgedAt)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Filter Notice */}
        <div className="text-center text-xs text-slate-500 py-4">
          <p>Updates automatically in real-time</p>
        </div>
      </div>
    </div>
  );
}

