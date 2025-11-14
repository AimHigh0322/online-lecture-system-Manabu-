import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Video,
  FileText,
  Save,
  X,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Search,
  Plus,
} from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { BossLayout } from "../../components/layout/AdminLayout";
import {
  ViewMaterialModal,
  EditMaterialModal,
} from "../../components/molecules/modal";
import { ConfirmModal } from "../../components/atom/ConfirmModal";
import { Pagination } from "../../components/atom/Pagination";

interface Material {
  type: "video" | "pdf";
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  videoUrl?: string;
  pdfUrl?: string;
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

export const MaterialManagement: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tags removed

  // State management
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(
    null
  );
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Material | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  // pagination (10 rows per page)
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  type MaterialType = "video" | "pdf";
  const [materialType, setMaterialType] = useState<MaterialType>("video");
  const [formData, setFormData] = useState<MaterialFormData>({
    title: "",
    description: "",
    courseId: "",
    courseName: "",
  });
  const [errors, setErrors] = useState<MaterialErrors>({});

  const fetchMaterials = React.useCallback(async () => {
    try {
      setLoading(true);
      const API_URL =
        import.meta.env.VITE_API_URL || "http://103.179.45.68:4000";
      const token = localStorage.getItem("authToken");

      const response = await fetch(`${API_URL}/api/materials`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Transform _id to id for frontend compatibility
        const transformedMaterials: Material[] =
          data.materials?.map(
            (material: {
              _id?: string;
              id?: string;
              type: string;
              title: string;
              description: string;
              courseId: string;
              courseName: string;
              videoUrl?: string;
              pdfUrl?: string;
              uploadedBy: string;
              createdAt: string;
              updatedAt: string;
              duration?: string;
              order?: number;
            }) => ({
              id: material._id || material.id,
              type: material.type === "pdf" ? "pdf" : "video",
              title: material.title,
              description: material.description,
              courseId: material.courseId,
              courseName: material.courseName,
              videoUrl: material.videoUrl,
              uploadedBy: material.uploadedBy,
              createdAt: material.createdAt,
              updatedAt: material.updatedAt,
              duration: material.duration,
              order: material.order,
            })
          ) || [];
        // Sort by order field
        const sortedMaterials = transformedMaterials.sort(
          (a: Material, b: Material) => a.order - b.order
        );
        setMaterials(sortedMaterials);
      } else {
        throw new Error("Failed to fetch materials");
      }
    } catch {
      showToast({
        type: "error",
        title: "エラー",
        message: "教材データの取得に失敗しました",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch materials on component mount
  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const filteredAndSortedMaterials = React.useMemo(() => {
    const filtered = materials.filter((material) => {
      const matchesSearch =
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.courseName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (typeof aValue === "string" && typeof bValue === "string") {
          const comparison = aValue
            .toLowerCase()
            .localeCompare(bValue.toLowerCase());
          return sortDirection === "asc" ? comparison : -comparison;
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          const comparison = aValue - bValue;
          return sortDirection === "asc" ? comparison : -comparison;
        }

        if (aValue && bValue) {
          const dateA = new Date(aValue as string);
          const dateB = new Date(bValue as string);
          const comparison = dateA.getTime() - dateB.getTime();
          return sortDirection === "asc" ? comparison : -comparison;
        }

        return 0;
      });
    }

    return filtered;
  }, [materials, searchTerm, sortField, sortDirection]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedMaterials.length / pageSize)
  );
  const startIndex = (page - 1) * pageSize;
  const pagedMaterials = React.useMemo(
    () => filteredAndSortedMaterials.slice(startIndex, startIndex + pageSize),
    [filteredAndSortedMaterials, startIndex, pageSize]
  );

  // Reset page to 1 when filters change and ensure page is within bounds
  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortField, sortDirection]);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const handleSort = (field: keyof Material) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Material actions
  const handleDetail = (material: Material) => {
    setSelectedMaterial(material);
    setShowDetailModal(true);
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      description: material.description,
      courseId: material.courseId,
      courseName: material.courseName,
    });
    setSelectedFile(null);
    setErrors({});
    setShowEditModal(true);
  };

  // Type adapter for ViewMaterialModal compatibility
  const handleEditForModal = (material: {
    type: "video" | "pdf";
    id?: string;
    _id?: string;
    title: string;
    description: string;
    courseId: string;
    courseName: string;
    videoUrl?: string;
    pdfUrl?: string;
    uploadedBy: string;
    createdAt: string;
    updatedAt: string;
    duration?: string;
    order?: number;
  }) => {
    // Convert ViewMaterialModal Material format to MaterialManagement Material format
    const convertedMaterial: Material = {
      type: material.type,
      id: material.id || material._id || "",
      title: material.title,
      description: material.description,
      courseId: material.courseId,
      courseName: material.courseName,
      videoUrl: material.videoUrl,
      pdfUrl: material.pdfUrl,
      uploadedBy: material.uploadedBy,
      createdAt: material.createdAt,
      updatedAt: material.updatedAt,
      duration: material.duration,
      order: material.order || 0,
    };
    handleEdit(convertedMaterial);
  };

  const handleDelete = (material: Material) => {
    setMaterialToDelete(material);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!materialToDelete) return;

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://103.179.45.68:4000";
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `${API_URL}/api/materials/${materialToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        showToast({
          type: "success",
          title: "削除完了",
          message: `${materialToDelete.title}を削除しました`,
          duration: 2000,
        });
        setShowConfirmModal(false);
        setMaterialToDelete(null);
        fetchMaterials();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete material");
      }
    } catch (error) {
      console.error("Delete error:", error);
      let errorMessage = "教材の削除に失敗しました";

      if (error instanceof Error) {
        if (error.message.includes("404")) {
          errorMessage = "教材が見つかりません";
        } else if (error.message.includes("500")) {
          errorMessage = "サーバー内部エラーが発生しました";
        } else {
          errorMessage = error.message;
        }
      }

      showToast({
        type: "error",
        title: "削除エラー",
        message: errorMessage,
        duration: 3000,
      });
      setShowConfirmModal(false);
      setMaterialToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setMaterialToDelete(null);
  };

  // Upload functionality
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      let isValid = true;
      if (materialType === "video") {
        const allowedMimeTypes = [
          "video/mp4",
          "video/avi",
          "video/x-msvideo",
          "video/quicktime",
          "video/x-ms-wmv",
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
          isValid = false;
          showToast({
            type: "error",
            title: "ファイル形式エラー",
            message:
              "サポートされている動画形式を選択してください。対応形式: MP4, AVI, MOV, WMV, WebM, OGG",
          });
        }
        const maxSize = 100 * 1024 * 1024;
        if (file.size > maxSize) {
          isValid = false;
          showToast({
            type: "error",
            title: "ファイルサイズエラー",
            message: "動画の最大サイズは100MBです。",
          });
        }
      } else {
        if (
          file.type !== "application/pdf" &&
          !file.name.toLowerCase().endsWith(".pdf")
        ) {
          isValid = false;
          showToast({
            type: "error",
            title: "ファイル形式エラー",
            message: "PDFファイルを選択してください。",
          });
        }
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
          isValid = false;
          showToast({
            type: "error",
            title: "ファイルサイズエラー",
            message: "PDFの最大サイズは50MBです。",
          });
        }
      }

      if (!isValid) return;

      setSelectedFile(file);
      setErrors({ ...errors, video: undefined });
    }
  };

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

  const validateForm = (isEdit: boolean = false): boolean => {
    const newErrors: MaterialErrors = {};

    if (!isEdit && !selectedFile) {
      newErrors.video = "動画ファイルを選択してください";
    }

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
      showToast({
        type: "error",
        title: "入力エラー",
        message: "必須項目を確認してください。",
      });
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

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      submitData.append("uploadedBy", user.username || user.email || "admin");

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const API_URL =
        import.meta.env.VITE_API_URL || "http://103.179.45.68:4000";
      const endpoint =
        materialType === "video"
          ? `${API_URL}/api/materials/upload`
          : `${API_URL}/api/materials/upload-pdf`;
      const response = await fetch(endpoint, {
        method: "POST",
        body: submitData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        showToast({
          type: "success",
          title: "アップロード完了",
          message: "教材が正常にアップロードされました。",
        });

        // Reset form and close modal
        setSelectedFile(null);
        setFormData({
          title: "",
          description: "",
          courseId: "",
          courseName: "",
        });
        setMaterialType("video");
        setErrors({});
        setShowUploadModal(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Refresh materials list
        fetchMaterials();
      } else {
        showToast({
          type: "error",
          title: "アップロード失敗",
          message: result.message || "教材のアップロードに失敗しました。",
        });
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

  const handleUpdate = async (updateData: Partial<Material>) => {
    if (!editingMaterial) return;

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://103.179.45.68:4000";
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `${API_URL}/api/materials/${editingMaterial.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        showToast({
          type: "success",
          title: "更新完了",
          message: "教材が正常に更新されました。",
        });

        // Reset form and close modal
        setSelectedFile(null);
        setFormData({
          title: "",
          description: "",
          courseId: "",
          courseName: "",
        });
        setErrors({});
        setShowEditModal(false);
        setEditingMaterial(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Refresh materials list
        fetchMaterials();
      } else {
        throw new Error(result.message || "教材の更新に失敗しました。");
      }
    } catch (error) {
      console.error("Update error:", error);
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
        title: "更新エラー",
        message: errorMessage,
      });
      throw error; // Re-throw to let the modal handle it
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (loading) {
    return (
      <BossLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">教材データを読み込み中...</p>
          </div>
        </div>
      </BossLayout>
    );
  }

  return (
    <BossLayout>
      <div className="p-3 md:p-6">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3 md:mb-4 cursor-pointer text-sm md:text-base"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            管理画面に戻る
          </button>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
            教材管理
          </h2>
          <p className="text-sm md:text-base text-slate-600">
            学習教材の管理と新しい動画の追加ができます
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center justify-between pb-3 md:pb-4">
          {/* Search */}
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
            <input
              type="text"
              placeholder="教材名、説明、コース名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 md:pl-10 pr-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Add Material Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm md:text-base whitespace-nowrap"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            教材追加
          </button>
        </div>

        {/* Materials Table */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-2 md:px-6 py-2 text-center text-xs md:text-sm font-semibold text-slate-800">
                    番号
                  </th>
                  <th className="px-2 md:px-6 py-2 text-center text-xs md:text-sm font-semibold text-slate-800">
                    <button
                      onClick={() => handleSort("title")}
                      className="inline-block hover:text-orange-600 transition-colors cursor-pointer truncate"
                    >
                      教材情報
                    </button>
                  </th>
                  <th className="px-2 md:px-6 py-2 text-center text-xs md:text-sm font-semibold text-slate-800 hidden md:table-cell">
                    種別
                  </th>
                  <th className="px-2 md:px-6 py-2 text-center text-xs md:text-sm font-semibold text-slate-800 hidden lg:table-cell">
                    <button
                      onClick={() => handleSort("courseName")}
                      className="inline-block hover:text-orange-600 transition-colors cursor-pointer"
                    >
                      コース
                    </button>
                  </th>
                  <th className="px-2 md:px-6 py-2 text-center text-xs md:text-sm font-semibold text-slate-800 hidden md:table-cell">
                    <button
                      onClick={() => handleSort("createdAt")}
                      className="inline-block hover:text-orange-600 transition-colors cursor-pointer"
                    >
                      作成日
                    </button>
                  </th>
                  <th className="px-2 md:px-6 py-2 text-center text-xs md:text-sm font-semibold text-slate-800">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pagedMaterials.map((material, idx) => (
                  <tr key={material.id} className="hover:bg-slate-50">
                    <td className="px-2 md:px-6 py-2 text-center">
                      <span className="text-xs md:text-sm font-medium text-slate-600">
                        {startIndex + idx + 1}
                      </span>
                    </td>
                    <td className="px-2 md:px-6 py-2 text-center">
                      <div className="flex items-center justify-center space-x-2 md:space-x-3">
                        <div
                          className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            material.type === "pdf"
                              ? "bg-purple-100"
                              : "bg-orange-100"
                          }`}
                        >
                          {material.type === "pdf" ? (
                            <FileText className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                          ) : (
                            <Video className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-center">
                          <div className="font-medium text-slate-800 truncate text-xs md:text-sm">
                            {material.title}
                          </div>
                          <div className="text-xs text-slate-500 truncate hidden md:block">
                            {material.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 md:px-6 py-2 text-center hidden md:table-cell">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-xs font-medium ${
                          material.type === "pdf"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {material.type === "pdf" ? "文書" : "動画"}
                      </span>
                    </td>
                    <td className="px-2 md:px-6 py-2 text-center hidden lg:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {material.courseName}
                      </span>
                    </td>
                    <td className="px-2 md:px-6 py-2 text-center text-xs md:text-sm text-slate-600 hidden md:table-cell">
                      {formatDate(material.createdAt)}
                    </td>
                    <td className="px-2 md:px-6 py-2">
                      <div className="flex items-center justify-center space-x-1 md:space-x-2">
                        <button
                          onClick={() => handleDetail(material)}
                          className="p-1.5 md:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="詳細表示"
                        >
                          <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(material)}
                          className="p-1.5 md:p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors cursor-pointer"
                          title="編集"
                        >
                          <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(material)}
                          className="p-1.5 md:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAndSortedMaterials.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">
                <Video className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-slate-600">
                {searchTerm
                  ? "条件に一致する教材が見つかりません"
                  : "まだ教材が登録されていません"}
              </p>
            </div>
          )}
          {/* Pagination - only show if more than 10 items */}
          {filteredAndSortedMaterials.length > 10 && totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={(p) => setPage(p)}
            />
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/60 bg-opacity-30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-800">
                  新しい教材を追加
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type & File Upload Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      ファイル種別 *
                    </label>
                    <div className="inline-flex items-center rounded-lg border border-gray-300 overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setMaterialType("video")}
                        className={`${
                          materialType === "video"
                            ? "bg-orange-600 text-white"
                            : "bg-white text-slate-700 hover:bg-slate-50"
                        } px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer`}
                        aria-pressed={materialType === "video"}
                      >
                        動画
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaterialType("pdf")}
                        className={`${
                          materialType === "pdf"
                            ? "bg-orange-600 text-white"
                            : "bg-white text-slate-700 hover:bg-slate-50"
                        } px-3 py-1.5 text-sm font-medium border-l border-gray-300 transition-colors cursor-pointer`}
                        aria-pressed={materialType === "pdf"}
                      >
                        PDF
                      </button>
                    </div>
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ファイル *
                  </label>

                  {!selectedFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 cursor-pointer transition-colors"
                    >
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600 mb-2">
                        ファイルを選択
                      </p>
                      <p className="text-sm text-gray-500">
                        クリックしてファイルを選択するか、ドラッグ&ドロップしてください
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {materialType === "video"
                          ? "対応形式: MP4, AVI, MOV, WMV, WebM, OGG (最大100MB)"
                          : "対応形式: PDF (最大50MB)"}
                      </p>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Video className="w-8 h-8 text-orange-500 mr-3" />
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
                    accept={
                      materialType === "video"
                        ? "video/mp4,video/avi,video/x-msvideo,video/quicktime,video/x-ms-wmv,video/webm,video/ogg,.mp4,.avi,.mov,.wmv,.webm,.ogg"
                        : "application/pdf,.pdf"
                    }
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
                        errors.description
                          ? "border-red-500"
                          : "border-gray-300"
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

                  {/* Tags removed */}
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Loader2 className="w-5 h-5 text-orange-500 mr-2 animate-spin" />
                      <span className="text-sm font-medium text-orange-700">
                        アップロード中... {uploadProgress}%
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
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-lg transition-colors cursor-pointer"
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
        )}

        {/* Edit Modal */}
        <EditMaterialModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdate}
          material={editingMaterial}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title="削除の確認"
          message={
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-red-800 font-medium">
                    この操作は取り消せません
                  </p>
                  <p className="text-red-600 text-sm">
                    教材と関連する動画ファイルが完全に削除されます
                  </p>
                </div>
              </div>

              {materialToDelete && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    削除する教材:
                  </h4>
                  <p className="text-gray-700 font-semibold">
                    {materialToDelete.title}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    {materialToDelete.courseName}
                  </p>
                </div>
              )}

              <p className="text-gray-700 text-center">
                <span className="font-semibold">{materialToDelete?.title}</span>
                を削除しますか？
              </p>
            </div>
          }
          confirmText="削除する"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
        />

        {/* Detail Modal */}
        <ViewMaterialModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onEdit={handleEditForModal}
          material={selectedMaterial}
        />
      </div>
    </BossLayout>
  );
};

export default MaterialManagement;
