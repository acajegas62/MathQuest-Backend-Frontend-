import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Loader2, Upload, X, Image as ImageIcon, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateLessonDialogProps {
  classroomId: string;
  onLessonCreated: () => void;
  existingLesson?: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface Topic {
  id: string;
  title: string;
  content: string;
  image_url: string;
  video_url: string;
  imageFile?: File;
}

const CreateLessonDialog = ({ classroomId, onLessonCreated, existingLesson, open: controlledOpen, onOpenChange: controlledOnOpenChange }: CreateLessonDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_url: "",
    order_index: 0,
    file_url: "",
    availability_start: "",
    availability_end: "",
    is_locked: false,
    visible_when_locked: true,
  });
  const [topics, setTopics] = useState<Topic[]>([
    { id: "1", title: "", content: "", image_url: "", video_url: "" }
  ]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF and Word documents are allowed");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleTopicImageChange = (topicId: string, file: File | null) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only image files are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setTopics(topics.map(topic => 
      topic.id === topicId ? { ...topic, imageFile: file } : topic
    ));
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
      return null;
    }
  };

  const addTopic = () => {
    setTopics([...topics, { 
      id: Date.now().toString(), 
      title: "", 
      content: "", 
      image_url: "", 
      video_url: "" 
    }]);
  };

  const removeTopic = (topicId: string) => {
    if (topics.length > 1) {
      setTopics(topics.filter(topic => topic.id !== topicId));
    }
  };

  const updateTopic = (topicId: string, field: keyof Topic, value: string) => {
    setTopics(topics.map(topic => 
      topic.id === topicId ? { ...topic, [field]: value } : topic
    ));
  };

  // Initialize form with existing lesson data if editing
  useEffect(() => {
    if (existingLesson) {
      setFormData({
        title: existingLesson.title || "",
        description: existingLesson.description || "",
        video_url: existingLesson.video_url || "",
        order_index: existingLesson.order_index || 0,
        file_url: existingLesson.file_url || "",
        availability_start: existingLesson.availability_start ? existingLesson.availability_start.slice(0, 16) : "",
        availability_end: existingLesson.availability_end ? existingLesson.availability_end.slice(0, 16) : "",
        is_locked: existingLesson.is_locked || false,
        visible_when_locked: existingLesson.visible_when_locked !== undefined ? existingLesson.visible_when_locked : true,
      });

      // Parse existing topics
      if (existingLesson.content) {
        try {
          const parsed = JSON.parse(existingLesson.content);
          if (parsed.topics && parsed.topics.length > 0) {
            setTopics(parsed.topics);
          }
        } catch (e) {
          console.error("Error parsing lesson content:", e);
        }
      }
    }
  }, [existingLesson]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Please enter a lesson title");
      return;
    }

    setLoading(true);
    try {
      let fileUrl = formData.file_url;
      
      // Upload lesson file if selected
      if (selectedFile) {
        const uploadedUrl = await uploadFile(selectedFile, 'lesson-files', classroomId);
        if (uploadedUrl) {
          fileUrl = uploadedUrl;
        }
      }

      // Upload topic images
      const uploadedTopics = await Promise.all(
        topics.map(async (topic) => {
          let imageUrl = topic.image_url;
          if (topic.imageFile) {
            const uploadedImageUrl = await uploadFile(
              topic.imageFile, 
              'lesson-images', 
              classroomId
            );
            if (uploadedImageUrl) {
              imageUrl = uploadedImageUrl;
            }
          }
          // Remove imageFile before storing
          const { imageFile, ...topicData } = topic;
          return { ...topicData, image_url: imageUrl };
        })
      );

      // Store topics as JSON in content field
      const contentJson = JSON.stringify({ topics: uploadedTopics });

      const lessonData = {
        classroom_id: classroomId,
        title: formData.title,
        description: formData.description,
        content: contentJson,
        video_url: formData.video_url,
        order_index: formData.order_index,
        file_url: fileUrl,
        availability_start: formData.availability_start || null,
        availability_end: formData.availability_end || null,
        is_locked: formData.is_locked,
        visible_when_locked: formData.visible_when_locked,
      };

      let error;
      if (existingLesson) {
        // Update existing lesson
        const result = await supabase
          .from("lessons")
          .update(lessonData)
          .eq("id", existingLesson.id);
        error = result.error;
      } else {
        // Create new lesson
        const result = await supabase
          .from("lessons")
          .insert(lessonData);
        error = result.error;
      }

      if (error) throw error;

      // Only notify students if it's a new lesson
      if (!existingLesson) {
        const { data: members } = await supabase
          .from("classroom_members")
          .select("student_id")
          .eq("classroom_id", classroomId);

        if (members && members.length > 0) {
          const notifications = members.map(member => ({
            user_id: member.student_id,
            title: "New Lesson Available",
            message: `A new lesson "${formData.title}" has been added to your classroom`,
            type: "lesson",
            link: `/student/classroom/${classroomId}`,
          }));

          await supabase.from("notifications").insert(notifications);
        }
      }

      toast.success(existingLesson ? "Lesson updated successfully!" : "Lesson created successfully!");
      setFormData({ 
        title: "", 
        description: "", 
        video_url: "", 
        order_index: 0, 
        file_url: "",
        availability_start: "",
        availability_end: "",
        is_locked: false,
        visible_when_locked: true,
      });
      setTopics([{ id: "1", title: "", content: "", image_url: "", video_url: "" }]);
      setSelectedFile(null);
      setOpen(false);
      onLessonCreated();
    } catch (error) {
      console.error("Error creating lesson:", error);
      toast.error("Failed to create lesson");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!existingLesson && (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Lesson
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingLesson ? "Edit Lesson" : "Create New Lesson"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Lesson Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter lesson title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the lesson"
                rows={3}
              />
            </div>
          </div>

          {/* Topics Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Lesson Topics</Label>
              <Button type="button" onClick={addTopic} size="sm" variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Topic
              </Button>
            </div>

            <Accordion type="single" collapsible className="space-y-2">
              {topics.map((topic, index) => (
                <AccordionItem key={topic.id} value={topic.id} className="border rounded-lg px-4">
                  <div className="flex items-center justify-between">
                    <AccordionTrigger className="flex-1 hover:no-underline">
                      <span className="font-medium">
                        {topic.title || `Topic ${index + 1}`}
                      </span>
                    </AccordionTrigger>
                    {topics.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTopic(topic.id);
                        }}
                        className="ml-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Topic Title</Label>
                      <Input
                        value={topic.title}
                        onChange={(e) => updateTopic(topic.id, 'title', e.target.value)}
                        placeholder="Enter topic title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Content</Label>
                      <Textarea
                        value={topic.content}
                        onChange={(e) => updateTopic(topic.id, 'content', e.target.value)}
                        placeholder="Topic content and description"
                        rows={4}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Topic Image (optional)
                        </Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleTopicImageChange(topic.id, e.target.files?.[0] || null)}
                          className="cursor-pointer"
                        />
                        {topic.imageFile && (
                          <p className="text-xs text-muted-foreground">
                            Selected: {topic.imageFile.name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Video URL (optional)
                        </Label>
                        <Input
                          type="url"
                          value={topic.video_url}
                          onChange={(e) => updateTopic(topic.id, 'video_url', e.target.value)}
                          placeholder="https://youtube.com/..."
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Additional Settings */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Additional Settings</h3>
            
            <div className="space-y-2">
              <Label htmlFor="video_url">Main Video URL (optional)</Label>
              <Input
                id="video_url"
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://youtube.com/..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order_index">Order (Position in list)</Label>
                <Input
                  id="order_index"
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Lesson File (PDF or Word)</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Lock Controls */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">🔒 Lock Controls</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availability_start">⏰ Availability Start Date & Time</Label>
                <Input
                  id="availability_start"
                  type="datetime-local"
                  value={formData.availability_start}
                  onChange={(e) => setFormData({ ...formData, availability_start: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  When the lesson becomes accessible
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability_end">⛔ Availability End Date & Time (optional)</Label>
                <Input
                  id="availability_end"
                  type="datetime-local"
                  value={formData.availability_end}
                  onChange={(e) => setFormData({ ...formData, availability_end: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  When access expires (leave empty for no expiration)
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border">
              <div className="space-y-0.5">
                <Label htmlFor="is_locked" className="font-medium">Lock Status</Label>
                <p className="text-xs text-muted-foreground">
                  If enabled, lesson is locked until the start date
                </p>
              </div>
              <Switch
                id="is_locked"
                checked={formData.is_locked}
                onCheckedChange={(checked) => setFormData({ ...formData, is_locked: checked })}
              />
            </div>

            <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border">
              <div className="space-y-0.5">
                <Label htmlFor="visible_when_locked" className="font-medium">👁️ Visible but Locked</Label>
                <p className="text-xs text-muted-foreground">
                  Show the lesson as "Locked" instead of hiding it completely
                </p>
              </div>
              <Switch
                id="visible_when_locked"
                checked={formData.visible_when_locked}
                onCheckedChange={(checked) => setFormData({ ...formData, visible_when_locked: checked })}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Lesson"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLessonDialog;