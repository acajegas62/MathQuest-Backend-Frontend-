import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Trophy, Target, Zap, Plus, Users, Rocket } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { toast } from "sonner";
import { useCountUp } from "@/hooks/useCountUp";
import GuestBanner from "@/components/GuestBanner";

interface Classroom {
  id: string;
  name: string;
  description: string;
  code: string;
  cover_image_url?: string;
}

const StudentDashboard = () => {
  const { profile, user, isGuest } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    lessonsDone: 0,
    badgesEarned: 0,
    quizScore: 0,
    streakDays: 0,
  });

  useEffect(() => {
    if (user) {
      fetchClassrooms();
      fetchStudentStats();
    } else if (isGuest) {
      // Guest mode - just set loading to false with default stats
      setLoading(false);
    }
  }, [user, isGuest]);

  const fetchStudentStats = async () => {
    if (!user) return;

    try {
      // Fetch lessons completed
      const { count: lessonsCount } = await supabase
        .from("lesson_completions")
        .select("*", { count: "exact", head: true })
        .eq("student_id", user.id);

      // Fetch badges earned
      const { count: badgesCount } = await supabase
        .from("student_badges")
        .select("*", { count: "exact", head: true })
        .eq("student_id", user.id);

      // Fetch quiz scores
      const { data: quizAttempts } = await supabase
        .from("quiz_attempts")
        .select("score, total_questions")
        .eq("student_id", user.id);

      let avgScore = 0;
      if (quizAttempts && quizAttempts.length > 0) {
        const totalPercentage = quizAttempts.reduce((sum, attempt) => {
          const percentage = (attempt.score / attempt.total_questions) * 100;
          return sum + percentage;
        }, 0);
        avgScore = Math.round(totalPercentage / quizAttempts.length);
      }

      // Get streak days from profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("streak_days")
        .eq("id", user.id)
        .maybeSingle();

      setStats({
        lessonsDone: lessonsCount || 0,
        badgesEarned: badgesCount || 0,
        quizScore: avgScore,
        streakDays: profileData?.streak_days || 0,
      });
    } catch (error) {
      console.error("Error fetching student stats:", error);
    }
  };

  const fetchClassrooms = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("classroom_members")
        .select(`
          classroom_id,
          classrooms (
            id,
            name,
            description,
            code,
            cover_image_url
          )
        `)
        .eq("student_id", user.id);

      if (error) throw error;

      const classroomsData = data?.map(item => item.classrooms).filter(Boolean) || [];
      setClassrooms(classroomsData as Classroom[]);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      toast.error("Failed to load classrooms");
    } finally {
      setLoading(false);
    }
  };

  // Animated counters
  const animatedLessons = useCountUp({ end: stats.lessonsDone, duration: 1500 });
  const animatedBadges = useCountUp({ end: stats.badgesEarned, duration: 1500 });
  const animatedQuizScore = useCountUp({ end: stats.quizScore, duration: 1500 });
  const animatedStreak = useCountUp({ end: stats.streakDays, duration: 1500 });

  const statsDisplay = [
    {
      icon: BookOpen,
      label: "Lessons Done",
      value: animatedLessons.toString(),
      gradient: "from-primary to-secondary",
    },
    {
      icon: Trophy,
      label: "Badges Earned",
      value: animatedBadges.toString(),
      gradient: "from-secondary to-accent",
    },
    {
      icon: Target,
      label: "Quiz Score",
      value: animatedQuizScore > 0 ? `${animatedQuizScore}%` : "0%",
      gradient: "from-accent to-primary",
    },
    {
      icon: Zap,
      label: "Streak Days",
      value: animatedStreak.toString(),
      gradient: "from-warning to-success",
    },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen p-8 pt-24">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 gradient-text">Space Explorer Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {profile ? `${profile.first_name} ${profile.last_name}` : "Astronaut"}! Ready for your next mission?
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/student/story-mode")} className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Rocket className="h-4 w-4" />
                Story Mode
              </Button>
              <Button onClick={() => navigate("/student/join-classroom")} className="gap-2">
                <Plus className="h-4 w-4" />
                Join Classroom
              </Button>
            </div>
          </div>

          {isGuest && <GuestBanner />}

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsDisplay.map((stat, index) => (
              <Card
                key={index}
                className="glass-card-glow p-6 rounded-2xl animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center glow-primary`}
                  >
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold">{stat.value}</span>
                </div>
                <h3 className="text-muted-foreground">{stat.label}</h3>
              </Card>
            ))}
          </div>

          <Card className="glass-card p-6 rounded-2xl">
            <h2 className="text-2xl font-bold mb-6">My Classrooms</h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-pulse">Loading classrooms...</div>
              </div>
            ) : classrooms.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <Users className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">No classrooms yet. Join one to get started!</p>
                <Button onClick={() => navigate("/student/join-classroom")} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Join Classroom
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classrooms.map((classroom, index) => (
                  <Card
                    key={classroom.id}
                    className="glass-card-glow rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => navigate(`/student/classroom/${classroom.id}`)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {classroom.cover_image_url && (
                      <div className="w-full h-40">
                        <img
                          src={classroom.cover_image_url}
                          alt={classroom.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="font-bold text-xl mb-2">{classroom.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {classroom.description || "No description"}
                      </p>
                      <p className="text-xs font-mono bg-primary/20 text-primary px-2 py-1 rounded inline-block">
                        {classroom.code}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
