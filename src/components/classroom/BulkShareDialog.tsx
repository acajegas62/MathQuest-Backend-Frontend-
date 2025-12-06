import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Share2, Loader2, Check, AlertTriangle, BookOpen, ClipboardList, FileQuestion } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface BulkShareDialogProps {
  classroomId: string;
  onShared?: () => void;
}

interface ContentItem {
  id: string;
  title: string;
  type: "lesson" | "activity" | "quiz";
  description?: string;
}

const BulkShareDialog = ({ classroomId, onShared }: BulkShareDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassrooms, setSelectedClassrooms] = useState<Set<string>>(new Set());
  const [selectedContent, setSelectedContent] = useState<Set<string>>(new Set());
  const [lessons, setLessons] = useState<ContentItem[]>([]);
  const [activities, setActivities] = useState<ContentItem[]>([]);
  const [quizzes, setQuizzes] = useState<ContentItem[]>([]);
  const [duplicateWarnings, setDuplicateWarnings] = useState<Map<string, Set<string>>>(new Map());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchContent();
      fetchClassrooms();
    }
  }, [open, user]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const [lessonsData, activitiesData, quizzesData] = await Promise.all([
        supabase.from("lessons").select("id, title, description").eq("classroom_id", classroomId).order("title"),
        supabase.from("activities").select("id, title, description").eq("classroom_id", classroomId).order("title"),
        supabase.from("quizzes").select("id, title, description").eq("classroom_id", classroomId).order("title"),
      ]);

      setLessons(lessonsData.data?.map(l => ({ ...l, type: "lesson" as const })) || []);
      setActivities(activitiesData.data?.map(a => ({ ...a, type: "activity" as const })) || []);
      setQuizzes(quizzesData.data?.map(q => ({ ...q, type: "quiz" as const })) || []);
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassrooms = async () => {
    try {
      const { data } = await supabase
        .from("classrooms")
        .select("*")
        .eq("teacher_id", user?.id)
        .neq("id", classroomId)
        .order("name");
      
      setClassrooms(data || []);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      toast.error("Failed to load classrooms");
    }
  };

  const toggleClassroom = (id: string) => {
    const newSelected = new Set(selectedClassrooms);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedClassrooms(newSelected);
  };

  const toggleContent = (id: string) => {
    const newSelected = new Set(selectedContent);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedContent(newSelected);
  };

  const checkForDuplicates = async () => {
    const warnings = new Map<string, Set<string>>();

    for (const classroomId of selectedClassrooms) {
      for (const contentId of selectedContent) {
        const allContent = [...lessons, ...activities, ...quizzes];
        const content = allContent.find(c => c.id === contentId);
        
        if (content) {
          const tableName = content.type === "lesson" ? "lessons" : content.type === "activity" ? "activities" : "quizzes";
          const { data } = await supabase
            .from(tableName)
            .select("id")
            .eq("classroom_id", classroomId)
            .eq("title", content.title)
            .limit(1);

          if (data && data.length > 0) {
            if (!warnings.has(contentId)) {
              warnings.set(contentId, new Set());
            }
            warnings.get(contentId)!.add(classroomId);
          }
        }
      }
    }

    return warnings;
  };

  const handleShare = async () => {
    if (selectedClassrooms.size === 0) {
      toast.error("Please select at least one classroom");
      return;
    }

    if (selectedContent.size === 0) {
      toast.error("Please select at least one item to share");
      return;
    }

    setLoading(true);
    const warnings = await checkForDuplicates();
    setLoading(false);

    if (warnings.size > 0) {
      setDuplicateWarnings(warnings);
      setShowConfirmDialog(true);
      return;
    }

    await proceedWithSharing();
  };

  const proceedWithSharing = async () => {
    setShowConfirmDialog(false);
    setLoading(true);

    try {
      const allContent = [...lessons, ...activities, ...quizzes];
      
      for (const contentId of selectedContent) {
        const content = allContent.find(c => c.id === contentId);
        if (!content) continue;

        // Create shared content record
        const { data: sharedRecord } = await supabase
          .from("shared_content")
          .insert({
            content_type: content.type,
            content_id: contentId,
            source_classroom_id: classroomId,
            shared_by: user?.id,
          })
          .select()
          .single();

        if (!sharedRecord) continue;

        // Copy to each selected classroom
        for (const targetClassroomId of selectedClassrooms) {
          if (content.type === "lesson") {
            const { data: lesson } = await supabase
              .from("lessons")
              .select("*")
              .eq("id", contentId)
              .single();

            if (lesson) {
              await supabase.from("lessons").insert({
                classroom_id: targetClassroomId,
                title: lesson.title,
                description: lesson.description,
                content: lesson.content,
                video_url: lesson.video_url,
                file_url: lesson.file_url,
                order_index: lesson.order_index,
              });
            }
          } else if (content.type === "activity") {
            const { data: activity } = await supabase
              .from("activities")
              .select("*")
              .eq("id", contentId)
              .single();

            if (activity) {
              await supabase.from("activities").insert({
                classroom_id: targetClassroomId,
                title: activity.title,
                description: activity.description,
                activity_type: activity.activity_type,
                content: activity.content,
                xp_reward: activity.xp_reward,
                image_url: activity.image_url,
              });
            }
          } else if (content.type === "quiz") {
            const { data: quiz } = await supabase
              .from("quizzes")
              .select("*, quiz_questions(*)")
              .eq("id", contentId)
              .single();

            if (quiz) {
              const { data: newQuiz } = await supabase
                .from("quizzes")
                .insert({
                  classroom_id: targetClassroomId,
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
        const destinations = Array.from(selectedClassrooms).map(targetId => ({
          shared_content_id: sharedRecord.id,
          destination_classroom_id: targetId,
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
              message: `A new ${content.type} "${content.title}" has been shared to ${classroom?.name}`,
              type: "content_shared",
              link: `/student-classroom/${destClassroomId}`,
            }));

            await supabase.from("notifications").insert(notifications);
          }
        }
      }

      toast.success(`Shared ${selectedContent.size} item(s) to ${selectedClassrooms.size} classroom(s)!`);
      setSelectedClassrooms(new Set());
      setSelectedContent(new Set());
      setOpen(false);
      onShared?.();
    } catch (error) {
      console.error("Error sharing content:", error);
      toast.error("Failed to share content");
    } finally {
      setLoading(false);
    }
  };

  const renderContentList = (items: ContentItem[], icon: React.ReactNode) => (
    <ScrollArea className="h-[200px] border rounded-lg p-4">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No items available</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleContent(item.id)}
              className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  selectedContent.has(item.id)
                    ? "bg-primary border-primary"
                    : "border-muted-foreground"
                }`}
              >
                {selectedContent.has(item.id) && (
                  <Check className="h-3 w-3 text-primary-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {icon}
                  <p className="font-medium truncate">{item.title}</p>
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Share2 className="h-4 w-4" />
          Bulk Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Share Content</DialogTitle>
        </DialogHeader>

        {loading && lessons.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Content Selection */}
            <div>
              <h3 className="font-semibold mb-3">Select Content to Share</h3>
              <Tabs defaultValue="lessons" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="lessons">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Lessons ({lessons.length})
                  </TabsTrigger>
                  <TabsTrigger value="activities">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Activities ({activities.length})
                  </TabsTrigger>
                  <TabsTrigger value="quizzes">
                    <FileQuestion className="h-4 w-4 mr-2" />
                    Quizzes ({quizzes.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="lessons">
                  {renderContentList(lessons, <BookOpen className="h-4 w-4 text-blue-500" />)}
                </TabsContent>
                <TabsContent value="activities">
                  {renderContentList(activities, <ClipboardList className="h-4 w-4 text-green-500" />)}
                </TabsContent>
                <TabsContent value="quizzes">
                  {renderContentList(quizzes, <FileQuestion className="h-4 w-4 text-purple-500" />)}
                </TabsContent>
              </Tabs>
              {selectedContent.size > 0 && (
                <Badge variant="secondary" className="mt-2">
                  {selectedContent.size} item(s) selected
                </Badge>
              )}
            </div>

            {/* Classroom Selection */}
            <div>
              <h3 className="font-semibold mb-3">Select Destination Classrooms</h3>
              {classrooms.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 border rounded-lg">
                  No other classrooms available
                </p>
              ) : (
                <ScrollArea className="h-[200px] border rounded-lg p-4">
                  <div className="space-y-2">
                    {classrooms.map((classroom) => (
                      <div
                        key={classroom.id}
                        onClick={() => toggleClassroom(classroom.id)}
                        className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
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
                          <p className="font-medium">{classroom.name}</p>
                          {classroom.description && (
                            <p className="text-xs text-muted-foreground">{classroom.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              {selectedClassrooms.size > 0 && (
                <Badge variant="secondary" className="mt-2">
                  {selectedClassrooms.size} classroom(s) selected
                </Badge>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleShare} 
                disabled={loading || selectedClassrooms.size === 0 || selectedContent.size === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share {selectedContent.size} item(s) to {selectedClassrooms.size} classroom(s)
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Duplicate Content Detected
            </AlertDialogTitle>
            <AlertDialogDescription>
              Some of the selected items already exist in one or more destination classrooms with the same title. 
              Proceeding will create duplicates. Do you want to continue?
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

export default BulkShareDialog;
