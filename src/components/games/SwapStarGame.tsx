import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb, Heart, Rocket, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import Leaderboard from "./Leaderboard";

interface SwapStarGameProps {
  levelNumber: number;
  onComplete: (score: number, stars: number, timeTaken: number) => void;
  onWrongAnswer?: () => void;
}

interface FallingBlock {
  id: number;
  value: number;
  x: number;
  y: number;
  isCorrect: boolean;
  breaking?: boolean;
  breakType?: 'correct' | 'wrong';
}

interface Bullet {
  id: number;
  x: number;
  y: number;
}

export default function SwapStarGame({ levelNumber, onComplete, onWrongAnswer }: SwapStarGameProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lives, setLives] = useState(3);
  const [shipPosition, setShipPosition] = useState(50);
  const [fallingBlocks, setFallingBlocks] = useState<FallingBlock[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [gameActive, setGameActive] = useState(true);
  const startTime = useRef(Date.now());
  const pausedTime = useRef(0);
  const pauseStart = useRef(0);
  const animationFrame = useRef<number>();
  const bulletIdCounter = useRef(0);
  const blockIdCounter = useRef(0);
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const totalQuestions = 5 + (levelNumber * 2);

  const generateQuestion = useCallback(() => {
    const difficulty = levelNumber;
    const max = difficulty * 3 + 5;
    const n1 = Math.floor(Math.random() * max) + 1;
    const n2 = Math.floor(Math.random() * max) + 1;
    setNum1(n1);
    setNum2(n2);
    setAnswer(n1 * n2);
    setShowHint(false);
    setGameActive(true);

    // Generate falling blocks
    const correct = n1 * n2;
    const options = [correct];
    
    while (options.length < 4) {
      const wrong = correct + Math.floor(Math.random() * 20) - 10;
      if (wrong > 0 && !options.includes(wrong)) {
        options.push(wrong);
      }
    }

    const shuffled = options.sort(() => Math.random() - 0.5);
    const blocks: FallingBlock[] = shuffled.map((value, index) => ({
      id: blockIdCounter.current++,
      value,
      x: 15 + (index * 22.5),
      y: 25,
      isCorrect: value === correct
    }));

    setFallingBlocks(blocks);
  }, [levelNumber]);

  useEffect(() => {
    generateQuestion();
  }, [currentQuestion, generateQuestion]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault();
        setIsPaused(prev => {
          if (!prev) {
            pauseStart.current = Date.now();
          } else {
            pausedTime.current += Date.now() - pauseStart.current;
          }
          return !prev;
        });
        return;
      }

      if (isPaused) return;

      keysPressed.current[e.key] = true;
      
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (gameActive) {
          setBullets(prev => [...prev, {
            id: bulletIdCounter.current++,
            x: shipPosition,
            y: 85
          }]);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [shipPosition, gameActive, isPaused]);

  // Game loop
  useEffect(() => {
    const gameLoop = () => {
      if (!gameActive || isPaused) return;

      // Move ship
      if (keysPressed.current['ArrowLeft'] && shipPosition > 5) {
        setShipPosition(prev => Math.max(5, prev - 0.5));
      }
      if (keysPressed.current['ArrowRight'] && shipPosition < 95) {
        setShipPosition(prev => Math.min(95, prev + 0.5));
      }

      // Move bullets
      setBullets(prev => prev
        .map(bullet => ({ ...bullet, y: bullet.y - 2 }))
        .filter(bullet => bullet.y > 0)
      );

      // Check collisions
      setBullets(prevBullets => {
        let bulletsToKeep = [...prevBullets];
        let blocksToBreak: { id: number; isCorrect: boolean }[] = [];

        prevBullets.forEach(bullet => {
          fallingBlocks.forEach(block => {
            if (block.breaking) return;
            if (blocksToBreak.some(b => b.id === block.id)) return;
            
            const distance = Math.sqrt(
              Math.pow(bullet.x - (block.x + 2.5), 2) + 
              Math.pow(bullet.y - (block.y + 5), 2)
            );

            if (distance < 6) {
              blocksToBreak.push({ id: block.id, isCorrect: block.isCorrect });
              bulletsToKeep = bulletsToKeep.filter(b => b.id !== bullet.id);
            }
          });
        });

        if (blocksToBreak.length > 0) {
          // Start breaking animation
          setFallingBlocks(prev => prev.map(block => {
            const breakInfo = blocksToBreak.find(b => b.id === block.id);
            if (breakInfo) {
              return { 
                ...block, 
                breaking: true, 
                breakType: breakInfo.isCorrect ? 'correct' : 'wrong' 
              };
            }
            return block;
          }));

          // Handle the hit after animation delay
          blocksToBreak.forEach(blockInfo => {
            if (blockInfo.isCorrect) {
              setScore(prev => prev + 10);
              toast.success("Correct! 🌟");
              setGameActive(false);
              
              setTimeout(() => {
                if (currentQuestion + 1 >= totalQuestions) {
                  const timeTaken = Math.floor((Date.now() - startTime.current - pausedTime.current) / 1000);
                  const earnedStars = score >= totalQuestions * 8 ? 3 : score >= totalQuestions * 5 ? 2 : 1;
                  setShowLeaderboard(true);
                  setTimeout(() => {
                    onComplete(score + 10, earnedStars, timeTaken);
                  }, 3000);
                } else {
                  setCurrentQuestion(prev => prev + 1);
                }
              }, 1500);
            } else {
              const newLives = lives - 1;
              setLives(newLives);
              
              if (newLives <= 0) {
                toast.error("Out of lives! Restarting from question 1...");
                setGameActive(false);
                setTimeout(() => {
                  setLives(3);
                  setCurrentQuestion(0);
                  setScore(0);
                }, 1500);
              } else {
                toast.error("Wrong answer!");
              }
              onWrongAnswer?.();
            }
          });

          // Remove broken blocks after animation
          setTimeout(() => {
            setFallingBlocks(prev => prev.filter(block => !blocksToBreak.some(b => b.id === block.id)));
          }, 500);
        }

        return bulletsToKeep;
      });

      animationFrame.current = requestAnimationFrame(gameLoop);
    };

    animationFrame.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [gameActive, isPaused, shipPosition, fallingBlocks, currentQuestion, totalQuestions, score, onComplete]);

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

  const handleHint = () => {
    if (!showHint) {
      toast.info("Hint used! Generating new question...");
      setShowHint(true);
      setTimeout(() => {
        generateQuestion();
      }, 2000);
    }
  };

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
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Game Area */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 mb-6">
        {/* Question at top */}
        <div className="text-center mb-4">
          <h2 className="text-2xl text-white mb-3">
            Shoot the correct answer!
          </h2>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-bold text-purple-400">{num1}</span>
            <span className="text-3xl text-white">×</span>
            <span className="text-4xl font-bold text-pink-400">{num2}</span>
            <span className="text-3xl text-white">=</span>
            <span className="text-4xl text-yellow-400 font-bold">?</span>
          </div>
        </div>

        {/* Hint Button */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="outline"
            onClick={handleHint}
            className="bg-blue-500/20 border-blue-500/50 text-white hover:bg-blue-500/30"
            disabled={showHint}
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            {showHint ? "Generating..." : "Hint"}
          </Button>
        </div>

        {showHint && (
          <div className="absolute top-16 right-4 backdrop-blur-xl bg-blue-500/20 border border-blue-500/50 rounded-xl p-3 max-w-xs z-10">
            <p className="text-white text-sm">
              {num1} × {num2} = {num2} × {num1}
            </p>
            <p className="text-white/70 text-xs mt-1">
              Both give the same answer!
            </p>
          </div>
        )}

        {/* Game Play Area */}
        <div className="relative w-full bg-gradient-to-b from-indigo-900/20 to-purple-900/20 rounded-2xl border border-white/10" style={{ height: '500px' }}>
          {/* Falling Blocks */}
          {fallingBlocks.map(block => (
            <div
              key={block.id}
              className={`absolute backdrop-blur-xl border-2 rounded-lg flex items-center justify-center shadow-lg transition-all duration-300 ${
                block.breaking
                  ? block.breakType === 'correct'
                    ? 'bg-gradient-to-br from-green-500/80 to-emerald-500/80 border-green-400 animate-ping shadow-green-500/50'
                    : 'bg-gradient-to-br from-red-500/80 to-rose-500/80 border-red-400 animate-ping shadow-red-500/50'
                  : 'bg-gradient-to-br from-orange-500/60 to-red-500/60 border-orange-400 shadow-orange-500/30'
              }`}
              style={{
                left: `${block.x}%`,
                top: `${block.y}%`,
                width: '70px',
                height: '70px',
                transform: `translate(-50%, -50%) ${block.breaking ? 'scale(1.2)' : 'scale(1)'}`,
                opacity: block.breaking ? 0.5 : 1
              }}
            >
              <span className={`text-2xl font-bold ${block.breaking ? 'text-white' : 'text-white'}`}>
                {block.value}
              </span>
            </div>
          ))}

          {/* Bullets */}
          {bullets.map(bullet => (
            <div
              key={bullet.id}
              className="absolute w-2 h-6 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50"
              style={{
                left: `${bullet.x}%`,
                top: `${bullet.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}

          {/* Spaceship at bottom */}
          <div
            className="absolute z-20"
            style={{
              left: `${shipPosition}%`,
              bottom: '20px',
              transform: 'translateX(-50%)'
            }}
          >
            <div className="relative">
              <Rocket className="w-14 h-14 text-blue-400 fill-blue-500 drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))' }} />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-gradient-to-t from-orange-400 to-transparent rounded-full blur-sm animate-pulse" />
            </div>
          </div>

          {/* Controls hint */}
          <div className="absolute bottom-2 left-2 text-white/50 text-xs">
            <div>← → Move | Space Shoot | P Pause</div>
          </div>

          {/* Pause Overlay */}
          {isPaused && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl">
              <div className="text-center">
                <Pause className="w-20 h-20 text-white mx-auto mb-4" />
                <h3 className="text-4xl font-bold text-white mb-2">PAUSED</h3>
                <p className="text-white/70">Press P or ESC to continue</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
