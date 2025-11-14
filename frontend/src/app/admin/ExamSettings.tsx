import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Clock,
  FileText,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Camera,
} from "lucide-react";
import { AdminLayout } from "../../components/layout";
import { useToast } from "../../hooks/useToast";

interface ExamSettings {
  timeLimit: number; // in minutes
  numberOfQuestions: number;
  passingScore: number; // percentage
  faceVerificationIntervalMinutes: number; // face verification interval in minutes
}

const ExamSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [settings, setSettings] = useState<ExamSettings>({
    timeLimit: 60,
    numberOfQuestions: 20,
    passingScore: 70,
    faceVerificationIntervalMinutes: 15,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<ExamSettings>>({});

  const fetchExamSettings = useCallback(async () => {
    try {
      setLoading(true);
      const API_URL =
        import.meta.env.VITE_API_URL || "http://103.179.45.68:4000";
      const token = localStorage.getItem("authToken");

      const response = await fetch(`${API_URL}/api/exam/settings`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      } else {
        // If no settings exist, use default values
      }
    } catch (error) {
      console.error("Error fetching exam settings:", error);
      showToast({
        type: "error",
        title: "エラー",
        message: "試験設定の取得に失敗しました",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch exam settings on component mount
  useEffect(() => {
    fetchExamSettings();
  }, [fetchExamSettings]);

  const validateSettings = (): boolean => {
    const newErrors: Partial<ExamSettings> = {};

    if (settings.timeLimit < 1 || settings.timeLimit > 480) {
      newErrors.timeLimit = 1;
    }

    if (settings.numberOfQuestions < 1 || settings.numberOfQuestions > 100) {
      newErrors.numberOfQuestions = 1;
    }

    if (settings.passingScore < 0 || settings.passingScore > 100) {
      newErrors.passingScore = 1;
    }

    if (
      settings.faceVerificationIntervalMinutes < 1 ||
      settings.faceVerificationIntervalMinutes > 60
    ) {
      newErrors.faceVerificationIntervalMinutes = 1;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateSettings()) {
      showToast({
        type: "error",
        title: "入力エラー",
        message: "設定値を確認してください",
        duration: 3000,
      });
      return;
    }

    try {
      setSaving(true);
      const API_URL =
        import.meta.env.VITE_API_URL || "http://103.179.45.68:4000";
      const token = localStorage.getItem("authToken");

      const response = await fetch(`${API_URL}/api/exam/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        showToast({
          type: "success",
          title: "保存完了",
          message: "試験設定が正常に保存されました",
          duration: 2000,
        });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving exam settings:", error);
      showToast({
        type: "error",
        title: "保存エラー",
        message: "試験設定の保存に失敗しました",
        duration: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof ExamSettings,
    value: string | number | boolean
  ) => {
    if (
      field === "timeLimit" ||
      field === "numberOfQuestions" ||
      field === "passingScore" ||
      field === "faceVerificationIntervalMinutes"
    ) {
      const numValue = parseInt(value.toString()) || 0;
      setSettings((prev) => ({
        ...prev,
        [field]: numValue,
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">設定を読み込み中...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            管理画面に戻る
          </button>
          <div className="flex items-center mb-2">
            <Settings className="w-8 h-8 text-orange-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">試験設定</h1>
          </div>
          <p className="text-gray-600">試験の基本設定を管理できます</p>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="max-w-2xl">
            <div className="space-y-6">
              {/* Time Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  試験時間（分） *
                </label>
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={settings.timeLimit}
                  onChange={(e) =>
                    handleInputChange(
                      "timeLimit",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.timeLimit ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="60"
                />
                {errors.timeLimit && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    1分から480分の間で設定してください
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  推奨: 60分（1時間）
                </p>
              </div>

              {/* Number of Questions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  問題数 *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.numberOfQuestions}
                  onChange={(e) =>
                    handleInputChange(
                      "numberOfQuestions",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.numberOfQuestions
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="20"
                />
                {errors.numberOfQuestions && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    1問から100問の間で設定してください
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">推奨: 20問</p>
              </div>

              {/* Passing Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  合格点（%） *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.passingScore}
                  onChange={(e) =>
                    handleInputChange(
                      "passingScore",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.passingScore ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="70"
                />
                {errors.passingScore && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    0%から100%の間で設定してください
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">推奨: 70%</p>
              </div>

              {/* Face Verification Interval */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Camera className="w-4 h-4 inline mr-2" />
                  顔認証間隔（分） *
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.faceVerificationIntervalMinutes}
                  onChange={(e) =>
                    handleInputChange(
                      "faceVerificationIntervalMinutes",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.faceVerificationIntervalMinutes
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="15"
                />
                {errors.faceVerificationIntervalMinutes && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    1分から60分の間で設定してください
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  推奨: 15分（試験中に15分ごとに顔認証確認が行われます）
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {saving ? "保存中..." : "設定を保存"}
              </button>
            </div>
          </div>
        </div>

        {/* Current Settings Summary */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            現在の設定
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-orange-600 mr-2" />
                <span className="font-medium text-gray-900">試験時間</span>
              </div>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {settings.timeLimit}分
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-orange-600 mr-2" />
                <span className="font-medium text-gray-900">問題数</span>
              </div>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {settings.numberOfQuestions}問
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-orange-600 mr-2" />
                <span className="font-medium text-gray-900">合格点</span>
              </div>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {settings.passingScore}%
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center">
                <Camera className="w-5 h-5 text-orange-600 mr-2" />
                <span className="font-medium text-gray-900">顔認証間隔</span>
              </div>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {settings.faceVerificationIntervalMinutes}分
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ExamSettingsPage;
