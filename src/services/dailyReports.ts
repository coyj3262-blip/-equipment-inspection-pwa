import { ref, push, set, onValue, off, get } from "firebase/database";
import { rtdb, auth } from "../firebase";
import { path } from "../backend.paths";
import type { DailyReport, DailyReportInput } from "../types/dailyReport";

export async function createDailyReport(input: DailyReportInput): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const reportsRef = ref(rtdb, path("dailyReports"));
  const newRef = push(reportsRef);
  const id = newRef.key!;

  const payload: Omit<DailyReport, "id"> = {
    ...input,
    createdAt: Date.now(),
    createdBy: user.uid,
    createdByName: user.displayName || user.email || "Unknown",
  };

  await set(newRef, payload);
  return id;
}

export function subscribeToDailyReports(
  callback: (reports: DailyReport[]) => void
): () => void {
  const reportsRef = ref(rtdb, path("dailyReports"));

  const listener = (snap: any) => {
    if (!snap.exists()) {
      callback([]);
      return;
    }
    const raw = snap.val();
    const list: DailyReport[] = Object.entries(raw).map(([id, v]: [string, any]) => ({ id, ...(v as Omit<DailyReport, "id">) }));
    // Newest first
    list.sort((a, b) => b.createdAt - a.createdAt);
    callback(list);
  };

  onValue(reportsRef, listener);
  return () => off(reportsRef, "value", listener);
}

export async function getMyDailyReports(): Promise<DailyReport[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const reportsRef = ref(rtdb, path("dailyReports"));
  const snap = await get(reportsRef);
  if (!snap.exists()) return [];
  const raw = snap.val();
  const list: DailyReport[] = Object.entries(raw)
    .map(([id, v]: [string, any]) => ({ id, ...(v as Omit<DailyReport, "id">) }))
    .filter(r => r.createdBy === user.uid);
  list.sort((a, b) => b.createdAt - a.createdAt);
  return list;
}

