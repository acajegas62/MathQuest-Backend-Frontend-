import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateQuizDialogProps {
  classroomId: string;
  onQuizCreated: () => void;
  existingQuiz?: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface Question {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  points: number;
}

const CreateQuizDialog = ({ classroomId, onQuizCreated, existingQuiz, open: controlledOpen, onOpenChange: controlledOnOpenChange }: CreateQuizDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    passing_percentage: 70,
    xp_reward: 50,
    due_date: "",
    due_time: "",
    max_attempts: 5,
    availability_start: "",
    availability_end: "",
    is_locked: false,
    visible_when_locked: true,
  });
  const [questions, setQuestions] = useState<Question[]>([
    { question_text: "", options: ["", "", "", ""], correct_answer: "", explanation: "", points: 1 }
  ]);

  const addQuestion = () => {
    setQuestions([...questions, { question_text: "", options: ["", "", "", ""], correct_answer: "", explanation: "", points: 1 }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const getTotalPoints = () => questions.reduce((sum, q) => sum + q.points, 0);

  // Initialize form with existing quiz data if editing
  useEffect(() => {
    if (existingQuiz) {
      // Parse due date/time
      let dueDate = "";
      let dueTime = "";
      if (existingQuiz.due_date) {
        const date = new Date(existingQuiz.due_date);
        dueDate = date.toISOString().split('T')[0];
        dueTime = date.toTimeString().slice(0, 5);
      }

      setFormData({
        title: existingQuiz.title || "",
        description: existingQuiz.description || "",
        passing_percentage: existingQuiz.passing_score || 70,
        xp_reward: existingQuiz.xp_reward || 50,
        due_date: dueDate,
        due_time: dueTime,
        max_attempts: existingQuiz.max_attempts || 5,
        availability_start: existingQuiz.availability_start ? existingQuiz.availability_start.slice(0, 16) : "",
        availability_end: existingQuiz.availability_end ? existingQuiz.availability_end.slice(0, 16) : "",
        is_locked: existingQuiz.is_locked || false,
        visible_when_locked: existingQuiz.visible_when_locked !== undefined ? existingQuiz.visible_when_locked : true,
      });

      // Load existing questions if editing
      if (existingQuiz.id) {
        supabase
          .from("quiz_questions")
          .select("*")
          .eq("quiz_id", existingQuiz.id)
          .order("order_index")
          .then(({ data }) => {
            if (data && data.length > 0) {
              setQuestions(data.map(q => ({
                question_text: q.question_text,
                options: Array.isArray(q.options) ? q.options as string[] : ["", "", "", ""],
                correct_answer: q.correct_answer,
                explanation: q.explanation || "",
                points: 1,
              })));
            }
          });
      }
    }
  }, [existingQuiz]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }

    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    const invalidQuestions = questions.filter(q => 
      !q.question_text.trim() || 
      q.options.some(o => !o.trim()) || 
      !q.correct_answer.trim()
    );

    if (invalidQuestions.length > 0) {
      toast.error("Please complete all questions and their options");
      return;
    }

    setLoading(true);
    try {
      // Combine date and time if provided
      let dueDate = null;
      if (formData.due_date) {
        const dateTimeString = formData.due_time 
          ? `${formData.due_date}T${formData.due_time}`
          : `${formData.due_date}T23:59`;
        dueDate = new Date(dateTimeString).toISOString();
      }

      const totalPoints = getTotalPoints();
      
      const quizData = {
        classroom_id: classroomId,
        title: formData.title,
        description: formData.description,
        passing_score: formData.passing_percentage,
        total_questions: questions.length,
        xp_reward: formData.xp_reward,
        due_date: dueDate,
        max_attempts: formData.max_attempts,
        availability_start: formData.availability_start || null,
        availability_end: formData.availability_end || null,
        is_locked: formData.is_locked,
        visible_when_locked: formData.visible_when_locked,
      };

      let quizId = existingQuiz?.id;

      if (existingQuiz) {
        // Update existing quiz
        const { error: quizError } = await supabase
          .from("quizzes")
          .update(quizData)
          .eq("id", existingQuiz.id);

        if (quizError) throw quizError;

        // Delete old questions
        await supabase
          .from("quiz_questions")
          .delete()
          .eq("quiz_id", existingQuiz.id);
      } else {
        // Create new quiz
        const { data: quiz, error: quizError } = await supabase
          .from("quizzes")
          .insert(quizData)
          .select()
          .single();

        if (quizError) throw quizError;
        quizId = quiz.id;
      }

      // Create questions
      const questionsData = questions.map((q, index) => ({
        quiz_id: quizId,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        order_index: index,
      }));

      const { error: questionsError } = await supabase
        .from("quiz_questions")
        .insert(questionsData);

      if (questionsError) throw questionsError;

      // Only notify students if it's a new quiz
      if (!existingQuiz) {
        const { data: members } = await supabase
          .from("classroom_members")
          .select("student_id")
          .eq("classroom_id", classroomId);

        if (members && members.length > 0) {
          const notifications = members.map(member => ({
            user_id: member.student_id,
            title: "New Quiz Available",
            message: `A new quiz "${formData.title}" has been posted${dueDate ? `. Due: ${new Date(dueDate).toLocaleDateString()}` : ""}`,
            type: "quiz",
            link: `/student/classroom/${classroomId}`,
          }));

          await supabase.from("notifications").insert(notifications);
        }
      }

      toast.success(existingQuiz ? "Quiz updated successfully!" : `Quiz created! Total points: ${totalPoints}, Passing: ${formData.passing_percentage}%`);
      setFormData({ 
        title: "", 
        description: "", 
        passing_percentage: 70, 
        xp_reward: 50, 
        due_date: "", 
        due_time: "", 
        max_attempts: 5,
        availability_start: "",
        availability_end: "",
        is_locked: false,
        visible_when_locked: true,
      });
      setQuestions([{ question_text: "", options: ["", "", "", ""], correct_answer: "", explanation: "", points: 1 }]);
      setOpen(false);
      onQuizCreated();
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast.error("Failed to create quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!existingQuiz && (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Quiz
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingQuiz ? "Edit Quiz" : "Create New Quiz"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="title">Quiz Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter quiz title"
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_time">Due Time</Label>
              <Input
                id="due_time"
                type="time"
                value={formData.due_time}
                onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passing_percentage">Passing Percentage (%)</Label>
              <Input
                id="passing_percentage"
                type="number"
                min={0}
                max={100}
                value={formData.passing_percentage}
                onChange={(e) => setFormData({ ...formData, passing_percentage: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Total Points: {getTotalPoints()} | Passing Score: {Math.ceil(getTotalPoints() * formData.passing_percentage / 100)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="xp_reward">XP Reward</Label>
              <Input
                id="xp_reward"
                type="number"
                min={0}
                value={formData.xp_reward}
                onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_attempts">Max Attempts (1-5)</Label>
              <Input
                id="max_attempts"
                type="number"
                min={1}
                max={5}
                value={formData.max_attempts}
                onChange={(e) => setFormData({ ...formData, max_attempts: Math.min(5, Math.max(1, parseInt(e.target.value) || 5)) })}
              />
              <p className="text-xs text-muted-foreground">
                Students can attempt this quiz up to {formData.max_attempts} time{formData.max_attempts > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Lock Controls */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Lock Settings</h3>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_locked}
                onCheckedChange={(checked) => setFormData({ ...formData, is_locked: checked })}
              />
              <Label>Lock quiz until availability date</Label>
            </div>

            {formData.is_locked && (
              <>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.visible_when_locked}
                    onCheckedChange={(checked) => setFormData({ ...formData, visible_when_locked: checked })}
                  />
                  <Label>Show quiz when locked (students can see it but not take it)</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="availability_start">Available From</Label>
                    <Input
                      id="availability_start"
                      type="datetime-local"
                      value={formData.availability_start}
                      onChange={(e) => setFormData({ ...formData, availability_start: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availability_end">Available Until (Optional)</Label>
                    <Input
                      id="availability_end"
                      type="datetime-local"
                      value={formData.availability_end}
                      onChange={(e) => setFormData({ ...formData, availability_end: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg">Questions</Label>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            {questions.map((question, qIndex) => (
              <div key={qIndex} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <Label>Question {qIndex + 1}</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      min={1}
                      value={question.points}
                      onChange={(e) => updateQuestion(qIndex, "points", parseInt(e.target.value) || 1)}
                      className="w-20"
                      placeholder="Points"
                    />
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(qIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <Textarea
                  value={question.question_text}
                  onChange={(e) => updateQuestion(qIndex, "question_text", e.target.value)}
                  placeholder="Enter question"
                  rows={2}
                />

                <div className="grid grid-cols-2 gap-2">
                  {question.options.map((option, oIndex) => (
                    <Input
                      key={oIndex}
                      value={option}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                    />
                  ))}
                </div>

                <Input
                  value={question.correct_answer}
                  onChange={(e) => updateQuestion(qIndex, "correct_answer", e.target.value)}
                  placeholder="Correct answer (must match one option exactly)"
                />

                <Textarea
                  value={question.explanation}
                  onChange={(e) => updateQuestion(qIndex, "explanation", e.target.value)}
                  placeholder="Explanation (optional)"
                  rows={2}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-end">
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
                "Create Quiz"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuizDialog;
