import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table as DocxTable, TableCell as DocxTableCell, TableRow as DocxTableRow, WidthType, AlignmentType } from "docx";

interface ActivityScore {
  activity_title: string;
  activity_type: string;
  score: number;
  max_score: number;
  date_submitted: string;
}

interface RawScore extends ActivityScore {
  student_id: string;
}

interface StudentRecord {
  student_id: string;
  first_name: string;
  last_name: string;
  gender: string;
  scores: Map<string, ActivityScore>; // key: activity_title
  total_score: number;
  total_possible: number;
  percentage: number;
}

interface ClassroomRecordProps {
  classroomId: string;
}

const ClassroomRecord = ({ classroomId }: ClassroomRecordProps) => {
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<StudentRecord[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("surname-asc");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchScores();
  }, [classroomId]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [studentRecords, sortBy, filterType]);

  const fetchScores = async () => {
    try {
      // Fetch scores from student_scores table
      const { data: scoresData, error: scoresError } = await supabase
        .from("student_scores")
        .select("*")
        .eq("classroom_id", classroomId);

      if (scoresError) throw scoresError;

      let allScores: RawScore[] = [];
      let studentProfiles: Map<string, { first_name: string; last_name: string; gender: string }> = new Map();

      // If we have scores in student_scores, use them
      if (scoresData && scoresData.length > 0) {
        // Fetch student profiles
        const studentIds = [...new Set(scoresData.map(s => s.student_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, gender")
          .in("id", studentIds);

        if (profilesError) throw profilesError;

        profilesData?.forEach(p => {
          studentProfiles.set(p.id, {
            first_name: p.first_name || "Unknown",
            last_name: p.last_name || "Student",
            gender: p.gender || "Male"
          });
        });

        allScores = scoresData.map(score => ({
          student_id: score.student_id,
          activity_title: score.activity_title,
          activity_type: score.activity_type,
          score: score.score,
          max_score: score.max_score,
          date_submitted: score.date_submitted
        }));
      } else {
        // Fallback: fetch from quiz_attempts
        const { data: quizzesData, error: quizzesError } = await supabase
          .from("quizzes")
          .select("id, title, total_questions")
          .eq("classroom_id", classroomId);

        if (quizzesError) throw quizzesError;

        if (quizzesData && quizzesData.length > 0) {
          const quizIds = quizzesData.map(q => q.id);
          const { data: attemptsData, error: attemptsError } = await supabase
            .from("quiz_attempts")
            .select("*")
            .in("quiz_id", quizIds);

          if (attemptsError) throw attemptsError;

          if (attemptsData && attemptsData.length > 0) {
            const studentIds = [...new Set(attemptsData.map(a => a.student_id))];
            const { data: profilesData, error: profilesError } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, gender")
              .in("id", studentIds);

            if (profilesError) throw profilesError;

            profilesData?.forEach(p => {
              studentProfiles.set(p.id, {
                first_name: p.first_name || "Unknown",
                last_name: p.last_name || "Student",
                gender: p.gender || "Male"
              });
            });

            const quizzesMap = new Map(quizzesData.map(q => [q.id, q]));

            allScores = attemptsData.map(attempt => ({
              student_id: attempt.student_id,
              activity_title: quizzesMap.get(attempt.quiz_id)?.title || "Quiz",
              activity_type: "quiz",
              score: attempt.score,
              max_score: attempt.total_questions,
              date_submitted: attempt.completed_at
            }));
          }
        }
      }

      // Transform data: pivot to one row per student
      const studentMap = new Map<string, StudentRecord>();
      const activitySet = new Set<string>();

      allScores.forEach(score => {
        activitySet.add(score.activity_title);
        
        if (!studentMap.has(score.student_id)) {
          const profile = studentProfiles.get(score.student_id) || {
            first_name: "Unknown",
            last_name: "Student",
            gender: "Male"
          };
          
          studentMap.set(score.student_id, {
            student_id: score.student_id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            gender: profile.gender,
            scores: new Map(),
            total_score: 0,
            total_possible: 0,
            percentage: 0
          });
        }

        const student = studentMap.get(score.student_id)!;
        student.scores.set(score.activity_title, score);
      });

      // Calculate totals and percentages
      studentMap.forEach(student => {
        let totalScore = 0;
        let totalPossible = 0;
        
        student.scores.forEach(score => {
          totalScore += score.score;
          totalPossible += score.max_score;
        });
        
        student.total_score = totalScore;
        student.total_possible = totalPossible;
        student.percentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
      });

      setActivities(Array.from(activitySet).sort());
      setStudentRecords(Array.from(studentMap.values()));
    } catch (error) {
      console.error("Error fetching scores:", error);
      toast.error("Failed to load class record");
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...studentRecords];

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.map(student => {
        const filteredScores = new Map<string, ActivityScore>();
        student.scores.forEach((score, key) => {
          if (score.activity_type === filterType) {
            filteredScores.set(key, score);
          }
        });
        
        // Recalculate totals with filtered scores
        let totalScore = 0;
        let totalPossible = 0;
        filteredScores.forEach(score => {
          totalScore += score.score;
          totalPossible += score.max_score;
        });
        
        return {
          ...student,
          scores: filteredScores,
          total_score: totalScore,
          total_possible: totalPossible,
          percentage: totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0
        };
      }).filter(student => student.scores.size > 0); // Only show students with scores in this filter
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "surname-asc":
          return a.last_name.localeCompare(b.last_name);
        case "surname-desc":
          return b.last_name.localeCompare(a.last_name);
        case "score-high":
          return b.percentage - a.percentage;
        case "score-low":
          return a.percentage - b.percentage;
        default:
          return a.last_name.localeCompare(b.last_name);
      }
    });

    setFilteredRecords(filtered);
  };

  // Group records by gender
  const maleRecords = filteredRecords.filter(s => s.gender === "Male");
  const femaleRecords = filteredRecords.filter(s => s.gender === "Female");

  // Get filtered activities based on type filter
  const getFilteredActivities = () => {
    if (filterType === "all") return activities;
    
    const filtered = new Set<string>();
    filteredRecords.forEach(student => {
      student.scores.forEach((score, activityTitle) => {
        if (score.activity_type === filterType) {
          filtered.add(activityTitle);
        }
      });
    });
    return Array.from(filtered).sort();
  };

  const filteredActivities = getFilteredActivities();

  const exportToExcel = () => {
    const worksheetData: any[][] = [];
    
    // Headers
    const headers = ["First Name", "Last Name", ...filteredActivities, "Total Score", "HPS", "Percentage"];
    worksheetData.push(headers);
    
    // Data rows
    filteredRecords.forEach(student => {
      const row = [
        student.first_name,
        student.last_name,
        ...filteredActivities.map(activity => {
          const score = student.scores.get(activity);
          return score ? `${score.score}/${score.max_score}` : "-";
        }),
        student.total_score,
        student.total_possible,
        `${student.percentage.toFixed(2)}%`
      ];
      worksheetData.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Class Record");
    XLSX.writeFile(workbook, `class-record-${Date.now()}.xlsx`);
    toast.success("Exported to Excel");
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    
    doc.setFontSize(16);
    doc.text("Class Record", 14, 15);
    
    const headers = [["First Name", "Last Name", ...filteredActivities, "Total", "HPS", "%"]];
    const data = filteredRecords.map(student => [
      student.first_name,
      student.last_name,
      ...filteredActivities.map(activity => {
        const score = student.scores.get(activity);
        return score ? `${score.score}/${score.max_score}` : "-";
      }),
      student.total_score.toString(),
      student.total_possible.toString(),
      student.percentage.toFixed(2) + "%"
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`class-record-${Date.now()}.pdf`);
    toast.success("Exported to PDF");
  };

  const exportToWord = async () => {
    const tableRows: DocxTableRow[] = [];
    
    // Header row
    const headerCells = ["First Name", "Last Name", ...filteredActivities, "Total", "HPS", "%"].map(
      text => new DocxTableCell({
        children: [new Paragraph({ text, alignment: AlignmentType.CENTER })],
        shading: { fill: "3B82F6" }
      })
    );
    tableRows.push(new DocxTableRow({ children: headerCells, tableHeader: true }));
    
    // Data rows
    filteredRecords.forEach(student => {
      const cells = [
        student.first_name,
        student.last_name,
        ...filteredActivities.map(activity => {
          const score = student.scores.get(activity);
          return score ? `${score.score}/${score.max_score}` : "-";
        }),
        student.total_score.toString(),
        student.total_possible.toString(),
        student.percentage.toFixed(2) + "%"
      ].map(text => new DocxTableCell({
        children: [new Paragraph({ text, alignment: AlignmentType.CENTER })]
      }));
      
      tableRows.push(new DocxTableRow({ children: cells }));
    });

    const table = new DocxTable({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE }
    });

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: "Class Record", heading: "Heading1", alignment: AlignmentType.CENTER }),
          table
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `class-record-${Date.now()}.docx`;
    a.click();
    toast.success("Exported to Word");
  };

  if (loading) {
    return (
      <Card className="glass-card p-8">
        <div className="animate-pulse text-center">Loading records...</div>
      </Card>
    );
  }

  const renderGradebookTable = (records: StudentRecord[], gender: string) => (
    <div>
      <div className={`${gender === "Male" ? "bg-blue-500/20" : "bg-pink-500/20"} px-4 py-2 border-b border-border`}>
        <h3 className="font-bold text-lg">{gender.toUpperCase()}</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="sticky left-0 bg-muted/50 z-10">First Name</TableHead>
              <TableHead className="sticky left-[120px] bg-muted/50 z-10">Last Name</TableHead>
              {filteredActivities.map(activity => (
                <TableHead key={activity} className="text-center min-w-[100px]">
                  {activity}
                </TableHead>
              ))}
              <TableHead className="text-center font-bold bg-primary/10">Total Score</TableHead>
              <TableHead className="text-center font-bold bg-primary/10">HPS</TableHead>
              <TableHead className="text-center font-bold bg-primary/10">Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((student) => (
              <TableRow key={student.student_id}>
                <TableCell className="font-medium sticky left-0 bg-background z-10">
                  {student.first_name}
                </TableCell>
                <TableCell className="sticky left-[120px] bg-background z-10">
                  {student.last_name}
                </TableCell>
                {filteredActivities.map(activity => {
                  const score = student.scores.get(activity);
                  return (
                    <TableCell key={activity} className="text-center">
                      {score ? (
                        <span className="font-mono">
                          {score.score}/{score.max_score}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="text-center font-bold bg-primary/5">
                  {student.total_score}
                </TableCell>
                <TableCell className="text-center font-bold bg-primary/5">
                  {student.total_possible}
                </TableCell>
                <TableCell className="text-center font-bold bg-primary/5">
                  {student.percentage.toFixed(2)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <Card className="glass-card p-6 rounded-2xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Class Record</h2>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportToWord}>
            <Download className="mr-2 h-4 w-4" />
            Word
          </Button>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[200px] glass-card">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="surname-asc">Surname A-Z</SelectItem>
            <SelectItem value="surname-desc">Surname Z-A</SelectItem>
            <SelectItem value="score-high">Highest Score</SelectItem>
            <SelectItem value="score-low">Lowest Score</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px] glass-card">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="quiz">Quiz</SelectItem>
            <SelectItem value="activity">Activity</SelectItem>
            <SelectItem value="assignment">Assignment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden space-y-6">
        {maleRecords.length > 0 && renderGradebookTable(maleRecords, "Male")}
        {femaleRecords.length > 0 && renderGradebookTable(femaleRecords, "Female")}
        
        {filteredRecords.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No records found
          </div>
        )}
      </div>
    </Card>
  );
};

export default ClassroomRecord;
