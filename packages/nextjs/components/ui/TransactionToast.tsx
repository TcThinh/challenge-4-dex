"use client";

import { useState, useEffect, useCallback } from "react";

interface TransactionToastProps {
  txHash?: string;
  type: "success" | "error" | "pending";
  message: string;
  onClose: () => void;
}

export const TransactionToast = ({
  txHash,
  type,
  message,
  onClose,
}: TransactionToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (type === "success" || type === "error") {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "pending":
        return "⏳";
      default:
        return "📝";
    }
  };

  const getAlertClass = () => {
    switch (type) {
      case "success":
        return "alert-success";
      case "error":
        return "alert-error";
      case "pending":
        return "alert-info";
      default:
        return "alert-info";
    }
  };

  return (
    <div className="toast toast-top toast-end z-50">
      <div className={`alert ${getAlertClass()} shadow-lg min-w-80`}>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getIcon()}</span>
            <div>
              <div className="font-semibold">{message}</div>
              {txHash && (
                <div className="text-xs opacity-70">
                  <a
                    href={`https://sepolia.starkscan.co/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link"
                  >
                    View on Starkscan
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
        <button className="btn btn-sm btn-ghost" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
};

interface ToastManagerProps {
  children: React.ReactNode;
}

export const ToastManager = ({ children }: ToastManagerProps) => {
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      txHash?: string;
      type: "success" | "error" | "pending";
      message: string;
    }>
  >([]);

  const addToast = useCallback((toast: Omit<(typeof toasts)[0], "id">) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Expose addToast globally for easy use
  useEffect(() => {
    (window as any).addToast = addToast;
    return () => {
      delete (window as any).addToast;
    };
  }, [addToast]);

  return (
    <>
      {children}
      {toasts.map((toast) => (
        <TransactionToast
          key={toast.id}
          txHash={toast.txHash}
          type={toast.type}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
};
