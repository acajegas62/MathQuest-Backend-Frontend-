import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, User as UserIcon, Home, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "./ui/badge";
import logo from "@/assets/logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = () => {
  const { user, profile, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      
      // Subscribe to notification changes
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    setUnreadCount(count || 0);
  };

  const handleDashboard = () => {
    if (userRole === "teacher") {
      navigate("/teacher/dashboard");
    } else {
      navigate("/student/dashboard");
    }
  };

  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : "";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 glass-card">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={logo} alt="MathQuest Logo" className="w-10 h-10 object-contain" />
          <span className="font-bold text-lg hidden sm:inline">MathQuest</span>
        </Link>

        <div className="flex items-center gap-4">
          {user && profile ? (
            <>
              <Button
                variant="ghost"
                onClick={handleDashboard}
                className="hidden sm:flex glass-card rounded-xl"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/notifications")}
                className="relative rounded-xl"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary glow-primary">
                      <AvatarImage
                        src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`}
                        alt={fullName}
                      />
                      <AvatarFallback>
                        {fullName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card w-56">
                  <div className="px-2 py-2 border-b border-border/50">
                    <p className="font-medium">{fullName}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {userRole}
                    </p>
                  </div>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDashboard} className="sm:hidden">
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="glass-card rounded-xl">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="btn-cosmic rounded-xl">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
