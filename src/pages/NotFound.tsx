import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Rocket, Home, ArrowLeft, Mail, MessageCircle } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      <LoadingScreen isLoading={!videoLoaded} />
      
      {/* Fixed Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        onCanPlay={() => setVideoLoaded(true)}
        className="fixed inset-0 w-full h-full object-cover -z-10 pointer-events-none"
        style={{ filter: 'brightness(0.3)' }}
      >
        <source src="/auth-background.mp4" type="video/mp4" />
      </video>
      
      {/* Fixed Gradient Overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50 -z-10" />
      
      <Card className="glass-card w-full max-w-2xl p-12 rounded-3xl space-y-8 animate-fade-in border-2 border-primary/20 shadow-2xl shadow-primary/10">
        <div className="text-center space-y-6">
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center glow-primary animate-pulse-glow mb-8 shadow-lg shadow-primary/30 ring-4 ring-primary/10">
            <Rocket className="h-16 w-16 text-white drop-shadow-lg animate-bounce" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-8xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent animate-pulse-glow">
              404
            </h1>
            <h2 className="text-3xl font-bold text-foreground">
              Lost in Space!
            </h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Looks like this page drifted into a black hole. Let's get you back on course to your cosmic math adventure!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button
              onClick={() => navigate(-1)}
              className="btn-cosmic py-6 px-8 rounded-xl text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </Button>
            
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="glass-card py-6 px-8 rounded-xl text-lg font-semibold border-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Home className="mr-2 h-5 w-5" />
              Return Home
            </Button>
          </div>

          {/* Contact Section */}
          <div className="mt-12 pt-8 border-t border-border/20">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center justify-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Need Help?
            </h3>
            <p className="text-muted-foreground mb-6">
              If you believe this page should exist or need assistance, feel free to reach out to our team.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate("/contact")}
                variant="outline"
                className="glass-card py-4 px-6 rounded-xl font-semibold border-2 border-primary/30 hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Email: angelocajegas121@gmail.com
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;
