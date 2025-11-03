/**
 * DocumentCard Component
 *
 * Display individual document with metadata, download, and delete options
 */

import { useState } from "react";
import { deleteDocument, formatFileSize, getFileIcon } from "../../services/documents";
import { useToast } from "../../hooks/useToast";
import { auth } from "../../firebase";
import { Map } from "@vis.gl/react-google-maps";
import KmzMapLayer from "../maps/KmzMapLayer";
import type { Document } from "../../types/documents";

interface DocumentCardProps {
  document: Document;
  onDeleted?: () => void;
  showSiteName?: boolean;
  canDelete?: boolean;
}

export default function DocumentCard({
  document,
  onDeleted,
  showSiteName = true,
  canDelete = true
}: DocumentCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showKmzPreview, setShowKmzPreview] = useState(false);
  const toast = useToast();

  const currentUser = auth.currentUser;
  const isOwner = currentUser?.uid === document.uploadedBy;
  const isKmz = document.fileType === "kmz" || document.fileType === "kml";

  const handleDownload = () => {
    window.open(document.url, "_blank");
  };

  const handleDelete = async () => {
    if (!canDelete) return;

    setDeleting(true);
    try {
      await deleteDocument(document.id);
      toast.success("Document deleted successfully");
      setShowDeleteConfirm(false);
      if (onDeleted) onDeleted();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryBadge = () => {
    const badges = {
      blueprint: { label: "Blueprint", color: "bg-blue-100 text-blue-700" },
      kmz: { label: "KMZ Map", color: "bg-green-100 text-green-700" },
      photo: { label: "Photo", color: "bg-purple-100 text-purple-700" },
      cad: { label: "CAD", color: "bg-orange-100 text-orange-700" },
      other: { label: "Document", color: "bg-slate-100 text-slate-700" }
    };
    return badges[document.category];
  };

  const getVisibilityBadge = () => {
    const badges = {
      all: { label: "Public", color: "bg-green-100 text-green-700", icon: "👥" },
      supervisors: { label: "Supervisors Only", color: "bg-orange-100 text-orange-700", icon: "👔" },
      "site-restricted": { label: "Site Only", color: "bg-blue-100 text-blue-700", icon: "📍" }
    };
    return badges[document.visibility];
  };

  const category = getCategoryBadge();
  const visibility = getVisibilityBadge();
  const uploadDate = new Date(document.uploadedAt).toLocaleDateString();
  const uploadTime = new Date(document.uploadedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <>
      <div className="bg-white rounded-xl border-2 border-slate-200 p-4 hover:border-orange-300 transition-all shadow-sm hover:shadow-md">
        {/* File Icon & Name */}
        <div className="flex items-start gap-3 mb-3">
          <div className="text-4xl flex-shrink-0">{getFileIcon(document.fileType)}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm truncate">{document.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{formatFileSize(document.fileSize)}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${category.color}`}>
            {category.label}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${visibility.color}`}>
            {visibility.icon} {visibility.label}
          </span>
        </div>

        {/* Site Name */}
        {showSiteName && document.siteName && (
          <div className="text-xs text-slate-600 mb-2">
            📍 <span className="font-medium">{document.siteName}</span>
          </div>
        )}

        {/* Description */}
        {document.description && (
          <p className="text-xs text-slate-600 mb-3 line-clamp-2">{document.description}</p>
        )}

        {/* Metadata */}
        <div className="text-xs text-slate-500 space-y-1 mb-3 border-t border-slate-100 pt-3">
          <div>
            Uploaded by <span className="font-medium text-slate-700">{document.uploaderName}</span>
          </div>
          <div>
            {uploadDate} at {uploadTime}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isKmz && (
            <button
              onClick={() => setShowKmzPreview(true)}
              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              🗺️ Preview
            </button>
          )}
          <button
            onClick={handleDownload}
            className={`${isKmz ? "flex-1" : "flex-1"} px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors`}
          >
            📥 Download
          </button>
          {canDelete && isOwner && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* KMZ Preview Modal */}
      {showKmzPreview && isKmz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-navy-900">{document.name}</h3>
                <p className="text-xs text-slate-500 mt-1">KMZ Map Preview</p>
              </div>
              <button
                onClick={() => setShowKmzPreview(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Map */}
            <div className="flex-1 relative">
              <Map
                defaultCenter={{ lat: 36.1627, lng: -86.7816 }}
                defaultZoom={12}
                mapId="kmz-preview-map"
                mapTypeId="hybrid"
                gestureHandling="greedy"
                disableDefaultUI={false}
                zoomControl={true}
                style={{ width: "100%", height: "100%" }}
              >
                <KmzMapLayer
                  url={document.url}
                  fileName={document.name}
                  visible={true}
                  onError={(err) => {
                    console.error("KMZ preview error:", err);
                    toast.error(`Failed to load KMZ: ${err.message}`);
                  }}
                />
              </Map>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowKmzPreview(false)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                📥 Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-navy-900 mb-2">Delete Document?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete <span className="font-semibold">{document.name}</span>? This
              action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
