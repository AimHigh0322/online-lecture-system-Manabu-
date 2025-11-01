import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import {
  isAuthenticated,
  getStoredUser,
  logout,
} from "../../api/auth/authService";

interface AuthButtonProps {
  className?: string;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();
  const user = authenticated ? getStoredUser() : null;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return "管理者";
      case "student":
        return "学生";
      default:
        return role;
    }
  };

  if (authenticated && user) {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <div className="flex items-center space-x-2 text-gray-600">
          <User className="h-5 w-5" />
          <span className="text-sm font-medium">
            {getRoleDisplayName(user.role)}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-1 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">ログアウト</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <Link
        to="/login"
        className="px-4 py-2 text-gray-700 hover:text-purple-600 transition-colors font-medium"
      >
        ログイン
      </Link>
      <Link
        to="/register"
        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
      >
        今すぐ学習開始
      </Link>
    </div>
  );
};
