type DraftAnswerPayload = {
  status?: string;
  note?: string;
  photos?: string[];
};

type DraftPayload = {
  equipType: string;
  equipmentId: string;
  hours: string;
  answers: Record<string, DraftAnswerPayload>;
  signature?: string;
  savedAt: number;
  inspectionId?: string;
};

const STORAGE_KEY = "inspection-v2-drafts";

function loadAll(): Record<string, DraftPayload> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, DraftPayload>;
    }
  } catch (err) {
    console.warn("Failed to parse draft storage", err);
  }
  return {};
}

function persistAll(map: Record<string, DraftPayload>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn("Failed to persist draft storage", err);
  }
}

const draftKey = (equipType: string, equipId: string) => `${equipType}:${equipId || "_"}`;

export function saveDraft(payload: DraftPayload) {
  const all = loadAll();
  all[draftKey(payload.equipType, payload.equipmentId)] = payload;
  persistAll(all);
}

export function readDraft(equipType: string, equipId: string): DraftPayload | null {
  const all = loadAll();
  return all[draftKey(equipType, equipId)] ?? null;
}

export function clearDraft(equipType: string, equipId: string) {
  const all = loadAll();
  const key = draftKey(equipType, equipId);
  if (all[key]) {
    delete all[key];
    persistAll(all);
  }
}
