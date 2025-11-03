/**
 * useActiveSession Hook
 *
 * Real-time subscription to user's active clock-in session
 * Automatically updates when user clocks in/out
 */

import { useState, useEffect } from "react";
import { ref, onValue, off } from "firebase/database";
import { rtdb, auth } from "../firebase";
import { path } from "../backend.paths";
import type { ActiveSession } from "../types/timeTracking";

export function useActiveSession() {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setSession(null);
      setLoading(false);
      return;
    }

    const sessionRef = ref(rtdb, path("activeSessions", user.uid));

    const unsubscribe = onValue(
      sessionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSession(snapshot.val());
        } else {
          setSession(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error loading active session:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      off(sessionRef, "value", unsubscribe);
    };
  }, []);

  // Calculate elapsed time in milliseconds
  const elapsedTime = session ? Date.now() - session.clockInAt : 0;

  return {
    session,
    loading,
    error,
    elapsedTime,
    isClockedIn: session !== null,
  };
}
