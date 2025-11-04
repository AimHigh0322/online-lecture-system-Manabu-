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
  FileText,
} from "lucide-react";
import { useGetMaterialsByCourseQuery } from "../../api/materials/materialSlice";
import { useCheckExamEligibilityMutation } from "../../api/exam/examApiSlice";
import { useToast } from "../../hooks/useToast";
import { getAuthToken } from "../../api/auth/authService";
import { ConfirmModal } from "../../components/atom/ConfirmModal";

// Utility function to get API URL based on environment
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  const isProduction =
    import.meta.env.MODE === "production" ||
    import.meta.env.VITE_NODE_ENV === "production";

  return isProduction ? "http://85.131.238.90:4000" : "http://localhost:4000";
};

// Utility function to construct file URL
const getFileUrl = (relativePath: string): string => `${getApiUrl()}${relativePath}`;

interface Lesson {
  type: "video" | "pdf";
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  pdfUrl?: string;
  completed: boolean;
  order: number;
}

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
  const [activeTab, setActiveTab] = useState<"video" | "document">("video");

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
      materialsData?.materials?.map((material, index) => ({
        type: material.type || "video",
        id: material._id,
        title: material.title,
        description: material.description,
        videoUrl: material.videoUrl ? getFileUrl(material.videoUrl) : undefined,
        pdfUrl: material.pdfUrl ? getFileUrl(material.pdfUrl) : undefined,
        completed: false, // This could be tracked in user progress
        order: index + 1,
      })) || [],
    [materialsData?.materials]
  );

  // Separate lessons by type
  const videoLessons = useMemo(
    () => lessons.filter((lesson) => lesson.type === "video"),
    [lessons]
  );
  const documentLessons = useMemo(
    () => lessons.filter((lesson) => lesson.type === "pdf"),
    [lessons]
  );

  // Get lessons based on active tab
  const filteredLessons = useMemo(
    () => (activeTab === "video" ? videoLessons : documentLessons),
    [activeTab, videoLessons, documentLessons]
  );

  // Set first lesson as current when materials load or tab changes
  useEffect(() => {
    if (filteredLessons.length > 0) {
      // If current lesson is not in filtered lessons, switch to first lesson in active tab
      if (!currentLesson || !filteredLessons.find((l) => l.id === currentLesson.id)) {
        setCurrentLesson(filteredLessons[0]);
        setIsPlaying(false);
        setOriginalTime(0);
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.load();
        }
      }
    }
  }, [filteredLessons, activeTab]);

  // Fetch course progress to check completed materials
  useEffect(() => {
    const fetchCourseProgress = async () => {
      if (!courseId) return;

      try {
        const API_URL = getApiUrl();
        const token = getAuthToken();

        if (!token) return;

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

          // Handle document progress (completed/not completed only, no percentage)
          if (data.success && data.course?.documentProgress) {
            data.course.documentProgress.forEach(
              (item: { materialName: string }) => {
                completed.add(item.materialName);
                // Documents don't have progress percentage, so mark as completed
              }
            );
          }

          // Legacy support: also check lectureProgress for backward compatibility
          if (data.success && data.course?.lectureProgress) {
            data.course.lectureProgress.forEach(
              (item: { materialName: string; progress: number }) => {
                // Only add to progress map if not already set from videoProgress
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
        }
      } catch (error) {
        console.error("Error fetching course progress:", error);
      }
    };

    fetchCourseProgress();
  }, [courseId]);

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

      // Different handling for videos vs documents
      let requestBody: {
        materialName: string;
        materialType: string;
        progress?: number;
      };

      if (lesson.type === "video") {
        // For videos: calculate and save progress percentage
        const progressToSave =
          lesson.id === currentLesson?.id && duration > 0
            ? Math.round((currentTime / duration) * 100)
            : 100;

        requestBody = {
          materialName: lesson.title,
          materialType: "video",
          progress: progressToSave,
        };
      } else {
        // For documents: only mark as completed (no progress percentage)
        requestBody = {
          materialName: lesson.title,
          materialType: "pdf",
        };
      }

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
          if (lesson.type === "video") {
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

            // Update progress map for videos
            setAllVideoProgress((prev) => {
              const newMap = new Map(prev);
              newMap.set(lesson.title, progressToSave);
              return newMap;
            });

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
          } else {
            // For documents: just mark as completed
            showToast({
              type: "success",
              title: "完了しました",
              message: `「${lesson.title}」を完了として記録しました`,
              duration: 2000,
            });

            // Mark document as completed
            setCompletedMaterials((prev) => new Set(prev).add(lesson.title));
          }
        }
      }
    } catch (error) {
      console.error("Error updating lecture progress:", error);
    }
  };

  // Calculate detailed progress statistics
  const completedVideos = useMemo(() => {
    return videoLessons.filter((lesson) =>
      completedMaterials.has(lesson.title)
    ).length;
  }, [videoLessons, completedMaterials]);

  const totalVideos = videoLessons.length;
  const totalDocuments = documentLessons.length;
  const uncompletedVideos = totalVideos - completedVideos;
  
  const videoCompletionRate =
    totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

  // Calculate actual progress rate from video progress data only (exclude documents)
  const calculateActualProgressRate = () => {
    if (videoLessons.length === 0) return 0;

    // Calculate total progress from videos only
    let totalProgress = 0;
    videoLessons.forEach((lesson) => {
      const videoProgress = allVideoProgress.get(lesson.title) || 0;
      totalProgress += videoProgress;
    });

    // Return average progress across videos only
    return Math.round(totalProgress / videoLessons.length);
  };

  const progressRate = calculateActualProgressRate();

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
      {/* Page Header with Course Info */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {courseName}
              </h1>

              {/* Detailed Progress Statistics - Only show for video tab */}
              {activeTab === "video" && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      総レッスン数
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {totalVideos}
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-xs text-green-600 uppercase tracking-wide">
                      完了数
                    </div>
                    <div className="text-lg font-semibold text-green-700">
                      {completedVideos}
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-xs text-orange-600 uppercase tracking-wide">
                      未完了数
                    </div>
                    <div className="text-lg font-semibold text-orange-700">
                      {uncompletedVideos}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs text-blue-600 uppercase tracking-wide">
                      動画完了率
                    </div>
                    <div className="text-lg font-semibold text-blue-700">
                      {videoCompletionRate}%
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-xs text-purple-600 uppercase tracking-wide">
                      進捗率
                    </div>
                    <div className="text-lg font-semibold text-purple-700">
                      {progressRate}%
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                {currentLesson.type === "video" ? (
                  <video
                    ref={videoRef}
                    className="w-full h-96 lg:h-[500px] object-cover cursor-pointer"
                    poster="/img/video-poster.jpg"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    onClick={handleVideoClick}
                    onError={(e) => {
                      console.error("Video error:", e);
                      showToast({
                        type: "error",
                        title: "動画エラー",
                        message: "動画の読み込みに失敗しました。URLを確認してください。",
                      });
                    }}
                  >
                    <source src={currentLesson.videoUrl} type="video/mp4" />
                    お使いのブラウザは動画をサポートしていません。
                  </video>
                ) : (
                  <iframe
                    className="w-full h-[600px] lg:h-[700px] bg-white"
                    src={`${currentLesson.pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                    title={currentLesson.title}
                  />
                )}

                {/* Video Overlay - Red Play Button */}
                {currentLesson.type === "video" && (
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
                )}
              </div>

              {/* Controls - only for video */}
              {currentLesson.type === "video" && (
                <div className="bg-gray-800 text-white p-3">
                <div className="flex flex-row items-start  gap-3">
                  {/* Play/Pause Button */}
                  <button
                    onClick={togglePlayPause}
                    className="text-white hover:text-gray-300 transition-colors cursor-pointer"
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
                    className="text-white hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  {/* Next Video */}
                  <button
                    onClick={handleNextVideo}
                    className="text-white hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>

                  {/* Volume Control */}
                  <div className="relative" data-volume-control>
                    <button
                      onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                      className="text-white hover:text-gray-300 transition-colors cursor-pointer"
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

                  {/* Picture in Picture */}
                  <button
                    onClick={enterPictureInPicture}
                    className="text-white hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    <PictureInPicture className="w-5 h-5" />
                  </button>

                  {/* Fullscreen */}
                  <button
                    onClick={enterFullscreen}
                    className="text-white hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    <Maximize className="w-5 h-5" />
                  </button>
                </div>
                </div>
              )}
            </div>

            {/* Instructions Section - Only show for video tab */}
            {activeTab === "video" && (
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
                        各動画の右上にある「記録」ボタンを押さないと、進捗率が更新されません。
                      </p>
                      <p className="text-blue-700">
                        ※
                        進捗は手動で保存する必要があります。動画を視聴するだけでは自動的に保存されません。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions Section for Document tab */}
            {activeTab === "document" && (
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
                          文書を読んだ後は必ず「記録」ボタンを押してください。
                        </strong>
                      </p>
                      <p>
                        右側のリストから文書を選択して閲覧できます。読み終わったら「記録」ボタンで完了として記録します。
                      </p>
                      <p className="text-blue-700">
                        ※文書の場合は進捗率は不要で、完了/未完了のみが記録されます。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lesson List Sidebar - Right Section (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="bg-white h-full flex flex-col">
              {/* Tabs */}
              <div className="border-b border-gray-200 px-2 pt-2">
                <nav className="-mb-px flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("video")}
                    className={`py-2 px-3 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "video"
                        ? "border-red-500 text-red-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    動画 ({totalVideos})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("document")}
                    className={`py-2 px-3 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "document"
                        ? "border-red-500 text-red-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    文書 ({totalDocuments})
                  </button>
                </nav>
              </div>
              {/* Fixed height container with scroll */}
              <div className="flex-1 overflow-y-auto max-h-[560px] pt-2 pr-2">
                {filteredLessons.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <BookOpen className="w-12 h-12 text-gray-400 mb-2" />
                    <p className="text-gray-600 text-sm">
                      {activeTab === "video"
                        ? "動画教材がありません"
                        : "文書教材がありません"}
                    </p>
                  </div>
                ) : (
                  <div className={activeTab === "document" ? "space-y-2" : "space-y-4"}>
                    {filteredLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className={`w-full relative hover:bg-gray-50 transition-colors ${
                          currentLesson.id === lesson.id
                            ? "bg-blue-50 border-l-4 border-l-blue-500"
                            : ""
                        } ${activeTab === "document" ? "p-1.5" : "p-2"}`}
                      >
                      {/* Checkmark for completed lectures - only for videos */}
                      {lesson.type === "video" && completedMaterials.has(lesson.title) && (
                        <Check className="w-7 h-7 absolute -top-0.5 left-0 text-emerald-400 z-10" />
                      )}
                      <div
                        className="cursor-pointer"
                        onClick={() => handleLessonSelect(lesson)}
                      >
                        <div className={`flex items-start ${activeTab === "document" ? "space-x-2" : "space-x-3"}`}>
                          {/* Thumbnail/Icon */}
                          <div className="flex-shrink-0">
                            {lesson.type === "video" ? (
                              <div className="relative w-32 h-20 bg-black rounded flex items-center justify-center">
                                {/* Red play button in center */}
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                  <Play className="w-3 h-3 text-white ml-0.5" />
                                </div>
                                {/* Red progress line at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"></div>
                              </div>
                            ) : (
                              <div className={`relative ${activeTab === "document" ? "w-16 h-12" : "w-32 h-20"} bg-gray-100 rounded flex items-center justify-center border-2 border-gray-300`}>
                                {/* Document icon */}
                                <FileText className={`${activeTab === "document" ? "w-5 h-5" : "w-8 h-8"} text-gray-600`} />
                              </div>
                            )}
                          </div>

                          {/* Content Section */}
                          <div className="flex-1 min-w-0">
                            {/* Top Section: Title/Subtitle and Record Button */}
                            <div className={`flex items-start justify-between ${activeTab === "document" ? "mb-1" : "mb-2"}`}>
                              <div className="flex-1 min-w-0">
                                <h4 className={`${activeTab === "document" ? "text-xs" : "text-sm"} font-medium text-gray-900 leading-tight truncate`}>
                                  {lesson.title}
                                </h4>
                                {activeTab === "video" && (
                                  <p className="text-xs text-gray-600 leading-relaxed truncate">
                                    {lesson.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex-shrink-0 ml-3">
                                {/* Record button - only for videos */}
                                {lesson.type === "video" && currentLesson.id === lesson.id && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLessonToComplete(lesson);
                                      setShowConfirmModal(true);
                                    }}
                                    className="px-2 py-0.5 rounded-md bg-red-600 shadow-lg transition-all duration-200 hover:bg-red-700 cursor-pointer text-white"
                                    title="Record"
                                  >
                                    <span className="text-xs text-white">
                                      記録
                                    </span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Bottom Section: Time/Rate and Progress Bar - only for videos */}
                            {lesson.type === "video" && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-gray-600">
                                  <span className="font-mono">
                                    {currentLesson.id === lesson.id
                                      ? `${formatTime(
                                          currentTime
                                        )} / ${formatTime(duration)}`
                                      : `0:00 / ${formatTime(duration)}`}
                                  </span>
                                  <span className="font-medium text-gray-500">
                                    {allVideoProgress.get(lesson.title) || 0}% /{" "}
                                    {currentLesson.id === lesson.id
                                      ? duration > 0
                                        ? Math.round(
                                            (currentTime / duration) * 100
                                          )
                                        : 0
                                      : 0}
                                    %
                                  </span>
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
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={handleCancelRecord}
        onConfirm={handleConfirmRecord}
        title={
          lessonToComplete?.type === "pdf"
            ? "完了として記録しますか？"
            : "進捗を記録しますか？"
        }
        message={
          <div>
            <p className="mb-2">
              「{lessonToComplete?.title}」
              {lessonToComplete?.type === "pdf"
                ? "を完了として記録しますか？"
                : "の進捗を記録しますか？"}
            </p>
            {lessonToComplete?.type === "video" && (
              <p className="text-sm text-gray-600">
                現在の視聴進捗:{" "}
                {lessonToComplete && duration > 0
                  ? Math.round((currentTime / duration) * 100)
                  : 0}
                %
              </p>
            )}
          </div>
        }
        confirmText="記録する"
        cancelText="キャンセル"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default CourseLearning;
