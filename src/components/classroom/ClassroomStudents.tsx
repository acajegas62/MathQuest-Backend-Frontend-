import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight } from "lucide-react";
import StudentProfileDialog from "./StudentProfileDialog";
import { motion } from "framer-motion";

interface ClassroomStudentsProps {
  classroomId: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

const ClassroomStudents = ({ classroomId }: ClassroomStudentsProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [classroomId]);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("classroom_members")
      .select(`
        student_id,
        profiles:student_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq("classroom_id", classroomId);

    if (!error && data) {
      setStudents(data.map((item: any) => item.profiles).filter(Boolean));
    }
    setLoading(false);
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setDialogOpen(true);
  };

  return (
    <>
      <Card className="glass-card p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-6">Students</h2>
        {loading ? (
          <p className="text-muted-foreground">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="text-muted-foreground">No students enrolled yet</p>
        ) : (
          <motion.div 
            className="space-y-3"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.08
                }
              }
            }}
            initial="hidden"
            animate="show"
          >
            {students.map((student, index) => (
              <motion.button
                key={student.id}
                onClick={() => handleStudentClick(student)}
                className="w-full group"
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  show: { 
                    opacity: 1, 
                    x: 0,
                    transition: {
                      type: "spring",
                      stiffness: 100,
                      damping: 15
                    }
                  }
                }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="glass-card p-4 rounded-xl transition-all duration-200 hover:border-primary cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 border-2 border-primary/20">
                        <AvatarImage src={student.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600">
                          {student.first_name?.[0]}{student.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-semibold text-lg">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">Click to view profile</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Card>
              </motion.button>
            ))}
          </motion.div>
        )}
      </Card>

      {selectedStudent && (
        <StudentProfileDialog
          studentId={selectedStudent.id}
          studentName={`${selectedStudent.first_name} ${selectedStudent.last_name}`}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </>
  );
};

export default ClassroomStudents;
