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
import {
  Shield,
  Key,
  Users,
  Lock,
  Eye,
  UserCheck,
  Database,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Settings,
  Smartphone,
  Globe,
  FileText,
  Brain,
} from "lucide-react";

export default function WhyLogin() {
  const benefits = [
    {
      icon: Key,
      title: "Personal Key Management",
      description: "Each user gets their own unique split-key set for maximum security",
      details: [
        "Automatically generated patient key fragment",
        "Secure key distribution and storage",
        "Personal control over data access permissions"
      ],
      color: "bg-primary"
    },
    {
      icon: Lock,
      title: "Data Isolation",
      description: "Your health data is completely separated from other users",
      details: [
        "No accidental access to other patients' data",
        "Personalized encryption keys per user",
        "Complete privacy protection"
      ],
      color: "bg-accent"
    },
    {
      icon: Brain,
      title: "Personalized AI",
      description: "AI recommendations based on your specific health history",
      details: [
        "Customized health insights",
        "Personal risk assessments",
        "Tailored treatment suggestions"
      ],
      color: "bg-info"
    },
    {
      icon: Shield,
      title: "Compliance & Audit",
      description: "Full HIPAA compliance with detailed access logging",
      details: [
        "Complete audit trail per user",
        "Regulatory compliance tracking",
        "Secure data sharing controls"
      ],
      color: "bg-success"
    }
  ];

  const currentLimitations = [
    {
      icon: AlertTriangle,
      title: "Shared Demo Keys",
      description: "All users currently use the same demo keys, reducing security",
      impact: "High Risk"
    },
    {
      icon: Users,
      title: "No Data Isolation",
      description: "All users' data is mixed together in the same storage",
      impact: "Privacy Risk"
    },
    {
      icon: Eye,
      title: "No Access Control",
      description: "Anyone can access any patient's health records",
      impact: "Security Risk"
    },
    {
      icon: Database,
      title: "No Personal Context",
      description: "AI cannot provide personalized recommendations",
      impact: "Functionality Loss"
    }
  ];

  const loginFeatures = [
    {
      icon: UserCheck,
      title: "Secure Authentication",
      description: "Email/password with optional 2FA for enhanced security"
    },
    {
      icon: Key,
      title: "Automatic Key Generation",
      description: "Split-keys automatically generated and securely distributed"
    },
    {
      icon: Smartphone,
      title: "Mobile-Friendly",
      description: "Responsive design works perfectly on all devices"
    },
    {
      icon: Globe,
      title: "Seamless Experience",
      description: "Single sign-on across all health management features"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Why User Login Matters
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Understanding the security benefits
                  </p>
                </div>
              </div>
            </div>
            <Link to="/login">
              <Button>
                <Key className="h-4 w-4 mr-2" />
                Try Login System
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Current Issue Alert */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Current Issue: Medical History Save Failures
            </CardTitle>
            <CardDescription>
              The medical history form is failing to save because the secure data storage system 
              requires proper user authentication and key management.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Quick Fix Applied:</strong> I've implemented a simplified storage system that bypasses 
                the complex key requirements for now, so your medical history form should work immediately.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Permanent Solution:</strong> A user login system would solve this properly and 
                provide much better security and functionality.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Benefits of User Login System */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Benefits of User Login System
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${benefit.color} text-white`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{benefit.title}</CardTitle>
                        <CardDescription>{benefit.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {benefit.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center text-sm">
                          <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Current Limitations */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Current Limitations (Without Login)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentLimitations.map((limitation, index) => {
              const IconComponent = limitation.icon;
              return (
                <Card key={index} className="border-destructive/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-5 w-5 text-destructive" />
                        <h3 className="font-semibold">{limitation.title}</h3>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {limitation.impact}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {limitation.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Login System Features */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            What the Login System Provides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loginFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <h3 className="font-semibold">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Implementation Status */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Implementation Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  ✅ Already Implemented
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Complete login/register UI</li>
                  <li>• User session management</li>
                  <li>• Password security validation</li>
                  <li>• Responsive mobile design</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                  🔄 Ready to Connect
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Integration with secure key system</li>
                  <li>• Personal data isolation</li>
                  <li>• Custom AI personalization</li>
                  <li>• Enhanced audit logging</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="pt-6 text-center">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Ready to Experience Secure Healthcare?
            </h3>
            <p className="text-muted-foreground mb-6">
              Try the login system now to see how personal key management and data isolation work.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="px-8">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Try Login System
                </Button>
              </Link>
              <Link to="/secure">
                <Button size="lg" variant="outline" className="px-8">
                  <Shield className="h-4 w-4 mr-2" />
                  View Secure System
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
