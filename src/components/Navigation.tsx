import { Link } from "react-router-dom";
import { Home, Map, Info, Mail, ClipboardList } from "lucide-react";
import logo from "@/assets/logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-6 flex items-center justify-center">
      <div className="flex items-center">
        {/* Centered Navigation Links Container */}
        <div className="flex items-center gap-1 px-6 py-3 rounded-full bg-muted/80 backdrop-blur-md shadow-lg">
          {/* Logo inside navigation bar */}
          <Link to="/" className="flex items-center gap-2 px-2 mr-2">
            <img src={logo} alt="MathQuest Logo" className="w-8 h-8 object-contain" />
            <span className="text-lg font-semibold text-foreground">MathQuest</span>
          </Link>
          
          <div className="w-px h-6 bg-border mx-2" />
          <Link 
            to="/" 
            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground/80 hover:text-foreground transition-colors rounded-full hover:bg-background/50"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <Link 
            to="/login" 
            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground/80 hover:text-foreground transition-colors rounded-full hover:bg-background/50"
          >
            <Map className="h-4 w-4" />
            <span>View Live Map</span>
          </Link>
          <Link 
            to="/about" 
            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground/80 hover:text-foreground transition-colors rounded-full hover:bg-background/50"
          >
            <Info className="h-4 w-4" />
            <span>About</span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 text-sm text-foreground/80 hover:text-foreground transition-colors rounded-full hover:bg-background/50 outline-none">
              <ClipboardList className="h-4 w-4" />
              <span>Survey</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="bg-background/95 backdrop-blur-md">
              <DropdownMenuItem asChild>
                <a 
                  href="https://docs.google.com/forms/d/e/1FAIpQLSfuidKWaEB5qjVLABG_T3AhMf0ikY_36ZXb1iEFNOB07cCXvg/formResponse" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  Pre-Test
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a 
                  href="https://docs.google.com/forms/d/e/1FAIpQLSeLxxqPqOjgOSLfU-p5JUuMyI_a8mZ-JUw1Dd6b3aAZAd_Rtg/formResponse" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  Post-Test
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a 
                  href="https://docs.google.com/forms/d/e/1FAIpQLSdpBRYTFR6JPfTyN3vlIKPLvbUjXxKouHYzntzdIsjN-R2Zeg/viewform?usp=header" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  Feedback
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link 
            to="#contact" 
            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground/80 hover:text-foreground transition-colors rounded-full hover:bg-background/50"
          >
            <Mail className="h-4 w-4" />
            <span>Contact</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
