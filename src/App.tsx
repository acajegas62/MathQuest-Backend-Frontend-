import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "./components/ThemeProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import PageTransition from "./components/PageTransition";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ClassroomDashboard from "./pages/ClassroomDashboard";
import StudentClassroom from "./pages/StudentClassroom";
import JoinClassroom from "./pages/JoinClassroom";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import StoryMode from "./pages/StoryMode";
import PlanetLevels from "./pages/PlanetLevels";
import GameLevel from "./pages/GameLevel";
import Badges from "./pages/Badges";
import TakeQuiz from "./pages/TakeQuiz";
import ActivityGame from "./pages/ActivityGame";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition type="fade"><Landing /></PageTransition>} />
        <Route path="/about" element={<PageTransition type="fade"><About /></PageTransition>} />
        <Route path="/login" element={<PageTransition type="scale"><Login /></PageTransition>} />
        <Route path="/signup" element={<PageTransition type="scale"><Signup /></PageTransition>} />
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute requiredRole="teacher">
              <PageTransition type="fade"><TeacherDashboard /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/classroom/:classroomId"
          element={
            <ProtectedRoute requiredRole="teacher">
              <PageTransition type="slideUp"><ClassroomDashboard /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute requiredRole="student">
              <PageTransition type="fade"><StudentDashboard /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/classroom/:classroomId"
          element={
            <ProtectedRoute requiredRole="student">
              <PageTransition type="slideUp"><StudentClassroom /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/join-classroom"
          element={
            <ProtectedRoute requiredRole="student">
              <PageTransition type="scale"><JoinClassroom /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/story-mode"
          element={
            <ProtectedRoute requiredRole="student">
              <PageTransition type="slide"><StoryMode /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/story-mode/:planetId"
          element={
            <ProtectedRoute requiredRole="student">
              <PageTransition type="slide"><PlanetLevels /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/story-mode/:planetId/level/:levelNumber"
          element={
            <ProtectedRoute requiredRole="student">
              <PageTransition type="slide"><GameLevel /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <PageTransition type="slideUp"><Notifications /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PageTransition type="slideUp"><Profile /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/badges"
          element={
            <ProtectedRoute>
              <PageTransition type="slideUp"><Badges /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/badges/:studentId"
          element={
            <ProtectedRoute>
              <PageTransition type="slideUp"><Badges /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/classroom/:classroomId/quiz/:quizId"
          element={
            <ProtectedRoute requiredRole="student">
              <PageTransition type="scale"><TakeQuiz /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/classroom/:classroomId/activity/:activityId"
          element={
            <ProtectedRoute requiredRole="student">
              <PageTransition type="scale"><ActivityGame /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<PageTransition type="fade"><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  // Keep Supabase awake by pinging every 5 minutes
  useEffect(() => {
    const SUPABASE_PING_URL = "https://bnbvjljwtjwoeimsgvby.supabase.co/functions/v1/health-check";

    const keepSupabaseAwake = () => {
      fetch(SUPABASE_PING_URL, {
        method: "GET",
      }).catch(() => {
        // Ignore errors, it's just a wake-up call
      });
    };

    // Initial ping
    keepSupabaseAwake();
    
    // Ping every 5 minutes (300000ms)
    const interval = setInterval(keepSupabaseAwake, 300000);

    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <AnimatedRoutes />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
