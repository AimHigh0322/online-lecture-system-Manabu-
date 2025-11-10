// Auth utility functions and types
// API calls are handled by authApiSlice.ts

export interface LoginCredentials {
  id: string;
  password: string;
}

export interface User {
  id: string;
  username?: string;
  email?: string;
  role: string;
  groupId?: string;
  seatNumber?: number;
  faceDescriptor?: number[]; // Face recognition descriptor
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface UserProfile {
  id: string;
  role: string;
  groupId: string;
  email?: string;
  phone?: string;
  displayName?: string;
  avatar?: string;
  gender?: string;
  birthday?: string;
  organization?: string;
  seatNumber?: number;
}

/**
 * Logout user
 */
export const logout = (): void => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
};

/**
 * Get stored auth token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * Get authorization header
 */
export const getAuthHeader = ():
  | { Authorization: string }
  | Record<string, never> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Get stored user data
 */
export const getStoredUser = (): User | null => {
  const userData = localStorage.getItem("user");
  return userData ? JSON.parse(userData) : null;
};

/**
 * Store user data
 */
export const storeUser = (user: User): void => {
  localStorage.setItem("user", JSON.stringify(user));
};
