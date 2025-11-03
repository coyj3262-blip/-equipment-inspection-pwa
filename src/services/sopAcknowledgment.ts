import { ref, set, get, serverTimestamp, push } from "firebase/database";
import { auth, rtdb } from "../firebase";
import { path } from "../backend.paths";

export type SopAcknowledgment = {
  sopId: string;
  sopTitle: string;
  acknowledgedBy: string;
  acknowledgedByName: string;
  acknowledgedAt: number;
  signature?: string;
  equipmentType?: string;
  notes?: string;
  ackExpiresAt?: number;
};

const DEFAULT_ACK_INTERVAL_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const sopIntervalCache = new Map<string, number>();

/**
 * Record that an operator has read and understood an SOP
 */
export async function acknowledgeSop(
  sopId: string,
  sopTitle: string,
  operatorName: string,
  signature?: string,
  equipmentType?: string,
  notes?: string
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Authentication required");

  const intervalDays = await getAcknowledgmentIntervalDays(sopId);
  const acknowledgedAt = Date.now();
  const ackExpiresAt = acknowledgedAt + intervalDays * MS_PER_DAY;

  const acknowledgment: SopAcknowledgment = {
    sopId,
    sopTitle,
    acknowledgedBy: uid,
    acknowledgedByName: operatorName,
    acknowledgedAt,
    ackExpiresAt,
    signature,
    equipmentType,
    notes,
  };

  // Store in two places for efficient queries:
  // 1. By SOP (to see who acknowledged which SOP)
  const sopAckRef = ref(rtdb, path("sopAcknowledgments", sopId, uid));
  await set(sopAckRef, acknowledgment);

  // 2. By user (to see which SOPs this user has acknowledged)
  const userAckRef = ref(rtdb, path("userSopAcknowledgments", uid, sopId));
  await set(userAckRef, {
    ...acknowledgment,
    acknowledgedAt: serverTimestamp(),
    ackExpiresAt,
  });

  // 3. Create event log entry
  const eventRef = push(ref(rtdb, path("sopAcknowledgmentEvents")));
  await set(eventRef, {
    ...acknowledgment,
    eventId: eventRef.key,
    timestamp: serverTimestamp(),
  });
}

/**
 * Check if current user has acknowledged a specific SOP
 */
export async function hasAcknowledgedSop(sopId: string): Promise<boolean> {
  if (!auth.currentUser) return false;

  const uid = auth.currentUser.uid;
  const ackRef = ref(rtdb, path("sopAcknowledgments", sopId, uid));
  const snapshot = await get(ackRef);
  if (!snapshot.exists()) {
    return false;
  }

  const record = snapshot.val() as SopAcknowledgment;
  if (!record.acknowledgedAt) {
    return false;
  }

  const intervalDays = await getAcknowledgmentIntervalDays(sopId);
  const computedExpiry =
    record.ackExpiresAt ??
    record.acknowledgedAt + intervalDays * MS_PER_DAY;

  return Date.now() <= computedExpiry;
}

/**
 * Get all acknowledgments for a specific SOP
 */
export async function getSopAcknowledgments(
  sopId: string
): Promise<SopAcknowledgment[]> {
  const ackRef = ref(rtdb, path("sopAcknowledgments", sopId));
  const snapshot = await get(ackRef);

  if (!snapshot.exists()) return [];

  const data = snapshot.val();
  return Object.values(data);
}

/**
 * Get all SOPs acknowledged by current user
 */
export async function getUserAcknowledgedSops(): Promise<SopAcknowledgment[]> {
  if (!auth.currentUser) return [];

  const uid = auth.currentUser.uid;
  const userAckRef = ref(rtdb, path("userSopAcknowledgments", uid));
  const snapshot = await get(userAckRef);

  if (!snapshot.exists()) return [];

  const data = snapshot.val();
  return Object.values(data);
}

/**
 * Check if user needs to acknowledge SOPs for an equipment type
 */
export async function getRequiredSopsForEquipment(
  equipmentType: string
): Promise<string[]> {
  // Get all SOPs linked to this equipment type
  const sopsRef = ref(rtdb, path("sops"));
  const snapshot = await get(sopsRef);

  if (!snapshot.exists()) return [];

  const allSops = snapshot.val() as Record<string, {
    equipmentTypes?: string[];
    [key: string]: unknown;
  }>;
  const requiredSopIds: string[] = [];

  Object.entries(allSops).forEach(([sopId, sop]) => {
    // Check if SOP applies to this equipment type
    if (
      sop.equipmentTypes &&
      Array.isArray(sop.equipmentTypes) &&
      sop.equipmentTypes.includes(equipmentType)
    ) {
      requiredSopIds.push(sopId);
    }
  });

  return requiredSopIds;
}

/**
 * Check if user has acknowledged all required SOPs for equipment type
 */
export async function hasAcknowledgedAllRequired(
  equipmentType: string
): Promise<{ allAcknowledged: boolean; missingSops: string[] }> {
  const requiredSopIds = await getRequiredSopsForEquipment(equipmentType);

  if (requiredSopIds.length === 0) {
    return { allAcknowledged: true, missingSops: [] };
  }

  const missingSops: string[] = [];

  for (const sopId of requiredSopIds) {
    const acknowledged = await hasAcknowledgedSop(sopId);
    if (!acknowledged) {
      missingSops.push(sopId);
    }
  }

  return {
    allAcknowledged: missingSops.length === 0,
    missingSops,
  };
}

async function getAcknowledgmentIntervalDays(sopId: string): Promise<number> {
  if (sopIntervalCache.has(sopId)) {
    return sopIntervalCache.get(sopId)!;
  }

  try {
    const snapshot = await get(
      ref(rtdb, path("sops", sopId, "acknowledgmentIntervalDays"))
    );
    if (snapshot.exists()) {
      const value = snapshot.val();
      const parsed =
        typeof value === "number" && Number.isFinite(value) && value > 0
          ? value
          : DEFAULT_ACK_INTERVAL_DAYS;
      sopIntervalCache.set(sopId, parsed);
      return parsed;
    }
  } catch (error) {
    console.warn(
      `Failed to load acknowledgment interval for SOP ${sopId}:`,
      error
    );
  }

  sopIntervalCache.set(sopId, DEFAULT_ACK_INTERVAL_DAYS);
  return DEFAULT_ACK_INTERVAL_DAYS;
}
