import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb, Zap, Pause, Play, Heart } from "lucide-react";
import { toast } from "sonner";
import Leaderboard from "./Leaderboard";
import GameOverScreen from "./GameOverScreen";

interface ZeroVoidGameProps {
  levelNumber: number;
  onComplete: (score: number, stars: number, timeTaken: number) => void;
  onWrongAnswer?: () => void;
}

export default function ZeroVoidGame({ levelNumber, onComplete, onWrongAnswer }: ZeroVoidGameProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [number, setNumber] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [zapped, setZapped] = useState(false);
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
    const max = difficulty * 10 + 10;
    setNumber(Math.floor(Math.random() * max) + 1);
    setSelectedAnswer(null);
    setShowHint(false);
    setZapped(false);
  };

  const generateOptions = () => {
    const correct = 0;
    const optionsSet = new Set<number>([correct]);
    
    // Generate 3 unique wrong answers
    const wrongAnswers = [number, number * 2, number + 10, number - 5, 1, number * 3];
    
    for (const option of wrongAnswers) {
      if (optionsSet.size >= 4) break;
      if (option > 0 && !optionsSet.has(option)) {
        optionsSet.add(option);
      }
    }
    
    // Fill remaining slots if needed with random numbers
    while (optionsSet.size < 4) {
      const randomWrong = Math.floor(Math.random() * (number * 3 + 20)) + 1;
      if (!optionsSet.has(randomWrong)) {
        optionsSet.add(randomWrong);
      }
    }
    
    return Array.from(optionsSet).sort(() => Math.random() - 0.5);
  };

  const handleZap = () => {
    setZapped(true);
    setTimeout(() => setZapped(false), 1000);
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
    
    if (ans === 0) {
      setScore(score + 10);
      toast.success("Perfect! The Zero Beam vanished it! ⚡");
      
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
      
      if (newLives <= 0) {
        toast.error("Game Over! All hearts lost!");
        setTimeout(() => {
          setShowGameOver(true);
        }, 1500);
      } else {
        toast.error("Not quite! Remember, anything times zero becomes zero!");
        setTimeout(() => {
          setSelectedAnswer(null);
        }, 1000);
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
            <div className="text-gray-400 text-2xl font-bold">
              Score: {score}
            </div>
          </div>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-gray-500 to-slate-600 h-full rounded-full transition-all duration-500"
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
          Fire the Zero-Vanish Beam! ⚡
        </h2>

        {/* Equation with zap effect */}
        <div className="flex items-center justify-center gap-6 mb-12">
          <div className={`backdrop-blur-xl bg-blue-500/20 border-2 border-blue-500/50 rounded-2xl p-10 transition-all duration-500 ${zapped ? 'opacity-20 scale-90' : ''}`}>
            <p className="text-7xl font-bold text-white">{number}</p>
          </div>
          
          <span className="text-6xl text-white">×</span>
          
          <div className="relative">
            <div className="backdrop-blur-xl bg-gradient-to-br from-gray-600/30 to-slate-700/30 border-2 border-gray-500/50 rounded-2xl p-10">
              <p className="text-7xl font-bold text-gray-300">0</p>
            </div>
            <Button
              onClick={handleZap}
              className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-500 to-orange-500"
            >
              <Zap className="w-4 h-4 mr-2" />
              Fire Beam!
            </Button>
          </div>
          
          <span className="text-6xl text-white">=</span>
          
          <span className="text-6xl text-gray-400 font-bold">?</span>
        </div>

        {/* Spacing for button */}
        <div className="h-12" />

        {/* Hint */}
        <Button
          variant="outline"
          onClick={handleHint}
          className="mb-6 bg-gray-500/20 border-gray-500/50 text-white hover:bg-gray-500/30"
          disabled={showHint}
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          {showHint ? "Generating new question..." : "Need a Hint?"}
        </Button>

        {showHint && (
          <div className="backdrop-blur-xl bg-gray-500/20 border border-gray-500/50 rounded-xl p-4 mb-6">
            <p className="text-white text-lg">
              ⚡ The Zero Beam makes everything disappear!
            </p>
            <p className="text-white/70 text-sm mt-2">
              Any number × 0 = 0
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
                  ? option === 0
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
