import React, { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useLoginMutation } from "../../api/auth/authApiSlice";
import { useData } from "../../context/DataContext";
import { useToast } from "../../hooks/useToast";

interface LoginProps {
  onLoginSuccess?: (userId: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { refreshData } = useData();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    id: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // RTK Query mutation
  const [loginMutation, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.id.trim()) {
      setError("メールアドレスまたはIDを入力してください");
      return;
    }

    if (!formData.password) {
      setError("パスワードを入力してください");
      return;
    }

    try {
      // Call login API using RTK Query
      const data = await loginMutation({
        id: formData.id,
        password: formData.password,
      }).unwrap();

      // Token and user are automatically stored in authApiSlice

      // Call success callback
      if (onLoginSuccess) {
        onLoginSuccess(data.user?.id || formData.id);
      }

      // Refresh all data after successful login
      await refreshData();

      // Show success toast
      showToast({
        type: "success",
        title: "ログインしました！",
        message: `ようこそ、${data.user?.username || data.user?.email}さん`,
        duration: 3000,
      });

      // Navigate based on user role
      if (data.user?.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        // Students go to homepage
        navigate("/", { replace: true });
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "ログインに失敗しました。もう一度お試しください。";
      setError(message);
      showToast({
        type: "error",
        title: "ログインエラー",
        message: message,
        duration: 5000,
      });
    }
  };

  const handleGoBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with gradient and decorative elements - matching the image */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600">
        {/* Decorative mountain shapes - more like the image */}
        <div className="absolute bottom-0 left-0 w-full h-1/2">
          <div className="absolute bottom-0 left-0 w-80 h-40 bg-orange-300/20 transform -skew-y-12"></div>
          <div className="absolute bottom-0 right-0 w-96 h-32 bg-orange-400/25 transform skew-y-6"></div>
          <div className="absolute bottom-0 left-1/3 w-64 h-24 bg-orange-200/15 transform -skew-y-8"></div>
          <div className="absolute bottom-0 right-1/3 w-72 h-28 bg-orange-300/18 transform skew-y-4"></div>
        </div>

        {/* Decorative dots - more scattered like the image */}
        <div className="absolute top-16 left-16 w-1 h-1 bg-white/40 rounded-full"></div>
        <div className="absolute top-24 right-24 w-1.5 h-1.5 bg-white/30 rounded-full"></div>
        <div className="absolute top-40 left-1/4 w-1 h-1 bg-white/35 rounded-full"></div>
        <div className="absolute top-56 right-1/3 w-1.5 h-1.5 bg-white/25 rounded-full"></div>
        <div className="absolute top-72 left-1/2 w-1 h-1 bg-white/40 rounded-full"></div>
        <div className="absolute top-88 right-1/4 w-1 h-1 bg-white/30 rounded-full"></div>
        <div className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-white/35 rounded-full"></div>
        <div className="absolute bottom-56 right-16 w-1 h-1 bg-white/25 rounded-full"></div>
        <div className="absolute bottom-32 left-1/3 w-1 h-1 bg-white/40 rounded-full"></div>
        <div className="absolute bottom-48 right-1/2 w-1.5 h-1.5 bg-white/30 rounded-full"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Welcome Content */}
          <div className="text-white space-y-8">
            {/* Logo */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white">
                学ぼう国際研修センター
              </h1>
            </div>

            {/* Welcome Text - matching image style */}
            <div className="space-y-6">
              <h2 className="text-6xl font-bold leading-tight">
                <span className="block font-serif italic text-white">
                  ようこそ
                </span>
                <span className="block font-bold text-white">
                  ウェブサイトへ
                </span>
              </h2>

              <p className="text-lg text-orange-100 leading-relaxed max-w-lg">
                日本語学習の新しい体験へようこそ。私たちのオンラインプラットフォームで、効果的で楽しい日本語学習を始めましょう。初心者から上級者まで、あなたのレベルに合わせた最適なコースをご提供します。
              </p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              {/* Login Form Panel - more like the image */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10">
                <h3 className="text-2xl font-bold text-orange-600 mb-10 text-center uppercase tracking-wider">
                  ユーザーログイン
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email/ID Field */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-orange-400" />
                    </div>
                    <input
                      id="id"
                      name="id"
                      type="text"
                      required
                      value={formData.id}
                      onChange={(e) =>
                        setFormData({ ...formData, id: e.target.value })
                      }
                      className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-base"
                      placeholder="メールアドレス または ID"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Password Field with Eye Icon */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-orange-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="block w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-base"
                      placeholder="パスワード"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-orange-400 hover:text-orange-500 cursor-pointer" />
                      ) : (
                        <Eye className="h-5 w-5 text-orange-400 hover:text-orange-500 cursor-pointer" />
                      )}
                    </button>
                  </div>

                  {/* Options Row */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                      />
                      <span className="ml-2 text-sm text-orange-600">
                        記憶する
                      </span>
                    </label>

                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                      />
                      <span className="ml-2 text-sm text-orange-600">
                        パスワードを忘れましたか？
                      </span>
                    </label>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {/* Login Button - more like the image */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-xl font-bold text-lg uppercase tracking-wider hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 shadow-lg"
                  >
                    {isLoading ? "ログイン中..." : "ログイン"}
                  </button>

                  {/* Go Back Button */}
                  <button
                    type="button"
                    onClick={handleGoBack}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 border-2 border-orange-500 text-orange-600 rounded-xl font-semibold hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    最初のページに戻る
                  </button>

                  {/* Register Link */}
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-600">
                      アカウントをお持ちでない方は{" "}
                      <button
                        type="button"
                        onClick={() => navigate("/register")}
                        className="text-orange-600 hover:text-orange-700 font-semibold cursor-pointer underline"
                      >
                        こちらから登録
                      </button>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
