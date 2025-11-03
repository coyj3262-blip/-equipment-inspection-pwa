import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { rtdb, auth } from "../firebase";
import { path } from "../backend.paths";

// Support both historical "operator" and current "employee" non-supervisor roles
export type UserRole = "supervisor" | "employee" | "operator" | null;

export function useUserRole() {
  const [uid, setUid] = useState<string | null>(null);
  const [dbRole, setDbRole] = useState<UserRole | null>(null);
  const [claimsSupervisor, setClaimsSupervisor] = useState<boolean | null>(null);
  const [legacySupervisor, setLegacySupervisor] = useState<boolean | null>(null);

  // Track auth state (uid)
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      if (!user) {
        setDbRole(null);
        setClaimsSupervisor(null);
      }
    });
    return () => unsubAuth();
  }, []);

  // Subscribe to RTDB user role
  useEffect(() => {
    if (!uid) return;
    const roleRef = ref(rtdb, path("users", uid, "role"));
    const unsubscribe = onValue(roleRef, (snapshot) => {
      const val = snapshot.val() as string | null;
      // Normalize unexpected values to non-supervisor role
      if (val === "supervisor") {
        setDbRole("supervisor");
      } else if (val === "employee" || val === "operator") {
        setDbRole(val as UserRole);
      } else {
        setDbRole(null);
      }
    });
    return () => unsubscribe();
  }, [uid]);

  // Fallback: legacy role flag at /v2/supervisors/{uid}
  useEffect(() => {
    if (!uid) return;
    const supRef = ref(rtdb, path("supervisors", uid));
    const unsubscribe = onValue(supRef, (snapshot) => {
      setLegacySupervisor(Boolean(snapshot.val()));
    });
    return () => unsubscribe();
  }, [uid]);

  // Read custom claims as a fallback (some accounts may rely on claims)
  useEffect(() => {
    let cancelled = false;
    async function readClaims() {
      if (!auth.currentUser) {
        setClaimsSupervisor(null);
        return;
      }
      try {
        const token = await auth.currentUser.getIdTokenResult(true);
        const isSup = Boolean(
          token.claims.supervisor || token.claims.role === "supervisor"
        );
        if (!cancelled) setClaimsSupervisor(isSup);
      } catch (e) {
        if (!cancelled) setClaimsSupervisor(null);
      }
    }
    void readClaims();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Compute composite role and loading state
  const isSupervisor =
    dbRole === "supervisor" || legacySupervisor === true || claimsSupervisor === true;
  const role: UserRole = isSupervisor
    ? "supervisor"
    : dbRole ?? (claimsSupervisor === false ? "employee" : null);
  const loading =
    uid == null || (dbRole === null && claimsSupervisor === null && legacySupervisor === null);

  return { role, loading, isSupervisor };
}
