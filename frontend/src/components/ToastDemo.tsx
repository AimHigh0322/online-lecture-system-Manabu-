import React from "react";
import { useToast } from "../hooks/useToast";

export const ToastDemo: React.FC = () => {
  const { showToast } = useToast();

  const showSuccessToast = () => {
    showToast({
      type: "success",
      title: "成功しました！",
      message: "操作が正常に完了しました。",
      duration: 4000,
    });
  };

  const showErrorToast = () => {
    showToast({
      type: "error",
      title: "エラーが発生しました",
      message: "何か問題が発生しました。もう一度お試しください。",
      duration: 6000,
    });
  };

  const showWarningToast = () => {
    showToast({
      type: "warning",
      title: "注意が必要です",
      message: "この操作には注意が必要です。",
      duration: 5000,
    });
  };

  const showInfoToast = () => {
    showToast({
      type: "info",
      title: "お知らせ",
      message: "新しい機能が利用可能になりました。",
      duration: 4000,
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Toast通知デモ</h3>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={showSuccessToast}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          成功トースト
        </button>
        <button
          onClick={showErrorToast}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          エラートースト
        </button>
        <button
          onClick={showWarningToast}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
        >
          警告トースト
        </button>
        <button
          onClick={showInfoToast}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          情報トースト
        </button>
      </div>
    </div>
  );
};

export default ToastDemo;
