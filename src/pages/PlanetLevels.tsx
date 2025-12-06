import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Lock, CheckCircle2, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import GameTutorialDialog from "@/components/classroom/GameTutorialDialog";

const PLANET_DATA: Record<string, any> = {
  "swap-star": {
    name: "Swap-Star",
    property: "Commutative Property",
    explanation: "You can swap (flip) the numbers in multiplication and the answer stays the same!",
    example: "3 × 4 = 4 × 3 = 12",
    color: "from-purple-500 to-pink-500",
    levels: [
      { number: 1, name: "Basic Swaps", type: "practice" },
      { number: 2, name: "Double Trouble", type: "practice" },
      { number: 3, name: "Master Flipper", type: "practice" },
      { number: 4, name: "Boss: Swap Champion", type: "boss" },
    ],
  },
  "groupara": {
    name: "Groupara",
    property: "Associative Property",
    explanation: "You can group numbers differently and still get the same answer!",
    example: "(2 × 3) × 4 = 2 × (3 × 4) = 24",
    color: "from-blue-500 to-cyan-500",
    levels: [
      { number: 1, name: "Group Basics", type: "practice" },
      { number: 2, name: "Triple Team", type: "practice" },
      { number: 3, name: "Group Master", type: "practice" },
      { number: 4, name: "Boss: Grouping Guru", type: "boss" },
    ],
  },
  "one-der": {
    name: "One-der",
    property: "Identity Property",
    explanation: "Any number multiplied by 1 stays the same - it keeps its identity!",
    example: "7 × 1 = 7",
    color: "from-yellow-500 to-orange-500",
    levels: [
      { number: 1, name: "One Power", type: "practice" },
      { number: 2, name: "Identity Quest", type: "practice" },
      { number: 3, name: "One Master", type: "practice" },
      { number: 4, name: "Boss: Identity Guardian", type: "boss" },
    ],
  },
  "zero-void": {
    name: "Zero-Void",
    property: "Zero Property",
    explanation: "Any number multiplied by zero equals zero - it vanishes!",
    example: "5 × 0 = 0",
    color: "from-gray-500 to-slate-600",
    levels: [
      { number: 1, name: "Vanish Begin", type: "practice" },
      { number: 2, name: "Zero Zone", type: "practice" },
      { number: 3, name: "Void Master", type: "practice" },
      { number: 4, name: "Boss: Zero Commander", type: "boss" },
    ],
  },
  "break-n-build": {
    name: "Break-N-Build",
    property: "Distributive Property",
    explanation: "You can break a number apart, multiply each piece, then add them together!",
    example: "3 × (4 + 2) = (3 × 4) + (3 × 2) = 18",
    color: "from-green-500 to-emerald-500",
    levels: [
      { number: 1, name: "Break Apart", type: "practice" },
      { number: 2, name: "Build Together", type: "practice" },
      { number: 3, name: "Distribution Master", type: "practice" },
      { number: 4, name: "Boss: Builder Supreme", type: "boss" },
    ],
  },
};

const GUEST_PROGRESS_KEY = 'mathquest_guest_story_progress';

export default function PlanetLevels() {
  const { planetId } = useParams();
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());
  const [levelStars, setLevelStars] = useState<Record<number, number>>({});
  const [showTutorial, setShowTutorial] = useState(false);

  const planet = planetId ? PLANET_DATA[planetId] : null;

  useEffect(() => {
    if (user && planetId) {
      fetchProgress();
    } else if (isGuest && planetId) {
      loadGuestProgress();
    }
  }, [user, isGuest, planetId]);

  const loadGuestProgress = () => {
    const saved = localStorage.getItem(GUEST_PROGRESS_KEY);
    if (saved) {
      const allProgress = JSON.parse(saved);
      const planetProgress = allProgress[planetId!] || {};
      
      const completed = new Set<number>(Object.keys(planetProgress).map(Number));
      setCompletedLevels(completed);
      
      const stars: Record<number, number> = {};
      Object.entries(planetProgress).forEach(([level, data]: [string, any]) => {
        stars[parseInt(level)] = data.stars;
      });
      setLevelStars(stars);
    }
  };

  const fetchProgress = async () => {
    const { data } = await supabase
      .from("story_progress")
      .select("*")
      .eq("student_id", user?.id)
      .eq("planet_name", planetId);

    if (data) {
      const completed = new Set(data.map((p) => p.level_number));
      setCompletedLevels(completed);
      
      const stars: Record<number, number> = {};
      data.forEach((p) => {
        stars[p.level_number] = p.stars_earned;
      });
      setLevelStars(stars);
    }
  };

  if (!planet) {
    return <div>Planet not found</div>;
  }

  const isLevelUnlocked = (levelNumber: number) => {
    if (levelNumber === 1) return true;
    // Next level only unlocks if previous level has at least 1 star
    const previousLevelStars = levelStars[levelNumber - 1] || 0;
    return previousLevelStars >= 1;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              animationDelay: Math.random() * 3 + "s",
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Back button */}
        <button
          onClick={() => navigate("/student/story-mode")}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Galaxy
        </button>

        {/* Planet Header */}
        <div className="text-center mb-12 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 max-w-3xl mx-auto">
          <h1 className={`text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${planet.color} mb-4`}>
            {planet.name}
          </h1>
          <h2 className="text-2xl text-purple-200 mb-4">{planet.property}</h2>
          <p className="text-white/90 text-lg mb-2">{planet.explanation}</p>
          <p className="text-yellow-300 font-mono text-xl mb-4">{planet.example}</p>
          
          <Button
            onClick={() => setShowTutorial(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            size="lg"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            View Quick Lesson
          </Button>
        </div>

        {/* Tutorial Dialog */}
        <GameTutorialDialog
          open={showTutorial}
          onClose={() => setShowTutorial(false)}
          planetId={planetId || ""}
          planetName={planet.name}
          planetColor={planet.color}
        />

        {/* Level Map */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {planet.levels.map((level: any, index: number) => {
              const isUnlocked = isLevelUnlocked(level.number);
              const isCompleted = completedLevels.has(level.number);
              const stars = levelStars[level.number] || 0;

              return (
                <div
                  key={level.number}
                  className={`
                    relative backdrop-blur-xl border rounded-2xl p-6
                    transition-all duration-300
                    ${isUnlocked 
                      ? "bg-white/10 border-white/20 hover:bg-white/20 hover:scale-105 cursor-pointer" 
                      : "bg-black/20 border-white/10 cursor-not-allowed opacity-50"
                    }
                    ${level.type === "boss" ? "border-yellow-500/50 shadow-yellow-500/30 shadow-xl" : ""}
                  `}
                  onClick={() => {
                    if (isUnlocked) {
                      navigate(`/student/story-mode/${planetId}/level/${level.number}`);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Level number orb */}
                      <div
                        className={`
                        w-16 h-16 rounded-full flex items-center justify-center
                        font-bold text-2xl text-white
                        ${isUnlocked 
                          ? `bg-gradient-to-br ${planet.color} shadow-lg` 
                          : "bg-gray-600"
                        }
                      `}
                      >
                        {isCompleted ? <CheckCircle2 className="w-8 h-8" /> : level.number}
                      </div>

                      {/* Level info */}
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          {level.name}
                          {level.type === "boss" && " 👑"}
                        </h3>
                        <p className="text-white/60 text-sm">
                          {level.type === "boss" ? "Final Challenge" : "Practice Mission"}
                        </p>
                      </div>
                    </div>

                    {/* Stars and lock */}
                    <div className="flex items-center gap-4">
                      {isCompleted && (
                        <div className="flex gap-1">
                          {[1, 2, 3].map((s) => (
                            <Star
                              key={s}
                              className={`w-6 h-6 ${
                                s <= stars ? "fill-yellow-400 text-yellow-400" : "text-gray-500"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      {!isUnlocked && <Lock className="w-6 h-6 text-white/40" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
