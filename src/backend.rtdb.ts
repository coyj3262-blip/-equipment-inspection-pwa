import { rtdb } from "./firebase";
import { ref, set, serverTimestamp, update } from "firebase/database";
import { path } from "./backend.paths";
export * from "./backend.paths";

export type Answer = { status: "pass"|"fail"|"na", note?: string, photos?: string[] };
export type Inspection = {
  equipmentType: "dozer"|"loader"|"farm_tractor"|"excavator",
  equipmentId: string,
  operatorUid: string,
  siteId: string,
  siteName: string,
  state: "in_progress"|"submitted"|"reopened"|"overdue",
  startedAt: number,
  submittedAt?: number,
  hours?: number,
  answers: Record<string, Answer>,
  lastActivityAt?: number,
  signature?: string
};

export async function writeInspectionWithIndexes(id: string, insp: Inspection){
  await set(ref(rtdb, path("inspections", id)), { ...insp, createdAt: { ".sv": "timestamp" } });
  const d = new Date(insp.startedAt);
  const yyyymmdd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${
    String(d.getDate()).padStart(2, "0")
  }`;
  const idx: Record<string, true> = {};
  idx[path("byDate", yyyymmdd, id)] = true;
  idx[path("byStatusDate", insp.state, yyyymmdd, id)] = true;
  idx[path("byEquipmentDate", insp.equipmentType, yyyymmdd, id)] = true;
  idx[path("byOperatorDate", insp.operatorUid, yyyymmdd, id)] = true;
  idx[path("bySiteDate", insp.siteId, yyyymmdd, id)] = true;
  await update(ref(rtdb), idx);
}

export async function logEvent(inspectionId: string, type: string, meta?: Record<string, unknown> | null){
  const newId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await set(ref(rtdb, path("inspectionEvents", inspectionId, newId)), {
    type,
    meta: meta ?? null,
    ts: serverTimestamp()
  });
}
