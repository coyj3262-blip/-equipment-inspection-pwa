import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { writeInspectionWithIndexes, logEvent, type Inspection as BackendInspection, type Answer as BackendAnswer } from "../backend.rtdb";
import { auth } from "../firebase";
import { getChecklist } from "../config/checklists";
import PhotoUpload from "./PhotoUpload";
import SignaturePad from "./SignaturePad";
import { useToast } from "../hooks/useToast";
import Button from "./ui/Button";
import Tag from "./ui/Tag";
import { saveDraft, readDraft, clearDraft } from "../services/draft";
import { useActiveSession } from "../hooks/useActiveSession";

type Equip = "dozer"|"loader"|"farm_tractor"|"excavator";
type Status = "pass" | "fail" | "na";
type DraftAnswer = { status?: Status; note?: string; photos?: string[] };

type Props = {
  equipType?: Equip;
  equipId?: string;
  hours?: string;
};

export default function ChecklistRunner({ equipType = "dozer", equipId = "TEMP", hours = "0" }: Props) {
  const nav = useNavigate();
  const toast = useToast();
  const { session } = useActiveSession();
  const [answers, setAnswers] = useState<Record<string, DraftAnswer>>({});
  const [signature, setSignature] = useState<string>("");
  const [startedAt] = useState<number>(Date.now());
  const [inspectionId] = useState<string>(() => {
    const draft = readDraft(equipType, equipId);
    return draft?.inspectionId || crypto.randomUUID();
  });
  const [duration, setDuration] = useState(0);
  const [currentCategory, setCurrentCategory] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [submitting, setSubmitting] = useState(false);

  const checklist = getChecklist(equipType);
  const categories = checklist.categories;
  const totalItems = checklist.items.length;
  const answeredCount = useMemo(() => checklist.items.filter(item => answers[item.id]?.status).length, [checklist.items, answers]);
  const categoryTotals = useMemo(() => {
    return checklist.items.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    }, {});
  }, [checklist.items]);
  const categoryAnswered = useMemo(() => {
    return checklist.items.reduce<Record<string, number>>((acc, item) => {
      if (answers[item.id]?.status) {
        acc[item.category] = (acc[item.category] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [checklist.items, answers]);

  useEffect(() => {
    const id = setInterval(() => setDuration(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const draft = readDraft(equipType, equipId);
    if (draft) {
      const restored: Record<string, DraftAnswer> = {};
      Object.entries(draft.answers ?? {}).forEach(([key, value]) => {
        restored[key] = {
          status: (value.status ?? undefined) as Status | undefined,
          note: typeof value.note === "string" ? value.note : undefined,
          photos: Array.isArray(value.photos) ? value.photos : undefined,
        };
      });
      setAnswers(restored);
      setSignature(draft.signature ?? "");
    }
  }, [equipType, equipId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSaveState("saving");
    const timeout = window.setTimeout(() => {
      saveDraft({
        equipType,
        equipmentId: equipId,
        hours: hours ?? "",
        answers,
        signature,
        savedAt: Date.now(),
        inspectionId,
      });
      setSaveState("saved");
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [answers, signature, equipType, equipId, hours, inspectionId]);

  async function handleSubmit() {
    if (submitting) return;
    const incompleteItems = checklist.items.filter(item => !answers[item.id]?.status);
    if (incompleteItems.length > 0) {
      const preview = incompleteItems.slice(0, 3).map(item => item.label).join(", ");
      toast.warning(`Mark each checklist item before submitting (${preview}${incompleteItems.length > 3 ? ", …" : ""}).`);
      return;
    }
    if (!signature) {
      toast.warning("Please add your signature before submitting.");
      return;
    }

    // User must be authenticated (enforced by AuthGuard)
    const uid = auth.currentUser?.uid;
    if (!uid) {
      toast.error("Authentication required. Please log in.");
      return;
    }

    const preparedAnswers: Record<string, BackendAnswer> = {};
    checklist.items.forEach(item => {
      const entry = answers[item.id];
      if (!entry || !entry.status) return;

      const answer: BackendAnswer = { status: entry.status };

      // Only include note if it has a value (Firebase rejects undefined)
      if (entry.note && entry.note.trim()) {
        answer.note = entry.note.trim();
      }

      // Only include photos if array has items
      if (entry.photos && entry.photos.length > 0) {
        answer.photos = entry.photos;
      }

      preparedAnswers[item.id] = answer;
    });

    const insp: BackendInspection = {
      equipmentType: equipType,
      equipmentId: equipId,
      operatorUid: uid,
      siteId: session?.siteId || "unknown",
      siteName: session?.siteName || "Unknown Site",
      state: "submitted" as const,
      startedAt,
      submittedAt: Date.now(),
      hours: parseInt(hours) || 0,
      answers: preparedAnswers,
      signature
    };

    setSubmitting(true);
    try {
      await writeInspectionWithIndexes(inspectionId, insp);
      await logEvent(inspectionId, "submit", { uid, duration });
      clearDraft(equipType, equipId);
      setSaveState("idle");
      toast.success("Inspection submitted successfully!");
      nav("/supervisor");
    } catch (err) {
      console.error("Submit failed", err);
      toast.error("Unable to submit inspection. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const currentCategoryName = categories[currentCategory] ?? "";
  const categoryItems = checklist.items.filter(item => item.category === currentCategoryName);
  const percentComplete = totalItems ? Math.round((answeredCount / totalItems) * 100) : 0;
  const reachedReview = currentCategory === categories.length;

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      {!online && (
        <div className="bg-warning text-navy-900 text-center text-sm font-semibold py-2">
          Offline — changes are saved locally
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white p-6">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold capitalize">{equipType.replace("_", " ")}</h1>
            <p className="text-xs text-navy-200">ID: {equipId} · Hours: {hours}</p>
          </div>
          <div className="text-right text-xs text-navy-200">
            <div>Elapsed {Math.floor(duration / 60)}m {duration % 60}s</div>
            <div>
              {saveState === "saving" && "Saving…"}
              {saveState === "saved" && "Saved"}
              {saveState === "idle" && <span className="opacity-0">Saved</span>}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-navy-200">
            <span>{answeredCount}/{totalItems} items complete</span>
            <span className="text-white font-semibold">{percentComplete}%</span>
          </div>
          <div className="h-2 rounded-full bg-navy-700 overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((cat, idx) => (
            <button
              key={cat}
              onClick={() => setCurrentCategory(idx)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                ${currentCategory === idx
                  ? 'bg-orange-500 text-white shadow-card'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }
              `}
            >
              <span>{cat}</span>
              <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
                {categoryAnswered[cat] ?? 0}/{categoryTotals[cat] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Items */}
      <div className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-slate-900">{currentCategoryName}</h2>

        {categoryItems.map(item => {
          const status = answers[item.id]?.status;
          return (
            <div key={item.id} className="space-y-3 rounded-card bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-slate-900">{item.label}</h3>
                    {item.photoRequired && (
                      <Tag kind="info" className="bg-blue-100 text-blue-700">
                        📷 Photo optional
                      </Tag>
                    )}
                    {status && <Tag kind={status}>{status.toUpperCase()}</Tag>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {(["pass", "fail", "na"] as const).map(v => (
                  <Button
                    key={v}
                    type="button"
                    size="sm"
                    variant={answers[item.id]?.status === v ? "primary" : "subtle"}
                    className={answers[item.id]?.status === v ? "bg-orange-500" : ""}
                    onClick={() => setAnswers(p => ({ ...p, [item.id]: { ...p[item.id], status: v } }))}
                  >
                    {v.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            <textarea
              placeholder="Notes (optional)"
              value={answers[item.id]?.note || ""}
              onChange={e => setAnswers(p => ({ ...p, [item.id]: { ...p[item.id], note: e.target.value } }))}
              className="w-full border-2 border-slate-200 p-2 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
              rows={2}
            />

            {item.photoRequired && (
              <PhotoUpload
                inspectionId={inspectionId}
                maxPhotos={5}
                onPhotosChange={(photoUrls) => setAnswers(p => ({
                  ...p,
                  [item.id]: { ...p[item.id], photos: photoUrls }
                }))}
              />
            )}
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      {!reachedReview && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-md gap-3">
            {currentCategory > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setCurrentCategory(currentCategory - 1)}
              >
                ← Previous
              </Button>
            )}
            <Button
              type="button"
              size="lg"
              className="flex-1"
              onClick={() => {
                if (currentCategory < categories.length - 1) {
                  setCurrentCategory(currentCategory + 1);
                } else {
                  setCurrentCategory(categories.length);
                }
              }}
            >
              {currentCategory < categories.length - 1 ? "Next →" : "Review & Sign →"}
            </Button>
          </div>
        </div>
      )}

      {/* Signature Page */}
      {currentCategory === categories.length && (
        <div className="fixed inset-0 bg-slate-50 z-50 overflow-auto">
          <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white p-6">
            <h1 className="text-2xl font-bold">Review & Sign</h1>
            <p className="text-navy-200 text-sm mt-1">Complete your inspection</p>
          </div>

          <div className="p-4 space-y-4 pb-24">
            <div className="bg-white rounded-card shadow-card p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Inspection Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Equipment Type:</span>
                  <span className="font-medium capitalize">{equipType.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Equipment ID:</span>
                  <span className="font-medium">{equipId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Hours:</span>
                  <span className="font-medium">{hours}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Duration:</span>
                  <span className="font-medium">{Math.floor(duration / 60)}m {duration % 60}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Items Checked:</span>
                  <span className="font-medium">{answeredCount} / {checklist.items.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-card shadow-card p-4">
              <SignaturePad onSignature={setSignature} label="Operator Signature *" />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setCurrentCategory(categories.length - 1)}
              >
                ← Back
              </Button>
              <Button
                type="button"
                size="lg"
                variant="primary"
                className="flex-1 bg-success hover:bg-green-600"
                onClick={handleSubmit}
                loading={submitting}
                disabled={submitting}
              >
                Submit Inspection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
