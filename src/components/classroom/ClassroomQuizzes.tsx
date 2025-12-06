import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import CreateQuizDialog from "./CreateQuizDialog";
import ShareContentDialog from "./ShareContentDialog";
import { Loader2, Calendar, Pencil, Trash2, Lock, Unlock, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ClassroomQuizzesProps {
  classroomId: string;
}

const ClassroomQuizzes = ({ classroomId }: ClassroomQuizzesProps) => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchQuizzes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("quizzes")
      .select("*")
      .eq("classroom_id", classroomId)
      .order("created_at", { ascending: false });
    setQuizzes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchQuizzes();
  }, [classroomId]);

  const isQuizLocked = (quiz: any): boolean => {
    if (!quiz.is_locked) return false;
    if (!quiz.availability_start) return false;
    return new Date() < new Date(quiz.availability_start);
  };

  const isQuizExpired = (quiz: any): boolean => {
    if (!quiz.availability_end) return false;
    return new Date() > new Date(quiz.availability_end);
  };

  const handleDelete = async () => {
    if (!selectedQuiz) return;
    try {
      const { error } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", selectedQuiz.id);
      
      if (error) throw error;
      toast.success("Quiz deleted successfully");
      fetchQuizzes();
      setDeleteDialogOpen(false);
      setSelectedQuiz(null);
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz");
    }
  };

  const handleToggleLock = async (quiz: any) => {
    try {
      const { error } = await supabase
        .from("quizzes")
        .update({ is_locked: !quiz.is_locked })
        .eq("id", quiz.id);
      
      if (error) throw error;
      toast.success(`Quiz ${quiz.is_locked ? 'unlocked' : 'locked'} successfully`);
      fetchQuizzes();
    } catch (error) {
      console.error("Error toggling lock:", error);
      toast.error("Failed to toggle lock");
    }
  };

  return (
    <>
    <Card className="glass-card p-6 rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Quizzes</h2>
        <CreateQuizDialog classroomId={classroomId} onQuizCreated={fetchQuizzes} />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : quizzes.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No quizzes yet. Create your first quiz!</p>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => {
            const locked = isQuizLocked(quiz);
            const expired = isQuizExpired(quiz);
            
            return (
              <Card key={quiz.id} className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{quiz.title}</h3>
                      {locked && (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Locked
                        </Badge>
                      )}
                      {expired && (
                        <Badge variant="outline" className="gap-1">
                          Expired
                        </Badge>
                      )}
                      {quiz.visible_when_locked && locked && (
                        <Badge variant="outline" className="gap-1">
                          <Eye className="h-3 w-3" />
                          Visible
                        </Badge>
                      )}
                    </div>
                    {quiz.description && <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>}
                    <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                      <span>{quiz.total_questions} questions</span>
                      <span>Passing: {quiz.passing_score}%</span>
                      <span>XP: {quiz.xp_reward}</span>
                    </div>
                    {quiz.due_date && (
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {format(new Date(quiz.due_date), "PPp")}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={quiz.due_date && new Date(quiz.due_date) < new Date() ? "destructive" : "default"}>
                      {quiz.due_date && new Date(quiz.due_date) < new Date() ? "Overdue" : "Active"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleLock(quiz)}
                      className="gap-2"
                    >
                      {quiz.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedQuiz(quiz);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedQuiz(quiz);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ShareContentDialog
                      contentType="quiz"
                      contentId={quiz.id}
                      sourceClassroomId={classroomId}
                      contentTitle={quiz.title}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Card>

    {/* Edit Dialog */}
    {editDialogOpen && selectedQuiz && (
      <CreateQuizDialog
        classroomId={classroomId}
        onQuizCreated={fetchQuizzes}
        existingQuiz={selectedQuiz}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    )}

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{selectedQuiz?.title}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default ClassroomQuizzes;
