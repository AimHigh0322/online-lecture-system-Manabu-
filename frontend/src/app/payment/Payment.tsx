import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CreditCard, Shield, CheckCircle } from "lucide-react";
import { isAuthenticated } from "../../api/auth/authService";
import { useToast } from "../../hooks/useToast";

interface Course {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  level: string;
  features: string[];
}

export const Payment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const course = location.state?.course as Course;
  const user = location.state?.user;

  useEffect(() => {
    // Check if user is authenticated and has course data
    if (!isAuthenticated() || !user || user.role !== "student") {
      navigate("/courses");
      return;
    }

    if (!course) {
      navigate("/courses");
      return;
    }
  }, [navigate, user, course]);

  if (!course || !user) {
    return null;
  }

  const handlePayment = async () => {
    try {
      setLoading(true);

      const API_URL =
        import.meta.env.VITE_API_URL || "http://85.131.238.90:4000";
      const token = localStorage.getItem("authToken");

      const response = await fetch(`${API_URL}/api/payment/create-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: course.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if user is already enrolled
        if (data.alreadyEnrolled) {
          showToast({
            type: "info",
            title: "既に登録済みのコースです",
            message: `${
              data.message || "このコースには既に登録されています"
            }\n登録日: ${new Date(
              data.enrollment?.enrollmentAt
            ).toLocaleDateString("ja-JP")}\nステータス: ${
              data.enrollment?.status
            }`,
            duration: 8000,
          });
          return;
        }
        throw new Error(data.message || "支払いセッションの作成に失敗しました");
      }

      // Show success toast before redirect
      showToast({
        type: "success",
        title: "支払いセッションを作成しました",
        message: "Stripe決済画面にリダイレクトしています...",
        duration: 2000,
      });

      // Small delay to show toast, then redirect
      setTimeout(() => {
        window.location.href = data.sessionUrl;
      }, 1000);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "支払いの処理中にエラーが発生しました";
      showToast({
        type: "error",
        title: "支払いエラー",
        message: message,
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Image Section */}
      <div className="relative w-full h-64 md:h-80 lg:h-[400px] overflow-hidden">
        <img
          src="/img/payment.png"
          alt="お支払い"
          className="w-full h-full object-cover"
        />
        <div className="absolute bg-black/20 inset-0 bg-opacity-30 flex items-center justify-center">
          <div className="text-center text-gray-800">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              お支払い
            </h1>
            <p className="text-lg md:text-xl max-w-[700px] mx-auto">
              {course.name}の受講料金をお支払いください
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Course Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                コース詳細
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {course.name}
                  </h3>
                  <p className="text-gray-600 mt-2">{course.description}</p>
                </div>

                <div className="flex items-center justify-between py-4 border-t border-gray-200">
                  <span className="text-lg font-medium text-gray-900">
                    期間
                  </span>
                  <span className="text-lg text-gray-600">
                    {course.duration}
                  </span>
                </div>

                <div className="flex items-center justify-between py-4 border-t border-gray-200">
                  <span className="text-lg font-medium text-gray-900">
                    レベル
                  </span>
                  <span className="text-lg text-gray-600">{course.level}</span>
                </div>

                <div className="py-4 border-t border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">
                    コース内容
                  </h4>
                  <ul className="space-y-2">
                    {course.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                お支払い
              </h2>

              {/* Price Display */}
              <div className="bg-orange-50 rounded-xl p-6 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-600 mb-2">
                    ¥{course.price.toLocaleString()}
                  </div>
                  <div className="text-gray-600">月額料金</div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  お支払い方法
                </h3>
                <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl">
                  <CreditCard className="w-6 h-6 text-gray-600" />
                  <span className="text-gray-900 font-medium">
                    クレジットカード
                  </span>
                  <div className="flex space-x-2 ml-auto">
                    <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                      V
                    </div>
                    <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">
                      M
                    </div>
                    <div className="w-8 h-5 bg-blue-800 rounded text-white text-xs flex items-center justify-center font-bold">
                      A
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-xl mb-6">
                <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-green-800 mb-1">
                    安全なお支払い
                  </h4>
                  <p className="text-xs text-green-700">
                    Stripeを使用した安全な決済システムです。カード情報は暗号化されて処理されます。
                  </p>
                </div>
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {loading ? "処理中..." : "今すぐ支払う"}
              </button>

              {/* Terms */}
              <p className="text-xs text-gray-500 text-center mt-4">
                お支払いを完了することで、
                <a
                  href="#"
                  className="text-orange-600 hover:text-orange-700 underline"
                >
                  利用規約
                </a>
                および
                <a
                  href="#"
                  className="text-orange-600 hover:text-orange-700 underline"
                >
                  プライバシーポリシー
                </a>
                に同意したものとみなされます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
