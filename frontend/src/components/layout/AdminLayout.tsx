import React, { useState, useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  Users,
  LayoutDashboard,
  Menu,
  Youtube,
  ClipboardList,
  Cog,
  Award,
  FilePlus,
  BookOpen,
  Bell,
} from "lucide-react";
import { logout } from "../../api/auth/authService";
import { NotificationIcon } from "../atom/NotificationIcon";

interface BossLayoutProps {
  children: ReactNode;
}

export const BossLayout: React.FC<BossLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.innerWidth >= 768
  );

  useEffect(() => {
    // Set initial sidebar state based on screen size
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const sidebarItems = [
    {
      id: "dashboard",
      label: "ダッシュボード",
      icon: LayoutDashboard,
      path: "/admin",
      active: location.pathname === "/admin",
    },
    {
      id: "students",
      label: "学生管理",
      icon: Users,
      path: "/student-management",
      active: location.pathname === "/student-management",
    },
    {
      id: "materials",
      label: "教材管理",
      icon: Youtube,
      path: "/material-upload",
      active: location.pathname === "/material-upload",
    },
    {
      id: "question-management",
      label: "試験問題管理",
      icon: BookOpen,
      path: "/admin/question-management",
      active: location.pathname === "/admin/question-management",
    },
    {
      id: "create-exam-question",
      label: "試験問題作成",
      icon: FilePlus,
      path: "/admin/question-management/create",
      active: location.pathname === "/admin/question-management/create",
    },
    {
      id: "exams",
      label: "試験管理",
      icon: ClipboardList,
      path: "/admin/exam-management",
      active: location.pathname.startsWith("/admin/exam-management"),
    },
    {
      id: "exam-settings",
      label: "試験設定",
      icon: Cog,
      path: "/admin/exam-settings",
      active: location.pathname === "/admin/exam-settings",
    },
    {
      id: "certificate",
      label: "修了証生成",
      icon: Award,
      path: "/admin/certificate-generator",
      active: location.pathname === "/admin/certificate-generator",
    },
    {
      id: "notifications",
      label: "通知管理",
      icon: Bell,
      path: "/admin/notifications",
      active: location.pathname === "/admin/notifications",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar - Fixed */}
      <header className="bg-gradient-to-r from-slate-700 to-slate-600 shadow-lg border-b border-slate-500 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left side - Logo and toggle */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-slate-200 hover:text-white hover:bg-slate-600 rounded-lg transition-all duration-300 cursor-pointer"
            >
              <Menu
                className={`w-6 h-6 transition-transform duration-300 ${
                  sidebarOpen ? "rotate-90" : "rotate-0"
                }`}
              />
            </button>
            <h1 className="text-lg md:text-xl font-bold text-white">
              グループ責任者ダッシュボード
            </h1>
          </div>

          {/* Right side - Notifications and Logout */}
          <div className="flex items-center space-x-4">
            {/* Notification Icon */}
            <div className="hidden sm:block">
              <NotificationIcon />
            </div>
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 p-2 text-slate-200 hover:text-white hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block text-sm font-medium">
                ログアウト
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex pt-16 flex-1">
        {/* Overlay for mobile when sidebar is open */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar - Overlay on mobile, Fixed on desktop */}
        <aside
          className={`bg-gradient-to-b from-slate-700 to-slate-800 shadow-lg transition-all duration-300 fixed left-0 top-16 bottom-0 overflow-y-auto z-50 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 w-64 ${!sidebarOpen && "md:w-0"}`}
        >
          <div className={`p-4 ${!sidebarOpen && "md:hidden"}`}>
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    item.active
                      ? "bg-slate-600 text-white border-l-4 border-emerald-400"
                      : "text-slate-200 hover:bg-slate-600 hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? "md:ml-64" : "md:ml-0"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default BossLayout;
