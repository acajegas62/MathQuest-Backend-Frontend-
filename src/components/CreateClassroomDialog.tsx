import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CreateClassroomDialogProps {
  onClassroomCreated: () => void;
}

const CreateClassroomDialog = ({ onClassroomCreated }: CreateClassroomDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const generateClassCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let coverImageUrl = null;

      // Upload cover image if selected
      if (coverImage) {
        const fileExt = coverImage.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("classroom-covers")
          .upload(fileName, coverImage);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("classroom-covers")
          .getPublicUrl(fileName);

        coverImageUrl = data.publicUrl;
      }

      // Create classroom
      const { error } = await supabase
        .from("classrooms")
        .insert({
          name: formData.name,
          description: formData.description,
          code: generateClassCode(),
          teacher_id: user.id,
          cover_image_url: coverImageUrl,
        });

      if (error) throw error;

      toast.success("Classroom created successfully!");
      setOpen(false);
      setFormData({ name: "", description: "" });
      setCoverImage(null);
      onClassroomCreated();
    } catch (error: any) {
      console.error("Error creating classroom:", error);
      toast.error(error.message || "Failed to create classroom");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-neon rounded-xl">
          <Plus className="mr-2 h-5 w-5" />
          Create Classroom
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text">Create New Classroom</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Classroom Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Nebula Navigators"
              required
              className="glass-card rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your classroom..."
              rows={3}
              className="glass-card rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover">Cover Image (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="cover"
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                className="glass-card rounded-xl"
              />
              <Button type="button" variant="outline" size="icon" className="glass-card rounded-xl">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full btn-neon rounded-xl" disabled={loading}>
            {loading ? "Creating..." : "Create Classroom"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClassroomDialog;
