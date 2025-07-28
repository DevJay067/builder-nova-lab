import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  History,
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  Shield,
  Download,
  FileText,
  Brain,
  Activity,
  Pill,
  Stethoscope,
  Clock,
  Lock,
  User,
  Weight,
  Ruler,
  Heart,
  Thermometer,
  Save,
  UserPlus
} from "lucide-react";

export default function HealthHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewUser, setIsNewUser] = useState(true); // Set to true for new users
  const [showAddRecordDialog, setShowAddRecordDialog] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    age: "",
    gender: "",
    bloodType: "",
    // Vitals
    weight: "",
    height: "",
    systolicBP: "",
    diastolicBP: "",
    heartRate: "",
    temperature: "",
    // Medical History
    medications: "",
    allergies: "",
    chronicConditions: "",
    lastCheckupDate: "",
    doctor: "",
    // Additional Notes
    notes: ""
  });

  const healthRecords = [
    {
      id: 1,
      date: "2024-01-15",
      type: "checkup",
      title: "Annual Health Checkup",
      description: "Routine physical examination with blood work",
      doctor: "Dr. Sarah Johnson",
      status: "completed",
      blockchainHash: "0x1a2b3c4d5e6f..."
    },
    {
      id: 2,
      date: "2024-01-10",
      type: "medication",
      title: "Medication Update",
      description: "Added new blood pressure medication",
      doctor: "Dr. Michael Chen",
      status: "active",
      blockchainHash: "0x2b3c4d5e6f7a..."
    },
    {
      id: 3,
      date: "2024-01-05",
      type: "symptom",
      title: "Reported Symptoms",
      description: "Mild headaches and fatigue",
      doctor: "Self-reported",
      status: "monitoring",
      blockchainHash: "0x3c4d5e6f7a8b..."
    }
  ];

  const aiSearchHistory = [
    {
      id: 1,
      query: "What are the side effects of blood pressure medication?",
      timestamp: "2024-01-15 14:30",
      response: "Common side effects include dizziness, fatigue, and nausea...",
      relevance: "high"
    },
    {
      id: 2,
      query: "How to manage stress-related headaches?",
      timestamp: "2024-01-14 09:15",
      response: "Stress management techniques include deep breathing...",
      relevance: "medium"
    },
    {
      id: 3,
      query: "Healthy diet for hypertension",
      timestamp: "2024-01-12 16:45",
      response: "DASH diet is recommended for managing blood pressure...",
      relevance: "high"
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'checkup': return <Stethoscope className="h-4 w-4" />;
      case 'medication': return <Pill className="h-4 w-4" />;
      case 'symptom': return <Activity className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'active': return 'bg-primary text-primary-foreground';
      case 'monitoring': return 'bg-warning text-warning-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
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
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent text-accent-foreground">
                  <History className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Health History</h1>
                  <p className="text-sm text-muted-foreground">Blockchain-Secured Records</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Blockchain Secured
              </Badge>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search health records and AI history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs defaultValue="records" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="records" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Health Records</span>
            </TabsTrigger>
            <TabsTrigger value="ai-history" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>AI Search History</span>
            </TabsTrigger>
          </TabsList>

          {/* Health Records Tab */}
          <TabsContent value="records" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Medical Records</span>
                  <Badge variant="outline" className="text-xs">
                    {healthRecords.length} records
                  </Badge>
                </CardTitle>
                <CardDescription>
                  All your health records are encrypted and stored on the blockchain for maximum security.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {healthRecords.map((record) => (
                  <Card key={record.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                            {getTypeIcon(record.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{record.title}</h3>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {record.date} • {record.doctor}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3">{record.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Lock className="h-3 w-3" />
                          <span>Blockchain: {record.blockchainHash}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Search History Tab */}
          <TabsContent value="ai-history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>AI Search History</span>
                  <Badge variant="outline" className="text-xs">
                    {aiSearchHistory.length} searches
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Your B-max AI search history, helping track your health journey and concerns.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiSearchHistory.map((search) => (
                  <Card key={search.id} className="border-l-4 border-l-accent">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10 text-accent">
                            <Brain className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{search.query}</h3>
                            <p className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {search.timestamp}
                            </p>
                          </div>
                        </div>
                        <Badge variant={search.relevance === 'high' ? 'default' : 'secondary'}>
                          {search.relevance}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3">
                        {search.response.length > 100 
                          ? `${search.response.substring(0, 100)}...` 
                          : search.response
                        }
                      </p>
                      <Button variant="ghost" size="sm">
                        View Full Response
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Security Info */}
        <Card className="mt-8 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">End-to-End Blockchain Security</h3>
                <p className="text-sm text-muted-foreground">
                  Your health data is encrypted and stored on an immutable blockchain, ensuring 
                  complete privacy and security. Only you control access to your information.
                </p>
              </div>
              <Button variant="outline">
                Learn More
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
