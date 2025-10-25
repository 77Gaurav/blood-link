import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Save, X, User, Droplet, Briefcase, MapPin, Weight, Trash2 } from "lucide-react";

interface Profile {
  full_name: string;
  age: number | null;
  gender: string | null;
  smoking_habit: string | null;
  drinking_habit: string | null;
  job_description: string | null;
  blood_type: string | null;
  weight: number | null;
  city: string | null;
  profile_picture_url: string | null;
  phone: string | null;
}

export const VolunteerProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setEditedProfile(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!editedProfile) return;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editedProfile.full_name,
          age: editedProfile.age,
          gender: editedProfile.gender,
          smoking_habit: editedProfile.smoking_habit,
          drinking_habit: editedProfile.drinking_habit,
          job_description: editedProfile.job_description,
          blood_type: editedProfile.blood_type,
          weight: editedProfile.weight,
          city: editedProfile.city,
          phone: editedProfile.phone
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(editedProfile);
      setEditing(false);
      toast({ title: "Success", description: "Profile updated successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { error } = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast({ 
        title: "Account Deleted", 
        description: "Your account has been permanently deleted." 
      });

      // Sign out and redirect to home
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete account", 
        variant: "destructive" 
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (!profile) {
    return <div className="text-center p-8">Loading profile...</div>;
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.profile_picture_url || undefined} />
              <AvatarFallback className="text-2xl">
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{profile.full_name}</h2>
              <p className="text-muted-foreground">Volunteer</p>
            </div>
          </div>
          
          {!editing ? (
            <Button onClick={() => setEditing(true)} variant="outline">
              <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
              <Button onClick={() => { setEditing(false); setEditedProfile(profile); }} variant="outline">
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
            </div>
          )}
        </div>

      {editing && editedProfile ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={editedProfile.full_name}
                onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
              />
            </div>

            <div>
              <Label>Age</Label>
              <Input
                type="number"
                value={editedProfile.age || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, age: parseInt(e.target.value) || null })}
              />
            </div>

            <div>
              <Label>Gender</Label>
              <Select value={editedProfile.gender || ''} onValueChange={(v) => setEditedProfile({ ...editedProfile, gender: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Blood Type</Label>
              <Select value={editedProfile.blood_type || ''} onValueChange={(v) => setEditedProfile({ ...editedProfile, blood_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Weight (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={editedProfile.weight || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, weight: parseFloat(e.target.value) || null })}
              />
            </div>

            <div>
              <Label>City</Label>
              <Input
                value={editedProfile.city || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, city: e.target.value })}
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                value={editedProfile.phone || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
              />
            </div>

            <div>
              <Label>Smoking Habit</Label>
              <Select value={editedProfile.smoking_habit || ''} onValueChange={(v) => setEditedProfile({ ...editedProfile, smoking_habit: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="occasionally">Occasionally</SelectItem>
                  <SelectItem value="regularly">Regularly</SelectItem>
                  <SelectItem value="former">Former Smoker</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Drinking Habit</Label>
              <Select value={editedProfile.drinking_habit || ''} onValueChange={(v) => setEditedProfile({ ...editedProfile, drinking_habit: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="occasionally">Occasionally</SelectItem>
                  <SelectItem value="regularly">Regularly</SelectItem>
                  <SelectItem value="socially">Socially</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Job Description</Label>
            <Textarea
              value={editedProfile.job_description || ''}
              onChange={(e) => setEditedProfile({ ...editedProfile, job_description: e.target.value })}
              rows={3}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-medium">{profile.age || 'Not set'} years</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{profile.gender || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Droplet className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Blood Type</p>
                <p className="font-medium">{profile.blood_type || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Weight className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="font-medium">{profile.weight || 'Not set'} kg</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">City</p>
                <p className="font-medium">{profile.city || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Smoking Habit</p>
                <p className="font-medium capitalize">{profile.smoking_habit || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Drinking Habit</p>
                <p className="font-medium capitalize">{profile.drinking_habit || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Job</p>
                <p className="font-medium">{profile.job_description || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Section */}
      <div className="mt-6 pt-6 border-t border-destructive/20">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Permanently delete your account and all associated data
            </p>
          </div>
          <Button 
            onClick={() => setShowDeleteDialog(true)} 
            variant="destructive"
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </div>
    </Card>

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account
            and remove all your data from our servers, including your profile information,
            participation history, and any other associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? "Deleting..." : "Yes, delete my account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};