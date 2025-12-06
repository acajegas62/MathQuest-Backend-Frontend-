import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, ClipboardCheck, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import CreateClassroomDialog from "@/components/CreateClassroomDialog";
import TeacherOnboarding from "@/components/TeacherOnboarding";
import { toast } from "sonner";

interface Classroom {
  id: string;
  name: string;
  description: string;
  code: string;
  cover_image_url?: string;
  student_count?: number;
}

const TeacherDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchClassrooms();
    }
  }, [user?.id]);

  const fetchClassrooms = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("classrooms")
        .select(`
          *,
          classroom_members(count)
        `)
        .eq('teacher_id', user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const classroomsWithCounts = data?.map(classroom => ({
        ...classroom,
        student_count: classroom.classroom_members?.[0]?.count || 0
      })) || [];

      setClassrooms(classroomsWithCounts);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      toast.error("Failed to load classrooms");
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      icon: Users,
      label: "Total Students",
      value: classrooms.reduce((acc, c) => acc + (c.student_count || 0), 0).toString(),
      gradient: "from-primary to-secondary",
    },
    {
      icon: BookOpen,
      label: "Active Classrooms",
      value: classrooms.length.toString(),
      gradient: "from-secondary to-accent",
    },
    {
      icon: ClipboardCheck,
      label: "Pending Tasks",
      value: "0",
      gradient: "from-accent to-primary",
    },
    {
      icon: Trophy,
      label: "Achievements",
      value: "0",
      gradient: "from-warning to-success",
    },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen p-8 pt-24">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 gradient-text">Teacher Command Center</h1>
              <p className="text-muted-foreground">
                Welcome back, {profile ? `${profile.first_name} ${profile.last_name}` : "Captain"}! Manage your cosmic classrooms.
              </p>
            </div>
            <CreateClassroomDialog onClassroomCreated={fetchClassrooms} />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="glass-card-glow p-6 rounded-2xl animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center glow-primary`}
                  >
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold">{stat.value}</span>
                </div>
                <h3 className="text-muted-foreground">{stat.label}</h3>
              </Card>
            ))}
          </div>

          {loading ? (
            <Card className="glass-card p-6 rounded-2xl">
              <div className="text-center py-12">
                <div className="animate-pulse">Loading classrooms...</div>
              </div>
            </Card>
          ) : classrooms.length === 0 ? (
            <TeacherOnboarding 
              teacherName={profile?.first_name || "Captain"}
              onClassroomCreated={fetchClassrooms}
            />
          ) : (
            <Card className="glass-card p-6 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6">My Classrooms</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classrooms.map((classroom, index) => (
                  <Card
                    key={classroom.id}
                    className="glass-card-glow rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => navigate(`/teacher/classroom/${classroom.id}`)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {classroom.cover_image_url && (
                      <div className="w-full h-40">
                        <img
                          src={classroom.cover_image_url}
                          alt={classroom.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="font-bold text-xl mb-2">{classroom.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {classroom.description || "No description"}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          <Users className="inline h-4 w-4 mr-1" />
                          {classroom.student_count || 0} students
                        </p>
                        <p className="text-xs font-mono bg-primary/20 text-primary px-2 py-1 rounded">
                          {classroom.code}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default TeacherDashboard;
