import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Droplet, MapPin, Phone, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VolunteerProfile } from "./VolunteerProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmergencyPost {
  id: string;
  blood_group: string;
  quantity: number;
  location: string;
  urgency_level: string;
  description: string;
  contact_phone: string;
  created_at: string;
  posted_by: string;
  profiles: {
    full_name: string;
    organization_name: string;
  };
}

export const VolunteerDashboard = () => {
  const [posts, setPosts] = useState<EmergencyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const { toast } = useToast();
  
  const [volunteerData, setVolunteerData] = useState({
    volunteer_name: '',
    age: '',
    gender: '',
    weight: '',
    city: '',
    contact_number: '',
    message: ''
  });

  useEffect(() => {
    fetchEmergencyPosts();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('emergency_posts_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'emergency_posts' },
        () => fetchEmergencyPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Autofill volunteer data from profile when dialog opens
  useEffect(() => {
    const fetchProfileData = async () => {
      if (selectedPost) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: profile, error } = await supabase
            .from('profiles')
            .select('full_name, age, gender, weight, city, phone')
            .eq('id', user.id)
            .single();

          if (error) throw error;

          if (profile) {
            // Check if profile has all required fields
            const isComplete = profile.full_name && profile.age && profile.gender && 
                             profile.weight && profile.city && profile.phone;
            
            setProfileIncomplete(!isComplete);

            // Autofill the form with profile data
            setVolunteerData({
              volunteer_name: profile.full_name || '',
              age: profile.age?.toString() || '',
              gender: profile.gender || '',
              weight: profile.weight?.toString() || '',
              city: profile.city || '',
              contact_number: profile.phone || '',
              message: ''
            });

            if (!isComplete) {
              toast({
                title: "Profile Incomplete",
                description: "Please complete your profile information before participating.",
                variant: "default"
              });
            }
          }
        } catch (error: any) {
          console.error('Error fetching profile:', error);
        }
      } else {
        // Reset form when dialog closes
        setVolunteerData({
          volunteer_name: '',
          age: '',
          gender: '',
          weight: '',
          city: '',
          contact_number: '',
          message: ''
        });
        setProfileIncomplete(false);
      }
    };

    fetchProfileData();
  }, [selectedPost, toast]);

  const fetchEmergencyPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_posts')
        .select(`
          *,
          profiles:posted_by (
            full_name,
            organization_name
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleParticipate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedPost) return;

      const { error } = await supabase.from('participations').insert({
        emergency_id: selectedPost,
        volunteer_id: user.id,
        status: 'pending',
        volunteer_name: volunteerData.volunteer_name,
        age: parseInt(volunteerData.age),
        gender: volunteerData.gender,
        weight: parseFloat(volunteerData.weight),
        city: volunteerData.city,
        contact_number: volunteerData.contact_number,
        message: volunteerData.message
      });

      if (error) throw error;
      toast({ title: "Success", description: "Your participation has been recorded!" });
      setSelectedPost(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading emergency requests...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="requests">Emergency Requests</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Active Emergency Requests</h2>
            <p className="text-muted-foreground">Help save lives by responding to urgent blood needs</p>
          </div>

          {posts.length === 0 ? (
            <Card className="p-12 text-center">
              <Droplet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Active Requests</h3>
              <p className="text-muted-foreground">Check back later for emergency blood requests</p>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <Card key={post.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Droplet className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-primary">{post.blood_group}</h3>
                        <p className="text-sm text-muted-foreground">{post.quantity} units needed</p>
                      </div>
                    </div>
                    <Badge variant={getUrgencyColor(post.urgency_level)}>
                      {post.urgency_level}
                    </Badge>
                  </div>

                  {post.description && (
                    <p className="text-sm mb-4 text-muted-foreground">{post.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{post.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{post.contact_phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(post.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-3">
                      Posted by: <span className="font-medium">{post.profiles?.organization_name || post.profiles?.full_name}</span>
                    </p>
                    <Button onClick={() => setSelectedPost(post.id)} className="w-full">
                      I Can Help
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile">
          <VolunteerProfile />
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Volunteer to Help</DialogTitle>
            <DialogDescription>
              {profileIncomplete 
                ? "Please complete all required fields. Your profile data has been pre-filled where available."
                : "Your details have been pre-filled from your profile. You can modify them if needed."
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleParticipate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input 
                  value={volunteerData.volunteer_name} 
                  onChange={(e) => setVolunteerData({...volunteerData, volunteer_name: e.target.value})}
                  required 
                />
              </div>

              <div>
                <Label>Age *</Label>
                <Input 
                  type="number"
                  value={volunteerData.age} 
                  onChange={(e) => setVolunteerData({...volunteerData, age: e.target.value})}
                  min="18"
                  max="65"
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Gender *</Label>
                <Select value={volunteerData.gender} onValueChange={(v) => setVolunteerData({...volunteerData, gender: v})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Weight (kg) *</Label>
                <Input 
                  type="number"
                  step="0.1"
                  value={volunteerData.weight} 
                  onChange={(e) => setVolunteerData({...volunteerData, weight: e.target.value})}
                  min="45"
                  required 
                />
              </div>
            </div>

            <div>
              <Label>City *</Label>
              <Input 
                value={volunteerData.city} 
                onChange={(e) => setVolunteerData({...volunteerData, city: e.target.value})}
                required 
              />
            </div>

            <div>
              <Label>Contact Number *</Label>
              <Input 
                type="tel"
                value={volunteerData.contact_number} 
                onChange={(e) => setVolunteerData({...volunteerData, contact_number: e.target.value})}
                placeholder="+1234567890"
                required 
              />
            </div>

            <div>
              <Label>Additional Message (Optional)</Label>
              <Textarea 
                value={volunteerData.message} 
                onChange={(e) => setVolunteerData({...volunteerData, message: e.target.value})}
                placeholder="Any additional information you'd like to share"
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Response"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
