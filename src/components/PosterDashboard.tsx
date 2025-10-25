import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Droplet, MapPin, Clock, Trash2, Users, Phone, User, Weight, Calendar, Package, AlertCircle, CheckCircle, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryManagement } from "./InventoryManagement";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChatSystem } from "./ChatSystem";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Participation {
  id: string;
  volunteer_id: string;
  volunteer_name: string;
  age: number;
  gender: string;
  weight: number;
  message: string;
  contact_number: string;
  city: string;
  created_at: string;
  status: string;
}

interface EmergencyPost {
  id: string;
  blood_group: string;
  quantity: number;
  location: string;
  urgency_level: string;
  description: string;
  contact_phone: string;
  status: string;
  created_at: string;
  participations?: Participation[];
}

interface PosterDashboardProps {
  userRole?: string;
}

interface BloodAvailability {
  city: string;
  quantity: number;
  blood_bank_name: string;
  contact_phone: string;
  blood_bank_id: string;
}

export const PosterDashboard = ({ userRole }: PosterDashboardProps) => {
  const [posts, setPosts] = useState<EmergencyPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [openPostIds, setOpenPostIds] = useState<Set<string>>(new Set());
  const [availabilityCheck, setAvailabilityCheck] = useState<BloodAvailability[] | null>(null);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    blood_group: '',
    quantity: '',
    location: '',
    urgency_level: '',
    description: '',
    contact_phone: ''
  });

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUser(user.id);
    };
    initUser();
    fetchMyPosts();

    // Set up real-time subscription for new participations
    const channel = supabase
      .channel('participation-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'participations'
        },
        (payload) => {
          const newParticipation = payload.new as Participation;
          toast({
            title: "New Volunteer Response! 🎉",
            description: `${newParticipation.volunteer_name} wants to help with your blood request!`,
          });
          fetchMyPosts(); // Refresh to show new participation
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMyPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: postsData, error: postsError } = await supabase
        .from('emergency_posts')
        .select('*')
        .eq('posted_by', user.id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch participations for each post
      if (postsData && postsData.length > 0) {
        const postsWithParticipations = await Promise.all(
          postsData.map(async (post) => {
            const { data: participationsData } = await supabase
              .from('participations')
              .select('*')
              .eq('emergency_id', post.id)
              .order('created_at', { ascending: false });

            return {
              ...post,
              participations: participationsData || []
            };
          })
        );
        setPosts(postsWithParticipations);
      } else {
        setPosts([]);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const togglePostOpen = (postId: string) => {
    setOpenPostIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const checkBloodAvailability = async () => {
    setLoading(true);
    try {
      // Query all blood bank inventories for the requested blood group
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('blood_inventory')
        .select('city, quantity, blood_bank_id')
        .eq('blood_group', formData.blood_group as any)
        .gte('quantity', parseInt(formData.quantity));

      if (inventoryError) throw inventoryError;

      // If blood is available in one or more cities, get blood bank details
      if (inventoryData && inventoryData.length > 0) {
        const bloodBankIds = inventoryData.map(item => item.blood_bank_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, organization_name, phone')
          .in('id', bloodBankIds);

        if (profilesError) throw profilesError;

        const availability: BloodAvailability[] = inventoryData.map(item => {
          const profile = profilesData?.find(p => p.id === item.blood_bank_id);
          return {
            city: item.city,
            quantity: item.quantity,
            blood_bank_name: profile?.organization_name || 'Unknown Blood Bank',
            contact_phone: profile?.phone || 'N/A',
            blood_bank_id: item.blood_bank_id
          };
        });

        setAvailabilityCheck(availability);
        setShowAvailabilityDialog(true);
        return true; // Blood available
      }

      // No blood available, can post directly
      return false;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only check availability for hospital users
    if (userRole === 'hospital') {
      const isAvailable = await checkBloodAvailability();
      if (isAvailable) {
        // Blood is available, show dialog - don't post yet
        return;
      }
    }

    // Proceed with posting (either blood_bank or no availability found)
    await postEmergency();
  };

  const postEmergency = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from('emergency_posts').insert({
        blood_group: formData.blood_group as any,
        quantity: parseInt(formData.quantity),
        location: formData.location,
        urgency_level: formData.urgency_level,
        description: formData.description,
        contact_phone: formData.contact_phone,
        posted_by: user.id
      });

      if (error) throw error;

      toast({ title: "Success", description: "Emergency request posted successfully!" });
      setOpen(false);
      setShowAvailabilityDialog(false);
      setAvailabilityCheck(null);
      setFormData({
        blood_group: '',
        quantity: '',
        location: '',
        urgency_level: '',
        description: '',
        contact_phone: ''
      });
      fetchMyPosts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (bloodBankId: string, emergencyPostId: string) => {
    try {
      if (!currentUser) throw new Error("Not authenticated");

      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("hospital_id", currentUser)
        .eq("blood_bank_id", bloodBankId)
        .eq("emergency_post_id", emergencyPostId)
        .single();

      if (existingConversation) {
        toast({
          title: "Conversation exists",
          description: "Opening existing conversation",
        });
        return;
      }

      // Create new conversation
      const { error } = await supabase.from("conversations").insert({
        hospital_id: currentUser,
        blood_bank_id: bloodBankId,
        emergency_post_id: emergencyPostId,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Conversation started! Check the Messages tab.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('emergency_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Post deleted successfully" });
      fetchMyPosts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // If user is blood bank, show tabs with inventory
  if (userRole === 'blood_bank') {
    return (
      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <Droplet className="h-4 w-4" />
            Emergency Posts
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Emergency Posts</h2>
                <p className="text-muted-foreground">Manage your blood requirement requests</p>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    <Plus className="h-5 w-5 mr-2" /> Post Emergency
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Post Emergency Blood Requirement</DialogTitle>
                    <DialogDescription>
                      Fill in the details to notify volunteers about your urgent need
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Blood Group *</Label>
                        <Select value={formData.blood_group} onValueChange={(v) => setFormData({...formData, blood_group: v})} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select blood group" />
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
                        <Label>Quantity (units) *</Label>
                        <Input 
                          type="number" 
                          value={formData.quantity} 
                          onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                          min="1"
                          required 
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Location *</Label>
                      <Input 
                        value={formData.location} 
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="Hospital/Blood Bank address"
                        required 
                      />
                    </div>

                    <div>
                      <Label>Urgency Level *</Label>
                      <Select value={formData.urgency_level} onValueChange={(v) => setFormData({...formData, urgency_level: v})} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical - Immediate need</SelectItem>
                          <SelectItem value="high">High - Within 24 hours</SelectItem>
                          <SelectItem value="medium">Medium - Within 48 hours</SelectItem>
                          <SelectItem value="low">Low - General requirement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Contact Phone *</Label>
                      <Input 
                        type="tel"
                        value={formData.contact_phone} 
                        onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                        placeholder="+1234567890"
                        required 
                      />
                    </div>

                    <div>
                      <Label>Additional Details</Label>
                      <Textarea 
                        value={formData.description} 
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Any additional information about the requirement"
                        rows={3}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Posting..." : "Post Emergency Request"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Blood Availability Check Dialog */}
              <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Blood Available in Blood Banks
                    </DialogTitle>
                    <DialogDescription>
                      We found {formData.blood_group} blood ({formData.quantity}+ units) available in the following blood banks. Consider contacting them directly before posting an emergency request to volunteers.
                    </DialogDescription>
                  </DialogHeader>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Blood Banks Have Stock</AlertTitle>
                    <AlertDescription>
                      The blood you need is available in blood bank inventories. We recommend contacting them first as it's faster and more reliable than waiting for volunteer donors.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availabilityCheck?.map((item, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-lg">{item.blood_bank_name}</h4>
                            <Badge variant="secondary" className="gap-1">
                              <Droplet className="h-3 w-3" />
                              {item.quantity} units
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{item.city}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${item.contact_phone}`} className="text-primary hover:underline">
                              {item.contact_phone}
                            </a>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => {
                              // We'll need the emergency post ID to create conversation
                              // For now, we'll pass null and create without post link
                              startConversation(item.blood_bank_id, '');
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Start Chat
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setShowAvailabilityDialog(false);
                        setAvailabilityCheck(null);
                      }}
                    >
                      Contact Blood Banks
                    </Button>
                    <Button 
                      variant="default" 
                      className="flex-1"
                      onClick={postEmergency}
                      disabled={loading}
                    >
                      {loading ? "Posting..." : "Post Anyway"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {posts.length === 0 ? (
              <Card className="p-12 text-center">
                <Droplet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
                <p className="text-muted-foreground">Create your first emergency request to get started</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {posts.map((post) => (
                  <Card key={post.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <Droplet className="h-5 w-5 text-primary" />
                            <span className="text-xl font-bold">{post.blood_group}</span>
                          </div>
                          <Badge variant={post.status === 'active' ? 'default' : 'secondary'}>
                            {post.status}
                          </Badge>
                          <Badge variant="outline">{post.urgency_level}</Badge>
                          <Badge variant="secondary" className="gap-1">
                            <Users className="h-3 w-3" />
                            {post.participations?.length || 0} Volunteers
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{post.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(post.created_at).toLocaleString()}</span>
                          </div>
                          {post.description && (
                            <p className="text-muted-foreground mt-2">{post.description}</p>
                          )}
                        </div>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(post.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>

                    {post.participations && post.participations.length > 0 && (
                      <Collapsible 
                        open={openPostIds.has(post.id)}
                        onOpenChange={() => togglePostOpen(post.id)}
                        className="border-t pt-4"
                      >
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="w-full justify-between">
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              View Volunteer Responses ({post.participations.length})
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {openPostIds.has(post.id) ? '▲' : '▼'}
                            </span>
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3 mt-4">
                          {post.participations.map((participation) => (
                            <Card key={participation.id} className="p-4 bg-muted/50">
                              <div className="grid gap-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-base flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {participation.volunteer_name}
                                  </h4>
                                  <Badge variant="outline">{participation.status}</Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{participation.contact_number}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{participation.city}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{participation.age} years, {participation.gender}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Weight className="h-4 w-4 text-muted-foreground" />
                                    <span>{participation.weight} kg</span>
                                  </div>
                                </div>

                                {participation.message && (
                                  <div className="pt-2 border-t">
                                    <p className="text-sm italic text-muted-foreground">
                                      "{participation.message}"
                                    </p>
                                  </div>
                                )}

                                <div className="text-xs text-muted-foreground">
                                  Responded: {new Date(participation.created_at).toLocaleString()}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="inventory">
          <InventoryManagement />
        </TabsContent>

        <TabsContent value="messages">
          {currentUser && <ChatSystem currentUserId={currentUser} />}
        </TabsContent>
      </Tabs>
    );
  }

  // For hospitals, show only posts (no inventory)
  return (
    <Tabs defaultValue="posts" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="posts" className="flex items-center gap-2">
          <Droplet className="h-4 w-4" />
          Emergency Posts
        </TabsTrigger>
        <TabsTrigger value="messages" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Messages
        </TabsTrigger>
      </TabsList>

      <TabsContent value="posts" className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Emergency Posts</h2>
          <p className="text-muted-foreground">Manage your blood requirement requests</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" /> Post Emergency
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Post Emergency Blood Requirement</DialogTitle>
              <DialogDescription>
                Fill in the details to notify volunteers about your urgent need
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Blood Group *</Label>
                  <Select value={formData.blood_group} onValueChange={(v) => setFormData({...formData, blood_group: v})} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
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
                  <Label>Quantity (units) *</Label>
                  <Input 
                    type="number" 
                    value={formData.quantity} 
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    min="1"
                    required 
                  />
                </div>
              </div>

              <div>
                <Label>Location *</Label>
                <Input 
                  value={formData.location} 
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Hospital/Blood Bank address"
                  required 
                />
              </div>

              <div>
                <Label>Urgency Level *</Label>
                <Select value={formData.urgency_level} onValueChange={(v) => setFormData({...formData, urgency_level: v})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical - Immediate need</SelectItem>
                    <SelectItem value="high">High - Within 24 hours</SelectItem>
                    <SelectItem value="medium">Medium - Within 48 hours</SelectItem>
                    <SelectItem value="low">Low - General requirement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Contact Phone *</Label>
                <Input 
                  type="tel"
                  value={formData.contact_phone} 
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  placeholder="+1234567890"
                  required 
                />
              </div>

              <div>
                <Label>Additional Details</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Any additional information about the requirement"
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Checking availability..." : "Check Availability & Post"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Blood Availability Check Dialog */}
        <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Blood Available in Blood Banks
              </DialogTitle>
              <DialogDescription>
                We found {formData.blood_group} blood ({formData.quantity}+ units) available in the following blood banks. Consider contacting them directly before posting an emergency request to volunteers.
              </DialogDescription>
            </DialogHeader>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Blood Banks Have Stock</AlertTitle>
              <AlertDescription>
                The blood you need is available in blood bank inventories. We recommend contacting them first as it's faster and more reliable than waiting for volunteer donors.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availabilityCheck?.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg">{item.blood_bank_name}</h4>
                      <Badge variant="secondary" className="gap-1">
                        <Droplet className="h-3 w-3" />
                        {item.quantity} units
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{item.city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${item.contact_phone}`} className="text-primary hover:underline">
                        {item.contact_phone}
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowAvailabilityDialog(false);
                  setAvailabilityCheck(null);
                  setOpen(false);
                }}
              >
                Contact Blood Banks
              </Button>
              <Button 
                variant="default" 
                className="flex-1"
                onClick={postEmergency}
                disabled={loading}
              >
                {loading ? "Posting..." : "Post to Volunteers Anyway"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {posts.length === 0 ? (
        <Card className="p-12 text-center">
          <Droplet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
          <p className="text-muted-foreground">Create your first emergency request to get started</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Droplet className="h-5 w-5 text-primary" />
                      <span className="text-xl font-bold">{post.blood_group}</span>
                    </div>
                    <Badge variant={post.status === 'active' ? 'default' : 'secondary'}>
                      {post.status}
                    </Badge>
                    <Badge variant="outline">{post.urgency_level}</Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {post.participations?.length || 0} Volunteers
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{post.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(post.created_at).toLocaleString()}</span>
                    </div>
                    {post.description && (
                      <p className="text-muted-foreground mt-2">{post.description}</p>
                    )}
                  </div>
                </div>

                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleDelete(post.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>

              {post.participations && post.participations.length > 0 && (
                <Collapsible 
                  open={openPostIds.has(post.id)}
                  onOpenChange={() => togglePostOpen(post.id)}
                  className="border-t pt-4"
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        View Volunteer Responses ({post.participations.length})
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {openPostIds.has(post.id) ? '▲' : '▼'}
                      </span>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 mt-4">
                    {post.participations.map((participation) => (
                      <Card key={participation.id} className="p-4 bg-muted/50">
                        <div className="grid gap-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-base flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {participation.volunteer_name}
                            </h4>
                            <Badge variant="outline">{participation.status}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{participation.contact_number}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{participation.city}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{participation.age} years, {participation.gender}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Weight className="h-4 w-4 text-muted-foreground" />
                              <span>{participation.weight} kg</span>
                            </div>
                          </div>

                          {participation.message && (
                            <div className="pt-2 border-t">
                              <p className="text-sm italic text-muted-foreground">
                                "{participation.message}"
                              </p>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            Responded: {new Date(participation.created_at).toLocaleString()}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </Card>
          ))}
        </div>
      )}
      </TabsContent>

      <TabsContent value="messages">
        {currentUser && <ChatSystem currentUserId={currentUser} />}
      </TabsContent>
    </Tabs>
  );
};
