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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  CheckCircle,
  AlertTriangle,
  Loader2,
  Star,
  TrendingUp,
  Zap,
  Eye,
  Filter,
  SortDesc,
  MoreHorizontal,
  Edit,
  Trash2,
  Share,
  Globe,
  Database,
} from "lucide-react";

interface HealthRecord {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  doctor?: string;
  isSecure?: boolean;
  blockchainHash?: string;
  metadata?: any;
}

export default function HealthHistory() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("records");
  const [stats, setStats] = useState({
    totalRecords: 0,
    secureRecords: 0,
    lastUpdate: null as string | null,
  });

  const [newRecord, setNewRecord] = useState({
    type: "",
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    doctor: "",
    metadata: {
      weight: "",
      height: "",
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      notes: "",
    },
  });

  const recordTypes = [
    {
      value: "checkup",
      label: "Regular Checkup",
      icon: Stethoscope,
      color: "bg-blue-500",
    },
    {
      value: "medication",
      label: "Medication",
      icon: Pill,
      color: "bg-green-500",
    },
    {
      value: "lab",
      label: "Lab Results",
      icon: FileText,
      color: "bg-purple-500",
    },
    {
      value: "imaging",
      label: "Imaging",
      icon: Activity,
      color: "bg-orange-500",
    },
    {
      value: "emergency",
      label: "Emergency",
      icon: Heart,
      color: "bg-red-500",
    },
    {
      value: "specialist",
      label: "Specialist Visit",
      icon: User,
      color: "bg-indigo-500",
    },
    {
      value: "vitals",
      label: "Vital Signs",
      icon: TrendingUp,
      color: "bg-teal-500",
    },
    {
      value: "other",
      label: "Other",
      icon: MoreHorizontal,
      color: "bg-gray-500",
    },
  ];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    checkAuthAndLoadRecords();
  }, []);

  const checkAuthAndLoadRecords = async () => {
    try {
      const sessionToken =
        localStorage.getItem("sessionToken") ||
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("healthchain_session="))
          ?.split("=")[1];

      if (!sessionToken) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const authResponse = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
      });

      if (!authResponse.ok) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);
      await loadHealthRecords(sessionToken);
    } catch (error) {
      console.error("Error checking auth:", error);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const loadHealthRecords = async (sessionToken: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/health-records", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.records) {
          const transformedRecords = data.records.map((record: any) => ({
            id: record.id,
            type: record.type,
            title: record.title,
            description: record.description,
            date: record.date,
            doctor: record.doctor,
            isSecure: !!record.blockchainHash,
            blockchainHash: record.blockchainHash,
            metadata: record.metadata || {},
          }));

          setRecords(transformedRecords);
          setStats({
            totalRecords: transformedRecords.length,
            secureRecords: transformedRecords.filter((r: any) => r.isSecure)
              .length,
            lastUpdate: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Error loading records:", error);
      setMessage({ type: "error", text: "Failed to load health records" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const sessionToken =
        localStorage.getItem("sessionToken") ||
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("healthchain_session="))
          ?.split("=")[1];

      if (!sessionToken) {
        setMessage({ type: "error", text: "Please log in to save records" });
        return;
      }

      // Use the correct health records endpoint
      const response = await fetch("/api/health-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
        body: JSON.stringify({
          type: newRecord.type,
          title: newRecord.title,
          description: newRecord.description,
          date: newRecord.date,
          doctor: newRecord.doctor,
          metadata: newRecord.metadata,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: "success",
          text: "Health record saved successfully!",
        });
        setIsDialogOpen(false);
        setNewRecord({
          type: "",
          title: "",
          description: "",
          date: "",
          doctor: "",
          metadata: {},
        });
        
        // Reload health records to show the new one
        await loadHealthRecords(sessionToken);
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to save health record",
        });
      }
    } catch (error) {
      console.error("Error saving record:", error);
      setMessage({
        type: "error",
        text: "Network error while saving record",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRecord = async (recordId: string) => {
    try {
      const sessionToken =
        localStorage.getItem("sessionToken") ||
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("healthchain_session="))
          ?.split("=")[1];

      if (!sessionToken) {
        setMessage({ type: "error", text: "Please log in to delete records" });
        return;
      }

      const response = await fetch(`/api/health-records/${recordId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setRecords((prev) => prev.filter((r) => r.id !== recordId));
        setMessage({ type: "success", text: "Record deleted" });
      } else {
        setMessage({ type: "error", text: result.error || "Failed to delete record" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error while deleting record" });
    }
  };

  const filteredRecords = records
    .filter((record) => {
      const matchesSearch =
        (record.title && record.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.description && record.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.doctor && record.doctor.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType =
        selectedType === "all" || record.type === selectedType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "date")
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "type") return a.type.localeCompare(b.type);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });

  const getRecordIcon = (type: string) => {
    const recordType = recordTypes.find((rt) => rt.value === type);
    return recordType ? recordType.icon : FileText;
  };

  const getRecordColor = (type: string) => {
    const recordType = recordTypes.find((rt) => rt.value === type);
    return recordType ? recordType.color : "bg-gray-500";
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 page-transition">
        <header className="border-b border-border/40 glass backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="btn-smooth">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
                  <History className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Health History
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Secure Medical Records
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto shadow-colored-lg card-hover fade-in">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Authentication Required</CardTitle>
              <CardDescription>
                Please log in to access your secure health history and medical
                records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/login" className="w-full">
                <Button className="w-full btn-smooth shadow-colored">
                  <Lock className="w-4 h-4 mr-2" />
                  Log In to View Records
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 page-transition">
      {/* Enhanced Header */}
      <header className="border-b border-border/40 glass backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 fade-in">
              <Link to="/">
                <Button variant="ghost" size="sm" className="btn-smooth">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25 transform-smooth hover:scale-110">
                  <History className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">
                    Health History
                  </h1>
                  <p className="text-sm text-slate-600 font-medium">
                    Secure Medical Records
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 fade-in fade-in-delay-1">
              <Badge
                variant="secondary"
                className="bg-green-50 text-green-700 border-green-200"
              >
                <Database className="w-3 h-3 mr-1" />
                Blockchain Secured
              </Badge>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-smooth shadow-colored">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Record
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <Plus className="w-5 h-5 text-primary" />
                      <span>Add New Health Record</span>
                    </DialogTitle>
                    <DialogDescription>
                      Create a new health record that will be securely stored on
                      the blockchain.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Record Type *</Label>
                        <Select
                          value={newRecord.type}
                          onValueChange={(value) =>
                            setNewRecord((prev) => ({ ...prev, type: value }))
                          }
                        >
                          <SelectTrigger className="focus-enhanced">
                            <SelectValue placeholder="Select record type" />
                          </SelectTrigger>
                          <SelectContent>
                            {recordTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center space-x-2">
                                  <type.icon className="w-4 h-4" />
                                  <span>{type.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newRecord.date}
                          onChange={(e) =>
                            setNewRecord((prev) => ({
                              ...prev,
                              date: e.target.value,
                            }))
                          }
                          className="focus-enhanced"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Annual Physical Exam"
                        value={newRecord.title}
                        onChange={(e) =>
                          setNewRecord((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="focus-enhanced"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Detailed description of the medical record..."
                        value={newRecord.description}
                        onChange={(e) =>
                          setNewRecord((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={3}
                        className="focus-enhanced"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="doctor">Healthcare Provider</Label>
                      <Input
                        id="doctor"
                        placeholder="e.g., Dr. Smith"
                        value={newRecord.doctor}
                        onChange={(e) =>
                          setNewRecord((prev) => ({
                            ...prev,
                            doctor: e.target.value,
                          }))
                        }
                        className="focus-enhanced"
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium text-foreground">
                        Additional Information (Optional)
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="weight">Weight</Label>
                          <div className="relative">
                            <Weight className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="weight"
                              placeholder="kg"
                              value={newRecord.metadata.weight}
                              onChange={(e) =>
                                setNewRecord((prev) => ({
                                  ...prev,
                                  metadata: {
                                    ...prev.metadata,
                                    weight: e.target.value,
                                  },
                                }))
                              }
                              className="pl-10 focus-enhanced"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="height">Height</Label>
                          <div className="relative">
                            <Ruler className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="height"
                              placeholder="cm"
                              value={newRecord.metadata.height}
                              onChange={(e) =>
                                setNewRecord((prev) => ({
                                  ...prev,
                                  metadata: {
                                    ...prev.metadata,
                                    height: e.target.value,
                                  },
                                }))
                              }
                              className="pl-10 focus-enhanced"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bloodPressure">Blood Pressure</Label>
                          <div className="relative">
                            <Heart className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="bloodPressure"
                              placeholder="120/80"
                              value={newRecord.metadata.bloodPressure}
                              onChange={(e) =>
                                setNewRecord((prev) => ({
                                  ...prev,
                                  metadata: {
                                    ...prev.metadata,
                                    bloodPressure: e.target.value,
                                  },
                                }))
                              }
                              className="pl-10 focus-enhanced"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="heartRate">Heart Rate</Label>
                          <div className="relative">
                            <Activity className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="heartRate"
                              placeholder="bpm"
                              value={newRecord.metadata.heartRate}
                              onChange={(e) =>
                                setNewRecord((prev) => ({
                                  ...prev,
                                  metadata: {
                                    ...prev.metadata,
                                    heartRate: e.target.value,
                                  },
                                }))
                              }
                              className="pl-10 focus-enhanced"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any additional notes or observations..."
                          value={newRecord.metadata.notes}
                          onChange={(e) =>
                            setNewRecord((prev) => ({
                              ...prev,
                              metadata: {
                                ...prev.metadata,
                                notes: e.target.value,
                              },
                            }))
                          }
                          rows={2}
                          className="focus-enhanced"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-smooth shadow-colored"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Save Securely
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Message Alert */}
      {message && (
        <div className="container mx-auto px-4 pt-4">
          <Alert
            className={`fade-in ${
              message.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription className="font-medium">
              {message.text}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="records"
              className="flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Records</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex items-center space-x-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-in">
              <Card className="card-hover shadow-colored border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Records
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        {stats.totalRecords}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Health records
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover shadow-colored border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Secure Records
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        {stats.secureRecords}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Blockchain protected
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover shadow-colored border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Last Update
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">
                        {stats.lastUpdate
                          ? new Date(stats.lastUpdate).toLocaleDateString()
                          : "Never"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Most recent
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card className="shadow-colored border-border/50 fade-in fade-in-delay-1">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  Search & Filter Records
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search records, descriptions, or doctors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 focus-enhanced"
                    />
                  </div>

                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-full sm:w-48 focus-enhanced">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {recordTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <type.icon className="w-4 h-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-48 focus-enhanced">
                      <SortDesc className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Sort by Date</SelectItem>
                      <SelectItem value="type">Sort by Type</SelectItem>
                      <SelectItem value="title">Sort by Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Records List */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="shadow-colored border-border/50">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-muted rounded-xl skeleton"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded skeleton w-1/3"></div>
                            <div className="h-3 bg-muted rounded skeleton w-2/3"></div>
                            <div className="h-3 bg-muted rounded skeleton w-1/4"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredRecords.length === 0 ? (
                <Card className="shadow-colored border-border/50 text-center py-12">
                  <CardContent>
                    <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No Records Found
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {searchTerm || selectedType !== "all"
                        ? "No records match your search criteria."
                        : "Start by adding your first health record."}
                    </p>
                    <Button
                      onClick={() => setIsDialogOpen(true)}
                      className="btn-smooth shadow-colored"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Record
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredRecords.map((record, index) => {
                  const RecordIcon = getRecordIcon(record.type);
                  return (
                    <Card
                      key={record.id}
                      className="shadow-colored border-border/50 card-hover fade-in-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div
                            className={`flex items-center justify-center w-12 h-12 rounded-xl ${getRecordColor(record.type)} text-white shadow-lg transform-smooth hover:scale-110`}
                          >
                            <RecordIcon className="w-6 h-6" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-semibold text-foreground truncate">
                                  {record.title}
                                </h3>
                                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      {new Date(
                                        record.date,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {record.doctor && (
                                    <div className="flex items-center space-x-1">
                                      <User className="w-3 h-3" />
                                      <span>{record.doctor}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                {record.isSecure && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-50 text-green-700 border-green-200"
                                  >
                                    <Lock className="w-3 h-3 mr-1" />
                                    Secure
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {recordTypes.find(
                                    (rt) => rt.value === record.type,
                                  )?.label || record.type}
                                </Badge>
                                <Button variant="ghost" size="icon" onClick={() => deleteRecord(record.id)} title="Delete record">
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </div>

                            <p className="text-muted-foreground mb-3 line-clamp-2">
                              {record.description}
                            </p>

                            {record.metadata &&
                              Object.keys(record.metadata).some(
                                (key) => record.metadata[key],
                              ) && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-muted/30 rounded-lg p-3">
                                  {record.metadata.weight && (
                                    <div>
                                      <span className="text-muted-foreground">
                                        Weight:
                                      </span>
                                      <div className="font-medium">
                                        {record.metadata.weight} kg
                                      </div>
                                    </div>
                                  )}
                                  {record.metadata.bloodPressure && (
                                    <div>
                                      <span className="text-muted-foreground">
                                        BP:
                                      </span>
                                      <div className="font-medium">
                                        {record.metadata.bloodPressure}
                                      </div>
                                    </div>
                                  )}
                                  {record.metadata.heartRate && (
                                    <div>
                                      <span className="text-muted-foreground">
                                        HR:
                                      </span>
                                      <div className="font-medium">
                                        {record.metadata.heartRate} bpm
                                      </div>
                                    </div>
                                  )}
                                  {record.metadata.temperature && (
                                    <div>
                                      <span className="text-muted-foreground">
                                        Temp:
                                      </span>
                                      <div className="font-medium">
                                        {record.metadata.temperature}°C
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="shadow-colored border-border/50 fade-in">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>Health Analytics</span>
                </CardTitle>
                <CardDescription>
                  Insights and trends from your health data
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Analytics Coming Soon
                </h3>
                <p className="text-muted-foreground">
                  We're working on powerful analytics features to help you
                  understand your health trends and patterns.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="shadow-colored border-border/50 fade-in">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span>Security & Privacy</span>
                </CardTitle>
                <CardDescription>
                  Your data protection and privacy controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">
                      Encryption Status
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">
                            End-to-End Encryption
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          Active
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">
                            Blockchain Storage
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          Secured
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">
                            Split Key Encryption
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          Enabled
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">
                      Privacy Controls
                    </h4>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            Data Ownership
                          </span>
                          <Badge variant="outline">You Own Your Data</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Your health data belongs to you and is never shared
                          without your consent.
                        </p>
                      </div>
                      <div className="p-3 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            Access Control
                          </span>
                          <Badge variant="outline">Private by Default</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Only you can access your health records with your
                          unique authentication.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
