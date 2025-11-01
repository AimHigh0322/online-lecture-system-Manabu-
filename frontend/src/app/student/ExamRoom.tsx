import React, { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import {
  Play,
  Users,
  Award,
  Shield,
  AlertCircle,
  XCircle,
  Camera,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import { loadModels, getFaceDescriptorFromImage } from "../../lib/face";

export const ExamRoom: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [showStartModal, setShowStartModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [faceVerified, setFaceVerified] = useState(false);
  const [verifyingFace, setVerifyingFace] = useState(false);

  const webcamRef = useRef<Webcam>(null);

  // Load face-api models on mount
  useEffect(() => {
    loadModels();
  }, []);

  // Capture image from webcam and verify face
  const captureImage = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setFaceVerified(false); // Reset verification status
      
      // Automatically verify face after capture
      try {
        setVerifyingFace(true);
        
        // Convert base64 → File object for face-api
        if (!imageSrc) {
          setVerifyingFace(false);
          showToast({
            type: "error",
            title: "エラー",
            message: "画像の取得に失敗しました。もう一度撮影してください。",
          });
          return;
        }
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        const file = new File([blob], "capture.png", { type: "image/png" });

        // Get face descriptor
        const descriptor = await getFaceDescriptorFromImage(file);
        if (!descriptor) {
          setVerifyingFace(false);
          showToast({
            type: "error",
            title: "顔検出エラー",
            message: "顔を検出できませんでした。もう一度撮影してください。",
          });
          return;
        }

        const descriptorArray = Array.from(descriptor);

        // Call backend to verify
        const token = localStorage.getItem("authToken");
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

        const res = await fetch(`${API_URL}/api/student/exams/verify-face`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ faceDescriptor: descriptorArray }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setFaceVerified(true);
          showToast({
            type: "success",
            title: "顔認証成功",
            message: "顔認証に成功しました。学習を開始できます。",
          });
        } else {
          setFaceVerified(false);
          showToast({
            type: "error",
            title: "認証失敗",
            message: data.message || "顔認証に失敗しました。もう一度撮影してください。",
          });
        }
      } catch (error: any) {
        setFaceVerified(false);
        showToast({
          type: "error",
          title: "エラー",
          message: error.message || "顔認証中にエラーが発生しました。",
        });
      } finally {
        setVerifyingFace(false);
      }
    }
  };

  const handleStartTest = async () => {
    if (!capturedImage || !faceVerified) {
      showToast({
        type: "error",
        title: "顔認証が必要です",
        message: "学習を開始するには、顔認証に成功する必要があります。",
      });
      return;
    }

    // ✅ Already verified, proceed to exam
    setShowStartModal(false);
    navigate("/exam-taking");
  };

  return (
    <div className="min-h-screen">
      {/* Hero Image Section */}
      <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden">
        <img
          src="/img/exam.jpg"
          alt="試験ルーム"
          className="w-full h-full object-cover"
        />
        <div className="absolute bg-black/20 inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              試験ルーム
            </h1>
            <p className="text-lg md:text-xl max-w-[700px] mx-auto">
              オンライン講習システム試験で、あなたの知識をテストしましょう
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side */}
            <div className="flex flex-col justify-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                オンライン学習で、スキルアップ！
              </h2>
              <p className="text-xl text-gray-600 mb-4">多くの学習者が選んだ</p>
              <p className="text-2xl font-semibold text-gray-800 mb-8">
                学ぼう国際研修センター オンライン講習システム
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-700">多様な学習コンテンツ</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Award className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-700">進捗管理システム</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-700">安全な学習環境</span>
                </div>
              </div>

              <button
                onClick={() => setShowStartModal(true)}
                className="w-full max-w-md px-8 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 font-semibold text-lg shadow-lg flex items-center justify-center space-x-3"
              >
                <Play className="w-6 h-6" />
                <span>学習を始める</span>
              </button>
            </div>

            {/* Right Side */}
            <div className="relative">
              <div
                className="h-96 bg-cover bg-center bg-no-repeat rounded-2xl shadow-xl"
                style={{ backgroundImage: `url('/img/exam1.jpg')` }}
              />
              <div className="absolute inset-0 bg-gray-900/10 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Test Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 tracking-wide">学習開始確認</h3>
                  <p className="text-sm text-gray-500 mt-1">顔認証を行って試験を開始します</p>
                </div>
                <button
                  onClick={() => {
                    setShowStartModal(false);
                    setCapturedImage(null);
                    setFaceVerified(false);
                    setVerifyingFace(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="px-8 py-8">
              {/* Webcam Preview */}
              <div className="text-center mb-6">
                {!capturedImage ? (
                  <>
                    <div className="relative w-72 h-72 mx-auto rounded-lg overflow-hidden shadow-lg bg-gray-100">
                      <Webcam
                        ref={webcamRef}
                        screenshotFormat="image/png"
                        videoConstraints={{
                          width: 288,
                          height: 288,
                          facingMode: "user",
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-4 font-medium">カメラの前に顔を向けてください</p>
                    <button
                      onClick={captureImage}
                      disabled={verifyingFace}
                      className="mt-6 px-6 py-3 bg-orange-500 text-white rounded-lg flex items-center justify-center gap-3 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg mx-auto"
                    >
                      <Camera className="w-5 h-5" /> 
                      <span className="font-medium">{verifyingFace ? "認証中..." : "写真を撮る"}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="relative w-72 h-72 mx-auto rounded-lg overflow-hidden shadow-lg bg-gray-100">
                      <img
                        src={capturedImage}
                        alt="Captured face"
                        className="w-full h-full object-cover"
                      />
                      {verifyingFace && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent mx-auto mb-3"></div>
                            <div className="text-white text-base font-medium">認証中...</div>
                          </div>
                        </div>
                      )}
                      {faceVerified && (
                        <div className="absolute top-3 right-3 bg-green-500 rounded-full p-2 shadow-lg">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      {faceVerified ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <p className="text-base font-semibold">顔認証に成功しました</p>
                        </div>
                      ) : verifyingFace ? (
                        <p className="text-sm text-gray-500 font-medium">認証を確認中...</p>
                      ) : (
                        <p className="text-sm text-red-600 font-medium">顔認証に失敗しました</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setCapturedImage(null);
                        setFaceVerified(false);
                        setVerifyingFace(false);
                      }}
                      disabled={verifyingFace}
                      className="mt-4 px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      再撮影
                    </button>
                  </>
                )}
              </div>

              {/* 注意事項 Box */}
              <div className="bg-orange-50 rounded-md p-5 text-left">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-2 text-gray-900">注意事項</p>
                    <ul className="space-y-1.5">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>学習中は集中して取り組んでください</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>進捗は自動的に保存されます</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>試験開始には顔認証が必要です</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => {
                  setShowStartModal(false);
                  setCapturedImage(null);
                  setFaceVerified(false);
                  setVerifyingFace(false);
                }}
                className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
                disabled={verifyingFace}
              >
                キャンセル
              </button>
              <button
                onClick={handleStartTest}
                disabled={!faceVerified}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg font-medium"
              >
                <Play className="w-5 h-5" />
                <span>学習開始</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamRoom;
