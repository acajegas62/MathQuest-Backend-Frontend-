import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, BookOpen, ClipboardList, FileQuestion, Share2, Calendar, ArrowRight, X } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SharedContentHistoryProps {
  classroomId?: string;
}

interface SharedItem {
  id: string;
  content_type: string;
  content_title: string;
  shared_at: string;
  destination_classrooms: Array<{
    id: string;
    name: string;
    destination_id: string; // ID from shared_content_destinations table
  }>;
  source_classroom_name: string;
}

const SharedContentHistory = ({ classroomId }: SharedContentHistoryProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sharedItems, setSharedItems] = useState<SharedItem[]>([]);
  const [unshareDialog, setUnshareDialog] = useState<{
    open: boolean;
    destinationId: string;
    classroomName: string;
    contentTitle: string;
  }>({ open: false, destinationId: "", classroomName: "", contentTitle: "" });

  useEffect(() => {
    if (user) {
      fetchSharedHistory();
    }
  }, [user, classroomId]);

  const fetchSharedHistory = async () => {
    setLoading(true);
    try {
      // Build query
      let query = supabase
        .from("shared_content")
        .select(`
          id,
          content_type,
          content_id,
          shared_at,
          source_classroom_id,
          classrooms!shared_content_source_classroom_id_fkey(name)
        `)
        .eq("shared_by", user?.id)
        .order("shared_at", { ascending: false });

      if (classroomId) {
        query = query.eq("source_classroom_id", classroomId);
      }

      const { data: sharedContent } = await query;

      if (!sharedContent) {
        setSharedItems([]);
        return;
      }

      // Fetch content details and destinations
      const items = await Promise.all(
        sharedContent.map(async (item) => {
          // Get content title
          let contentTitle = "Unknown";
          const tableName = item.content_type === "lesson" ? "lessons" : 
                           item.content_type === "activity" ? "activities" : "quizzes";
          
          const { data: content } = await supabase
            .from(tableName)
            .select("title")
            .eq("id", item.content_id)
            .single();
          
          if (content) {
            contentTitle = content.title;
          }

          // Get destinations
          const { data: destinations } = await supabase
            .from("shared_content_destinations")
            .select(`
              id,
              destination_classroom_id,
              classrooms!shared_content_destinations_destination_classroom_id_fkey(id, name)
            `)
            .eq("shared_content_id", item.id);

          const destinationClassrooms = destinations?.map(d => ({
            id: (d.classrooms as any).id,
            name: (d.classrooms as any).name,
            destination_id: d.id,
          })) || [];

          return {
            id: item.id,
            content_type: item.content_type,
            content_title: contentTitle,
            shared_at: item.shared_at!,
            destination_classrooms: destinationClassrooms,
            source_classroom_name: (item.classrooms as any)?.name || "Unknown",
          };
        })
      );

      setSharedItems(items);
    } catch (error) {
      console.error("Error fetching shared history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "lesson":
        return <BookOpen className="h-4 w-4" />;
      case "activity":
        return <ClipboardList className="h-4 w-4" />;
      case "quiz":
        return <FileQuestion className="h-4 w-4" />;
      default:
        return <Share2 className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "lesson":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "activity":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "quiz":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleUnshare = async () => {
    try {
      const { error } = await supabase
        .from("shared_content_destinations")
        .delete()
        .eq("id", unshareDialog.destinationId);

      if (error) throw error;

      toast.success(`Content unshared from ${unshareDialog.classroomName}`);
      setUnshareDialog({ open: false, destinationId: "", classroomName: "", contentTitle: "" });
      fetchSharedHistory(); // Refresh the list
    } catch (error) {
      console.error("Error unsharing content:", error);
      toast.error("Failed to unshare content");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (sharedItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No shared content history yet.</p>
            <p className="text-sm mt-2">Start sharing lessons, activities, or quizzes to see them here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Shared Content History
        </CardTitle>
        <CardDescription>
          View all content you've shared across classrooms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {sharedItems.map((item) => (
              <Card key={item.id} className="border-l-4 border-l-primary/30">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getTypeColor(item.content_type)}>
                          {getIcon(item.content_type)}
                          <span className="ml-1 capitalize">{item.content_type}</span>
                        </Badge>
                        <h4 className="font-semibold">{item.content_title}</h4>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Shared on {format(new Date(item.shared_at), "MMM dd, yyyy 'at' h:mm a")}</span>
                      </div>

                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-muted-foreground">From:</span>
                        <span className="font-medium">{item.source_classroom_name}</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">Shared to:</p>
                          <div className="flex flex-wrap gap-2">
                            {item.destination_classrooms.map((classroom) => (
                              <Badge key={classroom.id} variant="secondary" className="pr-1">
                                <span>{classroom.name}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 ml-1 hover:bg-destructive/20"
                                  onClick={() => setUnshareDialog({
                                    open: true,
                                    destinationId: classroom.destination_id,
                                    classroomName: classroom.name,
                                    contentTitle: item.content_title
                                  })}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>

      <AlertDialog open={unshareDialog.open} onOpenChange={(open) => 
        setUnshareDialog({ ...unshareDialog, open })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unshare Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{unshareDialog.contentTitle}" from {unshareDialog.classroomName}? 
              Students in that classroom will no longer have access to this content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnshare} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Unshare
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default SharedContentHistory;
