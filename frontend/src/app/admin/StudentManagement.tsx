import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Trash2,
  Eye,
  Search,
  XCircle,
  CheckCircle,
  UserCheck,
  UserX,
  Award,
  Loader2,
} from "lucide-react";
import { BossLayout } from "../../components/layout/AdminLayout";
import { Pagination } from "../../components/atom/Pagination";
import {
  getAuthToken,
  isAuthenticated,
  getStoredUser,
} from "../../api/auth/authService";
import { useToast } from "../../hooks/useToast";

interface StudentProfile {
  id: string;
  userId: string;
  username: string;
  email: string;
  role: string;
  displayName: string;
  avatar: string;
  phone: string;
  gender: string;
  birthday: string;
  joinedDate: string;
  lastLogin: string;
  courses: Array<{
    courseId: string;
    courseName: string;
    studentId: string;
    status: string;
    enrollmentAt: string;
    completedAt?: string;
  }>;
  isBlocked: boolean;
}

interface StudentWithExamStatus extends StudentProfile {
  hasPassedExam?: boolean;
}

export const StudentManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [students, setStudents] = useState<StudentWithExamStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentWithExamStatus | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isIssuingCertificate, setIsIssuingCertificate] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "block";
    student: StudentWithExamStatus;
    message: string;
  } | null>(null);
  const [sortField, setSortField] = useState<keyof StudentWithExamStatus | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  // Pagination state - 6 items per page
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const checkExamStatus = async (userId: string): Promise<boolean> => {
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://85.131.238.90:4000";
      const token = getAuthToken();

      // Check if student has passed any exam by querying admin exam histories endpoint
      // Only check for passed exams (passed=true)
      const response = await fetch(
        `${API_URL}/api/exam/admin/histories?examineeId=${userId}&passed=true&limit=1`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Only return true if there is at least one passed exam
        return (
          data.examHistories &&
          Array.isArray(data.examHistories) &&
          data.examHistories.length > 0 &&
          data.examHistories.some((exam: { passed?: boolean }) => exam.passed === true)
        );
      }
      return false;
    } catch (error) {
      console.error("Error checking exam status:", error);
      return false;
    }
  };

  const fetchStudents = React.useCallback(async () => {
    try {
      setLoading(true);
      const API_URL =
        import.meta.env.VITE_API_URL || "http://85.131.238.90:4000";
      const token = getAuthToken();

      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter only students (non-admin users)
        const studentProfiles =
          data.data?.filter(
            (user: Record<string, unknown>) => user.role === "student"
          ) || [];

        // Check exam status for each student
        const studentsWithExamStatus = await Promise.all(
          studentProfiles.map(async (student: StudentProfile) => {
            const hasPassedExam = await checkExamStatus(student.userId);
            return { ...student, hasPassedExam };
          })
        );

        setStudents(studentsWithExamStatus);
      } else {
        throw new Error("Failed to fetch students");
      }
    } catch {
      showToast({
        type: "error",
        title: "エラー",
        message: "学生データの取得に失敗しました",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // Check authentication and admin role
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const user = getStoredUser();
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }

    fetchStudents();
  }, [navigate, fetchStudents]);

  // Handle URL parameter for userId
  useEffect(() => {
    const userId = searchParams.get("userId");
    if (userId && students.length > 0) {
      const student = students.find((s) => s.userId === userId);
      if (student) {
        setSelectedStudent(student);
        setShowDetailModal(true);
        // Remove userId from URL
        navigate("/student-management", { replace: true });
      }
    }
  }, [searchParams, students, navigate]);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.displayName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      if (!sortField) return 0;

      const aValue = a[sortField];
      const bValue = b[sortField];

      // Handle different data types
      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue
          .toLowerCase()
          .localeCompare(bValue.toLowerCase());
        return sortDirection === "asc" ? comparison : -comparison;
      }

      if (typeof aValue === "boolean" && typeof bValue === "boolean") {
        const comparison = aValue === bValue ? 0 : aValue ? 1 : -1;
        return sortDirection === "asc" ? comparison : -comparison;
      }

      // Handle dates
      if (aValue && bValue) {
        const dateA = new Date(aValue as string);
        const dateB = new Date(bValue as string);
        const comparison = dateA.getTime() - dateB.getTime();
        return sortDirection === "asc" ? comparison : -comparison;
      }

      return 0;
    });
  }, [filteredStudents, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const pagedStudents = useMemo(() => {
    return sortedStudents.slice(startIndex, startIndex + pageSize);
  }, [sortedStudents, startIndex, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortField, sortDirection]);

  // Ensure page is within bounds
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const handleSort = (field: keyof StudentProfile) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDelete = (student: StudentProfile) => {
    setConfirmAction({
      type: "delete",
      student,
      message: `${student.displayName}を削除しますか？この操作は取り消せません。`,
    });
    setShowConfirmModal(true);
  };

  const handleBlock = (student: StudentProfile) => {
    const action = student.isBlocked ? "ブロック解除" : "ブロック";
    setConfirmAction({
      type: "block",
      student,
      message: `${student.displayName}を${action}しますか？`,
    });
    setShowConfirmModal(true);
  };

  const handleDetail = (student: StudentProfile) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleIssueCertificate = async () => {
    if (!selectedStudent) return;

    setIsIssuingCertificate(true);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://85.131.238.90:4000";
      const token = getAuthToken();

      // Get course dates
      const firstPurchaseDate =
        selectedStudent.courses && selectedStudent.courses.length > 0
          ? (() => {
              const sorted = [...selectedStudent.courses].sort(
                (a, b) =>
                  new Date(a.enrollmentAt).getTime() -
                  new Date(b.enrollmentAt).getTime()
              );
              return sorted[0].enrollmentAt;
            })()
          : null;

      const lastCompletionDate =
        selectedStudent.courses && selectedStudent.courses.length > 0
          ? (() => {
              const completedCourses = selectedStudent.courses.filter(
                (c) => c.status === "completed" && c.completedAt
              );
              if (completedCourses.length > 0) {
                const sorted = [...completedCourses].sort(
                  (a, b) =>
                    new Date(b.completedAt || 0).getTime() -
                    new Date(a.completedAt || 0).getTime()
                );
                return sorted[0].completedAt!;
              }
              return null;
            })()
          : null;

      const response = await fetch(`${API_URL}/api/admin/certificate/issue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedStudent.userId,
          firstCoursePurchaseDate: firstPurchaseDate,
          lastCourseCompletionDate: lastCompletionDate,
        }),
      });

      if (response.ok) {
        showToast({
          type: "success",
          title: "成功",
          message: "修了証を発行しました。受講生に通知が送信されました。",
          duration: 3000,
        });
        setShowDetailModal(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to issue certificate");
      }
    } catch (error) {
      console.error("Error issuing certificate:", error);
      showToast({
        type: "error",
        title: "エラー",
        message:
          error instanceof Error
            ? error.message
            : "修了証発行リクエストの送信に失敗しました",
        duration: 3000,
      });
    } finally {
      setIsIssuingCertificate(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const executeAction = async () => {
    if (!confirmAction) return;

    const { type, student } = confirmAction;

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://85.131.238.90:4000";
      const token = getAuthToken();

      if (type === "delete") {
        const response = await fetch(
          `${API_URL}/api/admin/users/${student.userId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          showToast({
            type: "success",
            title: "削除完了",
            message: `${student.displayName}を削除しました`,
            duration: 2000,
          });
          fetchStudents();
        } else {
          throw new Error("Failed to delete student");
        }
      } else if (type === "block") {
        const response = await fetch(
          `${API_URL}/api/admin/users/${student.userId}/block`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isBlocked: !student.isBlocked }),
          }
        );

        if (response.ok) {
          const action = student.isBlocked ? "ブロック解除" : "ブロック";
          showToast({
            type: "success",
            title: "更新完了",
            message: `${student.displayName}を${action}しました`,
            duration: 2000,
          });
          fetchStudents();
        } else {
          throw new Error(
            `Failed to ${student.isBlocked ? "unblock" : "block"} student`
          );
        }
      }
    } catch {
      const action =
        confirmAction.type === "delete"
          ? "削除"
          : confirmAction.student.isBlocked
          ? "ブロック解除"
          : "ブロック";
      showToast({
        type: "error",
        title: "エラー",
        message: `学生の${action}に失敗しました`,
        duration: 3000,
      });
    } finally {
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  const cancelAction = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  if (loading) {
    return (
      <BossLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">学生データを読み込み中...</p>
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
          <h2 className="text-3xl font-bold text-slate-800 mb-2">学生管理</h2>
          <p className="text-slate-600">
            登録されている学生の情報を管理できます
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="学生名、メールアドレスで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th
                    className={`px-6 py-4 text-center text-sm font-bold cursor-pointer transition-colors ${
                      sortField === "displayName"
                        ? "text-orange-600 bg-orange-50"
                        : "text-gray-700 hover:text-orange-600"
                    }`}
                    onClick={() => handleSort("displayName")}
                  >
                    学生情報
                  </th>
                  <th
                    className={`px-6 py-4 text-center text-sm font-bold cursor-pointer transition-colors ${
                      sortField === "email"
                        ? "text-orange-600 bg-orange-50"
                        : "text-gray-700 hover:text-orange-600"
                    }`}
                    onClick={() => handleSort("email")}
                  >
                    連絡先
                  </th>
                  <th
                    className={`px-6 py-4 text-center text-sm font-bold cursor-pointer transition-colors ${
                      sortField === "joinedDate"
                        ? "text-orange-600 bg-orange-50"
                        : "text-gray-700 hover:text-orange-600"
                    }`}
                    onClick={() => handleSort("joinedDate")}
                  >
                    登録日
                  </th>
                  <th
                    className={`px-6 py-4 text-center text-sm font-bold cursor-pointer transition-colors ${
                      sortField === "lastLogin"
                        ? "text-orange-600 bg-orange-50"
                        : "text-gray-700 hover:text-orange-600"
                    }`}
                    onClick={() => handleSort("lastLogin")}
                  >
                    最終ログイン
                  </th>
                  <th
                    className={`px-6 py-4 text-center text-sm font-bold cursor-pointer transition-colors ${
                      sortField === "isBlocked"
                        ? "text-orange-600 bg-orange-50"
                        : "text-gray-700 hover:text-orange-600"
                    }`}
                    onClick={() => handleSort("isBlocked")}
                  >
                    ステータス
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pagedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center">
                          <img
                            src={
                              student.avatar
                                ? `${
                                    import.meta.env.VITE_API_URL ||
                                    "http://85.131.238.90:4000"
                                  }${student.avatar}`
                                : "/img/default_avatar.png"
                            }
                            alt={student.displayName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/img/default_avatar.png";
                            }}
                          />
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-slate-800">
                            {student.displayName}
                          </div>
                          <div className="text-sm text-slate-500">
                            @{student.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm text-slate-800">
                        {student.email}
                      </div>
                      {student.phone && (
                        <div className="text-sm text-slate-500">
                          {student.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">
                      {formatDate(student.joinedDate)}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">
                      {student.lastLogin
                        ? formatDate(student.lastLogin)
                        : "未ログイン"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.isBlocked
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {student.isBlocked ? (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            ブロック済み
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            アクティブ
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleDetail(student)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="詳細表示"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {student.hasPassedExam && (
                          <button
                            onClick={() => handleDetail(student)}
                            className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                            title="修了証発行"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleBlock(student)}
                          className={`p-2 rounded-lg transition-colors ${
                            student.isBlocked
                              ? "text-green-600 hover:bg-green-100"
                              : "text-red-600 hover:bg-red-100"
                          }`}
                          title={
                            student.isBlocked ? "ブロック解除" : "ブロック"
                          }
                        >
                          {student.isBlocked ? (
                            <UserCheck className="w-4 h-4" />
                          ) : (
                            <UserX className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(student)}
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

          {sortedStudents.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">
                <Eye className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-slate-600">
                {searchTerm
                  ? "条件に一致する学生が見つかりません"
                  : "まだ学生が登録されていません"}
              </p>
            </div>
          )}

          {/* Pagination - only show if more than 6 items */}
          {sortedStudents.length > 6 && totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={(p) => setPage(p)}
            />
          )}
        </div>

        {/* Student Detail Modal */}
        {showDetailModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/60 bg-opacity-30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-800">
                  学生詳細情報
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center">
                    <img
                      src={
                        selectedStudent.avatar
                          ? `${
                              import.meta.env.VITE_API_URL ||
                              "http://85.131.238.90:4000"
                            }${selectedStudent.avatar}`
                          : "/img/default_avatar.png"
                      }
                      alt={selectedStudent.displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/img/default_avatar.png";
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-slate-800">
                      {selectedStudent.displayName}
                    </h4>
                    <p className="text-slate-600">
                      @{selectedStudent.username}
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      メールアドレス
                    </label>
                    <p className="text-slate-800">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      性別
                    </label>
                    <p className="text-slate-800">
                      {selectedStudent.gender || "未設定"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      最初のコース購入日
                    </label>
                    <p className="text-slate-800">
                      {selectedStudent.courses && selectedStudent.courses.length > 0
                        ? (() => {
                            const sortedByEnrollment = [...selectedStudent.courses].sort(
                              (a, b) =>
                                new Date(a.enrollmentAt).getTime() -
                                new Date(b.enrollmentAt).getTime()
                            );
                            return formatDate(sortedByEnrollment[0].enrollmentAt);
                          })()
                        : "コース未購入"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      最後のコース完了日
                    </label>
                    <p className="text-slate-800">
                      {selectedStudent.courses && selectedStudent.courses.length > 0
                        ? (() => {
                            const completedCourses = selectedStudent.courses.filter(
                              (c) => c.status === "completed" && c.completedAt
                            );
                            if (completedCourses.length > 0) {
                              const sortedByCompletion = [...completedCourses].sort(
                                (a, b) =>
                                  new Date(b.completedAt || 0).getTime() -
                                  new Date(a.completedAt || 0).getTime()
                              );
                              return formatDate(sortedByCompletion[0].completedAt!);
                            }
                            return "コース未完了";
                          })()
                        : "コース未購入"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      現在の日付
                    </label>
                    <p className="text-slate-800">
                      {formatDate(new Date().toISOString())}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  {selectedStudent.hasPassedExam && (
                    <button
                      onClick={handleIssueCertificate}
                      disabled={isIssuingCertificate}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isIssuingCertificate ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>送信中...</span>
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4" />
                          <span>修了証発行</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-lg transition-colors"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {showConfirmModal && confirmAction && (
          <div className="fixed inset-0 bg-black/60 bg-opacity-30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {confirmAction.type === "delete"
                    ? "学生を削除"
                    : "学生をブロック"}
                </h3>
                <p className="text-slate-600 mb-6">{confirmAction.message}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={cancelAction}
                    className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-lg transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={executeAction}
                    className={`px-4 py-2 text-white rounded-lg transition-colors ${
                      confirmAction.type === "delete"
                        ? "bg-red-600 hover:bg-red-700"
                        : confirmAction.student.isBlocked
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {confirmAction.type === "delete"
                      ? "削除"
                      : confirmAction.student.isBlocked
                      ? "ブロック解除"
                      : "ブロック"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BossLayout>
  );
};

export default StudentManagement;
