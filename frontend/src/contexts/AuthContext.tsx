import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "@/lib/api";

interface User {
  currency: string;
  id: string;
  customId?: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  role: string;
  parentId?: string;
  setupRequired?: boolean;
  permissions?: {
    can_view_revenue: boolean;
    [key: string]: any;
  };
  referral_count?: number;
  referred_by?: string;
}

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setUserRole: (role: string | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  signOut: async () => { },
  setUser: () => { },
  setUserRole: () => { },
  refreshUser: async () => { },
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadUser = async () => {
    const data = await getMe();
    if (data?.user) {
      setUser(data.user);
      setUserRole(data.user.role);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("auth_token");
      try {
        await loadUser();
      } catch (error: any) {
        if (error.status === 503) {
          navigate("/maintenance");
        } else if (error.status === 401 && token) {
          localStorage.removeItem("auth_token");
          setUser(null);
          setUserRole(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const signOut = async () => {
    try {
      localStorage.removeItem("auth_token");
      setUser(null);
      setUserRole(null);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error signing out:", error);
      setUser(null);
      setUserRole(null);
      navigate("/", { replace: true });
    }
  };

  const refreshUser = async () => {
    try {
      await loadUser();
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, signOut, setUser, setUserRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
