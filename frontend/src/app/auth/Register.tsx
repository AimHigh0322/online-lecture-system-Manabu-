import React, { useState, type FormEvent, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  ArrowLeft,
  Eye,
  EyeOff,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import { useToast } from "../../hooks/useToast";
import { getFaceDescriptorFromImage, loadModels } from "../../lib/face";

interface RegisterProps {
  onRegisterSuccess?: (userData: typeof User) => void;
}

export const Register: React.FC<RegisterProps> = ({ onRegisterSuccess }) => {
  const navigate = useNavigate();
  const { refreshData } = useData();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // face descriptor states
  const [descriptor, setDescriptor] = useState<number[] | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // load face-api models once
  useEffect(() => {
    loadModels();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.username.trim()) {
      setError("ユーザー名を入力してください");
      return;
    }
    if (!formData.email.trim()) {
      setError("メールアドレスを入力してください");
      return;
    }
    if (!formData.password) {
      setError("パスワードを入力してください");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }
    if (formData.password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }
    if (!descriptor) {
      setError("顔写真をアップロードしてください");
      return;
    }

    try {
      setLoading(true);

      // Call registration API
      const API_URL =
        import.meta.env.VITE_API_URL || "http://103.179.45.68:4000";
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: "student",
          faceDescriptor: descriptor, // 👈 send descriptor
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "登録に失敗しました");
      }

      // Store user data and token for auto-login
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Call success callback
      if (onRegisterSuccess) {
        onRegisterSuccess(data.user);
      }

      // Refresh all data after successful registration
      await refreshData();

      // Show success toast
      showToast({
        type: "success",
        title: "アカウント作成完了！",
        message: `ようこそ、${data.user?.username}さん！ホームページに移動します。`,
        duration: 4000,
      });

      // Redirect directly to homepage (first page for students)
      navigate("/", { replace: true });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "登録に失敗しました。もう一度お試しください。";
      setError(message);
      showToast({
        type: "error",
        title: "登録エラー",
        message: message,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate("/");
  };

  const handleFileSelect = async (file: File) => {
    setError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Process face descriptor
    const desc = await getFaceDescriptorFromImage(file);
    if (desc) {
      setDescriptor(Array.from(desc));
    } else {
      setError("顔が検出できませんでした。別の写真をお試しください。");
      setSelectedFile(null);
      setImagePreview(null);
      setDescriptor(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setDescriptor(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      await handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with gradient and decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600">
        {/* Decorative shapes */}
        <div className="absolute bottom-0 left-0 w-full h-1/2">
          <div className="absolute bottom-0 left-0 w-80 h-40 bg-orange-300/20 transform -skew-y-12"></div>
          <div className="absolute bottom-0 right-0 w-96 h-32 bg-orange-400/25 transform skew-y-6"></div>
          <div className="absolute bottom-0 left-1/3 w-64 h-24 bg-orange-200/15 transform -skew-y-8"></div>
          <div className="absolute bottom-0 right-1/3 w-72 h-28 bg-orange-300/18 transform skew-y-4"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8 md:py-12">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-12 items-center">
          {/* Left Side - Hidden on mobile, shown on tablet+ */}
          <div className="hidden sm:block text-white space-y-4 sm:space-y-6 lg:space-y-8 order-2 lg:order-1">
            <div className="mb-2 sm:mb-4 lg:mb-8">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                学ぼう国際研修センター
              </h1>
            </div>
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                <span className="block font-serif italic text-white">
                  ようこそ
                </span>
                <span className="block font-bold text-white">
                  ウェブサイトへ
                </span>
              </h2>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-orange-100 leading-relaxed max-w-lg">
                日本語学習の新しい体験へようこそ。私たちのオンラインプラットフォームで、効果的で楽しい日本語学習を始めましょう。
              </p>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="flex justify-center lg:justify-end order-1 lg:order-2 w-full">
            <div className="w-full max-w-md">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10">
                {/* Mobile-only header */}
                <div className="sm:hidden mb-3 text-center">
                  <h1 className="text-base font-bold text-white mb-1">
                    学ぼう国際研修センター
                  </h1>
                </div>
                
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 mb-4 sm:mb-6 md:mb-8 lg:mb-10 text-center uppercase tracking-wider">
                  ユーザー登録
                </h3>

                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
                  {/* Username */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 md:py-4 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 text-sm"
                      placeholder="ユーザー名"
                    />
                  </div>

                  {/* Email */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 md:py-4 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 text-sm"
                      placeholder="メールアドレス"
                    />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
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
                      className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 md:py-4 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 text-sm"
                      placeholder="パスワード"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                      ) : (
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                      )}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 md:py-4 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 text-sm"
                      placeholder="パスワード確認"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                      ) : (
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                      )}
                    </button>
                  </div>

                  {/* Face Photo Upload */}
                  <div className="relative">
                    <label className="block mb-2 text-xs sm:text-sm font-medium text-gray-700">
                      顔写真をアップロード
                    </label>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {imagePreview ? (
                      /* Compact preview */
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className="flex items-center gap-2 py-2 px-3 border-2 border-orange-200 rounded-lg bg-gray-50"
                      >
                        <div className="w-8 h-8 rounded overflow-hidden border border-orange-200 flex-shrink-0">
                          <img
                            src={imagePreview}
                            alt="プレビュー"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs text-gray-600 flex-1 truncate">
                          {selectedFile?.name}
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors p-1"
                          aria-label="削除"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* Minimal upload area */
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 py-2 px-3 border-2 border-orange-200 rounded-lg text-gray-600 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors"
                      >
                        <ImageIcon className="h-4 w-4 text-orange-400 flex-shrink-0" />
                        <span className="text-xs">写真を選択</span>
                      </div>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {/* Register */}
                  <button
                    type="submit"
                    disabled={loading || !descriptor}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2.5 sm:py-3 md:py-4 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-base md:text-lg uppercase tracking-wider hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 shadow-lg"
                  >
                    {loading ? "登録中..." : "登録"}
                  </button>

                  {/* Go Back */}
                  <button
                    type="button"
                    onClick={handleGoBack}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 md:py-3 px-4 sm:px-6 border-2 border-orange-500 text-orange-600 rounded-lg font-semibold text-xs sm:text-sm md:text-base hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    最初のページに戻る
                  </button>

                  {/* Login Link */}
                  <div className="text-center pt-2 sm:pt-3 md:pt-4">
                    <p className="text-xs text-gray-600">
                      アカウントをお持ちの方は{" "}
                      <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="text-orange-600 hover:text-orange-700 font-semibold cursor-pointer underline"
                      >
                        ログイン
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

export default Register;
