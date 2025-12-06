import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StudentStoryBadges from "./StudentStoryBadges";

interface StudentProfileDialogProps {
  studentId: string;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StudentProfile {
  id: string;
  first_name: string;
  last_name: string;
  username?: string;
  avatar_url?: string;
  xp: number;
  level: number;
  role: string;
  gender?: string;
}

const StudentProfileDialog = ({ studentId, studentName, open, onOpenChange }: StudentProfileDialogProps) => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && studentId) {
      fetchStudentProfile();
    }
  }, [open, studentId]);

  const fetchStudentProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching student profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl glass-card">
          <div className="animate-pulse text-center">Loading profile...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!profile) {
    return null;
  }

  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl glass-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
            Student Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Profile Header */}
          <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-2 border-purple-500/30 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" />
                  <Avatar className="relative w-32 h-32 border-4 border-purple-400 shadow-2xl shadow-purple-500/50">
                    <AvatarImage src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentName}`} />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-purple-600 to-pink-600">{initials}</AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 text-center md:text-left space-y-3">
                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                    {profile.first_name} {profile.last_name}
                  </h2>
                  {profile.username && (
                    <p className="text-white/60">@{profile.username}</p>
                  )}
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-300">
                      <Trophy className="w-4 h-4 mr-1" />
                      Level {profile.level}
                    </Badge>
                    {profile.gender && (
                      <Badge className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-300">
                        {profile.gender}
                      </Badge>
                    )}
                    <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300">
                      {profile.role}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
                      {profile.xp || 0}
                    </div>
                    <div className="text-sm text-white/60 mt-1 flex items-center justify-center gap-1">
                      <Star className="w-4 h-4" />
                      Total XP
                    </div>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                      {profile.level || 1}
                    </div>
                    <div className="text-sm text-white/60 mt-1 flex items-center justify-center gap-1">
                      <Target className="w-4 h-4" />
                      Current Level
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Story Mode Badges */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Story Mode Achievements
            </h3>
            <StudentStoryBadges 
              studentId={studentId} 
              studentName={studentName}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentProfileDialog;
