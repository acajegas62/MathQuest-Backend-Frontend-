import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Share2, Loader2, Check, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ShareContentDialogProps {
  contentType: "lesson" | "activity" | "quiz";
  contentId: string;
  sourceClassroomId: string;
  contentTitle: string;
}

const ShareContentDialog = ({ contentType, contentId, sourceClassroomId, contentTitle }: ShareContentDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassrooms, setSelectedClassrooms] = useState<Set<string>>(new Set());
  const [duplicateClassrooms, setDuplicateClassrooms] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchClassrooms();
    }
  }, [open, user]);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("classrooms")
        .select("*")
        .eq("teacher_id", user?.id)
        .neq("id", sourceClassroomId)
        .order("name");
      
      setClassrooms(data || []);

      // Check for duplicates in each classroom
      if (data && data.length > 0) {
        await checkForDuplicates(data);
      }
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      toast.error("Failed to load classrooms");
    } finally {
      setLoading(false);
    }
  };

  const checkForDuplicates = async (classroomsToCheck: any[]) => {
    try {
      const duplicates = new Set<string>();
      
      for (const classroom of classroomsToCheck) {
        const tableName = contentType === "lesson" ? "lessons" : contentType === "activity" ? "activities" : "quizzes";
        const { data } = await supabase
          .from(tableName)
          .select("id, title")
          .eq("classroom_id", classroom.id)
          .eq("title", contentTitle)
          .limit(1);

        if (data && data.length > 0) {
          duplicates.add(classroom.id);
        }
      }

      setDuplicateClassrooms(duplicates);
    } catch (error) {
      console.error("Error checking for duplicates:", error);
    }
  };

  const toggleClassroom = (classroomId: string) => {
    const newSelected = new Set(selectedClassrooms);
    if (newSelected.has(classroomId)) {
      newSelected.delete(classroomId);
    } else {
      newSelected.add(classroomId);
    }
    setSelectedClassrooms(newSelected);
  };

  const handleShare = async () => {
    if (selectedClassrooms.size === 0) {
      toast.error("Please select at least one classroom");
      return;
    }

    // Check if any selected classroom has duplicates
    const hasDuplicates = Array.from(selectedClassrooms).some(id => duplicateClassrooms.has(id));
    if (hasDuplicates) {
      setShowConfirmDialog(true);
      return;
    }

    await proceedWithSharing();
  };

  const proceedWithSharing = async () => {
    setShowConfirmDialog(false);

    setLoading(true);
    try {
      // Mark content as shared and get the shared_content record
      const { data: sharedContentRecord } = await supabase.from("shared_content").insert({
        content_type: contentType,
        content_id: contentId,
        source_classroom_id: sourceClassroomId,
        shared_by: user?.id,
      }).select().single();

      if (!sharedContentRecord) {
        throw new Error("Failed to create shared content record");
      }

      // Copy content to selected classrooms
      for (const classroomId of selectedClassrooms) {
        if (contentType === "lesson") {
          const { data: lesson } = await supabase
            .from("lessons")
            .select("*")
            .eq("id", contentId)
            .single();

          if (lesson) {
            await supabase.from("lessons").insert({
              classroom_id: classroomId,
              title: lesson.title,
              description: lesson.description,
              content: lesson.content,
              video_url: lesson.video_url,
              file_url: lesson.file_url,
              order_index: lesson.order_index,
            });
          }
        } else if (contentType === "activity") {
          const { data: activity } = await supabase
            .from("activities")
            .select("*")
            .eq("id", contentId)
            .single();

          if (activity) {
            await supabase.from("activities").insert({
              classroom_id: classroomId,
              title: activity.title,
              description: activity.description,
              activity_type: activity.activity_type,
              content: activity.content,
              xp_reward: activity.xp_reward,
              image_url: activity.image_url,
            });
          }
        } else if (contentType === "quiz") {
          const { data: quiz } = await supabase
            .from("quizzes")
            .select("*, quiz_questions(*)")
            .eq("id", contentId)
            .single();

          if (quiz) {
            const { data: newQuiz } = await supabase
              .from("quizzes")
              .insert({
                classroom_id: classroomId,
                title: quiz.title,
                description: quiz.description,
                passing_score: quiz.passing_score,
                xp_reward: quiz.xp_reward,
                total_questions: quiz.total_questions,
                due_date: quiz.due_date,
              })
              .select()
              .single();

            if (newQuiz && quiz.quiz_questions) {
              const questions = quiz.quiz_questions.map((q: any) => ({
                quiz_id: newQuiz.id,
                question_text: q.question_text,
                options: q.options,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                order_index: q.order_index,
              }));

              await supabase.from("quiz_questions").insert(questions);
            }
          }
        }
      }

      // Record destinations
      const destinations = Array.from(selectedClassrooms).map(classroomId => ({
        shared_content_id: sharedContentRecord.id,
        destination_classroom_id: classroomId,
      }));
      
      await supabase.from("shared_content_destinations").insert(destinations);

      // Create notifications for students in destination classrooms
      for (const destClassroomId of selectedClassrooms) {
        // Get all students in this classroom
        const { data: members } = await supabase
          .from("classroom_members")
          .select("student_id")
          .eq("classroom_id", destClassroomId);

        if (members && members.length > 0) {
          // Get classroom name
          const classroom = classrooms.find(c => c.id === destClassroomId);
          
          // Create notifications for all students
          const notifications = members.map((member) => ({
            user_id: member.student_id,
            title: "New Content Shared",
            message: `A new ${contentType} "${contentTitle}" has been shared to ${classroom?.name}`,
            type: "content_shared",
            link: `/student-classroom/${destClassroomId}`,
          }));

          await supabase.from("notifications").insert(notifications);
        }
      }

      toast.success(`${contentTitle} shared to ${selectedClassrooms.size} classroom(s)!`);
      setSelectedClassrooms(new Set());
      setOpen(false);
    } catch (error) {
      console.error("Error sharing content:", error);
      toast.error("Failed to share content");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share "{contentTitle}"</DialogTitle>
        </DialogHeader>

        {loading && classrooms.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : classrooms.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No other classrooms available to share with.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-4">
                Select classrooms to share this {contentType} with:
              </p>
              {classrooms.map((classroom) => (
                <div
                  key={classroom.id}
                  onClick={() => toggleClassroom(classroom.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                    duplicateClassrooms.has(classroom.id) ? "border-warning/50 bg-warning/5" : ""
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedClassrooms.has(classroom.id)
                        ? "bg-primary border-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {selectedClassrooms.has(classroom.id) && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{classroom.name}</p>
                      {duplicateClassrooms.has(classroom.id) && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                    {duplicateClassrooms.has(classroom.id) && (
                      <p className="text-xs text-warning">Already has this {contentType}</p>
                    )}
                    {classroom.description && !duplicateClassrooms.has(classroom.id) && (
                      <p className="text-xs text-muted-foreground">{classroom.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleShare} disabled={loading || selectedClassrooms.size === 0}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share to {selectedClassrooms.size} classroom(s)
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Content Already Exists
            </AlertDialogTitle>
            <AlertDialogDescription>
              One or more selected classrooms already have a {contentType} with the title "{contentTitle}". 
              Proceeding will create a duplicate. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={proceedWithSharing} className="bg-warning hover:bg-warning/90">
              Proceed Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default ShareContentDialog;
