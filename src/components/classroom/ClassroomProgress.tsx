import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Award, BookOpen, Trophy } from "lucide-react";
import { toast } from "sonner";

interface StudentProgress {
  student_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  lessons_completed: number;
  quizzes_passed: number;
  activities_completed: number;
  total_xp: number;
}

interface ClassroomProgressProps {
  classroomId: string;
}

const ClassroomProgress = ({ classroomId }: ClassroomProgressProps) => {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ lessons: 0, quizzes: 0, activities: 0 });

  useEffect(() => {
    fetchProgressData();
  }, [classroomId]);

  const fetchProgressData = async () => {
    try {
      // Get total counts for the classroom
      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("id")
        .eq("classroom_id", classroomId);

      const { data: quizzesData } = await supabase
        .from("quizzes")
        .select("id")
        .eq("classroom_id", classroomId);

      const { data: activitiesData } = await supabase
        .from("activities")
        .select("id")
        .eq("classroom_id", classroomId);

      setTotals({
        lessons: lessonsData?.length || 0,
        quizzes: quizzesData?.length || 0,
        activities: activitiesData?.length || 0
      });

      // Get classroom members
      const { data: members, error: membersError } = await supabase
        .from("classroom_members")
        .select("student_id")
        .eq("classroom_id", classroomId);

      if (membersError) throw membersError;

      if (!members || members.length === 0) {
        setStudents([]);
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

      // Get lesson completions
      const { data: lessonCompletions } = await supabase
        .from("lesson_completions")
        .select("student_id")
        .eq("classroom_id", classroomId)
        .in("student_id", studentIds);

      // Get quiz attempts (passed)
      const { data: quizAttempts } = await supabase
        .from("quiz_attempts")
        .select("student_id, score, total_questions, quiz_id")
        .in("student_id", studentIds);

      // Get quizzes with passing scores
      const { data: quizzes } = await supabase
        .from("quizzes")
        .select("id, passing_score")
        .eq("classroom_id", classroomId);

      const quizzesMap = new Map(quizzes?.map(q => [q.id, q.passing_score]) || []);

      // Get activity completions
      const { data: activityCompletions } = await supabase
        .from("activity_completions")
        .select("student_id")
        .eq("classroom_id", classroomId)
        .in("student_id", studentIds);

      // Build student progress data
      const progressData = profiles?.map(profile => {
        const lessonsCount = lessonCompletions?.filter(lc => lc.student_id === profile.id).length || 0;
        
        const passedQuizzes = quizAttempts?.filter(qa => {
          const passingScore = quizzesMap.get(qa.quiz_id);
          const percentage = (qa.score / qa.total_questions) * 100;
          return qa.student_id === profile.id && percentage >= (passingScore || 70);
        }).length || 0;
        
        const activitiesCount = activityCompletions?.filter(ac => ac.student_id === profile.id).length || 0;

        return {
          student_id: profile.id,
          first_name: profile.first_name || "Unknown",
          last_name: profile.last_name || "Student",
          avatar_url: profile.avatar_url,
          lessons_completed: lessonsCount,
          quizzes_passed: passedQuizzes,
          activities_completed: activitiesCount,
          total_xp: profile.xp || 0
        };
      }) || [];

      setStudents(progressData);
    } catch (error) {
      console.error("Error fetching progress:", error);
      toast.error("Failed to load student progress");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card p-8">
        <div className="animate-pulse text-center">Loading progress...</div>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card className="glass-card p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-4">Student Progress</h2>
        <p className="text-muted-foreground">No students enrolled yet</p>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-6 rounded-2xl space-y-6">
      <h2 className="text-2xl font-bold">Student Progress</h2>

      <div className="space-y-4">
        {students.map((student) => (
          <Card key={student.student_id} className="glass-card p-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={student.avatar_url || ""} />
                <AvatarFallback>
                  {student.first_name[0]}{student.last_name[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold">
                    {student.first_name} {student.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {student.total_xp} XP
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      Lessons
                    </span>
                    <span className="font-medium">
                      {student.lessons_completed}/{totals.lessons}
                    </span>
                  </div>
                  <Progress 
                    value={totals.lessons > 0 ? (student.lessons_completed / totals.lessons) * 100 : 0} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      Quizzes Passed
                    </span>
                    <span className="font-medium">
                      {student.quizzes_passed}/{totals.quizzes}
                    </span>
                  </div>
                  <Progress 
                    value={totals.quizzes > 0 ? (student.quizzes_passed / totals.quizzes) * 100 : 0} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Activities</span>
                    <span className="font-medium">
                      {student.activities_completed}/{totals.activities}
                    </span>
                  </div>
                  <Progress 
                    value={totals.activities > 0 ? (student.activities_completed / totals.activities) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default ClassroomProgress;
