import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Award, Gamepad2, Lock, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import StudentLessonView from "@/components/classroom/StudentLessonView";
import { toast } from "sonner";

interface Classroom {
  id: string;
  name: string;
  description: string;
  code: string;
  cover_image_url?: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  order_index: number;
  content: string;
  image_url?: string;
  video_url?: string;
  file_url?: string;
}

interface LessonCompletion {
  lesson_id: string;
  completed_at: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  passing_score: number;
  total_questions: number;
  xp_reward: number;
  due_date: string | null;
  max_attempts: number;
}

interface QuizAttempt {
  id: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  activity_type: string;
  xp_reward: number;
  content: any;
}

const StudentClassroom = () => {
  const { classroomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completions, setCompletions] = useState<LessonCompletion[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<Record<string, QuizAttempt[]>>({});
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingFile, setViewingFile] = useState<string | null>(null);

  useEffect(() => {
    if (classroomId && user) {
      fetchClassroomData();
    }
  }, [classroomId, user]);

  const fetchClassroomData = async () => {
    try {
      // Verify student is a member
      const { data: membership } = await supabase
        .from("classroom_members")
        .select("id")
        .eq("classroom_id", classroomId)
        .eq("student_id", user?.id)
        .single();

      if (!membership) {
        toast.error("You don't have access to this classroom");
        navigate("/student/dashboard");
        return;
      }

      // Fetch classroom details
      const { data: classData, error: classError } = await supabase
        .from("classrooms")
        .select("*")
        .eq("id", classroomId)
        .single();

      if (classError) throw classError;
      setClassroom(classData);

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("*")
        .eq("classroom_id", classroomId)
        .order("order_index", { ascending: true });

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

      // Fetch completions
      const { data: completionsData, error: completionsError } = await supabase
        .from("lesson_completions")
        .select("lesson_id, completed_at")
        .eq("classroom_id", classroomId)
        .eq("student_id", user?.id);

      if (completionsError) throw completionsError;
      setCompletions(completionsData || []);

      // Fetch quizzes
      const { data: quizzesData, error: quizzesError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("classroom_id", classroomId)
        .order("created_at", { ascending: false });

      if (quizzesError) throw quizzesError;
      setQuizzes(quizzesData || []);

      // Fetch quiz attempts for each quiz
      if (quizzesData && quizzesData.length > 0) {
        const { data: attemptsData } = await supabase
          .from("quiz_attempts")
          .select("*")
          .eq("student_id", user?.id)
          .in("quiz_id", quizzesData.map(q => q.id))
          .order("completed_at", { ascending: false });

        if (attemptsData) {
          const attemptsByQuiz = attemptsData.reduce((acc, attempt) => {
            if (!acc[attempt.quiz_id]) acc[attempt.quiz_id] = [];
            acc[attempt.quiz_id].push(attempt);
            return acc;
          }, {} as Record<string, QuizAttempt[]>);
          setQuizAttempts(attemptsByQuiz);
        }
      }

      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from("activities")
        .select("*")
        .eq("classroom_id", classroomId)
        .order("created_at", { ascending: false });

      if (activitiesError) throw activitiesError;
      setActivities(activitiesData || []);
    } catch (error) {
      console.error("Error fetching classroom data:", error);
      toast.error("Failed to load classroom");
    } finally {
      setLoading(false);
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return completions.some(c => c.lesson_id === lessonId);
  };

  const isLessonUnlocked = (lessonIndex: number) => {
    if (lessonIndex === 0) return true;
    const previousLesson = lessons[lessonIndex - 1];
    return previousLesson ? isLessonCompleted(previousLesson.id) : false;
  };

  const markLessonComplete = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from("lesson_completions")
        .insert({
          student_id: user?.id,
          lesson_id: lessonId,
          classroom_id: classroomId,
        });

      if (error) throw error;
      
      setCompletions([...completions, { lesson_id: lessonId, completed_at: new Date().toISOString() }]);
      toast.success("Lesson completed! 🎉");
    } catch (error) {
      console.error("Error marking lesson complete:", error);
      toast.error("Failed to mark lesson as complete");
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-lg">Loading classroom...</div>
        </div>
      </>
    );
  }

  if (!classroom) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Card className="glass-card p-8 text-center">
            <p className="text-lg">Classroom not found</p>
            <Button className="mt-4" onClick={() => navigate("/student/dashboard")}>
              Back to Dashboard
            </Button>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      
      {/* PDF Viewer Dialog */}
      <Dialog open={!!viewingFile} onOpenChange={() => setViewingFile(null)}>
        <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-0 bg-background">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-xl font-bold">Lesson File</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-4">
            {viewingFile && (
              <iframe
                src={viewingFile}
                className="w-full h-full rounded-lg border-2"
                title="Lesson File"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen p-8 pt-24">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Classroom Header */}
          <Card className="glass-card p-8 rounded-2xl">
            {classroom.cover_image_url && (
              <img
                src={classroom.cover_image_url}
                alt={classroom.name}
                className="w-full h-48 object-cover rounded-xl mb-6"
              />
            )}
            <h1 className="text-4xl font-bold gradient-text mb-2">{classroom.name}</h1>
            <p className="text-muted-foreground">{classroom.description}</p>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="lessons" className="w-full">
            <TabsList className="glass-card">
              <TabsTrigger value="lessons">
                <BookOpen className="h-4 w-4 mr-2" />
                Lessons
              </TabsTrigger>
              <TabsTrigger value="quizzes">
                <Award className="h-4 w-4 mr-2" />
                Quizzes
              </TabsTrigger>
              <TabsTrigger value="activities">
                <Gamepad2 className="h-4 w-4 mr-2" />
                Activities
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lessons" className="space-y-4">
              <StudentLessonView classroomId={classroomId!} studentId={user!.id} />
            </TabsContent>

            <TabsContent value="quizzes" className="space-y-4">
              {quizzes.length === 0 ? (
                <Card className="glass-card p-12 text-center">
                  <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">No quizzes available yet</p>
                </Card>
              ) : (
                quizzes.map((quiz) => {
                  const isDueSoon = quiz.due_date && new Date(quiz.due_date) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
                  const isOverdue = quiz.due_date && new Date(quiz.due_date) < new Date();
                  const attempts = quizAttempts[quiz.id] || [];
                  const passedAttempt = attempts.find(a => (a.score / a.total_questions) * 100 >= quiz.passing_score);
                  const canTakeQuiz = !passedAttempt && attempts.length < quiz.max_attempts;
                  const attemptsRemaining = quiz.max_attempts - attempts.length;
                  
                  return (
                    <Card key={quiz.id} className="glass-card p-6 rounded-2xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold mb-2">{quiz.title}</h3>
                          <p className="text-muted-foreground mb-4">{quiz.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Award className="h-4 w-4" />
                              {quiz.total_questions} Questions
                            </span>
                            <span className="flex items-center gap-1">
                              Passing: {quiz.passing_score}%
                            </span>
                            <span className="flex items-center gap-1">
                              XP: {quiz.xp_reward}
                            </span>
                            <span className="flex items-center gap-1">
                              Max Attempts: {quiz.max_attempts}
                            </span>
                            {quiz.due_date && (
                              <span className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : isDueSoon ? 'text-warning' : ''}`}>
                                Due: {new Date(quiz.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {passedAttempt && (
                            <div className="mt-4 p-3 bg-success/20 border border-success rounded-lg">
                              <p className="text-success font-semibold">
                                ✓ Passed with {((passedAttempt.score / passedAttempt.total_questions) * 100).toFixed(0)}%
                              </p>
                            </div>
                          )}

                          {!passedAttempt && attempts.length > 0 && (
                            <div className="mt-4 p-3 bg-muted rounded-lg">
                              <p className="text-sm">
                                Attempts: {attempts.length}/{quiz.max_attempts} | 
                                Best Score: {Math.max(...attempts.map(a => (a.score / a.total_questions) * 100)).toFixed(0)}%
                              </p>
                            </div>
                          )}

                          <Button 
                            onClick={() => navigate(`/student/classroom/${classroomId}/quiz/${quiz.id}`)}
                            className="mt-4"
                            disabled={!canTakeQuiz}
                          >
                            {passedAttempt 
                              ? "Already Passed" 
                              : attempts.length >= quiz.max_attempts 
                                ? "No Attempts Left" 
                                : attemptsRemaining === quiz.max_attempts
                                  ? "Start Quiz"
                                  : `Try Again (${attemptsRemaining} left)`
                            }
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="activities" className="space-y-4">
              {activities.length === 0 ? (
                <Card className="glass-card p-12 text-center">
                  <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">No activities available yet</p>
                </Card>
              ) : (
                activities.map((activity) => (
                  <Card key={activity.id} className="glass-card p-6 rounded-2xl">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-mono bg-primary/20 text-primary px-3 py-1 rounded-full capitalize">
                            {activity.activity_type}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{activity.title}</h3>
                        <p className="text-muted-foreground mb-4">{activity.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            Max Score: {activity.content?.max_score || 100}
                          </span>
                          <span className="flex items-center gap-1">
                            Passing: {activity.content?.passing_score || 60} points
                          </span>
                          <span className="flex items-center gap-1">
                            XP: {activity.xp_reward}
                          </span>
                        </div>
                        <Button 
                          className="mt-4"
                          onClick={() => navigate(`/student/classroom/${classroomId}/activity/${activity.id}`)}
                        >
                          Start Activity
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default StudentClassroom;
