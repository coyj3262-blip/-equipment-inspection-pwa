/**
 * Document Management Service
 *
 * Handles document uploads, downloads, and management for job site blueprints, KMZ files, etc.
 */

import { ref, push, set, get, remove } from "firebase/database";
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { rtdb, storage, auth } from "../firebase";
import type {
  Document,
  DocumentUploadData,
  DocumentFilter,
  FileType,
  NewDocument
} from "../types/documents";

const DOCUMENTS_PATH = "/v2/documents";
const STORAGE_PATH = "documents";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Get file type from file name
 */
function getFileType(fileName: string): FileType {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const typeMap: Record<string, FileType> = {
    pdf: "pdf",
    kmz: "kmz",
    kml: "kml",
    jpg: "jpg",
    jpeg: "jpeg",
    png: "png",
    gif: "gif",
    dwg: "dwg",
    dxf: "dxf",
    doc: "doc",
    docx: "docx",
    xls: "xls",
    xlsx: "xlsx"
  };
  return typeMap[ext] || "other";
}

/**
 * Upload a document to Firebase Storage and save metadata to RTDB
 */
export async function uploadDocument(
  data: DocumentUploadData,
  onProgress?: (progress: number) => void
): Promise<Document> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Must be logged in to upload documents");
  }

  // Validate file size
  if (data.file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds 50MB limit");
  }

  // Generate unique document ID
  const docRef = push(ref(rtdb, DOCUMENTS_PATH));
  const documentId = docRef.key!;

  // Determine storage path: /documents/{siteId or 'general'}/{documentId}.{ext}
  const folder = data.siteId || "general";
  const fileName = `${documentId}.${data.file.name.split(".").pop()}`;
  const storagePath = `${STORAGE_PATH}/${folder}/${fileName}`;

  // Upload file to Firebase Storage
  const fileRef = storageRef(storage, storagePath);
  const uploadTask = uploadBytesResumable(fileRef, data.file);

  // Track progress
  if (onProgress) {
    uploadTask.on("state_changed", (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress(progress);
    });
  }

  // Wait for upload to complete
  await uploadTask;

  // Get download URL
  const downloadUrl = await getDownloadURL(fileRef);

  // Get user name
  const userSnapshot = await get(ref(rtdb, `/v2/users/${user.uid}`));
  const uploaderName = userSnapshot.exists() ? userSnapshot.val().name : user.email || "Unknown";

  // Get site name if attached to site
  let siteName: string | undefined;
  if (data.siteId) {
    const siteSnapshot = await get(ref(rtdb, `/v2/jobSites/${data.siteId}`));
    if (siteSnapshot.exists()) {
      siteName = siteSnapshot.val().name;
    }
  }

  // Create document metadata
  const document: NewDocument = {
    name: data.file.name,
    fileType: getFileType(data.file.name),
    url: downloadUrl,
    storagePath,
    uploadedBy: user.uid,
    uploaderName,
    siteId: data.siteId,
    siteName,
    visibility: data.visibility,
    category: data.category,
    description: data.description,
    fileSize: data.file.size
  };

  // Save to RTDB
  await set(ref(rtdb, `${DOCUMENTS_PATH}/${documentId}`), {
    ...document,
    uploadedAt: Date.now()
  });

  return {
    id: documentId,
    ...document,
    uploadedAt: Date.now()
  };
}

/**
 * Get all documents with optional filtering
 */
export async function getDocuments(filter?: DocumentFilter): Promise<Document[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Must be logged in to view documents");
  }

  // Get user role to determine visibility
  const userSnapshot = await get(ref(rtdb, `/v2/users/${user.uid}`));
  const isSupervisor = userSnapshot.exists() && userSnapshot.val().role === "supervisor";
  const userSiteId = userSnapshot.exists() ? userSnapshot.val().siteId : null;

  const docsRef = ref(rtdb, DOCUMENTS_PATH);
  const snapshot = await get(docsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const allDocs: Document[] = [];
  snapshot.forEach((child) => {
    const doc: Document = {
      id: child.key!,
      ...child.val()
    };
    allDocs.push(doc);
  });

  // Apply filters
  let filtered = allDocs;

  // Filter by site ID
  if (filter?.siteId !== undefined) {
    filtered = filtered.filter((doc) => doc.siteId === filter.siteId);
  }

  // Filter by category
  if (filter?.category) {
    filtered = filtered.filter((doc) => doc.category === filter.category);
  }

  // Filter by file type
  if (filter?.fileType) {
    filtered = filtered.filter((doc) => doc.fileType === filter.fileType);
  }

  // Filter by uploader
  if (filter?.uploadedBy) {
    filtered = filtered.filter((doc) => doc.uploadedBy === filter.uploadedBy);
  }

  // Apply visibility filtering
  filtered = filtered.filter((doc) => {
    // All users can see "all" visibility documents
    if (doc.visibility === "all") return true;

    // Only supervisors can see "supervisors" visibility
    if (doc.visibility === "supervisors") return isSupervisor;

    // Site-restricted: users can only see docs for their assigned site
    if (doc.visibility === "site-restricted") {
      if (isSupervisor) return true; // Supervisors see all
      return doc.siteId === userSiteId;
    }

    return false;
  });

  // Sort by upload date (newest first)
  return filtered.sort((a, b) => b.uploadedAt - a.uploadedAt);
}

/**
 * Get documents for a specific job site
 */
export async function getDocumentsBySite(siteId: string): Promise<Document[]> {
  return getDocuments({ siteId });
}

/**
 * Get a single document by ID
 */
export async function getDocument(documentId: string): Promise<Document | null> {
  const docRef = ref(rtdb, `${DOCUMENTS_PATH}/${documentId}`);
  const snapshot = await get(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: documentId,
    ...snapshot.val()
  };
}

/**
 * Delete a document (Storage + RTDB)
 */
export async function deleteDocument(documentId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Must be logged in to delete documents");
  }

  // Get document to check permissions
  const doc = await getDocument(documentId);
  if (!doc) {
    throw new Error("Document not found");
  }

  // Check if user is uploader or supervisor
  const userSnapshot = await get(ref(rtdb, `/v2/users/${user.uid}`));
  const isSupervisor = userSnapshot.exists() && userSnapshot.val().role === "supervisor";
  const isUploader = doc.uploadedBy === user.uid;

  if (!isUploader && !isSupervisor) {
    throw new Error("You do not have permission to delete this document");
  }

  // Delete from Storage
  const fileRef = storageRef(storage, doc.storagePath);
  await deleteObject(fileRef);

  // Delete from RTDB
  await remove(ref(rtdb, `${DOCUMENTS_PATH}/${documentId}`));
}

/**
 * Get document count for a job site
 */
export async function getDocumentCount(siteId: string): Promise<number> {
  const docs = await getDocumentsBySite(siteId);
  return docs.length;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get file icon name based on file type
 */
export function getFileIcon(fileType: FileType): string {
  const iconMap: Record<FileType, string> = {
    pdf: "📄",
    kmz: "🗺️",
    kml: "🗺️",
    jpg: "🖼️",
    jpeg: "🖼️",
    png: "🖼️",
    gif: "🖼️",
    dwg: "📐",
    dxf: "📐",
    doc: "📝",
    docx: "📝",
    xls: "📊",
    xlsx: "📊",
    other: "📎"
  };
  return iconMap[fileType] || "📎";
}
