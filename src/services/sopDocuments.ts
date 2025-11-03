import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, storage } from "../firebase";
import type { SopDocument } from "./jsa";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB cap to avoid huge uploads
const ALLOWED_MIME_PREFIXES = ["application/pdf", "image/", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument"];

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function isAllowedType(type: string) {
  if (!type) return true; // allow unknown when browsers cannot detect
  return ALLOWED_MIME_PREFIXES.some(prefix => type.startsWith(prefix));
}

export class SopDocumentUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SopDocumentUploadError";
  }
}

export async function uploadSopDocument(file: File): Promise<SopDocument> {
  if (file.size > MAX_FILE_SIZE) {
    throw new SopDocumentUploadError("File is too large. Keep SOP uploads under 15MB.");
  }

  if (!isAllowedType(file.type)) {
    throw new SopDocumentUploadError("Unsupported file type. Upload PDF, image, Word, or text documents.");
  }

  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new SopDocumentUploadError("Authentication required to upload documents.");
  }
  const safeName = sanitizeFileName(file.name.trim() || "document");
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const storagePath = `jsa-documents/${id}-${safeName}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type || undefined,
    cacheControl: "public,max-age=86400",
  });

  const url = await getDownloadURL(storageRef);

  const document: SopDocument = {
    id,
    name: file.name,
    url,
    storagePath,
    uploadedAt: Date.now(),
    uploadedBy: uid,
    fileSize: file.size,
    contentType: file.type || null,
  };

  return document;
}

export async function deleteSopDocument(storagePath: string) {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error: any) {
    // Ignore missing file errors; log others for diagnostics.
    const message = String(error?.message ?? "");
    if (!message.toLowerCase().includes("object-not-found")) {
      console.warn("Failed to remove SOP document", error);
    }
  }
}
