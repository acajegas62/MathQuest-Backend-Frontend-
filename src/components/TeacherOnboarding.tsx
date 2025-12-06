import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Trophy, Sparkles } from "lucide-react";
import CreateClassroomDialog from "@/components/CreateClassroomDialog";

interface TeacherOnboardingProps {
  teacherName: string;
  onClassroomCreated: () => void;
}

const TeacherOnboarding = ({ teacherName, onClassroomCreated }: TeacherOnboardingProps) => {
  const steps = [
    {
      icon: BookOpen,
      title: "Create Your First Classroom",
      description: "Set up a virtual classroom with a unique code for your students to join"
    },
    {
      icon: Users,
      title: "Invite Your Students",
      description: "Share your classroom code with students so they can join and start learning"
    },
    {
      icon: Trophy,
      title: "Create Engaging Content",
      description: "Add lessons, quizzes, and activities to help your students master math concepts"
    }
  ];

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="glass-card p-8 max-w-3xl w-full">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary glow-primary mb-4">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold mb-2 gradient-text">
              Welcome, {teacherName}!
            </h2>
            <p className="text-muted-foreground text-lg">
              Let's get your cosmic classroom up and running
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 my-8">
            {steps.map((step, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <CreateClassroomDialog onClassroomCreated={onClassroomCreated} />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TeacherOnboarding;
