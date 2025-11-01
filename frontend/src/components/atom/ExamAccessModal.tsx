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
    <div className="fixed inset-0 bg-black/50 bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-800 flex items-center">
            {examEligible ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                試験準備完了
              </>
            ) : (
              <>
                <AlertCircle className="w-6 h-6 text-orange-600 mr-3" />
                コース進捗確認
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
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
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-8 h-8 text-orange-600 mr-4" />
                <div>
                  <h4 className="text-lg font-semibold text-orange-800 mb-2">
                    コース未完了
                  </h4>
                  <p className="text-orange-700">
                    試験を受けるには、すべてのコースを100%完了させる必要があります。
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-lg font-semibold text-gray-800 mb-3">
                コース進捗状況
              </h5>
              <div className="space-y-2">
                {courses.map((course) => (
                  <div
                    key={course.courseId}
                    className={`p-3 border rounded-lg ${
                      course.completionRate === 100
                        ? "bg-green-50 border-green-200"
                        : "bg-orange-50 border-orange-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">
                        {course.courseName}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          {course.completionRate}%
                        </span>
                        {course.completionRate === 100 ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          course.completionRate === 100
                            ? "bg-green-500"
                            : "bg-orange-500"
                        }`}
                        style={{ width: `${course.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <BookOpen className="w-6 h-6 text-blue-600 mr-3" />
                <div>
                  <h5 className="text-md font-semibold text-blue-800 mb-1">
                    次のステップ
                  </h5>
                  <p className="text-blue-700 text-sm">
                    未完了のコースを選択して学習を続け、すべてのコースを100%完了させてください。
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={onGoToCourses}
                className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                <BookOpen className="w-4 h-4 mr-2" />
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
