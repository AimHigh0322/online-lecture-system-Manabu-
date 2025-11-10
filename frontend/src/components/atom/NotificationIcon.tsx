import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  X,
  Award,
} from "lucide-react";
import {
  useGetUnreadCountQuery,
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  type Notification,
} from "../../api/notifications/notificationApiSlice";
import { getStoredUser } from "../../api/auth/authService";
import { useToast } from "../../hooks/useToast";

interface NotificationIconProps {
  variant?: "default" | "admin";
}

export const NotificationIcon: React.FC<NotificationIconProps> = ({
  variant = "default",
}) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdminVariant = variant === "admin";

  const { data: unreadCount = 0 } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds
  });

  const { data, isLoading, refetch } = useGetNotificationsQuery(
    {},
    {
      pollingInterval: 30000,
    }
  );

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const { showToast } = useToast();

  const notifications = data?.notifications || [];
  const unreadCountFromList = data?.unreadCount || 0;
  const user = getStoredUser();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        iconRef.current &&
        !iconRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleNotificationClick = async (notification: Notification) => {
    setIsDropdownOpen(false);
    setSelectedNotification(notification);
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id).unwrap();
        refetch();
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleIssueCertificate = async (notification: Notification) => {
    try {
      // Mark notification as read
      if (!notification.isRead) {
        await markAsRead(notification._id).unwrap();
      }

      // Get userId from notification metadata
      const userId = notification.metadata?.userId;
      if (userId) {
        // Navigate to student management page with userId parameter
        navigate(`/student-management?userId=${userId}`);
      } else {
        // If no userId, just navigate to student management page
        navigate("/student-management");
      }

      // Close modal and refresh notifications
      setSelectedNotification(null);
      refetch();
    } catch (error) {
      console.error("Failed to handle certificate issuance:", error);
      showToast({
        type: "error",
        title: "エラー",
        message: "処理中にエラーが発生しました。",
        duration: 3000,
      });
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "たった今";
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return date.toLocaleDateString("ja-JP");
  };

  return (
    <>
      <div className="relative" ref={iconRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
            isAdminVariant
              ? "text-slate-200 hover:text-white hover:bg-slate-600"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
          aria-label="通知"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-gray-800">通知</h2>
                {unreadCountFromList > 0 && (
                  <span className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCountFromList}件の未読
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {unreadCountFromList > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>すべて既読</span>
                  </button>
                )}
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                  <Bell className="w-12 h-12 mb-4 text-gray-300" />
                  <p>通知はありません</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.isRead ? "bg-blue-50" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p
                                className={`text-sm font-medium ${
                                  !notification.isRead
                                    ? "text-gray-900"
                                    : "text-gray-700"
                                }`}
                              >
                                {notification.title}
                              </p>
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="mt-1 text-xs text-gray-400">
                                {formatDate(notification.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 ml-2">
                              {!notification.isRead && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getNotificationIcon(selectedNotification.type)}
                <h3 className="text-lg font-bold text-gray-800">
                  {selectedNotification.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {selectedNotification.message}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {formatDate(selectedNotification.createdAt)}
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              {isAdmin &&
                selectedNotification.metadata?.action ===
                  "issue_certificate" && (
                  <button
                    onClick={() => handleIssueCertificate(selectedNotification)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>修了証発行</span>
                  </button>
                )}
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 text-sm text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
