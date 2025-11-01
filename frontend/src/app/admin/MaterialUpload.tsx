import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Video,
  Save,
  X,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "../../hooks/useToast";

interface MaterialFormData {
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  tags: string;
}

interface MaterialErrors {
  video?: string;
  title?: string;
  description?: string;
  courseId?: string;
}

const courseOptions = [
  { id: "general", name: "一般講習" },
  { id: "caregiving", name: "介護講習" },
  { id: "specified-care", name: "介護基礎研修（特定）" },
  { id: "initial-care", name: "介護職員初任者研修" },
  { id: "jlpt", name: "日本語能力試験対策" },
  { id: "business-manner", name: "ビジネスマナー講習" },
];

const MaterialUpload: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<MaterialFormData>({
    title: "",
    description: "",
    courseId: "",
    courseName: "",
    tags: "",
  });
  const [errors, setErrors] = useState<MaterialErrors>({});
  const [isCheckingTitle, setIsCheckingTitle] = useState(false);
  const [titleExists, setTitleExists] = useState(false);
  const titleCheckTimeoutRef = useRef<number | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (titleCheckTimeoutRef.current) {
        clearTimeout(titleCheckTimeoutRef.current);
      }
    };
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type - explicitly check for supported video formats
      const allowedMimeTypes = [
        "video/mp4",
        "video/avi",
        "video/x-msvideo", // Alternative AVI MIME type
        "video/quicktime", // MOV files
        "video/x-ms-wmv", // WMV files
        "video/webm",
        "video/ogg",
      ];

      const fileExtension = file.name.toLowerCase().split(".").pop();
      const allowedExtensions = ["mp4", "avi", "mov", "wmv", "webm", "ogg"];

      if (
        !file.type.startsWith("video/") &&
        !allowedMimeTypes.includes(file.type) &&
        !allowedExtensions.includes(fileExtension || "")
      ) {
        showToast({
          type: "error",
          title: "ファイル形式エラー",
          message:
            "サポートされている動画形式を選択してください。対応形式: MP4, AVI, MOV, WMV, WebM, OGG",
        });
        return;
      }

      // Validate file size (100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        showToast({
          type: "error",
          title: "ファイルサイズエラー",
          message: "ファイルサイズは100MB以下にしてください。",
        });
        return;
      }

      setSelectedFile(file);
      setErrors({ ...errors, video: undefined });
    }
  };

  // Function to check if title exists
  const checkTitleExists = async (title: string) => {
    if (!title.trim()) {
      setTitleExists(false);
      return;
    }

    // Don't check if no course is selected
    if (!formData.courseId) {
      setTitleExists(false);
      return;
    }

    setIsCheckingTitle(true);
    try {
      const response = await fetch(
        `/api/materials/check-title?title=${encodeURIComponent(
          title.trim()
        )}&courseId=${encodeURIComponent(formData.courseId)}`
      );
      const result = await response.json();

      if (result.success) {
        setTitleExists(result.exists);

        if (result.exists) {
          showToast({
            type: "info",
            title: "タイトル重複",
            message: `このコース内で「${title.trim()}」というタイトルの教材は既に存在します。`,
          });
        }
      }
    } catch (error) {
      console.error("Error checking title:", error);
    } finally {
      setIsCheckingTitle(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when user starts typing
    if (errors[name as keyof MaterialErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }

    // Check for duplicate title when title field changes
    if (name === "title") {
      setTitleExists(false);

      // Clear previous timeout
      if (titleCheckTimeoutRef.current) {
        clearTimeout(titleCheckTimeoutRef.current);
      }

      // Debounce the API call
      titleCheckTimeoutRef.current = setTimeout(() => {
        checkTitleExists(value);
      }, 500);
    }
  };

  const handleCourseSelect = (value: string) => {
    const selectedCourse = courseOptions.find((course) => course.id === value);
    setFormData((prev) => ({
      ...prev,
      courseId: value,
      courseName: selectedCourse?.name || "",
    }));

    // Clear error when user selects a course
    if (errors.courseId) {
      setErrors({ ...errors, courseId: undefined });
    }

    // Re-check title existence for the new course if title is already entered
    if (formData.title.trim()) {
      // Clear previous timeout
      if (titleCheckTimeoutRef.current) {
        clearTimeout(titleCheckTimeoutRef.current);
      }

      // Debounce the API call
      titleCheckTimeoutRef.current = setTimeout(() => {
        checkTitleExists(formData.title);
      }, 300);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: MaterialErrors = {};

    if (!selectedFile) {
      newErrors.video = "動画ファイルを選択してください";
    }

    if (!formData.title.trim()) {
      newErrors.title = "タイトルは必須です";
    } else if (titleExists) {
      newErrors.title = "このコース内で同じタイトルは既に使用されています";
    }

    if (!formData.description.trim()) {
      newErrors.description = "説明は必須です";
    }

    if (!formData.courseId) {
      newErrors.courseId = "コースを選択してください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Check if the validation failure is due to duplicate title
      if (titleExists) {
        showToast({
          type: "info",
          title: "タイトル重複",
          message:
            "このコース内で同じタイトルの教材が既に存在します。別のタイトルを入力してください。",
        });
      } else {
        showToast({
          type: "error",
          title: "入力エラー",
          message: "必須項目を確認してください。",
        });
      }
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const submitData = new FormData();
      submitData.append("video", selectedFile!);
      submitData.append("title", formData.title.trim());
      submitData.append("description", formData.description.trim());
      submitData.append("courseId", formData.courseId);
      submitData.append("courseName", formData.courseName);
      submitData.append("tags", formData.tags);

      // Get user info from localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      submitData.append("uploadedBy", user.username || user.email || "admin");

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/materials/upload", {
        method: "POST",
        body: submitData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (result.success) {
        showToast({
          type: "success",
          title: "アップロード完了",
          message: "教材が正常にアップロードされました。",
        });

        // Reset form
        setSelectedFile(null);
        setFormData({
          title: "",
          description: "",
          courseId: "",
          courseName: "",
          tags: "",
        });
        setErrors({});
        setTitleExists(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        // Handle duplicate title error specifically
        if (
          response.status === 409 &&
          result.message.includes("既に存在します")
        ) {
          showToast({
            type: "info",
            title: "タイトル重複",
            message:
              "このコース内で同じタイトルの教材が既に存在します。別のタイトルを入力してください。",
          });
          setTitleExists(true);
          setErrors({ ...errors, title: "このタイトルは既に使用されています" });
        } else {
          showToast({
            type: "error",
            title: "アップロード失敗",
            message: result.message || "教材のアップロードに失敗しました。",
          });
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      let errorMessage = "ネットワークエラーが発生しました。";

      if (error instanceof Error) {
        if (error.message.includes("404")) {
          errorMessage =
            "サーバーが見つかりません。バックエンドサーバーが起動しているか確認してください。";
        } else if (error.message.includes("500")) {
          errorMessage = "サーバー内部エラーが発生しました。";
        } else {
          errorMessage = error.message;
        }
      }

      showToast({
        type: "error",
        title: "アップロードエラー",
        message: errorMessage,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            管理画面に戻る
          </button>
          <h1 className="text-3xl font-bold text-gray-900">教材アップロード</h1>
          <p className="mt-2 text-gray-600">
            動画ファイルをアップロードして学習教材を作成します
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Video Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                動画ファイル *
              </label>

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 cursor-pointer transition-colors"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-600 mb-2">
                    動画ファイルを選択
                  </p>
                  <p className="text-sm text-gray-500">
                    クリックしてファイルを選択するか、ドラッグ&ドロップしてください
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    対応形式: MP4, AVI, MOV, WMV (最大100MB)
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Video className="w-8 h-8 text-blue-500 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/avi,video/x-msvideo,video/quicktime,video/x-ms-wmv,video/webm,video/ogg,.mp4,.avi,.mov,.wmv,.webm,.ogg"
                onChange={handleFileSelect}
                className="hidden"
              />

              {errors.video && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.video}
                </p>
              )}
            </div>

            {/* Material Information */}
            <div className="grid grid-cols-1 gap-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.title
                        ? "border-red-500 focus:ring-red-500"
                        : titleExists
                        ? "border-orange-400 focus:ring-orange-400"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="教材のタイトルを入力してください"
                  />
                  {isCheckingTitle && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    </div>
                  )}
                </div>
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.title}
                  </p>
                )}
                {titleExists && !errors.title && (
                  <p className="mt-2 text-sm text-blue-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    このコース内で同じタイトルの教材は既に存在します
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  説明 *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="教材の説明を入力してください"
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  コース *
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => handleCourseSelect(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.courseId ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">コースを選択してください</option>
                  {courseOptions.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タグ
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="タグをカンマ区切りで入力 (例: 基礎, 文法, 会話)"
                />
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Loader2 className="w-5 h-5 text-blue-500 mr-2 animate-spin" />
                  <span className="text-sm font-medium text-blue-700">
                    アップロード中... {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    アップロード中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    保存
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MaterialUpload;
