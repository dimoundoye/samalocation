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
  connectionError: boolean;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setUserRole: (role: string | null) => void;
  refreshUser: () => Promise<void>;
  retryAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  connectionError: false,
  signOut: async () => { },
  setUser: () => { },
  setUserRole: () => { },
  refreshUser: async () => { },
  retryAuth: async () => { },
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUserState] = useState<User | null>(() => {
    const cached = localStorage.getItem("auth_user");
    try {
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [userRole, setUserRoleState] = useState<string | null>(() => {
    const cached = localStorage.getItem("auth_user");
    try {
      return cached ? JSON.parse(cached).role : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem("auth_token");
    const cached = localStorage.getItem("auth_user");
    return token && cached ? false : true;
  });
  const [connectionError, setConnectionError] = useState(false);
  const navigate = useNavigate();

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem("auth_user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("auth_user");
    }
  };

  const setUserRole = (newRole: string | null) => {
    setUserRoleState(newRole);
  };

  const loadUser = async () => {
    const data = await getMe();
    if (data?.user) {
      setUser(data.user);
      setUserRole(data.user.role);
      setConnectionError(false);
    } else {
      const err = new Error("Not authenticated");
      (err as any).status = 401;
      throw err;
    }
  };

  const initAuth = async () => {
    const token = localStorage.getItem("auth_token");
    const cached = localStorage.getItem("auth_user");

    if (token) {
      if (!cached) {
        setLoading(true);
      }
      try {
        setConnectionError(false);
        await loadUser();
      } catch (error: any) {
        console.error("Auth init error:", error);
        if (error.status === 503) {
          navigate("/maintenance");
        } else if (error.status === 401 || error.status === 403) {
          localStorage.removeItem("auth_token");
          setUser(null);
          setUserRole(null);
        } else {
          // Network error or server offline/restarting
          if (!cached) {
            setConnectionError(true);
          } else {
            console.warn("Server offline, using cached session");
          }
        }
      } finally {
        setLoading(false);
      }
    } else {
      localStorage.removeItem("auth_token");
      setUser(null);
      setUserRole(null);
      setConnectionError(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const signOut = async () => {
    try {
      localStorage.removeItem("auth_token");
      setUser(null);
      setUserRole(null);
      setConnectionError(false);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error signing out:", error);
      localStorage.removeItem("auth_token");
      setUser(null);
      setUserRole(null);
      setConnectionError(false);
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

  const retryAuth = async () => {
    await initAuth();
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, connectionError, signOut, setUser, setUserRole, refreshUser, retryAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
