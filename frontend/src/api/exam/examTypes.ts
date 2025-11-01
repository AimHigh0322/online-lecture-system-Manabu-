// Exam Types
export interface Exam {
  _id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  instructions: string;
  timeLimit: number | null;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  status: "draft" | "published" | "archived";
  questions: string[];
  totalQuestions: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  durationHours?: number;
}

export interface ExamFormData {
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  instructions: string;
  timeLimit: number | null;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  status: "draft" | "published" | "archived";
}

export interface ExamStats {
  totalAttempts: number;
  completedAttempts: number;
}

// Question Types
export interface Question {
  _id: string;
  examId: string;
  type: QuestionType;
  title: string;
  content: string;
  order: number;
  options?: QuestionOption[]; // For single choice and multiple choice
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  typeDisplayName?: string;
  difficultyDisplayName?: string;
}

export type QuestionType = "true_false" | "multiple_choice" | "single_choice";

export interface QuestionOption {
  id: string;
  text: string;
  order: number;
}

export interface QuestionFormData {
  type: QuestionType;
  title: string;
  content: string;
  options?: QuestionOption[];
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

export interface QuestionTypeInfo {
  value: QuestionType;
  label: string;
  description: string;
}

// Exam Attempt Types
export interface ExamAttempt {
  _id: string;
  examId: string;
  studentId: string;
  studentName: string;
  attemptNumber: number;
  status: "in_progress" | "completed" | "abandoned" | "timeout";
  startedAt: string;
  completedAt: string | null;
  timeSpent: number;
  answers: ExamAnswer[];
  score?: number;
  percentage?: number;
  passed?: boolean;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
  durationHours?: number;
}

export interface ExamAnswer {
  questionId: string;
  answer: boolean | string | string[];
  answeredAt: string;
}

// API Response Types
export interface ExamListResponse {
  success: boolean;
  exams: Exam[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalExams: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface QuestionListResponse {
  success: boolean;
  questions: Question[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalQuestions: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Form Validation Types
export interface ExamErrors {
  title?: string;
  description?: string;
  courseId?: string;
  timeLimit?: string;
  maxAttempts?: string;
}

export interface QuestionErrors {
  title?: string;
  content?: string;
  options?: string;
}

// Course Options (reused from existing system)
export const courseOptions = [
  { id: "general", name: "一般講習" },
  { id: "caregiving", name: "介護講習" },
  { id: "specified-care", name: "介護基礎研修（特定）" },
  { id: "initial-care", name: "介護職員初任者研修" },
  { id: "jlpt", name: "日本語能力試験対策" },
  { id: "business-manner", name: "ビジネスマナー講習" },
];

// Question Type Options
export const questionTypeOptions: QuestionTypeInfo[] = [
  {
    value: "true_false",
    label: "True/False",
    description: "Yes/No or True/False questions",
  },
  {
    value: "single_choice",
    label: "Single Choice",
    description: "One correct answer from multiple options",
  },
  {
    value: "multiple_choice",
    label: "Multiple Choice",
    description: "Multiple correct answers from options",
  },
];

// Difficulty Options
export const difficultyOptions = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

// Status Options
export const examStatusOptions = [
  { value: "draft", label: "Draft", color: "gray" },
  { value: "published", label: "Published", color: "green" },
  { value: "archived", label: "Archived", color: "red" },
];
