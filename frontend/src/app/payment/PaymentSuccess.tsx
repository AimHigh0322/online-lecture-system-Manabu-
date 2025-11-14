import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight, BookOpen, Copy, Check } from "lucide-react";
import { getAuthToken } from "../../api/auth/authService";
import { useToast } from "../../hooks/useToast";

interface StudentCredentials {
  id: string;
  password: string;
  email: string;
  courseId: string;
  courseName: string;
}

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<StudentCredentials | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);
  const hasProcessedRef = useRef(false);
  const { showToast } = useToast();

  const sessionId = searchParams.get("session_id");

  const handlePaymentSuccess = useCallback(async () => {
    if (hasProcessedRef.current) return;

    hasProcessedRef.current = true;
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://103.179.45.68:4000";
      const token = getAuthToken();

      if (!token) {
        throw new Error("認証トークンが見つかりません");
      }

      const response = await fetch(`${API_URL}/api/payment/success`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "支払いの確認に失敗しました");
      }

      // Check if user was already enrolled
      if (data.alreadyEnrolled) {
        setAlreadyEnrolled(true);
        showToast({
          type: "info",
          title: "既に登録済みのコースです",
          message:
            "新しい支払いは発生しておりません。既存のログイン情報が表示されています。",
          duration: 6000,
        });
      } else {
        showToast({
          type: "success",
          title: "お支払いが完了しました！",
          message: `${data.credentials?.courseName}へのアクセスが可能になりました。`,
          duration: 5000,
        });
      }

      setCredentials(data.credentials);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [sessionId, showToast]);

  useEffect(() => {
    if (sessionId && !hasProcessedRef.current) {
      handlePaymentSuccess();
    } else if (!sessionId) {
      setError("セッションIDが見つかりません");
      setLoading(false);
    }
  }, [sessionId, handlePaymentSuccess]);

  const copyToClipboard = (text: string, type: "id" | "password") => {
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      showToast({
        type: "success",
        title: "コピーしました",
        message: "ユーザーIDをクリップボードにコピーしました",
        duration: 2000,
      });
    } else {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
      showToast({
        type: "success",
        title: "コピーしました",
        message: "パスワードをクリップボードにコピーしました",
        duration: 2000,
      });
    }
  };

  const handleGoToHomepage = () => {
    navigate("/");
  };

  const handleStartCourse = () => {
    if (credentials?.courseId) {
      navigate(`/course/${credentials.courseId}/learning`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">処理中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-red-200">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <CheckCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              エラーが発生しました
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate("/courses")}
              className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              コース選択に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center justify-center h-20 w-20 rounded-full ${
              alreadyEnrolled
                ? "bg-gradient-to-r from-blue-400 to-blue-600"
                : "bg-gradient-to-r from-green-400 to-green-600"
            } shadow-lg mb-4`}
          >
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {alreadyEnrolled
              ? "既に登録済みのコースです"
              : "お支払いが完了しました！"}
          </h1>
          <p className="text-lg text-gray-600">
            {alreadyEnrolled
              ? `${credentials?.courseName}に既に登録されています。以下のログイン情報をご利用ください。`
              : `${credentials?.courseName}へのアクセスが可能になりました。今すぐコースを開始できます！`}
          </p>
        </div>

        {/* Credentials Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            あなたのログイン情報
          </h2>

          <div className="space-y-6">
            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ユーザーID
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg p-4">
                <span className="flex-1 font-mono text-lg text-gray-800">
                  {credentials?.id}
                </span>
                <button
                  onClick={() => copyToClipboard(credentials?.id || "", "id")}
                  className="ml-3 p-2 text-gray-500 hover:text-gray-600 cursor-pointer rounded-lg hover:bg-gray-100 transition-colors relative"
                >
                  {copiedId ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                  {copiedId && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                      コピーしました！
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg p-4">
                <span className="flex-1 font-mono text-lg text-gray-800">
                  {credentials?.password}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(credentials?.password || "", "password")
                  }
                  className="ml-3 p-2 text-gray-500 hover:text-gray-600 cursor-pointer rounded-lg hover:bg-gray-100 transition-colors relative"
                >
                  {copiedPassword ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                  {copiedPassword && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                      コピーしました！
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Course Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            コース情報
          </h3>
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-orange-600" />
            <div>
              <h4 className="text-lg font-medium text-gray-900">
                {credentials?.courseName}
              </h4>
              <p className="text-gray-600">
                {alreadyEnrolled
                  ? "このコースにアクセスするには、上記のログイン情報を使用してください。"
                  : "このコースにアクセスするには、上記のログイン情報を使用するか、「コースを開始する」ボタンをクリックしてください。"}
              </p>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        {alreadyEnrolled ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-blue-800 mb-3">ℹ️ お知らせ</h3>
            <p className="text-sm text-blue-700">
              このコースには既に登録されています。上記は既存のログイン情報です。
              新しい支払いは発生しておりません。
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-yellow-800 mb-3">
              ⚠️ 重要な注意事項
            </h3>
            <ul className="space-y-2 text-sm text-yellow-700">
              <li>• ログイン情報は安全に保管してください</li>
              <li>• パスワードは他の人と共有しないでください</li>
              <li>
                • ログイン情報を忘れた場合は、サポートまでお問い合わせください
              </li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStartCourse}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-105 cursor-pointer shadow-lg"
            >
              <BookOpen className="w-5 h-5" />
              <span>コースを開始する</span>
            </button>
            <button
              onClick={handleGoToHomepage}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-105 cursor-pointer shadow-lg"
            >
              <span>ホームページに戻る</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
