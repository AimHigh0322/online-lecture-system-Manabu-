import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, RotateCcw } from "lucide-react";

interface ExamAnswer {
  questionId: string;
  questionContent: string;
  questionType: string;
  answer: string | string[] | boolean | null;
  answeredAt: string | null;
  isCorrect: boolean;
  pointsEarned: number;
  examineeAnswered: boolean;
  correctAnswer: boolean | null;
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    order: number;
  }>;
}

interface ExamResult {
  examineeId: string;
  examineeName: string;
  examId: string;
  examType: string;
  answers: ExamAnswer[];
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  timeSpent: number;
  submittedAt: string;
  gradedAt: string;
}

export const ExamResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const examResults = location.state?.examResults as ExamResult;

  if (!examResults) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No exam results found.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  // Check if answers array exists and is valid
  if (!examResults.answers || !Array.isArray(examResults.answers)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Invalid exam results data.</p>
          <p className="text-sm text-gray-500 mt-2">
            Answers data is missing or invalid.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">試験結果</h1>
            <button
              onClick={() => navigate("/")}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
            >
              ホームに戻る
            </button>
          </div>
        </div>

        {/* Compact Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">得点</p>
                <p className="text-xl font-bold text-gray-900">
                  {examResults.score} / {examResults.totalQuestions}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">正答数</p>
                <p className="text-xl font-bold text-gray-900">
                  {examResults.score}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">結果</p>
                <p
                  className={`text-lg font-bold ${
                    examResults.passed ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {examResults.passed ? "合格" : "不合格"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">所要時間</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatTime(examResults.timeSpent)}
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                navigate("/exam-review", {
                  state: {
                    examResults: examResults,
                    reviewMode: true,
                  },
                })
              }
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>試験を再確認</span>
            </button>
          </div>
        </div>

        {/* Detailed Results - Compact Table */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">詳細結果</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    問題
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    内容
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    あなたの回答
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    正解
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    結果
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {examResults.answers.map((answer, index) => (
                  <tr key={answer.questionId} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {index + 1}
                        </span>
                        {answer.isCorrect ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm text-gray-900 max-w-md">
                        {answer.questionContent}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm text-gray-900">
                        {answer.examineeAnswered
                          ? typeof answer.answer === "boolean"
                            ? answer.answer
                              ? "正しい"
                              : "間違い"
                            : Array.isArray(answer.answer)
                            ? answer.answer.join(", ")
                            : answer.answer
                          : "未回答"}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm text-gray-900">
                        {answer.questionType === "true_false"
                          ? answer.correctAnswer
                            ? "正しい"
                            : "間違い"
                          : answer.questionType === "single_choice"
                          ? answer.options?.find((opt) => opt.isCorrect)
                              ?.text || "不明"
                          : answer.options
                              ?.filter((opt) => opt.isCorrect)
                              .map((opt) => opt.text)
                              .join(", ") || "不明"}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          answer.isCorrect
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {answer.pointsEarned}/1
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            提出日時: {formatDate(examResults.submittedAt)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExamResults;
