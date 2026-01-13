import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface UserProfileProps {
  onSettingsClick?: () => void;
}

export const UserProfile = ({ onSettingsClick }: UserProfileProps) => {
  const navigate = useNavigate();
  const { signOut, userRole, user } = useAuth();
  const [userName, setUserName] = useState("Utilisateur");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (user) {
      setUserName(user.name || "Utilisateur");
      setUserEmail(user.email || "");
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
  };

  const getDashboardPath = () => {
    if (userRole === "admin") return "/admin-dashboard";
    if (userRole === "owner") return "/owner-dashboard";
    return "/tenant-dashboard";
  };

  const getInitials = () => {
    return userName.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Avatar className="h-10 w-10 cursor-pointer">
            <AvatarImage src="" alt={userName} />
            <AvatarFallback className="bg-primary text-white">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium hidden sm:block">{userName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{userName}</span>
            <span className="text-xs text-muted-foreground font-normal">{userEmail}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(getDashboardPath())}>
          <User className="mr-2 h-4 w-4" />
          Mon profil
        </DropdownMenuItem>
        {onSettingsClick && (
          <DropdownMenuItem onClick={onSettingsClick}>
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
