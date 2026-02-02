"use client";

interface ConfirmationModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Branded confirmation modal matching template design system.
 * Use instead of native confirm() for consistent UX.
 */
export function ConfirmationModal({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const confirmClass =
    variant === "danger"
      ? "bg-danger hover:bg-danger/90 text-white"
      : "btn-primary";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-jet/50 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div
        className="bg-porcelain rounded-xl border border-gold-200/50 shadow-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="confirm-title"
          className="text-lg font-semibold text-jet mb-2"
        >
          {title}
        </h2>
        <p
          id="confirm-message"
          className="text-jet/70 text-sm mb-6 whitespace-pre-line"
        >
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-jet/10 text-jet hover:bg-jet/20 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
