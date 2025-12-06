import { UserPlus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function GuestBanner() {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Info className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <p className="font-semibold text-amber-200">Playing as Guest</p>
          <p className="text-sm text-amber-300/70">Your progress is saved locally. Sign up to save it permanently!</p>
        </div>
      </div>
      <Button
        onClick={() => navigate("/signup")}
        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2"
      >
        <UserPlus className="h-4 w-4" />
        Sign Up
      </Button>
    </div>
  );
}
