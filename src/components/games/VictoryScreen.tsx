import { Star, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useCountUp } from "@/hooks/useCountUp";
import { motion } from "framer-motion";

const GUEST_PROGRESS_KEY = 'mathquest_guest_story_progress';

interface VictoryScreenProps {
  planetId: string;
  levelNumber: number;
  score: number;
  stars: number;
  timeTaken: number; // in seconds
  onContinue: () => void;
}

export default function VictoryScreen({
  planetId,
  levelNumber,
  score,
  stars,
  timeTaken,
  onContinue,
}: VictoryScreenProps) {
  const { user, isGuest } = useAuth();
  const animatedScore = useCountUp({ end: score, duration: 1500 });
  const animatedXP = useCountUp({ end: stars * 50, duration: 1500, start: 0 });

  useEffect(() => {
    if (user) {
      saveProgress();
    } else if (isGuest) {
      saveGuestProgress();
    }
  }, [user, isGuest]);

  const saveGuestProgress = () => {
    const saved = localStorage.getItem(GUEST_PROGRESS_KEY);
    const allProgress = saved ? JSON.parse(saved) : {};
    
    if (!allProgress[planetId]) {
      allProgress[planetId] = {};
    }
    
    // Only update if new stars are higher
    const existingStars = allProgress[planetId][levelNumber]?.stars || 0;
    const finalStars = Math.max(existingStars, stars);
    
    allProgress[planetId][levelNumber] = {
      stars: finalStars,
      score,
      timeTaken,
      badgeUnlocked: levelNumber === 4 && finalStars >= 2,
    };
    
    localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(allProgress));
    toast.success("Progress saved! +" + (stars * 50) + " XP");
  };

  const saveProgress = async () => {
    const isBossLevel = levelNumber === 4;
    const xpEarned = stars * 50;
    
    // Fetch existing progress to ensure stars never decrease
    const { data: existingProgress } = await supabase
      .from("story_progress")
      .select("stars_earned")
      .eq("student_id", user?.id)
      .eq("planet_name", planetId)
      .eq("level_number", levelNumber)
      .single();

    // Use the maximum of current and new stars (never decrease)
    const finalStars = existingProgress 
      ? Math.max(existingProgress.stars_earned, stars)
      : stars;
    
    // Save story progress with time tracking
    const { error: progressError } = await supabase.from("story_progress").upsert(
      {
        student_id: user?.id,
        planet_name: planetId,
        level_number: levelNumber,
        stars_earned: finalStars,
        badge_unlocked: isBossLevel && finalStars >= 2,
        time_taken_seconds: timeTaken,
      },
      {
        onConflict: "student_id,planet_name,level_number",
      }
    );

    if (progressError) {
      toast.error("Failed to save progress");
      return;
    }

    // Update profile XP
    const { data: profile } = await supabase
      .from("profiles")
      .select("xp, level")
      .eq("id", user?.id)
      .single();

    if (profile) {
      const newXP = (profile.xp || 0) + xpEarned;
      const newLevel = Math.floor(newXP / 100) + 1;

      await supabase
        .from("profiles")
        .update({ xp: newXP, level: newLevel })
        .eq("id", user?.id);
    }

    toast.success("Progress saved! +" + xpEarned + " XP");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center relative overflow-hidden">
      {/* Celebration effects */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <Sparkles
            key={i}
            className="absolute text-yellow-400 animate-ping"
            style={{
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              animationDelay: Math.random() * 2 + "s",
            }}
          />
        ))}
      </div>

      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-12 max-w-2xl w-full mx-4 text-center relative z-10 animate-scale-in">
        {/* Trophy */}
        <div className="mb-8">
          <Trophy className="w-32 h-32 mx-auto text-yellow-400 animate-bounce" />
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-4">
          Mission Complete!
        </h1>

        {/* Stars */}
        <motion.div 
          className="flex justify-center gap-4 mb-8"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
              }
            }
          }}
          initial="hidden"
          animate="show"
        >
          {[1, 2, 3].map((s) => (
            <motion.div
              key={s}
              variants={{
                hidden: { scale: 0, rotate: -180 },
                show: { 
                  scale: 1, 
                  rotate: 0,
                  transition: {
                    type: "spring",
                    stiffness: 200,
                    damping: 10
                  }
                }
              }}
            >
              <Star
                className={`w-16 h-16 transition-all duration-500 ${
                  s <= stars
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-500"
                }`}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Score */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-2xl text-white mb-2">Score</p>
          <p className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {animatedScore}
          </p>
        </motion.div>

        {/* XP & Time */}
        <motion.div 
          className="grid grid-cols-2 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-4">
            <p className="text-white text-lg">
              ⚡ +{animatedXP} XP Earned!
            </p>
          </div>
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-4">
            <p className="text-white text-lg">
              ⏱️ Time: {Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, '0')}
            </p>
          </div>
        </motion.div>

        {/* Badge unlock */}
        {levelNumber === 4 && stars >= 2 && (
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-4 mb-8 animate-pulse">
            <p className="text-yellow-400 text-2xl font-bold">
              🏆 Badge Unlocked!
            </p>
            <p className="text-white/80">Your teacher can now see your achievement!</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={onContinue}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-8 py-6"
            size="lg"
          >
            Continue Adventure
          </Button>
        </div>
      </div>
    </div>
  );
}
