/**
 * useSiteHistory Hook
 *
 * Real-time subscription to a job site's recent clock-in/out history.
 */

import { useEffect, useState } from "react";
import {
  ref,
  query,
  orderByChild,
  limitToLast,
  onValue,
} from "firebase/database";
import { rtdb } from "../firebase";
import { path } from "../backend.paths";
import type { TimeEntry } from "../types/timeTracking";

export function useSiteHistory(siteId: string | null, limit = 50) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const baseRef = ref(rtdb, path("siteTimeEntries", siteId));
    const historyQuery =
      limit > 0
        ? query(baseRef, orderByChild("clockInAt"), limitToLast(limit))
        : baseRef;

    const unsubscribe = onValue(
      historyQuery,
      (snapshot) => {
        if (!snapshot.exists()) {
          setEntries([]);
        } else {
          const list: TimeEntry[] = [];
          snapshot.forEach((childSnapshot) => {
            list.push({
              id: childSnapshot.key!,
              ...childSnapshot.val(),
            });
          });
          list.sort((a, b) => b.clockInAt - a.clockInAt);
          setEntries(list);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error loading site history:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [siteId, limit]);

  return {
    entries,
    loading,
    error,
  };
}

