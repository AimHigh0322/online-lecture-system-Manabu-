// Export base API slice
export { apiSlice } from "./apiSlice";

// Export profile API
export {
  profileApiSlice,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from "./profile/profileSlice";

// Export auth API
export {
  authApiSlice,
  useLoginMutation,
  useGetUserProfileQuery,
  useGetStudentsQuery,
} from "./auth/authApiSlice";

// Export payment API
export {
  paymentApiSlice,
  useCreatePaymentIntentMutation,
  useGetPaymentStatusQuery,
} from "./payment/PaymentSlice";

// Export student exam API
export {
  studentExamApiSlice,
  useGetAvailableExamsQuery,
  useGetExamHistoryQuery,
  useStartExamMutation,
  useGetExamQuestionsQuery,
  useSaveExamProgressMutation,
  useGetExamAttemptQuery,
} from "./student/studentExamApiSlice";

// Export admin question API
export {
  questionApiSlice,
  useGetQuestionsQuery,
  useGetQuestionByIdQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useGetQuestionTypesQuery,
} from "./admin/questionApiSlice";

// Export exam API
export {
  examApiSlice,
  useGetExamEligibilityQuery,
  useCheckExamEligibilityMutation,
} from "./exam/examApiSlice";

// Export notification API
export {
  notificationApiSlice,
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useSendNotificationMutation,
  useSendNotificationToAllMutation,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from "./notifications/notificationApiSlice";

export type {
  Question,
  QuestionFormData,
  QuestionListResponse,
  QuestionTypeInfo,
} from "./admin/questionApiSlice";

// Export types
export type {
  LoginCredentials,
  LoginResponse,
  User,
  UserProfile,
} from "./auth/authService";

export type { ProfileData, ProfileResponse } from "./profile/profileSlice";

export type {
  PaymentMetadata,
  PaymentIntentResponse,
  PaymentStatusResponse,
} from "./payment/PaymentSlice";

export type {
  Exam,
  ExamFormData,
  ExamListResponse,
  ApiResponse,
  ExamStats,
  QuestionType,
  QuestionOption,
  ExamAttempt,
  ExamAnswer,
  ExamErrors,
  QuestionErrors,
} from "./exam/examTypes";

export type {
  Notification,
  NotificationResponse,
  SendNotificationRequest,
  SendNotificationToAllRequest,
  UnreadCountResponse,
} from "./notifications/notificationApiSlice";

// Export constants
export {
  courseOptions,
  questionTypeOptions,
  difficultyOptions,
  examStatusOptions,
} from "./exam/examTypes";
