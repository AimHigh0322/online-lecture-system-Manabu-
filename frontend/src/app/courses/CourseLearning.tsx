import React, { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  PictureInPicture,
  BookOpen,
  Loader2,
  SkipBack,
  SkipForward,
  Check,
  Heart,
  Search,
  Save,
  BarChart3,
  MoreVertical,
  Clock,
  Calendar,
  X,
} from "lucide-react";
import { useGetMaterialsByCourseQuery } from "../../api/materials/materialSlice";
import { useCheckExamEligibilityMutation } from "../../api/exam/examApiSlice";
import { useToast } from "../../hooks/useToast";
import { getAuthToken } from "../../api/auth/authService";
import { ConfirmModal } from "../../components/atom/ConfirmModal";
import { Pagination } from "../../components/atom/Pagination";

// Utility function to get API URL based on environment
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  const isProduction =
    import.meta.env.MODE === "production" ||
    import.meta.env.VITE_NODE_ENV === "production";

  return isProduction ? "http://103.179.45.68:4000" : "http://localhost:4000";
};

// Utility function to construct file URL
const getFileUrl = (relativePath: string): string =>
  `${getApiUrl()}${relativePath}`;

interface Lesson {
  type: "video";
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  completed: boolean;
  order: number;
  // Additional detail fields
  uploadedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  viewCount?: number;
  downloadCount?: number;
}

// Pagination component is used instead of inline controls

export const CourseLearning: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [checkExamEligibility] = useCheckExamEligibilityMutation();

  // Fetch materials from backend
  const {
    data: materialsData,
    error: materialsError,
    isLoading: materialsLoading,
  } = useGetMaterialsByCourseQuery(courseId || "");

  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [completedMaterials, setCompletedMaterials] = useState<Set<string>>(
    new Set()
  );
  const [allVideoProgress, setAllVideoProgress] = useState<Map<string, number>>(
    new Map()
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lessonToComplete, setLessonToComplete] = useState<Lesson | null>(null);
  const [originalTime, setOriginalTime] = useState(0);
  // Removed document tab - only video learning is supported
  const [searchTerm, setSearchTerm] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLessonDetail, setSelectedLessonDetail] =
    useState<Lesson | null>(null);
  // Sidebar pagination state
  const [page, setPage] = useState(1);
  const pageSize = 5;
  // Video ended state - to show save indicator
  const [videoEnded, setVideoEnded] = useState(false);

  // Derive pagination values from filtered lessons (defined later)
  // Moved below after filteredLessons is defined

  // Progress statistics state (async loading)
  const [progressStats, setProgressStats] = useState({
    totalVideos: 0,
    completedVideos: 0,
    uncompletedVideos: 0,
    videoCompletionRate: 0,
    progressRate: 0,
    watchedRate: 0, // Videos watched at least 1%
    isLoading: true,
  });

  // Favorites state - stored in database
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Exposed refresh function (used by button)
  const refreshProgressView = async () => {
    if (!courseId) return;
    try {
      setProgressStats((prev) => ({ ...prev, isLoading: true }));
      const API_URL = getApiUrl();
      const token = getAuthToken();
      if (!token) {
        setProgressStats((prev) => ({ ...prev, isLoading: false }));
        return;
      }
      const response = await fetch(`${API_URL}/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setProgressStats((prev) => ({ ...prev, isLoading: false }));
        return;
      }
      const data = await response.json();
      const completed = new Set<string>();
      const progressMap = new Map<string, number>();
      if (data.success && data.course?.videoProgress) {
        data.course.videoProgress.forEach(
          (item: { materialName: string; progress: number }) => {
            progressMap.set(item.materialName, item.progress);
            if (item.progress === 100) completed.add(item.materialName);
          }
        );
      }
      if (data.success && data.course?.lectureProgress) {
        data.course.lectureProgress.forEach(
          (item: { materialName: string; progress: number }) => {
            if (!progressMap.has(item.materialName)) {
              progressMap.set(item.materialName, item.progress);
            }
            if (item.progress === 100) completed.add(item.materialName);
          }
        );
      }
      setCompletedMaterials(completed);
      setAllVideoProgress(progressMap);

      // Recompute stats from latest map
      const totalVideos = lessons.length;
      const completedVideos = lessons.filter((l) =>
        completed.has(l.title)
      ).length;
      const uncompletedVideos = totalVideos - completedVideos;
      const videoCompletionRate =
        totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
      let totalProgress = 0;
      let watchedVideos = 0;
      lessons.forEach((l) => {
        const vp = progressMap.get(l.title) || 0;
        totalProgress += vp;
        if (vp >= 1) watchedVideos++;
      });
      const progressRate =
        totalVideos > 0 ? Math.round(totalProgress / totalVideos) : 0;
      const watchedRate =
        totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : 0;
      setProgressStats({
        totalVideos,
        completedVideos,
        uncompletedVideos,
        videoCompletionRate,
        progressRate,
        watchedRate,
        isLoading: false,
      });
    } catch (e) {
      console.error("Refresh progress failed", e);
      setProgressStats((prev) => ({ ...prev, isLoading: false }));
      showToast({
        type: "error",
        title: "更新失敗",
        message: "進捗の再取得に失敗しました",
      });
    }
  };

  // Toggle favorite status (with API call)
  const toggleFavorite = async (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const API_URL = getApiUrl();
      const token = getAuthToken();

      if (!token) {
        showToast({
          type: "error",
          title: "認証エラー",
          message: "ログインが必要です。",
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/profile/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ materialId: lessonId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFavorites(new Set(data.favorites || []));
        showToast({
          type: data.isFavorite ? "success" : "info",
          title: data.isFavorite ? "お気に入りに追加" : "お気に入りから削除",
          message: data.message,
          duration: 2000,
        });
      } else {
        showToast({
          type: "error",
          title: "エラー",
          message: data.message || "お気に入りの更新に失敗しました",
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      showToast({
        type: "error",
        title: "エラー",
        message: "お気に入りの更新に失敗しました",
      });
    }
  };

  const courseNames: { [key: string]: string } = {
    general: "一般講習",
    caregiving: "介護講習",
    "specified-care": "介護基礎研修（特定）",
    "initial-care": "介護職員初任者研修",
    jlpt: "日本語能力試験対策",
    "business-manner": "ビジネスマナー講習",
  };

  const courseName = courseNames[courseId || ""] || "コース";

  // Convert materials to lessons
  const lessons: Lesson[] = useMemo(
    () =>
      materialsData?.materials
        ?.filter((material) => material.type === "video")
        .map((material, index) => ({
          type: "video" as const,
          id: material._id,
          title: material.title,
          description: material.description,
          videoUrl: material.videoUrl
            ? getFileUrl(material.videoUrl)
            : undefined,
          completed: false, // This could be tracked in user progress
          order: index + 1,
          // Additional detail fields
          uploadedBy: material.uploadedBy,
          createdAt: material.createdAt,
          updatedAt: material.updatedAt,
          viewCount: material.viewCount || 0,
          downloadCount: material.downloadCount || 0,
        })) || [],
    [materialsData?.materials]
  );

  // Get lessons based on search term and favorites filter
  const filteredLessons = useMemo(() => {
    let filtered = lessons;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lesson) =>
          lesson.title.toLowerCase().includes(searchLower) ||
          lesson.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter((lesson) => favorites.has(lesson.id));
    }

    return filtered;
  }, [lessons, searchTerm, showFavoritesOnly, favorites]);

  // Pagination derived values based on filteredLessons
  const totalPages = Math.max(1, Math.ceil(filteredLessons.length / pageSize));
  const pagedLessons = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLessons.slice(start, start + pageSize);
  }, [filteredLessons, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [totalPages, page]);

  // Set first lesson as current when materials load
  useEffect(() => {
    if (filteredLessons.length > 0) {
      // If current lesson is not in filtered lessons, switch to first lesson
      if (
        !currentLesson ||
        !filteredLessons.find((l) => l.id === currentLesson.id)
      ) {
        setCurrentLesson(filteredLessons[0]);
        setIsPlaying(false);
        setOriginalTime(0);
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.load();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredLessons]);

  // Fetch favorites from database
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const API_URL = getApiUrl();
        const token = getAuthToken();

        if (!token) {
          return;
        }

        const response = await fetch(`${API_URL}/api/profile/favorites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.favorites) {
            setFavorites(new Set(data.favorites));
          }
        }
      } catch (error) {
        console.error("Error fetching favorites:", error);
      }
    };

    fetchFavorites();
  }, []);

  // Fetch course progress to check completed materials (async)
  useEffect(() => {
    const fetchCourseProgress = async () => {
      if (!courseId) {
        setProgressStats((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const API_URL = getApiUrl();
        const token = getAuthToken();

        if (!token) {
          setProgressStats((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        const response = await fetch(`${API_URL}/api/courses/${courseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const completed = new Set<string>();
          const progressMap = new Map<string, number>();

          // Handle video progress (with percentage)
          if (data.success && data.course?.videoProgress) {
            data.course.videoProgress.forEach(
              (item: { materialName: string; progress: number }) => {
                progressMap.set(item.materialName, item.progress);
                if (item.progress === 100) {
                  completed.add(item.materialName);
                }
              }
            );
          }

          // Legacy support: also check lectureProgress for backward compatibility
          if (data.success && data.course?.lectureProgress) {
            data.course.lectureProgress.forEach(
              (item: { materialName: string; progress: number }) => {
                if (!progressMap.has(item.materialName)) {
                  progressMap.set(item.materialName, item.progress);
                }
                if (item.progress === 100) {
                  completed.add(item.materialName);
                }
              }
            );
          }

          setCompletedMaterials(completed);
          setAllVideoProgress(progressMap);

          // Calculate progress statistics asynchronously (after state updates)
          requestAnimationFrame(() => {
            setTimeout(() => {
              const totalVideos = lessons.length;
              const completedVideos = lessons.filter((lesson: Lesson) =>
                completed.has(lesson.title)
              ).length;
              const uncompletedVideos = totalVideos - completedVideos;
              const videoCompletionRate =
                totalVideos > 0
                  ? Math.round((completedVideos / totalVideos) * 100)
                  : 0;

              let totalProgress = 0;
              let watchedVideos = 0;
              lessons.forEach((lesson: Lesson) => {
                const videoProgress = progressMap.get(lesson.title) || 0;
                totalProgress += videoProgress;
                if (videoProgress >= 1) {
                  watchedVideos++;
                }
              });
              const progressRate =
                totalVideos > 0 ? Math.round(totalProgress / totalVideos) : 0;
              const watchedRate =
                totalVideos > 0
                  ? Math.round((watchedVideos / totalVideos) * 100)
                  : 0;

              setProgressStats({
                totalVideos,
                completedVideos,
                uncompletedVideos,
                videoCompletionRate,
                progressRate,
                watchedRate,
                isLoading: false,
              });
            }, 50);
          });
        } else {
          setProgressStats((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Error fetching course progress:", error);
        setProgressStats((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetchCourseProgress();
  }, [courseId, lessons]);

  // Handle errors
  useEffect(() => {
    if (materialsError) {
      showToast({
        type: "error",
        title: "エラー",
        message: "教材の読み込みに失敗しました。",
      });
    }
  }, [materialsError, showToast]);

  const handleLessonSelect = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setIsPlaying(false);
    setOriginalTime(0); // Reset original time for new lesson
    setVideoEnded(false); // Reset video ended state
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.load();
    }
  };

  const handlePreviousVideo = () => {
    if (currentLesson) {
      const currentIndex = filteredLessons.findIndex(
        (lesson) => lesson.id === currentLesson.id
      );
      if (currentIndex > 0) {
        const previousLesson = filteredLessons[currentIndex - 1];
        setCurrentLesson(previousLesson);
        setIsPlaying(false);
        setOriginalTime(0); // Reset original time for new lesson
        setVideoEnded(false); // Reset video ended state
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.load();
        }
      }
    }
  };

  const handleNextVideo = () => {
    if (currentLesson) {
      const currentIndex = filteredLessons.findIndex(
        (lesson) => lesson.id === currentLesson.id
      );
      if (currentIndex < filteredLessons.length - 1) {
        const nextLesson = filteredLessons[currentIndex + 1];
        setCurrentLesson(nextLesson);
        setIsPlaying(false);
        setOriginalTime(0); // Reset original time for new lesson
        setVideoEnded(false); // Reset video ended state
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.load();
        }
      }
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
        // Reset video ended state when playing again
        if (videoEnded) {
          setVideoEnded(false);
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoClick = () => {
    if (isPlaying && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      // Store the original time position when video starts playing
      if (originalTime === 0 && videoRef.current.currentTime > 0) {
        setOriginalTime(videoRef.current.currentTime);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      setIsMuted(newVolume === 0);
    }
  };

  const enterFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const enterPictureInPicture = () => {
    if (videoRef.current && document.pictureInPictureEnabled) {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      } else {
        videoRef.current.requestPictureInPicture();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Handle complete button click for a specific lesson - save lecture progress to database
  const handleCompleteClick = async (lesson: Lesson) => {
    if (!courseId) return;

    try {
      const API_URL = getApiUrl();
      const token = getAuthToken();

      if (!token) {
        console.error("No auth token found");
        showToast({
          type: "error",
          title: "認証エラー",
          message: "ログインが必要です。",
        });
        return;
      }

      // Calculate and save progress percentage
      const progressToSave =
        lesson.id === currentLesson?.id && duration > 0
          ? Math.round((currentTime / duration) * 100)
          : 100;

      const requestBody = {
        materialName: lesson.title,
        materialType: "video",
        progress: progressToSave,
      };

      const response = await fetch(
        `${API_URL}/api/courses/${courseId}/progress`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to update lecture progress:", data.message);
      } else {
        // Only show toast if not skipped
        if (!data.skipped) {
          const progressToSave =
            lesson.id === currentLesson?.id && duration > 0
              ? Math.round((currentTime / duration) * 100)
              : 100;

          showToast({
            type: "success",
            title: "進捗を保存しました",
            message: `「${lesson.title}」の進捗: ${progressToSave}%`,
            duration: 2000,
          });

          // Update completed materials state if progress is 100%
          if (progressToSave === 100) {
            setCompletedMaterials((prev) => new Set(prev).add(lesson.title));
          }

          // Update progress map
          setAllVideoProgress((prev) => {
            const newMap = new Map(prev);
            newMap.set(lesson.title, progressToSave);
            return newMap;
          });

          // Reset video ended state after saving
          setVideoEnded(false);

          // Check exam eligibility if this was a completion (100% progress)
          if (progressToSave === 100) {
            try {
              const eligibilityResult = await checkExamEligibility({}).unwrap();
              if (eligibilityResult.examEligible) {
                showToast({
                  type: "success",
                  title: "試験資格取得！",
                  message:
                    "すべてのコースが完了しました。試験ルームで試験を受けることができます。",
                  duration: 5000,
                });
              }
            } catch (eligibilityError) {
              console.error(
                "Error checking exam eligibility:",
                eligibilityError
              );
              // Don't show error toast for eligibility check failure
            }
          }
        }
      }
    } catch (error) {
      console.error("Error updating lecture progress:", error);
    }
  };

  // Use async progress statistics
  const {
    totalVideos,
    completedVideos,
    uncompletedVideos,
    videoCompletionRate,
    progressRate,
    watchedRate,
  } = progressStats;

  // Helper function to generate trend data (mock data for now)
  const generateTrendData = (value: number, count: number = 7) => {
    const trend = [];
    const baseValue = value * 0.7; // Start from 70% of current value
    const increment = (value - baseValue) / (count - 1);

    for (let i = 0; i < count; i++) {
      const variation = (Math.random() - 0.5) * 5; // Random variation of ±2.5%
      trend.push(
        Math.max(0, Math.min(100, baseValue + increment * i + variation))
      );
    }
    return trend;
  };

  // Semi-circle progress gauge component
  const SemiCircleGauge: React.FC<{
    percentage: number;
    color: string;
    size?: number;
  }> = ({ percentage, color, size = 120 }) => {
    const radius = size / 2 - 10;
    const centerX = size / 2;
    const centerY = size / 2;
    const circumference = Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const strokeWidth = 8;

    return (
      <svg width={size} height={size / 2 + 10} className="mx-auto">
        {/* Background arc */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${
            centerX + radius
          } ${centerY}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${
            centerX + radius
          } ${centerY}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
        {/* Percentage text */}
        <text
          x={centerX}
          y={centerY + 5}
          textAnchor="middle"
          className="text-2xl font-bold fill-gray-900"
        >
          {percentage}%
        </text>
      </svg>
    );
  };

  // Trend chart component
  const TrendChart: React.FC<{
    data: number[];
    color: string;
    height?: number;
  }> = ({ data, color, height = 40 }) => {
    const width = 120;
    const maxValue = Math.max(...data, 100);
    const minValue = Math.min(...data, 0);
    const range = maxValue - minValue || 1;
    const stepX = width / (data.length - 1);

    const points = data
      .map((value, index) => {
        const x = index * stepX;
        const y = height - ((value - minValue) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");

    const areaPoints = `0,${height} ${points} ${width},${height}`;

    return (
      <svg width={width} height={height} className="mx-auto">
        {/* Area under line */}
        <polygon points={areaPoints} fill={color} fillOpacity="0.2" />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  // Handle confirmation modal
  const handleConfirmRecord = () => {
    if (lessonToComplete) {
      handleCompleteClick(lessonToComplete);
    }
    setShowConfirmModal(false);
    setLessonToComplete(null);
  };

  const handleCancelRecord = () => {
    setShowConfirmModal(false);
    setLessonToComplete(null);
  };

  // Close volume slider when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showVolumeSlider) {
        const target = event.target as Element;
        // Check if the click is outside the volume control area
        if (!target.closest("[data-volume-control]")) {
          setShowVolumeSlider(false);
        }
      }
    };

    if (showVolumeSlider) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showVolumeSlider]);

  // Show loading state
  if (materialsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">教材を読み込み中...</p>
        </div>
      </div>
    );
  }

  // Show no materials message
  if (!materialsLoading && lessons.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            教材が見つかりません
          </h2>
          <p className="text-gray-600 mb-4">
            このコースにはまだ教材がアップロードされていません。
          </p>
          <button
            onClick={() => navigate("/courses")}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
          >
            コース一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  // Show error if no current lesson
  if (!currentLesson) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">レッスンを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header with Course Title */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{courseName}</h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="動画を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  ×
                </button>
              )}
            </div>

            {/* Favorite Filter Toggle */}
            <button
              type="button"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
                showFavoritesOnly
                  ? "bg-red-100 text-red-700 border border-red-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  showFavoritesOnly
                    ? "fill-red-500 text-red-500"
                    : "text-gray-400"
                }`}
              />
              <span>お気に入りのみ</span>
            </button>

            {/* Progress Stats Modal Button (also refreshes data) */}
            <button
              type="button"
              onClick={async () => {
                await refreshProgressView();
                setShowProgressModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
              title="進捗統計を表示"
            >
              <BarChart3 className="w-4 h-4" />
              <span>進捗統計</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player - Left Section (2/3 width) */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-lg overflow-hidden">
              {/* Media Container */}
              <div className="relative bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-96 lg:h-[500px] object-cover cursor-pointer"
                  poster="/img/video-poster.jpg"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => {
                    setIsPlaying(false);
                    setVideoEnded(true);
                  }}
                  onClick={handleVideoClick}
                  onError={(e) => {
                    console.error("Video error:", e);
                    showToast({
                      type: "error",
                      title: "動画エラー",
                      message:
                        "動画の読み込みに失敗しました。URLを確認してください。",
                    });
                  }}
                >
                  <source src={currentLesson.videoUrl} type="video/mp4" />
                  お使いのブラウザは動画をサポートしていません。
                </video>

                {/* Video Overlay - Red Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {!isPlaying && (
                    <button
                      onClick={togglePlayPause}
                      className="bg-red-500 hover:bg-red-600 rounded-full p-6 transition-all duration-200 shadow-lg cursor-pointer"
                    >
                      <Play className="w-12 h-12 text-white ml-1" />
                    </button>
                  )}
                </div>

                {/* Save Indicator - Shows when video ends - Modern inline banner */}
                {videoEnded && (
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 z-40"
                    style={{
                      animation: "slideUp 0.3s ease-out",
                    }}
                  >
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            動画が終了しました
                          </p>
                          <p className="text-xs text-slate-300">
                            進捗を保存してください
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.pause();
                            }
                            setIsPlaying(false);
                            setVideoEnded(false);
                            setLessonToComplete(currentLesson);
                            setShowConfirmModal(true);
                          }}
                          className="bg-white hover:bg-slate-100 text-slate-800 font-medium py-1.5 px-4 rounded text-sm transition-colors duration-200 flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>保存</span>
                        </button>
                        <button
                          onClick={() => setVideoEnded(false)}
                          className="text-slate-300 hover:text-white transition-colors cursor-pointer p-1"
                          aria-label="閉じる"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Floating record button removed to match simple control style */}
              </div>

              {/* Controls */}
              <div className="bg-gray-800 text-white p-3">
                <div className="flex flex-row items-center  gap-3">
                  {/* Play/Pause Button */}
                  <button
                    onClick={togglePlayPause}
                    className="flex items-center justify-center text-white hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </button>

                  {/* Previous Video */}
                  <button
                    onClick={handlePreviousVideo}
                    className="flex items-center justify-center text-white hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  {/* Next Video */}
                  <button
                    onClick={handleNextVideo}
                    className="flex items-center justify-center text-white hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>

                  {/* Volume Control */}
                  <div className="relative" data-volume-control>
                    <button
                      onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                      className="flex items-center justify-center text-white hover:text-gray-300 transition-colors cursor-pointer"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                    {showVolumeSlider && (
                      <div
                        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg p-3"
                        onClick={(e) => e.stopPropagation()}
                        data-volume-control
                      >
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          onClick={(e) => e.stopPropagation()}
                          className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${
                              (isMuted ? 0 : volume) * 100
                            }%, #6b7280 ${
                              (isMuted ? 0 : volume) * 100
                            }%, #6b7280 100%)`,
                          }}
                        />
                        <div className="text-xs text-white text-center mt-1">
                          {Math.round((isMuted ? 0 : volume) * 100)}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Time Display */}
                  <span className="text-sm text-gray-300 ml-2">
                    {formatTime(currentTime)}/{formatTime(duration)}
                  </span>

                  {/* Red Progress Bar - Non-interactive */}
                  <div className="flex-1 mx-3">
                    <div
                      className="w-full h-1 bg-gray-600 rounded-lg relative"
                      style={{
                        background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${
                          (currentTime / (duration || 1)) * 100
                        }%, #6b7280 ${
                          (currentTime / (duration || 1)) * 100
                        }%, #6b7280 100%)`,
                      }}
                    />
                  </div>

                  {/* Spacer pushes actions to the right */}
                  <div className="ml-auto"></div>

                  {/* Record (Save progress) - simple icon button like others */}
                  {currentLesson && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (videoRef.current) {
                          videoRef.current.pause();
                        }
                        setIsPlaying(false);
                        setVideoEnded(false); // Hide save indicator after saving
                        setLessonToComplete(currentLesson);
                        setShowConfirmModal(true);
                      }}
                      title="進捗を記録"
                      className={`relative transition-all duration-300 cursor-pointer ${
                        videoEnded
                          ? "text-orange-400 hover:text-orange-300 scale-110"
                          : "text-white hover:text-gray-300"
                      }`}
                    >
                      <Save
                        className={`w-5 h-5 ${
                          videoEnded
                            ? "animate-bounce filter drop-shadow-lg"
                            : ""
                        }`}
                        style={
                          videoEnded
                            ? {
                                filter:
                                  "drop-shadow(0 0 8px rgba(251, 146, 60, 0.8))",
                              }
                            : undefined
                        }
                      />
                      {videoEnded && (
                        <>
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-gray-800 animate-ping"></span>
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-gray-800"></span>
                          <span className="absolute inset-0 rounded-full bg-orange-400 opacity-20 animate-ping"></span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Picture in Picture */}
                  <button
                    onClick={enterPictureInPicture}
                    className="flex items-center justify-center text-white hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    <PictureInPicture className="w-5 h-5" />
                  </button>

                  {/* Fullscreen */}
                  <button
                    onClick={enterFullscreen}
                    className="flex items-center justify-center text-white hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    <Maximize className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Instructions Section */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    重要なお知らせ
                  </h3>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p>
                      <strong>
                        動画視聴後は必ず「記録」ボタンを押してください。
                      </strong>
                    </p>
                    <p>
                      各動画の進捗表示横にある「記録」アイコンを押さないと、進捗率が更新されません。
                    </p>
                    <p className="text-blue-700">
                      ※
                      進捗は手動で保存する必要があります。動画を視聴するだけでは自動的に保存されません。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lesson List Sidebar - Right Section (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="bg-white h-full flex flex-col">
              {/* Lesson List Header */}
              <div className="border-b border-gray-200 px-2 pt-2 pb-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  動画 ({totalVideos})
                </h3>
              </div>
              {/* Paged list (no scrollbar) */}
              <div className="flex-1 pt-2 pr-2">
                {filteredLessons.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <BookOpen className="w-12 h-12 text-gray-400 mb-2" />
                    <p className="text-gray-600 text-sm">
                      {searchTerm || showFavoritesOnly
                        ? "検索条件に一致する動画が見つかりません"
                        : "動画教材がありません"}
                    </p>
                    {(searchTerm || showFavoritesOnly) && (
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setShowFavoritesOnly(false);
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
                      >
                        フィルターをクリア
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pagedLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className={`w-full relative hover:bg-gray-50 transition-colors p-2 ${
                          currentLesson.id === lesson.id
                            ? "bg-blue-50 border-l-4 border-l-blue-500"
                            : ""
                        }`}
                      >
                        {/* Checkmark for completed lectures */}
                        {completedMaterials.has(lesson.title) && (
                          <Check className="w-7 h-7 absolute -top-0.5 left-0 text-emerald-400 z-10" />
                        )}
                        <div
                          className="cursor-pointer"
                          onClick={() => handleLessonSelect(lesson)}
                        >
                          <div className="flex items-start space-x-3">
                            {/* Thumbnail/Icon */}
                            <div className="flex-shrink-0">
                              <div className="relative w-32 h-20 bg-black rounded flex items-center justify-center">
                                {/* Red play button in center */}
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                  <Play className="w-3 h-3 text-white ml-0.5" />
                                </div>
                                {/* Red progress line at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"></div>
                              </div>
                            </div>

                            {/* Content Section */}
                            <div className="flex-1 min-w-0">
                              {/* Top Section: Title/Subtitle with Detail Button */}
                              <div className="mb-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-sm font-medium text-gray-900 leading-tight truncate flex-1">
                                        {lesson.title}
                                      </h4>
                                      {/* Detail Button - positioned at end of title */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedLessonDetail(lesson);
                                          setShowDetailModal(true);
                                        }}
                                        className="flex-shrink-0 p-[3px] rounded-md text-red-500 hover:bg-gray-200 hover:text-red-600 transition-colors"
                                        title="詳細情報"
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed truncate">
                                      {lesson.description}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Bottom Section: Time/Rate, Progress Bar, Favorite Button, and Record Button */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-gray-600">
                                  <span className="font-mono">
                                    {currentLesson.id === lesson.id
                                      ? `${formatTime(
                                          currentTime
                                        )} / ${formatTime(duration)}`
                                      : `0:00 / ${formatTime(duration)}`}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-500">
                                      {allVideoProgress.get(lesson.title) || 0}%
                                      /{" "}
                                      {currentLesson.id === lesson.id
                                        ? duration > 0
                                          ? Math.round(
                                              (currentTime / duration) * 100
                                            )
                                          : 0
                                        : 0}
                                      %
                                    </span>
                                    {/* Record button moved to player controls */}
                                    {/* Favorite heart button - positioned at end of progress percentage */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(lesson.id, e);
                                      }}
                                      className="flex-shrink-0 p-0.5 hover:bg-red-50 rounded transition-colors"
                                      title={
                                        favorites.has(lesson.id)
                                          ? "お気に入りから削除"
                                          : "お気に入りに追加"
                                      }
                                    >
                                      <Heart
                                        className={`w-4 h-4 ${
                                          favorites.has(lesson.id)
                                            ? "fill-red-500 text-red-500"
                                            : "text-gray-400 hover:text-red-500"
                                        } transition-colors`}
                                      />
                                    </button>
                                  </div>
                                </div>

                                {/* Progress bar - Full width container */}
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                  <div
                                    className="bg-red-500 h-1 rounded-full transition-all"
                                    style={{
                                      width: `${
                                        currentLesson.id === lesson.id
                                          ? duration > 0
                                            ? (currentTime / duration) * 100
                                            : 0
                                          : 0
                                      }%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Pagination Controls */}
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={(p) => setPage(p)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={handleCancelRecord}
        onConfirm={handleConfirmRecord}
        title="進捗を記録しますか？"
        message={
          <div>
            <p className="mb-2">
              「{lessonToComplete?.title}」の進捗を記録しますか？
            </p>
            <p className="text-sm text-gray-600">
              現在の視聴進捗:{" "}
              {lessonToComplete && duration > 0
                ? Math.round((currentTime / duration) * 100)
                : 0}
              %
            </p>
          </div>
        }
        confirmText="記録する"
        cancelText="キャンセル"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Video Detail Modal */}
      {showDetailModal && selectedLessonDetail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                動画詳細情報
              </h2>
            </div>

            {/* Modal Content */}
            <div className="px-4 py-3">
              {/* Video Title */}
              <h3 className="text-base font-medium text-gray-900 mb-2">
                {selectedLessonDetail.title}
              </h3>

              {/* Description */}
              <div className="mb-3">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {selectedLessonDetail.description}
                </p>
              </div>

              {/* Progress Information */}
              <div className="mb-3 p-2 bg-gray-50 rounded">
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">保存済み進捗:</span>
                    <span className="font-medium text-gray-900">
                      {allVideoProgress.get(selectedLessonDetail.title) || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">完了状態:</span>
                    <span className="font-medium">
                      {completedMaterials.has(selectedLessonDetail.title) ? (
                        <span className="text-green-600">✓ 完了</span>
                      ) : (
                        <span className="text-gray-600">未完了</span>
                      )}
                    </span>
                  </div>
                  {selectedLessonDetail.id === currentLesson.id && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">現在の視聴進捗:</span>
                      <span className="font-medium text-gray-900">
                        {duration > 0
                          ? `${Math.round((currentTime / duration) * 100)}%`
                          : "0%"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Metadata */}
              <div className="space-y-2 mb-3 text-sm">
                {selectedLessonDetail.createdAt && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>
                      作成日:{" "}
                      {new Date(
                        selectedLessonDetail.createdAt
                      ).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}

                {selectedLessonDetail.id === currentLesson.id &&
                  duration > 0 && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>動画の長さ: {formatTime(duration)}</span>
                    </div>
                  )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedLessonDetail(null);
                  }}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Statistics Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                進捗統計
              </h2>
              <button
                onClick={() => setShowProgressModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6">
              {progressStats.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Total Videos */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-gray-900">
                        総レッスン数
                      </h3>
                    </div>
                    <div className="mb-4">
                      <div className="text-4xl font-bold text-gray-900 text-center">
                        {totalVideos}
                      </div>
                      <div className="text-sm text-gray-500 text-center mt-2">
                        レッスン
                      </div>
                    </div>
                    <div className="mt-4">
                      <TrendChart
                        data={generateTrendData(100)}
                        color="#6366f1"
                        height={40}
                      />
                    </div>
                  </div>

                  {/* Completed Videos */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-gray-900">
                        完了数
                      </h3>
                    </div>
                    <div className="mb-4">
                      <div className="text-4xl font-bold text-green-700 text-center">
                        {completedVideos}
                      </div>
                      <div className="text-sm text-gray-500 text-center mt-2">
                        完了
                      </div>
                    </div>
                    <div className="mt-4">
                      <TrendChart
                        data={generateTrendData(
                          totalVideos > 0
                            ? (completedVideos / totalVideos) * 100
                            : 0
                        )}
                        color="#10b981"
                        height={40}
                      />
                    </div>
                  </div>

                  {/* Uncompleted Videos */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-gray-900">
                        未完了数
                      </h3>
                    </div>
                    <div className="mb-4">
                      <div className="text-4xl font-bold text-orange-700 text-center">
                        {uncompletedVideos}
                      </div>
                      <div className="text-sm text-gray-500 text-center mt-2">
                        未完了
                      </div>
                    </div>
                    <div className="mt-4">
                      <TrendChart
                        data={generateTrendData(
                          totalVideos > 0
                            ? (uncompletedVideos / totalVideos) * 100
                            : 0
                        )}
                        color="#f59e0b"
                        height={40}
                      />
                    </div>
                  </div>

                  {/* Video Completion Rate */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-gray-900">
                        動画完了率
                      </h3>
                    </div>
                    <div className="mb-4">
                      <SemiCircleGauge
                        percentage={videoCompletionRate}
                        color={
                          videoCompletionRate >= 80
                            ? "#10b981"
                            : videoCompletionRate >= 50
                            ? "#f59e0b"
                            : "#ef4444"
                        }
                        size={140}
                      />
                    </div>
                    <div className="mt-4">
                      <TrendChart
                        data={generateTrendData(videoCompletionRate)}
                        color={
                          videoCompletionRate >= 80
                            ? "#10b981"
                            : videoCompletionRate >= 50
                            ? "#f59e0b"
                            : "#ef4444"
                        }
                        height={40}
                      />
                    </div>
                  </div>

                  {/* Progress Rate */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-gray-900">
                        進捗率
                      </h3>
                    </div>
                    <div className="mb-4">
                      <SemiCircleGauge
                        percentage={progressRate}
                        color={
                          progressRate >= 80
                            ? "#10b981"
                            : progressRate >= 50
                            ? "#f59e0b"
                            : "#ef4444"
                        }
                        size={140}
                      />
                    </div>
                    <div className="mt-4">
                      <TrendChart
                        data={generateTrendData(progressRate)}
                        color={
                          progressRate >= 80
                            ? "#10b981"
                            : progressRate >= 50
                            ? "#f59e0b"
                            : "#ef4444"
                        }
                        height={40}
                      />
                    </div>
                  </div>

                  {/* Watched Rate */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-gray-900">
                        視聴率
                      </h3>
                    </div>
                    <div className="mb-4">
                      <SemiCircleGauge
                        percentage={watchedRate}
                        color={
                          watchedRate >= 80
                            ? "#10b981"
                            : watchedRate >= 50
                            ? "#f59e0b"
                            : "#ef4444"
                        }
                        size={140}
                      />
                    </div>
                    <div className="mt-4">
                      <TrendChart
                        data={generateTrendData(watchedRate)}
                        color={
                          watchedRate >= 80
                            ? "#10b981"
                            : watchedRate >= 50
                            ? "#f59e0b"
                            : "#ef4444"
                        }
                        height={40}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowProgressModal(false)}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseLearning;
