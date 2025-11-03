import { useEffect } from "react";
import Button from "./Button";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: "text-error",
    warning: "text-orange-600",
    info: "text-blue-600",
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <h3 className={`text-xl font-bold ${variantStyles[variant]}`}>
            {title}
          </h3>
          <p className="text-slate-700 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={onCancel}
            variant="secondary"
            size="md"
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            variant="primary"
            size="md"
            className={`flex-1 ${
              variant === "danger"
                ? "bg-error hover:bg-red-600"
                : variant === "warning"
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {confirmLabel}
          </Button>
        </div>

        <p className="text-xs text-slate-400 text-center">
          Press ESC to cancel or Enter to confirm
        </p>
      </div>
    </div>
  );
}
