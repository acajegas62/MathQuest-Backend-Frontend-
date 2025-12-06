import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Video, ExternalLink, Lock, Eye, Image as ImageIcon, Calendar, CheckCircle2 } from "lucide-react";

interface StudentLessonViewProps {
  classroomId: string;
  studentId: string;
}

interface Topic {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  video_url?: string;
}

const StudentLessonView = ({ classroomId, studentId }: StudentLessonViewProps) => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [completions, setCompletions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLessons = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("lessons")
      .select("*")
      .eq("classroom_id", classroomId)
      .order("order_index");
    
    const { data: completionsData } = await supabase
      .from("lesson_completions")
      .select("lesson_id")
      .eq("classroom_id", classroomId)
      .eq("student_id", studentId);

    setLessons(data || []);
    setCompletions(completionsData?.map(c => c.lesson_id) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLessons();
  }, [classroomId, studentId]);

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

  const isLessonExpired = (lesson: any): boolean => {
    if (!lesson.availability_end) return false;
    return new Date() > new Date(lesson.availability_end);
  };

  const shouldHideLesson = (lesson: any): boolean => {
    const locked = isLessonLocked(lesson);
    return locked && !lesson.visible_when_locked;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString();
  };

  const markComplete = async (lessonId: string) => {
    try {
      await supabase.from("lesson_completions").insert({
        lesson_id: lessonId,
        classroom_id: classroomId,
        student_id: studentId,
      });
      setCompletions([...completions, lessonId]);
    } catch (error) {
      console.error("Error marking lesson complete:", error);
    }
  };

  const visibleLessons = lessons.filter(lesson => !shouldHideLesson(lesson));

  return (
    <Card className="glass-card p-6 rounded-2xl">
      <h2 className="text-2xl font-bold mb-6">Lessons</h2>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : visibleLessons.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No lessons available yet.</p>
      ) : (
        <div className="space-y-4">
          {visibleLessons.map((lesson) => {
            const topics = parseTopics(lesson.content);
            const locked = isLessonLocked(lesson);
            const expired = isLessonExpired(lesson);
            const completed = completions.includes(lesson.id);

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
                      {expired && (
                        <Badge variant="outline" className="gap-1">
                          Expired
                        </Badge>
                      )}
                      {completed && (
                        <Badge variant="default" className="gap-1 bg-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    {lesson.description && (
                      <p className="text-sm text-muted-foreground mb-3">{lesson.description}</p>
                    )}

                    {/* Availability Info */}
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
                    
                    {!locked && (
                      <>
                        {/* Main Lesson Actions */}
                        <div className="flex flex-wrap gap-2 mb-3">
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
                          {!completed && (
                            <Button
                              variant="default"
                              size="sm"
                              className="gap-2"
                              onClick={() => markComplete(lesson.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Mark as Complete
                            </Button>
                          )}
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
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default StudentLessonView;
