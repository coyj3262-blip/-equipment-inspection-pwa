/**
 * ActiveSessionBanner Component
 *
 * Displays a sticky banner when user is clocked in
 * Shows site name and live elapsed time
 */

import { useState, useEffect } from "react";
import { useActiveSession } from "../hooks/useActiveSession";

export default function ActiveSessionBanner() {
  const { session, isClockedIn } = useActiveSession();
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!session) return;

    const updateElapsed = () => {
      const diff = Date.now() - session.clockInAt;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setElapsed(`${hours}h ${minutes}m`);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [session]);

  if (!isClockedIn || !session) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur">
            <span className="text-lg">⏱️</span>
          </div>
          <div>
            <div className="text-sm font-semibold">Clocked In</div>
            <div className="text-xs text-green-50">{session.siteName}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{elapsed}</div>
          <div className="text-xs text-green-50">Elapsed</div>
        </div>
      </div>
    </div>
  );
}
