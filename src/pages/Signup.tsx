import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Rocket, Mail, Lock, User, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import LoadingScreen from "@/components/LoadingScreen";

const signupSchema = z.object({
  firstName: z.string().trim().min(2, { message: "First name must be at least 2 characters" }).max(50),
  lastName: z.string().trim().min(2, { message: "Last name must be at least 2 characters" }).max(50),
  schoolId: z.string().trim().min(3, { message: "Teacher ID must be at least 3 characters" }).max(50),
  gender: z.enum(["Male", "Female"], { message: "Please select a gender" }),
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Signup = () => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    schoolId?: string;
    gender?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    schoolId: "",
    gender: "" as "Male" | "Female" | "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Validate inputs
      const validatedData = signupSchema.parse(formData);
      
      // Generate username automatically: firstname.lastname
      const username = `${validatedData.firstName.toLowerCase()}.${validatedData.lastName.toLowerCase()}`;
      
      await signUp(
        validatedData.email,
        validatedData.password,
        validatedData.firstName,
        validatedData.lastName,
        'teacher', // Only teacher signup allowed
        validatedData.schoolId,
        username,
        validatedData.gender
      );
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: any = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

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
        style={{ filter: 'brightness(0.4)' }}
      >
        <source src="/auth-background.mp4" type="video/mp4" />
      </video>
      
      {/* Fixed Gradient Overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50 -z-10" />
      
      <Card className="glass-card w-full max-w-md p-10 rounded-3xl space-y-8 animate-fade-in border-2 border-primary/20 shadow-2xl shadow-primary/10">
        <div className="text-center space-y-3">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center glow-primary animate-pulse-glow mb-6 shadow-lg shadow-primary/30 ring-4 ring-primary/10">
            <Users className="h-12 w-12 text-white drop-shadow-lg" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Teacher Account
          </h1>
          <p className="text-muted-foreground text-base">Create your cosmic profile</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-primary" />
              First Name
            </Label>
            <div className="relative group">
              <Input
                id="firstName"
                type="text"
                placeholder="Captain"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="glass-card rounded-xl h-11 px-4 border-2 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 group-hover:border-primary/30"
                required
              />
            </div>
            {errors.firstName && (
              <p className="text-sm text-destructive animate-fade-in">{errors.firstName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-primary" />
              Last Name
            </Label>
            <div className="relative group">
              <Input
                id="lastName"
                type="text"
                placeholder="Galaxy"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="glass-card rounded-xl h-11 px-4 border-2 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 group-hover:border-primary/30"
                required
              />
            </div>
            {errors.lastName && (
              <p className="text-sm text-destructive animate-fade-in">{errors.lastName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="schoolId" className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-primary" />
              Teacher ID
            </Label>
            <div className="relative group">
              <Input
                id="schoolId"
                type="text"
                placeholder="TCH-2024-001"
                value={formData.schoolId}
                onChange={(e) =>
                  setFormData({ ...formData, schoolId: e.target.value })
                }
                className="glass-card rounded-xl h-11 px-4 border-2 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 group-hover:border-primary/30"
                required
              />
            </div>
            {errors.schoolId && (
              <p className="text-sm text-destructive animate-fade-in">{errors.schoolId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender" className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-primary" />
              Gender
            </Label>
            <div className="relative group">
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value as "Male" | "Female" })
                }
                className="flex h-11 w-full rounded-xl border-2 border-border/50 bg-background/50 backdrop-blur-sm px-4 py-2 text-sm ring-offset-background focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 glass-card transition-all duration-300 group-hover:border-primary/30"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            {errors.gender && (
              <p className="text-sm text-destructive animate-fade-in">{errors.gender}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-primary" />
              Email
            </Label>
            <div className="relative group">
              <Input
                id="email"
                type="email"
                placeholder="teacher@mathquest.space"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="glass-card rounded-xl h-11 px-4 border-2 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 group-hover:border-primary/30"
                required
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive animate-fade-in">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
              <Lock className="h-4 w-4 text-primary" />
              Password
            </Label>
            <div className="relative group">
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="glass-card rounded-xl h-11 px-4 border-2 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 group-hover:border-primary/30"
                required
              />
            </div>
            {errors.password && (
              <p className="text-sm text-destructive animate-fade-in">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium">
              <Lock className="h-4 w-4 text-primary" />
              Confirm Password
            </Label>
            <div className="relative group">
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="glass-card rounded-xl h-11 px-4 border-2 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 group-hover:border-primary/30"
                required
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive animate-fade-in">{errors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full btn-cosmic py-7 rounded-xl text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mt-6"
            disabled={loading}
          >
            <Rocket className="mr-2 h-5 w-5" />
            {loading ? "Creating Account..." : "Create Teacher Account"}
          </Button>
        </form>

        <div className="text-center space-y-3 pt-2">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-semibold transition-all hover:text-primary/80">
              Login here
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            Students can access the app via{" "}
            <Link to="/login" className="text-secondary hover:underline font-semibold">
              Guest Mode
            </Link>
          </p>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground block transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Signup;
