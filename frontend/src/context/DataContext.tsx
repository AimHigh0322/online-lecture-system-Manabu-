import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { getAuthToken, isAuthenticated } from "../api/auth/authService";

interface Profile {
  id: string;
  username?: string;
  email?: string;
  role: string;
  avatar?: string;
  phone?: string;
  gender?: string;
  birthday?: string;
  joinedDate?: string;
  lastLogin?: string;
}

interface User {
  id: string;
  username?: string;
  email?: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

interface DataContextType {
  profiles: Profile[];
  users: User[];
  currentUserProfile: Profile | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    if (!isAuthenticated()) {
      setProfiles([]);
      setUsers([]);
      setCurrentUserProfile(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const API_URL =
        import.meta.env.VITE_API_URL || "http://103.179.45.68:4000";

      // Fetch current user profile + all profiles + all users
      const profileResponse = await fetch(`${API_URL}/api/profile`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setCurrentUserProfile(data.profile);
        setProfiles(data.profiles || []);
        setUsers(data.users || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when authentication status changes
  useEffect(() => {
    fetchAllData();
  }, []);

  const value: DataContextType = {
    profiles,
    users,
    currentUserProfile,
    loading,
    error,
    refreshData: fetchAllData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
