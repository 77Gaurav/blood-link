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
    message: '',
    blood_sugar_level: '',
    type_of_work: '',
    stress_level: '',
    previous_donation: false,
    major_diseases_history: ''
  });
  
  const [showHospitals, setShowHospitals] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');

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
            .select('full_name, age, gender, weight, city, phone, job_description')
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
              message: '',
              blood_sugar_level: '',
              type_of_work: profile.job_description || '',
              stress_level: '',
              previous_donation: false,
              major_diseases_history: ''
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
          message: '',
          blood_sugar_level: '',
          type_of_work: '',
          stress_level: '',
          previous_donation: false,
          major_diseases_history: ''
        });
        setProfileIncomplete(false);
        setShowHospitals(false);
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
        message: volunteerData.message,
        blood_sugar_level: volunteerData.blood_sugar_level,
        type_of_work: volunteerData.type_of_work,
        stress_level: volunteerData.stress_level,
        previous_donation: volunteerData.previous_donation,
        major_diseases_history: volunteerData.major_diseases_history
      });

      if (error) throw error;
      
      // Fetch hospitals after successful participation
      await fetchHospitals();
      setShowHospitals(true);
      
      toast({ title: "Success", description: "Details saved! Now select a hospital to book an appointment." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };
  
  const fetchHospitals = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, organization_name, phone, city, location')
        .eq('role', 'hospital');
      
      if (error) throw error;
      setHospitals(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };
  
  const handleBookAppointment = async () => {
    if (!selectedHospital || !appointmentDate) {
      toast({ 
        title: "Missing Information", 
        description: "Please select a hospital and appointment date",
        variant: "destructive" 
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('appointments').insert({
        volunteer_id: user.id,
        hospital_id: selectedHospital,
        emergency_post_id: selectedPost,
        appointment_date: appointmentDate,
        notes: appointmentNotes,
        status: 'pending'
      });

      if (error) throw error;
      
      toast({ 
        title: "Appointment Booked!", 
        description: "The hospital will confirm your appointment soon." 
      });
      
      setSelectedPost(null);
      setShowHospitals(false);
      setSelectedHospital(null);
      setAppointmentDate('');
      setAppointmentNotes('');
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
            <DialogTitle>{showHospitals ? "Select Hospital & Book Appointment" : "Volunteer to Help"}</DialogTitle>
            <DialogDescription>
              {showHospitals 
                ? "Choose a hospital and schedule your donation appointment"
                : profileIncomplete 
                  ? "Please complete all required fields. Your profile data has been pre-filled where available."
                  : "Your details have been pre-filled from your profile. You can modify them if needed."
              }
            </DialogDescription>
          </DialogHeader>
          
          {!showHospitals ? (
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

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div>
                <Label>Blood Sugar Level *</Label>
                <Input 
                  value={volunteerData.blood_sugar_level} 
                  onChange={(e) => setVolunteerData({...volunteerData, blood_sugar_level: e.target.value})}
                  placeholder="e.g., Normal, Pre-diabetic, Diabetic"
                  required 
                />
              </div>

              <div>
                <Label>Type of Work *</Label>
                <Input 
                  value={volunteerData.type_of_work} 
                  onChange={(e) => setVolunteerData({...volunteerData, type_of_work: e.target.value})}
                  placeholder="e.g., Office work, Physical labor, etc."
                  required 
                />
              </div>

              <div>
                <Label>Stress Level *</Label>
                <Select value={volunteerData.stress_level} onValueChange={(v) => setVolunteerData({...volunteerData, stress_level: v})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stress level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="previous_donation"
                  checked={volunteerData.previous_donation}
                  onChange={(e) => setVolunteerData({...volunteerData, previous_donation: e.target.checked})}
                  className="h-4 w-4"
                />
                <Label htmlFor="previous_donation" className="cursor-pointer">
                  I have participated in blood donation earlier
                </Label>
              </div>

              <div>
                <Label>Major Diseases History</Label>
                <Textarea 
                  value={volunteerData.major_diseases_history} 
                  onChange={(e) => setVolunteerData({...volunteerData, major_diseases_history: e.target.value})}
                  placeholder="List any major diseases or health conditions (or write 'None')"
                  rows={3}
                />
              </div>

              <div>
                <Label>Additional Message (Optional)</Label>
                <Textarea 
                  value={volunteerData.message} 
                  onChange={(e) => setVolunteerData({...volunteerData, message: e.target.value})}
                  placeholder="Any additional information you'd like to share"
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Submitting..." : "Continue to Hospital Selection"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {hospitals.map((hospital) => (
                  <Card 
                    key={hospital.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedHospital === hospital.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedHospital(hospital.id)}
                  >
                    <h4 className="font-semibold">{hospital.organization_name || hospital.full_name}</h4>
                    {hospital.city && <p className="text-sm text-muted-foreground">City: {hospital.city}</p>}
                    {hospital.location && <p className="text-sm text-muted-foreground">Location: {hospital.location}</p>}
                    {hospital.phone && <p className="text-sm text-muted-foreground">Phone: {hospital.phone}</p>}
                  </Card>
                ))}
              </div>

              <div>
                <Label>Appointment Date & Time *</Label>
                <Input 
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>

              <div>
                <Label>Notes for Hospital (Optional)</Label>
                <Textarea 
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  placeholder="Any specific requirements or questions"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowHospitals(false)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleBookAppointment}
                  disabled={!selectedHospital || !appointmentDate || submitting}
                  className="flex-1"
                >
                  {submitting ? "Booking..." : "Book Appointment"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
