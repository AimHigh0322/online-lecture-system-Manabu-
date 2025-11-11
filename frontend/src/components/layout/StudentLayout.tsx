import React, { useState, useRef, useEffect } from "react";
import {
  BookOpen,
  LogOut,
  ChevronDown,
  UserCircle,
  Settings,
  Lock,
  Home,
  FileText,
  Edit,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { logout, getAuthToken } from "../../api/auth/authService";
import { useGetExamEligibilityQuery } from "../../api/exam/examApiSlice";
import { ExamAccessModal } from "../atom/ExamAccessModal";
import { NotificationIcon } from "../atom/NotificationIcon";

interface StudentLayoutProps {
  children: React.ReactNode;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("/img/default_avatar.png");
  const [showExamModal, setShowExamModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Fetch exam eligibility status
  const { data: eligibilityData, isLoading: eligibilityLoading } =
    useGetExamEligibilityQuery({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch user profile avatar and studentId
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;

        const API_URL =
          import.meta.env.VITE_API_URL || "http://85.131.238.90:4000";
        const response = await fetch(`${API_URL}/api/profile`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();

          // Set avatar
          if (data.profile?.avatar) {
            // Check if avatar is a data URL or server path
            const avatar = data.profile.avatar.startsWith("data:")
              ? data.profile.avatar
              : `${API_URL}${data.profile.avatar}`;
            setAvatarUrl(avatar);
          }
        }
      } catch {
        // Error fetching profile
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleExamClick = () => {
    if (eligibilityLoading) return;

    if (eligibilityData?.examEligible) {
      // If eligible, navigate directly to exam room
      navigate("/exam-room");
    } else {
      // If not eligible, show modal
      setShowExamModal(true);
    }
  };

  const handleGoToCourses = () => {
    setShowExamModal(false);
    navigate("/courses");
  };

  const handleGoToExam = () => {
    setShowExamModal(false);
    navigate("/exam-taking");
  };

  const userMenuItems = [
    {
      id: "profile",
      label: "プロフィール",
      icon: UserCircle,
      action: () => navigate("/profile"),
      danger: false,
    },
    {
      id: "privacy",
      label: "プライバシー",
      icon: Lock,
      action: () => navigate("/privacy"),
      danger: false,
    },
    {
      id: "settings",
      label: "設定",
      icon: Settings,
      action: () => navigate("/settings"),
      danger: false,
    },
    {
      id: "logout",
      label: "ログアウト",
      icon: LogOut,
      action: handleLogout,
      danger: true,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top Utility Bar */}
      <div className="bg-white border-b border-gray-200"></div>

      {/* Main Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 min-w-0">
            {/* Logo and Mobile Menu Button */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                aria-label="メニュー"
              >
                {showMobileMenu ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
              {/* Logo - Hidden on mobile */}
              <div className="hidden lg:flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800 whitespace-nowrap">
                    学ぼう国際研修センター
                  </h1>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8 whitespace-nowrap">
              <button
                className={`flex items-center space-x-2 font-medium transition-colors cursor-pointer text-sm ${
                  location.pathname === "/"
                    ? "text-orange-500"
                    : "text-gray-800 hover:text-orange-500"
                }`}
                onClick={() => navigate("/")}
              >
                <Home className="w-4 h-4 text-gray-400" />
                <span>HOME</span>
              </button>
              <button
                className={`flex items-center space-x-2 font-medium transition-colors cursor-pointer text-sm ${
                  location.pathname === "/courses"
                    ? "text-orange-500"
                    : "text-gray-800 hover:text-orange-500"
                }`}
                onClick={() => navigate("/courses")}
              >
                <FileText className="w-4 h-4 text-gray-400" />
                <span>講習内容と費用</span>
              </button>
              <button
                className={`flex items-center space-x-2 font-medium transition-colors cursor-pointer text-sm ${
                  location.pathname === "/exam-room"
                    ? "text-orange-500"
                    : "text-gray-800 hover:text-orange-500"
                } ${eligibilityLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={handleExamClick}
                disabled={eligibilityLoading}
              >
                <Edit className="w-4 h-4 text-gray-400" />
                <span>試験ルーム</span>
              </button>
              <button
                className={`flex items-center space-x-2 font-medium transition-colors cursor-pointer text-sm ${
                  location.pathname === "/help"
                    ? "text-orange-500"
                    : "text-gray-800 hover:text-orange-500"
                }`}
                onClick={() => navigate("/help")}
              >
                <HelpCircle className="w-4 h-4 text-gray-400" />
                <span>ヘルプ</span>
              </button>
            </nav>

            {/* User Profile Dropdown */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Notification Icon */}
              <NotificationIcon />
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-400">
                    <img
                      src={avatarUrl}
                      alt="User Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="py-1">
                      {userMenuItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            item.action();
                            setShowUserDropdown(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors cursor-pointer ${
                            item.danger
                              ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-4 space-y-2">
              <button
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer text-left ${
                  location.pathname === "/"
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => {
                  navigate("/");
                  setShowMobileMenu(false);
                }}
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">HOME</span>
              </button>
              <button
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer text-left ${
                  location.pathname === "/courses"
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => {
                  navigate("/courses");
                  setShowMobileMenu(false);
                }}
              >
                <FileText className="w-5 h-5" />
                <span className="font-medium">講習内容と費用</span>
              </button>
              <button
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer text-left ${
                  location.pathname === "/exam-room"
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-700 hover:bg-gray-100"
                } ${eligibilityLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => {
                  handleExamClick();
                  setShowMobileMenu(false);
                }}
                disabled={eligibilityLoading}
              >
                <Edit className="w-5 h-5" />
                <span className="font-medium">試験ルーム</span>
              </button>
              <button
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer text-left ${
                  location.pathname === "/help"
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => {
                  navigate("/help");
                  setShowMobileMenu(false);
                }}
              >
                <HelpCircle className="w-5 h-5" />
                <span className="font-medium">ヘルプ</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="min-h-screen">{children}</main>

      {/* Footer Section with Contact Form */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column - Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-300 mb-8 uppercase">
                Contact Us
              </h2>
              <form className="space-y-6">
                <div>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full px-4 py-4 bg-gray-100 border border-gray-400 rounded-none focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-600"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    placeholder="Your email"
                    className="w-full px-4 py-4 bg-gray-100 border border-gray-400 rounded-none focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-600"
                  />
                </div>

                <div>
                  <textarea
                    placeholder="Your enquiry"
                    rows={6}
                    className="w-full px-4 py-4 bg-gray-100 border border-gray-400 rounded-none focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none text-gray-800 placeholder-gray-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gray-100 text-gray-800 py-4 px-8 border border-gray-400 hover:bg-gray-200 transition-colors font-semibold text-lg uppercase tracking-wide"
                >
                  SEND
                </button>
              </form>
            </div>

            {/* Right Column - Contact Information & Social Media */}
            <div className="space-y-12">
              {/* Phone Contact */}
              <div>
                <h3 className="text-lg font-bold text-gray-300 mb-3 uppercase">
                  CALL US ON
                </h3>
                <p className="text-2xl font-bold text-gray-300">
                  +81 (0)3 1234 5678
                </p>
              </div>

              {/* Email Contact */}
              <div>
                <h3 className="text-lg font-bold text-gray-300 mb-3 uppercase">
                  OR EMAIL
                </h3>
                <p className="text-2xl font-bold text-gray-300">
                  info@manabou-center.com
                </p>
              </div>

              {/* Address */}
              <div className="text-right">
                <p className="text-gray-300">
                  学ぼう国際研修センター
                  <br />
                  〒150-0001 東京都渋谷区神宮前
                  <br />
                  1-1-1 学ぼうビル 3階
                  <br />
                  Tokyo, Japan
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              {/* Left Side - Copyright */}
              <div className="mb-4 md:mb-0">
                <p className="text-gray-300 mb-2">
                  © 2025 学ぼう国際研修センター
                </p>
                <p className="text-gray-400 text-sm">
                  Registered company 12345678 | VAT #JP 123 4567 89
                </p>
              </div>

              {/* Right Side - Navigation Links */}
              <div className="flex space-x-8">
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  クレジット
                </a>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  プライバシーポリシー
                </a>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  ウェブデザイン
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exam Access Modal */}
      <ExamAccessModal
        isOpen={showExamModal}
        onClose={() => setShowExamModal(false)}
        onGoToCourses={handleGoToCourses}
        onGoToExam={handleGoToExam}
        courses={eligibilityData?.courses || []}
        examEligible={eligibilityData?.examEligible || false}
      />
    </div>
  );
};

export default StudentLayout;
