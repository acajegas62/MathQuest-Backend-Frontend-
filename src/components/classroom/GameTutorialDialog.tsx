import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lightbulb, Play } from "lucide-react";

interface GameTutorialDialogProps {
  open: boolean;
  onClose: () => void;
  planetId: string;
  planetName: string;
  planetColor: string;
}

const TUTORIALS: Record<string, any> = {
  "swap-star": {
    title: "How to Play Swap-Star",
    property: "Commutative Property",
    explanation: "Numbers can be swapped (flipped) in multiplication and the answer stays the same!",
    steps: [
      "You'll see two numbers being multiplied",
      "Notice how swapping them gives the same result",
      "Choose the correct answer from 4 options",
      "You have 3 lives - lose all lives and restart from question 1"
    ],
    examples: [
      { equation: "3 × 4 = 12", swapped: "4 × 3 = 12" },
      { equation: "2 × 5 = 10", swapped: "5 × 2 = 10" },
      { equation: "6 × 2 = 12", swapped: "2 × 6 = 12" }
    ]
  },
  "groupara": {
    title: "How to Play Groupara",
    property: "Associative Property",
    explanation: "You can group numbers in different ways and still get the same answer!",
    steps: [
      "You'll see three numbers to multiply",
      "Numbers are grouped with parentheses ( )",
      "Group the first two, multiply, then multiply by the third",
      "You have 3 lives - lose all lives and restart from question 1"
    ],
    examples: [
      { equation: "(2 × 3) × 4 = 6 × 4 = 24", swapped: "2 × (3 × 4) = 2 × 12 = 24" },
      { equation: "(1 × 5) × 2 = 5 × 2 = 10", swapped: "1 × (5 × 2) = 1 × 10 = 10" }
    ]
  },
  "one-der": {
    title: "How to Play One-der",
    property: "Identity Property",
    explanation: "Any number multiplied by 1 stays the same - it keeps its identity!",
    steps: [
      "You'll see numbers multiplied by 1",
      "The answer always equals the original number",
      "Choose the correct answer from 4 options",
      "You have 3 lives - lose all lives and restart from question 1"
    ],
    examples: [
      { equation: "7 × 1 = 7", swapped: "1 × 7 = 7" },
      { equation: "25 × 1 = 25", swapped: "1 × 25 = 25" },
      { equation: "100 × 1 = 100", swapped: "1 × 100 = 100" }
    ]
  },
  "zero-void": {
    title: "How to Play Zero-Void",
    property: "Zero Property",
    explanation: "Any number multiplied by zero equals zero - everything vanishes!",
    steps: [
      "You'll see numbers multiplied by 0",
      "The answer is ALWAYS zero, no matter the number",
      "Choose the correct answer from 4 options",
      "You have 3 lives - lose all lives and restart from question 1"
    ],
    examples: [
      { equation: "5 × 0 = 0", swapped: "0 × 5 = 0" },
      { equation: "99 × 0 = 0", swapped: "0 × 99 = 0" },
      { equation: "1000 × 0 = 0", swapped: "0 × 1000 = 0" }
    ]
  },
  "break-n-build": {
    title: "How to Play Break-N-Build",
    property: "Distributive Property",
    explanation: "Break a number apart, multiply each piece, then add them together!",
    steps: [
      "You'll see an equation like: 3 × (4 + 2)",
      "Break it: multiply 3 by each number inside",
      "Build it: (3 × 4) + (3 × 2) = 12 + 6 = 18",
      "You have 3 lives - lose all lives and restart from question 1"
    ],
    examples: [
      { equation: "3 × (4 + 2)", swapped: "(3 × 4) + (3 × 2) = 12 + 6 = 18" },
      { equation: "2 × (5 + 3)", swapped: "(2 × 5) + (2 × 3) = 10 + 6 = 16" }
    ]
  }
};

export default function GameTutorialDialog({
  open,
  onClose,
  planetId,
  planetName,
  planetColor
}: GameTutorialDialogProps) {
  const tutorial = TUTORIALS[planetId];

  if (!tutorial) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${planetColor}`}>
            {tutorial.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Property explanation */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-3">
              <Lightbulb className="w-6 h-6 text-primary mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-2">{tutorial.property}</h3>
                <p className="text-muted-foreground">{tutorial.explanation}</p>
              </div>
            </div>
          </div>

          {/* How to play steps */}
          <div>
            <h3 className="text-xl font-bold mb-4">How to Play:</h3>
            <div className="space-y-3">
              {tutorial.steps.map((step: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold">{index + 1}</span>
                  </div>
                  <p className="pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Examples */}
          <div>
            <h3 className="text-xl font-bold mb-4">Examples:</h3>
            <div className="space-y-4">
              {tutorial.examples.map((example: any, index: number) => (
                <div key={index} className="bg-secondary/50 rounded-lg p-4">
                  <div className="font-mono text-lg mb-2">
                    <span className="text-primary font-bold">Example {index + 1}:</span>
                  </div>
                  <div className="font-mono space-y-2">
                    <div className="text-base">✓ {example.equation}</div>
                    <div className="text-base text-muted-foreground">✓ {example.swapped}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Start button */}
          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              onClick={onClose}
              className={`bg-gradient-to-r ${planetColor} text-white text-lg px-8 py-6 hover:scale-105 transition-transform`}
            >
              <Play className="w-5 h-5 mr-2" />
              Start Playing!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
