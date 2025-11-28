import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Droplet, Upload, Calendar, Building2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";

const ProfileDetails = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");
  const [showHospitals, setShowHospitals] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<string>("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentNotes, setAppointmentNotes] = useState("");
  
  const [formData, setFormData] = useState({
    volunteer_name: "",
    age: "",
    gender: "",
    smoking_habit: "",
    drinking_habit: "",
    job_description: "",
    blood_type: "",
    weight: "",
    city: "",
    blood_sugar_level: "",
    major_diseases_history: "",
    type_of_work: "",
    stress_level: "",
    previous_donation: false
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "File size must be less than 5MB", variant: "destructive" });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      setProfilePictureUrl(data.publicUrl);
      toast({ title: "Success", description: "Profile picture uploaded!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.volunteer_name,
          age: parseInt(formData.age),
          gender: formData.gender,
          smoking_habit: formData.smoking_habit,
          drinking_habit: formData.drinking_habit,
          job_description: formData.job_description,
          blood_type: formData.blood_type,
          weight: parseFloat(formData.weight),
          city: formData.city,
          blood_sugar_level: formData.blood_sugar_level,
          major_diseases_history: formData.major_diseases_history,
          type_of_work: formData.type_of_work,
          stress_level: formData.stress_level,
          previous_donation: formData.previous_donation,
          profile_picture_url: profilePictureUrl || null,
          profile_completed: true
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({ title: "Success", description: "Profile completed successfully!" });
      
      // Fetch hospitals after profile completion
      const { data: hospitalsData, error: hospitalsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'hospital');

      if (hospitalsError) throw hospitalsError;
      
      setHospitals(hospitalsData || []);
      setShowHospitals(true);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedHospital || !appointmentDate) {
      toast({ 
        title: "Error", 
        description: "Please select a hospital and appointment date", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('appointments')
        .insert({
          volunteer_id: user.id,
          hospital_id: selectedHospital,
          appointment_date: appointmentDate,
          notes: appointmentNotes,
          status: 'pending'
        });

      if (error) throw error;

      toast({ title: "Success", description: "Appointment booked successfully!" });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl p-8">
        {!showHospitals ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary/10 p-3 rounded-full">
                <Droplet className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Complete Your Profile</h1>
                <p className="text-muted-foreground">Help us get to know you better</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center gap-4 pb-6 border-b">
            <Avatar className="h-32 w-32">
              <AvatarImage src={profilePictureUrl} />
              <AvatarFallback className="text-2xl">
                {formData.volunteer_name.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <Input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Label htmlFor="profile-picture">
                <Button type="button" variant="outline" disabled={uploading} asChild>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload Profile Picture"}
                  </span>
                </Button>
              </Label>
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="volunteer_name">Full Name *</Label>
              <Input
                id="volunteer_name"
                value={formData.volunteer_name}
                onChange={(e) => setFormData({ ...formData, volunteer_name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="25"
                min="18"
                max="65"
                required
              />
            </div>

            <div>
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })} required>
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
              <Label htmlFor="blood_type">Blood Type *</Label>
              <Select value={formData.blood_type} onValueChange={(v) => setFormData({ ...formData, blood_type: v })} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood type" />
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
              <Label htmlFor="weight">Weight (kg) *</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="70.5"
                min="45"
                required
              />
            </div>

            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="New York"
                required
              />
            </div>

            <div>
              <Label htmlFor="smoking_habit">Smoking Habit *</Label>
              <Select value={formData.smoking_habit} onValueChange={(v) => setFormData({ ...formData, smoking_habit: v })} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
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
              <Label htmlFor="drinking_habit">Drinking Habit *</Label>
              <Select value={formData.drinking_habit} onValueChange={(v) => setFormData({ ...formData, drinking_habit: v })} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
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
            <Label htmlFor="job_description">Job Description *</Label>
            <Textarea
              id="job_description"
              value={formData.job_description}
              onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
              placeholder="Tell us about your occupation..."
              rows={3}
              required
            />
          </div>

          {/* Health Information Section */}
          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold mb-4">Health Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="blood_sugar_level">Blood Sugar Level *</Label>
                <Select 
                  value={formData.blood_sugar_level} 
                  onValueChange={(v) => setFormData({ ...formData, blood_sugar_level: v })} 
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="pre-diabetic">Pre-diabetic</SelectItem>
                    <SelectItem value="diabetic">Diabetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type_of_work">Type of Work *</Label>
                <Select 
                  value={formData.type_of_work} 
                  onValueChange={(v) => setFormData({ ...formData, type_of_work: v })} 
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="standing/moving">Standing/Moving</SelectItem>
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="stress_level">Stress Level *</Label>
                <Select 
                  value={formData.stress_level} 
                  onValueChange={(v) => setFormData({ ...formData, stress_level: v })} 
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Checkbox 
                  id="previous_donation" 
                  checked={formData.previous_donation}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, previous_donation: checked as boolean })
                  }
                />
                <Label htmlFor="previous_donation" className="cursor-pointer">
                  I have donated blood before
                </Label>
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="major_diseases_history">Major Diseases History</Label>
              <Textarea
                id="major_diseases_history"
                value={formData.major_diseases_history}
                onChange={(e) => setFormData({ ...formData, major_diseases_history: e.target.value })}
                placeholder="List any major diseases or medical conditions you've had (leave blank if none)..."
                rows={3}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Complete Profile & Continue"}
          </Button>
        </form>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary/10 p-3 rounded-full">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Book an Appointment</h1>
                <p className="text-muted-foreground">Select a hospital to schedule your blood donation</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-lg font-semibold mb-4 block">Available Hospitals</Label>
                <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto pr-2">
                  {hospitals.map((hospital) => (
                    <Card
                      key={hospital.id}
                      className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                        selectedHospital === hospital.id
                          ? "border-primary border-2 bg-primary/5"
                          : "border-border"
                      }`}
                      onClick={() => setSelectedHospital(hospital.id)}
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={hospital.profile_picture_url} />
                          <AvatarFallback>
                            <Building2 className="h-8 w-8" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{hospital.organization_name || hospital.full_name}</h3>
                          {hospital.city && (
                            <p className="text-sm text-muted-foreground">{hospital.city}</p>
                          )}
                          {hospital.phone && (
                            <p className="text-sm text-muted-foreground">Phone: {hospital.phone}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {selectedHospital && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="appointment_date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Appointment Date & Time *
                    </Label>
                    <Input
                      id="appointment_date"
                      type="datetime-local"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="appointment_notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="appointment_notes"
                      value={appointmentNotes}
                      onChange={(e) => setAppointmentNotes(e.target.value)}
                      placeholder="Any additional information for the hospital..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate('/dashboard')}
                    >
                      Skip for Now
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={handleBookAppointment}
                      disabled={loading}
                    >
                      {loading ? "Booking..." : "Book Appointment"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default ProfileDetails;