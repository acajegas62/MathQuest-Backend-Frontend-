import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Rocket, Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import LoadingScreen from "@/components/LoadingScreen";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const Login = () => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { signIn, signInAsGuest } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have an access_token in the URL (from password reset email)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (accessToken && type === 'recovery') {
      setIsResettingPassword(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Validate inputs
      const validatedData = loginSchema.parse({ email, password });
      
      await signIn(validatedData.email, validatedData.password);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof typeof fieldErrors] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      // Validate email
      const emailSchema = z.string().trim().email({ message: "Invalid email address" });
      emailSchema.parse(resetEmail);

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent!",
        description: "Check your inbox for the password reset link.",
      });
      
      setResetDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to send password reset email.",
          variant: "destructive",
        });
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password updated!",
        description: "Your password has been successfully reset. You can now log in.",
      });
      
      // Clear the hash and state
      window.history.replaceState(null, '', '/login');
      setIsResettingPassword(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password.",
        variant: "destructive",
      });
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
            <Rocket className="h-12 w-12 text-white drop-shadow-lg" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            {isResettingPassword ? "Reset Password" : "Welcome Back!"}
          </h1>
          <p className="text-muted-foreground text-base">
            {isResettingPassword ? "Enter your new password below" : "Continue your cosmic learning adventure"}
          </p>
        </div>

        {isResettingPassword ? (
          <form onSubmit={handlePasswordReset} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="flex items-center gap-2 text-sm font-medium">
                <Lock className="h-4 w-4 text-primary" />
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="glass-card rounded-xl h-12 px-4 border-2 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium">
                <Lock className="h-4 w-4 text-primary" />
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass-card rounded-xl h-12 px-4 border-2 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full btn-cosmic py-7 rounded-xl text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              disabled={loading}
            >
              <Lock className="mr-2 h-5 w-5" />
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-primary" />
              Email
            </Label>
            <div className="relative group">
              <Input
                id="email"
                type="email"
                placeholder="astronaut@mathquest.space"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-card rounded-xl h-12 px-4 border-2 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 group-hover:border-primary/30"
                required
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive flex items-center gap-1 animate-fade-in">
                {errors.email}
              </p>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-card rounded-xl h-12 px-4 border-2 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 group-hover:border-primary/30"
                required
              />
            </div>
            {errors.password && (
              <p className="text-sm text-destructive flex items-center gap-1 animate-fade-in">
                {errors.password}
              </p>
            )}
          </div>

          <div className="text-right">
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline font-medium transition-all hover:text-primary/80"
                >
                  Forgot password?
                </button>
              </DialogTrigger>
              <DialogContent className="glass-card border-2 border-primary/20">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Reset Password</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Enter your email address and we'll send you a link to reset your password.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleForgotPassword} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      Email
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="astronaut@mathquest.space"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="glass-card rounded-xl h-12 px-4 border-2 border-border/50 focus:border-primary/50"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full btn-cosmic py-6 rounded-xl font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
                    disabled={resetLoading}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {resetLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Button
            type="submit"
            className="w-full btn-cosmic py-7 rounded-xl text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mt-6"
            disabled={loading}
          >
            <Rocket className="mr-2 h-5 w-5" />
            {loading ? "Launching..." : "Teacher Login"}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or for students</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={signInAsGuest}
            className="w-full py-6 rounded-xl text-base font-semibold border-2 border-secondary/50 hover:border-secondary hover:bg-secondary/10 transition-all duration-300"
          >
            <User className="mr-2 h-5 w-5" />
            Continue as Guest Student
          </Button>
        </form>
        )}

        <div className="text-center space-y-3 pt-2">
          <p className="text-sm text-muted-foreground">
            Teacher account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-semibold transition-all hover:text-primary/80">
              Sign up here
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

export default Login;
