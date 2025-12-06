import { useNavigate } from "react-router-dom";
import { Rocket, Zap, Circle, Target, Divide, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface PlanetProgress {
  planet_name: string;
  completed_levels: number;
  total_levels: number;
  badge_unlocked: boolean;
}

const PLANETS = [
  {
    id: "swap-star",
    name: "Swap-Star",
    property: "Commutative",
    label: "Flip-Swap Power",
    description: "Learn that you can swap numbers and still get the same answer!",
    icon: Rocket,
    color: "from-purple-500 to-pink-500",
    glowColor: "shadow-purple-500/50",
  },
  {
    id: "groupara",
    name: "Groupara",
    property: "Associative",
    label: "Group Magic",
    description: "Discover how grouping numbers differently gives the same result!",
    icon: Circle,
    color: "from-blue-500 to-cyan-500",
    glowColor: "shadow-blue-500/50",
  },
  {
    id: "one-der",
    name: "One-der",
    property: "Identity",
    label: "Multiply by 1 Potion",
    description: "Unlock the secret: any number times 1 stays the same!",
    icon: Zap,
    color: "from-yellow-500 to-orange-500",
    glowColor: "shadow-yellow-500/50",
  },
  {
    id: "zero-void",
    name: "Zero-Void",
    property: "Zero Property",
    label: "Vanish Beam",
    description: "See how any number times zero becomes zero!",
    icon: Target,
    color: "from-gray-500 to-slate-600",
    glowColor: "shadow-gray-500/50",
  },
  {
    id: "break-n-build",
    name: "Break-N-Build",
    property: "Distributive",
    label: "Break & Gather Power",
    description: "Learn to break numbers apart and multiply separately!",
    icon: Divide,
    color: "from-green-500 to-emerald-500",
    glowColor: "shadow-green-500/50",
  },
];

const GUEST_PROGRESS_KEY = 'mathquest_guest_story_progress';

export default function StoryMode() {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const [progress, setProgress] = useState<Record<string, PlanetProgress>>({});

  useEffect(() => {
    if (user) {
      fetchProgress();
    } else if (isGuest) {
      loadGuestProgress();
    }
  }, [user, isGuest]);

  const loadGuestProgress = () => {
    const saved = localStorage.getItem(GUEST_PROGRESS_KEY);
    const progressMap: Record<string, PlanetProgress> = {};
    
    if (saved) {
      const rawProgress = JSON.parse(saved);
      // Convert raw localStorage format to PlanetProgress format
      PLANETS.forEach((planet) => {
        const planetData = rawProgress[planet.id] || {};
        const completedLevels = Object.keys(planetData).length;
        const hasBadge = Object.values(planetData).some((level: any) => level.badgeUnlocked);
        
        progressMap[planet.id] = {
          planet_name: planet.id,
          completed_levels: completedLevels,
          total_levels: 4,
          badge_unlocked: hasBadge,
        };
      });
    } else {
      // Initialize default progress for guest
      PLANETS.forEach((planet) => {
        progressMap[planet.id] = {
          planet_name: planet.id,
          completed_levels: 0,
          total_levels: 4,
          badge_unlocked: false,
        };
      });
    }
    
    setProgress(progressMap);
  };

  const fetchProgress = async () => {
    const { data, error } = await supabase
      .from("story_progress")
      .select("*")
      .eq("student_id", user?.id);

    if (!error && data) {
      const progressMap: Record<string, PlanetProgress> = {};
      PLANETS.forEach((planet) => {
        const planetData = data.filter((p) => p.planet_name === planet.id);
        progressMap[planet.id] = {
          planet_name: planet.id,
          completed_levels: planetData.length,
          total_levels: 4, // 3 practice + 1 boss
          badge_unlocked: planetData.some((p) => p.badge_unlocked),
        };
      });
      setProgress(progressMap);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              animationDelay: Math.random() * 3 + "s",
              animationDuration: Math.random() * 3 + 2 + "s",
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Back Button */}
        <Button
          onClick={() => navigate("/student/dashboard")}
          variant="ghost"
          className="mb-4 text-white/80 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 mb-4">
            Galaxy Math Rangers
          </h1>
          <p className="text-xl text-purple-200">
            Master the 5 Properties of Multiplication across the galaxy!
          </p>
        </div>

        {/* Planets Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="show"
        >
          {PLANETS.map((planet, index) => {
            const Icon = planet.icon;
            const planetProgress = progress[planet.id];
            const completionPercentage = planetProgress
              ? (planetProgress.completed_levels / planetProgress.total_levels) * 100
              : 0;

            return (
              <motion.div
                key={planet.id}
                className="group cursor-pointer"
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.8 },
                  show: { 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 100,
                      damping: 12
                    }
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/student/story-mode/${planet.id}`)}
              >
                <div className="relative">
                  {/* Liquid glass card */}
                  <div
                    className={`
                    relative backdrop-blur-xl bg-white/10 border border-white/20 
                    rounded-3xl p-8 transition-all duration-500
                    hover:bg-white/20 
                    ${planet.glowColor} shadow-2xl
                    group-hover:shadow-3xl
                  `}
                  >
                    {/* Badge indicator */}
                    {planetProgress?.badge_unlocked && (
                      <div className="absolute -top-4 -right-4 bg-yellow-500 rounded-full p-3 shadow-lg animate-bounce">
                        <span className="text-2xl">🏆</span>
                      </div>
                    )}

                    {/* Planet Icon */}
                    <div
                      className={`
                      w-24 h-24 mx-auto mb-6 rounded-full 
                      bg-gradient-to-br ${planet.color}
                      flex items-center justify-center
                      shadow-2xl ${planet.glowColor}
                      group-hover:rotate-12 transition-transform duration-500
                    `}
                    >
                      <Icon className="w-12 h-12 text-white" />
                    </div>

                    {/* Planet Info */}
                    <h3 className="text-2xl font-bold text-white text-center mb-2">
                      {planet.name}
                    </h3>
                    <p className="text-purple-200 text-center text-sm font-semibold mb-3">
                      {planet.label}
                    </p>
                    <p className="text-white/80 text-center text-sm mb-4">
                      {planet.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 rounded-full h-3 mb-2 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${planet.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercentage}%` }}
                        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-white/60 text-xs text-center">
                      {planetProgress?.completed_levels || 0} / {planetProgress?.total_levels || 4}{" "}
                      missions
                    </p>

                    {/* Start button */}
                    <button
                      className={`
                      w-full mt-4 py-3 rounded-xl font-bold text-white
                      bg-gradient-to-r ${planet.color}
                      hover:scale-105 transition-transform duration-200
                      shadow-lg
                    `}
                    >
                      {planetProgress?.completed_levels > 0 ? "Continue" : "Start Mission"}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
