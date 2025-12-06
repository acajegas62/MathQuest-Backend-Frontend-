import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRole?: 'teacher' | 'student' | 'admin';
  loading: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string, role: 'teacher' | 'student', schoolId?: string, username?: string, gender?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInAsGuest: () => void;
  signOut: () => Promise<void>;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  username?: string;
  avatar_url?: string;
  xp?: number;
  level?: number;
  school_id?: string;
}

interface UserRole {
  role: 'teacher' | 'student' | 'admin';
}

const GUEST_STORAGE_KEY = 'mathquest_guest_mode';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const navigate = useNavigate();

  // Check for guest mode on mount
  useEffect(() => {
    const guestMode = localStorage.getItem(GUEST_STORAGE_KEY);
    if (guestMode === 'true') {
      setIsGuest(true);
      setProfile({
        id: 'guest',
        first_name: 'Guest',
        last_name: 'Student',
        username: 'guest_student',
        xp: 0,
        level: 1,
      });
      setUserRole({ role: 'student' });
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch profile when user logs in
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserRole(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch user role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError) throw roleError;
      setUserRole(roleData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: 'teacher' | 'student',
    schoolId?: string,
    username?: string,
    gender?: string
  ) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role,
            school_id: schoolId,
            username,
            gender,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      toast.success('Account created! Please check your email to verify your account.', {
        duration: 5000,
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error signing up:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch role to determine navigation
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      if (roleData?.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  const signInAsGuest = () => {
    localStorage.setItem(GUEST_STORAGE_KEY, 'true');
    setIsGuest(true);
    setProfile({
      id: 'guest',
      first_name: 'Guest',
      last_name: 'Student',
      username: 'guest_student',
      xp: 0,
      level: 1,
    });
    setUserRole({ role: 'student' });
    setLoading(false);
    toast.success('Welcome, Guest Student!');
    navigate('/student/dashboard');
  };

  const signOut = async () => {
    try {
      // Clear guest mode
      if (isGuest) {
        localStorage.removeItem(GUEST_STORAGE_KEY);
        setIsGuest(false);
        setProfile(null);
        setUserRole(null);
        toast.success('Signed out successfully');
        navigate('/');
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      setProfile(null);
      setUserRole(null);
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        userRole: userRole?.role,
        loading,
        isGuest,
        signUp,
        signIn,
        signInAsGuest,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
