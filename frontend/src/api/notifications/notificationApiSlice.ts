import { apiSlice } from "../apiSlice";

export interface Notification {
  _id: string;
  title: string;
  message: string;
  recipientId: string;
  senderId: string;
  isRead: boolean;
  readAt: string | null;
  type: "info" | "warning" | "success" | "error";
  metadata?: {
    userId?: string;
    studentName?: string;
    action?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  data?: {
    notifications: Notification[];
    total: number;
    unreadCount: number;
  };
  message?: string;
}

export interface SendNotificationRequest {
  recipientId: string;
  title: string;
  message: string;
  type?: "info" | "warning" | "success" | "error";
}

export interface SendNotificationToAllRequest {
  title: string;
  message: string;
  type?: "info" | "warning" | "success" | "error";
}

export interface UnreadCountResponse {
  success: boolean;
  data?: {
    unreadCount: number;
  };
  message?: string;
}

export const notificationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all notifications for current user
    getNotifications: builder.query<
      { notifications: Notification[]; total: number; unreadCount: number },
      { limit?: number; skip?: number }
    >({
      query: ({ limit = 50, skip = 0 }) => ({
        url: `/api/notifications?limit=${limit}&skip=${skip}`,
        method: "GET",
      }),
      transformResponse: (response: NotificationResponse) => {
        if (!response.success || !response.data) {
          throw new Error(response.message || "通知の取得に失敗しました");
        }
        return response.data;
      },
      providesTags: ["Notifications"],
    }),

    // Get unread notification count
    getUnreadCount: builder.query<number, void>({
      query: () => ({
        url: "/api/notifications/unread-count",
        method: "GET",
      }),
      transformResponse: (response: UnreadCountResponse) => {
        if (!response.success || !response.data) {
          return 0;
        }
        return response.data.unreadCount;
      },
      providesTags: ["Notifications"],
    }),

    // Send notification to specific user (admin only)
    sendNotification: builder.mutation<
      { success: boolean; data: Notification },
      SendNotificationRequest
    >({
      query: (data) => ({
        url: "/api/notifications/send",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: {
        success: boolean;
        data: Notification;
        message?: string;
      }) => {
        if (!response.success) {
          throw new Error(response.message || "通知の送信に失敗しました");
        }
        return response;
      },
      invalidatesTags: ["Notifications"],
    }),

    // Send notification to all students (admin only)
    sendNotificationToAll: builder.mutation<
      { success: boolean; message: string; data: { count: number } },
      SendNotificationToAllRequest
    >({
      query: (data) => ({
        url: "/api/notifications/send-all",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: { count: number };
      }) => {
        if (!response.success) {
          throw new Error(response.message || "通知の送信に失敗しました");
        }
        return response;
      },
      invalidatesTags: ["Notifications"],
    }),

    // Mark notification as read
    markAsRead: builder.mutation<
      { success: boolean; data: Notification },
      string
    >({
      query: (notificationId) => ({
        url: `/api/notifications/${notificationId}/read`,
        method: "PATCH",
      }),
      transformResponse: (response: {
        success: boolean;
        data: Notification;
        message?: string;
      }) => {
        if (!response.success) {
          throw new Error(response.message || "通知の更新に失敗しました");
        }
        return response;
      },
      invalidatesTags: ["Notifications"],
    }),

    // Mark all notifications as read
    markAllAsRead: builder.mutation<
      { success: boolean; data: { updatedCount: number } },
      void
    >({
      query: () => ({
        url: "/api/notifications/read-all",
        method: "PATCH",
      }),
      transformResponse: (response: {
        success: boolean;
        data: { updatedCount: number };
        message?: string;
      }) => {
        if (!response.success) {
          throw new Error(response.message || "通知の更新に失敗しました");
        }
        return response;
      },
      invalidatesTags: ["Notifications"],
    }),

    // Delete notification
    deleteNotification: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (notificationId) => ({
        url: `/api/notifications/${notificationId}`,
        method: "DELETE",
      }),
      transformResponse: (response: { success: boolean; message?: string }) => {
        if (!response.success) {
          throw new Error(response.message || "通知の削除に失敗しました");
        }
        return {
          success: response.success,
          message: response.message || "通知が正常に削除されました",
        };
      },
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useSendNotificationMutation,
  useSendNotificationToAllMutation,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationApiSlice;
