import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Anchor, ExternalLink } from "lucide-react";
import Navigation from "@/components/Navigation";
import angeloCajegas from "@/assets/angelo-cajegas.jpg";
import michaelBacalso from "@/assets/michael-bacalso.jpg";
import kristofferTesaluna from "@/assets/kristoffer-tesaluna.png";
import aaronVillarta from "@/assets/aaron-villarta.jpg";
import emmanuelCagampang from "@/assets/emmanuel-cagampang.jpeg";

const About = () => {
  return (
    <div className="min-h-screen relative">
      {/* Fixed Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover -z-10"
        style={{ filter: 'brightness(0.4)' }}
      >
        <source src="/reflex-background.mp4" type="video/mp4" />
      </video>
      
      {/* Fixed Gradient Overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50 -z-10" />
      
      <Navigation />
      
      {/* About Section */}
      <section className="relative min-h-screen flex items-center py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-warning via-accent to-primary flex items-center justify-center shadow-lg shadow-warning/40">
                <Anchor className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-warning">
                Developers Crew
              </h1>
            </div>
          </div>

          {/* Developers Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto mb-20 group/grid">
            {developers.map((developer, index) => (
              <DeveloperCard key={index} {...developer} />
            ))}
          </div>

          {/* Purpose & Vision Section */}
          <div className="max-w-5xl mx-auto mt-24">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-warning mb-12">
              Purpose & Vision
            </h2>
            
            <div className="space-y-8">
              <Card className="p-8 rounded-2xl border-2 border-warning/30 bg-card/80 backdrop-blur-xl">
                <h3 className="text-2xl font-bold text-warning mb-4">Purpose of the Project</h3>
                <p className="text-foreground/90 leading-relaxed">
                  The purpose of MathQuest is to support the Cebu Institute of Technology – University (CIT-U) in strengthening mathematics mastery among Grade 4 learners, particularly in preparation for the Department of Education's Project All Numerates (PAN) assessment in 2025. This platform aims to transform traditional multiplication learning into an engaging, interactive, and adaptive experience. MathQuest seeks to enhance students' confidence and numerical literacy through gamified challenges, personalized learning pathways, and real-time feedback, while enabling CIT-U educators and student-teachers to monitor progress and provide timely academic support.
                </p>
              </Card>

              <Card className="p-8 rounded-2xl border-2 border-warning/30 bg-card/80 backdrop-blur-xl">
                <h3 className="text-2xl font-bold text-warning mb-4">Vision of the Project</h3>
                <p className="text-foreground/90 leading-relaxed">
                  Our vision for MathQuest is to become CIT-U's flagship digital numeracy initiative, empowering young learners in partner basic education institutions to develop strong foundational math skills and a positive mindset toward learning. We envision a future where CIT-U plays a key role in nurturing motivated, confident problem-solvers through innovative and research-driven learning technologies. By integrating gamification, analytics, and adaptive instruction, MathQuest aims to enhance CIT-U's contribution to community development and educational excellence in Cebu.
                </p>
              </Card>
            </div>
          </div>
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

interface DeveloperCardProps {
  name: string;
  role: string;
  image: string;
  portfolio?: string;
}

const DeveloperCard = ({ name, role, image, portfolio }: DeveloperCardProps) => {
  const CardContent = (
    <Card className="group relative h-[400px] rounded-2xl border-2 border-warning/30 bg-card/80 backdrop-blur-xl hover:border-warning hover:scale-110 hover:z-50 transition-all duration-500 overflow-hidden cursor-pointer hover:shadow-[0_0_40px_10px_hsl(var(--warning)/0.5)] group-hover/grid:opacity-40 hover:!opacity-100">
      {/* Background Image with Zoom Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        {/* Gradient Overlay - darker on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/95 group-hover:via-black/70 transition-all duration-500" />
      </div>

      {/* Anchor icon */}
      <div className="absolute top-4 right-4 z-10">
        <div className="w-8 h-8 rounded-full bg-warning/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-warning/40 transition-colors">
          <Anchor className="h-4 w-4 text-warning" />
        </div>
      </div>

      {/* Content at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        <h3 className="text-xl font-bold text-white mb-1">
          {name}
        </h3>
        <p className="text-sm text-warning/90 mb-3">{role}</p>

        {/* Portfolio link indicator */}
        {portfolio && (
          <div className="mt-3 flex items-center gap-2 text-xs text-white/80 group-hover:text-warning transition-colors">
            <ExternalLink className="h-3 w-3" />
            <span>View Portfolio</span>
          </div>
        )}
      </div>
    </Card>
  );

  if (portfolio) {
    return (
      <a href={portfolio} target="_blank" rel="noopener noreferrer" className="block">
        {CardContent}
      </a>
    );
  }

  return CardContent;
};

const developers = [
  {
    name: "Michael Ferdinand C. Bacalso",
    role: "Full Stack Developer",
    image: michaelBacalso,
  },
  {
    name: "Angelo B. Cajegas",
    role: "Full Stack Developer",
    image: angeloCajegas,
    portfolio: "https://angelocajegas.vercel.app/",
  },
  {
    name: "Kristoffer Josh Tesaluna",
    role: "Full Stack Developer",
    image: kristofferTesaluna,
    portfolio: "https://kristoffer-s-creative-hub.vercel.app/",
  },
  {
    name: "Aaron Cloyd Villarta",
    role: "Full Stack Developer",
    image: aaronVillarta,
  },
  {
    name: "Emmanuel A. Cagampang Jr.",
    role: "Full Stack Developer",
    image: emmanuelCagampang,
  },
];

export default About;
