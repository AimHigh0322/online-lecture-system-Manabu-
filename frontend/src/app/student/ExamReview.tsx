import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle, XCircle } from "lucide-react";

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
}

interface ExamAnswer {
  questionId: string;
  questionContent: string;
  questionType: string;
  answer: string | string[] | boolean | null;
  answeredAt: string | null;
  isCorrect: boolean;
  pointsEarned: number;
  examineeAnswered: boolean;
  correctAnswer: boolean | null;
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    order: number;
  }>;
}

interface ExamResult {
  examineeId: string;
  examineeName: string;
  answers: ExamAnswer[];
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  timeSpent: number;
  submittedAt: string;
  gradedAt: string;
}

export const ExamReview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const examResults = location.state?.examResults as ExamResult;
  const reviewMode = location.state?.reviewMode;

  if (!examResults || !reviewMode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">試験データが見つかりません。</p>
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

  // Convert exam results to question format for review
  const questions: Question[] = examResults.answers.map((answer) => ({
    _id: answer.questionId,
    type: answer.questionType as
      | "true_false"
      | "single_choice"
      | "multiple_choice",
    title: `問題 ${examResults.answers.indexOf(answer) + 1}`,
    content: answer.questionContent,
    courseId: "",
    courseName: "",
    correctAnswer: answer.correctAnswer,
    estimatedTime: 2,
    options: answer.options || [],
    createdBy: "",
    createdAt: "",
    updatedAt: "",
    isActive: true,
  }));

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = examResults.answers[currentQuestionIndex];

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                試験再確認 - オンライン講習システム 総合試験
              </h1>
              <span className="text-sm text-gray-600">
                (終了時間: {formatTime(examResults.timeSpent)})
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() =>
                  navigate("/exam-results", { state: { examResults } })
                }
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
              >
                結果に戻る
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                問題一覧
              </h3>
              <div className="grid grid-cols-5 lg:grid-cols-1 gap-2">
                {questions.map((question, index) => {
                  const answer = examResults.answers[index];
                  return (
                    <button
                      key={question._id}
                      onClick={() => goToQuestion(index)}
                      className={`p-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        index === currentQuestionIndex
                          ? "bg-blue-500 text-white"
                          : answer.isCorrect
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{index + 1}</span>
                        {answer.isCorrect ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-8 cursor-pointer">
              {currentQuestion && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      問題 {currentQuestionIndex + 1} / {questions.length}
                    </h2>
                    <div className="flex items-center space-x-2">
                      {currentAnswer.isCorrect ? (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          正解
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                          不正解
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-8">
                    <p className="text-lg text-gray-800 mb-6">
                      {currentQuestion.content}
                    </p>

                    <div className="space-y-3">
                      {currentQuestion.type === "true_false" ? (
                        // True/False question
                        <>
                          <div
                            className={`p-4 border-2 rounded-lg cursor-pointer ${
                              currentAnswer.answer === true
                                ? currentAnswer.isCorrect
                                  ? "bg-green-50 border-green-300"
                                  : "bg-red-50 border-red-300"
                                : currentAnswer.correctAnswer === true
                                ? "bg-blue-50 border-blue-300"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                checked={currentAnswer.answer === true}
                                disabled
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-gray-800 font-medium">
                                正しい
                              </span>
                              {currentAnswer.answer === true && (
                                <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">
                                  あなたの回答
                                </span>
                              )}
                              {currentAnswer.correctAnswer === true &&
                                currentAnswer.answer !== true && (
                                  <span className="text-sm text-blue-600 bg-blue-200 px-2 py-1 rounded font-medium">
                                    正解
                                  </span>
                                )}
                            </div>
                          </div>
                          <div
                            className={`p-4 border-2 rounded-lg cursor-pointer ${
                              currentAnswer.answer === false
                                ? currentAnswer.isCorrect
                                  ? "bg-green-50 border-green-300"
                                  : "bg-red-50 border-red-300"
                                : currentAnswer.correctAnswer === false
                                ? "bg-blue-50 border-blue-300"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                checked={currentAnswer.answer === false}
                                disabled
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-gray-800 font-medium">
                                間違い
                              </span>
                              {currentAnswer.answer === false && (
                                <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">
                                  あなたの回答
                                </span>
                              )}
                              {currentAnswer.correctAnswer === false &&
                                currentAnswer.answer !== false && (
                                  <span className="text-sm text-blue-600 bg-blue-200 px-2 py-1 rounded font-medium">
                                    正解
                                  </span>
                                )}
                            </div>
                          </div>
                        </>
                      ) : currentQuestion.type === "single_choice" ? (
                        // Single choice question
                        currentQuestion.options?.map((option) => {
                          const isUserAnswer =
                            currentAnswer.answer === option.id;
                          const isCorrectAnswer = option.isCorrect;
                          return (
                            <div
                              key={option.id}
                              className={`p-4 border-2 rounded-lg cursor-pointer ${
                                isUserAnswer
                                  ? isCorrectAnswer
                                    ? "bg-green-50 border-green-300"
                                    : "bg-red-50 border-red-300"
                                  : isCorrectAnswer
                                  ? "bg-blue-50 border-blue-300"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <input
                                  type="radio"
                                  checked={isUserAnswer}
                                  disabled
                                  className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-gray-800 font-medium">
                                  {option.text}
                                </span>
                                {isUserAnswer && (
                                  <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">
                                    あなたの回答
                                  </span>
                                )}
                                {isCorrectAnswer && !isUserAnswer && (
                                  <span className="text-sm text-blue-600 bg-blue-200 px-2 py-1 rounded font-medium">
                                    正解
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : currentQuestion.type === "multiple_choice" ? (
                        // Multiple choice question
                        currentQuestion.options?.map((option) => {
                          const isSelected =
                            Array.isArray(currentAnswer.answer) &&
                            currentAnswer.answer.includes(option.id);
                          const isCorrectAnswer = option.isCorrect;
                          return (
                            <div
                              key={option.id}
                              className={`p-4 border-2 rounded-lg cursor-pointer ${
                                isSelected
                                  ? isCorrectAnswer
                                    ? "bg-green-50 border-green-300"
                                    : "bg-red-50 border-red-300"
                                  : isCorrectAnswer
                                  ? "bg-blue-50 border-blue-300"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled
                                  className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-gray-800 font-medium">
                                  {option.text}
                                </span>
                                {isSelected && (
                                  <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">
                                    あなたの回答
                                  </span>
                                )}
                                {isCorrectAnswer && !isSelected && (
                                  <span className="text-sm text-blue-600 bg-blue-200 px-2 py-1 rounded font-medium">
                                    正解
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : null}
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={goToPrevious}
                      disabled={currentQuestionIndex === 0}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-gray-700 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>前の問題</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {currentQuestionIndex + 1} / {questions.length} 問題
                      </span>
                    </div>

                    <button
                      onClick={goToNext}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-white rounded-lg transition-colors"
                    >
                      <span>次の問題</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamReview;
