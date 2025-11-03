/**
 * DocumentUploadModal Component
 *
 * Modal for uploading documents with file picker, metadata, and progress tracking
 */

import { useState, useEffect } from "react";
import { uploadDocument } from "../../services/documents";
import { getAllJobSites } from "../../services/jobSites";
import { useToast } from "../../hooks/useToast";
import Button from "../ui/Button";
import type { DocumentCategory, DocumentVisibility, DocumentUploadData } from "../../types/documents";
import type { JobSite } from "../../types/timeTracking";

interface DocumentUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
  defaultSiteId?: string | null;
}

export default function DocumentUploadModal({
  onClose,
  onSuccess,
  defaultSiteId
}: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [siteId, setSiteId] = useState<string | null>(defaultSiteId || null);
  const [visibility, setVisibility] = useState<DocumentVisibility>("all");
  const [category, setCategory] = useState<DocumentCategory>("other");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jobSites, setJobSites] = useState<JobSite[]>([]);
  const toast = useToast();

  // Load job sites
  useEffect(() => {
    async function loadSites() {
      try {
        const sites = await getAllJobSites(true);
        setJobSites(sites);
      } catch (err) {
        console.error("Failed to load job sites:", err);
        toast.error("Failed to load job sites");
      }
    }
    loadSites();
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (50MB max)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error("File size exceeds 50MB limit");
        return;
      }
      setFile(selectedFile);

      // Auto-detect category based on file extension
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      if (ext === "kmz" || ext === "kml") {
        setCategory("kmz");
      } else if (ext === "pdf") {
        setCategory("blueprint");
      } else if (["jpg", "jpeg", "png", "gif"].includes(ext || "")) {
        setCategory("photo");
      } else if (["dwg", "dxf"].includes(ext || "")) {
        setCategory("cad");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const uploadData: DocumentUploadData = {
        file,
        siteId,
        visibility,
        category,
        description: description.trim() || undefined
      };

      await uploadDocument(uploadData, (p) => setProgress(p));

      toast.success("Document uploaded successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-navy-900">Upload Document</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              disabled={uploading}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* File Picker */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Select File <span className="text-error">*</span>
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              disabled={uploading}
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
            />
            {file && (
              <p className="mt-2 text-xs text-slate-600">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500">Max file size: 50MB</p>
          </div>

          {/* Job Site Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Attach to Job Site (Optional)
            </label>
            <select
              value={siteId || "general"}
              onChange={(e) => setSiteId(e.target.value === "general" ? null : e.target.value)}
              disabled={uploading}
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
            >
              <option value="general">General Library (No Site)</option>
              {jobSites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Category <span className="text-error">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              disabled={uploading}
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
            >
              <option value="blueprint">Blueprint / Site Plan</option>
              <option value="kmz">KMZ / KML Map File</option>
              <option value="photo">Photo / Image</option>
              <option value="cad">CAD File (DWG/DXF)</option>
              <option value="other">Other Document</option>
            </select>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Who can view? <span className="text-error">*</span>
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as DocumentVisibility)}
              disabled={uploading}
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
            >
              <option value="all">Everyone (All Users)</option>
              <option value="supervisors">Supervisors Only</option>
              <option value="site-restricted">Site-Restricted (Assigned Users Only)</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              {visibility === "all" && "All employees and supervisors can view this document"}
              {visibility === "supervisors" && "Only supervisors can view this document"}
              {visibility === "site-restricted" && "Only users assigned to the job site can view this document"}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
              rows={3}
              placeholder="Add notes about this document..."
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-orange-500 focus:outline-none resize-none"
            />
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Uploading...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-orange-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 rounded-b-2xl flex gap-3">
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={uploading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            loading={uploading}
            className="flex-1"
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  );
}
