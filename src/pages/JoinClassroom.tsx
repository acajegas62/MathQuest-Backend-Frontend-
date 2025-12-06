import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { toast } from "sonner";

const JoinClassroom = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classCode, setClassCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoinClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !classCode.trim()) return;

    setLoading(true);
    try {
      // Find classroom by code
      const { data: classroom, error: classroomError } = await supabase
        .from("classrooms")
        .select("id, name, teacher_id")
        .eq("code", classCode.toUpperCase())
        .single();

      if (classroomError || !classroom) {
        toast.error("Invalid classroom code");
        setLoading(false);
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from("classroom_members")
        .select("id")
        .eq("classroom_id", classroom.id)
        .eq("student_id", user.id)
        .single();

      if (existingMember) {
        toast.error("You're already a member of this classroom");
        setLoading(false);
        return;
      }

      // Join classroom
      const { error: joinError } = await supabase
        .from("classroom_members")
        .insert({
          classroom_id: classroom.id,
          student_id: user.id,
        });

      if (joinError) throw joinError;

      // Get student profile info
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, school_id")
        .eq("id", user.id)
        .single();

      // Create notification for teacher
      const studentName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'A student';
      const studentId = profile?.school_id ? ` (ID: ${profile.school_id})` : '';
      
      await supabase.from("notifications").insert({
        user_id: classroom.teacher_id,
        title: "New Student Joined",
        message: `${studentName}${studentId} has joined your classroom: ${classroom.name}`,
        type: "classroom_join",
      });

      toast.success(`Successfully joined ${classroom.name}!`);
      navigate("/student/dashboard");
    } catch (error) {
      console.error("Error joining classroom:", error);
      toast.error("Failed to join classroom");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="glass-card p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 glow-primary">
              <UserPlus className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Join a Classroom</h1>
            <p className="text-muted-foreground">Enter the classroom code provided by your teacher</p>
          </div>

          <form onSubmit={handleJoinClassroom} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="classCode">Classroom Code</Label>
              <Input
                id="classCode"
                placeholder="Enter code (e.g., ABC123)"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                maxLength={10}
                className="text-center text-2xl font-mono tracking-wider"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !classCode.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Join Classroom
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => navigate("/student/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default JoinClassroom;
