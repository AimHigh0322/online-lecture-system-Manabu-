import React, { useState, useEffect, useCallback, useRef } from "react";
import { Clock, CheckCircle, Camera, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetQuestionsQuery } from "../../api/admin/questionApiSlice";
import Webcam from "react-webcam";
import { loadModels, getFaceDescriptorFromVideo } from "../../lib/face";
import { useToast } from "../../hooks/useToast";

interface Question {
  _id: string;
  type: "true_false" | "single_choice" | "multiple_choice";
  title: string;
  content: string;
  courseId: string;
  courseName: string;
  correctAnswer?: boolean | null;
  estimatedTime: number;
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    order: number;
  }>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  userAnswer?: string | string[] | boolean;
}

interface ExamData {
  id: string;
  title: string;
  duration: number; // in minutes (calculated from question estimated times)
  questions: Question[];
  totalQuestions: number;
}

interface ExamSettings {
  timeLimit: number;
  numberOfQuestions: number;
  passingScore: number;
}

export const ExamTaking: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const webcamRef = useRef<Webcam>(null);
  const faceVerificationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const examStartTimeRef = useRef<number | null>(null);
  const timeRemainingRef = useRef<number>(0);

  const [examData, setExamData] = useState<ExamData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examSettings, setExamSettings] = useState<ExamSettings | null>(null);
  const [answers, setAnswers] = useState<{
    [key: string]: string | string[] | boolean;
  }>({});
  const [faceVerificationStatus, setFaceVerificationStatus] = useState<{
    isVerified: boolean;
    message: string;
    showMessage: boolean;
  }>({
    isVerified: false,
    message: "",
    showMessage: false,
  });
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isExamPaused, setIsExamPaused] = useState(false);
  const [showReauthenticationModal, setShowReauthenticationModal] = useState(false);
  const modalWebcamRef = useRef<Webcam>(null);
  const [isReauthenticating, setIsReauthenticating] = useState(false);

  // Fetch exam settings
  const fetchExamSettings = useCallback(async () => {
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://85.131.238.90:4000";
      const token = localStorage.getItem("authToken");

      const response = await fetch(`${API_URL}/api/exam/settings`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setExamSettings(data.settings);
        }
      } else {
        // If no settings exist, use default values
        setExamSettings({
          timeLimit: 60,
          numberOfQuestions: 20,
          passingScore: 70,
        });
      }
    } catch (error) {
      console.error("Error fetching exam settings:", error);
      // Use default values on error
      setExamSettings({
        timeLimit: 60,
        numberOfQuestions: 20,
        passingScore: 70,
      });
    }
  }, []);

  // Load face-api models on mount
  useEffect(() => {
    loadModels();
  }, []);

  // Fetch exam settings on component mount
  useEffect(() => {
    fetchExamSettings();
  }, [fetchExamSettings]);

  // Fetch questions from API
  const {
    data: questionsResponse,
    isLoading,
    error,
  } = useGetQuestionsQuery({
    limit: examSettings?.numberOfQuestions || 20, // Use admin setting for number of questions
  });

  // Process API data into exam format
  useEffect(() => {
    if (
      questionsResponse?.success &&
      questionsResponse.questions &&
      examSettings
    ) {
      const questions = questionsResponse.questions.map((q) => ({
        ...q,
        type: q.type as "true_false" | "single_choice" | "multiple_choice",
        userAnswer: undefined,
      }));

      // Use the time limit from exam settings
      const totalDurationMinutes = examSettings.timeLimit;

      const examData: ExamData = {
        id: "standalone-exam",
        title: "オンライン講習システム 総合試験",
        duration: totalDurationMinutes, // Calculated from question estimated times
        totalQuestions: questions.length,
        questions,
      };

      setExamData(examData);
      const initialTime = examData.duration * 60;
      setTimeRemaining(initialTime); // Convert to seconds
      timeRemainingRef.current = initialTime;
      // Mark exam as started when data is loaded
      if (!isExamStarted) {
        setIsExamStarted(true);
        examStartTimeRef.current = Date.now();
      }
    }
  }, [questionsResponse, examSettings, isExamStarted]);

  // Face verification function
  const performFaceVerification = useCallback(async (isModalVerification = false) => {
    const webcamReference = isModalVerification ? modalWebcamRef : webcamRef;
    
    if (!webcamReference.current?.video) {
      console.warn("Webcam video element not available");
      if (!isModalVerification) {
        // If it's not modal verification and camera is not available, pause exam
        setIsExamPaused(true);
        setShowReauthenticationModal(true);
        if (faceVerificationIntervalRef.current) {
          clearInterval(faceVerificationIntervalRef.current);
          faceVerificationIntervalRef.current = null;
        }
        showToast({
          type: "error",
          title: "試験中断",
          message: "カメラが利用できません。再認証が必要です。",
        });
      }
      return false;
    }

    try {
      const video = webcamReference.current.video;
      const descriptor = await getFaceDescriptorFromVideo(video);

      if (!descriptor) {
        console.warn("No face detected in video frame");
        if (isModalVerification) {
          // In modal, just show error message
          showToast({
            type: "error",
            title: "顔検出エラー",
            message: "顔を検出できませんでした。カメラの前に顔を向けてください。",
          });
        } else {
          // In regular verification, pause exam and show modal
          setIsExamPaused(true);
          setShowReauthenticationModal(true);
          // Clear face verification interval
          if (faceVerificationIntervalRef.current) {
            clearInterval(faceVerificationIntervalRef.current);
            faceVerificationIntervalRef.current = null;
          }
          setFaceVerificationStatus({
            isVerified: false,
            message: "顔を検出できませんでした",
            showMessage: false,
          });
          showToast({
            type: "error",
            title: "試験中断",
            message: "顔を検出できませんでした。再認証が必要です。",
          });
        }
        return false;
      }

      const descriptorArray = Array.from(descriptor);
      const token = localStorage.getItem("authToken");
      const API_URL = import.meta.env.VITE_API_URL || "http://85.131.238.90:4000";

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
        // Face verification successful
        if (isModalVerification) {
          // Modal verification successful - resume exam
          setIsExamPaused(false);
          setShowReauthenticationModal(false);
          setIsReauthenticating(false);
          showToast({
            type: "success",
            title: "再認証成功",
            message: "顔認証に合格しました。試験を再開します。",
          });
        } else {
          // Regular verification successful
          setFaceVerificationStatus({
            isVerified: true,
            message: "顔認証に合格しました",
            showMessage: true,
          });

          // Hide message after 3 seconds
          setTimeout(() => {
            setFaceVerificationStatus((prev) => ({
              ...prev,
              showMessage: false,
            }));
          }, 3000);
        }
        return true;
      } else {
        // Face verification failed
        console.warn("Face verification failed:", data.message);
        
        if (isModalVerification) {
          showToast({
            type: "error",
            title: "認証失敗",
            message: "顔認証に失敗しました。もう一度お試しください。",
          });
        } else {
          // Pause exam and show modal
          setIsExamPaused(true);
          setShowReauthenticationModal(true);
          // Clear face verification interval
          if (faceVerificationIntervalRef.current) {
            clearInterval(faceVerificationIntervalRef.current);
            faceVerificationIntervalRef.current = null;
          }
          setFaceVerificationStatus({
            isVerified: false,
            message: "顔認証に失敗しました",
            showMessage: false,
          });
          showToast({
            type: "error",
            title: "試験中断",
            message: "顔認証に失敗しました。再認証が必要です。",
          });
        }
        return false;
      }
    } catch (error) {
      console.error("Face verification error:", error);
      if (isModalVerification) {
        showToast({
          type: "error",
          title: "エラー",
          message: "顔認証中にエラーが発生しました。",
        });
      } else {
        // In regular verification, pause exam and show modal on error
        setIsExamPaused(true);
        setShowReauthenticationModal(true);
        // Clear face verification interval
        if (faceVerificationIntervalRef.current) {
          clearInterval(faceVerificationIntervalRef.current);
          faceVerificationIntervalRef.current = null;
        }
        setFaceVerificationStatus({
          isVerified: false,
          message: "エラーが発生しました",
          showMessage: false,
        });
        showToast({
          type: "error",
          title: "試験中断",
          message: "顔認証中にエラーが発生しました。再認証が必要です。",
        });
      }
      return false;
    }
  }, [showToast]);

  // Start face verification after 20 seconds, then every 20 seconds
  useEffect(() => {
    if (!isExamStarted || isExamPaused) {
      return;
    }

    // Clear any existing interval
    if (faceVerificationIntervalRef.current) {
      clearInterval(faceVerificationIntervalRef.current);
      faceVerificationIntervalRef.current = null;
    }

    // Calculate delay until first verification (20 seconds after start)
    const firstVerificationDelay = 20000;

    // Set timeout for first verification
    const firstVerificationTimeout = setTimeout(() => {
      if (!isExamPaused && timeRemainingRef.current > 0) {
        performFaceVerification(false);
      }

      // Then set interval for subsequent verifications every 20 seconds
      faceVerificationIntervalRef.current = setInterval(() => {
        // Check if exam is still active and not paused before performing verification
        if (timeRemainingRef.current > 0 && !isExamPaused) {
          performFaceVerification(false);
        } else {
          // Clear interval if exam has ended or is paused
          if (faceVerificationIntervalRef.current) {
            clearInterval(faceVerificationIntervalRef.current);
            faceVerificationIntervalRef.current = null;
          }
        }
      }, 20000);
    }, firstVerificationDelay);

    // Cleanup
    return () => {
      clearTimeout(firstVerificationTimeout);
      if (faceVerificationIntervalRef.current) {
        clearInterval(faceVerificationIntervalRef.current);
        faceVerificationIntervalRef.current = null;
      }
    };
  }, [isExamStarted, isExamPaused, performFaceVerification]);

  // Resume face verification after reauthentication
  useEffect(() => {
    if (!isExamPaused && isExamStarted && timeRemainingRef.current > 0) {
      // Restart face verification interval after reauthentication
      if (faceVerificationIntervalRef.current) {
        clearInterval(faceVerificationIntervalRef.current);
        faceVerificationIntervalRef.current = null;
      }

      // Start interval again immediately (every 20 seconds)
      faceVerificationIntervalRef.current = setInterval(() => {
        if (timeRemainingRef.current > 0 && !isExamPaused) {
          performFaceVerification(false);
        } else {
          if (faceVerificationIntervalRef.current) {
            clearInterval(faceVerificationIntervalRef.current);
            faceVerificationIntervalRef.current = null;
          }
        }
      }, 20000);

      return () => {
        if (faceVerificationIntervalRef.current) {
          clearInterval(faceVerificationIntervalRef.current);
          faceVerificationIntervalRef.current = null;
        }
      };
    }
  }, [isExamPaused, isExamStarted, performFaceVerification]);

  // Handle reauthentication button click
  const handleReauthentication = async () => {
    setIsReauthenticating(true);
    await performFaceVerification(true);
    setIsReauthenticating(false);
  };

  const handleSubmitExam = useCallback(async () => {
    try {
      // Prepare exam submission data
      const examSubmissionData = {
        examineeId: localStorage.getItem("userId") || "anonymous",
        examId: examData?.id || "standalone-exam",
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
          answeredAt: new Date().toISOString(),
        })),
        totalQuestions: examData?.totalQuestions || 0,
        timeSpent: examData ? examData.duration * 60 - timeRemaining : 0,
        submittedAt: new Date().toISOString(),
      };

      // Send to backend
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://85.131.238.90:4000"
        }/api/exam/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify(examSubmissionData),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Exam submitted successfully:", result);
        // Navigate to results page or show success message
        navigate("/exam-results", {
          state: { examResults: result.examResult },
        });
      } else {
        console.error("Failed to submit exam:", await response.text());
        // Still navigate to home page even if submission fails
        navigate("/");
      }
    } catch (error) {
      console.error("Error submitting exam:", error);
      // Navigate to home page on error
      navigate("/");
    }
  }, [answers, examData, timeRemaining, navigate]);

  // Timer effect - pause when exam is paused
  useEffect(() => {
    if (timeRemaining <= 0) {
      // Clear face verification interval when exam ends
      if (faceVerificationIntervalRef.current) {
        clearInterval(faceVerificationIntervalRef.current);
        faceVerificationIntervalRef.current = null;
      }
      return;
    }

    // Don't count down if exam is paused
    if (isExamPaused) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev <= 1 ? 0 : prev - 1;
        timeRemainingRef.current = newTime;
        if (prev <= 1) {
          // Auto submit when time runs out
          handleSubmitExam();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, handleSubmitExam, isExamPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (faceVerificationIntervalRef.current) {
        clearInterval(faceVerificationIntervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (
    questionId: string,
    answer: string | string[] | boolean
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentQuestionIndex < (examData?.totalQuestions || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const currentQuestion = examData?.questions[currentQuestionIndex];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">試験データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">試験データの読み込みに失敗しました。</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  if (!examData || examData.totalQuestions === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">現在利用可能な試験問題がありません。</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - 日本式デザイン */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-medium text-gray-900 tracking-wide">
                {examData.title}
              </h1>
              <span className="text-sm text-gray-500 font-light">
                {examData.totalQuestions} 問題 / {examData.duration} 分
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-gray-700">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="font-mono text-xl font-medium">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <button
                onClick={handleSubmitExam}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                提出する
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Camera */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm sticky top-6">
              <h3 className="text-base font-medium text-gray-900 mb-4 tracking-wide">
                顔認証
              </h3>
              <div className="relative">
                <div className="w-full aspect-square bg-gray-100 rounded-md overflow-hidden border border-gray-300 shadow-md">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/png"
                    videoConstraints={{
                      width: 640,
                      height: 640,
                      facingMode: "user",
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-2 right-2 bg-orange-500 rounded-full p-1.5 shadow-md">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <div className="absolute bottom-2 left-2 bg-orange-500/80 text-white text-xs px-2 py-1 rounded font-medium">
                  認証中
                </div>
              </div>
              {faceVerificationStatus.showMessage && (
                <div
                  className={`mt-4 px-4 py-3 rounded-md text-sm font-medium text-center shadow-sm ${
                    faceVerificationStatus.isVerified
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {faceVerificationStatus.isVerified && (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>{faceVerificationStatus.message}</span>
                  </div>
                </div>
              )}
              <div className="mt-4 text-xs text-gray-500 text-center">
                カメラの前に顔を向けてください
              </div>
            </div>
          </div>

          {/* Right Side - Question Content - ページネーション形式 */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-md p-10 shadow-sm min-h-[600px] flex flex-col">
              {currentQuestion && (
                <>
                  {/* ページネーションヘッダー */}
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                      <h2 className="text-lg font-medium text-gray-900 tracking-wide">
                        問題 {currentQuestionIndex + 1} / {examData.totalQuestions}
                      </h2>
                      <div className="flex items-center gap-2">
                        {examData.questions.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentQuestionIndex
                                ? "bg-orange-500 w-8"
                                : answers[examData.questions[index]._id] !== undefined
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {Object.keys(answers).length} / {examData.totalQuestions} 回答済み
                    </div>
                  </div>

                  {/* 問題コンテンツ */}
                  <div className="flex-1 mb-10">
                    <p className="text-base text-gray-800 mb-8 leading-relaxed">
                      {currentQuestion.content}
                    </p>

                    <div className="space-y-2.5">
                      {currentQuestion.type === "true_false" ? (
                        // True/False question
                        <>
                          <label className="flex items-center space-x-3 px-5 py-3.5 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                              type="radio"
                              name={`question-${currentQuestion._id}`}
                              value="true"
                              checked={answers[currentQuestion._id] === true}
                              onChange={() =>
                                handleAnswerChange(currentQuestion._id, true)
                              }
                              className="w-4 h-4 text-gray-800"
                            />
                            <span className="text-gray-800 text-sm">正しい</span>
                          </label>
                          <label className="flex items-center space-x-3 px-5 py-3.5 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                              type="radio"
                              name={`question-${currentQuestion._id}`}
                              value="false"
                              checked={answers[currentQuestion._id] === false}
                              onChange={() =>
                                handleAnswerChange(currentQuestion._id, false)
                              }
                              className="w-4 h-4 text-gray-800"
                            />
                            <span className="text-gray-800 text-sm">間違い</span>
                          </label>
                        </>
                      ) : currentQuestion.type === "single_choice" ? (
                        // Single choice question
                        currentQuestion.options?.map((option) => (
                          <label
                            key={option.id}
                            className="flex items-center space-x-3 px-5 py-3.5 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="radio"
                              name={`question-${currentQuestion._id}`}
                              value={option.id}
                              checked={
                                answers[currentQuestion._id] === option.id
                              }
                              onChange={(e) =>
                                handleAnswerChange(
                                  currentQuestion._id,
                                  e.target.value
                                )
                              }
                              className="w-4 h-4 text-gray-800"
                            />
                            <span className="text-gray-800 text-sm">{option.text}</span>
                          </label>
                        ))
                      ) : currentQuestion.type === "multiple_choice" ? (
                        // Multiple choice question
                        currentQuestion.options?.map((option) => (
                          <label
                            key={option.id}
                            className="flex items-center space-x-3 px-5 py-3.5 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              value={option.id}
                              checked={
                                Array.isArray(answers[currentQuestion._id]) &&
                                (
                                  answers[currentQuestion._id] as string[]
                                ).includes(option.id)
                              }
                              onChange={(e) => {
                                const currentAnswers = Array.isArray(
                                  answers[currentQuestion._id]
                                )
                                  ? (answers[currentQuestion._id] as string[])
                                  : [];

                                let newAnswers;
                                if (e.target.checked) {
                                  newAnswers = [...currentAnswers, option.id];
                                } else {
                                  newAnswers = currentAnswers.filter(
                                    (id) => id !== option.id
                                  );
                                }

                                handleAnswerChange(
                                  currentQuestion._id,
                                  newAnswers
                                );
                              }}
                              className="w-4 h-4 text-gray-800"
                            />
                            <span className="text-gray-800 text-sm">{option.text}</span>
                          </label>
                        ))
                      ) : null}
                    </div>
                  </div>

                  {/* ページネーションコントロール */}
                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-200">
                    <button
                      onClick={goToPrevious}
                      disabled={currentQuestionIndex === 0}
                      className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 rounded-lg transition-colors text-sm font-medium shadow-sm"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <span>前へ</span>
                    </button>

                    {/* ページ番号表示 */}
                    <div className="flex items-center gap-2">
                      {examData.questions.map((question, index) => (
                        <button
                          key={question._id}
                          onClick={() => goToQuestion(index)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                            index === currentQuestionIndex
                              ? "bg-orange-500 text-white shadow-md"
                              : answers[question._id] !== undefined
                              ? "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200"
                              : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={goToNext}
                      disabled={
                        currentQuestionIndex === examData.totalQuestions - 1
                      }
                      className="flex items-center space-x-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium shadow-md"
                    >
                      <span>次へ</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reauthentication Modal - 日本式デザイン */}
      {showReauthenticationModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-md shadow-2xl max-w-lg w-full mx-4 border border-gray-200">
            <div className="px-8 py-6 border-b border-gray-200">
              <h3 className="text-xl font-medium text-gray-900 tracking-wide">
                顔認証が必要です
              </h3>
              <p className="text-sm text-gray-600 mt-2 font-light">
                試験を続行するには、顔認証に合格する必要があります。
              </p>
            </div>

            <div className="px-8 py-6">
              {/* Camera Preview */}
              <div className="relative w-full aspect-video bg-gray-100 rounded-md overflow-hidden border border-gray-300 mb-5">
                <Webcam
                  ref={modalWebcamRef}
                  audio={false}
                  screenshotFormat="image/png"
                  videoConstraints={{
                    width: 640,
                    height: 480,
                    facingMode: "user",
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 right-3 bg-orange-500 rounded-full p-2 shadow-md">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-5">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-gray-700 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-2 text-gray-900">認証手順</p>
                    <ul className="list-disc list-inside space-y-1.5 text-gray-600">
                      <li>カメラの前に顔を向けてください</li>
                      <li>十分な明るさを確保してください</li>
                      <li>顔がはっきりと見える状態にしてください</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-8 py-5 flex space-x-3 border-t border-gray-200 bg-gray-50 rounded-b-md">
              <button
                onClick={handleReauthentication}
                disabled={isReauthenticating}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 shadow-sm"
              >
                {isReauthenticating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>認証中...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>顔認証を実行</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamTaking;
