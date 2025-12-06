import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface LeaderboardEntry {
  student_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  total_xp: number;
  quizzes_passed: number;
  avg_score: number;
  rank: number;
}

interface ClassroomLeaderboardProps {
  classroomId: string;
}

const ClassroomLeaderboard = ({ classroomId }: ClassroomLeaderboardProps) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [classroomId]);

  const fetchLeaderboard = async () => {
    try {
      // Get classroom members
      const { data: members, error: membersError } = await supabase
        .from("classroom_members")
        .select("student_id")
        .eq("classroom_id", classroomId);

      if (membersError) throw membersError;

      if (!members || members.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      const studentIds = members.map(m => m.student_id);

      // Get student profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, xp")
        .in("id", studentIds);

      if (profilesError) throw profilesError;

      // Get quiz attempts for this classroom
      const { data: quizzes } = await supabase
        .from("quizzes")
        .select("id, passing_score")
        .eq("classroom_id", classroomId);

      const quizIds = quizzes?.map(q => q.id) || [];
      const quizzesMap = new Map(quizzes?.map(q => [q.id, q.passing_score]) || []);

      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("student_id, score, total_questions, quiz_id")
        .in("student_id", studentIds)
        .in("quiz_id", quizIds);

      // Calculate stats for each student
      const leaderboardData = profiles?.map(profile => {
        const studentAttempts = attempts?.filter(a => a.student_id === profile.id) || [];
        
        const passedQuizzes = studentAttempts.filter(a => {
          const passingScore = quizzesMap.get(a.quiz_id) || 70;
          const percentage = (a.score / a.total_questions) * 100;
          return percentage >= passingScore;
        }).length;

        const avgScore = studentAttempts.length > 0
          ? studentAttempts.reduce((sum, a) => sum + (a.score / a.total_questions) * 100, 0) / studentAttempts.length
          : 0;

        return {
          student_id: profile.id,
          first_name: profile.first_name || "Unknown",
          last_name: profile.last_name || "Student",
          avatar_url: profile.avatar_url,
          total_xp: profile.xp || 0,
          quizzes_passed: passedQuizzes,
          avg_score: avgScore,
          rank: 0
        };
      }) || [];

      // Sort by XP (primary) and avg score (secondary)
      leaderboardData.sort((a, b) => {
        if (b.total_xp !== a.total_xp) return b.total_xp - a.total_xp;
        return b.avg_score - a.avg_score;
      });

      // Assign ranks
      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-700" />;
      default:
        return <span className="text-2xl font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  if (loading) {
    return (
      <Card className="glass-card p-8">
        <div className="animate-pulse text-center">Loading leaderboard...</div>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="glass-card p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
        <p className="text-muted-foreground">No student data available yet</p>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-6 rounded-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-yellow-500" />
        <h2 className="text-2xl font-bold">Classroom Leaderboard</h2>
      </div>

      <div className="space-y-3">
        {leaderboard.map((entry) => (
          <Card 
            key={entry.student_id} 
            className={`glass-card p-4 ${
              entry.rank <= 3 ? 'border-2 border-primary/50' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12">
                {getRankIcon(entry.rank)}
              </div>

              <Avatar className="h-12 w-12">
                <AvatarImage src={entry.avatar_url || ""} />
                <AvatarFallback>
                  {entry.first_name[0]}{entry.last_name[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h3 className="font-semibold">
                  {entry.first_name} {entry.last_name}
                </h3>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {entry.total_xp} XP
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    {entry.quizzes_passed} Passed
                  </span>
                  {entry.avg_score > 0 && (
                    <span>
                      Avg: {entry.avg_score.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default ClassroomLeaderboard;
