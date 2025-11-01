import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, AlertCircle, ArrowLeft } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { BossLayout } from "../../components/layout/AdminLayout";
import {
  courseOptions,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useGetQuestionByIdQuery,
} from "../../api";

interface QuestionFormData {
  type: string;
  title: string;
  content: string;
  courseId: string;
  courseName: string;
  correctAnswer: boolean | null;
  estimatedTime: number;
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
}

interface QuestionErrors {
  title?: string;
  content?: string;
  courseId?: string;
  correctAnswer?: string;
  estimatedTime?: string;
  options?: string;
}

export const ExamQuestionForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const isEditing = !!id;

  const [activeTab, setActiveTab] = useState("type1");
  const [formData, setFormData] = useState<QuestionFormData>({
    type: "true_false",
    title: "",
    content: "",
    courseId: "",
    courseName: "",
    correctAnswer: null,
    estimatedTime: 2,
    options: [
      { id: "1", text: "", isCorrect: false },
      { id: "2", text: "", isCorrect: false },
      { id: "3", text: "", isCorrect: false },
      { id: "4", text: "", isCorrect: false },
    ],
  });
  const [errors, setErrors] = useState<QuestionErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Function to reset form data
  const resetFormData = () => {
    setFormData({
      type: "true_false",
      title: "",
      content: "",
      courseId: "",
      courseName: "",
      correctAnswer: null,
      estimatedTime: 2,
      options: [
        { id: "1", text: "", isCorrect: false },
        { id: "2", text: "", isCorrect: false },
        { id: "3", text: "", isCorrect: false },
        { id: "4", text: "", isCorrect: false },
      ],
    });
    setErrors({});
    setActiveTab("type1");
  };

  // API hooks
  const { data: questionData } = useGetQuestionByIdQuery(id!, {
    skip: !isEditing,
  });
  const [createQuestion] = useCreateQuestionMutation();
  const [updateQuestion] = useUpdateQuestionMutation();

  // Load question data when editing
  useEffect(() => {
    if (isEditing && questionData?.success && questionData.question) {
      const q = questionData.question;
      setFormData({
        type: q.type,
        title: q.title,
        content: q.content,
        courseId: q.courseId,
        courseName: q.courseName,
        correctAnswer: q.correctAnswer ?? null,
        estimatedTime: q.estimatedTime,
        options: q.options || [
          { id: "1", text: "", isCorrect: false },
          { id: "2", text: "", isCorrect: false },
          { id: "3", text: "", isCorrect: false },
          { id: "4", text: "", isCorrect: false },
        ],
      });
    }
  }, [isEditing, questionData]);

  const questionTypes = [
    {
      value: "type1",
      label: "タイプ1: 正誤問題",
      description: "はい/いいえまたは正/誤の問題",
    },
    {
      value: "type2",
      label: "タイプ2: 単一選択",
      description: "複数の選択肢から1つの正解を選ぶ問題",
    },
    {
      value: "type3",
      label: "タイプ3: 複数選択",
      description: "複数の選択肢から複数の正解を選ぶ問題",
    },
  ];

  const validateForm = () => {
    const newErrors: QuestionErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "問題タイトルは必須です";
    }

    if (!formData.content.trim()) {
      newErrors.content = "問題内容は必須です";
    }

    if (!formData.courseId) {
      newErrors.courseId = "コースは必須です";
    }

    if (formData.type === "true_false" && formData.correctAnswer === null) {
      newErrors.correctAnswer = "正解を選択してください";
    }

    if (formData.type === "multiple_choice") {
      const hasOptions = formData.options?.some(
        (option) => option.text.trim() !== ""
      );
      if (!hasOptions) {
        newErrors.options = "少なくとも1つの選択肢を入力してください";
      }

      const hasCorrectAnswer = formData.options?.some(
        (option) => option.isCorrect
      );
      if (!hasCorrectAnswer) {
        newErrors.options = "少なくとも1つの正解を選択してください";
      }
    }

    if (formData.type === "single_choice") {
      const hasOptions = formData.options?.some(
        (option) => option.text.trim() !== ""
      );
      if (!hasOptions) {
        newErrors.options = "少なくとも1つの選択肢を入力してください";
      }

      const correctAnswers = formData.options?.filter(
        (option) => option.isCorrect
      );
      if (!correctAnswers || correctAnswers.length !== 1) {
        newErrors.options = "正確に1つの正解を選択してください";
      }
    }

    if (formData.estimatedTime < 1 || formData.estimatedTime > 60) {
      newErrors.estimatedTime = "推定時間は1分から60分の間で設定してください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    let processedValue: string | number | boolean = value;

    if (type === "number") {
      processedValue = Number(value);
    } else if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      processedValue = checkbox.checked;
    }

    setFormData({ ...formData, [name]: processedValue });

    // Clear error when user starts typing
    if (errors[name as keyof QuestionErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleCourseSelect = (value: string) => {
    const selectedCourse = courseOptions.find((course) => course.id === value);
    setFormData({
      ...formData,
      courseId: value,
      courseName: selectedCourse?.name || "",
    });

    if (errors.courseId) {
      setErrors({ ...errors, courseId: undefined });
    }
  };

  const handleOptionChange = (
    index: number,
    field: "text" | "isCorrect",
    value: string | boolean
  ) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, options: newOptions });

    if (errors.options) {
      setErrors({ ...errors, options: undefined });
    }
  };

  const addOption = () => {
    const newOptions = [...(formData.options || [])];
    newOptions.push({
      id: (newOptions.length + 1).toString(),
      text: "",
      isCorrect: false,
    });
    setFormData({ ...formData, options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = [...(formData.options || [])];
    if (newOptions.length > 2) {
      newOptions.splice(index, 1);
      setFormData({ ...formData, options: newOptions });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast({
        type: "error",
        title: "入力エラー",
        message: "フォームに不備があります。入力内容を確認してください。",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing) {
        await updateQuestion({
          id: id!,
          data: formData,
        }).unwrap();
      } else {
        await createQuestion(formData).unwrap();
      }

      showToast({
        type: "success",
        title: isEditing ? "更新完了" : "作成完了",
        message: isEditing
          ? "問題が正常に更新されました"
          : "問題が正常に作成されました",
      });

      // Reset form after successful creation (not when editing)
      if (!isEditing) {
        resetFormData();
      }

      // Stay on the same page after saving
      // navigate("/admin/exam-questions");
    } catch (error) {
      console.error("Error submitting form:", error);
      showToast({
        type: "error",
        title: isEditing ? "更新エラー" : "作成エラー",
        message: "問題の保存に失敗しました",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderType3Form = () => (
    <div className="space-y-6">
      {/* Question Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          問題タイトル *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          className={`w-full px-4 py-2 border ${
            errors.title ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
          placeholder="問題のタイトルを入力してください"
        />
        {errors.title && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.title}
          </p>
        )}
      </div>

      {/* Question Content */}
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          問題内容 *
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleInputChange}
          rows={4}
          className={`w-full px-4 py-2 border ${
            errors.content ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
          placeholder="問題の詳細な内容を入力してください"
        />
        {errors.content && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.content}
          </p>
        )}
      </div>

      {/* Course Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          コース選択 *
        </label>
        <select
          value={formData.courseId}
          onChange={(e) => handleCourseSelect(e.target.value)}
          className={`w-full px-4 py-2 border ${
            errors.courseId ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
        >
          <option value="">コースを選択してください</option>
          {courseOptions.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
        {errors.courseId && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.courseId}
          </p>
        )}
      </div>

      {/* Single Choice Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          選択肢 * (1つの正解を選択)
        </label>
        <div className="space-y-3">
          {formData.options?.map((option, index) => (
            <div
              key={option.id}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg"
            >
              <div className="flex-1">
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) =>
                    handleOptionChange(index, "text", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder={`選択肢 ${index + 1}`}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  name="singleChoice"
                  checked={option.isCorrect}
                  onChange={() => {
                    // Uncheck all other options first
                    const newOptions = formData.options?.map((opt, i) => ({
                      ...opt,
                      isCorrect: i === index,
                    }));
                    setFormData({ ...formData, options: newOptions });
                    if (errors.options) {
                      setErrors({ ...errors, options: undefined });
                    }
                  }}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">正解</span>
              </div>
              {formData.options && formData.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {errors.options && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.options}
          </p>
        )}
        <button
          type="button"
          onClick={addOption}
          className="mt-3 px-4 py-2 text-sm text-orange-600 hover:text-orange-800 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
        >
          + 選択肢を追加
        </button>
      </div>

      {/* Estimated Time */}
      <div>
        <label
          htmlFor="estimatedTime"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          推定時間 (分) *
        </label>
        <input
          type="number"
          id="estimatedTime"
          name="estimatedTime"
          value={formData.estimatedTime}
          onChange={handleInputChange}
          min="1"
          max="60"
          className={`w-full px-4 py-2 border ${
            errors.estimatedTime ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
          placeholder="この問題を解くのにかかる推定時間（分）"
        />
        {errors.estimatedTime && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.estimatedTime}
          </p>
        )}
      </div>
    </div>
  );

  const renderType2Form = () => (
    <div className="space-y-6">
      {/* Question Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          問題タイトル *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          className={`w-full px-4 py-2 border ${
            errors.title ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
          placeholder="問題のタイトルを入力してください"
        />
        {errors.title && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.title}
          </p>
        )}
      </div>

      {/* Question Content */}
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          問題内容 *
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleInputChange}
          rows={4}
          className={`w-full px-4 py-2 border ${
            errors.content ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
          placeholder="問題の詳細な内容を入力してください"
        />
        {errors.content && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.content}
          </p>
        )}
      </div>

      {/* Course Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          コース選択 *
        </label>
        <select
          value={formData.courseId}
          onChange={(e) => handleCourseSelect(e.target.value)}
          className={`w-full px-4 py-2 border ${
            errors.courseId ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
        >
          <option value="">コースを選択してください</option>
          {courseOptions.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
        {errors.courseId && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.courseId}
          </p>
        )}
      </div>

      {/* Multiple Choice Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          選択肢 *
        </label>
        <div className="space-y-3">
          {formData.options?.map((option, index) => (
            <div
              key={option.id}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg"
            >
              <div className="flex-1">
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) =>
                    handleOptionChange(index, "text", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder={`選択肢 ${index + 1}`}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={option.isCorrect}
                  onChange={(e) =>
                    handleOptionChange(index, "isCorrect", e.target.checked)
                  }
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">正解</span>
              </div>
              {formData.options && formData.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {errors.options && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.options}
          </p>
        )}
        <button
          type="button"
          onClick={addOption}
          className="mt-3 px-4 py-2 text-sm text-orange-600 hover:text-orange-800 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
        >
          + 選択肢を追加
        </button>
      </div>

      {/* Estimated Time */}
      <div>
        <label
          htmlFor="estimatedTime"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          推定時間 (分) *
        </label>
        <input
          type="number"
          id="estimatedTime"
          name="estimatedTime"
          value={formData.estimatedTime}
          onChange={handleInputChange}
          min="1"
          max="60"
          className={`w-full px-4 py-2 border ${
            errors.estimatedTime ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
          placeholder="この問題を解くのにかかる推定時間（分）"
        />
        {errors.estimatedTime && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.estimatedTime}
          </p>
        )}
      </div>
    </div>
  );

  const renderType1Form = () => (
    <div className="space-y-6">
      {/* Question Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          問題タイトル *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          className={`w-full px-4 py-2 border ${
            errors.title ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
          placeholder="問題のタイトルを入力してください"
        />
        {errors.title && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.title}
          </p>
        )}
      </div>

      {/* Question Content */}
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          問題内容 *
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleInputChange}
          rows={4}
          className={`w-full px-4 py-2 border ${
            errors.content ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
          placeholder="問題の内容を入力してください"
        />
        {errors.content && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.content}
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
          className={`w-full px-4 py-2 border ${
            errors.courseId ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
        >
          <option value="">コースを選択してください</option>
          {courseOptions.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
        {errors.courseId && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.courseId}
          </p>
        )}
      </div>

      {/* Correct Answer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          正解 *
        </label>
        <div className="flex space-x-6">
          <label className="flex items-center">
            <input
              type="radio"
              name="correctAnswer"
              value="true"
              checked={formData.correctAnswer === true}
              onChange={() => setFormData({ ...formData, correctAnswer: true })}
              className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
            />
            <span className="text-sm text-gray-700">はい</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="correctAnswer"
              value="false"
              checked={formData.correctAnswer === false}
              onChange={() =>
                setFormData({ ...formData, correctAnswer: false })
              }
              className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
            />
            <span className="text-sm text-gray-700">いいえ</span>
          </label>
        </div>
        {errors.correctAnswer && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.correctAnswer}
          </p>
        )}
      </div>

      {/* Estimated Time */}
      <div>
        <label
          htmlFor="estimatedTime"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          推定時間 (分) *
        </label>
        <input
          type="number"
          id="estimatedTime"
          name="estimatedTime"
          value={formData.estimatedTime}
          onChange={handleInputChange}
          min="1"
          max="60"
          className={`w-full px-4 py-2 border ${
            errors.estimatedTime ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
          placeholder="例: 2"
        />
        {errors.estimatedTime && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.estimatedTime}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <BossLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin/exam-management")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            試験管理に戻る
          </button>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            {isEditing ? "問題を編集" : "新しい問題を作成"}
          </h2>
          <p className="text-slate-600">
            {isEditing
              ? "問題の内容と設定を編集できます"
              : "新しい問題を作成し、タイプと内容を設定します"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg border border-slate-200 p-8"
        >
          {/* Question Type Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {questionTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setActiveTab(type.value);
                      setFormData((prev) => ({
                        ...prev,
                        type:
                          type.value === "type1"
                            ? "true_false"
                            : type.value === "type2"
                            ? "multiple_choice"
                            : type.value === "type3"
                            ? "single_choice"
                            : type.value,
                      }));
                    }}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === type.value
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                {
                  questionTypes.find((type) => type.value === activeTab)
                    ?.description
                }
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="mb-8">
            {activeTab === "type1" && renderType1Form()}
            {activeTab === "type2" && renderType2Form()}
            {activeTab === "type3" && renderType3Form()}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate("/admin/exam-management")}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              <Save className="w-5 h-5" />
              {isLoading
                ? "保存中..."
                : isEditing
                ? "変更を保存"
                : "問題を作成"}
            </button>
          </div>
        </form>
      </div>
    </BossLayout>
  );
};

export default ExamQuestionForm;
