import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Star, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BadgeProgress {
  planet_name: string;
  badge_unlocked: boolean;
  stars_earned: number;
  completed_at?: string;
}

interface EarnedBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badges: {
    name: string;
    description: string;
    icon: string;
    badge_type: string;
  };
}

const ALL_PLANETS = [
  {
    id: "swap-star",
    name: "Swap-Star Champion",
    description: "Master the Commutative Property",
    emoji: "🔄",
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: "groupara",
    name: "Grouping Guru",
    description: "Conquer the Associative Property",
    emoji: "🎯",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "one-der",
    name: "Identity Guardian",
    description: "Unlock the Identity Property",
    emoji: "✨",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "zero-void",
    name: "Zero Commander",
    description: "Control the Zero Property",
    emoji: "⚡",
    color: "from-gray-500 to-slate-600",
  },
  {
    id: "break-n-build",
    name: "Builder Supreme",
    description: "Master the Distributive Property",
    emoji: "🔨",
    color: "from-green-500 to-emerald-500",
  },
];

export default function Badges() {
  const { studentId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [badges, setBadges] = useState<BadgeProgress[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Determine which student's badges to show
  const viewingStudentId = studentId || user?.id;

  useEffect(() => {
    fetchBadges();
    fetchEarnedBadges();
    if (studentId) {
      fetchStudentInfo();
    }
  }, [viewingStudentId]);

  const fetchStudentInfo = async () => {
    if (!studentId) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", studentId)
      .maybeSingle();
    
    if (data) {
      setStudentInfo(data);
    }
  };

  const fetchEarnedBadges = async () => {
    const { data, error } = await supabase
      .from("student_badges")
      .select(`
        id,
        badge_id,
        earned_at,
        badges (
          name,
          description,
          icon,
          badge_type
        )
      `)
      .eq("student_id", viewingStudentId);

    if (!error && data) {
      setEarnedBadges(data as EarnedBadge[]);
    }
  };

  const fetchBadges = async () => {
    const { data, error } = await supabase
      .from("story_progress")
      .select("planet_name, badge_unlocked, stars_earned, completed_at")
      .eq("student_id", viewingStudentId)
      .eq("badge_unlocked", true);

    if (!error && data) {
      setBadges(data as BadgeProgress[]);
    }
    setLoading(false);
  };

  const isBadgeUnlocked = (planetId: string) => {
    return badges.some((b) => b.planet_name === planetId && b.badge_unlocked);
  };

  const getBadgeStars = (planetId: string) => {
    const badge = badges.find((b) => b.planet_name === planetId);
    return badge?.stars_earned || 0;
  };

  const displayName = studentInfo 
    ? `${studentInfo.first_name} ${studentInfo.last_name}`
    : profile 
    ? `${profile.first_name} ${profile.last_name}`
    : "Galaxy Ranger";

  const totalUnlocked = badges.length;
  const totalStars = badges.reduce((sum, b) => sum + b.stars_earned, 0);
  const totalBadgesEarned = earnedBadges.length + badges.length;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 p-4 md:p-8 pt-24">
        {/* Animated background */}
        <div className="fixed inset-0 pointer-events-none opacity-30">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                top: Math.random() * 100 + "%",
                left: Math.random() * 100 + "%",
                animationDelay: Math.random() * 3 + "s",
              }}
            />
          ))}
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Back Button */}
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="mb-6 text-white/80 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>

          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Trophy className="w-16 h-16 text-yellow-400" />
              <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                Badge Collection
              </h1>
            </div>
            <p className="text-white/60 text-xl mb-6">{displayName}'s Achievements</p>

            {/* Stats */}
            <div className="flex justify-center gap-6 mb-8">
              <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl px-8 py-4">
                <div className="text-4xl font-bold text-yellow-400">{totalBadgesEarned}</div>
                <div className="text-sm text-white/60">Total Badges</div>
              </div>
              <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl px-8 py-4">
                <div className="text-4xl font-bold text-blue-400">{totalUnlocked}/5</div>
                <div className="text-sm text-white/60">Story Badges</div>
              </div>
              <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl px-8 py-4">
                <div className="flex items-center justify-center gap-2">
                  <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                  <div className="text-4xl font-bold text-yellow-400">{totalStars}</div>
                </div>
                <div className="text-sm text-white/60">Total Stars</div>
              </div>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="space-y-8">
            {/* Story Mode Badges */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Story Mode Badges</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ALL_PLANETS.map((planet) => {
                  const unlocked = isBadgeUnlocked(planet.id);
                  const stars = getBadgeStars(planet.id);

                  return (
                    <Card
                      key={planet.id}
                      className={`
                        relative backdrop-blur-xl border-2 rounded-3xl p-8 transition-all duration-300 hover:scale-105
                        ${unlocked
                          ? `bg-gradient-to-br ${planet.color}/20 border-${planet.color.split('-')[1]}-500/50 shadow-xl`
                          : 'bg-slate-900/40 border-slate-700/30 grayscale opacity-60'
                        }
                      `}
                    >
                      {/* Lock overlay for locked badges */}
                      {!unlocked && (
                        <div className="absolute top-4 right-4">
                          <div className="w-12 h-12 rounded-full bg-slate-800/80 border-2 border-slate-600 flex items-center justify-center">
                            <Lock className="w-6 h-6 text-slate-400" />
                          </div>
                        </div>
                      )}

                      {/* Badge Icon */}
                      <div className="text-center mb-6">
                        <div className={`
                          text-8xl mb-4 transition-all duration-300
                          ${unlocked ? 'animate-bounce' : ''}
                        `}>
                          {planet.emoji}
                        </div>
                        <h3 className={`
                          text-2xl font-bold mb-2
                          ${unlocked ? 'text-transparent bg-clip-text bg-gradient-to-r ' + planet.color : 'text-slate-400'}
                        `}>
                          {planet.name}
                        </h3>
                        <p className={`text-sm ${unlocked ? 'text-white/70' : 'text-slate-500'}`}>
                          {planet.description}
                        </p>
                      </div>

                      {/* Badge Status */}
                      {unlocked ? (
                        <div className="space-y-3">
                          <div className="flex justify-center gap-1">
                            {[...Array(3)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-6 h-6 ${
                                  i < stars
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-slate-600"
                                }`}
                              />
                            ))}
                          </div>
                          <Badge className={`w-full justify-center bg-gradient-to-r ${planet.color} text-white border-0 py-2`}>
                            ✓ Completed
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="outline" className="w-full justify-center border-slate-600 text-slate-400 py-2">
                          🔒 Locked
                        </Badge>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Achievement Badges */}
            {earnedBadges.length > 0 && (
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">Achievement Badges</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {earnedBadges.map((earnedBadge) => (
                    <Card
                      key={earnedBadge.id}
                      className="relative backdrop-blur-xl border-2 rounded-3xl p-8 transition-all duration-300 hover:scale-105 bg-gradient-to-br from-green-500/20 to-teal-500/20 border-green-500/50 shadow-xl"
                    >
                      {/* Badge Icon */}
                      <div className="text-center mb-6">
                        <div className="text-8xl mb-4 animate-bounce">
                          {earnedBadge.badges.icon}
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-teal-500">
                          {earnedBadge.badges.name}
                        </h3>
                        <p className="text-sm text-white/70">
                          {earnedBadge.badges.description}
                        </p>
                        <p className="text-xs text-white/50 mt-2">
                          Earned: {new Date(earnedBadge.earned_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Badge Status */}
                      <Badge className="w-full justify-center bg-gradient-to-r from-green-500 to-teal-500 text-white border-0 py-2">
                        ✓ Completed
                      </Badge>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Call to Action */}
          {totalUnlocked < 5 && !studentId && (
            <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-2 border-blue-500/30 rounded-3xl p-8 mt-12 text-center">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-3">
                Ready for More Adventures?
              </h2>
              <p className="text-white/70 mb-6">
                Complete all Story Mode levels to unlock every badge!
              </p>
              <Button
                onClick={() => navigate("/student/story-mode")}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-8 py-6"
              >
                Continue Story Mode
              </Button>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
