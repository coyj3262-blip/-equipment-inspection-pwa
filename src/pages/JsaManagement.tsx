import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Header from "../components/ui/Header";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useToast } from "../hooks/useToast";
import { useJsaData } from "../hooks/useJsa";
import { archiveJsa, createJsa, updateJsa, type Jsa, type SopDocument } from "../services/jsa";
import { deleteSopDocument, uploadSopDocument } from "../services/sopDocuments";
import { useJobSiteFilter } from "../context/JobSiteFilterContext";

function toDateInputValue(date = new Date()) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
}

function formatFileSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

type JsaFormState = {
  title: string;
  jobLocation: string;
  hazards: string;
  controls: string;
  ppe: string;
  siteId: string;
  siteName: string;
  effectiveDate: string;
  sopDocs: SopDocument[];
};

const INITIAL_FORM: JsaFormState = {
  title: "",
  jobLocation: "",
  hazards: "",
  controls: "",
  ppe: "",
  siteId: "",
  siteName: "",
  effectiveDate: toDateInputValue(),
  sopDocs: [],
};

export default function JsaManagement() {
  const toast = useToast();
  const { selectedSiteId, setSelectedSiteId, availableSites, isRestricted } = useJobSiteFilter();
  const { activeJsas, recentArchivedJsas, signaturesByJsa, loading: jsasLoading, stats: jsaStats } = useJsaData(selectedSiteId);
  const [jsaForm, setJsaForm] = useState<JsaFormState>(INITIAL_FORM);
  const [savingJsa, setSavingJsa] = useState(false);
  const [editingJsaId, setEditingJsaId] = useState<string | null>(null);
  const [closingJsaId, setClosingJsaId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [activeTab, setActiveTab] = useState<"create" | "active">("active");
  const [activeFilter, setActiveFilter] = useState<"all" | "today" | "pending">("today");
  const [uploadingSopDoc, setUploadingSopDoc] = useState(false);
  const [removingSopDocId, setRemovingSopDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [baselineSopDocs, setBaselineSopDocs] = useState<SopDocument[]>([]);
  const [pendingDeleteDocs, setPendingDeleteDocs] = useState<SopDocument[]>([]);
  const [confirmRemoveSopDoc, setConfirmRemoveSopDoc] = useState<SopDocument | null>(null);
  const [confirmArchiveJsa, setConfirmArchiveJsa] = useState<Jsa | null>(null);

  const resetForm = () => {
    setEditingJsaId(null);
    setJsaForm({ ...INITIAL_FORM, effectiveDate: toDateInputValue(), sopDocs: [] });
    setCurrentStep(1);
    setUploadingSopDoc(false);
    setRemovingSopDocId(null);
    setBaselineSopDocs([]);
    setPendingDeleteDocs([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isEditing = Boolean(editingJsaId);

  // Wizard validation functions
  const validateStep1 = (): boolean => {
    if (!jsaForm.title.trim()) {
      toast.warning("Please enter a title before continuing.");
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!jsaForm.hazards.trim() || !jsaForm.controls.trim()) {
      toast.warning("Please enter both hazards and controls before continuing.");
      return false;
    }
    return true;
  };

  // Wizard navigation handlers
  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3);
  };

  async function handleSopDocSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (15MB max for SOP documents)
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size exceeds 15MB limit");
      event.target.value = "";
      return;
    }

    setUploadingSopDoc(true);
    try {
      const uploaded = await uploadSopDocument(file);
      setJsaForm(prev => ({ ...prev, sopDocs: [...prev.sopDocs, uploaded] }));
      toast.success("SOP document attached.");
    } catch (error) {
      console.error("Failed to upload SOP document", error);
      const message = error instanceof Error ? error.message : "Unable to upload document. Try again.";
      toast.error(message);
    } finally {
      setUploadingSopDoc(false);
      event.target.value = "";
    }
  }

  async function performRemoveSopDoc(doc: SopDocument) {
    const existedBefore = baselineSopDocs.some(item => item.id === doc.id);
    setRemovingSopDocId(doc.id);
    setJsaForm(prev => ({ ...prev, sopDocs: prev.sopDocs.filter(item => item.id !== doc.id) }));

    if (existedBefore) {
      setPendingDeleteDocs(prev => (prev.some(item => item.id === doc.id) ? prev : [...prev, doc]));
      toast.success("Document removed. Save to finalize.");
      setRemovingSopDocId(null);
      return;
    }

    try {
      await deleteSopDocument(doc.storagePath);
      toast.success("Document removed.");
    } catch (error) {
      console.error("Failed to remove SOP document", error);
      setJsaForm(prev => ({ ...prev, sopDocs: [...prev.sopDocs, doc] }));
      const message = error instanceof Error ? error.message : "Unable to remove document.";
      toast.error(message);
    } finally {
      setRemovingSopDocId(null);
    }
  }

  async function handleSubmitJsa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!jsaForm.title.trim() || !jsaForm.hazards.trim() || !jsaForm.controls.trim()) {
      toast.warning("Add a title, hazards, and controls before saving.");
      return;
    }

    if (uploadingSopDoc) {
      toast.warning("Wait for the SOP upload to finish before saving.");
      return;
    }

    const payload = {
      title: jsaForm.title,
      jobLocation: jsaForm.jobLocation,
      hazards: jsaForm.hazards,
      controls: jsaForm.controls,
      ppe: jsaForm.ppe,
      siteId: jsaForm.siteId || undefined,
      siteName: jsaForm.siteName || undefined,
      effectiveDate: jsaForm.effectiveDate,
      sopDocs: jsaForm.sopDocs,
    };

    setSavingJsa(true);
    try {
      if (isEditing && editingJsaId) {
        await updateJsa({ id: editingJsaId, ...payload });
        if (pendingDeleteDocs.length > 0) {
          const results = await Promise.allSettled(pendingDeleteDocs.map(doc => deleteSopDocument(doc.storagePath)));
          const hasFailure = results.some(result => result.status === "rejected");
          if (hasFailure) {
            toast.error("Saved, but some SOP files could not be removed from storage.");
          }
          setPendingDeleteDocs([]);
        }
        toast.success("JSA updated.");
      } else {
        await createJsa(payload);
        toast.success("Job Safety Analysis created.");
      }
      resetForm();
      setActiveTab("active"); // Switch to active tab after saving
    } catch (error) {
      console.error("Failed to save JSA", error);
      toast.error(error instanceof Error ? error.message : "Could not save the JSA. Try again.");
    } finally {
      setSavingJsa(false);
    }
  }

  function startEditing(jsa: Jsa) {
    setEditingJsaId(jsa.id);
    setBaselineSopDocs(jsa.sopDocs ? [...jsa.sopDocs] : []);
    setPendingDeleteDocs([]);
    setJsaForm({
      title: jsa.title,
      jobLocation: jsa.jobLocation ?? "",
      hazards: jsa.hazards,
      controls: jsa.controls,
      ppe: jsa.ppe ?? "",
      siteId: jsa.siteId ?? "",
      siteName: jsa.siteName ?? "",
      effectiveDate: jsa.effectiveDate ?? toDateInputValue(new Date(jsa.createdAt)),
      sopDocs: jsa.sopDocs ? [...jsa.sopDocs] : [],
    });
    setCurrentStep(1);
    setActiveTab("create"); // Switch to create tab for editing
  }

  async function performArchive(jsa: Jsa) {
    setClosingJsaId(jsa.id);
    try {
      await archiveJsa(jsa.id);
      toast.success("JSA closed.");
      if (editingJsaId === jsa.id) {
        resetForm();
      }
    } catch (error) {
      console.error("Failed to close JSA", error);
      toast.error(error instanceof Error ? error.message : "Unable to close the JSA. Try again.");
    } finally {
      setClosingJsaId(null);
    }
  }

  // Client-side filtering and sorting for Active JSAs
  const todayDateString = toDateInputValue();
  const filteredActiveJsas = useMemo(() => {
    let filtered: Jsa[];

    switch (activeFilter) {
      case "today":
        filtered = activeJsas.filter(jsa => jsa.effectiveDate === todayDateString);
        break;
      case "pending":
        filtered = activeJsas.filter(jsa => {
          const signatureCount = signaturesByJsa[jsa.id] ? Object.keys(signaturesByJsa[jsa.id]).length : 0;
          return signatureCount === 0;
        });
        break;
      case "all":
      default:
        filtered = [...activeJsas];
        break;
    }

    // Sort: Today's JSAs first, then by effective date (newest first), then by created date
    return filtered.sort((a, b) => {
      const aIsToday = a.effectiveDate === todayDateString;
      const bIsToday = b.effectiveDate === todayDateString;

      // Today's JSAs come first
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;

      // If both are today or both are not today, sort by effective date (newest first)
      const aDate = a.effectiveDate ? new Date(a.effectiveDate).getTime() : 0;
      const bDate = b.effectiveDate ? new Date(b.effectiveDate).getTime() : 0;
      if (bDate !== aDate) return bDate - aDate;

      // If effective dates are the same, sort by creation time (newest first)
      return b.createdAt - a.createdAt;
    });
  }, [activeFilter, activeJsas, signaturesByJsa, todayDateString]);

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header title="JSA Management" subtitle="Create and manage Job Safety Analyses" />

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Job Site Filter */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100">
              <span className="text-xl">ðŸ“</span>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">
                {isRestricted ? "Your Assigned Job Site" : "Filter by Job Site"}
              </label>
              <select
                value={selectedSiteId || ""}
                onChange={(e) => setSelectedSiteId(e.target.value || null)}
                disabled={isRestricted}
                className={`w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm font-semibold transition-all ${
                  isRestricted
                    ? "bg-slate-50 text-slate-500 cursor-not-allowed"
                    : "bg-white text-slate-900 hover:border-orange-400 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
                }`}
              >
                {!isRestricted && <option value="">All Job Sites</option>}
                {availableSites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
              {isRestricted && (
                <p className="text-xs text-slate-500 mt-1">
                  You can only view JSAs for this job site
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-sm border border-slate-200">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
              activeTab === "active"
                ? "bg-orange-500 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Active JSAs ({jsaStats.active})
          </button>
          <button
            onClick={() => {
              setActiveTab("create");
              if (editingJsaId) resetForm();
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
              activeTab === "create"
                ? "bg-orange-500 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {isEditing ? "Edit JSA" : "Create New"}
          </button>
        </div>

        {/* Create/Edit Tab Content */}
        {activeTab === "create" && (
          <section className="rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <header className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{isEditing ? "Edit Job Safety Analysis" : "Create Job Safety Analysis"}</h2>
                <p className="text-xs text-slate-500">
                  {isEditing ? "Update the details below and save." : "Draft a quick JSA for operators to review and sign before work begins."}
                </p>
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab("active");
                  }}
                  className="text-xs font-semibold text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
                >
                  Cancel edit
                </button>
              )}
            </header>

            {/* Step Indicator */}
            <div className="mb-6 flex items-center justify-center gap-2" aria-label={`Progress: Step ${currentStep} of 3`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${currentStep >= 1 ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                {currentStep > 1 ? "âœ“" : "1"}
              </div>
              <div className={`h-1 w-12 ${currentStep >= 2 ? "bg-orange-500" : "bg-slate-200"}`}></div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${currentStep >= 2 ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                {currentStep > 2 ? "âœ“" : "2"}
              </div>
              <div className={`h-1 w-12 ${currentStep >= 3 ? "bg-orange-500" : "bg-slate-200"}`}></div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${currentStep >= 3 ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                3
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmitJsa}>
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900">Step 1: Basic Information</h3>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Title *</label>
                    <input
                      value={jsaForm.title}
                      onChange={event => setJsaForm(prev => ({ ...prev, title: event.target.value }))}
                      className="mt-1 w-full rounded-xl border-2 border-slate-200 p-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
                      placeholder="e.g. Excavation near utilities"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Location / Job</label>
                    <input
                      value={jsaForm.jobLocation}
                      onChange={event => setJsaForm(prev => ({ ...prev, jobLocation: event.target.value }))}
                      className="mt-1 w-full rounded-xl border-2 border-slate-200 p-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
                      placeholder="e.g. North pit, shift B"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Effective Date</label>
                    <input
                      type="date"
                      value={jsaForm.effectiveDate}
                      onChange={event => setJsaForm(prev => ({ ...prev, effectiveDate: event.target.value }))}
                      className="mt-1 w-full rounded-xl border-2 border-slate-200 p-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={savingJsa}
                      className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:opacity-60"
                    >
                      Next â†’
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Hazards & Controls */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900">Step 2: Hazards & Controls</h3>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Key Hazards *</label>
                    <textarea
                      value={jsaForm.hazards}
                      onChange={event => setJsaForm(prev => ({ ...prev, hazards: event.target.value }))}
                      rows={3}
                      className="mt-1 w-full rounded-xl border-2 border-slate-200 p-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
                      placeholder="List hazards or steps"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Controls & Safe Steps *</label>
                    <textarea
                      value={jsaForm.controls}
                      onChange={event => setJsaForm(prev => ({ ...prev, controls: event.target.value }))}
                      rows={3}
                      className="mt-1 w-full rounded-xl border-2 border-slate-200 p-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
                      placeholder="Document controls, permits, or reminders"
                    />
                  </div>
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={savingJsa}
                      className="inline-flex items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:opacity-60"
                    >
                      â† Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={savingJsa}
                      className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:opacity-60"
                    >
                      Next â†’
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: PPE & Publish */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <h3 className="text-base font-bold text-slate-900">Step 3: PPE & Publish</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Required PPE</label>
                      <input
                        value={jsaForm.ppe}
                        onChange={event => setJsaForm(prev => ({ ...prev, ppe: event.target.value }))}
                        className="mt-1 w-full rounded-xl border-2 border-slate-200 p-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
                        placeholder="e.g. Hard hat, high-vis, gloves"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Attach SOP / Reference Docs</label>
                      <p className="text-xs text-slate-500">Upload optional SOPs, permits, or maps so crews have everything in one place.</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={savingJsa || uploadingSopDoc}
                          className="inline-flex items-center justify-center rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy-200 disabled:opacity-60"
                        >
                          + Upload document
                        </button>
                        {uploadingSopDoc && <span className="text-xs text-slate-500">Uploading...</span>}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.ppt,.pptx"
                        onChange={handleSopDocSelected}
                      />
                      {jsaForm.sopDocs.length > 0 ? (
                        <ul className="mt-3 space-y-2">
                          {jsaForm.sopDocs.map(doc => (
                            <li
                              key={doc.id}
                              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{doc.name}</p>
                                <p className="text-xs text-slate-500">
                                  Added {new Date(doc.uploadedAt).toLocaleString()}
                                  {doc.fileSize ? ` Â· ${formatFileSize(doc.fileSize)}` : ""}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-orange-400 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
                                >
                                  View
                                </a>
                                <button
                                  type="button"
                                  onClick={() => setConfirmRemoveSopDoc(doc)}
                                  disabled={savingJsa || removingSopDocId === doc.id}
                                  className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:opacity-60"
                                >
                                  {removingSopDocId === doc.id ? "Removing..." : "Remove"}
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-xs text-slate-500">No SOP docs yet. Attach standard operating procedures, permits, or site maps for this job.</p>
                      )}
                    </div>
                  </div>

                  {/* Summary Section */}
                  <div className="rounded-xl bg-slate-50 p-4 border-2 border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-3">Review Summary</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-semibold text-slate-700">Title:</span>
                        <p className="text-slate-900 mt-1">{jsaForm.title || <span className="italic text-slate-400">Not provided</span>}</p>
                      </div>
                      {jsaForm.jobLocation && (
                        <div>
                          <span className="font-semibold text-slate-700">Location:</span>
                          <p className="text-slate-900 mt-1">{jsaForm.jobLocation}</p>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-slate-700">Effective Date:</span>
                        <p className="text-slate-900 mt-1">{new Date(jsaForm.effectiveDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Hazards:</span>
                        <p className="text-slate-900 mt-1 whitespace-pre-wrap">{jsaForm.hazards || <span className="italic text-slate-400">Not provided</span>}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Controls:</span>
                        <p className="text-slate-900 mt-1 whitespace-pre-wrap">{jsaForm.controls || <span className="italic text-slate-400">Not provided</span>}</p>
                      </div>
                      {jsaForm.sopDocs.length > 0 && (
                        <div>
                          <span className="font-semibold text-slate-700">Attachments:</span>
                          <p className="text-slate-900 mt-1 text-sm">{jsaForm.sopDocs.length} linked</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={savingJsa}
                      className="inline-flex items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:opacity-60"
                    >
                      â† Back
                    </button>
                    <button
                      type="submit"
                      disabled={savingJsa || uploadingSopDoc || removingSopDocId !== null}
                      className={`inline-flex items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${(savingJsa || uploadingSopDoc || removingSopDocId !== null) ? "opacity-60" : "hover:bg-orange-600"}`}
                    >
                      {savingJsa ? (isEditing ? "Saving..." : "Publishing...") : (isEditing ? "Save changes" : "Publish JSA")}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </section>
        )}

        {/* Active JSAs Tab Content */}
        {activeTab === "active" && (
          <div className="space-y-6">
            <section className="rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
              <header className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Active JSAs</h2>
                  <p className="text-xs text-slate-500">Share with crews and monitor acknowledgements.</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div><span className="font-semibold text-slate-700">{filteredActiveJsas.length}</span> shown</div>
                  <div><span className="font-semibold text-slate-700">{jsaStats.active}</span> total</div>
                </div>
              </header>

              {/* Filter Chips */}
              <div className="mb-4 flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    activeFilter === "all"
                      ? "bg-orange-500 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("today")}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    activeFilter === "today"
                      ? "bg-orange-500 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("pending")}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    activeFilter === "pending"
                      ? "bg-orange-500 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Pending Signatures
                </button>
              </div>

              {jsasLoading ? (
                <div className="space-y-3">
                  <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                </div>
              ) : filteredActiveJsas.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
                  {activeFilter === "all"
                    ? "No active JSAs. Create a new one above when crews start their day."
                    : "No JSAs match this filter."}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredActiveJsas.map(jsa => {
                  const signatureCount = signaturesByJsa[jsa.id] ? Object.keys(signaturesByJsa[jsa.id]).length : 0;
                  const effectiveLabel = jsa.effectiveDate ? new Date(jsa.effectiveDate).toLocaleDateString() : new Date(jsa.createdAt).toLocaleDateString();
                  return (
                    <div
                      key={jsa.id}
                      className="rounded-2xl border border-slate-200 p-4 shadow-sm bg-slate-50/60"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">{jsa.title}</h3>
                          <p className="text-xs text-slate-500">Effective {effectiveLabel}</p>
                          {jsa.jobLocation && <p className="text-xs text-slate-500">{jsa.jobLocation}</p>}
                        </div>
                        <div className="text-right text-xs text-slate-500 space-y-1">
                          <p className="font-semibold text-slate-700">{signatureCount} signed</p>
                          <Link to={`/jsa/${jsa.id}`} className="text-orange-500 font-semibold hover:underline">View</Link>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-white/80 p-3">
                          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Hazards</h4>
                          <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{jsa.hazards}</p>
                        </div>
                        <div className="rounded-xl bg-white/80 p-3">
                          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Controls</h4>
                          <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{jsa.controls}</p>
                        </div>
                      </div>
                      {jsa.ppe && (
                        <div className="mt-3 rounded-xl bg-white/80 p-3">
                          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Required PPE</h4>
                          <p className="mt-1 text-sm text-slate-700">{jsa.ppe}</p>
                        </div>
                      )}
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => startEditing(jsa)}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-orange-300 hover:text-orange-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmArchiveJsa(jsa)}
                          disabled={closingJsaId === jsa.id}
                          className={`rounded-xl border border-transparent px-4 py-2 text-xs font-semibold text-white transition ${closingJsaId === jsa.id ? "bg-slate-400" : "bg-slate-800 hover:bg-slate-900"}`}
                        >
                          {closingJsaId === jsa.id ? "Closing..." : "Close JSA"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </section>

            {/* Recent Closed JSAs Section */}
            <section className="rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
              <header className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Recent Closed JSAs</h2>
                  <p className="text-xs text-slate-500">The last 7 days of archived JSAs remain accessible for audits.</p>
                </div>
                <div className="text-xs text-slate-500 font-semibold">{recentArchivedJsas.length}</div>
              </header>
              {jsasLoading ? (
                <div className="space-y-3">
                  <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                </div>
              ) : recentArchivedJsas.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
                  No JSAs have been closed in the last 7 days.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentArchivedJsas.map(jsa => {
                    const closedAt = jsa.archivedAt ?? jsa.updatedAt ?? jsa.createdAt;
                    const effectiveLabel = jsa.effectiveDate ? new Date(jsa.effectiveDate).toLocaleDateString() : new Date(jsa.createdAt).toLocaleDateString();
                    return (
                      <div key={jsa.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900">{jsa.title}</h3>
                            <p className="text-xs text-slate-500">Effective {effectiveLabel}</p>
                            <p className="text-xs text-slate-500">Closed {new Date(closedAt).toLocaleString()}</p>
                            {jsa.jobLocation && <p className="text-xs text-slate-500">{jsa.jobLocation}</p>}
                          </div>
                          <Link to={`/jsa/${jsa.id}`} className="self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-orange-300 hover:text-orange-500">
                            View record
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Confirm Remove SOP Document */}
      {confirmRemoveSopDoc && (
        <ConfirmDialog
          isOpen={true}
          title="Remove Document?"
          message={`Remove "${confirmRemoveSopDoc.name}" from this JSA?`}
          confirmLabel="Remove"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={() => {
            performRemoveSopDoc(confirmRemoveSopDoc);
            setConfirmRemoveSopDoc(null);
          }}
          onCancel={() => setConfirmRemoveSopDoc(null)}
        />
      )}

      {/* Confirm Archive JSA */}
      {confirmArchiveJsa && (
        <ConfirmDialog
          isOpen={true}
          title="Close JSA?"
          message={`Close "${confirmArchiveJsa.title}"? Operators will no longer be able to sign it.`}
          confirmLabel="Close JSA"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={() => {
            performArchive(confirmArchiveJsa);
            setConfirmArchiveJsa(null);
          }}
          onCancel={() => setConfirmArchiveJsa(null)}
        />
      )}
    </div>
  );
}

