import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { EditExamModal } from "../../components/molecules";
import { ConfirmModal } from "../../components/atom/ConfirmModal";
import { Pagination } from "../../components/atom/Pagination";
import { AdminLayout } from "../../components/layout";

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

export const ExamManagement: React.FC = () => {
  const [examHistories, setExamHistories] = useState<ExamHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // Changed from 10 to 6
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [editingHistory, setEditingHistory] = useState<ExamHistory | null>(
    null
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchExamHistories();
  }, []);

  const fetchExamHistories = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://85.131.238.90:4000"
        }/api/exam/admin/histories`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setExamHistories(data.examHistories || []);
      } else {
        setError("Failed to fetch exam histories");
      }
    } catch (err) {
      setError("Error fetching exam histories");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredHistories = examHistories.filter((history) => {
    const matchesSearch = history.examineeName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "passed" && history.passed) ||
      (filterStatus === "failed" && !history.passed);

    return matchesSearch && matchesFilter;
  });

  // Sort the filtered histories
  const sortedHistories = useMemo(() => {
    return [...filteredHistories].sort((a, b) => {
      if (!sortField) return 0;

      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortField) {
        case "examineeName":
          aValue = a.examineeName;
          bValue = b.examineeName;
          break;
        case "score":
          aValue = a.score;
          bValue = b.score;
          break;
        case "percentage":
          aValue = a.percentage;
          bValue = b.percentage;
          break;
        case "timeSpent":
          aValue = a.timeSpent;
          bValue = b.timeSpent;
          break;
        case "submittedAt":
          aValue = new Date(a.submittedAt);
          bValue = new Date(b.submittedAt);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredHistories, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedHistories.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistories = useMemo(() => {
    return sortedHistories.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedHistories, startIndex, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, sortField, sortDirection]);

  // Ensure page is within bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleEdit = (history: ExamHistory) => {
    setEditingHistory(history);
    setIsEditModalOpen(true);
  };

  const handleDelete = (historyId: string) => {
    setDeleteConfirmId(historyId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://85.131.238.90:4000"
        }/api/exam/admin/histories/${deleteConfirmId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.ok) {
        await fetchExamHistories(); // Refresh the list
        setIsDeleteModalOpen(false);
        setDeleteConfirmId(null);
      } else {
        setError("Failed to delete exam history");
      }
    } catch (err) {
      setError("Error deleting exam history");
      console.error("Error:", err);
    }
  };

  const handleUpdateExamHistory = async (updatedData: Partial<ExamHistory>) => {
    if (!editingHistory) return;

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://85.131.238.90:4000"
        }/api/exam/admin/histories/${editingHistory._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (response.ok) {
        await fetchExamHistories(); // Refresh the list
        setIsEditModalOpen(false);
        setEditingHistory(null);
      } else {
        setError("Failed to update exam history");
      }
    } catch (err) {
      setError("Error updating exam history");
      console.error("Error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchExamHistories}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-3 md:p-6">
        {/* Page Header */}
        <div className="mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">試験管理</h1>
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              {examHistories.length} 件の試験履歴
            </p>
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm p-3 md:p-6 mb-4 md:mb-6">
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="受験者名で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 md:pl-10 pr-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 md:px-3 py-2 text-sm md:text-base focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="all">すべて</option>
                    <option value="passed">合格</option>
                    <option value="failed">不合格</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Exam Histories Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto px-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className={`px-2 md:px-6 py-2 md:py-3 text-center text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${
                        sortField === "examineeName"
                          ? "text-orange-600 bg-orange-50"
                          : "text-gray-700"
                      }`}
                      onClick={() => handleSort("examineeName")}
                    >
                      受験者
                    </th>
                    <th
                      className={`px-2 md:px-6 py-2 md:py-3 text-center text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden md:table-cell ${
                        sortField === "score"
                          ? "text-orange-600 bg-orange-50"
                          : "text-gray-700"
                      }`}
                      onClick={() => handleSort("score")}
                    >
                      得点
                    </th>
                    <th
                      className={`px-2 md:px-6 py-2 md:py-3 text-center text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden lg:table-cell ${
                        sortField === "percentage"
                          ? "text-orange-600 bg-orange-50"
                          : "text-gray-700"
                      }`}
                      onClick={() => handleSort("percentage")}
                    >
                      正解率
                    </th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      結果
                    </th>
                    <th
                      className={`px-2 md:px-6 py-2 md:py-3 text-center text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden lg:table-cell ${
                        sortField === "timeSpent"
                          ? "text-orange-600 bg-orange-50"
                          : "text-gray-700"
                      }`}
                      onClick={() => handleSort("timeSpent")}
                    >
                      所要時間
                    </th>
                    <th
                      className={`px-2 md:px-6 py-2 md:py-3 text-center text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden md:table-cell ${
                        sortField === "submittedAt"
                          ? "text-orange-600 bg-orange-50"
                          : "text-gray-700"
                      }`}
                      onClick={() => handleSort("submittedAt")}
                    >
                      提出日時
                    </th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedHistories.map((history) => (
                    <tr key={history._id} className="hover:bg-gray-50">
                      <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-center">
                        <div className="text-xs md:text-sm font-medium text-gray-900">
                          {history.examineeName}
                        </div>
                        <div className="text-xs text-gray-500 md:hidden mt-1">
                          {history.score} / {history.totalQuestions} ({history.percentage}%)
                        </div>
                      </td>
                      <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-center hidden md:table-cell">
                        <div className="text-xs md:text-sm text-gray-900">
                          {history.score} / {history.totalQuestions}
                        </div>
                      </td>
                      <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-center hidden lg:table-cell">
                        <div className="text-xs md:text-sm text-gray-900">
                          {history.percentage}%
                        </div>
                      </td>
                      <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            history.passed
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {history.passed ? "合格" : "不合格"}
                        </span>
                      </td>
                      <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-center hidden lg:table-cell">
                        <div className="text-xs md:text-sm text-gray-900">
                          {formatTime(history.timeSpent)}
                        </div>
                      </td>
                      <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-center hidden md:table-cell">
                        <div className="text-xs md:text-sm text-gray-900">
                          {formatDate(history.submittedAt)}
                        </div>
                      </td>
                      <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1 md:space-x-2">
                          <button
                            onClick={() => handleEdit(history)}
                            className="px-2 md:px-3 py-1 text-xs md:text-sm text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(history._id)}
                            className="px-2 md:px-3 py-1 text-xs md:text-sm text-red-600 hover:text-red-900 hover:bg-red-50 rounded cursor-pointer transition-colors"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination - only show if more than 6 items */}
            {sortedHistories.length > 6 && totalPages > 1 && (
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onChange={(p) => setCurrentPage(p)}
              />
            )}
          </div>
        </div>

        {/* Modals */}
        <EditExamModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingHistory(null);
          }}
          examHistory={editingHistory}
          onUpdate={handleUpdateExamHistory}
        />

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteConfirmId(null);
          }}
          onConfirm={confirmDelete}
          title="削除の確認"
          message="この試験履歴を削除しますか？この操作は取り消せません。"
          confirmText="削除"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
        />
      </div>
    </AdminLayout>
  );
};

export default ExamManagement;
