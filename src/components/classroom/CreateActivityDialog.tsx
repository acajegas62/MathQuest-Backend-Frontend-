import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateActivityDialogProps {
  classroomId: string;
  onActivityCreated: () => void;
}

const CreateActivityDialog = ({ classroomId, onActivityCreated }: CreateActivityDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    activity_type: "game",
    game_name: "OneDer",
    xp_reward: 20,
    max_score: 100,
    passing_percentage: 60,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Please enter an activity title");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("activities").insert({
        classroom_id: classroomId,
        title: formData.title,
        description: formData.description,
        activity_type: formData.activity_type,
        xp_reward: formData.xp_reward,
        content: {
          game_name: formData.game_name,
          max_score: formData.max_score,
          passing_percentage: formData.passing_percentage,
          passing_score: Math.ceil(formData.max_score * formData.passing_percentage / 100),
        },
      });

      if (error) throw error;

      // Notify all students in the classroom
      const { data: members } = await supabase
        .from("classroom_members")
        .select("student_id")
        .eq("classroom_id", classroomId);

      if (members && members.length > 0) {
        const notifications = members.map(member => ({
          user_id: member.student_id,
          title: "New Activity Available",
          message: `A new activity "${formData.title}" has been added to your classroom`,
          type: "activity",
          link: `/student/classroom/${classroomId}`,
        }));

        await supabase.from("notifications").insert(notifications);
      }

      toast.success(`Activity created! Passing score: ${Math.ceil(formData.max_score * formData.passing_percentage / 100)}/${formData.max_score}`);
      setFormData({ title: "", description: "", activity_type: "game", game_name: "OneDer", xp_reward: 20, max_score: 100, passing_percentage: 60 });
      setOpen(false);
      onActivityCreated();
    } catch (error) {
      console.error("Error creating activity:", error);
      toast.error("Failed to create activity");
    } finally {
      setLoading(false);
    }
  };

  const passingScore = Math.ceil(formData.max_score * formData.passing_percentage / 100);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Activity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Activity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Activity Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter activity title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the activity"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity_type">Activity Type</Label>
            <Select
              value={formData.activity_type}
              onValueChange={(value) => setFormData({ ...formData, activity_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="game">Game</SelectItem>
                <SelectItem value="exercise">Exercise</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="challenge">Challenge</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.activity_type === "game" && (
            <div className="space-y-2">
              <Label htmlFor="game_name">Select Game</Label>
              <Select
                value={formData.game_name}
                onValueChange={(value) => setFormData({ ...formData, game_name: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OneDer">OneDer - Multiply by 1</SelectItem>
                  <SelectItem value="Groupara">Groupara - Grouping & Multiplication</SelectItem>
                  <SelectItem value="ZeroVoid">Zero Void - Multiply by 0</SelectItem>
                  <SelectItem value="BreakNBuild">Break N' Build - Distributive Property</SelectItem>
                  <SelectItem value="SwapStar">Swap Star - Pattern Matching</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_score">Maximum Score</Label>
              <Input
                id="max_score"
                type="number"
                min={1}
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) || 100 })}
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
                onChange={(e) => setFormData({ ...formData, passing_percentage: parseInt(e.target.value) || 60 })}
              />
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Passing Score:</strong> {passingScore} / {formData.max_score} points ({formData.passing_percentage}%)
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
                "Create Activity"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateActivityDialog;
