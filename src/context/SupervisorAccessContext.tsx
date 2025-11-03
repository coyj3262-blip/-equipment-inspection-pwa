import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { auth } from "../firebase";
import { grantSupervisorRole, revokeSupervisorRole } from "../services/supervisor-role";

type UnlockResult =
  | { success: true }
  | { success: false; message: string };

type SupervisorAccessContextValue = {
  unlocked: boolean;
  unlock: (candidate: string) => Promise<UnlockResult>;
  lock: () => void;
  passcodeConfigured: boolean;
};

const SupervisorAccessContext = createContext<SupervisorAccessContextValue | undefined>(undefined);

const STORAGE_KEY = "inspection-v2-supervisor-unlocked";

function readInitialState() {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "true";
  } catch (error) {
    console.warn("Supervisor access: failed to read session storage", error);
    return false;
  }
}

export function SupervisorAccessProvider({ children }: { children: ReactNode }) {
  const passcode = (import.meta.env.VITE_SUPERVISOR_PASSCODE ?? "").trim();
  const passcodeConfigured = passcode.length > 0;

  const [unlocked, setUnlocked] = useState<boolean>(() => readInitialState());

  useEffect(() => {
    if (!unlocked) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    void grantSupervisorRole(uid).catch(error => {
      console.warn("Supervisor access: failed to refresh role", error);
    });
  }, [unlocked]);

  const unlock = useCallback(
    async (candidate: string): Promise<UnlockResult> => {
      if (!passcodeConfigured) {
        return {
          success: false,
          message: "Supervisor passcode is not configured. Set VITE_SUPERVISOR_PASSCODE in your environment.",
        };
      }

      if (candidate.trim() !== passcode) {
        return {
          success: false,
          message: "Incorrect passcode. Try again.",
        };
      }

      const uid = auth.currentUser?.uid;
      if (!uid) {
        return {
          success: false,
          message: "Authentication missing. Refresh and try again.",
        };
      }

      try {
        await grantSupervisorRole(uid);
      } catch (error) {
        console.error("Supervisor access: failed to grant role", error);
        return {
          success: false,
          message: "Unable to grant supervisor access. Try again.",
        };
      }

      setUnlocked(true);
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem(STORAGE_KEY, "true");
        } catch (error) {
          console.warn("Supervisor access: failed to persist session state", error);
        }
      }

      return { success: true };
    },
    [passcode, passcodeConfigured],
  );

  const lock = useCallback(() => {
    setUnlocked(false);
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.warn("Supervisor access: failed to clear session state", error);
      }
    }

    const uid = auth.currentUser?.uid;
    if (uid) {
      void revokeSupervisorRole(uid).catch(error => {
        console.warn("Supervisor access: failed to revoke role", error);
      });
    }
  }, []);

  const value = useMemo(
    () => ({ unlocked, unlock, lock, passcodeConfigured }),
    [unlocked, unlock, lock, passcodeConfigured],
  );

  return (
    <SupervisorAccessContext.Provider value={value}>
      {children}
    </SupervisorAccessContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSupervisorAccess() {
  const context = useContext(SupervisorAccessContext);
  if (!context) {
    throw new Error("useSupervisorAccess must be used within a SupervisorAccessProvider");
  }
  return context;
}