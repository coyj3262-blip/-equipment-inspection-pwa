import { push, ref, set, update } from "firebase/database";
import { auth, rtdb } from "../firebase";
import { path } from "../backend.paths";

export type JsaStatus = "active" | "archived";

export type SopDocument = {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  uploadedAt: number;
  uploadedBy: string;
  fileSize?: number;
  contentType?: string | null;
};

export type SopDocumentInput = {
  id?: string;
  name: string;
  url: string;
  storagePath: string;
  uploadedAt: number;
  uploadedBy: string;
  fileSize?: number;
  contentType?: string | null;
};

export type Jsa = {
  id: string;
  title: string;
  jobLocation: string | null;
  description: string | null;
  hazards: string;
  controls: string;
  ppe: string | null;
  siteId?: string;
  siteName?: string;
  createdBy: string;
  createdAt: number;
  updatedAt?: number;
  archivedAt?: number | null;
  status: JsaStatus;
  effectiveDate?: string | null;
  sopDocs?: SopDocument[];
};

export type JsaSignature = {
  name: string;
  signedAt: number;
  signatureDataUrl: string;
};

export type CreateJsaInput = {
  title: string;
  jobLocation?: string;
  description?: string;
  hazards: string;
  controls: string;
  ppe?: string;
  siteId?: string;
  siteName?: string;
  effectiveDate?: string;
  sopDocs?: SopDocumentInput[];
};

export type UpdateJsaInput = {
  id: string;
  title?: string;
  jobLocation?: string;
  description?: string;
  hazards?: string;
  controls?: string;
  ppe?: string;
  siteId?: string;
  siteName?: string;
  status?: JsaStatus;
  effectiveDate?: string;
  sopDocs?: SopDocumentInput[] | null;
};

function permissionDenied(error: any) {
  return error?.code === "PERMISSION_DENIED" || error?.message?.toLowerCase().includes("permission");
}

function normalizeOptional(value: string | undefined) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function deriveDateKey(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function ensureDocId(input: SopDocumentInput): SopDocument {
  const id = input.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    ...input,
    id,
    contentType: input.contentType ?? null,
  };
}

function serializeSopDocs(docs: SopDocumentInput[] | SopDocument[] | undefined | null) {
  if (!docs || docs.length === 0) return null;
  const normalized = docs.map(ensureDocId);
  return normalized.reduce<Record<string, SopDocument>>((acc, doc) => {
    acc[doc.id] = doc;
    return acc;
  }, {});
}

export async function createJsa(input: CreateJsaInput): Promise<string> {
  const uid = auth.currentUser?.uid ?? "anonymous";
  const now = Date.now();
  const newRef = push(ref(rtdb, path("jsas")));
  if (!newRef.key) {
    throw new Error("Failed to generate JSA id");
  }

  const effectiveDate = (input.effectiveDate?.trim() || deriveDateKey(now));

  const payload = {
    title: input.title.trim(),
    jobLocation: normalizeOptional(input.jobLocation) ?? null,
    description: normalizeOptional(input.description) ?? null,
    hazards: input.hazards.trim(),
    controls: input.controls.trim(),
    ppe: normalizeOptional(input.ppe) ?? null,
    siteId: input.siteId ?? null,
    siteName: input.siteName ?? null,
    sopDocs: serializeSopDocs(input.sopDocs),
    createdBy: uid,
    createdAt: now,
    updatedAt: now,
    archivedAt: null as number | null,
    status: "active" as JsaStatus,
    effectiveDate,
  };

  try {
    await set(newRef, payload);
    return newRef.key;
  } catch (error: any) {
    if (permissionDenied(error)) {
      throw new Error("Only supervisors can create JSAs. Contact your supervisor if you need access.");
    }
    throw error;
  }
}

export async function updateJsa(input: UpdateJsaInput): Promise<void> {
  const { id, ...rest } = input;
  const updates: Record<string, unknown> = {};

  if (rest.title !== undefined) updates.title = rest.title.trim();
  if (rest.jobLocation !== undefined) updates.jobLocation = normalizeOptional(rest.jobLocation) ?? null;
  if (rest.description !== undefined) updates.description = normalizeOptional(rest.description) ?? null;
  if (rest.hazards !== undefined) updates.hazards = rest.hazards.trim();
  if (rest.controls !== undefined) updates.controls = rest.controls.trim();
  if (rest.ppe !== undefined) updates.ppe = normalizeOptional(rest.ppe) ?? null;
  if (rest.siteId !== undefined) updates.siteId = rest.siteId ?? null;
  if (rest.siteName !== undefined) updates.siteName = rest.siteName ?? null;
  if (rest.status !== undefined) updates.status = rest.status;
  if (rest.effectiveDate !== undefined) {
    const trimmed = rest.effectiveDate.trim();
    updates.effectiveDate = trimmed.length ? trimmed : deriveDateKey(Date.now());
  }
  if (rest.sopDocs !== undefined) {
    const serialized = serializeSopDocs(rest.sopDocs ?? undefined);
    updates.sopDocs = serialized;
  }

  if (Object.keys(updates).length === 0) return;

  updates.updatedAt = Date.now();

  try {
    await update(ref(rtdb, path("jsas", id)), updates);
  } catch (error: any) {
    if (permissionDenied(error)) {
      throw new Error("Only supervisors can update JSAs.");
    }
    throw error;
  }
}

export async function signJsa(input: {
  jsaId: string;
  uid: string;
  name: string;
  signatureDataUrl: string;
}) {
  const record: JsaSignature = {
    name: input.name.trim(),
    signedAt: Date.now(),
    signatureDataUrl: input.signatureDataUrl,
  };

  await set(ref(rtdb, path("jsaSignatures", input.jsaId, input.uid)), record);
}

export async function archiveJsa(jsaId: string): Promise<void> {
  const now = Date.now();
  try {
    await update(ref(rtdb, path("jsas", jsaId)), {
      status: "archived",
      archivedAt: now,
      updatedAt: now,
    });
  } catch (error: any) {
    if (permissionDenied(error)) {
      throw new Error("Only supervisors can archive JSAs.");
    }
    throw error;
  }
}
