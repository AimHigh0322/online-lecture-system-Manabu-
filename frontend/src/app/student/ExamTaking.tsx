import React, { useState, useEffect, useCallback, useRef } from "react";
import { Clock, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGetQuestionsQuery } from "../../api/admin/questionApiSlice";
import { ConfirmModal } from "../../components/atom/ConfirmModal";
import { FaceVerificationModal } from "../../components/atom/FaceVerificationModal";
import { useGetExamEligibilityQuery } from "../../api/exam/examApiSlice";

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
  faceVerificationIntervalMinutes?: number; // Face verification interval in minutes
}

// localStorage key for saving exam answers
const EXAM_ANSWERS_STORAGE_KEY = "exam_answers";

export const ExamTaking: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const examStartTimeRef = useRef<number | null>(null);
  const timeRemainingRef = useRef<number>(0);
  const navigateRef = useRef(navigate);

  // Check exam eligibility - prevent access if courses are not 100% complete
  const { data: eligibilityData, isLoading: eligibilityLoading } =
    useGetExamEligibilityQuery({});

  // Redirect to exam room if not eligible
  useEffect(() => {
    if (
      !eligibilityLoading &&
      eligibilityData &&
      !eligibilityData.examEligible
    ) {
      navigate("/exam-room");
    }
  }, [eligibilityData, eligibilityLoading, navigate]);

  const [examData, setExamData] = useState<ExamData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examSettings, setExamSettings] = useState<ExamSettings | null>(null);
  const [answers, setAnswers] = useState<{
    [key: string]: string | string[] | boolean;
  }>({});
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNavigationConfirm, setShowNavigationConfirm] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const settingsRetryCountRef = useRef(0);
  const MAX_SETTINGS_RETRIES = 5;

  // Face verification states
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [nextFaceVerificationTime, setNextFaceVerificationTime] = useState<
    number | null
  >(null);
  const faceVerificationIntervalRef = useRef<ReturnType<
    typeof setInterval
  > | null>(null);

  // Update navigate ref when navigate changes
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  // Load answers from localStorage on component mount
  useEffect(() => {
    try {
      const savedAnswers = localStorage.getItem(EXAM_ANSWERS_STORAGE_KEY);
      if (savedAnswers) {
        const parsedAnswers = JSON.parse(savedAnswers);
        setAnswers(parsedAnswers);
      }
    } catch (error) {
      console.error("Error loading answers from localStorage:", error);
    }
  }, []);

  // Save answers to localStorage whenever answers change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      try {
        localStorage.setItem(EXAM_ANSWERS_STORAGE_KEY, JSON.stringify(answers));
      } catch (error) {
        console.error("Error saving answers to localStorage:", error);
      }
    }
  }, [answers]);

  // Fetch exam settings from database (no template defaults)
  const fetchExamSettings = useCallback(async () => {
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://103.179.45.68:4000";
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
          settingsRetryCountRef.current = 0; // Reset retry count on success
        } else {
          console.error("No settings data received from database");
          throw new Error("Settings data not found in response");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error fetching exam settings from database:", errorData);
        throw new Error(`Failed to fetch settings: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching exam settings from database:", error);
      // Settings must be loaded from database - do not use template defaults
      // The backend ExamSettings.getSettings() will create default settings if none exist
      // Retry with exponential backoff, up to MAX_SETTINGS_RETRIES times
      if (settingsRetryCountRef.current < MAX_SETTINGS_RETRIES) {
        settingsRetryCountRef.current += 1;
        const retryDelay = Math.min(
          3000 * settingsRetryCountRef.current,
          10000
        );
        setTimeout(() => {
          fetchExamSettings();
        }, retryDelay);
      } else {
        console.error(
          "Failed to fetch exam settings after maximum retries. Please check database connection."
        );
        // Do not set default values - settings must come from database
      }
    }
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
        // Set initial face verification time if interval is configured
        if (
          examSettings.faceVerificationIntervalMinutes &&
          examSettings.faceVerificationIntervalMinutes > 0
        ) {
          const intervalMs =
            examSettings.faceVerificationIntervalMinutes * 60 * 1000;
          setNextFaceVerificationTime(Date.now() + intervalMs);
        }
      }
    }
  }, [questionsResponse, examSettings, isExamStarted]);

  // Block browser tab close/refresh when exam is started
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isExamStarted) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    if (isExamStarted) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isExamStarted]);

  // Intercept navigation attempts when exam is started
  useEffect(() => {
    if (!isExamStarted) return;

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    let isNavigatingAway = false;

    // Override pushState to intercept navigation
    window.history.pushState = function (...args) {
      if (isExamStarted && !isNavigatingAway && !isSubmitting) {
        const newPath = args[2] as string;
        if (newPath && newPath !== location.pathname) {
          // Show confirmation modal
          setShowNavigationConfirm(true);
          pendingNavigationRef.current = () => {
            isNavigatingAway = true;
            localStorage.removeItem(EXAM_ANSWERS_STORAGE_KEY);
            setIsExamStarted(false);
            setShowNavigationConfirm(false);
            // Allow navigation
            originalPushState.apply(window.history, args);
            // Trigger navigation
            window.dispatchEvent(new PopStateEvent("popstate"));
            pendingNavigationRef.current = null;
          };
          return; // Block navigation
        }
      }
      return originalPushState.apply(window.history, args);
    };

    // Override replaceState to intercept navigation
    window.history.replaceState = function (...args) {
      if (isExamStarted && !isNavigatingAway && !isSubmitting) {
        const newPath = args[2] as string;
        if (newPath && newPath !== location.pathname) {
          // Show confirmation modal
          setShowNavigationConfirm(true);
          pendingNavigationRef.current = () => {
            isNavigatingAway = true;
            localStorage.removeItem(EXAM_ANSWERS_STORAGE_KEY);
            setIsExamStarted(false);
            setShowNavigationConfirm(false);
            // Allow navigation
            originalReplaceState.apply(window.history, args);
            // Trigger navigation
            window.dispatchEvent(new PopStateEvent("popstate"));
            pendingNavigationRef.current = null;
          };
          return; // Block navigation
        }
      }
      return originalReplaceState.apply(window.history, args);
    };

    // Handle browser back/forward buttons
    const handlePopState = (e: PopStateEvent) => {
      if (isExamStarted && !isNavigatingAway && !isSubmitting) {
        e.preventDefault();
        // Revert the navigation
        window.history.pushState(null, "", location.pathname);
        // Show confirmation modal
        setShowNavigationConfirm(true);
        pendingNavigationRef.current = () => {
          isNavigatingAway = true;
          localStorage.removeItem(EXAM_ANSWERS_STORAGE_KEY);
          setIsExamStarted(false);
          setShowNavigationConfirm(false);
          // Navigate back
          window.history.back();
          pendingNavigationRef.current = null;
        };
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isExamStarted, isSubmitting, location.pathname]);

  const handleConfirmNavigation = () => {
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
    }
  };

  const handleCancelNavigation = () => {
    setShowNavigationConfirm(false);
    pendingNavigationRef.current = null;
  };

  // Helper function to create exam results structure
  const createExamResults = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (backendResult?: { examResult?: any }) => {
      // Get backend result if available, otherwise create from frontend data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const backendExamResult: any = backendResult?.examResult;
      const adminTotalQuestions = examData?.totalQuestions || 0;

      // Always use admin-submitted total questions, not the number of answered questions
      const result = backendExamResult
        ? {
            ...backendExamResult,
            // Override totalQuestions to always use admin-submitted questions count
            totalQuestions: adminTotalQuestions,
            // Ensure all questions from examData are included in answers array
            answers:
              examData?.questions?.map((q) => {
                // Find corresponding answer from backend result
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const backendAnswer = backendExamResult.answers?.find(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (a: any) => a.questionId === q._id
                );

                // If backend has answer, use it; otherwise create from frontend data
                return (
                  backendAnswer || {
                    questionId: q._id,
                    questionContent: q.content,
                    questionType: q.type,
                    answer: answers[q._id] || null,
                    answeredAt: null,
                    isCorrect: false,
                    pointsEarned: 0,
                    examineeAnswered: answers[q._id] !== undefined,
                    correctAnswer: q.correctAnswer,
                    options: q.options,
                  }
                );
              }) ||
              backendExamResult.answers ||
              [],
          }
        : {
            examineeId: localStorage.getItem("userId") || "anonymous",
            examineeName: localStorage.getItem("username") || "受講生",
            examId: examData?.id || "standalone-exam",
            examType: "standalone",
            answers:
              examData?.questions?.map((q) => ({
                questionId: q._id,
                questionContent: q.content,
                questionType: q.type,
                answer: answers[q._id] || null,
                answeredAt: null,
                isCorrect: false,
                pointsEarned: 0,
                examineeAnswered: answers[q._id] !== undefined,
                correctAnswer: q.correctAnswer,
                options: q.options,
              })) || [],
            score: 0,
            totalQuestions: adminTotalQuestions,
            percentage: 0,
            passed: false,
            timeSpent: examData ? examData.duration * 60 - timeRemaining : 0,
            submittedAt: new Date().toISOString(),
            gradedAt: new Date().toISOString(),
          };

      return result;
    },
    [answers, examData, timeRemaining]
  );

  const handleSubmitExam = useCallback(async () => {
    // Set submitting flag to prevent confirmation modal from showing
    setIsSubmitting(true);
    setIsExamStarted(false); // Allow navigation after submission

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
          import.meta.env.VITE_API_URL || "http://103.179.45.68:4000"
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
        // Clear saved answers from localStorage after successful submission
        localStorage.removeItem(EXAM_ANSWERS_STORAGE_KEY);

        // Navigate to results page with exam results
        const examResults = createExamResults(result);
        navigate("/exam-results", {
          state: { examResults },
        });
      } else {
        // Even if submission fails, try to navigate to results page with available data
        const errorText = await response.text();
        console.error("Failed to submit exam:", errorText);

        // Clear saved answers from localStorage
        localStorage.removeItem(EXAM_ANSWERS_STORAGE_KEY);

        // Create a basic result structure from available data
        const examResults = createExamResults();

        // Navigate to results page even on error
        navigate("/exam-results", {
          state: { examResults },
        });
      }
    } catch (error) {
      console.error("Error submitting exam:", error);
      // Clear localStorage on error
      localStorage.removeItem(EXAM_ANSWERS_STORAGE_KEY);

      // Create a basic result structure from available data even on error
      const examResults = createExamResults();

      // Navigate to results page even on error
      navigate("/exam-results", {
        state: { examResults },
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, examData, timeRemaining, navigate, createExamResults]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
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
  }, [timeRemaining, handleSubmitExam]);

  // Face verification interval check
  useEffect(() => {
    if (
      !isExamStarted ||
      !examSettings?.faceVerificationIntervalMinutes ||
      examSettings.faceVerificationIntervalMinutes <= 0
    ) {
      return;
    }

    if (showFaceVerification) {
      // Don't check for next verification while current one is active
      return;
    }

    const checkInterval = setInterval(() => {
      const now = Date.now();
      if (nextFaceVerificationTime && now >= nextFaceVerificationTime) {
        // Time for face verification
        setShowFaceVerification(true);
      }
    }, 1000); // Check every second

    faceVerificationIntervalRef.current = checkInterval;

    return () => {
      if (faceVerificationIntervalRef.current) {
        clearInterval(faceVerificationIntervalRef.current);
      }
    };
  }, [
    isExamStarted,
    examSettings,
    nextFaceVerificationTime,
    showFaceVerification,
  ]);

  // Handle face verification success
  const handleFaceVerificationSuccess = useCallback(() => {
    setShowFaceVerification(false);
    // Set next face verification time
    if (
      examSettings?.faceVerificationIntervalMinutes &&
      examSettings.faceVerificationIntervalMinutes > 0
    ) {
      const intervalMs =
        examSettings.faceVerificationIntervalMinutes * 60 * 1000;
      setNextFaceVerificationTime(Date.now() + intervalMs);
    }
  }, [examSettings]);

  // Handle face verification close (should not allow closing without verification)
  const handleFaceVerificationClose = useCallback(() => {
    // Do not allow closing without verification
    // Modal will remain open until verification succeeds
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
    // Block answer changes during face verification
    if (showFaceVerification) {
      return;
    }
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const goToQuestion = (index: number) => {
    // Block navigation during face verification
    if (showFaceVerification) {
      return;
    }
    setCurrentQuestionIndex(index);
  };

  const goToPrevious = () => {
    // Block navigation during face verification
    if (showFaceVerification) {
      return;
    }
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNext = () => {
    // Block navigation during face verification
    if (showFaceVerification) {
      return;
    }
    if (currentQuestionIndex < (examData?.totalQuestions || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const currentQuestion = examData?.questions[currentQuestionIndex];

  // Don't render exam if not eligible or still checking eligibility
  if (eligibilityLoading || !eligibilityData || !eligibilityData.examEligible) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">試験資格を確認中...</p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50 relative">
      {/* Block overlay when face verification is required */}
      {showFaceVerification && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                顔認証が必要です
              </h3>
              <p className="text-gray-600">
                試験を継続するには、顔認証を完了してください。
                <br />
                試験時間は経過し続けます。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Confirmation Modal */}
      <ConfirmModal
        isOpen={showNavigationConfirm}
        onClose={handleCancelNavigation}
        onConfirm={handleConfirmNavigation}
        title="ページ遷移の確認"
        message="試験中です。このページから移動すると、試験の進捗が失われる可能性があります。本当に移動しますか？"
        confirmText="移動する"
        cancelText="キャンセル"
        confirmButtonClass="bg-red-500 hover:bg-red-600"
      />

      {/* Header - 日本式デザイン */}
      <div
        className={`bg-white border-b border-gray-200 shadow-sm ${
          showFaceVerification ? "opacity-50 pointer-events-none" : ""
        }`}
      >
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
                disabled={showFaceVerification}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                提出する
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10 ${
          showFaceVerification ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <div className="grid grid-cols-1 gap-8">
          {/* Question Content - ページネーション形式 */}
          <div>
            <div className="bg-white border border-gray-200 rounded-md p-10 shadow-sm min-h-[600px] flex flex-col">
              {currentQuestion && (
                <>
                  {/* ページネーションヘッダー */}
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                      <h2 className="text-lg font-medium text-gray-900 tracking-wide">
                        問題 {currentQuestionIndex + 1} /{" "}
                        {examData.totalQuestions}
                      </h2>
                      <div className="flex items-center gap-2">
                        {examData.questions.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentQuestionIndex
                                ? "bg-orange-500 w-8"
                                : answers[examData.questions[index]._id] !==
                                  undefined
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {Object.keys(answers).length} / {examData.totalQuestions}{" "}
                      回答済み
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
                            <span className="text-gray-800 text-sm">
                              正しい
                            </span>
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
                            <span className="text-gray-800 text-sm">
                              間違い
                            </span>
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
                            <span className="text-gray-800 text-sm">
                              {option.text}
                            </span>
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
                            <span className="text-gray-800 text-sm">
                              {option.text}
                            </span>
                          </label>
                        ))
                      ) : null}
                    </div>
                  </div>

                  {/* ページネーションコントロール */}
                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-200">
                    <button
                      onClick={goToPrevious}
                      disabled={
                        currentQuestionIndex === 0 || showFaceVerification
                      }
                      className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 rounded-lg transition-colors text-sm font-medium shadow-sm"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <span>前へ</span>
                    </button>

                    {/* ページ番号表示 */}
                    <div className="flex items-center gap-2">
                      {(() => {
                        const totalQuestions = examData.totalQuestions;
                        const currentIndex = currentQuestionIndex;

                        // 10問未満の場合はすべて表示
                        if (totalQuestions <= 10) {
                          return examData.questions.map((question, index) => (
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
                          ));
                        }

                        // 10問以上の場合は省略記号を使用
                        const buttons: (number | "ellipsis")[] = [];
                        const addedIndices = new Set<number>();

                        // 常に最初のボタン（1）を表示
                        buttons.push(0);
                        addedIndices.add(0);

                        // 現在のページ周辺の範囲を計算（前後2つずつ）
                        const leftBound = Math.max(1, currentIndex - 2);
                        const rightBound = Math.min(
                          totalQuestions - 2,
                          currentIndex + 2
                        );

                        // 左側の処理
                        if (leftBound > 2) {
                          // ギャップが大きい場合は省略記号
                          buttons.push("ellipsis");
                        } else if (leftBound === 2 && !addedIndices.has(1)) {
                          // ギャップが1つだけの場合は直接表示
                          buttons.push(1);
                          addedIndices.add(1);
                        }

                        // 現在のページ周辺のボタン（最初と最後を除く）
                        for (let i = leftBound; i <= rightBound; i++) {
                          if (
                            i > 0 &&
                            i < totalQuestions - 1 &&
                            !addedIndices.has(i)
                          ) {
                            buttons.push(i);
                            addedIndices.add(i);
                          }
                        }

                        // 右側の処理
                        if (rightBound < totalQuestions - 3) {
                          // ギャップが大きい場合は省略記号
                          buttons.push("ellipsis");
                        } else if (
                          rightBound === totalQuestions - 3 &&
                          !addedIndices.has(totalQuestions - 2)
                        ) {
                          // ギャップが1つだけの場合は直接表示
                          buttons.push(totalQuestions - 2);
                          addedIndices.add(totalQuestions - 2);
                        }

                        // 常に最後のボタンを表示
                        if (!addedIndices.has(totalQuestions - 1)) {
                          buttons.push(totalQuestions - 1);
                        }

                        return buttons.map((item, idx) => {
                          if (item === "ellipsis") {
                            return (
                              <span
                                key={`ellipsis-${idx}`}
                                className="w-10 h-10 inline-flex items-center justify-center text-gray-400 text-sm"
                              >
                                …
                              </span>
                            );
                          }

                          const question = examData.questions[item];
                          const isAnswered =
                            answers[question._id] !== undefined;
                          const isCurrent = item === currentQuestionIndex;

                          return (
                            <button
                              key={question._id}
                              onClick={() => goToQuestion(item)}
                              className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                                isCurrent
                                  ? "bg-orange-500 text-white shadow-md"
                                  : isAnswered
                                  ? "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200"
                                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {item + 1}
                            </button>
                          );
                        });
                      })()}
                    </div>

                    <button
                      onClick={goToNext}
                      disabled={
                        currentQuestionIndex === examData.totalQuestions - 1 ||
                        showFaceVerification
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

      {/* Face Verification Modal - Blocks exam until verification succeeds */}
      {showFaceVerification && (
        <FaceVerificationModal
          isOpen={showFaceVerification}
          onClose={handleFaceVerificationClose}
          onVerifySuccess={handleFaceVerificationSuccess}
        />
      )}
    </div>
  );
};

export default ExamTaking;
