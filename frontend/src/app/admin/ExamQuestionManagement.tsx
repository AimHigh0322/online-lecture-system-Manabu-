import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  BookOpen,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { BossLayout } from "../../components/layout/AdminLayout";
import { ConfirmModal } from "../../components/atom/ConfirmModal";
import {
  courseOptions,
  useGetQuestionsQuery,
  useDeleteQuestionMutation,
} from "../../api";
import type { Question } from "../../api";

export const ExamQuestionManagement: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(
    null
  );

  // API hooks
  const {
    data: questionsData,
    isLoading,
    error,
    refetch,
  } = useGetQuestionsQuery({
    courseId: selectedCourse || undefined,
    type: selectedType || undefined,
  });

  const [deleteQuestion] = useDeleteQuestionMutation();

  const questionTypes = [
    { value: "true_false", label: "タイプ1: 正誤問題" },
    { value: "single_choice", label: "タイプ2: 単一選択" },
    { value: "multiple_choice", label: "タイプ3: 複数選択" },
  ];

  // Filter questions based on search term and filters
  const filteredQuestions = (questionsData?.questions || []).filter(
    (question) => {
      const matchesSearch =
        question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.content.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    }
  );

  const handleDelete = (question: Question) => {
    setQuestionToDelete(question);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!questionToDelete) return;

    try {
      await deleteQuestion(questionToDelete._id).unwrap();
      showToast({
        type: "success",
        title: "削除完了",
        message: `問題「${questionToDelete.title}」を削除しました`,
      });
      setShowDeleteModal(false);
      setQuestionToDelete(null);
      refetch();
    } catch {
      showToast({
        type: "error",
        title: "削除エラー",
        message: "問題の削除に失敗しました",
      });
    }
  };

  const getTypeLabel = (type: string) => {
    const typeInfo = questionTypes.find((t) => t.value === type);
    return typeInfo ? typeInfo.label : type;
  };

  if (isLoading) {
    return (
      <BossLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">問題データを読み込み中...</p>
          </div>
        </div>
      </BossLayout>
    );
  }

  if (error) {
    return (
      <BossLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-red-600">問題データの読み込みに失敗しました</p>
          </div>
        </div>
      </BossLayout>
    );
  }

  return (
    <BossLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            試験問題管理
          </h2>
          <p className="text-slate-600">試験問題の作成、編集、管理ができます</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="問題タイトル、内容で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
              >
                <option value="">すべてのコース</option>
                {courseOptions.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
              >
                <option value="">すべてのタイプ</option>
                {questionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Question Button */}
            <button
              onClick={() => navigate("/admin/exam-management/create")}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              問題追加
            </button>
          </div>
        </div>

        {/* Questions Table */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">
                    問題情報
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">
                    タイプ
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">
                    コース
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">
                    詳細
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-800">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredQuestions.map((question) => (
                  <tr key={question._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 truncate">
                          {question.title}
                        </div>
                        <div className="text-sm text-slate-500 truncate">
                          {question.content}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {question.estimatedTime}分
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getTypeLabel(question.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {question.courseName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="space-y-1">
                        <div>
                          作成日:{" "}
                          {new Date(question.createdAt).toLocaleDateString(
                            "ja-JP"
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() =>
                            navigate(`/admin/exam-management/${question._id}`)
                          }
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="詳細表示"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/exam-management/${question._id}/edit`
                            )
                          }
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="編集"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(question)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredQuestions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">
                <BookOpen className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-slate-600">
                {searchTerm || selectedCourse || selectedType
                  ? "条件に一致する問題が見つかりません"
                  : "まだ問題が作成されていません"}
              </p>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="問題の削除"
          message={`「${questionToDelete?.title}」を削除しますか？この操作は取り消せません。`}
          confirmText="削除する"
          cancelText="キャンセル"
        />
      </div>
    </BossLayout>
  );
};

export default ExamQuestionManagement;
