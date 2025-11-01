import React, { useState } from "react";
import { X, AlertCircle, Loader2, Save } from "lucide-react";

interface Material {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  tags?: string | number | null;
  videoUrl: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  duration?: string;
  order: number;
}

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

interface EditMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedData: Partial<Material>) => Promise<void>;
  material: Material | null;
}

export const EditMaterialModal: React.FC<EditMaterialModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  material,
}) => {
  const [formData, setFormData] = useState<MaterialFormData>({
    title: "",
    description: "",
    courseId: "",
    courseName: "",
    tags: "",
  });
  const [errors, setErrors] = useState<MaterialErrors>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Initialize form data when material changes
  React.useEffect(() => {
    if (material && isOpen) {
      setFormData({
        title: material.title,
        description: material.description,
        courseId: material.courseId,
        courseName: material.courseName,
        tags: typeof material.tags === "string" ? material.tags : "",
      });
      setErrors({});
    }
  }, [material, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name as keyof MaterialErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleCourseSelect = (value: string) => {
    const selectedCourse = courseOptions.find((course) => course.id === value);
    setFormData((prev) => ({
      ...prev,
      courseId: value,
      courseName: selectedCourse?.name || "",
    }));

    if (errors.courseId) {
      setErrors({ ...errors, courseId: undefined });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: MaterialErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "タイトルは必須です";
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
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        courseId: formData.courseId,
        courseName: formData.courseName,
        tags: formData.tags,
      };

      await onUpdate(updateData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Reset form and close modal
      setFormData({
        title: "",
        description: "",
        courseId: "",
        courseName: "",
        tags: "",
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen || !material) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-800">教材を編集</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Material Information */}
          <div className="grid grid-cols-1 gap-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タイトル *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.title ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="教材のタイトルを入力してください"
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.title}
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="タグをカンマ区切りで入力 (例: 基礎, 文法, 会話)"
              />
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Loader2 className="w-5 h-5 text-orange-500 mr-2 animate-spin" />
                <span className="text-sm font-medium text-orange-700">
                  更新中... {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  更新中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  更新
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMaterialModal;
