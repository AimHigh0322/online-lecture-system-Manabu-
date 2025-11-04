// src/app/profile/ProfileManagement.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCircle,
  Mail,
  Phone,
  Edit2,
  Save,
  X,
  Camera,
  Cake,
  User,
  BookOpen,
  Key,
  IdCard,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  getStoredUser,
  isAuthenticated,
  getAuthToken,
} from "../../api/auth/authService";
import { Select, ConfirmModal } from "../../components/atom";
import { useToast } from "../../hooks/useToast";
// Profile data interface
interface LectureProgress {
  materialName: string;
  progress: number;
}

interface CourseData {
  courseId: string;
  courseName: string;
  studentId: string;
  password: string;
  status: string;
  lectureProgress: LectureProgress[];
}

interface ProfileData {
  id: string;
  username?: string;
  email?: string;
  role: string;
  phone?: string;
  avatar?: string;
  gender?: string;
  birthday?: string;
  joinedDate?: string;
  lastLogin?: string;
  courses?: CourseData[];
}

export const ProfileManagement: React.FC = () => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<ProfileData | null>(null);
  const { showToast } = useToast();
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(
    new Set()
  );

  // Get user data
  const userData = getStoredUser();
  const userId = userData?.id || "";

  // Mock profile data - replace with static data
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [expandPassword, setExpandPassword] = useState(true);

  const getPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(score, 5);
  };
  const strength = getPasswordStrength(newPassword);
  // Fetch profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      setIsLoading(true);
      try {
        const API_URL =
          import.meta.env.VITE_API_URL || "http://85.131.238.90:4000";
        const token = getAuthToken();

        if (!token) {
          throw new Error("認証トークンが見つかりません");
        }

        const response = await fetch(`${API_URL}/api/profile`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch profile");
        }

        setProfile(data.profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    if (!userData) {
      navigate("/login");
      return;
    }
  }, [navigate, userData]);

  // Update editedProfile when profile changes
  useEffect(() => {
    if (profile && !editing) {
      setEditedProfile(profile);
    }
  }, [profile, editing]);

  // Mock error handling - no real API errors

  const handleEdit = () => {
    setEditing(true);
    setEditedProfile(profile || null);
  };

  const handleCancel = () => {
    setEditedProfile(profile || null);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!editedProfile) {
      console.error("No profile data to save");
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || "http://85.131.238.90:4000";
    const token = getAuthToken();

    if (!token) {
      console.error("No auth token found, redirecting to login");
      navigate("/login");
      return;
    }

    try {
      setIsUpdating(true);

      // Step 1: Upload avatar if there's a new one
      let avatarUrl = editedProfile.avatar;
      let hasNewAvatar = false;

      if (
        editedProfile.avatar &&
        editedProfile.avatar.startsWith("data:image/")
      ) {
        setIsUploadingAvatar(true);
        hasNewAvatar = true;

        // Convert base64 to blob
        const base64Response = await fetch(editedProfile.avatar);
        const blob = await base64Response.blob();

        // Create FormData
        const formData = new FormData();
        formData.append("avatar", blob, "avatar.jpg");

        // Upload avatar
        const uploadResponse = await fetch(`${API_URL}/api/profile/avatar`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadData.message || "Avatar upload failed");
        }

        avatarUrl = uploadData.avatarUrl;
        setIsUploadingAvatar(false);
      }

      // Optional: Change password first if provided
      if (newPassword || confirmNewPassword || currentPassword) {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
          throw new Error(
            "現在のパスワード、新しいパスワード、確認を全て入力してください"
          );
        }
        if (newPassword !== confirmNewPassword) {
          throw new Error("新しいパスワードと確認が一致しません");
        }
        if (newPassword.length < 8) {
          throw new Error("新しいパスワードは8文字以上にしてください");
        }

        const pwResponse = await fetch(`${API_URL}/api/profile/password`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: currentPassword,
            newPassword: newPassword,
          }),
        });

        const pwData = await pwResponse.json();
        if (!pwResponse.ok) {
          throw new Error(pwData.message || "パスワード変更に失敗しました");
        }
      }

      // Step 2: Update profile data
      const profileUpdateData: {
        username?: string;
        email?: string;
        phone?: string;
        gender?: string;
        birthday?: string;
        avatar?: string;
      } = {};

      // Only include fields that have values
      if (editedProfile.username)
        profileUpdateData.username = editedProfile.username;
      // displayName removed
      if (editedProfile.email) profileUpdateData.email = editedProfile.email;
      if (editedProfile.phone) profileUpdateData.phone = editedProfile.phone;
      if (editedProfile.gender) profileUpdateData.gender = editedProfile.gender;
      if (editedProfile.birthday)
        profileUpdateData.birthday = editedProfile.birthday;

      // Only include avatar if it was newly uploaded
      if (hasNewAvatar && avatarUrl) {
        profileUpdateData.avatar = avatarUrl;
      }

      const profileResponse = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileUpdateData),
      });

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileData.message || "Profile update failed");
      }

      // Update local state with server response
      setProfile(profileData.profile);
      setEditing(false);
      setIsUpdating(false);

      showToast({
        type: "success",
        title: "プロフィールが更新されました",
        message: newPassword
          ? "プロフィールとパスワードが正常に保存されました。"
          : "プロフィール情報が正常に保存されました。",
        duration: 4000,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      console.error("Error saving profile:", error);
      setIsUpdating(false);
      setIsUploadingAvatar(false);
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラー";
      console.error("Failed to update profile:", errorMessage);

      showToast({
        type: "error",
        title: "プロフィール更新エラー",
        message: errorMessage,
        duration: 6000,
      });
    }
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    await handleSave();
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      console.error("Invalid file type:", file.type);
      e.target.value = ""; // Reset input
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error("File size too large:", file.size);
      e.target.value = ""; // Reset input
      return;
    }

    // Read and convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;

      // Store avatar in local state - will be uploaded when Save is clicked
      setEditedProfile((prev) =>
        prev ? { ...prev, avatar: base64String } : null
      );
    };
    reader.onerror = () => {
      console.error("Failed to read avatar file");
      e.target.value = ""; // Reset input
    };
    reader.readAsDataURL(file);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "student":
        return "学生";
      case "admin":
        return "管理者";
      default:
        return role;
    }
  };

  const togglePasswordVisibility = (courseId: string) => {
    setVisiblePasswords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!profile || !editedProfile) {
    return null;
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-800">プロフィール管理</h2>
        <p className="text-slate-600 mt-1">アカウント情報を管理できます</p>
      </div>

      {/* Single Column Layout */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          {/* Header with Edit Button */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-slate-800"></h3>
            {!editing ? (
              <button
                onClick={handleEdit}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
                <span>編集</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer disabled:bg-slate-200 disabled:cursor-not-allowed"
                  disabled={isUpdating || isUploadingAvatar}
                >
                  <X className="w-4 h-4" />
                  <span>キャンセル</span>
                </button>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:bg-slate-400 disabled:cursor-not-allowed"
                  disabled={isUpdating || isUploadingAvatar}
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isUploadingAvatar
                      ? "アバターアップロード中..."
                      : isUpdating
                      ? "プロフィール保存中..."
                      : "保存"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Avatar Section at Top */}
          <div className="flex flex-col items-center mb-8 pb-8 border-b border-slate-200">
            <div className="relative inline-block mb-4">
              {(editing ? editedProfile?.avatar : profile?.avatar) ? (
                <img
                  src={
                    (
                      (editing ? editedProfile?.avatar : profile?.avatar) || ""
                    ).startsWith("data:")
                      ? editing
                        ? editedProfile?.avatar
                        : profile?.avatar
                      : `${
                          import.meta.env.VITE_API_URL ||
                          "http://85.131.238.90:4000"
                        }${editing ? editedProfile?.avatar : profile?.avatar}`
                  }
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <img
                  src="/img/default_avatar.png"
                  alt="デフォルトアバター"
                  className="w-20 h-20 rounded-full object-cover"
                />
              )}
              {editing && (
                <label
                  className={`absolute bottom-0 right-0 ${
                    isUploadingAvatar
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-slate-500 hover:bg-slate-600 cursor-pointer"
                  } text-white p-2 rounded-full shadow-lg transition-colors`}
                >
                  {isUploadingAvatar ? (
                    <div className="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-3 h-3" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                </label>
              )}
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-1">
              {profile?.username || profile?.id}
            </h3>

            <p className="text-sm text-slate-600 mb-4">
              {profile?.role && getRoleLabel(profile.role)}
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                ユーザー名
              </label>
              {editing ? (
                <input
                  type="text"
                  value={editedProfile?.username || ""}
                  onChange={(e) =>
                    setEditedProfile((prev) =>
                      prev ? { ...prev, username: e.target.value } : null
                    )
                  }
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                />
              ) : (
                <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg p-3">
                  <UserCircle className="w-5 h-5 text-slate-500 mr-3" />
                  <span className="text-slate-800">
                    {profile.username || "未設定"}
                  </span>
                </div>
              )}
            </div>

            {/* Display Name removed */}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                メールアドレス
              </label>
              {editing ? (
                <div className="flex items-center border-2 border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-slate-500 focus-within:border-slate-500">
                  <Mail className="w-5 h-5 text-slate-500 ml-3" />
                  <input
                    type="email"
                    value={editedProfile?.email || ""}
                    onChange={(e) =>
                      setEditedProfile((prev) =>
                        prev ? { ...prev, email: e.target.value } : null
                      )
                    }
                    className="w-full px-4 py-3 outline-none"
                  />
                </div>
              ) : (
                <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg p-3">
                  <Mail className="w-5 h-5 text-slate-500 mr-3" />
                  <span className="text-slate-800">{profile.email}</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                電話番号
              </label>
              {editing ? (
                <div className="flex items-center border-2 border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-slate-500 focus-within:border-slate-500">
                  <Phone className="w-5 h-5 text-slate-500 ml-3" />
                  <input
                    type="tel"
                    value={editedProfile?.phone || ""}
                    onChange={(e) =>
                      setEditedProfile((prev) =>
                        prev ? { ...prev, phone: e.target.value } : null
                      )
                    }
                    className="w-full px-4 py-3 outline-none"
                  />
                </div>
              ) : (
                <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg p-3">
                  <Phone className="w-5 h-5 text-slate-500 mr-3" />
                  <span className="text-slate-800">{profile.phone}</span>
                </div>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                性別
              </label>
              {editing ? (
                <div className="relative">
                  <Select
                    options={[
                      { value: "男性", label: "男性" },
                      { value: "女性", label: "女性" },
                      { value: "その他", label: "その他" },
                      { value: "未設定", label: "未設定" },
                    ]}
                    value={editedProfile?.gender || ""}
                    onChange={(value) =>
                      setEditedProfile((prev) =>
                        prev ? { ...prev, gender: value } : null
                      )
                    }
                    icon={<User className="w-5 h-5" />}
                    placeholder="性別を選択"
                    theme="slate"
                  />
                </div>
              ) : (
                <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg p-3">
                  <User className="w-5 h-5 text-slate-500 mr-3" />
                  <span className="text-slate-800">
                    {profile.gender || "未設定"}
                  </span>
                </div>
              )}
            </div>

            {/* Birthday */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                生年月日
              </label>
              {editing ? (
                <div className="flex items-center border-2 border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-slate-500 focus-within:border-slate-500">
                  <Cake className="w-5 h-5 text-slate-500 ml-3" />
                  <input
                    type="date"
                    value={editedProfile?.birthday || ""}
                    onChange={(e) =>
                      setEditedProfile((prev) =>
                        prev ? { ...prev, birthday: e.target.value } : null
                      )
                    }
                    className="w-full px-4 py-3 outline-none"
                  />
                </div>
              ) : (
                <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg p-3">
                  <Cake className="w-5 h-5 text-slate-500 mr-3" />
                  <span className="text-slate-800">
                    {profile.birthday
                      ? new Date(profile.birthday).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "未設定"}
                  </span>
                </div>
              )}
            </div>

            {/* Password Change */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-800">
                    パスワード変更
                  </label>
                  <p className="text-xs text-slate-500 mt-1">
                    大文字・小文字・数字・記号の組み合わせを推奨します
                  </p>
                </div>
                {editing && (
                  <button
                    type="button"
                    onClick={() => setExpandPassword((v: boolean) => !v)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    {expandPassword ? "閉じる" : "開く"}
                  </button>
                )}
              </div>
              {editing ? (
                <div
                  className={`transition-all duration-200 ${
                    expandPassword
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none h-0"
                  }`}
                >
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          現在のパスワード
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPw ? "text" : "password"}
                            placeholder="現在のパスワード"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPw((v) => !v)}
                            className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                            aria-label="現在のパスワードを表示/非表示"
                          >
                            {showCurrentPw ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          新しいパスワード
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPw ? "text" : "password"}
                            placeholder="新しいパスワード (8文字以上)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPw((v) => !v)}
                            className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                            aria-label="新しいパスワードを表示/非表示"
                          >
                            {showNewPw ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <div className="mt-2">
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`${
                                strength <= 2
                                  ? "bg-rose-500"
                                  : strength === 3
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              } h-1.5 transition-all`}
                              style={{ width: `${(strength / 5) * 100}%` }}
                            />
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                            <span>強度</span>
                            <span>
                              {strength <= 2
                                ? "弱い"
                                : strength === 3
                                ? "普通"
                                : "強い"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          新しいパスワード（確認）
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPw ? "text" : "password"}
                            placeholder="新しいパスワード（確認）"
                            value={confirmNewPassword}
                            onChange={(e) =>
                              setConfirmNewPassword(e.target.value)
                            }
                            className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPw((v) => !v)}
                            className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                            aria-label="確認用パスワードを表示/非表示"
                          >
                            {showConfirmPw ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {confirmNewPassword &&
                          newPassword !== confirmNewPassword && (
                            <p className="mt-1.5 text-[11px] text-rose-600">
                              新しいパスワードと確認が一致しません
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-600">
                  セキュリティのため、ここでは表示しません
                </div>
              )}
            </div>

            {/* Enrolled Courses Section */}
            {profile.courses && profile.courses.length > 0 && (
              <div className="mt-8 pt-8 border-t border-slate-200">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  登録コース情報
                </h4>
                <div className="space-y-4">
                  {profile.courses.map((course) => (
                    <div
                      key={course.courseId}
                      className="bg-slate-50 border border-slate-300 rounded-lg p-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            コース名
                          </label>
                          <div className="flex items-center">
                            <BookOpen className="w-4 h-4 text-slate-500 mr-2" />
                            <span className="text-slate-800 font-medium">
                              {course.courseName}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            学生ID
                          </label>
                          <div className="flex items-center">
                            <IdCard className="w-4 h-4 text-slate-500 mr-2" />
                            <span className="text-slate-800 font-mono">
                              {course.studentId}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            パスワード
                          </label>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Key className="w-4 h-4 text-slate-500 mr-2" />
                              <span className="text-slate-800 font-mono">
                                {visiblePasswords.has(course.courseId)
                                  ? course.password
                                  : "••••••••"}
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                togglePasswordVisibility(course.courseId)
                              }
                              className="ml-2 p-1 hover:bg-slate-200 rounded transition-colors"
                              title={
                                visiblePasswords.has(course.courseId)
                                  ? "パスワードを隠す"
                                  : "パスワードを表示"
                              }
                            >
                              {visiblePasswords.has(course.courseId) ? (
                                <EyeOff className="w-4 h-4 text-slate-600" />
                              ) : (
                                <Eye className="w-4 h-4 text-slate-600" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            ステータス
                          </label>
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              course.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : course.status === "completed"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {course.status === "active"
                              ? "受講中"
                              : course.status === "completed"
                              ? "完了"
                              : course.status}
                          </span>
                        </div>
                      </div>

                      {/* Lecture Progress Section */}
                      {course.lectureProgress &&
                        course.lectureProgress.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <label className="block text-xs font-medium text-slate-600 mb-2">
                              教材別進捗状況
                            </label>
                            <div className="space-y-2">
                              {course.lectureProgress.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between bg-white rounded p-2"
                                >
                                  <span className="text-xs text-slate-700 truncate flex-1 mr-2">
                                    {item.materialName}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-emerald-500 h-2 rounded-full transition-all"
                                        style={{ width: `${item.progress}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs font-medium text-slate-600 min-w-[3rem] text-right">
                                      {item.progress}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        title="プロフィール更新の確認"
        message={
          <div className="space-y-2">
            <p>以下の変更を保存してもよろしいですか？</p>
            <ul className="text-sm text-slate-600 mt-2 space-y-1">
              {editedProfile?.username !== profile?.username && (
                <li>
                  • ユーザー名: {profile?.username} → {editedProfile?.username}
                </li>
              )}
              {/* displayName removed */}
              {editedProfile?.email !== profile?.email && (
                <li>
                  • メール: {profile?.email} → {editedProfile?.email}
                </li>
              )}
              {editedProfile?.phone !== profile?.phone && (
                <li>
                  • 電話番号: {profile?.phone || "未設定"} →{" "}
                  {editedProfile?.phone}
                </li>
              )}
              {editedProfile?.gender !== profile?.gender && (
                <li>
                  • 性別: {profile?.gender || "未設定"} →{" "}
                  {editedProfile?.gender}
                </li>
              )}
              {editedProfile?.birthday !== profile?.birthday && (
                <li>
                  • 生年月日: {profile?.birthday || "未設定"} →{" "}
                  {editedProfile?.birthday}
                </li>
              )}
              {(newPassword || confirmNewPassword || currentPassword) && (
                <li>• パスワードの変更</li>
              )}
            </ul>
          </div>
        }
        confirmText="保存"
        cancelText="キャンセル"
        confirmButtonClass="bg-emerald-600 hover:bg-emerald-700"
        isLoading={isUpdating || isUploadingAvatar}
      />
    </div>
  );
};

export default ProfileManagement;
