import React from "react";
import { X, AlertCircle, BookOpen, CheckCircle } from "lucide-react";

interface ExamAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToCourses: () => void;
  onGoToExam: () => void;
  courses: Array<{
    courseId: string;
    courseName: string;
    completionRate: number;
    status: string;
  }>;
  examEligible: boolean;
}

export const ExamAccessModal: React.FC<ExamAccessModalProps> = ({
  isOpen,
  onClose,
  onGoToCourses,
  onGoToExam,
  courses,
  examEligible,
}) => {
  if (!isOpen) return null;

  const completedCourses = courses.filter(
    (course) => course.completionRate === 100
  );

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center">
            {examEligible ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                試験準備完了
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
                ① コース進捗確認
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {examEligible ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-4" />
                <div>
                  <h4 className="text-lg font-semibold text-green-800 mb-2">
                    試験準備完了！
                  </h4>
                  <p className="text-green-700">
                    すべてのコースが完了しました。試験を開始する準備ができています。
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-lg font-semibold text-gray-800 mb-3">
                完了したコース一覧
              </h5>
              <div className="space-y-2">
                {completedCourses.map((course) => (
                  <div
                    key={course.courseId}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <span className="font-medium text-gray-800">
                      {course.courseName}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-green-600 font-medium">
                        {course.completionRate}%
                      </span>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-blue-600 mr-3" />
                <div>
                  <h5 className="text-md font-semibold text-blue-800 mb-1">
                    試験について
                  </h5>
                  <p className="text-blue-700 text-sm">
                    試験は複数の問題形式で構成されています。時間制限はありませんが、慎重に回答してください。
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
              >
                後で受験
              </button>
              <button
                onClick={() => {
                  onClose();
                  onGoToExam();
                }}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                試験を開始する
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-base font-semibold text-orange-800 mb-1">
                    コース未完了
                  </h4>
                  <p className="text-sm text-orange-700 leading-relaxed">
                    ① 試験を受けるには、すべてのコースを100%完了させる必要があります。
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-base font-semibold text-gray-800 mb-3">
                ●コース進捗状況
              </h5>
              <div className="space-y-2.5">
                {courses.map((course) => {
                  const isNotPurchased = course.status === "not_purchased";
                  const isCompleted = course.completionRate === 100;
                  
                  return (
                    <div
                      key={course.courseId}
                      className={`p-3 border rounded-md ${
                        isCompleted
                          ? "bg-green-50 border-green-200"
                          : isNotPurchased
                          ? "bg-gray-50 border-gray-300"
                          : "bg-orange-50 border-orange-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800 flex-1">
                          {course.courseName}
                          {isNotPurchased && (
                            <span className="ml-2 text-xs text-gray-500 font-normal">
                              (未購入)
                            </span>
                          )}
                        </span>
                        <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                          {!isNotPurchased && !isCompleted && (
                            <span className="text-xs font-medium text-orange-600">
                              {course.completionRate}%
                            </span>
                          )}
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : isNotPurchased ? (
                            <AlertCircle className="w-4 h-4 text-gray-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-orange-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <BookOpen className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="text-sm font-semibold text-blue-800 mb-1">
                    次のステップ
                  </h5>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    未完了のコースを選択して学習を続け、すべてのコースを100%完了させてください。
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-200">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-md transition-colors"
              >
                閉じる
              </button>
              <button
                onClick={onGoToCourses}
                className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center"
              >
                <BookOpen className="w-4 h-4 mr-1.5" />
                コースに戻る
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamAccessModal;
