/**
 * useSitePersonnel Hook
 *
 * Real-time subscription to all personnel currently clocked in at a specific job site
 */

import { useState, useEffect } from "react";
import { ref, onValue, off } from "firebase/database";
import { rtdb } from "../firebase";
import { path } from "../backend.paths";
import type { SitePersonnel, ActiveSession } from "../types/timeTracking";

export function useSitePersonnel(siteId: string | null) {
  const [personnel, setPersonnel] = useState<SitePersonnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId) {
      setPersonnel([]);
      setLoading(false);
      return;
    }

    const personnelRef = ref(rtdb, path("sitePersonnel", siteId));

    const unsubscribe = onValue(
      personnelRef,
      (snapshot) => {
        const list: SitePersonnel[] = [];

        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            list.push({
              userId: childSnapshot.key!,
              ...data,
            });
          });
        }

        // Sort by clock-in time (newest first)
        list.sort((a, b) => b.clockInAt - a.clockInAt);

        setPersonnel(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error loading site personnel:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      off(personnelRef, "value", unsubscribe);
    };
  }, [siteId]);

  return {
    personnel,
    count: personnel.length,
    loading,
    error,
  };
}

/**
 * Hook to get all active sessions across all sites
 */
export function useAllActiveSessions() {
  const [sessions, setSessions] = useState<Record<string, ActiveSession>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionsRef = ref(rtdb, path("activeSessions"));

    const unsubscribe = onValue(
      sessionsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSessions(snapshot.val());
        } else {
          setSessions({});
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error loading active sessions:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      off(sessionsRef, "value", unsubscribe);
    };
  }, []);

  // Convert to array
  const sessionList: ActiveSession[] = Object.entries(sessions).map(
    ([userId, session]) => ({
      ...session,
      userId,
    })
  );

  // Group by site
  const bySite: Record<string, ActiveSession[]> = {};
  sessionList.forEach((session) => {
    if (!bySite[session.siteId]) {
      bySite[session.siteId] = [];
    }
    bySite[session.siteId].push(session);
  });

  return {
    sessions: sessionList,
    bySite,
    totalCount: sessionList.length,
    loading,
    error,
  };
}
