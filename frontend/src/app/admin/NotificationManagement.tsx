import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Send, Users, User, AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { BossLayout } from "../../components/layout/AdminLayout";
import {
  getStoredUser,
  isAuthenticated,
  getAuthToken,
} from "../../api/auth/authService";
import {
  useSendNotificationMutation,
  useSendNotificationToAllMutation,
} from "../../api/notifications/notificationApiSlice";
import { useToast } from "../../hooks/useToast";

interface Student {
  _id: string;
  username: string;
  email: string;
}

export const NotificationManagement: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendMode, setSendMode] = useState<"single" | "all">("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "success" | "error",
  });

  const [sendNotification] = useSendNotificationMutation();
  const [sendNotificationToAll] = useSendNotificationToAllMutation();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const userData = getStoredUser();
    if (userData) {
      if (userData.role !== "admin") {
        navigate("/");
        return;
      }
      setUser(userData);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchStudents = async () => {
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
          const studentList =
            data.data?.filter(
              (user: any) => user.role === "student"
            ) || [];
          setStudents(studentList);
        }
      } catch (error) {
        console.error("Failed to fetch students:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStudents();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      showToast({
        type: "error",
        title: "エラー",
        message: "タイトルとメッセージを入力してください",
        duration: 3000,
      });
      return;
    }

    if (sendMode === "single" && !selectedStudentId) {
      showToast({
        type: "error",
        title: "エラー",
        message: "受信者を選択してください",
        duration: 3000,
      });
      return;
    }

    try {
      if (sendMode === "all") {
        await sendNotificationToAll({
          title: formData.title,
          message: formData.message,
          type: formData.type,
        }).unwrap();
        showToast({
          type: "success",
          title: "成功",
          message: "すべての受講生に通知を送信しました",
          duration: 3000,
        });
      } else {
        await sendNotification({
          recipientId: selectedStudentId,
          title: formData.title,
          message: formData.message,
          type: formData.type,
        }).unwrap();
        showToast({
          type: "success",
          title: "成功",
          message: "通知を送信しました",
          duration: 3000,
        });
      }

      // Reset form
      setFormData({
        title: "",
        message: "",
        type: "info",
      });
      setSelectedStudentId("");
    } catch (error: any) {
      showToast({
        type: "error",
        title: "エラー",
        message: error?.data?.message || "通知の送信に失敗しました",
        duration: 3000,
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <BossLayout>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            通知管理
          </h2>
          <p className="text-slate-600">
            受講生に通知を送信できます
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          {/* Send Mode Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              送信先
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => setSendMode("all")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  sendMode === "all"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Users className="w-5 h-5" />
                <span>すべての受講生</span>
              </button>
              <button
                onClick={() => setSendMode("single")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  sendMode === "single"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <User className="w-5 h-5" />
                <span>特定の受講生</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipient Selection (for single mode) */}
            {sendMode === "single" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  受信者を選択
                </label>
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  </div>
                ) : (
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">選択してください</option>
                    {students.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.username} ({student.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Notification Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                通知タイプ
              </label>
              <div className="grid grid-cols-4 gap-3">
                {(["info", "success", "warning", "error"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type })}
                    className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-colors cursor-pointer ${
                      formData.type === type
                        ? "border-orange-500 bg-orange-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {getTypeIcon(type)}
                    <span className="text-sm font-medium capitalize">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="通知のタイトルを入力"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                メッセージ <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={6}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
                placeholder="通知の内容を入力"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    title: "",
                    message: "",
                    type: "info",
                  });
                  setSelectedStudentId("");
                }}
                className="px-6 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                リセット
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-2 text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors cursor-pointer"
              >
                <Send className="w-5 h-5" />
                <span>送信</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </BossLayout>
  );
};

export default NotificationManagement;

