import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { Droplet, LogOut } from "lucide-react";
import { VolunteerDashboard } from "@/components/VolunteerDashboard";
import { PosterDashboard } from "@/components/PosterDashboard";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      
      // Fetch user role and profile from user_roles table
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      setUserRole(roleData?.role || null);

      // Check if volunteer needs to complete profile
      if (roleData?.role === 'volunteer') {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('profile_completed')
          .eq('id', session.user.id)
          .single();

        if (!profileData?.profile_completed) {
          navigate('/profile-details');
          return;
        }
      }
      
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        // Refetch role on auth change
        setTimeout(() => {
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single()
            .then(({ data }) => setUserRole(data?.role || null));
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Droplet className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <nav className="bg-card/80 backdrop-blur-sm border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            <Droplet className="h-8 w-8 text-secondary" />
            <span className="text-2xl font-bold">BloodLink</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground capitalize">
              {userRole?.replace('_', ' ')}
            </span>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-8">
        <div className="max-w-6xl mx-auto">
          {userRole === 'volunteer' ? (
            <VolunteerDashboard />
          ) : userRole === 'hospital' || userRole === 'blood_bank' ? (
            <PosterDashboard userRole={userRole} />
          ) : (
            <div className="text-center p-8">
              <p className="text-muted-foreground">Unable to determine user role</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
