import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Youtube, ClipboardList, Cog, BookOpen } from "lucide-react";
import { getStoredUser, isAuthenticated } from "../../api/auth/authService";
import type { User as AuthUser } from "../../api/auth/authService";
import { BossLayout } from "../../components/layout/AdminLayout";

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);

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
    } else {
      // If no user data, redirect to login
      navigate("/login");
    }
  }, [navigate]);

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
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            ようこそ、{user.username || user.id}さん！
          </h2>
          <p className="text-slate-600">
            システム管理者としてログインしています
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            クイックアクション
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => navigate("/student-management")}
              className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-200 text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">学生管理</h4>
                  <p className="text-slate-600 text-sm">学生情報の管理と編集</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/material-upload")}
              className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-200 text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-red-100 p-3 rounded-lg group-hover:bg-red-200 transition-colors">
                  <Youtube className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">教材管理</h4>
                  <p className="text-slate-600 text-sm">
                    教材の管理とアップロード
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/question-management")}
              className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-200 text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">問題管理</h4>
                  <p className="text-slate-600 text-sm">
                    試験問題の作成と管理
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/exam-management")}
              className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-200 text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-orange-100 p-3 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <ClipboardList className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">試験管理</h4>
                  <p className="text-slate-600 text-sm">試験履歴と結果の管理</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/exam-settings")}
              className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-200 text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Cog className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">試験設定</h4>
                  <p className="text-slate-600 text-sm">試験の基本設定と管理</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/certificate-generator")}
              className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-200 text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-yellow-100 p-3 rounded-lg group-hover:bg-yellow-200 transition-colors">
                  <ClipboardList className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">修了証発行</h4>
                  <p className="text-slate-600 text-sm">修了証明書の生成と管理</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-xl font-semibold text-slate-800">
              最近のアクティビティ
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">
                    新しい学生が登録されました
                  </p>
                  <p className="text-slate-600 text-sm">
                    田中太郎さんが初級コースに登録
                  </p>
                </div>
                <span className="text-slate-500 text-sm">2時間前</span>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Youtube className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">
                    新しい教材がアップロードされました
                  </p>
                  <p className="text-slate-600 text-sm">
                    ビジネス日本語上級教材
                  </p>
                </div>
                <span className="text-slate-500 text-sm">5時間前</span>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <ClipboardList className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">
                    新しい試験が完了しました
                  </p>
                  <p className="text-slate-600 text-sm">
                    佐藤花子さんの試験結果
                  </p>
                </div>
                <span className="text-slate-500 text-sm">1日前</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BossLayout>
  );
};

export default AdminDashboard;
