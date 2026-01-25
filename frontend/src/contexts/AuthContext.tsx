import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "@/lib/api";

interface User {
  id: string;
  customId?: string;
  email: string;
  name: string;
  role: string;
  setupRequired?: boolean;
}

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setUserRole: (role: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  signOut: async () => { },
  setUser: () => { },
  setUserRole: () => { },
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

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        try {
          const data = await getMe();
          if (data?.user) {
            setUser(data.user);
            setUserRole(data.user.role);
          } else {
            localStorage.removeItem("auth_token");
          }
        } catch (error) {
          console.error("Auth init error:", error);
          localStorage.removeItem("auth_token");
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

  return (
    <AuthContext.Provider value={{ user, userRole, loading, signOut, setUser, setUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};
