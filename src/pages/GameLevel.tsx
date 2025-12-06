import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import SwapStarGame from "@/components/games/SwapStarGame";
import PacManMathGame from "@/components/games/PacManMathGame";
import OneDerGame from "@/components/games/OneDerGame";
import ZeroVoidGame from "@/components/games/ZeroVoidGame";
import BreakNBuildGame from "@/components/games/BreakNBuildGame";
import VictoryScreen from "@/components/games/VictoryScreen";

const GAME_COMPONENTS: Record<string, React.ComponentType<any>> = {
  "swap-star": SwapStarGame,
  "groupara": PacManMathGame,
  "one-der": OneDerGame,
  "zero-void": ZeroVoidGame,
  "break-n-build": BreakNBuildGame,
};

export default function GameLevel() {
  const { planetId, levelNumber } = useParams();
  const navigate = useNavigate();
  const [gameComplete, setGameComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);

  const GameComponent = planetId ? GAME_COMPONENTS[planetId] : null;

  const handleComplete = (finalScore: number, earnedStars: number, time: number) => {
    setScore(finalScore);
    setStars(earnedStars);
    setTimeTaken(time);
    setGameComplete(true);
  };

  if (!GameComponent || !planetId || !levelNumber) {
    return <div>Game not found</div>;
  }

  if (gameComplete) {
    return (
      <VictoryScreen
        planetId={planetId}
        levelNumber={parseInt(levelNumber)}
        score={score}
        stars={stars}
        timeTaken={timeTaken}
        onContinue={() => navigate(`/student/story-mode/${planetId}`)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate(`/student/story-mode/${planetId}`)}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Levels
        </button>

        <GameComponent levelNumber={parseInt(levelNumber)} onComplete={handleComplete} />
      </div>
    </div>
  );
}
