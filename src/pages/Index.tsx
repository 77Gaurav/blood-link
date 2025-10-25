import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Droplet, Heart, MapPin, Clock, Shield, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Droplet className="h-16 w-16 text-secondary animate-pulse" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            BloodLink
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Connecting Hospitals, Blood Banks, and Volunteers to Save Lives
          </p>

          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join our life-saving network where every drop counts. Whether you're a hospital posting urgent needs 
            or a volunteer ready to donate, BloodLink makes blood donation simple, fast, and efficient.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg px-8">
              Login
            </Button>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mb-20">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Real-time Updates</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary mb-2">Fast</div>
              <div className="text-sm text-muted-foreground">Emergency Response</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">Secure</div>
              <div className="text-sm text-muted-foreground">Verified Network</div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <Card className="p-6 hover:shadow-lg transition-shadow bg-card/50 backdrop-blur-sm border-2">
              <Heart className="h-12 w-12 text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Emergency Posting</h3>
              <p className="text-muted-foreground">Hospitals and blood banks can post urgent requirements instantly with detailed information</p>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow bg-card/50 backdrop-blur-sm border-2">
              <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Location-Based</h3>
              <p className="text-muted-foreground">Find nearby donors and blood banks in real-time with precise location tracking</p>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow bg-card/50 backdrop-blur-sm border-2">
              <Droplet className="h-12 w-12 text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Volunteer Network</h3>
              <p className="text-muted-foreground">Connect with registered volunteers ready to help save lives immediately</p>
            </Card>
          </div>

          {/* How It Works */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground mb-12">Three simple steps to save lives</p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6 bg-card/50 backdrop-blur-sm">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">1. Sign Up</h3>
                <p className="text-sm text-muted-foreground">Create your account as a hospital, blood bank, or volunteer</p>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur-sm">
                <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">2. Post or Browse</h3>
                <p className="text-sm text-muted-foreground">Hospitals post requirements, volunteers browse urgent needs</p>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur-sm">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">3. Connect & Save</h3>
                <p className="text-sm text-muted-foreground">Get connected instantly and help save lives together</p>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <Card className="p-12 bg-gradient-to-r from-primary/10 to-secondary/10 border-2">
            <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of heroes saving lives through blood donation
            </p>
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-12">
              Join BloodLink Today
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
