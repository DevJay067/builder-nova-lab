import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Shield,
  Download,
  Eye,
  Lock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Star,
  TrendingUp,
  Zap,
  Edit,
  Trash2,
  Share,
  Globe,
  Database,
  Heart,
  Pill,
  Stethoscope,
  Activity,
  Clock,
  Weight,
  Ruler,
  Thermometer,
  ActivitySquare,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  ExternalLink,
  RefreshCw,
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
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
  }>;
}

export default function HealthRecordView() {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<HealthRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      icon: FileText,
      color: "bg-gray-500",
    },
  ];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    checkAuthAndLoadRecord();
  }, [recordId]);

  const checkAuthAndLoadRecord = async () => {
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
        setError("Authentication required");
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
        setError("Authentication failed");
        return;
      }

      setIsAuthenticated(true);
      await loadHealthRecord(sessionToken);
    } catch (error) {
      console.error("Error checking auth:", error);
      setIsAuthenticated(false);
      setIsLoading(false);
      setError("Authentication error");
    }
  };

  const loadHealthRecord = async (sessionToken: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // First try to get the specific record
      const response = await fetch(`/api/health-records/${recordId}`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.record) {
          setRecord(data.record);
        } else {
          setError("Record not found");
        }
      } else if (response.status === 404) {
        // If specific record not found, try to find it in the user's records
        const allRecordsResponse = await fetch("/api/health-records", {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "x-session-token": sessionToken,
          },
        });

        if (allRecordsResponse.ok) {
          const allData = await allRecordsResponse.json();
          if (allData.success && allData.records) {
            const foundRecord = allData.records.find((r: any) => r.id === recordId);
            if (foundRecord) {
              setRecord(foundRecord);
            } else {
              setError("Record not found in your health history");
            }
          } else {
            setError("Failed to load health records");
          }
        } else {
          setError("Failed to access health records");
        }
      } else {
        setError("Failed to load record");
      }
    } catch (error) {
      console.error("Error loading record:", error);
      setError("Network error while loading record");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRecord = async () => {
    if (!record || !window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(true);
      const sessionToken =
        localStorage.getItem("sessionToken") ||
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("healthchain_session="))
          ?.split("=")[1];

      if (!sessionToken) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(`/api/health-records/${record.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
      });

      const result = await response.json();
      if (response.ok && result.success) {
        navigate("/history");
      } else {
        setError(result.error || "Failed to delete record");
      }
    } catch (error) {
      setError("Network error while deleting record");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRecordIcon = (type: string) => {
    const recordType = recordTypes.find((rt) => rt.value === type);
    return recordType ? recordType.icon : FileText;
  };

  const getRecordColor = (type: string) => {
    const recordType = recordTypes.find((rt) => rt.value === type);
    return recordType ? recordType.color : "bg-gray-500";
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return FileImage;
    if (type.startsWith("video/")) return FileVideo;
    if (type.startsWith("audio/")) return FileAudio;
    return FileArchive;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Health Record Viewer
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Secure Medical Record Access
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
                Please log in to access this secure health record.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/login" className="w-full">
                <Button className="w-full btn-smooth shadow-colored">
                  <Lock className="w-4 h-4 mr-2" />
                  Log In to View Record
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 page-transition">
        <header className="border-b border-border/40 glass backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <Link to="/history">
                <Button variant="ghost" size="sm" className="btn-smooth">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Health History
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Loading Record...
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we fetch your health record
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto shadow-colored-lg card-hover fade-in">
            <CardContent className="p-8 text-center">
              <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Loading Health Record
              </h3>
              <p className="text-muted-foreground">
                Securely retrieving your medical information...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 page-transition">
        <header className="border-b border-border/40 glass backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <Link to="/history">
                <Button variant="ghost" size="sm" className="btn-smooth">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Health History
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Error Loading Record
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Unable to display the requested health record
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto shadow-colored-lg card-hover fade-in">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Record Not Found</CardTitle>
              <CardDescription>
                {error || "The requested health record could not be loaded."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/history" className="w-full">
                <Button className="w-full btn-smooth shadow-colored">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Health History
                </Button>
              </Link>
              <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const RecordIcon = getRecordIcon(record.type);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 page-transition">
      {/* Enhanced Header */}
      <header className="border-b border-border/40 glass backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 fade-in">
              <Link to="/history">
                <Button variant="ghost" size="sm" className="btn-smooth">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Health History
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-xl ${getRecordColor(record.type)} text-white shadow-lg`}
                >
                  <RecordIcon className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">
                    Health Record Details
                  </h1>
                  <p className="text-sm text-slate-600 font-medium">
                    {record.title}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 fade-in fade-in-delay-1">
              {record.isSecure && (
                <Badge
                  variant="secondary"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  Blockchain Secured
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Download className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open(`/record/${record.id}`, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                New Tab
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Record Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Record Header Card */}
            <Card className="shadow-colored border-border/50 fade-in">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`flex items-center justify-center w-16 h-16 rounded-2xl ${getRecordColor(record.type)} text-white shadow-lg`}
                    >
                      <RecordIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-2">{record.title}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(record.date).toLocaleDateString()}</span>
                        </div>
                        {record.doctor && (
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{record.doctor}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(record.date).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-sm">
                      {recordTypes.find((rt) => rt.value === record.type)?.label || record.type}
                    </Badge>
                    {record.isSecure && (
                      <Badge
                        variant="secondary"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        <Lock className="w-3 h-3 mr-1" />
                        Secure
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Record Description */}
            <Card className="shadow-colored border-border/50 fade-in fade-in-delay-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span>Record Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {record.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            {record.metadata && Object.keys(record.metadata).some((key) => record.metadata[key]) && (
              <Card className="shadow-colored border-border/50 fade-in fade-in-delay-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ActivitySquare className="w-5 h-5 text-primary" />
                    <span>Medical Data</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {record.metadata.weight && (
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                        <Weight className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="text-sm text-muted-foreground">Weight</div>
                          <div className="font-medium">{record.metadata.weight} kg</div>
                        </div>
                      </div>
                    )}
                    {record.metadata.height && (
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                        <Ruler className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="text-sm text-muted-foreground">Height</div>
                          <div className="font-medium">{record.metadata.height} cm</div>
                        </div>
                      </div>
                    )}
                    {record.metadata.bloodPressure && (
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                        <Activity className="w-5 h-5 text-red-600" />
                        <div>
                          <div className="text-sm text-muted-foreground">Blood Pressure</div>
                          <div className="font-medium">{record.metadata.bloodPressure}</div>
                        </div>
                      </div>
                    )}
                    {record.metadata.heartRate && (
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                        <Heart className="w-5 h-5 text-pink-600" />
                        <div>
                          <div className="text-sm text-muted-foreground">Heart Rate</div>
                          <div className="font-medium">{record.metadata.heartRate} bpm</div>
                        </div>
                      </div>
                    )}
                    {record.metadata.temperature && (
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                        <Thermometer className="w-5 h-5 text-orange-600" />
                        <div>
                          <div className="text-sm text-muted-foreground">Temperature</div>
                          <div className="font-medium">{record.metadata.temperature}°C</div>
                        </div>
                      </div>
                    )}
                    {record.metadata.notes && (
                      <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 md:col-span-2">
                        <FileText className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <div className="text-sm text-muted-foreground">Notes</div>
                          <div className="font-medium">{record.metadata.notes}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attachments */}
            {record.attachments && record.attachments.length > 0 && (
              <Card className="shadow-colored border-border/50 fade-in fade-in-delay-3">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileImage className="w-5 h-5 text-primary" />
                    <span>Attachments ({record.attachments.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {record.attachments.map((attachment) => {
                      const FileIcon = getFileIcon(attachment.type);
                      return (
                        <div
                          key={attachment.id}
                          className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
                            <FileIcon className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {attachment.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatFileSize(attachment.size)}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </a>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card className="shadow-colored border-border/50 fade-in fade-in-delay-4">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="btn-smooth">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Record
                  </Button>
                  <Button variant="outline" className="btn-smooth">
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" className="btn-smooth">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="btn-smooth"
                    onClick={deleteRecord}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Security Status */}
            <Card className="shadow-colored border-border/50 fade-in fade-in-delay-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span>Security Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Authentication</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Verified
                    </Badge>
                  </div>
                  {record.isSecure && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">Blockchain</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Secured
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Encryption</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Record Info */}
            <Card className="shadow-colored border-border/50 fade-in fade-in-delay-3">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-primary" />
                  <span>Record Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Record ID</span>
                    <span className="text-sm font-mono text-foreground">{record.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <span className="text-sm font-medium">{recordTypes.find((rt) => rt.value === record.type)?.label || record.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  </div>
                  {record.blockchainHash && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Blockchain Hash</span>
                      <span className="text-sm font-mono text-foreground">{record.blockchainHash.slice(0, 8)}...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-colored border-border/50 fade-in fade-in-delay-4">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/history">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to History
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Record
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Share className="w-4 h-4 mr-2" />
                    Share with Doctor
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}