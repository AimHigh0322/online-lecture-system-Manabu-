import React, { useState, useRef, useEffect } from "react";
import { X, Camera, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import {
  getFaceDescriptorFromVideo,
  compareDescriptors,
  loadModels,
} from "../../lib/face";
import { getStoredUser } from "../../api/auth/authService";

interface FaceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifySuccess: () => void;
}

export const FaceVerificationModal: React.FC<FaceVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerifySuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadModels().then(() => {
        setModelsLoaded(true);
        startCamera();
      });
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus("カメラが起動しました。顔をカメラに向けてください。");
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(
        "カメラへのアクセスに失敗しました。カメラの権限を確認してください。"
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleVerify = async () => {
    if (!videoRef.current || !modelsLoaded) {
      setError("カメラまたはモデルの読み込みが完了していません。");
      return;
    }

    setIsVerifying(true);
    setError(null);
    setStatus("顔認証を実行中...");

    try {
      // Get face descriptor from webcam
      const currentDescriptor = await getFaceDescriptorFromVideo(
        videoRef.current
      );

      if (!currentDescriptor) {
        setError("顔が検出されませんでした。カメラに顔を向けてください。");
        setIsVerifying(false);
        return;
      }

      // Get stored user face descriptor
      const user = getStoredUser();
      if (!user || !user.faceDescriptor) {
        setError("登録時の顔データが見つかりません。");
        setIsVerifying(false);
        return;
      }

      // Convert stored descriptor (number[]) to Float32Array
      const storedDescriptor = new Float32Array(user.faceDescriptor);

      // Compare faces
      const isMatch = compareDescriptors(
        currentDescriptor,
        storedDescriptor,
        0.6
      );

      if (isMatch) {
        setStatus("認証成功！");
        setTimeout(() => {
          stopCamera();
          onVerifySuccess();
        }, 1000);
      } else {
        setError("顔認証に失敗しました。登録時の顔写真と一致しません。");
        setIsVerifying(false);
      }
    } catch (err) {
      console.error("Face verification error:", err);
      setError("顔認証中にエラーが発生しました。もう一度お試しください。");
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setError(null);
    setStatus("");
    setIsVerifying(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-800 flex items-center">
            <Camera className="w-6 h-6 mr-3 text-orange-600" />
            顔認証
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isVerifying}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Video Preview */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
            {videoRef.current?.srcObject ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-white text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                <p>カメラを起動中...</p>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {status && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-3" />
                <p className="text-blue-700">{status}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">認証手順</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>1. カメラに顔を向けてください</li>
              <li>2. 十分な明るさを確保してください</li>
              <li>3. 「認証開始」ボタンをクリックしてください</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
              disabled={isVerifying}
            >
              キャンセル
            </button>
            <button
              onClick={handleVerify}
              disabled={
                isVerifying || !modelsLoaded || !videoRef.current?.srcObject
              }
              className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  認証中...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  認証開始
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
