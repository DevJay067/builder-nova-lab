import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import {
  Brain,
  History,
  Heart,
  Activity,
  Shield,
  Stethoscope,
  Plus,
  ChevronRight,
  Sparkles,
  Clock,
  Users,
  User,
  LogOut,
  LogIn,
  Zap,
  Star,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Globe,
  Lock,
} from "lucide-react";
import LanguageSelector from "@/components/LanguageSelector";
import { useTranslation } from "@/contexts/LanguageContext";

export default function Index() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Smooth scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: "smooth" });
    checkAuthStatus();

    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Simulate loading for smooth experience
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => {
      clearInterval(timeInterval);
      clearTimeout(loadingTimer);
    };
  }, []);

  const checkAuthStatus = () => {
    try {
      const storedUser = localStorage.getItem("healthchain_user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("healthchain_user");
    localStorage.removeItem("sessionToken");
    document.cookie =
      "healthchain_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setUser(null);
    setIsAuthenticated(false);
  };

  const features = [
    {
      id: "bmax",
      title: "B-max AI Assistant",
      description:
        "Your personal AI health companion for intelligent medical insights and personalized recommendations.",
      icon: Brain,
      color: "bg-primary",
      route: "/bmax",
      stats: "24/7 Available",
      gradient: "from-primary/20 to-accent/20",
      highlight: true,
    },
    {
      id: "bmax-pro",
      title: "B-max Pro",
      description:
        "See how medical history personalizes AI responses. Test query enhancement with your health data.",
      icon: Sparkles,
      color: "bg-purple-500",
      route: "/bmax-pro",
      stats: "Professional AI",
      gradient: "from-purple-500/20 to-indigo-500/20",
      externalUrl: "https://b-maxpro2.netlify.app/",
    },
    {
      id: "history",
      title: "Health History",
      description:
        "Comprehensive health records and AI search history securely stored on blockchain.",
      icon: History,
      color: "bg-green-500",
      route: "/history",
      stats: "Secure & Private",
      gradient: "from-green-500/20 to-emerald-500/20",
    },
    {
      id: "monitoring",
      title: "Real-time Monitoring",
      description:
        "Live health monitoring dashboard with IoT device integration and real-time vital signs tracking.",
      icon: TrendingUp,
      color: "bg-blue-500",
      route: "/monitoring",
      stats: "Live IoT Data",
      gradient: "from-blue-500/20 to-cyan-500/20",
    },
    {
      id: "analytics",
      title: "Health Analytics",
      description:
        "Advanced analytics and insights from your health data with predictive AI modeling.",
      icon: Activity,
      color: "bg-orange-500",
      route: "/health-analytics",
      stats: "AI Insights",
      gradient: "from-orange-500/20 to-red-500/20",
    },
    {
      id: "firstaid",
      title: "Emergency First Aid",
      description:
        "Instant access to emergency protocols, first aid guides, and emergency contact integration.",
      icon: Heart,
      color: "bg-red-500",
      route: "/first-aid",
      stats: "Emergency Ready",
      gradient: "from-red-500/20 to-pink-500/20",
      urgent: true,
    },
    {
      id: "legal",
      title: "Privacy & Legal",
      description:
        "Comprehensive privacy controls, data ownership, and legal compliance documentation.",
      icon: Shield,
      color: "bg-blue-500",
      route: "/legal",
      stats: "HIPAA Compliant",
      gradient: "from-blue-500/20 to-cyan-500/20",
    },
  ];

  const stats = [
    {
      label: "Data Security",
      value: "100%",
      icon: Lock,
      description: "End-to-end encryption",
      color: "text-cyan-600",
    },
    {
      label: "AI Assistant",
      value: "24/7",
      icon: Brain,
      description: "Always available",
      color: "text-green-600",
    },
    {
      label: "Storage",
      value: "∞",
      icon: Globe,
      description: "Unlimited blockchain storage",
      color: "text-purple-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
            <Stethoscope className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded skeleton mx-auto"></div>
            <div className="h-3 w-24 bg-muted rounded skeleton mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 page-transition">
      {/* Enhanced Header */}
      <header className="border-b border-border/40 glass sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo with enhanced animation */}
            <div className="flex items-center space-x-3 fade-in">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 transform-smooth hover:scale-110">
                <Stethoscope className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">HealthChain</h1>
                <p className="text-sm text-muted-foreground">Secure Healthcare Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <LanguageSelector />
              <div className="hidden md:flex items-center space-x-2">
                {isAuthenticated ? (
                  <>
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {t("common.active") || "Active"}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-1" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Link to="/login">
                    <Button variant="outline" size="sm">
                      <LogIn className="w-4 h-4 mr-1" />
                      Login
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.id} className={`${feature.highlight ? "shadow-colored border-primary/30" : ""}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feature.color} text-white`}>
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </div>
                  </div>
                  {feature.highlight && (
                    <Badge className="ml-2">
                      <Sparkles className="h-3 w-3 mr-1" /> Featured
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">{feature.stats}</div>
                  <div className="space-x-2">
                    <Link to={feature.route}>
                      <Button size="sm" variant="outline">
                        Open
                        <ChevronRight className="ml-1 w-4 h-4" />
                      </Button>
                    </Link>
                    {feature.externalUrl && (
                      <a href={feature.externalUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="secondary">
                          Live
                          <Globe className="ml-1 w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Access */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link to="/bmax">
                <Button variant="outline" className="w-full">
                  <Brain className="w-4 h-4 mr-2" /> B-max AI
                </Button>
              </Link>
              <Link to="/bmax-pro">
                <Button variant="outline" className="w-full">
                  <Sparkles className="w-4 h-4 mr-2" /> B-max Pro
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security & Privacy</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link to="/legal">
                <Button variant="outline" className="w-full">
                  <Shield className="w-4 h-4 mr-2" /> Privacy & Legal
                </Button>
              </Link>
              <Link to="/history">
                <Button variant="outline" className="w-full">
                  <History className="w-4 h-4 mr-2" /> Health History
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
