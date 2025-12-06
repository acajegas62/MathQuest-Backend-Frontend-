import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LeaderboardEntry {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  story_levels_completed: number;
  total_stars: number;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from("student_leaderboard")
      .select("*")
      .limit(10);

    if (!error && data) {
      setLeaderboard(data as LeaderboardEntry[]);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center text-white">Loading leaderboard...</div>;
  }

  return (
    <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-8 h-8 text-yellow-400" />
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
          Top Galaxy Rangers
        </h2>
      </div>

      <div className="space-y-4">
        {leaderboard.map((entry, index) => (
          <div
            key={entry.id}
            className={`
              flex items-center gap-4 p-4 rounded-2xl transition-all
              ${index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50' :
                index === 1 ? 'bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-2 border-gray-400/50' :
                index === 2 ? 'bg-gradient-to-r from-orange-700/20 to-orange-800/20 border-2 border-orange-700/50' :
                'bg-white/5 border border-white/10'}
            `}
          >
            {/* Rank */}
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl
              ${index === 0 ? 'bg-yellow-500 text-black' :
                index === 1 ? 'bg-gray-300 text-black' :
                index === 2 ? 'bg-orange-700 text-white' :
                'bg-white/10 text-white'}
            `}>
              {index + 1}
            </div>

            {/* Avatar */}
            <Avatar className="w-14 h-14 border-2 border-primary">
              <AvatarImage 
                src={entry.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.first_name}`} 
              />
              <AvatarFallback>{entry.first_name?.[0]}{entry.last_name?.[0]}</AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1">
              <p className="font-bold text-white text-lg">
                {entry.first_name} {entry.last_name}
              </p>
              <p className="text-sm text-white/60">Level {entry.level}</p>
            </div>

            {/* Stats */}
            <div className="flex gap-4 items-center">
              <div className="text-center">
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-bold">{entry.total_stars || 0}</span>
                </div>
                <p className="text-xs text-white/60">Stars</p>
              </div>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 text-sm">
                {entry.xp} XP
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
