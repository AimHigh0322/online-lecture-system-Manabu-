import React, { type ReactNode } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  isLoading?: boolean;
  children?: ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "確認",
  cancelText = "キャンセル",
  confirmButtonClass = "bg-slate-600 hover:bg-slate-700",
  isLoading = false,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h3 className="text-2xl font-bold text-slate-800 mb-4">{title}</h3>
        <div className="text-slate-600 mb-6">{message}</div>
        {children}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-slate-300 hover:bg-slate-400 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-6 py-3 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonClass}`}
          >
            {isLoading ? "処理中..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
