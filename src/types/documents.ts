/**
 * Document Management Types
 *
 * Data structures for document sharing system (blueprints, KMZ files, etc.)
 */

export type DocumentCategory = "blueprint" | "kmz" | "photo" | "cad" | "other";
export type DocumentVisibility = "all" | "supervisors" | "site-restricted";

export type FileType =
  | "pdf"
  | "kmz"
  | "kml"
  | "jpg"
  | "jpeg"
  | "png"
  | "gif"
  | "dwg"
  | "dxf"
  | "doc"
  | "docx"
  | "xls"
  | "xlsx"
  | "other";

export interface Document {
  id: string;
  name: string;
  fileType: FileType;
  url: string; // Firebase Storage download URL
  storagePath: string;
  uploadedBy: string; // userId
  uploaderName: string; // Denormalized for display
  uploadedAt: number; // UTC timestamp
  siteId: string | null; // null = general library
  siteName?: string; // Denormalized if attached to site
  visibility: DocumentVisibility;
  category: DocumentCategory;
  description?: string;
  fileSize: number; // in bytes
  thumbnailUrl?: string; // For images/PDFs
}

export interface DocumentUploadData {
  file: File;
  siteId: string | null;
  visibility: DocumentVisibility;
  category: DocumentCategory;
  description?: string;
}

export interface DocumentFilter {
  siteId?: string | null; // null = general library only
  category?: DocumentCategory;
  fileType?: FileType;
  visibility?: DocumentVisibility;
  uploadedBy?: string;
}

// Helper type for creating new documents (before ID generation)
export type NewDocument = Omit<Document, "id" | "uploadedAt">;

// KMZ/KML parsing types
export interface KmzData {
  kml: string; // KML XML content
  name: string;
  description?: string;
  placemarks?: Placemark[];
}

export interface Placemark {
  name: string;
  description?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  geometry?: google.maps.Data.Geometry;
}
