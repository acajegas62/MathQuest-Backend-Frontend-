import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Eye, Send, Sparkles, Rocket, Trophy, Star, Users, BookOpen } from "lucide-react";
import Navigation from "@/components/Navigation";
import LoadingScreen from "@/components/LoadingScreen";
import heroGalaxy from "@/assets/hero-galaxy.jpg";
import astronaut from "@/assets/astronaut-mascot.png";

const Landing = () => {
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <div className="min-h-screen relative">
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
        style={{ filter: 'brightness(0.4)' }}
      >
        <source src="/reflex-background.mp4" type="video/mp4" />
      </video>
      
      {/* Fixed Gradient Overlay for better text readability */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50 -z-10" />
      
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="container relative z-10 px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="max-w-3xl space-y-6 sm:space-y-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white">
              Every Phone a
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                MathQuest
              </span>
              .
              <br />
              Every MathQuest
              <br />
              a Learning Path.
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-200 max-w-xl leading-relaxed">
              During challenges, learning gaps leave students working blind. Critical concepts are lost, and so is progress. We must act now.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 rounded-full px-6 sm:px-8 border-2 bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white border-white/30 hover:border-white/50">
                  <Eye className="h-5 w-5" />
                  Start Learning
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 rounded-full px-6 sm:px-8 border-2 bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white border-white/30 hover:border-white/50">
                  <Send className="h-5 w-5" />
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-transparent">
        <div className="container mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-8 sm:mb-12 md:mb-16 px-4">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Explore the Universe of Learning
            </span>
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="glass-card p-6 sm:p-8 rounded-2xl sm:rounded-3xl hover:scale-105 transition-all duration-300 animate-fade-in border-2 border-primary/20 dark:border-primary/30 hover:border-primary/40 dark:hover:border-primary/50 bg-card/80 dark:bg-card/60 backdrop-blur-xl"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center mb-4 sm:mb-6 shadow-lg shadow-primary/30">
                  <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-card-foreground">{feature.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-transparent">
        <div className="container mx-auto">
          <Card className="glass-card p-8 sm:p-10 md:p-12 rounded-2xl sm:rounded-3xl max-w-4xl mx-auto text-center border-2 border-primary/30 dark:border-primary/40 bg-card/90 dark:bg-card/70 backdrop-blur-xl shadow-2xl shadow-primary/20">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-warning via-accent to-primary flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg shadow-warning/40 animate-pulse-glow">
              <Star className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 px-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Ready to Become a Math Star?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 px-4 leading-relaxed">
              Join thousands of students exploring the cosmos of mathematics!
            </p>
            <Link to="/signup">
              <Button size="lg" className="btn-cosmic text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 rounded-xl sm:rounded-2xl w-full sm:w-auto hover:scale-105 transition-transform shadow-xl">
                <Rocket className="mr-2 h-5 w-5" />
                Launch Into Space
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/30 backdrop-blur-sm py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm sm:text-base text-muted-foreground">© 2024 MathQuest Classroom. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const features = [
  {
    icon: BookOpen,
    title: "Interactive Lessons",
    description: "Learn multiplication properties through engaging video lessons and cosmic visual aids.",
  },
  {
    icon: Rocket,
    title: "Story Mode Missions",
    description: "Explore 5 galactic realms, each teaching a unique multiplication property through adventure.",
  },
  {
    icon: Trophy,
    title: "Earn Cosmic Badges",
    description: "Unlock achievements and collect stellar badges as you master mathematical concepts.",
  },
  {
    icon: Star,
    title: "XP & Progression",
    description: "Level up your cosmic rank with experience points and track your learning journey.",
  },
  {
    icon: Users,
    title: "Classroom Teams",
    description: "Join your teacher's virtual classroom and learn alongside fellow space explorers.",
  },
  {
    icon: Sparkles,
    title: "Gamified Quizzes",
    description: "Test your knowledge with fun, interactive quizzes that feel like space missions.",
  },
];

export default Landing;
