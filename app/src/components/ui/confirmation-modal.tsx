import React, { useState } from "react";

/**
 * ConfirmationModal Component
 * Reusable confirmation dialog for rollback and critical actions
 */
interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger" | "warning";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: "bg-primary-600 hover:bg-primary-700",
  danger: "bg-error-600 hover:bg-error-700",
  warning: "bg-warning-600 hover:bg-warning-700",
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState(loading);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onCancel}
        role="presentation"
      />

      {/* Modal */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-lg border border-neutral-700 bg-neutral-900 shadow-2xl ${className}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <div className="p-6">
          <h2
            id="modal-title"
            className="text-lg font-semibold text-neutral-100 mb-2"
          >
            {title}
          </h2>
          <p id="modal-description" className="text-sm text-neutral-400 mb-4">
            {message}
          </p>
          {description && (
            <p className="text-xs text-neutral-500 mb-6 p-3 rounded bg-neutral-800/50 border border-neutral-700">
              {description}
            </p>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 ${variantClasses[variant]}`}
            >
              {isLoading ? "Processing..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
