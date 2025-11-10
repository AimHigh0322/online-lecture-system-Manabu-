import React from "react";

interface ExamHistory {
  _id: string;
  examineeId: string;
  examineeName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  timeSpent: number;
  timeAll: number;
  submittedAt: string;
  gradedAt: string;
  status: string;
}

interface EditExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  examHistory: ExamHistory | null;
  onUpdate: (updatedData: Partial<ExamHistory>) => void;
}

export const EditExamModal: React.FC<EditExamModalProps> = ({
  isOpen,
  onClose,
  examHistory,
  onUpdate,
}) => {
  if (!isOpen || !examHistory) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedData = {
      examineeName: formData.get("examineeName") as string,
      score: parseInt(formData.get("score") as string),
      totalQuestions: parseInt(formData.get("totalQuestions") as string),
      percentage: parseInt(formData.get("percentage") as string),
      passed: formData.get("passed") === "true",
      timeSpent: parseInt(formData.get("timeSpent") as string),
      timeAll: parseInt(formData.get("timeAll") as string),
    };
    onUpdate(updatedData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">試験結果を編集</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                受験者名
              </label>
              <input
                type="text"
                name="examineeName"
                defaultValue={examHistory.examineeName}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                得点
              </label>
              <input
                type="number"
                name="score"
                defaultValue={examHistory.score}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                総問題数
              </label>
              <input
                type="number"
                name="totalQuestions"
                defaultValue={examHistory.totalQuestions}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                正解率 (%)
              </label>
              <input
                type="number"
                name="percentage"
                defaultValue={examHistory.percentage}
                min="0"
                max="100"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                合格状態
              </label>
              <select
                name="passed"
                defaultValue={examHistory.passed.toString()}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="true">合格</option>
                <option value="false">不合格</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                所要時間 (秒)
              </label>
              <input
                type="number"
                name="timeSpent"
                defaultValue={examHistory.timeSpent}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                総時間 (秒)
              </label>
              <input
                type="number"
                name="timeAll"
                defaultValue={examHistory.timeAll}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 cursor-pointer"
            >
              更新
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExamModal;
