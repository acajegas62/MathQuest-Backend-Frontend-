import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Mail, Lock, Camera, GraduationCap, Users, Trash2, Trophy, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import StudentStoryBadges from "@/components/classroom/StudentStoryBadges";

const Profile = () => {
  const { profile, user, userRole } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState({
    badgesEarned: 0,
  });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    schoolId: "",
    gender: "" as "Male" | "Female" | "",
  });
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (profile && user) {
      setFormData({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        username: profile.username || "",
        email: user.email || "",
        schoolId: profile.school_id || "",
        gender: (profile as any).gender || "",
      });
      
      // Fetch badge stats for students
      if (userRole === "student") {
        fetchBadgeStats();
      }
    }
  }, [profile, user, userRole]);

  const fetchBadgeStats = async () => {
    if (!user) return;
    
    try {
      const { count: badgesCount } = await supabase
        .from("student_badges")
        .select("*", { count: "exact", head: true })
        .eq("student_id", user.id);
      
      setStats({ badgesEarned: badgesCount || 0 });
    } catch (error) {
      console.error("Error fetching badge stats:", error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/avatar.${fileExt}`;

      setUploading(true);

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user?.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      toast.success('Profile picture updated!');
      window.location.reload(); // Refresh to show new avatar
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      if (!profile?.avatar_url) return;

      setUploading(true);

      // Delete from storage
      const path = profile.avatar_url.split('/').pop();
      if (path) {
        await supabase.storage
          .from('avatars')
          .remove([`${user?.id}/${path}`]);
      }

      // Update profile to remove avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Profile picture removed!');
      window.location.reload();
    } catch (error: any) {
      console.error('Error deleting avatar:', error);
      toast.error(error.message || 'Failed to delete avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          username: formData.username,
          school_id: formData.schoolId,
          gender: formData.gender,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);

    try {
      // First verify current password by attempting to sign in
      if (!user?.email) throw new Error("No email found");
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword,
      });

      if (signInError) {
        toast.error("Current password is incorrect");
        setPasswordLoading(false);
        return;
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      setChangePasswordOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const fullName = `${formData.firstName} ${formData.lastName}`.trim() || "Space Explorer";
  const initials = `${formData.firstName[0] || ""}${formData.lastName[0] || ""}`.toUpperCase();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 p-4 md:p-8 pt-24">
        {/* Animated background stars */}
        <div className="fixed inset-0 pointer-events-none opacity-30">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                top: Math.random() * 100 + "%",
                left: Math.random() * 100 + "%",
                animationDelay: Math.random() * 3 + "s",
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto space-y-6 relative z-10">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 mb-3">
              Space Commander Profile
            </h1>
            <p className="text-white/60 text-lg">Your cosmic journey dashboard</p>
          </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Profile & Stats Card */}
          <Card className="lg:col-span-4 backdrop-blur-xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-2 border-purple-500/30 rounded-3xl p-8 space-y-6 animate-fade-in">
            <div className="text-center space-y-6">
              {/* Avatar with glow effect */}
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-50 animate-pulse" />
                <Avatar className="relative w-40 h-40 border-4 border-purple-400 shadow-2xl shadow-purple-500/50">
                  <AvatarImage src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-purple-600 to-pink-600">{initials}</AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <Button
                  size="icon"
                  className="absolute bottom-2 right-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-2 border-white shadow-lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera className="h-5 w-5" />
                </Button>
              </div>

              {/* Name & Title */}
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                  {fullName}
                </h2>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-semibold">
                    Level {profile?.level || 1} {userRole === "teacher" ? "Captain" : "Astronaut"}
                  </span>
                </div>
              </div>

              {/* Remove Photo Button */}
              {profile?.avatar_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAvatar}
                  disabled={uploading}
                  className="backdrop-blur-xl bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Photo
                </Button>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-4">
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
                    {profile?.xp || 0}
                  </div>
                  <div className="text-sm text-white/60 mt-1">Total XP</div>
                </div>
                <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-4">
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                    {userRole === "student" ? stats.badgesEarned : 0}
                  </div>
                  <div className="text-sm text-white/60 mt-1">{userRole === "student" ? "Badges Earned" : "Role"}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            {/* Story Mode Badges (Students only) */}
            {userRole === "student" && profile && (
              <div 
                className="animate-fade-in cursor-pointer"
                onClick={() => navigate("/badges")}
              >
                <StudentStoryBadges 
                  studentId={profile.id} 
                  studentName={fullName}
                />
              </div>
            )}

            {/* Account Details */}
            <Card className="backdrop-blur-xl bg-gradient-to-br from-slate-900/60 to-purple-900/40 border-2 border-purple-500/20 rounded-3xl p-8 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                    Account Details
                  </h2>
                </div>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl px-6 py-2"
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="backdrop-blur-xl bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl"
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="flex items-center gap-2 text-white/80">
                      <User className="h-4 w-4 text-purple-400" />
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      disabled={!isEditing}
                      className="backdrop-blur-xl bg-white/5 border-white/10 text-white rounded-xl h-12 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="flex items-center gap-2 text-white/80">
                      <User className="h-4 w-4 text-purple-400" />
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      disabled={!isEditing}
                      className="backdrop-blur-xl bg-white/5 border-white/10 text-white rounded-xl h-12 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2 text-white/80">
                    <User className="h-4 w-4 text-purple-400" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    disabled={!isEditing}
                    className="backdrop-blur-xl bg-white/5 border-white/10 text-white rounded-xl h-12 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolId" className="flex items-center gap-2 text-white/80">
                    {userRole === "student" ? <GraduationCap className="h-4 w-4 text-purple-400" /> : <Users className="h-4 w-4 text-purple-400" />}
                    {userRole === "student" ? "Student ID" : "Teacher ID"}
                  </Label>
                  <Input
                    id="schoolId"
                    value={formData.schoolId}
                    onChange={(e) =>
                      setFormData({ ...formData, schoolId: e.target.value })
                    }
                    disabled={!isEditing}
                    className="backdrop-blur-xl bg-white/5 border-white/10 text-white rounded-xl h-12 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="flex items-center gap-2 text-white/80">
                    <User className="h-4 w-4 text-purple-400" />
                    Gender
                  </Label>
                  {isEditing ? (
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value as "Male" | "Female" })
                      }
                      className="flex h-12 w-full rounded-xl border border-white/10 backdrop-blur-xl bg-white/5 px-3 py-2 text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  ) : (
                    <Input
                      id="gender"
                      value={formData.gender || "Not specified"}
                      disabled
                      className="backdrop-blur-xl bg-white/5 border-white/10 text-white rounded-xl h-12"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-white/80">
                    <Mail className="h-4 w-4 text-purple-400" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="backdrop-blur-xl bg-white/5 border-white/10 text-white/50 rounded-xl h-12"
                  />
                  <p className="text-xs text-white/40">Email cannot be changed</p>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-xl text-white">Security</h3>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setChangePasswordOpen(true)}
                  className="backdrop-blur-xl bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-xl w-full md:w-auto"
                >
                  Change Password
                </Button>
              </div>

              <div className="pt-6 border-t border-white/10">
                <Button 
                  variant="destructive" 
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl w-full md:w-auto"
                >
                  Delete Account
                </Button>
              </div>
            </Card>
          </div>
        </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="glass-card border-2 border-purple-500/20 bg-gradient-to-br from-slate-900/95 to-purple-900/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
              Change Password
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-white/80">
                Current Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                className="backdrop-blur-xl bg-white/5 border-white/10 text-white rounded-xl h-12"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-white/80">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                className="backdrop-blur-xl bg-white/5 border-white/10 text-white rounded-xl h-12"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword" className="text-white/80">
                Confirm New Password
              </Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                className="backdrop-blur-xl bg-white/5 border-white/10 text-white rounded-xl h-12"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setChangePasswordOpen(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
                className="flex-1 backdrop-blur-xl bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-xl"
                disabled={passwordLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl"
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Profile;
