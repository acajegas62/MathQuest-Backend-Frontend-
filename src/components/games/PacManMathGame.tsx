import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Pause, Play } from "lucide-react";
import { toast } from "sonner";

interface PacManMathGameProps {
  levelNumber: number;
  onComplete: (score: number, stars: number, timeTaken: number) => void;
}

interface Position {
  x: number;
  y: number;
}

interface Ghost {
  x: number;
  y: number;
  color: string;
  direction: { dx: number; dy: number };
}

interface AnswerPellet {
  x: number;
  y: number;
  value: number;
  isCorrect: boolean;
}

const CELL_SIZE = 30;
const PLAYER_SPEED = 0.04; // Grid units per frame (slower)
const GHOST_SPEED = 0.02; // Grid units per frame (slower)

export default function PacManMathGame({ levelNumber, onComplete }: PacManMathGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [slowedDown, setSlowedDown] = useState(false);
  
  const startTime = useRef(Date.now());
  const pausedTime = useRef(0);
  const pauseStart = useRef(0);
  
  const playerRef = useRef<Position>({ x: 1.5, y: 1.5 }); // Center of cell
  const velocityRef = useRef({ dx: 0, dy: 0 });
  const ghostsRef = useRef<Ghost[]>([]);
  const answersRef = useRef<AnswerPellet[]>([]);
  const mazeRef = useRef<number[][]>([]);
  const animationRef = useRef<number>();
  
  const [question, setQuestion] = useState({ num1: 0, num2: 0, num3: 0, correctAnswer: 0 });
  const [gameWon, setGameWon] = useState(false);

  // Generate maze based on level
  const generateMaze = useCallback((level: number) => {
    const sizes = [
      { width: 21, height: 13 },   // Level 1
      { width: 23, height: 15 },  // Level 2
      { width: 25, height: 17 },  // Level 3
      { width: 27, height: 19 },  // Boss
    ];
    
    const size = sizes[Math.min(level - 1, 3)];
    const maze: number[][] = [];
    
    // Create simple maze (0 = path, 1 = wall, 2 = path with dot)
    for (let y = 0; y < size.height; y++) {
      maze[y] = [];
      for (let x = 0; x < size.width; x++) {
        // Borders are walls
        if (x === 0 || x === size.width - 1 || y === 0 || y === size.height - 1) {
          maze[y][x] = 1;
        }
        // Create some internal walls with better spacing
        else if ((x % 3 === 0 && y % 3 === 0) || (x % 4 === 2 && y % 2 === 0)) {
          maze[y][x] = 1;
        } else {
          maze[y][x] = 2; // Path with collectible dots
        }
      }
    }
    
    return maze;
  }, []);

  // Generate associative property question
  const generateQuestion = useCallback((level: number) => {
    const max = 4 + level;
    const num1 = Math.floor(Math.random() * max) + 2;
    const num2 = Math.floor(Math.random() * max) + 2;
    const num3 = Math.floor(Math.random() * max) + 2;
    const correctAnswer = num1 * num2 * num3;
    
    return { num1, num2, num3, correctAnswer };
  }, []);

  // Helper function to find valid empty positions
  const findValidPosition = useCallback((maze: number[][], occupied: Position[]): Position => {
    const maxAttempts = 100;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = Math.floor(Math.random() * (maze[0].length - 4)) + 2;
      const y = Math.floor(Math.random() * (maze.length - 4)) + 2;
      
      // Check if position is not a wall and not occupied
      if (maze[y][x] !== 1) {
        const tooClose = occupied.some(pos => 
          Math.abs(pos.x - x) < 3 && Math.abs(pos.y - y) < 3
        );
        if (!tooClose) {
          return { x, y };
        }
      }
    }
    // Fallback to a safe position
    return { x: 2, y: 2 };
  }, []);

  // Initialize game
  useEffect(() => {
    const maze = generateMaze(levelNumber);
    mazeRef.current = maze;
    
    const q = generateQuestion(levelNumber);
    setQuestion(q);
    
    // Place player at starting position (center of cell)
    playerRef.current = { x: 1.5, y: 1.5 };
    
    const occupied: Position[] = [{ x: 1, y: 1 }];
    
    // Generate answer pellets in valid positions
    const answers: AnswerPellet[] = [];
    const correctAnswer = q.correctAnswer;
    
    // Generate wrong answers
    const wrongAnswers = new Set<number>();
    while (wrongAnswers.size < 3) {
      const offset = Math.floor(Math.random() * 20) - 10;
      const wrong = correctAnswer + offset;
      if (wrong > 0 && wrong !== correctAnswer) {
        wrongAnswers.add(wrong);
      }
    }
    
    // Create answer options and shuffle
    const answerOptions = [
      { value: correctAnswer, isCorrect: true },
      ...Array.from(wrongAnswers).map(val => ({ value: val, isCorrect: false }))
    ].sort(() => Math.random() - 0.5);
    
    // Place answers in valid, non-overlapping positions
    answerOptions.forEach(option => {
      const pos = findValidPosition(maze, occupied);
      answers.push({ ...pos, ...option });
      occupied.push(pos);
    });
    
    answersRef.current = answers;
    
    // Initialize ghosts in valid positions
    const ghostCount = Math.min(levelNumber, 4);
    const ghostColors = ["#FF0000", "#00FFFF", "#FFB8FF", "#FFB852"];
    const ghosts: Ghost[] = [];
    
    for (let i = 0; i < ghostCount; i++) {
      const pos = findValidPosition(maze, occupied);
      ghosts.push({
        x: pos.x + 0.5, // Center in cell
        y: pos.y + 0.5,
        color: ghostColors[i],
        direction: { dx: Math.random() > 0.5 ? 1 : -1, dy: 0 },
      });
      occupied.push(pos);
    }
    
    ghostsRef.current = ghosts;
    setGameStarted(true);
  }, [levelNumber, generateMaze, generateQuestion, findValidPosition]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault();
        togglePause();
        return;
      }
      
      if (isPaused || frozen) return;
      
      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') {
        velocityRef.current = { dx: 0, dy: -1 };
      } else if (key === 'arrowdown' || key === 's') {
        velocityRef.current = { dx: 0, dy: 1 };
      } else if (key === 'arrowleft' || key === 'a') {
        velocityRef.current = { dx: -1, dy: 0 };
      } else if (key === 'arrowright' || key === 'd') {
        velocityRef.current = { dx: 1, dy: 0 };
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, frozen]);

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

  // Check if grid position is valid (not a wall)
  const isValidGridPosition = (gridX: number, gridY: number): boolean => {
    const maze = mazeRef.current;
    if (gridY < 0 || gridY >= maze.length || gridX < 0 || gridX >= maze[0].length) {
      return false;
    }
    return maze[gridY][gridX] !== 1;
  };

  // Check if an entity can move to a position (checking bounding box)
  const canMoveTo = (x: number, y: number, size: number = 0.4): boolean => {
    // Check all four corners of the entity's bounding box
    const corners = [
      { x: x - size, y: y - size }, // top-left
      { x: x + size, y: y - size }, // top-right
      { x: x - size, y: y + size }, // bottom-left
      { x: x + size, y: y + size }  // bottom-right
    ];
    
    for (const corner of corners) {
      const gridX = Math.floor(corner.x);
      const gridY = Math.floor(corner.y);
      if (!isValidGridPosition(gridX, gridY)) {
        return false;
      }
    }
    
    return true;
  };

  // Keyboard controls
  useEffect(() => {
    if (!gameStarted || isPaused || gameWon) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      // Prevent page scrolling
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        e.preventDefault();
      }

      switch (key) {
        case 'arrowup':
        case 'w':
          velocityRef.current = { dx: 0, dy: -1 };
          break;
        case 'arrowdown':
        case 's':
          velocityRef.current = { dx: 0, dy: 1 };
          break;
        case 'arrowleft':
        case 'a':
          velocityRef.current = { dx: -1, dy: 0 };
          break;
        case 'arrowright':
        case 'd':
          velocityRef.current = { dx: 1, dy: 0 };
          break;
        case 'p':
        case 'escape':
          togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, isPaused, gameWon]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || isPaused || gameWon) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      const maze = mazeRef.current;
      const velocity = velocityRef.current;
      
      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw maze walls with rounded style
      for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
          if (maze[y][x] === 1) {
            // Draw wall with blue color and rounded corners
            ctx.fillStyle = '#1E40AF';
            ctx.strokeStyle = '#3B82F6';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(
              x * CELL_SIZE + 1, 
              y * CELL_SIZE + 1, 
              CELL_SIZE - 2, 
              CELL_SIZE - 2, 
              4
            );
            ctx.fill();
            ctx.stroke();
          } else if (maze[y][x] === 2) {
            // Draw small dots on paths
            ctx.fillStyle = '#FFE4B5';
            ctx.beginPath();
            ctx.arc(
              x * CELL_SIZE + CELL_SIZE / 2,
              y * CELL_SIZE + CELL_SIZE / 2,
              2,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        }
      }
      
      // Draw answer pellets (larger, more readable, colorful)
      const pelletColors = ['#FFD700', '#FF1493', '#00CED1', '#32CD32'];
      answersRef.current.forEach((pellet, index) => {
        // Draw glowing outer ring
        const gradient = ctx.createRadialGradient(
          pellet.x * CELL_SIZE + CELL_SIZE / 2,
          pellet.y * CELL_SIZE + CELL_SIZE / 2,
          CELL_SIZE / 2.5,
          pellet.x * CELL_SIZE + CELL_SIZE / 2,
          pellet.y * CELL_SIZE + CELL_SIZE / 2,
          CELL_SIZE / 1.5
        );
        gradient.addColorStop(0, pelletColors[index]);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
          pellet.x * CELL_SIZE + CELL_SIZE / 2,
          pellet.y * CELL_SIZE + CELL_SIZE / 2,
          CELL_SIZE / 1.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
        
        // Draw main pellet
        ctx.fillStyle = pelletColors[index];
        ctx.beginPath();
        ctx.arc(
          pellet.x * CELL_SIZE + CELL_SIZE / 2,
          pellet.y * CELL_SIZE + CELL_SIZE / 2,
          CELL_SIZE / 2.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
        
        // Draw white border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw answer value with shadow for better readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          pellet.value.toString(),
          pellet.x * CELL_SIZE + CELL_SIZE / 2,
          pellet.y * CELL_SIZE + CELL_SIZE / 2
        );
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      });
      
      // Update and draw ghosts with chase AI
      ghostsRef.current.forEach(ghost => {
        if (!frozen) {
          // Calculate direction towards player periodically
          if (Math.random() < 0.1) {
            const dx = playerRef.current.x - ghost.x;
            const dy = playerRef.current.y - ghost.y;
            
            // Prioritize larger distance
            if (Math.abs(dx) > Math.abs(dy)) {
              ghost.direction = { dx: dx > 0 ? 1 : -1, dy: 0 };
            } else {
              ghost.direction = { dx: 0, dy: dy > 0 ? 1 : -1 };
            }
          }
          
          // Try to move in current direction
          const nextX = ghost.x + ghost.direction.dx * GHOST_SPEED;
          const nextY = ghost.y + ghost.direction.dy * GHOST_SPEED;
          
          // Check if the ghost can move to the next position
          if (canMoveTo(nextX, nextY, 0.35)) {
            ghost.x = nextX;
            ghost.y = nextY;
          } else {
            // Hit wall, find valid direction toward player
            const directions = [
              { dx: 0, dy: -1 },
              { dx: 0, dy: 1 },
              { dx: -1, dy: 0 },
              { dx: 1, dy: 0 }
            ];
            
            // Filter and sort by distance to player
            const validDirections = directions.filter(dir => 
              canMoveTo(ghost.x + dir.dx * GHOST_SPEED, ghost.y + dir.dy * GHOST_SPEED, 0.35)
            );
            
            if (validDirections.length > 0) {
              validDirections.sort((a, b) => {
                const distA = Math.abs((ghost.x + a.dx) - playerRef.current.x) + 
                             Math.abs((ghost.y + a.dy) - playerRef.current.y);
                const distB = Math.abs((ghost.x + b.dx) - playerRef.current.x) + 
                             Math.abs((ghost.y + b.dy) - playerRef.current.y);
                return distA - distB;
              });
              ghost.direction = validDirections[0];
            } else {
              // Reverse direction
              ghost.direction = { dx: -ghost.direction.dx, dy: -ghost.direction.dy };
            }
          }
        }
        
        // Draw ghost (centered in grid)
        ctx.fillStyle = ghost.color;
        ctx.beginPath();
        ctx.arc(
          ghost.x * CELL_SIZE,
          ghost.y * CELL_SIZE,
          CELL_SIZE / 2.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
        
        // Check collision with player
        const dist = Math.hypot(
          ghost.x - playerRef.current.x,
          ghost.y - playerRef.current.y
        );
        
        if (dist < 0.7) {
          const newLives = lives - 1;
          setLives(newLives);
          toast.error("Ghost caught you!");
          
          if (newLives <= 0) {
            toast.error(`Game Over! The correct answer was ${question.correctAnswer}`);
            setTimeout(() => {
              const timeTaken = Math.floor((Date.now() - startTime.current - pausedTime.current) / 1000);
              onComplete(score, 0, timeTaken);
            }, 1000);
            return;
          } else {
            // Reset player position and regenerate question
            playerRef.current = { x: 1.5, y: 1.5 };
            velocityRef.current = { dx: 0, dy: 0 };
            
            // Generate new question and answer pellets
            const newQuestion = generateQuestion(levelNumber);
            setQuestion(newQuestion);
            
            // Regenerate answer pellets in valid positions
            const wrongAnswersSet = new Set<number>();
            while (wrongAnswersSet.size < 3) {
              const offset = Math.floor(Math.random() * 20) - 10;
              const wrong = newQuestion.correctAnswer + offset;
              if (wrong > 0 && wrong !== newQuestion.correctAnswer) {
                wrongAnswersSet.add(wrong);
              }
            }
            
            const answerOptions = [
              { value: newQuestion.correctAnswer, isCorrect: true },
              ...Array.from(wrongAnswersSet).map(val => ({ value: val, isCorrect: false }))
            ].sort(() => Math.random() - 0.5);
            
            // Place answer pellets in valid, non-overlapping positions
            const occupied: Position[] = [{ x: 1, y: 1 }];
            const newAnswers: AnswerPellet[] = [];
            
            answerOptions.forEach(option => {
              const pos = findValidPosition(maze, occupied);
              newAnswers.push({ ...pos, ...option });
              occupied.push(pos);
            });
            
            answersRef.current = newAnswers;
            
            // Reset ghosts to valid positions (centered in cells)
            const numGhosts = Math.min(levelNumber, 4);
            const ghostColors = ['#FF0000', '#00FFFF', '#FFB8FF', '#FFB852'];
            const newGhosts: Ghost[] = [];
            
            for (let i = 0; i < numGhosts; i++) {
              const pos = findValidPosition(maze, occupied);
              newGhosts.push({
                x: pos.x + 0.5, // Center in cell
                y: pos.y + 0.5,
                color: ghostColors[i],
                direction: { dx: Math.random() > 0.5 ? 1 : -1, dy: 0 }
              });
              occupied.push(pos);
            }
            
            ghostsRef.current = newGhosts;
            
            setFrozen(true);
            setTimeout(() => setFrozen(false), 1000);
          }
        }
      });
      
      // Move player with solid collision detection
      if (!frozen) {
        const player = playerRef.current;
        const velocity = velocityRef.current;
        const speed = slowedDown ? PLAYER_SPEED * 0.5 : PLAYER_SPEED;
        
        // Try horizontal movement
        if (velocity.dx !== 0) {
          const newX = player.x + velocity.dx * speed;
          if (canMoveTo(newX, player.y, 0.35)) {
            player.x = newX;
          }
        }
        
        // Try vertical movement
        if (velocity.dy !== 0) {
          const newY = player.y + velocity.dy * speed;
          if (canMoveTo(player.x, newY, 0.35)) {
            player.y = newY;
          }
        }
      }
      
      // Draw player (PAC-MAN style) - always visible
      const player = playerRef.current;
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.arc(
        player.x * CELL_SIZE,
        player.y * CELL_SIZE,
        CELL_SIZE / 2.5,
        0.2 * Math.PI,
        1.8 * Math.PI
      );
      ctx.lineTo(player.x * CELL_SIZE, player.y * CELL_SIZE);
      ctx.fill();
      
      // Check collision with answer pellets
      answersRef.current = answersRef.current.filter(pellet => {
        // Pellet positions are in grid cells, player is centered
        const pelletCenterX = pellet.x + 0.5;
        const pelletCenterY = pellet.y + 0.5;
        const dist = Math.hypot(
          pelletCenterX - player.x,
          pelletCenterY - player.y
        );
        
        if (dist < 0.7) {
          if (pellet.isCorrect) {
            toast.success("Correct answer! You win! 🎉");
            setGameWon(true);
            const timeTaken = Math.floor((Date.now() - startTime.current - pausedTime.current) / 1000);
            const finalScore = score + 100;
            const earnedStars = lives === 3 ? 3 : lives === 2 ? 2 : 1;
            setTimeout(() => {
              onComplete(finalScore, earnedStars, timeTaken);
            }, 2000);
            return false;
          } else {
            toast.error(`Wrong answer! You ate ${pellet.value}. Slowing down...`);
            setSlowedDown(true);
            setTimeout(() => setSlowedDown(false), 3000);
            setScore(Math.max(0, score - 10));
            return false;
          }
        }
        return true;
      });
      
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted, isPaused, lives, score, frozen, slowedDown, gameWon, levelNumber, question.correctAnswer, onComplete]);

  const maze = mazeRef.current;
  const canvasWidth = maze[0]?.length * CELL_SIZE || 600;
  const canvasHeight = maze.length * CELL_SIZE || 400;

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-4xl">
        <div className="flex items-center gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={`w-8 h-8 ${
                i < lives ? "fill-red-500 text-red-500" : "fill-gray-600 text-gray-600"
              }`}
            />
          ))}
        </div>
        <div className="text-2xl font-bold text-white">
          Score: {score}
        </div>
        <Button onClick={togglePause} variant="outline" size="icon">
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </Button>
      </div>

      {/* Question Display */}
      <div className="bg-purple-900/50 p-6 rounded-lg border border-purple-500">
        <p className="text-xl text-white text-center mb-2">Solve the problem:</p>
        <p className="text-3xl font-bold text-center text-white">
          ({question.num1} × {question.num2}) × {question.num3} = ?
        </p>
        <p className="text-sm text-gray-300 text-center mt-2">
          Eat the pellet with the correct answer! Choose wisely...
        </p>
      </div>

      {/* Game Canvas */}
      <div className="relative border-4 border-purple-500 rounded-lg overflow-hidden bg-slate-950">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="block"
        />
        {isPaused && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-4xl font-bold text-white">PAUSED</div>
          </div>
        )}
        {frozen && (
          <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center pointer-events-none">
            <div className="text-2xl font-bold text-white">FROZEN!</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="text-center text-white">
        <p className="text-lg mb-2">Controls: Arrow Keys or WASD to move</p>
        <p className="text-sm text-gray-400">Press P or ESC to pause</p>
        <p className="text-sm text-yellow-400 mt-2">
          Level {levelNumber} - {levelNumber} Ghost{levelNumber > 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
