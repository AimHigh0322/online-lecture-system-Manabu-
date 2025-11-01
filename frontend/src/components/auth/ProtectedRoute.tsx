import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated, getStoredUser } from "../../api/auth/authService";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated()) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Get user data
  const user = getStoredUser();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user role is allowed
  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    switch (user.role) {
      case "admin":
        return <Navigate to="/admin" replace />;
      case "student":
        return <Navigate to="/" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};

// Specific protected route components for different roles
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <ProtectedRoute allowedRoles={["admin"]}>{children}</ProtectedRoute>;

export const StudentRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <ProtectedRoute allowedRoles={["student"]}>{children}</ProtectedRoute>;

// Route for authenticated users (any role)
export const AuthenticatedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ProtectedRoute allowedRoles={["admin", "student"]}>
    {children}
  </ProtectedRoute>
);
