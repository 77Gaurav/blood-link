import { useState, useEffect } from "react";
import { Droplet, Heart, Activity } from "lucide-react";

const bloodFacts = [
  "Did you know? One blood donation can save up to 3 lives!",
  "Type O negative blood is the universal donor type and can be given to anyone.",
  "Your body replaces the donated blood volume within 24-48 hours.",
  "Blood type AB positive is the universal plasma donor.",
  "Red blood cells live for about 120 days in the body.",
  "Platelets, crucial for clotting, only live for about 5-7 days.",
  "The human body contains approximately 5 liters of blood.",
  "Blood makes up about 7% of your body weight.",
  "Every 2 seconds, someone in need receives blood transfusion.",
  "Regular blood donors have a reduced risk of heart disease.",
  "It takes only about 10 minutes to donate blood.",
  "Blood is made up of 55% plasma and 45% cells.",
  "White blood cells are your body's defense system.",
  "One donation can help patients with cancer, trauma, or surgery.",
  "Blood cannot be manufactured - it can only come from donors.",
];

export const BloodFactLoader = () => {
  const [currentFact, setCurrentFact] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Select a random fact
    const randomFact = bloodFacts[Math.floor(Math.random() * bloodFacts.length)];
    setCurrentFact(randomFact);

    // Animate progress bar
    const duration = 8000; // 8 seconds
    const interval = 50;
    const increment = (interval / duration) * 100;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 backdrop-blur-sm animate-fade-in">
      <div className="max-w-2xl w-full mx-4 space-y-8">
        {/* Animated Blood Drop */}
        <div className="flex justify-center animate-scale-in">
          <div className="relative">
            <Droplet className="h-24 w-24 text-primary animate-pulse" fill="currentColor" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Heart className="h-8 w-8 text-white animate-[pulse_1.5s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>

        {/* Fact Card */}
        <div className="bg-card/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-primary/20 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-secondary animate-pulse" />
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                Did You Know?
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {currentFact}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Loading your dashboard...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="relative h-2 bg-secondary/20 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Droplets Animation */}
        <div className="flex justify-center gap-4 animate-fade-in">
          {[...Array(5)].map((_, i) => (
            <Droplet
              key={i}
              className="h-4 w-4 text-primary/40 animate-[bounce_2s_ease-in-out_infinite]"
              style={{
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
