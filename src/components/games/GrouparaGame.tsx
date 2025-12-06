import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb, Pause, Play, Heart } from "lucide-react";
import { toast } from "sonner";
import Leaderboard from "./Leaderboard";
import GameOverScreen from "./GameOverScreen";

interface GrouparaGameProps {
  levelNumber: number;
  onComplete: (score: number, stars: number, timeTaken: number) => void;
  onWrongAnswer?: () => void;
}

export default function GrouparaGame({ levelNumber, onComplete, onWrongAnswer }: GrouparaGameProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [nums, setNums] = useState([0, 0, 0]);
  const [answer, setAnswer] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lives, setLives] = useState(3);
  const startTime = useRef(Date.now());
  const pausedTime = useRef(0);
  const pauseStart = useRef(0);

  const totalQuestions = 5 + (levelNumber * 2);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isPaused) {
      generateQuestion();
    }
  }, [currentQuestion]);

  const togglePause = () => {
    setIsPaused(prev => {
      if (!prev) {
        pauseStart.current = Date.now();
      } else {
        pausedTime.current += Date.now() - pauseStart.current;
      }
      return !prev;
    });
  };

  const generateQuestion = () => {
    const difficulty = levelNumber;
    const max = difficulty * 2 + 3;
    const n = [
      Math.floor(Math.random() * max) + 2,
      Math.floor(Math.random() * max) + 2,
      Math.floor(Math.random() * max) + 2,
    ];
    setNums(n);
    setAnswer(n[0] * n[1] * n[2]);
    setSelectedAnswer(null);
    setShowHint(false);
  };

  const generateOptions = () => {
    const correct = nums[0] * nums[1] * nums[2];
    const options = [correct];
    
    while (options.length < 4) {
      const wrong = correct + Math.floor(Math.random() * 30) - 15;
      if (wrong > 0 && !options.includes(wrong)) {
        options.push(wrong);
      }
    }
    
    return options.sort(() => Math.random() - 0.5);
  };

  const handleHint = () => {
    if (!showHint) {
      toast.info("Hint used! Generating new question...");
      setShowHint(true);
      setTimeout(() => {
        generateQuestion();
        setShowHint(false);
      }, 2000);
    }
  };

  const handleAnswer = (ans: number) => {
    if (isPaused) return;
    setSelectedAnswer(ans);
    
    if (ans === answer) {
      setScore(score + 10);
      toast.success("Perfect grouping! 🎯");
      
      setTimeout(() => {
        if (currentQuestion + 1 >= totalQuestions) {
          const timeTaken = Math.floor((Date.now() - startTime.current - pausedTime.current) / 1000);
          const earnedStars = score >= totalQuestions * 8 ? 3 : score >= totalQuestions * 5 ? 2 : 1;
          setShowLeaderboard(true);
          setTimeout(() => {
            onComplete(score + 10, earnedStars, timeTaken);
          }, 3000);
        } else {
          setCurrentQuestion(currentQuestion + 1);
        }
      }, 1500);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      toast.error(`Wrong answer! ${newLives} ${newLives === 1 ? 'life' : 'lives'} remaining`);
      
      if (newLives <= 0) {
        toast.error("Game Over! All hearts lost!");
        setTimeout(() => {
          setShowGameOver(true);
        }, 1500);
      } else {
        // Regenerate question when losing a life
        toast.error("Not quite! Generating new question...");
        setTimeout(() => {
          generateQuestion();
          setSelectedAnswer(null);
        }, 1500);
      }
      onWrongAnswer?.();
    }
  };

  const handleTryAgain = () => {
    setShowGameOver(false);
    setLives(3);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    startTime.current = Date.now();
    pausedTime.current = 0;
  };

  const handleExit = () => {
    window.history.back();
  };

  if (showGameOver) {
    return (
      <GameOverScreen
        score={score}
        onTryAgain={handleTryAgain}
        onExit={handleExit}
      />
    );
  }

  if (showLeaderboard) {
    return (
      <div className="max-w-4xl mx-auto">
        <Leaderboard />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-white">
            <span className="text-lg">Question {currentQuestion + 1} / {totalQuestions}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-6 h-6 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-500 fill-gray-500'}`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={togglePause}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
            <div className="text-cyan-400 text-2xl font-bold">
              Score: {score}
            </div>
          </div>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-12 mb-6 text-center relative">
        {isPaused && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-3xl">
            <div className="text-center">
              <Pause className="w-20 h-20 text-white mx-auto mb-4" />
              <h3 className="text-4xl font-bold text-white mb-2">PAUSED</h3>
              <p className="text-white/70">Press P or ESC to continue</p>
            </div>
          </div>
        )}
        <h2 className="text-3xl text-white mb-8">
          Group the numbers and multiply!
        </h2>

        {/* Equation with grouping */}
        <div className="flex items-center justify-center gap-4 mb-12 flex-wrap">
          <div className="flex items-center gap-2 backdrop-blur-xl bg-blue-500/20 border-2 border-blue-500/50 rounded-2xl p-6">
            <span className="text-4xl text-white">(</span>
            <span className="text-5xl font-bold text-white">{nums[0]}</span>
            <span className="text-4xl text-white">×</span>
            <span className="text-5xl font-bold text-white">{nums[1]}</span>
            <span className="text-4xl text-white">)</span>
          </div>
          
          <span className="text-5xl text-white">×</span>
          
          <div className="text-5xl font-bold text-white backdrop-blur-xl bg-cyan-500/20 border-2 border-cyan-500/50 rounded-2xl p-6">
            {nums[2]}
          </div>
          
          <span className="text-5xl text-white">=</span>
          
          <span className="text-5xl text-yellow-400 font-bold">?</span>
        </div>

        {/* Hint */}
        <Button
          variant="outline"
          onClick={handleHint}
          className="mb-6 bg-blue-500/20 border-blue-500/50 text-white hover:bg-blue-500/30"
          disabled={showHint}
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          {showHint ? "Generating new question..." : "Need a Hint?"}
        </Button>

        {showHint && (
          <div className="backdrop-blur-xl bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 mb-6">
            <p className="text-white mb-2">
              First multiply: {nums[0]} × {nums[1]} = {nums[0] * nums[1]}
            </p>
            <p className="text-white">
              Then: {nums[0] * nums[1]} × {nums[2]} = {answer}
            </p>
          </div>
        )}

        {/* Answer options */}
        <div className="grid grid-cols-2 gap-4">
          {generateOptions().map((option) => (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              className={`
                backdrop-blur-xl border-2 rounded-2xl p-6 text-3xl font-bold
                transition-all duration-300 hover:scale-105
                ${selectedAnswer === option
                  ? option === answer
                    ? "bg-green-500/30 border-green-500 text-green-400"
                    : "bg-red-500/30 border-red-500 text-red-400"
                  : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                }
              `}
              disabled={selectedAnswer !== null}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
