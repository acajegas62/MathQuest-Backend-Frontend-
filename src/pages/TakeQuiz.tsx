import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Award, Clock, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { toast } from "sonner";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  order_index: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  passing_score: number;
  total_questions: number;
  xp_reward: number;
  classroom_id: string;
  max_attempts: number;
}

interface QuizAttempt {
  id: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

const TakeQuiz = () => {
  const { quizId, classroomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [previousAttempts, setPreviousAttempts] = useState<QuizAttempt[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [canTakeQuiz, setCanTakeQuiz] = useState(true);
  const [blockReason, setBlockReason] = useState("");

  useEffect(() => {
    if (quizId) {
      fetchQuizData();
    }
  }, [quizId]);

  const fetchQuizData = async () => {
    try {
      // Fetch quiz details
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();

      if (quizError) throw quizError;
      setQuiz(quizData);

      // Fetch previous attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", quizId)
        .eq("student_id", user?.id)
        .order("completed_at", { ascending: false });

      if (attemptsError) throw attemptsError;
      
      const attempts = attemptsData || [];
      setPreviousAttempts(attempts);

      // Check if student already passed
      const passedAttempt = attempts.find(a => (a.score / a.total_questions) * 100 >= quizData.passing_score);
      
      if (passedAttempt) {
        setCanTakeQuiz(false);
        setBlockReason("You have already passed this quiz.");
        setLoading(false);
        return;
      }

      // Check if student exceeded max attempts
      if (attempts.length >= quizData.max_attempts) {
        setCanTakeQuiz(false);
        setBlockReason(`You have used all ${quizData.max_attempts} attempts for this quiz.`);
        setLoading(false);
        return;
      }

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_index", { ascending: true });

      if (questionsError) throw questionsError;
      setQuestions((questionsData || []).map(q => ({
        ...q,
        options: q.options as string[]
      })));
    } catch (error) {
      console.error("Error fetching quiz:", error);
      toast.error("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    // Calculate score
    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });

    const finalScore = correctCount;
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    try {
      // Save quiz attempt
      const { error } = await supabase.from("quiz_attempts").insert({
        quiz_id: quizId,
        student_id: user?.id,
        score: finalScore,
        total_questions: questions.length,
        answers: answers,
        time_taken_seconds: timeTaken,
      });

      if (error) throw error;

      setScore(finalScore);
      setSubmitted(true);
      
      const percentage = (finalScore / questions.length) * 100;
      const passed = percentage >= (quiz?.passing_score || 70);

      // Record score in student_scores table
      await supabase.from("student_scores").insert({
        student_id: user?.id,
        classroom_id: classroomId,
        activity_id: quizId,
        activity_type: "quiz",
        activity_title: quiz?.title || "Quiz",
        score: finalScore,
        max_score: questions.length,
        percentage: percentage,
        date_submitted: new Date().toISOString(),
      });

      // Update student XP if passed
      if (passed && quiz?.xp_reward) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("xp")
          .eq("id", user?.id)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({ xp: (profile.xp || 0) + quiz.xp_reward })
            .eq("id", user?.id);
        }
      }
      
      if (passed) {
        toast.success(`Congratulations! You passed with ${percentage.toFixed(0)}%`);
      } else {
        toast.error(`You scored ${percentage.toFixed(0)}%. Keep practicing!`);
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz");
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-lg">Loading quiz...</div>
        </div>
      </>
    );
  }

  if (!canTakeQuiz && blockReason) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center p-8">
          <Card className="glass-card p-8 text-center max-w-2xl">
            <XCircle className="h-16 w-16 mx-auto mb-4 text-warning" />
            <h2 className="text-2xl font-bold mb-4">Quiz Unavailable</h2>
            <p className="text-lg mb-6">{blockReason}</p>
            {previousAttempts.length > 0 && (
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <p className="font-semibold mb-2">Your Previous Attempts:</p>
                {previousAttempts.map((attempt, index) => (
                  <p key={attempt.id} className="text-sm">
                    Attempt {previousAttempts.length - index}: {((attempt.score / attempt.total_questions) * 100).toFixed(0)}%
                  </p>
                ))}
              </div>
            )}
            <Button onClick={() => navigate(`/student/classroom/${classroomId}`)}>
              Back to Classroom
            </Button>
          </Card>
        </div>
      </>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Card className="glass-card p-8 text-center">
            <p className="text-lg mb-4">Quiz not found or has no questions</p>
            <Button onClick={() => navigate(`/student/classroom/${classroomId}`)}>
              Back to Classroom
            </Button>
          </Card>
        </div>
      </>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (submitted) {
    const percentage = (score / questions.length) * 100;
    const passed = percentage >= quiz.passing_score;

    return (
      <>
        <Header />
        <div className="min-h-screen p-8 pt-24">
          <div className="max-w-4xl mx-auto">
            <Card className="glass-card p-8 text-center">
              {passed ? (
                <CheckCircle className="h-24 w-24 mx-auto mb-6 text-success" />
              ) : (
                <XCircle className="h-24 w-24 mx-auto mb-6 text-destructive" />
              )}
              
              <h1 className="text-4xl font-bold mb-4">
                {passed ? "Quiz Passed!" : "Keep Practicing"}
              </h1>
              
              <div className="text-6xl font-bold mb-6 gradient-text">
                {percentage.toFixed(0)}%
              </div>
              
              <p className="text-xl mb-8">
                You scored {score} out of {questions.length} questions correctly
              </p>
              
              <div className="flex flex-col gap-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span>Passing Score:</span>
                  <span className="font-bold">{quiz.passing_score}%</span>
                </div>
                {passed && (
                  <div className="flex justify-between text-sm">
                    <span>XP Earned:</span>
                    <span className="font-bold text-success">+{quiz.xp_reward} XP</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Review Your Answers</h2>
                {questions.map((q, index) => {
                  const userAnswer = answers[q.id];
                  const isCorrect = userAnswer === q.correct_answer;
                  
                  return (
                    <Card key={q.id} className={`glass-card p-6 text-left ${isCorrect ? 'border-success' : 'border-destructive'}`}>
                      <div className="flex items-start gap-3 mb-3">
                        {isCorrect ? (
                          <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                        ) : (
                          <XCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1">
                          <p className="font-bold mb-2">Question {index + 1}</p>
                          <p className="mb-3">{q.question_text}</p>
                          <div className="space-y-2 text-sm">
                            <p>Your answer: <span className={isCorrect ? 'text-success font-semibold' : 'text-destructive'}>{userAnswer}</span></p>
                            {!isCorrect && (
                              <p>Correct answer: <span className="text-success font-semibold">{q.correct_answer}</span></p>
                            )}
                            {q.explanation && (
                              <p className="text-muted-foreground italic mt-2">{q.explanation}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <Button
                onClick={() => navigate(`/student/classroom/${classroomId}`)}
                className="mt-8 gap-2"
                size="lg"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Classroom
              </Button>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen p-8 pt-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(`/student/classroom/${classroomId}`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  {Math.floor((Date.now() - startTime) / 60000)}:{((Math.floor((Date.now() - startTime) / 1000) % 60)).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span className="text-sm">{quiz.xp_reward} XP</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Attempt {previousAttempts.length + 1} of {quiz.max_attempts}
              </div>
            </div>
          </div>

          {/* Progress */}
          <Card className="glass-card p-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span>{Object.keys(answers).length} answered</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </Card>

          {/* Question */}
          <Card className="glass-card p-8">
            <h2 className="text-2xl font-bold mb-6">{currentQuestion.question_text}</h2>
            
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              <div className="space-y-4">
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-accent ${
                      answers[currentQuestion.id] === option
                        ? "border-primary bg-primary/10"
                        : "border-muted"
                    }`}
                    onClick={() => handleAnswerChange(currentQuestion.id, option)}
                  >
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer text-base"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            
            {currentQuestionIndex === questions.length - 1 ? (
              <Button onClick={handleSubmit} size="lg" className="gap-2">
                Submit Quiz
                <Award className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TakeQuiz;
