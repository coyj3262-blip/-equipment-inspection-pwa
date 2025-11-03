/**
 * Documents Page
 *
 * Document library with tabs for job site documents and general library
 */

import { useState, useEffect } from "react";
import { getDocuments } from "../services/documents";
import { useUserRole } from "../hooks/useUserRole";
import { useToast } from "../hooks/useToast";
import DocumentList from "../components/documents/DocumentList";
import DocumentUploadModal from "../components/documents/DocumentUploadModal";
import Header from "../components/ui/Header";
import Button from "../components/ui/Button";
import type { Document } from "../types/documents";

export default function Documents() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"site" | "general">("site");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { isSupervisor } = useUserRole();

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load documents:", err);
      toast.error("Failed to load documents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // Filter documents by tab
  const siteDocuments = documents.filter((doc) => doc.siteId !== null);
  const generalDocuments = documents.filter((doc) => doc.siteId === null);

  const currentDocuments = activeTab === "site" ? siteDocuments : generalDocuments;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header
        title="Documents"
        subtitle="Job site blueprints, KMZ files, and shared documents"
      />

      <div className="mx-auto max-w-6xl p-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("site")}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "site"
                ? "bg-white text-orange-600 border-2 border-orange-200 shadow-sm"
                : "bg-white/50 text-slate-600 border-2 border-transparent hover:bg-white/80"
            }`}
          >
            ðŸ“ Job Site Documents
            {siteDocuments.length > 0 && (
              <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                {siteDocuments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("general")}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "general"
                ? "bg-white text-orange-600 border-2 border-orange-200 shadow-sm"
                : "bg-white/50 text-slate-600 border-2 border-transparent hover:bg-white/80"
            }`}
          >
            ðŸ“š General Library
            {generalDocuments.length > 0 && (
              <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                {generalDocuments.length}
              </span>
            )}
          </button>
        </div>

        {/* Upload Button (Supervisors Only) */}
        {isSupervisor && (
          <div className="mb-4">
            <Button
              onClick={() => setShowUploadModal(true)}
              className="w-full"
              size="lg"
            >
              ðŸ“¤ Upload Document
            </Button>
          </div>
        )}

        {/* Document List */}
        <DocumentList
          documents={currentDocuments}
          loading={loading}
          onRefresh={loadDocuments}
          onDeleted={loadDocuments}
          showSiteName={activeTab === "site"}
        />
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <DocumentUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={loadDocuments}
          defaultSiteId={activeTab === "site" ? undefined : null}
        />
      )}
    </div>
  );
}

