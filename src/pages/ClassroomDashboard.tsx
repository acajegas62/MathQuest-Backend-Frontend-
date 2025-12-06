import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, BookOpen, Gamepad2, BarChart3, Trophy, FileSpreadsheet, History } from "lucide-react";
import { toast } from "sonner";

import ClassroomLessons from "@/components/classroom/ClassroomLessons";
import ClassroomQuizzes from "@/components/classroom/ClassroomQuizzes";
import ClassroomActivities from "@/components/classroom/ClassroomActivities";
import ClassroomStudents from "@/components/classroom/ClassroomStudents";
import ClassroomProgress from "@/components/classroom/ClassroomProgress";
import ClassroomLeaderboard from "@/components/classroom/ClassroomLeaderboard";
import ClassroomRecord from "@/components/classroom/ClassroomRecord";
import SharedContentHistory from "@/components/classroom/SharedContentHistory";
import BulkShareDialog from "@/components/classroom/BulkShareDialog";

interface Classroom {
  id: string;
  name: string;
  description: string;
  code: string;
  cover_image_url?: string;
  teacher_id: string;
}

const ClassroomDashboard = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("lessons");

  useEffect(() => {
    fetchClassroom();
  }, [classroomId]);

  const fetchClassroom = async () => {
    try {
      const { data, error } = await supabase
        .from("classrooms")
        .select("*")
        .eq("id", classroomId)
        .single();

      if (error) throw error;
      setClassroom(data);
    } catch (error) {
      console.error("Error fetching classroom:", error);
      toast.error("Failed to load classroom");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen p-8 pt-24 flex items-center justify-center">
          <div className="animate-pulse text-xl">Loading...</div>
        </div>
      </>
    );
  }

  if (!classroom) {
    return (
      <>
        <Header />
        <div className="min-h-screen p-8 pt-24">
          <Card className="glass-card p-8 text-center">
            <p className="text-xl mb-4">Classroom not found</p>
            <Button onClick={() => navigate("/teacher/dashboard")}>
              Back to Dashboard
            </Button>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen p-8 pt-24">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/teacher/dashboard")}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>

            <Card className="glass-card p-6 rounded-2xl overflow-hidden">
              {classroom.cover_image_url && (
                <div className="w-full h-48 -m-6 mb-4">
                  <img
                    src={classroom.cover_image_url}
                    alt={classroom.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold gradient-text mb-2">
                    {classroom.name}
                  </h1>
                  <p className="text-muted-foreground mb-2">
                    {classroom.description}
                  </p>
                  <p className="text-sm font-mono bg-muted px-3 py-1 rounded-lg inline-block">
                    Class Code: {classroom.code}
                  </p>
                </div>
                <BulkShareDialog classroomId={classroomId!} />
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="glass-card w-full justify-start p-1 h-auto flex-wrap gap-1">
              <TabsTrigger value="lessons" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Lessons
              </TabsTrigger>
              <TabsTrigger value="quizzes" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Quizzes
              </TabsTrigger>
              <TabsTrigger value="activities" className="gap-2">
                <Gamepad2 className="h-4 w-4" />
                Activities
              </TabsTrigger>
              <TabsTrigger value="students" className="gap-2">
                <Users className="h-4 w-4" />
                Students
              </TabsTrigger>
              <TabsTrigger value="progress" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="gap-2">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="record" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Class Record
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                Share History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lessons" className="mt-6">
              <ClassroomLessons classroomId={classroomId!} />
            </TabsContent>

            <TabsContent value="quizzes" className="mt-6">
              <ClassroomQuizzes classroomId={classroomId!} />
            </TabsContent>

            <TabsContent value="activities" className="mt-6">
              <ClassroomActivities classroomId={classroomId!} />
            </TabsContent>

            <TabsContent value="students" className="mt-6">
              <ClassroomStudents classroomId={classroomId!} />
            </TabsContent>

            <TabsContent value="progress" className="mt-6">
              <ClassroomProgress classroomId={classroomId!} />
            </TabsContent>

            <TabsContent value="leaderboard" className="mt-6">
              <ClassroomLeaderboard classroomId={classroomId!} />
            </TabsContent>

            <TabsContent value="record" className="mt-6">
              <ClassroomRecord classroomId={classroomId!} />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <SharedContentHistory classroomId={classroomId!} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default ClassroomDashboard;
