import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import CreateLessonDialog from "./CreateLessonDialog";
import ShareContentDialog from "./ShareContentDialog";
import { Loader2, FileText, Video, ExternalLink, Lock, Eye, Image as ImageIcon, Calendar, Pencil, Trash2, Unlock } from "lucide-react";
import { toast } from "sonner";

interface ClassroomLessonsProps {
  classroomId: string;
}

interface Topic {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  video_url?: string;
}

const ClassroomLessons = ({ classroomId }: ClassroomLessonsProps) => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchLessons = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("lessons")
      .select("*")
      .eq("classroom_id", classroomId)
      .order("order_index");
    setLessons(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLessons();
  }, [classroomId]);

  const parseTopics = (content: string | null): Topic[] => {
    if (!content) return [];
    try {
      const parsed = JSON.parse(content);
      return parsed.topics || [];
    } catch {
      return [];
    }
  };

  const isLessonLocked = (lesson: any): boolean => {
    if (!lesson.is_locked) return false;
    if (!lesson.availability_start) return false;
    const startDate = new Date(lesson.availability_start);
    return new Date() < startDate;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString();
  };

  const handleDelete = async () => {
    if (!selectedLesson) return;
    try {
      const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", selectedLesson.id);
      
      if (error) throw error;
      toast.success("Lesson deleted successfully");
      fetchLessons();
      setDeleteDialogOpen(false);
      setSelectedLesson(null);
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast.error("Failed to delete lesson");
    }
  };

  const handleToggleLock = async (lesson: any) => {
    try {
      const { error } = await supabase
        .from("lessons")
        .update({ is_locked: !lesson.is_locked })
        .eq("id", lesson.id);
      
      if (error) throw error;
      toast.success(`Lesson ${lesson.is_locked ? 'unlocked' : 'locked'} successfully`);
      fetchLessons();
    } catch (error) {
      console.error("Error toggling lock:", error);
      toast.error("Failed to toggle lock");
    }
  };

  return (
    <>
      <Card className="glass-card p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Lessons</h2>
          <CreateLessonDialog classroomId={classroomId} onLessonCreated={fetchLessons} />
        </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : lessons.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No lessons yet. Create your first lesson!</p>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => {
            const topics = parseTopics(lesson.content);
            const locked = isLessonLocked(lesson);

            return (
              <Card key={lesson.id} className="p-6 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-xl">{lesson.title}</h3>
                      {locked && (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Locked
                        </Badge>
                      )}
                      {lesson.visible_when_locked && locked && (
                        <Badge variant="outline" className="gap-1">
                          <Eye className="h-3 w-3" />
                          Visible
                        </Badge>
                      )}
                    </div>
                    {lesson.description && (
                      <p className="text-sm text-muted-foreground mb-3">{lesson.description}</p>
                    )}

                    {/* Lock Info */}
                    {(lesson.availability_start || lesson.availability_end) && (
                      <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
                        {lesson.availability_start && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Available from: {formatDate(lesson.availability_start)}
                          </div>
                        )}
                        {lesson.availability_end && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Until: {formatDate(lesson.availability_end)}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Main Lesson Actions */}
                    <div className="flex flex-wrap gap-2">
                      {lesson.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(lesson.file_url, '_blank')}
                        >
                          <FileText className="h-4 w-4" />
                          View File
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                      {lesson.video_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(lesson.video_url, '_blank')}
                        >
                          <Video className="h-4 w-4" />
                          Watch Video
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleLock(lesson)}
                      className="gap-2"
                    >
                      {lesson.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      {lesson.is_locked ? 'Unlock' : 'Lock'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLesson(lesson);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLesson(lesson);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ShareContentDialog
                      contentType="lesson"
                      contentId={lesson.id}
                      sourceClassroomId={classroomId}
                      contentTitle={lesson.title}
                    />
                  </div>
                </div>

                {/* Topics Section */}
                {topics.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Lesson Topics ({topics.length})
                    </h4>
                    <Accordion type="single" collapsible className="space-y-2">
                      {topics.map((topic, index) => (
                        <AccordionItem 
                          key={topic.id} 
                          value={topic.id}
                          className="border rounded-lg px-4"
                        >
                          <AccordionTrigger className="hover:no-underline">
                            <span className="font-medium">
                              {index + 1}. {topic.title || `Topic ${index + 1}`}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-4 pt-4">
                            {topic.content && (
                              <div className="prose prose-sm max-w-none">
                                <p className="text-foreground whitespace-pre-wrap">{topic.content}</p>
                              </div>
                            )}

                            {/* Topic Image */}
                            {topic.image_url && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <ImageIcon className="h-4 w-4" />
                                  Topic Image
                                </div>
                                <img 
                                  src={topic.image_url} 
                                  alt={topic.title}
                                  className="rounded-lg max-w-full h-auto max-h-96 object-contain border"
                                />
                              </div>
                            )}

                            {/* Topic Video */}
                            {topic.video_url && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <Video className="h-4 w-4" />
                                  Topic Video
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => window.open(topic.video_url, '_blank')}
                                >
                                  <Video className="h-4 w-4" />
                                  Watch Video
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      </Card>

      {/* Edit Dialog */}
      {editDialogOpen && selectedLesson && (
        <CreateLessonDialog
          classroomId={classroomId}
          onLessonCreated={fetchLessons}
          existingLesson={selectedLesson}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedLesson?.title}"? This action cannot be undone.
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

export default ClassroomLessons;