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
      id: "bmax-demo",
      title: "B-max AI Demo",
      description:
        "See how medical history personalizes AI responses. Test query enhancement with your health data.",
      icon: Sparkles,
      color: "bg-purple-500",
      route: "/bmax-demo",
      stats: "Interactive Demo",
      gradient: "from-purple-500/20 to-indigo-500/20",
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
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                  {t("app.title")}
                </h1>
                <p className="text-sm text-slate-600 font-medium">
                  {t("app.subtitle")}
                </p>
                <p className="text-xs text-blue-600 font-semibold">
                  {t("app.developer")}
                </p>
              </div>
            </div>

            {/* Enhanced Auth Section */}
            <div className="flex items-center space-x-3 fade-in fade-in-delay-1">
              <LanguageSelector variant="compact" className="mr-2" />
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="w-2 h-2 rounded-full status-online"></div>
                    <span className="text-sm font-medium text-foreground">
                      {user?.username || "User"}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="hidden sm:flex items-center space-x-1 bg-green-50 text-green-700 border-green-200"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Blockchain Secured</span>
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="btn-smooth hover:bg-destructive hover:text-destructive-foreground border-border/50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              ) : (
                <Link to="/login">
                  <Button className="btn-smooth shadow-colored">
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Enhanced Animations */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-primary/5 rounded-full blur-xl float" />
          <div
            className="absolute top-40 right-20 w-32 h-32 bg-purple-500/5 rounded-full blur-xl float"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute bottom-20 left-1/4 w-24 h-24 bg-green-500/5 rounded-full blur-xl float"
            style={{ animationDelay: "4s" }}
          />
        </div>

        <div className="container mx-auto px-4 text-center relative">
          {/* Enhanced Badge */}
          <Badge
            variant="secondary"
            className="mb-8 px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20 fade-in hover:bg-primary/15 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Next-Gen Healthcare
          </Badge>

          {/* Enhanced Hero Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight fade-in-up fade-in-delay-1">
            Your Health,{" "}
            <span className="text-gradient bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
              Secured
            </span>{" "}
            by
            <br />
            <span className="text-gradient bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              Blockchain
            </span>
          </h1>

          {/* Enhanced Description */}
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed fade-in-up fade-in-delay-2">
            Experience the future of healthcare with AI-powered insights, secure
            blockchain storage, and comprehensive health management tools
            designed for your wellbeing.
          </p>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 fade-in-up fade-in-delay-3">
            <Link to="/bmax" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto btn-smooth shadow-colored-lg text-lg px-8 py-4 h-auto"
              >
                <Brain className="w-5 h-5 mr-2" />
                Try B-max AI
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/history" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto btn-smooth border-border/50 text-lg px-8 py-4 h-auto hover:bg-muted"
              >
                <History className="w-5 h-5 mr-2" />
                View Health History
              </Button>
            </Link>
          </div>

          {/* Enhanced Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto fade-in-up fade-in-delay-4">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center group">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors">
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-foreground mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* YouTube Video Demo Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              See HealthChain in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch our demo video to learn how HealthChain transforms healthcare management
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 fade-in-up fade-in-delay-1">
            {/* Main Demo Video */}
            <div className="lg:col-span-2">
              <Card className="shadow-colored border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  <YouTubeVideoTrigger
                    videoId="dQw4w9WgXcQ"
                    title="HealthChain Platform Demo - Complete Walkthrough"
                    buttonText=""
                    className="w-full h-0 p-0 border-0 bg-transparent hover:bg-transparent"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Video Playlist */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground mb-4">Quick Tutorials</h3>

              <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <YouTubeVideoTrigger
                    videoId="ScMzIvxBSi4"
                    title="Getting Started with B-max AI"
                    buttonText=""
                    className="w-full h-0 p-0 border-0 bg-transparent hover:bg-transparent"
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <YouTubeVideoTrigger
                    videoId="jNQXAC9IVRw"
                    title="Health Data Security Explained"
                    buttonText=""
                    className="w-full h-0 p-0 border-0 bg-transparent hover:bg-transparent"
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <YouTubeVideoTrigger
                    videoId="M7lc1UVf-VE"
                    title="Real-time Health Monitoring"
                    buttonText=""
                    className="w-full h-0 p-0 border-0 bg-transparent hover:bg-transparent"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12 fade-in-up fade-in-delay-2">
            <YouTubeVideoTrigger
              videoId="dQw4w9WgXcQ"
              title="HealthChain Full Demo - Experience the Future of Healthcare"
              buttonText="Watch Full Demo"
              size="lg"
              className="shadow-colored-lg text-lg px-8 py-4 h-auto"
            />
            <p className="text-sm text-muted-foreground mt-4">
              See how our platform can revolutionize your healthcare experience
            </p>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20 bg-muted/30 relative overflow-hidden">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-16 fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Comprehensive Health Solutions
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Five powerful tools to transform your healthcare experience and
              keep you in control
            </p>
          </div>

          {/* Enhanced Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Link
                key={feature.id}
                to={feature.route}
                className={`block group fade-in-up`}
                style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
              >
                <Card
                  className={`h-full card-hover shadow-colored transition-all duration-300 border-border/50 ${
                    feature.highlight
                      ? "ring-2 ring-primary/20 bg-primary/5"
                      : ""
                  } ${
                    feature.urgent ? "ring-2 ring-red-200 bg-red-50" : ""
                  } hover:shadow-lg hover:border-border group-hover:shadow-xl`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-xl ${feature.color} text-white shadow-lg shadow-${feature.color.split("-")[1]}-500/25 group-hover:scale-110 transition-transform`}
                      >
                        <feature.icon className="w-6 h-6" />
                      </div>
                      {feature.highlight && (
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary border-primary/20"
                        >
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                      {feature.urgent && (
                        <Badge
                          variant="destructive"
                          className="bg-red-100 text-red-700 border-red-200"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Emergency
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 pulse-slow"></div>
                        <span className="text-sm font-medium text-muted-foreground">
                          {feature.stats}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="border-t border-border/40 bg-muted/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="md:col-span-2 fade-in">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    HealthChain
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Blockchain Healthcare
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                Revolutionizing healthcare with secure blockchain technology,
                AI-powered insights, and comprehensive health management tools.
              </p>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Last updated: {currentTime.toLocaleDateString()}</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="fade-in fade-in-delay-1">
              <h4 className="text-sm font-semibold text-foreground mb-4">
                Quick Access
              </h4>
              <div className="space-y-2">
                {features.slice(0, 4).map((feature) => (
                  <Link
                    key={feature.id}
                    to={feature.route}
                    className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {feature.title}
                  </Link>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="fade-in fade-in-delay-2">
              <h4 className="text-sm font-semibold text-foreground mb-4">
                System Status
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Blockchain</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full status-online"></div>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">AI Assistant</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full status-online"></div>
                    <span className="text-green-600 font-medium">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data Security</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full status-online"></div>
                    <span className="text-green-600 font-medium">
                      Encrypted
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border/40 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center fade-in fade-in-delay-3">
            <div className="text-sm text-muted-foreground mb-4 sm:mb-0">
              © 2024 HealthChain. Developed by Jay Magar. All rights reserved.
            </div>
            <div className="flex items-center space-x-4">
              <Badge
                variant="outline"
                className="text-xs border-green-200 text-green-700"
              >
                <Shield className="w-3 h-3 mr-1" />
                HIPAA Compliant
              </Badge>
              <Badge
                variant="outline"
                className="text-xs border-blue-200 text-blue-700"
              >
                <Lock className="w-3 h-3 mr-1" />
                End-to-End Encrypted
              </Badge>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Video Button */}
      <FloatingVideoButton
        videoId="dQw4w9WgXcQ"
        title="HealthChain Demo - See How It Works"
        position="bottom-right"
      />
    </div>
  );
}
