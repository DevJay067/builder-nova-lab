import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Shield, 
  Scale, 
  Eye,
  Lock,
  Database,
  UserCheck,
  AlertTriangle,
  Mail,
  Calendar,
  FileText
} from "lucide-react";

export default function Legal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary text-secondary-foreground">
                  <Scale className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Legal Information</h1>
                  <p className="text-sm text-muted-foreground">Copyright & Privacy Policy</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Legal Document
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Last Updated Notice */}
        <Card className="mb-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Last Updated</h3>
                <p className="text-sm text-muted-foreground">
                  This document was last updated on {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Contents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a href="#copyright" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  1. Copyright Information
                </a>
                <a href="#privacy" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  2. Privacy Policy
                </a>
                <a href="#data-collection" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  3. Data Collection
                </a>
                <a href="#data-usage" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  4. Data Usage
                </a>
                <a href="#data-protection" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  5. Data Protection
                </a>
                <a href="#user-rights" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  6. Your Rights
                </a>
                <a href="#contact" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  7. Contact Information
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Copyright Section */}
            <Card id="copyright">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Scale className="h-6 w-6 mr-2 text-primary" />
                  Copyright Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-6 rounded-lg border border-primary/20">
                  <h3 className="font-semibold text-lg mb-3">Copyright Notice</h3>
                  <p className="text-sm leading-relaxed mb-4">
                    © 2024 <strong>Jay Magar</strong>. All rights reserved.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    HealthChain and all associated content, including but not limited to software code, 
                    design elements, user interface, graphics, text, and documentation, are the 
                    intellectual property of Jay Magar and are protected by copyright laws.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Permitted Use</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-success rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Personal use of the HealthChain application for healthcare management
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-success rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Educational purposes when properly attributed to Jay Magar
                    </li>
                  </ul>

                  <h4 className="font-semibold">Prohibited Use</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-destructive rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Commercial redistribution without written permission
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-destructive rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Modification or reverse engineering of the application
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-destructive rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Removal or alteration of copyright notices
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Policy */}
            <Card id="privacy">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Shield className="h-6 w-6 mr-2 text-primary" />
                  Privacy Policy
                </CardTitle>
                <CardDescription>
                  How we collect, use, and protect your personal health information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-info/10 p-4 rounded-lg border border-info/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Eye className="h-5 w-5 text-info" />
                    <h4 className="font-semibold">Our Commitment</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    HealthChain is committed to protecting your privacy and securing your personal 
                    health information. This policy explains how we handle your data with the highest 
                    standards of security and transparency.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Data Collection */}
            <Card id="data-collection">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2 text-accent" />
                  Data Collection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Health Information We Collect</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Personal health records (vitals, medical history, medications)</li>
                    <li>• AI assistant interaction logs and health queries</li>
                    <li>• Health analytics and tracking data</li>
                    <li>• Emergency contact information</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Technical Information</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Device information and browser type</li>
                    <li>• Usage patterns and feature interactions</li>
                    <li>• Error logs and performance metrics</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Data Usage */}
            <Card id="data-usage">
              <CardHeader>
                <CardTitle>How We Use Your Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                    <h4 className="font-semibold text-success mb-2">Primary Uses</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Providing AI-powered health insights</li>
                      <li>• Storing health records securely</li>
                      <li>• Emergency first aid guidance</li>
                      <li>• Health analytics and trends</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-info/10 rounded-lg border border-info/20">
                    <h4 className="font-semibold text-info mb-2">Secondary Uses</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Improving application performance</li>
                      <li>• Enhancing AI recommendations</li>
                      <li>• Technical support and troubleshooting</li>
                      <li>• Anonymous usage analytics</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Protection */}
            <Card id="data-protection">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2 text-success" />
                  Data Protection & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-success/5 to-primary/5 p-6 rounded-lg border border-success/20">
                  <h4 className="font-semibold mb-3">Blockchain Security</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your health data is protected using advanced blockchain technology, ensuring 
                    immutable storage and cryptographic security.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Shield className="h-6 w-6 text-success" />
                      </div>
                      <p className="text-xs font-medium">End-to-End Encryption</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Lock className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-xs font-medium">Private Key Control</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Database className="h-6 w-6 text-accent" />
                      </div>
                      <p className="text-xs font-medium">Immutable Storage</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Additional Security Measures</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Regular security audits and vulnerability assessments</li>
                    <li>• Access controls and authentication protocols</li>
                    <li>• Data backup and disaster recovery procedures</li>
                    <li>• Compliance with healthcare data protection standards</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* User Rights */}
            <Card id="user-rights">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck className="h-5 w-5 mr-2 text-accent" />
                  Your Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Data Rights</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Access your personal data</li>
                      <li>• Correct inaccurate information</li>
                      <li>• Delete your data</li>
                      <li>• Export your data</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Privacy Rights</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Opt-out of data collection</li>
                      <li>• Control data sharing settings</li>
                      <li>• Receive notifications of changes</li>
                      <li>• File privacy complaints</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-warning/10 p-4 rounded-lg border border-warning/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <h4 className="font-semibold">Important Note</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Due to the immutable nature of blockchain technology, some data deletion 
                    requests may require special procedures. We will work with you to address 
                    your privacy needs while maintaining system integrity.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card id="contact">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-6 rounded-lg border border-primary/20">
                  <h4 className="font-semibold mb-3">Get in Touch</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    If you have any questions about this privacy policy, copyright issues, 
                    or need to exercise your data rights, please contact the developer:
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Developer:</span> Jay Magar
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Application:</span> HealthChain
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Response Time:</span> Within 48 hours
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">What to Include</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    When contacting us about privacy or copyright matters, please include:
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Your full name and contact information</li>
                    <li>• Specific issue or request details</li>
                    <li>• Relevant dates and circumstances</li>
                    <li>• Any supporting documentation</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Footer Notice */}
            <Card className="bg-muted/20">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    This legal document is effective as of {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} and may be updated periodically.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    © 2024 Jay Magar. HealthChain - All rights reserved.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
