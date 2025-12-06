import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb, Sparkles, Pause, Play, Heart } from "lucide-react";
import { toast } from "sonner";
import Leaderboard from "./Leaderboard";
import GameOverScreen from "./GameOverScreen";

interface OneDerGameProps {
  levelNumber: number;
  onComplete: (score: number, stars: number, timeTaken: number) => void;
  onWrongAnswer?: () => void;
}

export default function OneDerGame({ levelNumber, onComplete, onWrongAnswer }: OneDerGameProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [number, setNumber] = useState(0);
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
    const max = difficulty * 10 + 10;
    setNumber(Math.floor(Math.random() * max) + 1);
    setSelectedAnswer(null);
    setShowHint(false);
  };

  const generateOptions = () => {
    const correct = number;
    const options = [correct];
    
    while (options.length < 4) {
      const wrong = correct + Math.floor(Math.random() * 10) - 5;
      if (wrong > 0 && wrong !== correct && !options.includes(wrong)) {
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
    
    if (ans === number) {
      setScore(score + 10);
      toast.success("Magical! The number kept its identity! ✨");
      
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
        toast.error("Not quite! Remember, multiplying by 1 doesn't change the number!");
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
            <div className="text-yellow-400 text-2xl font-bold">
              Score: {score}
            </div>
          </div>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full transition-all duration-500"
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
          Use the Multiply by 1 Potion! 🧪
        </h2>

        {/* Equation with magical potion */}
        <div className="flex items-center justify-center gap-6 mb-12">
          <div className="backdrop-blur-xl bg-yellow-500/20 border-2 border-yellow-500/50 rounded-2xl p-10 relative">
            <p className="text-7xl font-bold text-white">{number}</p>
            <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-yellow-400 animate-pulse" />
          </div>
          
          <span className="text-6xl text-white">×</span>
          
          <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-purple-500/50 rounded-2xl p-10 relative animate-pulse">
            <p className="text-7xl font-bold text-purple-300">1</p>
            <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-purple-300">
              Magic Potion
            </span>
          </div>
          
          <span className="text-6xl text-white">=</span>
          
          <span className="text-6xl text-yellow-400 font-bold">?</span>
        </div>

        {/* Hint */}
        <Button
          variant="outline"
          onClick={handleHint}
          className="mb-6 bg-purple-500/20 border-purple-500/50 text-white hover:bg-purple-500/30"
          disabled={showHint}
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          {showHint ? "Generating new question..." : "Need a Hint?"}
        </Button>

        {showHint && (
          <div className="backdrop-blur-xl bg-purple-500/20 border border-purple-500/50 rounded-xl p-4 mb-6">
            <p className="text-white text-lg">
              ✨ The magic of multiplying by 1 is that nothing changes!
            </p>
            <p className="text-white/70 text-sm mt-2">
              {number} × 1 = {number}
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
                  ? option === number
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
