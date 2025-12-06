import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "./ui/card";
import { Rocket } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "teacher" | "student";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, userRole, loading, isGuest } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      // Allow guest access for student routes
      if (isGuest && requiredRole === "student") {
        return; // Guest can access student routes
      }
      
      if (!user && !isGuest) {
        navigate("/login");
      } else if (requiredRole && userRole && userRole !== requiredRole) {
        // Redirect to appropriate dashboard if wrong role
        if (userRole === "teacher") {
          navigate("/teacher/dashboard");
        } else {
          navigate("/student/dashboard");
        }
      }
    }
  }, [user, userRole, loading, navigate, requiredRole, isGuest]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-card p-8 rounded-3xl text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse-glow mb-4">
            <Rocket className="h-10 w-10 text-white animate-spin-slow" />
          </div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </Card>
      </div>
    );
  }

  // Allow guest access for student routes
  if (isGuest && requiredRole === "student") {
    return <>{children}</>;
  }

  if (!user && !isGuest) {
    return null;
  }

  if (requiredRole && userRole && userRole !== requiredRole) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
