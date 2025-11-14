import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Users, BookOpen, X, Eye, EyeOff } from "lucide-react";
import {
  isAuthenticated,
  getStoredUser,
  getAuthToken,
} from "../../api/auth/authService";
import { useToast } from "../../hooks/useToast";

interface Course {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  level: string;
  features: string[];
  image: string;
}

interface PurchasedCourse {
  courseId: string;
  courseName: string;
  studentId: string;
  password: string;
  enrollmentAt: string;
  status: string;
}

const courses: Course[] = [
  {
    id: "general",
    name: "一般講習",
    description: "日常生活や職場で必要な基本的な日本語スキルと文化的知識を習得",
    price: 4500,
    duration: "1ヶ月",
    level: "初級",
    image: "/img/lecture.jpg",
    features: [
      "基本的な日本語会話",
      "日本の文化理解",
      "職場でのコミュニケーション",
      "実践的な語彙学習",
      "修了証明書発行",
    ],
  },
  {
    id: "caregiving",
    name: "介護講習",
    description: "介護職に従事するための専門的なスキルと理論的知識を習得",
    price: 6500,
    duration: "1ヶ月",
    level: "中級",
    image: "/img/middle.png",
    features: [
      "介護技術の基礎",
      "高齢者ケアの理論",
      "安全な介護方法",
      "コミュニケーション技術",
      "介護職員資格取得",
    ],
  },
  {
    id: "specified-care",
    name: "介護基礎研修（特定）",
    description:
      "特定技能外国人向けの介護基礎研修で、指定技能者資格取得を目指す",
    price: 8500,
    duration: "1ヶ月",
    level: "中級以上",
    image: "/img/beginer.png",
    features: [
      "特定技能制度対応",
      "介護の専門知識",
      "実習を含む研修",
      "資格試験対策",
      "就職サポート",
    ],
  },
  {
    id: "initial-care",
    name: "介護職員初任者研修",
    description: "介護職員として必要な基本的な技術と知識を習得する入門コース",
    price: 7500,
    duration: "1ヶ月",
    level: "初級以上",
    image: "/img/business.png",
    features: [
      "介護の基本理念",
      "身体介護技術",
      "生活支援技術",
      "介護過程の理解",
      "修了証明書発行",
    ],
  },
  {
    id: "jlpt",
    name: "日本語能力試験対策",
    description: "JLPT各レベルに特化した対策講座で、合格を目指す集中学習",
    price: 5500,
    duration: "1ヶ月",
    level: "全レベル",
    image: "/img/conversation.jpg",
    features: [
      "N1-N5レベル対応",
      "過去問題演習",
      "語彙・文法強化",
      "読解・聴解対策",
      "模擬試験実施",
    ],
  },
  {
    id: "business-manner",
    name: "ビジネスマナー講習",
    description:
      "日本の職場で必要なビジネスマナーとコミュニケーションスキルを習得",
    price: 4000,
    duration: "1ヶ月",
    level: "中級以上",
    image: "/img/train.png",
    features: [
      "敬語の使い方",
      "電話対応マナー",
      "メール文書作成",
      "会議参加スキル",
      "職場適応支援",
    ],
  },
];

// Student Login Modal Component
interface StudentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (studentId: string, password: string) => void;
  courseName: string;
  isLoading?: boolean;
}

const StudentLoginModal: React.FC<StudentLoginModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  courseName,
  isLoading = false,
}) => {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId.trim() && password.trim()) {
      onSubmit(studentId.trim(), password.trim());
    }
  };

  const handleClose = () => {
    setStudentId("");
    setPassword("");
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-800">コースログイン</h3>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="text-slate-600 mb-6">
          <p className="mb-2">
            <span className="font-semibold">{courseName}</span>
            にアクセスするため、
          </p>
          <p>学生IDとパスワードを入力してください。</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="studentId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              学生ID
            </label>
            <input
              type="text"
              id="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="学生IDを入力"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              パスワード
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="パスワードを入力"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-slate-300 hover:bg-slate-400 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading || !studentId.trim() || !password.trim()}
              className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "ログイン中..." : "ログイン"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CourseSelection: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [purchasedCourses, setPurchasedCourses] = useState<PurchasedCourse[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Get user data
  const user = getStoredUser();

  // Fetch purchased courses
  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const API_URL =
          import.meta.env.VITE_API_URL || "http://103.179.45.68:4000";
        const token = getAuthToken();

        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/api/courses/user/${user.id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPurchasedCourses(data.courses || []);
        }
      } catch (error) {
        console.error("Error fetching purchased courses:", error);
        // Error fetching purchased courses
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedCourses();
  }, [user?.id]);

  // Check if user is authenticated
  if (!isAuthenticated()) {
    navigate("/login");
    return null;
  }

  if (!user || user.role !== "student") {
    navigate("/");
    return null;
  }

  // Check if a course is already purchased (including completed courses)
  const isCoursePurchased = (courseId: string): boolean => {
    return purchasedCourses.some(
      (purchased) =>
        purchased.courseId === courseId &&
        (purchased.status === "active" || purchased.status === "completed")
    );
  };

  // Get purchased course details (including completed courses)
  const getPurchasedCourse = (
    courseId: string
  ): PurchasedCourse | undefined => {
    return purchasedCourses.find(
      (purchased) =>
        purchased.courseId === courseId &&
        (purchased.status === "active" || purchased.status === "completed")
    );
  };

  const handleDirectPayment = (course: Course) => {
    navigate("/payment", {
      state: {
        course: course,
        user: user,
      },
    });
  };

  const handleGoToCourse = (course: Course) => {
    const purchasedCourse = getPurchasedCourse(course.id);
    if (purchasedCourse) {
      setSelectedCourse(course);
      setLoginModalOpen(true);
    }
  };

  const handleLoginSubmit = async (studentId: string, password: string) => {
    if (!selectedCourse) return;

    const purchasedCourse = getPurchasedCourse(selectedCourse.id);
    if (!purchasedCourse) return;

    setIsLoginLoading(true);

    try {
      // Validate credentials
      if (
        studentId === purchasedCourse.studentId &&
        password === purchasedCourse.password
      ) {
        showToast({
          type: "success",
          title: "ログイン成功",
          message: `${selectedCourse.name}の学習ページに移動します。`,
          duration: 2000,
        });

        setLoginModalOpen(false);
        navigate(`/course/${selectedCourse.id}/learning`);
      } else {
        showToast({
          type: "error",
          title: "ログイン失敗",
          message: "学生IDまたはパスワードが正しくありません。",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error logging in:", error);
      showToast({
        type: "error",
        title: "エラー",
        message: "ログイン処理中にエラーが発生しました。",
        duration: 3000,
      });
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleCloseModal = () => {
    setLoginModalOpen(false);
    setSelectedCourse(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">コース情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Image Section */}
      <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden">
        <img
          src="/img/course1.png"
          alt="コース紹介"
          className="w-full h-full object-cover"
        />
        <div className="absolute bg-black/20 inset-0  bg-opacity-30 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              コース選択
            </h1>
            <p className="text-lg md:text-xl max-w-[700px] mx-auto">
              あなたのレベルに合った最適なコースを見つけて、日本語学習を始めましょう
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 transform"
              >
                {/* Course Image */}
                <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={course.image}
                    alt={course.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Course Circle */}
                  <div
                    className={`absolute top-4 left-4 ${
                      isCoursePurchased(course.id)
                        ? getPurchasedCourse(course.id)?.status === "completed"
                          ? "bg-blue-500"
                          : "bg-green-500"
                        : "bg-orange-500"
                    } text-white rounded-full w-16 h-16 flex items-center justify-center text-xs font-bold shadow-lg`}
                  >
                    <div className="text-center leading-tight">
                      <div className="text-xs">
                        {isCoursePurchased(course.id)
                          ? getPurchasedCourse(course.id)?.status ===
                            "completed"
                            ? "完了"
                            : "受講中"
                          : "コース"}
                      </div>
                      <div className="text-lg font-black">
                        {courses.indexOf(course) + 1}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-5">
                  {/* Course Title and Price Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">
                        {course.name}
                      </h3>
                    </div>
                    <div className="text-right ml-3">
                      {isCoursePurchased(course.id) ? (
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            {new Date(
                              getPurchasedCourse(course.id)?.enrollmentAt || ""
                            ).toLocaleDateString("ja-JP")}
                          </div>
                        </div>
                      ) : (
                        <div className="text-right">
                          <div className="text-xl font-bold text-orange-600">
                            ¥{course.price.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">月額</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Course Description */}
                  <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
                    {course.id === "general" && (
                      <>
                        日常生活や職場で必要な
                        <span className="text-orange-600 font-semibold">
                          基本的な日本語スキル
                        </span>
                        と文化的知識を習得
                      </>
                    )}
                    {course.id === "caregiving" && (
                      <>
                        介護職に従事するための
                        <span className="text-orange-600 font-semibold">
                          専門的なスキル
                        </span>
                        と理論的知識を習得
                      </>
                    )}
                    {course.id === "specified-care" && (
                      <>
                        特定技能外国人向けの
                        <span className="text-orange-600 font-semibold">
                          介護基礎研修
                        </span>
                        で、指定技能者資格取得を目指す
                      </>
                    )}
                    {course.id === "initial-care" && (
                      <>
                        介護職員として必要な
                        <span className="text-orange-600 font-semibold">
                          基本的な技術と知識
                        </span>
                        を習得する入門コース
                      </>
                    )}
                    {course.id === "jlpt" && (
                      <>
                        JLPT各レベルに特化した
                        <span className="text-orange-600 font-semibold">
                          対策講座
                        </span>
                        で、合格を目指す集中学習
                      </>
                    )}
                    {course.id === "business-manner" && (
                      <>
                        日本の職場で必要な
                        <span className="text-orange-600 font-semibold">
                          ビジネスマナー
                        </span>
                        とコミュニケーションスキルを習得
                      </>
                    )}
                  </p>

                  {/* Course Info Tags and Payment Link */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <Users className="w-3 h-3 mr-1" />
                        {course.level}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Clock className="w-3 h-3 mr-1" />
                        {course.duration}
                      </span>
                    </div>
                    {isCoursePurchased(course.id) ? (
                      <a
                        href="#"
                        className="text-green-600 hover:text-green-700 underline text-sm font-medium transition-colors flex items-center"
                        onClick={(e) => {
                          e.preventDefault();
                          handleGoToCourse(course);
                        }}
                      >
                        <BookOpen className="w-4 h-4 mr-1" />
                        コースページへ
                      </a>
                    ) : (
                      <a
                        href="#"
                        className="text-orange-500 hover:text-orange-600 underline text-sm font-medium transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDirectPayment(course);
                        }}
                      >
                        今すぐ登録
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student Login Modal */}
        {selectedCourse && (
          <StudentLoginModal
            isOpen={loginModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleLoginSubmit}
            courseName={selectedCourse.name}
            isLoading={isLoginLoading}
          />
        )}
      </div>
    </div>
  );
};

export default CourseSelection;
