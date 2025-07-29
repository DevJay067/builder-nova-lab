import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Users
} from "lucide-react";

export default function Index() {
  const features = [
    {
      id: 'bmax',
      title: 'B-max AI Assistant',
      description: 'Your personal AI health companion for intelligent medical insights and personalized recommendations.',
      icon: Brain,
      color: 'bg-primary',
      route: '/bmax',
      stats: '24/7 Available',
      gradient: 'from-primary/20 to-accent/20'
    },
    {
      id: 'history',
      title: 'Health History',
      description: 'Comprehensive health records and AI search history securely stored on blockchain.',
      icon: History,
      color: 'bg-accent',
      route: '/history',
      stats: 'Blockchain Secured',
      gradient: 'from-accent/20 to-primary/20'
    },
    {
      id: 'firstaid',
      title: 'Emergency First Aid',
      description: 'Instant access to first aid guidance for common health emergencies and conditions.',
      icon: Heart,
      color: 'bg-destructive',
      route: '/first-aid',
      stats: 'Emergency Ready',
      gradient: 'from-destructive/20 to-warning/20'
    },
    {
      id: 'analytics',
      title: 'Health Analytics',
      description: 'Advanced insights and trends from your health data with predictive analytics.',
      icon: Activity,
      color: 'bg-info',
      route: '/analytics',
      stats: 'AI Powered',
      gradient: 'from-info/20 to-success/20'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary text-primary-foreground">
                <Stethoscope className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-foreground">HealthChain</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Blockchain-Powered Healthcare</p>
              </div>
            </div>
            <div className="flex items-center">
              <Badge variant="secondary" className="text-xs px-2 py-1">
                <Shield className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Blockchain </span>Secured
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 sm:py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center rounded-full px-3 py-2 sm:px-4 bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-6 sm:mb-8">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="whitespace-nowrap">Next-Gen Healthcare</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight px-2">
            Your Health,
            <span className="text-primary"> Secured</span> by
            <span className="text-accent"> Blockchain</span>
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
            Experience the future of healthcare with AI-powered insights, secure blockchain storage,
            and comprehensive health management tools designed for your wellbeing.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-16 px-4">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">100%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Data Security</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-accent mb-1 sm:mb-2">24/7</div>
              <div className="text-xs sm:text-sm text-muted-foreground">AI Assistant</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-info mb-1 sm:mb-2">∞</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Storage</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 pb-12 sm:pb-20">
        <div className="text-center mb-8 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4 px-2">
            Comprehensive Health Solutions
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Four powerful tools to transform your healthcare experience and keep you in control
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 max-w-6xl mx-auto">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Card
                key={feature.id}
                className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 active:scale-95 touch-manipulation"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <CardHeader className="relative z-10 pb-3 sm:pb-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${feature.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      {feature.stats}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg sm:text-2xl mb-2 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 pt-0">
                  <Link to={feature.route}>
                    <Button
                      variant="ghost"
                      className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 min-h-[44px] text-sm sm:text-base"
                    >
                      Get Started
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="bg-gradient-to-r from-primary via-accent to-primary py-12 sm:py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 px-2">
              Ready to Transform Your Healthcare?
            </h2>
            <p className="text-base sm:text-xl text-white/90 mb-6 sm:mb-8 px-4">
              Join thousands who trust HealthChain for secure, intelligent healthcare management
            </p>
            <div className="flex flex-col gap-3 sm:gap-4 justify-center px-4">
              <Link to="/bmax" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 min-h-[48px] sm:min-h-[52px]">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Start with B-max AI
                </Button>
              </Link>
              <Link to="/history" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary min-h-[48px] sm:min-h-[52px]">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  View Health History
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
                <Stethoscope className="h-4 w-4" />
              </div>
              <span className="text-base sm:text-lg font-semibold text-foreground">HealthChain</span>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground text-center">
              © 2024 HealthChain. Secured by blockchain technology.
              <br />
              <span className="text-xs">Developer: Jay Magar</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
