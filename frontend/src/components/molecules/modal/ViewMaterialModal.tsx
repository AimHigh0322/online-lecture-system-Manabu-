import React from "react";
import { X, Video, AlertCircle } from "lucide-react";

interface Material {
  type: "video" | "pdf";
  id: string;
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
}

interface ViewMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (material: Material) => void;
  material: Material | null;
}

export const ViewMaterialModal: React.FC<ViewMaterialModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  material,
}) => {
  if (!isOpen || !material) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-8 pb-0 flex-shrink-0">
          <h3 className="text-2xl font-bold text-slate-800">教材詳細情報</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-8 pt-6">
          <div className="space-y-6">
            {/* Player */}
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Video className="w-8 h-8 text-orange-600" />
                <div>
                  <h4 className="text-lg font-semibold text-slate-800">
                    {material.title}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {material.courseName}
                  </p>
                  {material.duration && (
                    <p className="text-xs text-slate-500 mt-1">
                      再生時間: {material.duration}
                    </p>
                  )}
                </div>
              </div>
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                {material.type === "video" ? (
                  <video
                  className="w-full h-full object-contain"
                  controls
                  preload="metadata"
                  onError={(e) => {
                    console.error("Video load error:", e);
                    const target = e.target as HTMLVideoElement;
                    const sourceElement = target.querySelector("source");
                    const videoUrl = sourceElement?.src;

                    console.error("Failed video URL:", videoUrl);
                    console.error("Selected material:", material);
                    console.error(
                      "Video URL from material:",
                      material.videoUrl
                    );
                    console.error(
                      "Current hostname:",
                      window.location.hostname
                    );
                    console.error(
                      "VITE_API_URL:",
                      import.meta.env.VITE_API_URL
                    );

                    target.style.display = "none";
                    const errorDiv = target.nextElementSibling as HTMLElement;
                    if (errorDiv) errorDiv.style.display = "flex";
                  }}
                >
                  <source
                    src={`${
                      import.meta.env.VITE_API_URL ||
                      "http://85.131.238.90:4000"
                    }${material.videoUrl || ""}`}
                    type="video/mp4"
                    onError={(e) => {
                      console.error("Source load error:", e);
                      const target = e.target as HTMLSourceElement;
                      console.error("Source URL that failed:", target.src);

                      // Test if the URL is accessible
                      fetch(target.src, { method: "HEAD" })
                        .then((response) => {
                          console.log(
                            "Video URL response:",
                            response.status,
                            response.statusText
                          );
                        })
                        .catch((err) => {
                          console.error("Video URL fetch error:", err);
                        });
                    }}
                  />
                  <p className="text-white p-4 text-center">
                    お使いのブラウザは動画の再生をサポートしていません。
                  </p>
                </video>
                ) : (
                  <iframe
                    className="w-full h-full bg-white"
                    src={`${
                      import.meta.env.VITE_API_URL ||
                      "http://85.131.238.90:4000"
                    }${material.pdfUrl || ""}#toolbar=1&navpanes=0&scrollbar=1`}
                    title="PDF Viewer"
                  />
                )}
                <div
                  className="absolute inset-0 bg-black flex items-center justify-center text-white"
                  style={{ display: "none" }}
                >
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                    <p className="text-sm">動画の読み込みに失敗しました</p>
                    <p className="text-xs text-gray-400 mt-1">
                      ファイルが見つからないか、形式がサポートされていません
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  タイトル
                </label>
                <p className="text-slate-800">{material.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  コース
                </label>
                <p className="text-slate-800">{material.courseName}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  説明
                </label>
                <p className="text-slate-800">{material.description}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  作成日
                </label>
                <p className="text-slate-800">
                  {formatDate(material.createdAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  作成者
                </label>
                <p className="text-slate-800">{material.uploadedBy}</p>
              </div>
              {/* Tags removed */}
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex gap-3 p-8 pt-4 border-t border-slate-200 flex-shrink-0">
          <button
            onClick={() => {
              onClose();
              onEdit(material);
            }}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            編集
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-lg transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewMaterialModal;
