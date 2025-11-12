import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Youtube, ClipboardList, Cog, BookOpen, FilePlus, Bell, Award } from "lucide-react";
import { getStoredUser, isAuthenticated, getAuthToken } from "../../api/auth/authService";
import type { User as AuthUser } from "../../api/auth/authService";
import { BossLayout } from "../../components/layout/AdminLayout";

interface DashboardStats {
  totalStudents: number;
  totalMaterials: number;
  totalQuestions: number;
  totalExams: number;
  recentExams: number;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalMaterials: 0,
    totalQuestions: 0,
    totalExams: 0,
    recentExams: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    // Get user data
    const userData = getStoredUser();
    if (userData) {
      // Check if user is admin
      if (userData.role !== "admin") {
        navigate("/");
        return;
      }
      setUser(userData);
      fetchDashboardStats();
    } else {
      // If no user data, redirect to login
      navigate("/login");
    }
  }, [navigate]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://85.131.238.90:4000";
      const token = getAuthToken();

      // Fetch students count
      const studentsRes = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const studentsData = await studentsRes.json();
      const studentCount = studentsData.data?.filter((u: any) => u.role === "student").length || 0;

      // Fetch materials count
      const materialsRes = await fetch(`${API_URL}/api/materials`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const materialsData = await materialsRes.json();
      const materialCount = materialsData.materials?.length || 0;

      // Fetch questions count
      const questionsRes = await fetch(`${API_URL}/api/questions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const questionsData = await questionsRes.json();
      const questionCount = questionsData.questions?.length || 0;

      // Fetch exam histories count
      const examsRes = await fetch(`${API_URL}/api/exam/admin/histories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const examsData = await examsRes.json();
      const examCount = examsData.examHistories?.length || 0;
      
      // Calculate recent exams (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentExamCount = examsData.examHistories?.filter((exam: any) => {
        const examDate = new Date(exam.submittedAt);
        return examDate >= sevenDaysAgo;
      }).length || 0;

      setStats({
        totalStudents: studentCount,
        totalMaterials: materialCount,
        totalQuestions: questionCount,
        totalExams: examCount,
        recentExams: recentExamCount,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
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
      <div className="p-3 md:p-6">
        {/* Welcome Section */}
        <div className="mb-4 md:mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
            ようこそ、{user.username || user.id}さん！
          </h2>
          <p className="text-sm md:text-base text-slate-600">
            学ぼう国際研修センター オンライン講習システム 管理ダッシュボード
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-5">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-slate-100 p-2 rounded">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
              </div>
              <p className="text-xs md:text-sm text-slate-600">登録学生数</p>
            </div>
            <p className="text-xl md:text-2xl font-semibold text-slate-800">
              {loading ? "..." : stats.totalStudents}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-5">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-slate-100 p-2 rounded">
                <Youtube className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
              </div>
              <p className="text-xs md:text-sm text-slate-600">教材数</p>
            </div>
            <p className="text-xl md:text-2xl font-semibold text-slate-800">
              {loading ? "..." : stats.totalMaterials}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-5">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-slate-100 p-2 rounded">
                <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
              </div>
              <p className="text-xs md:text-sm text-slate-600">試験問題数</p>
            </div>
            <p className="text-xl md:text-2xl font-semibold text-slate-800">
              {loading ? "..." : stats.totalQuestions}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-5">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-slate-100 p-2 rounded">
                <ClipboardList className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
              </div>
              <p className="text-xs md:text-sm text-slate-600">試験実施数</p>
            </div>
            <p className="text-xl md:text-2xl font-semibold text-slate-800">
              {loading ? "..." : stats.totalExams}
            </p>
            {stats.recentExams > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                直近7日: {stats.recentExams}件
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 md:mb-8">
          <h3 className="text-base md:text-lg font-medium text-slate-800 mb-3 md:mb-4 border-b border-slate-200 pb-2">
            管理メニュー
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
            <button
              onClick={() => navigate("/student-management")}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-slate-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-slate-800 text-sm">学生管理</h4>
                  <p className="text-slate-500 text-xs mt-0.5">学生情報の管理</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/material-upload")}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <Youtube className="w-5 h-5 text-slate-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-slate-800 text-sm">教材管理</h4>
                  <p className="text-slate-500 text-xs mt-0.5">教材の管理</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/question-management")}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <BookOpen className="w-5 h-5 text-slate-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-slate-800 text-sm">試験問題管理</h4>
                  <p className="text-slate-500 text-xs mt-0.5">問題の管理</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/question-management/create")}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <FilePlus className="w-5 h-5 text-slate-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-slate-800 text-sm">試験問題作成</h4>
                  <p className="text-slate-500 text-xs mt-0.5">新規作成</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/exam-management")}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <ClipboardList className="w-5 h-5 text-slate-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-slate-800 text-sm">試験管理</h4>
                  <p className="text-slate-500 text-xs mt-0.5">試験履歴の管理</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/exam-settings")}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <Cog className="w-5 h-5 text-slate-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-slate-800 text-sm">試験設定</h4>
                  <p className="text-slate-500 text-xs mt-0.5">基本設定</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/notifications")}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-slate-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-slate-800 text-sm">通知管理</h4>
                  <p className="text-slate-500 text-xs mt-0.5">通知送信</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/certificate-generator")}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <Award className="w-5 h-5 text-slate-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-slate-800 text-sm">修了証発行</h4>
                  <p className="text-slate-500 text-xs mt-0.5">修了証の作成</p>
                </div>
              </div>
            </button>

          </div>
        </div>

        {/* System Information */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-5">
          <h3 className="text-sm md:text-base font-medium text-slate-800 mb-3 border-b border-slate-200 pb-2">
            システムについて
          </h3>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            学ぼう国際研修センター オンライン講習システムの管理画面です。左側のメニューから各機能にアクセスできます。
          </p>
        </div>
      </div>
    </BossLayout>
  );
};

export default AdminDashboard;
