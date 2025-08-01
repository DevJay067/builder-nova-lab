import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  UserPlus,
} from "lucide-react";

export default function HealthHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewUser, setIsNewUser] = useState(true);
  const [showAddRecordDialog, setShowAddRecordDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
    notes: "",
  });

  const [healthRecords, setHealthRecords] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  // Load health records on component mount and scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
    loadHealthRecords();
  }, []);

  const loadHealthRecords = async () => {
    try {
      setIsLoading(true);

      // Get user session token
      const storedUser = localStorage.getItem("healthchain_user");
      const headers: Record<string, string> = {};

      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.sessionToken) {
          headers["Authorization"] = `Bearer ${user.sessionToken}`;
          headers["x-session-token"] = user.sessionToken;
        }
      }

      // Fallback for demo mode
      if (Object.keys(headers).length === 0) {
        headers["patient-id"] = "default-patient";
      }

      const response = await fetch("/api/health-records", {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setHealthRecords(data.records || []);
        setUserInfo(data.userInfo || null);
        setIsNewUser(data.records.length === 0);

        if (data.userInfo?.isAuthenticated) {
          console.log(
            `✅ Loaded ${data.records.length} records for user: ${data.userInfo.username}`,
          );
        } else {
          console.log(`📋 Demo mode: ${data.records.length} records loaded`);
        }
      }
    } catch (error) {
      console.error("Failed to load health records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addTestData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/add-test-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "patient-id": "default-patient",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await loadHealthRecords();
          setIsNewUser(false);
          alert(
            `Test data added successfully! Created ${result.recordsCreated} blockchain-secured health records.`,
          );
        } else {
          alert("Failed to add test data: " + result.error);
        }
      } else {
        alert("Failed to add test data. Please try again.");
      }
    } catch (error) {
      console.error("Error adding test data:", error);
      alert("Failed to add test data. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRecord = async () => {
    if (
      !formData.weight ||
      !formData.height ||
      !formData.systolicBP ||
      !formData.diastolicBP
    ) {
      alert(
        "Please fill in all required vital signs (weight, height, blood pressure)",
      );
      return;
    }

    try {
      setIsLoading(true);

      // Prepare comprehensive health record data
      const healthRecordData = {
        // Personal Information
        personalInfo: {
          age: formData.age ? parseInt(formData.age) : undefined,
          gender: formData.gender,
          bloodType: formData.bloodType,
        },

        // Vital Signs
        vitals: {
          weight: parseFloat(formData.weight),
          height: parseFloat(formData.height),
          systolicBP: parseInt(formData.systolicBP),
          diastolicBP: parseInt(formData.diastolicBP),
          heartRate: formData.heartRate
            ? parseInt(formData.heartRate)
            : undefined,
          temperature: formData.temperature
            ? parseFloat(formData.temperature)
            : undefined,
          bmi: (
            parseFloat(formData.weight) /
            Math.pow(parseFloat(formData.height) / 100, 2)
          ).toFixed(1),
        },

        // Medical History
        medicalHistory: {
          medications: formData.medications
            ? formData.medications.split(",").map((m) => m.trim())
            : [],
          allergies: formData.allergies
            ? formData.allergies.split(",").map((a) => a.trim())
            : [],
          chronicConditions: formData.chronicConditions
            ? formData.chronicConditions.split(",").map((c) => c.trim())
            : [],
          lastCheckupDate: formData.lastCheckupDate,
          primaryDoctor: formData.doctor || "Self-reported",
        },

        // Additional Information
        additionalInfo: {
          notes: formData.notes,
          recordedAt: new Date().toISOString(),
          dataSource: "patient_input",
        },
      };

      // First, save to the traditional health records API (for backward compatibility)
      const traditionalBody = {
        type: "medical_history",
        title: "Comprehensive Health Assessment",
        description: `BMI: ${healthRecordData.vitals.bmi}, Weight: ${formData.weight}kg, Height: ${formData.height}cm, BP: ${formData.systolicBP}/${formData.diastolicBP}mmHg`,
        doctor: formData.doctor || "Self-reported",
        metadata: {
          ...healthRecordData.personalInfo,
          ...healthRecordData.vitals,
          medications: healthRecordData.medicalHistory.medications,
          allergies: healthRecordData.medicalHistory.allergies,
          chronicConditions: healthRecordData.medicalHistory.chronicConditions,
          notes: formData.notes,
        },
      };

      const traditionalResponse = await fetch("/api/health-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "patient-id": "default-patient",
        },
        body: JSON.stringify(traditionalBody),
      });

      let traditionalResult = null;
      if (traditionalResponse.ok) {
        traditionalResult = await traditionalResponse.json();
      }

      // Save to secure Neon database with user authentication
      let secureResult = null;
      try {
        // Get user session token
        const storedUser = localStorage.getItem("healthchain_user");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user.sessionToken) {
            headers["Authorization"] = `Bearer ${user.sessionToken}`;
            headers["x-session-token"] = user.sessionToken;
          }
        }

        // Fallback for demo mode
        if (!headers["Authorization"]) {
          headers["patient-id"] = "default-patient";
        }

        const directNeonResponse = await fetch(
          "/api/health-records/store-direct",
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              recordType: "medical_history",
              title: "Comprehensive Health Assessment",
              description: `BMI: ${healthRecordData.vitals.bmi}, Weight: ${formData.weight}kg, Height: ${formData.height}cm, BP: ${formData.systolicBP}/${formData.diastolicBP}mmHg`,
              doctor: formData.doctor || "Self-reported",
              date: new Date().toISOString().split("T")[0],
              metadata: healthRecordData,
            }),
          },
        );

        if (directNeonResponse.ok) {
          secureResult = await directNeonResponse.json();
          secureResult.success = true;
          secureResult.record = {
            id: secureResult.recordId || "neon-" + Date.now(),
          };

          if (secureResult.userInfo) {
            console.log(
              `✅ Health record saved for user: ${secureResult.userInfo.username}`,
            );
          }
        } else {
          console.error(
            "Failed to save to secure database:",
            await directNeonResponse.text(),
          );
        }
      } catch (error) {
        console.error("Error saving to secure database:", error);
        // Continue with traditional storage only
      }

      // Check if at least one storage method succeeded
      if (
        (traditionalResult && traditionalResult.success) ||
        (secureResult && secureResult.success)
      ) {
        // Reload health records
        await loadHealthRecords();
        setIsNewUser(false);
        setShowAddRecordDialog(false);

        // Reset form
        setFormData({
          age: "",
          gender: "",
          bloodType: "",
          weight: "",
          height: "",
          systolicBP: "",
          diastolicBP: "",
          heartRate: "",
          temperature: "",
          medications: "",
          allergies: "",
          chronicConditions: "",
          lastCheckupDate: "",
          doctor: "",
          notes: "",
        });

        // Show success message with user info
        let successMessage = "🎉 Health Record Saved Successfully!\n\n";
        let storageCount = 0;

        if (traditionalResult && traditionalResult.success) {
          successMessage += "✅ Blockchain Storage: Secured\n";
          storageCount++;
        }

        if (secureResult && secureResult.success) {
          successMessage += "✅ Secure Database: Stored with Hash Linking\n";
          storageCount++;

          if (secureResult.userInfo) {
            successMessage += `👤 User: ${secureResult.userInfo.username}\n`;
            successMessage += `🔐 Hash ID: ${secureResult.userInfo.userHash.slice(0, 12)}...\n`;
          }
        }

        successMessage += `\n📊 Your health data is saved in ${storageCount} secure location${storageCount > 1 ? "s" : ""}`;
        successMessage += "\n🔒 Split-key encryption & hash linking active";

        alert(successMessage);
      } else {
        // Show error details
        let errorMessage = "Failed to save health record:\n";
        if (traditionalResult && !traditionalResult.success) {
          errorMessage += `Traditional Storage: ${traditionalResult.error}\n`;
        }
        if (secureResult && !secureResult.success) {
          errorMessage += `Secure Storage: ${secureResult.error}`;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error saving health record:", error);
      alert("Failed to save health record. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const aiSearchHistory = [
    {
      id: 1,
      query: "What are the side effects of blood pressure medication?",
      timestamp: "2024-01-15 14:30",
      response: "Common side effects include dizziness, fatigue, and nausea...",
      relevance: "high",
    },
    {
      id: 2,
      query: "How to manage stress-related headaches?",
      timestamp: "2024-01-14 09:15",
      response: "Stress management techniques include deep breathing...",
      relevance: "medium",
    },
    {
      id: 3,
      query: "Healthy diet for hypertension",
      timestamp: "2024-01-12 16:45",
      response: "DASH diet is recommended for managing blood pressure...",
      relevance: "high",
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "checkup":
        return <Stethoscope className="h-4 w-4" />;
      case "medication":
        return <Pill className="h-4 w-4" />;
      case "symptom":
        return <Activity className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success text-success-foreground";
      case "active":
        return "bg-primary text-primary-foreground";
      case "monitoring":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
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
                  <h1 className="text-xl font-bold text-foreground">
                    Health History
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {userInfo?.isAuthenticated
                      ? `Secure Records for ${userInfo.name}`
                      : "Blockchain-Secured Records"}
                  </p>
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
              <Dialog
                open={showAddRecordDialog}
                onOpenChange={setShowAddRecordDialog}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Record
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* New User Welcome Section */}
        {isNewUser && healthRecords.length === 0 && (
          <Card className="mb-8 bg-gradient-to-r from-primary/5 to-accent/5 border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto">
                  <UserPlus className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Welcome to HealthChain!
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Let's get started by adding your basic health information.
                    This data will be securely stored on the blockchain and only
                    accessible by you. This helps us provide better AI
                    recommendations and track your health journey.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Button
                    size="lg"
                    onClick={() => setShowAddRecordDialog(true)}
                    className="px-6 sm:px-8 h-12 text-sm sm:text-base touch-manipulation"
                  >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Add Your Health Data
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={addTestData}
                    className="px-6 sm:px-8 h-12 text-sm sm:text-base touch-manipulation"
                    disabled={isLoading}
                  >
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    {isLoading ? "Adding Test Data..." : "Add Test Data (Demo)"}
                  </Button>
                </div>
                <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground mt-4">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-1 text-primary" />
                    Blockchain Secured
                  </div>
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-1 text-primary" />
                    Private & Encrypted
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Bar */}
        {healthRecords.length > 0 && (
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
        )}

        {/* Medical Data Entry Dialog */}
        <Dialog
          open={showAddRecordDialog}
          onOpenChange={setShowAddRecordDialog}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center">
                <Stethoscope className="h-6 w-6 mr-2 text-primary" />
                Add Your Health Information
              </DialogTitle>
              <DialogDescription>
                Please fill in your health information. All data is encrypted
                and stored securely on the blockchain.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8 py-4">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="25"
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        handleInputChange("gender", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">
                          Prefer not to say
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bloodType">Blood Type</Label>
                    <Select
                      value={formData.bloodType}
                      onValueChange={(value) =>
                        handleInputChange("bloodType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood type" />
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
                </div>
              </div>

              <Separator />

              {/* Vital Signs */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Vital Signs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="flex items-center">
                      <Weight className="h-4 w-4 mr-1" />
                      Weight (kg) *
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="70"
                      value={formData.weight}
                      onChange={(e) =>
                        handleInputChange("weight", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height" className="flex items-center">
                      <Ruler className="h-4 w-4 mr-1" />
                      Height (cm) *
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="175"
                      value={formData.height}
                      onChange={(e) =>
                        handleInputChange("height", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heartRate" className="flex items-center">
                      <Heart className="h-4 w-4 mr-1" />
                      Heart Rate (bpm)
                    </Label>
                    <Input
                      id="heartRate"
                      type="number"
                      placeholder="72"
                      value={formData.heartRate}
                      onChange={(e) =>
                        handleInputChange("heartRate", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="systolicBP">Systolic BP (mmHg) *</Label>
                    <Input
                      id="systolicBP"
                      type="number"
                      placeholder="120"
                      value={formData.systolicBP}
                      onChange={(e) =>
                        handleInputChange("systolicBP", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diastolicBP">Diastolic BP (mmHg) *</Label>
                    <Input
                      id="diastolicBP"
                      type="number"
                      placeholder="80"
                      value={formData.diastolicBP}
                      onChange={(e) =>
                        handleInputChange("diastolicBP", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temperature" className="flex items-center">
                      <Thermometer className="h-4 w-4 mr-1" />
                      Temperature (°C)
                    </Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      placeholder="36.5"
                      value={formData.temperature}
                      onChange={(e) =>
                        handleInputChange("temperature", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Medical History */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Medical History
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medications" className="flex items-center">
                      <Pill className="h-4 w-4 mr-1" />
                      Current Medications
                    </Label>
                    <Textarea
                      id="medications"
                      placeholder="List any medications you are currently taking..."
                      value={formData.medications}
                      onChange={(e) =>
                        handleInputChange("medications", e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allergies">Known Allergies</Label>
                    <Textarea
                      id="allergies"
                      placeholder="List any known allergies..."
                      value={formData.allergies}
                      onChange={(e) =>
                        handleInputChange("allergies", e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chronicConditions">
                      Chronic Conditions
                    </Label>
                    <Textarea
                      id="chronicConditions"
                      placeholder="List any chronic health conditions..."
                      value={formData.chronicConditions}
                      onChange={(e) =>
                        handleInputChange("chronicConditions", e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional health information..."
                      value={formData.notes}
                      onChange={(e) =>
                        handleInputChange("notes", e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lastCheckupDate">Last Checkup Date</Label>
                    <Input
                      id="lastCheckupDate"
                      type="date"
                      value={formData.lastCheckupDate}
                      onChange={(e) =>
                        handleInputChange("lastCheckupDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctor">Primary Doctor</Label>
                    <Input
                      id="doctor"
                      placeholder="Dr. Smith"
                      value={formData.doctor}
                      onChange={(e) =>
                        handleInputChange("doctor", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Security Notice */}
              <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-4 rounded-lg border border-primary/20">
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6 text-primary" />
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Advanced Security Architecture
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Your health data is protected by our dual-layer security
                      system:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center">
                        <Lock className="h-3 w-3 mr-2 text-primary" />
                        <strong>Split-Key Encryption:</strong> Data encrypted
                        with patient + provider + system keys
                      </li>
                      <li className="flex items-center">
                        <Shield className="h-3 w-3 mr-2 text-accent" />
                        <strong>Blockchain Immutability:</strong> Records stored
                        on tamper-proof blockchain
                      </li>
                      <li className="flex items-center">
                        <FileText className="h-3 w-3 mr-2 text-info" />
                        <strong>Neon Database:</strong> Encrypted storage in
                        secure PostgreSQL database
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddRecordDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitRecord}
                  className="px-8"
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Saving to Blockchain..." : "Save to Blockchain"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {healthRecords.length > 0 && (
          <Tabs defaultValue="records" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger
                value="records"
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Health Records</span>
              </TabsTrigger>
              <TabsTrigger
                value="ai-history"
                className="flex items-center space-x-2"
              >
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
                    All your health records are encrypted and stored on the
                    blockchain for maximum security.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {healthRecords.map((record) => (
                    <Card
                      key={record.id}
                      className="border-l-4 border-l-primary"
                    >
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
                        <p className="text-sm text-muted-foreground mb-3">
                          {record.description}
                        </p>
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
                    Your B-max AI search history, helping track your health
                    journey and concerns.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiSearchHistory.map((search) => (
                    <Card
                      key={search.id}
                      className="border-l-4 border-l-accent"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10 text-accent">
                              <Brain className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm">
                                {search.query}
                              </h3>
                              <p className="text-xs text-muted-foreground flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {search.timestamp}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              search.relevance === "high"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {search.relevance}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-3">
                          {search.response.length > 100
                            ? `${search.response.substring(0, 100)}...`
                            : search.response}
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
        )}

        {/* Security Info */}
        <Card className="mt-8 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  End-to-End Blockchain Security
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your health data is encrypted and stored on an immutable
                  blockchain, ensuring complete privacy and security. Only you
                  control access to your information.
                </p>
              </div>
              <Button variant="outline">Learn More</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
