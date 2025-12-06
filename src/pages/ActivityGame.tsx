import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Header from "@/components/Header";
import OneDerGame from "@/components/games/OneDerGame";
import GrouparaGame from "@/components/games/GrouparaGame";
import ZeroVoidGame from "@/components/games/ZeroVoidGame";
import BreakNBuildGame from "@/components/games/BreakNBuildGame";
import SwapStarGame from "@/components/games/SwapStarGame";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart } from "lucide-react";

interface Activity {
  id: string;
  title: string;
  description: string;
  activity_type: string;
  xp_reward: number;
  classroom_id: string;
  content: any;
}

const ActivityGame = () => {
  const { classroomId, activityId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (activityId && classroomId && user) {
      fetchActivity();
    }
  }, [activityId, classroomId, user]);

  const fetchActivity = async () => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("id", activityId)
        .eq("classroom_id", classroomId)
        .single();

      if (error) throw error;
      setActivity(data);
    } catch (error) {
      console.error("Error fetching activity:", error);
      toast.error("Failed to load activity");
      navigate(`/student/classroom/${classroomId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (score: number, stars: number, timeTaken: number) => {
    if (!activity || !user || gameOver) return;

    try {
      // Record the completion
      const { error: completionError } = await supabase
        .from("activity_completions")
        .insert({
          student_id: user.id,
          activity_id: activity.id,
          classroom_id: classroomId,
          score: score,
          time_taken_seconds: timeTaken,
        });

      if (completionError) throw completionError;

      // Record the score
      const percentage = (score / activity.content.max_score) * 100;
      const { error: scoreError } = await supabase
        .from("student_scores")
        .insert({
          student_id: user.id,
          classroom_id: classroomId,
          activity_id: activity.id,
          activity_title: activity.title,
          activity_type: activity.activity_type,
          score: score,
          max_score: activity.content.max_score,
          percentage: percentage,
        });

      if (scoreError) throw scoreError;

      // Award XP if passed
      if (score >= activity.content.passing_score) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("xp, level")
          .eq("id", user.id)
          .single();

        if (profile) {
          const newXP = profile.xp + activity.xp_reward;
          const newLevel = Math.floor(newXP / 100) + 1;

          await supabase
            .from("profiles")
            .update({
              xp: newXP,
              level: newLevel,
            })
            .eq("id", user.id);

          toast.success(`Activity completed! +${activity.xp_reward} XP`);
        }
      } else {
        toast.info("Activity completed, but you didn't reach the passing score");
      }

      navigate(`/student/classroom/${classroomId}`);
    } catch (error) {
      console.error("Error recording completion:", error);
      toast.error("Failed to save your progress");
    }
  };

  const handleWrongAnswer = () => {
    if (gameOver) return;
    
    const newLives = lives - 1;
    setLives(newLives);
    
    if (newLives <= 0) {
      setGameOver(true);
      toast.error("Game Over! No lives remaining.");
      setTimeout(() => {
        navigate(`/student/classroom/${classroomId}`);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-lg">Loading activity...</div>
        </div>
      </>
    );
  }

  if (!activity) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Card className="glass-card p-8 text-center">
            <p className="text-lg">Activity not found</p>
          </Card>
        </div>
      </>
    );
  }

  // Render the appropriate game based on game_name
  const renderGame = () => {
    const gameName = activity.content?.game_name;
    
    if (gameOver) {
      return (
        <div className="flex items-center justify-center min-h-[80vh]">
          <Card className="glass-card p-12 text-center max-w-md">
            <h2 className="text-3xl font-bold text-destructive mb-4">Game Over!</h2>
            <p className="text-lg text-muted-foreground mb-6">You ran out of lives. Try again!</p>
            <Button onClick={() => navigate(`/student/classroom/${classroomId}`)}>
              Return to Classroom
            </Button>
          </Card>
        </div>
      );
    }
    
    switch (gameName) {
      case "OneDer":
        return <OneDerGame levelNumber={1} onComplete={handleComplete} onWrongAnswer={handleWrongAnswer} />;
      case "Groupara":
        return <GrouparaGame levelNumber={1} onComplete={handleComplete} onWrongAnswer={handleWrongAnswer} />;
      case "ZeroVoid":
        return <ZeroVoidGame levelNumber={1} onComplete={handleComplete} onWrongAnswer={handleWrongAnswer} />;
      case "BreakNBuild":
        return <BreakNBuildGame levelNumber={1} onComplete={handleComplete} onWrongAnswer={handleWrongAnswer} />;
      case "SwapStar":
        return <SwapStarGame levelNumber={1} onComplete={handleComplete} onWrongAnswer={handleWrongAnswer} />;
      default:
        return (
          <Card className="glass-card p-8 text-center">
            <p className="text-lg">Game not available</p>
          </Card>
        );
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen relative">
        {/* Back Button */}
        <div className="absolute top-20 left-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/student/classroom/${classroomId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Classroom
          </Button>
        </div>
        
        {/* Lives Display */}
        <div className="absolute top-20 right-4 z-50 flex gap-2">
          {[...Array(3)].map((_, i) => (
            <Heart
              key={i}
              className={`h-8 w-8 ${
                i < lives 
                  ? "fill-red-500 text-red-500 animate-pulse" 
                  : "fill-gray-600 text-gray-600 opacity-30"
              }`}
            />
          ))}
        </div>
        
        <div className="pt-24">
          {renderGame()}
        </div>
      </div>
    </>
  );
};

export default ActivityGame;
