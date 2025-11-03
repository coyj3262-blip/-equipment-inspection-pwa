import { useState, useEffect } from "react";
import SignaturePad from "./SignaturePad";
import Button from "./ui/Button";
import { acknowledgeSop } from "../services/sopAcknowledgment";
import { useToast } from "../hooks/useToast";

type SopDocument = {
  id: string;
  name: string;
  url: string;
  storagePath: string;
};

type Sop = {
  id: string;
  title: string;
  description?: string;
  documents: SopDocument[];
  category: string;
};

type SopAcknowledgmentModalProps = {
  sops: Sop[];
  equipmentType?: string;
  onComplete: () => void;
  onCancel?: () => void;
};

export default function SopAcknowledgmentModal({
  sops,
  equipmentType,
  onComplete,
  onCancel,
}: SopAcknowledgmentModalProps) {
  const toast = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [signature, setSignature] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentSop = sops[currentIndex];
  const isLastSop = currentIndex === sops.length - 1;

  // Reset state when SOP changes
  useEffect(() => {
    setAcknowledged(false);
    setSignature("");
    setNotes("");
  }, [currentIndex]);

  const handleSubmit = async () => {
    if (!acknowledged) {
      toast.warning("Please confirm you have read and understood the SOP");
      return;
    }

    if (!operatorName.trim()) {
      toast.warning("Please enter your name");
      return;
    }

    if (!signature) {
      toast.warning("Please sign to acknowledge");
      return;
    }

    setSubmitting(true);

    try {
      await acknowledgeSop(
        currentSop.id,
        currentSop.title,
        operatorName.trim(),
        signature,
        equipmentType,
        notes.trim() || undefined
      );

      toast.success(`${currentSop.title} acknowledged`);

      // Move to next SOP or complete
      if (isLastSop) {
        onComplete();
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error("Failed to acknowledge SOP:", error);
      toast.error("Failed to record acknowledgment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sops.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-navy-900 to-navy-800 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Required SOP Acknowledgment</h2>
              <p className="text-sm text-navy-200 mt-1">
                {sops.length > 1
                  ? `${currentIndex + 1} of ${sops.length} procedures`
                  : "Review and acknowledge to proceed"}
              </p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-white/80 hover:text-white text-2xl font-bold"
                aria-label="Close"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* SOP Info */}
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
            <h3 className="font-bold text-slate-900 text-lg">{currentSop.title}</h3>
            {currentSop.description && (
              <p className="text-sm text-slate-600 mt-1">{currentSop.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 capitalize">
                {currentSop.category}
              </span>
              {equipmentType && (
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600 capitalize">
                  {equipmentType.replace("_", " ")}
                </span>
              )}
            </div>
          </div>

          {/* Document Links */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Review Document(s) <span className="text-error">*</span>
            </label>
            <div className="space-y-2">
              {currentSop.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors group"
                >
                  <span className="text-sm font-medium text-slate-700 group-hover:text-orange-600">
                    📄 {doc.name}
                  </span>
                  <span className="text-xs text-slate-500 group-hover:text-orange-600">
                    Open →
                  </span>
                </a>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Click to open and review the procedure before acknowledging
            </p>
          </div>

          {/* Operator Name (only ask once) */}
          {currentIndex === 0 && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Your Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-lg border-2 border-slate-200 p-3 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
          )}

          {/* Acknowledgment Checkbox */}
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
            <input
              type="checkbox"
              id={`ack-${currentSop.id}`}
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
            />
            <label
              htmlFor={`ack-${currentSop.id}`}
              className="text-sm text-slate-700 cursor-pointer"
            >
              <span className="font-semibold">I confirm that I have:</span>
              <ul className="mt-1 ml-4 list-disc space-y-1">
                <li>Read and reviewed the entire procedure</li>
                <li>Understood the safety requirements and controls</li>
                <li>Agree to follow this SOP during operations</li>
              </ul>
            </label>
          </div>

          {/* Signature */}
          <SignaturePad
            onSignature={setSignature}
            label="Operator Signature *"
          />

          {/* Optional Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any questions or comments..."
              rows={3}
              className="w-full rounded-lg border-2 border-slate-200 p-3 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {onCancel && (
              <Button
                onClick={onCancel}
                variant="secondary"
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              className="flex-1"
              loading={submitting}
              disabled={submitting || !acknowledged || !signature || (currentIndex === 0 && !operatorName.trim())}
            >
              {submitting
                ? "Submitting..."
                : isLastSop
                  ? "Complete Acknowledgment"
                  : "Next Procedure →"}
            </Button>
          </div>

          {/* Progress indicator for multiple SOPs */}
          {sops.length > 1 && (
            <div className="flex gap-2 justify-center">
              {sops.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? "w-8 bg-orange-500"
                      : idx < currentIndex
                        ? "w-2 bg-green-500"
                        : "w-2 bg-slate-300"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
