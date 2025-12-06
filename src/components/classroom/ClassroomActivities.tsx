import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import CreateActivityDialog from "./CreateActivityDialog";
import ShareContentDialog from "./ShareContentDialog";
import { Loader2, Trophy, Pencil, Trash2, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

interface ClassroomActivitiesProps {
  classroomId: string;
}

const ClassroomActivities = ({ classroomId }: ClassroomActivitiesProps) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchActivities = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("activities")
      .select("*")
      .eq("classroom_id", classroomId)
      .order("created_at", { ascending: false });
    setActivities(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchActivities();
  }, [classroomId]);

  const handleDelete = async () => {
    if (!selectedActivity) return;
    try {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", selectedActivity.id);
      
      if (error) throw error;
      toast.success("Activity deleted successfully");
      fetchActivities();
      setDeleteDialogOpen(false);
      setSelectedActivity(null);
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Failed to delete activity");
    }
  };

  const handleToggleLock = async (activity: any) => {
    try {
      const { error } = await supabase
        .from("activities")
        .update({ is_locked: !activity.is_locked })
        .eq("id", activity.id);
      
      if (error) throw error;
      toast.success(`Activity ${activity.is_locked ? 'unlocked' : 'locked'} successfully`);
      fetchActivities();
    } catch (error) {
      console.error("Error toggling lock:", error);
      toast.error("Failed to toggle lock");
    }
  };

  return (
    <>
    <Card className="glass-card p-6 rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Activities & Games</h2>
        <CreateActivityDialog classroomId={classroomId} onActivityCreated={fetchActivities} />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No activities yet. Create your first activity!</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <Card key={activity.id} className="p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">{activity.title}</h3>
                  </div>
                  {activity.description && <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>}
                  {activity.content && (
                    <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                      <span>Max Score: {activity.content.max_score}</span>
                      <span>Passing: {activity.content.passing_percentage}% ({activity.content.passing_score} pts)</span>
                      <span>XP: {activity.xp_reward}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{activity.activity_type}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleLock(activity)}
                  >
                    {activity.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedActivity(activity);
                      setEditDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedActivity(activity);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <ShareContentDialog
                    contentType="activity"
                    contentId={activity.id}
                    sourceClassroomId={classroomId}
                    contentTitle={activity.title}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Activity</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{selectedActivity?.title}"? This action cannot be undone.
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

export default ClassroomActivities;
