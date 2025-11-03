/**
 * useSupervisorAlerts Hook
 *
 * Real-time subscription to supervisor alerts
 * Includes unread count for badge display
 */

import { useState, useEffect } from "react";
import { ref, onValue, off, update } from "firebase/database";
import { rtdb, auth } from "../firebase";
import { path } from "../backend.paths";
import type { SupervisorAlert } from "../types/timeTracking";

export function useSupervisorAlerts() {
  const [alerts, setAlerts] = useState<SupervisorAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    const alertsRef = ref(rtdb, path("supervisorAlerts", user.uid));

    const unsubscribe = onValue(
      alertsRef,
      (snapshot) => {
        const list: SupervisorAlert[] = [];

        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            list.push({
              id: childSnapshot.key!,
              ...childSnapshot.val(),
            });
          });
        }

        // Sort by timestamp (newest first)
        list.sort((a, b) => b.timestamp - a.timestamp);

        setAlerts(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error loading supervisor alerts:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      off(alertsRef, "value", unsubscribe);
    };
  }, []);

  // Calculate unread count
  const unreadCount = alerts.filter((a) => !a.acknowledged).length;

  // Filter by type
  const byType = (type: SupervisorAlert["type"]) =>
    alerts.filter((a) => a.type === type);

  // Get unacknowledged alerts
  const unacknowledged = alerts.filter((a) => !a.acknowledged);

  return {
    alerts,
    unreadCount,
    loading,
    error,
    byType,
    unacknowledged,
  };
}

/**
 * Acknowledge a supervisor alert
 */
export async function acknowledgeAlert(alertId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Must be authenticated");
  }

  const updates: Record<string, unknown> = {};
  updates[path("supervisorAlerts", user.uid, alertId, "acknowledged")] = true;
  updates[path("supervisorAlerts", user.uid, alertId, "acknowledgedAt")] =
    Date.now();
  updates[path("supervisorAlerts", user.uid, alertId, "acknowledgedBy")] =
    user.uid;

  await update(ref(rtdb), updates);
}

/**
 * Dismiss (delete) a supervisor alert
 */
export async function dismissAlert(alertId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Must be authenticated");
  }

  const updates: Record<string, unknown> = {};
  updates[path("supervisorAlerts", user.uid, alertId)] = null;

  await update(ref(rtdb), updates);
}
