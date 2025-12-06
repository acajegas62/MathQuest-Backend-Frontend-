import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentStoryBadgesProps {
  studentId: string;
  studentName: string;
}

interface BadgeData {
  planet_name: string;
  badge_unlocked: boolean;
  total_stars: number;
}

const PLANET_NAMES: Record<string, string> = {
  "swap-star": "Swap-Star Champion",
  "groupara": "Grouping Guru",
  "one-der": "Identity Guardian",
  "zero-void": "Zero Commander",
  "break-n-build": "Builder Supreme",
};

export default function StudentStoryBadges({ studentId, studentName }: StudentStoryBadgesProps) {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBadges();
  }, [studentId]);

  const fetchBadges = async () => {
    const { data, error } = await supabase
      .from("story_progress")
      .select("planet_name, badge_unlocked, stars_earned")
      .eq("student_id", studentId)
      .eq("badge_unlocked", true);

    if (!error && data) {
      // Group by planet and sum stars
      const badgeMap: Record<string, BadgeData> = {};
      data.forEach((item) => {
        if (!badgeMap[item.planet_name]) {
          badgeMap[item.planet_name] = {
            planet_name: item.planet_name,
            badge_unlocked: item.badge_unlocked,
            total_stars: 0,
          };
        }
        badgeMap[item.planet_name].total_stars += item.stars_earned;
      });
      setBadges(Object.values(badgeMap));
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading badges...</div>;
  }

  if (badges.length === 0) {
    return (
      <Card className="backdrop-blur-xl bg-gradient-to-br from-slate-900/60 to-purple-900/40 border-2 border-purple-500/20 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h3 className="text-xl font-bold text-white">Story Mode Achievements</h3>
          </div>
        </div>
        <p className="text-white/60">No story mode badges earned yet</p>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-xl bg-gradient-to-br from-slate-900/60 to-purple-900/40 border-2 border-purple-500/20 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-bold text-white">Story Mode Achievements</h3>
        </div>
        <Button
          onClick={() => navigate(`/badges/${studentId}`)}
          variant="ghost"
          size="sm"
          className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/20"
        >
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      <div className="space-y-3">
        {badges.slice(0, 3).map((badge) => (
          <div
            key={badge.planet_name}
            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 hover:border-yellow-500/40 transition-all cursor-pointer"
            onClick={() => navigate(`/badges/${studentId}`)}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏆</div>
              <div>
                <p className="font-semibold text-white text-sm">
                  {PLANET_NAMES[badge.planet_name] || badge.planet_name}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(badge.total_stars)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-0">
              Completed
            </Badge>
          </div>
        ))}
        {badges.length > 3 && (
          <p className="text-center text-white/60 text-sm">
            +{badges.length - 3} more badge{badges.length - 3 !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </Card>
  );
}
