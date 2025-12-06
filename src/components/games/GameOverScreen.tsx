import { X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface GameOverScreenProps {
  score: number;
  onTryAgain: () => void;
  onExit: () => void;
}

export default function GameOverScreen({
  score,
  onTryAgain,
  onExit,
}: GameOverScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-red-950 to-slate-950 flex items-center justify-center relative overflow-hidden">
      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-red-500/30 rounded-full animate-pulse"
            style={{
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              animationDelay: Math.random() * 2 + "s",
            }}
          />
        ))}
      </div>

      <motion.div 
        className="backdrop-blur-xl bg-white/10 border border-red-500/30 rounded-3xl p-12 max-w-2xl w-full mx-4 text-center relative z-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        {/* Broken Heart Icon */}
        <motion.div 
          className="mb-8"
          initial={{ rotate: -45, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <div className="w-32 h-32 mx-auto relative">
            <X className="w-32 h-32 text-red-500 absolute inset-0" strokeWidth={3} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1 
          className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Game Over!
        </motion.h1>

        <motion.p
          className="text-xl text-white/80 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          All hearts lost, but don't give up!
        </motion.p>

        {/* Score */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-2xl text-white mb-2">Final Score</p>
          <p className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {score}
          </p>
        </motion.div>

        {/* Encouragement message */}
        <motion.div 
          className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-white text-lg">
            💪 Practice makes perfect! Try again to improve your score.
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div 
          className="flex gap-4 justify-center flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            onClick={onTryAgain}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg px-8 py-6"
            size="lg"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={onExit}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-lg px-8 py-6"
            size="lg"
          >
            Exit
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
