import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ref, onValue, set, remove } from "firebase/database";
import { rtdb } from "../firebase";
import { path } from "../backend.paths";
import Header from "../components/ui/Header";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Button from "../components/ui/Button";
import { CheckIcon } from "../components/icons";
import { uploadSopDocument, deleteSopDocument } from "../services/sopDocuments";
import { getSopAcknowledgments } from "../services/sopAcknowledgment";
import { useToast } from "../hooks/useToast";
import { useUserRole } from "../hooks/useUserRole";
import { useAuth } from "../context/AuthContext";
import type { SopDocument } from "../services/jsa";

type Sop = {
  id: string;
  title: string;
  description?: string;
  category: "safety" | "equipment" | "environmental" | "operations" | "general";
  equipmentTypes?: string[]; // Required for which equipment types
  documents: SopDocument[];
  createdAt: number;
  createdBy: string;
  requiresAcknowledgment: boolean;
};

export default function SopLibrary() {
  const toast = useToast();
  const { user } = useAuth();
  const { isSupervisor, loading: loadingRole } = useUserRole();
  const [sops, setSops] = useState<Sop[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [acknowledgments, setAcknowledgments] = useState<Record<string, number>>({});

  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    category: "general" as Sop["category"],
    equipmentTypes: [] as string[],
    requiresAcknowledgment: true,
  });

  useEffect(() => {
    const sopsRef = ref(rtdb, path("sops"));
    const unsubscribe = onValue(sopsRef, async (snapshot) => {
      try {
        const data = snapshot.val();
        if (!data) {
          setSops([]);
          setLoading(false);
          return;
        }

        const sopList: Sop[] = Object.entries(data).map(([id, sop]) => ({
          id,
          ...(sop as Omit<Sop, "id">),
        }));

        sopList.sort((a, b) => b.createdAt - a.createdAt);
        setSops(sopList);

        // Load acknowledgment counts with error handling
        const ackCounts: Record<string, number> = {};
        try {
          for (const sop of sopList) {
            const acks = await getSopAcknowledgments(sop.id);
            ackCounts[sop.id] = acks.length;
          }
          setAcknowledgments(ackCounts);
        } catch (error) {
          console.error("Failed to load acknowledgments:", error);
          // Continue loading SOPs even if acknowledgments fail
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to load SOPs:", error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const file = files[0];

    if (!uploadForm.title.trim()) {
      toast.warning("Please enter a title for the SOP");
      return;
    }

    // Check file size (15MB max)
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size exceeds 15MB limit");
      e.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const uploadedDoc = await uploadSopDocument(file);

      const newSop: Omit<Sop, "id"> = {
        title: uploadForm.title.trim(),
        description: uploadForm.description.trim() || undefined,
        category: uploadForm.category,
        equipmentTypes: uploadForm.equipmentTypes.length > 0 ? uploadForm.equipmentTypes : undefined,
        documents: [uploadedDoc],
        createdAt: Date.now(),
        createdBy: user?.email || user?.uid || "unknown",
        requiresAcknowledgment: uploadForm.requiresAcknowledgment,
      };

      const sopRef = ref(rtdb, `/v2/sops/${uploadedDoc.id}`);
      await set(sopRef, newSop);

      toast.success(`${uploadForm.title} uploaded successfully!`);

      // Reset form
      setUploadForm({
        title: "",
        description: "",
        category: "general",
        equipmentTypes: [],
        requiresAcknowledgment: true,
      });
      setShowUploadForm(false);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload SOP. Please try again.");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleDelete = async (sopId: string) => {
    const sop = sops.find((s) => s.id === sopId);
    if (!sop) return;

    try {
      for (const doc of sop.documents) {
        await deleteSopDocument(doc.storagePath);
      }

      const sopRef = ref(rtdb, `/v2/sops/${sopId}`);
      await remove(sopRef);

      toast.success("SOP deleted successfully");
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete SOP");
    }
  };

  const toggleEquipmentType = (type: string) => {
    setUploadForm(prev => ({
      ...prev,
      equipmentTypes: prev.equipmentTypes.includes(type)
        ? prev.equipmentTypes.filter(t => t !== type)
        : [...prev.equipmentTypes, type]
    }));
  };

  const categories = ["all", "safety", "equipment", "environmental", "operations", "general"];
  const equipmentTypes = ["dozer", "loader", "excavator", "farm_tractor"];
  const filteredSops = filter === "all" ? sops : sops.filter((s) => s.category === filter);

  if (loading) {
    return (
      <div className="pb-20 min-h-screen bg-slate-50">
        <Header title="SOP Library" subtitle="Standard Operating Procedures" />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" message="Loading SOPs..." />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header title="SOP Library" subtitle="Standard Operating Procedures & Safe Work Instructions" />

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Supervisor Link to Acknowledgment History */}
        {!loadingRole && isSupervisor && (
          <Link
            to="/sop/history"
            className="block bg-gradient-to-r from-navy-900 to-navy-800 text-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">View Acknowledgment History</h3>
                <p className="text-sm text-navy-200">Track operator compliance and acknowledgments</p>
              </div>
              <span className="text-2xl">â†’</span>
            </div>
          </Link>
        )}

        {/* Upload Button */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {!showUploadForm ? (
            <Button
              onClick={() => setShowUploadForm(true)}
              size="md"
              className="w-full"
            >
              + Upload New SOP
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Upload New SOP</h3>
                <button
                  onClick={() => setShowUploadForm(false)}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Equipment Fueling Procedure"
                  className="w-full rounded-lg border-2 border-slate-200 p-3 text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of what this SOP covers"
                  rows={2}
                  className="w-full rounded-lg border-2 border-slate-200 p-3 text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category *
                </label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value as Sop["category"] }))}
                  className="w-full rounded-lg border-2 border-slate-200 p-3 text-sm focus:border-orange-500 focus:outline-none"
                >
                  <option value="general">General</option>
                  <option value="safety">Safety</option>
                  <option value="equipment">Equipment</option>
                  <option value="environmental">Environmental</option>
                  <option value="operations">Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Required for Equipment Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {equipmentTypes.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleEquipmentType(type)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                        uploadForm.equipmentTypes.includes(type)
                          ? "bg-orange-500 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {type.replace("_", " ")}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Operators must acknowledge this SOP before using selected equipment
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requireAck"
                  checked={uploadForm.requiresAcknowledgment}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, requiresAcknowledgment: e.target.checked }))}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <label htmlFor="requireAck" className="text-sm text-slate-700">
                  Require operator acknowledgment
                </label>
              </div>

              <div>
                <label htmlFor="sop-file-upload" className="block">
                  <input
                    id="sop-file-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.html"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <span className={`inline-flex items-center justify-center font-semibold rounded-xl transition-all focus-visible:ring-4 text-sm px-4 py-2.5 w-full cursor-pointer ${
                    uploading || !uploadForm.title.trim()
                      ? "bg-orange-500 text-white opacity-60 cursor-not-allowed"
                      : "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700"
                  }`}>
                    {uploading ? (
                      <span className="relative flex items-center gap-2">
                        <span className="inline-block w-4 h-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                        <span>Uploading...</span>
                      </span>
                    ) : (
                      "ðŸ“Ž Choose File to Upload"
                    )}
                  </span>
                </label>
                <p className="text-xs text-slate-500 mt-2">
                  Supported: PDF, Word, Images, HTML (max 15MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`
                px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap capitalize
                transition-all
                ${
                  filter === cat
                    ? "bg-orange-500 text-white shadow-lg"
                    : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* SOP List */}
        {filteredSops.length === 0 ? (
          <EmptyState
            icon={<CheckIcon size={64} className="text-slate-300" />}
            title={sops.length === 0 ? "No SOPs yet" : "No SOPs in this category"}
            description={
              sops.length === 0
                ? "Upload your first Standard Operating Procedure to get started. SOPs ensure everyone follows approved procedures."
                : `No ${filter} SOPs found. Try selecting a different category.`
            }
            action={
              sops.length === 0
                ? {
                    label: "Upload First SOP",
                    onClick: () => setShowUploadForm(true),
                  }
                : {
                    label: "Clear Filter",
                    onClick: () => setFilter("all"),
                  }
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredSops.map((sop) => (
              <div
                key={sop.id}
                className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition-all border border-slate-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900 text-lg">{sop.title}</h3>
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 capitalize">
                        {sop.category}
                      </span>
                      {sop.requiresAcknowledgment && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">
                          âœ“ Requires Ack
                        </span>
                      )}
                    </div>
                    {sop.description && (
                      <p className="text-sm text-slate-600 mb-2">{sop.description}</p>
                    )}
                    {sop.equipmentTypes && sop.equipmentTypes.length > 0 && (
                      <p className="text-xs text-slate-500 mb-2">
                        Required for: {sop.equipmentTypes.map(t => t.replace("_", " ")).join(", ")}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>{new Date(sop.createdAt).toLocaleDateString()}</span>
                      <span>â€¢</span>
                      <span>{sop.documents.length} file(s)</span>
                      {acknowledgments[sop.id] !== undefined && (
                        <>
                          <span>â€¢</span>
                          <span className="text-orange-600 font-semibold">
                            {acknowledgments[sop.id]} acknowledgments
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {sop.documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
                      >
                        ðŸ“„ View
                      </a>
                    ))}
                    <button
                      onClick={() => setDeleteConfirm(sop.id)}
                      className="px-3 py-2 rounded-lg bg-red-100 text-red-600 text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      ðŸ—‘ï¸
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          title="Delete SOP?"
          message="This will permanently delete this SOP and all associated files. Operators will no longer have access to this procedure. This cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

