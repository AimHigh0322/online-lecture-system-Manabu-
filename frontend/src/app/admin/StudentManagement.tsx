import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  Eye,
  Search,
  XCircle,
  CheckCircle,
  UserCheck,
  UserX,
} from "lucide-react";
import { BossLayout } from "../../components/layout/AdminLayout";
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
  }>;
  isBlocked: boolean;
}

export const StudentManagement: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "block";
    student: StudentProfile;
    message: string;
  } | null>(null);
  const [sortField, setSortField] = useState<keyof StudentProfile | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

        setStudents(studentProfiles);
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

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.displayName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
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
                {sortedStudents.map((student) => (
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
        </div>

        {/* Student Detail Modal */}
        {showDetailModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-30 flex items-center justify-center z-50 p-4">
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
                      電話番号
                    </label>
                    <p className="text-slate-800">
                      {selectedStudent.phone || "未設定"}
                    </p>
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
                      生年月日
                    </label>
                    <p className="text-slate-800">
                      {selectedStudent.birthday
                        ? formatDate(selectedStudent.birthday)
                        : "未設定"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      登録日
                    </label>
                    <p className="text-slate-800">
                      {formatDate(selectedStudent.joinedDate)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      最終ログイン
                    </label>
                    <p className="text-slate-800">
                      {selectedStudent.lastLogin
                        ? formatDate(selectedStudent.lastLogin)
                        : "未ログイン"}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleBlock(selectedStudent);
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      selectedStudent.isBlocked
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    {selectedStudent.isBlocked ? "ブロック解除" : "ブロック"}
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-lg transition-colors"
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
          <div className="fixed inset-0 bg-black/50 bg-opacity-30 flex items-center justify-center z-50 p-4">
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
