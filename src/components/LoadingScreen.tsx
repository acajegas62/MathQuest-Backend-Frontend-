import { useEffect, useState } from "react";

interface LoadingScreenProps {
  isLoading: boolean;
}

const LoadingScreen = ({ isLoading }: LoadingScreenProps) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-300 ${
        isLoading ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-2xl" />
          <img
            src="/logo.png"
            alt="MathQuest Logo"
            className="relative h-24 w-24 animate-pulse"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-1 w-48 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full animate-[slide-in-right_1s_ease-in-out_infinite] bg-gradient-to-r from-primary via-secondary to-accent" />
          </div>
          <p className="text-sm text-muted-foreground">Loading MathQuest...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
