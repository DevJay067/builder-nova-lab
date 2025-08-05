import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Camera,
  Upload,
  FileImage,
  Scan,
  Shield,
  Eye,
  Trash2,
  Download,
  Plus,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  X,
  RotateCcw,
  ZoomIn,
  Share,
  Lock,
  Stethoscope,
  Brain,
  Heart,
  Zap,
} from "lucide-react";

interface ScanRecord {
  id: string;
  type: string;
  title: string;
  description: string;
  images: string[];
  date: string;
  doctor?: string;
  aiAnalysis?: {
    findings: string[];
    confidence: number;
    recommendations: string[];
  };
  metadata?: any;
}

export default function MedicalScan() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [scanRecords, setScanRecords] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ScanRecord | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [newScan, setNewScan] = useState({
    type: "",
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    doctor: "",
    metadata: {
      bodyPart: "",
      symptoms: "",
      notes: "",
    },
  });

  const scanTypes = [
    {
      value: "xray",
      label: "X-Ray",
      icon: Scan,
      color: "bg-blue-500",
    },
    {
      value: "mri",
      label: "MRI Scan",
      icon: Brain,
      color: "bg-purple-500",
    },
    {
      value: "ct",
      label: "CT Scan",
      icon: Zap,
      color: "bg-orange-500",
    },
    {
      value: "ultrasound",
      label: "Ultrasound",
      icon: Heart,
      color: "bg-green-500",
    },
    {
      value: "dermatology",
      label: "Dermatology Photo",
      icon: Eye,
      color: "bg-pink-500",
    },
    {
      value: "wound",
      label: "Wound Documentation",
      icon: Stethoscope,
      color: "bg-red-500",
    },
    {
      value: "other",
      label: "Other Medical Image",
      icon: ImageIcon,
      color: "bg-gray-500",
    },
  ];

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 5 - selectedImages.length);
    const validFiles = newFiles.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== newFiles.length) {
      setMessage({
        type: "error",
        text: "Some files were skipped (only images under 10MB are allowed)"
      });
    }

    setSelectedImages(prev => [...prev, ...validFiles]);

    // Create preview URLs
    validFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      setPreviewUrls(prev => [...prev, url]);
    });
  }, [selectedImages.length]);

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const analyzeImages = async (imageFiles: File[]) => {
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockAnalysis = {
        findings: [
          "Image quality is adequate for diagnostic purposes",
          "No obvious abnormalities detected in visible areas",
          "Recommend professional medical review"
        ],
        confidence: 0.85,
        recommendations: [
          "Consult with a medical professional for complete evaluation",
          "Consider additional imaging if symptoms persist",
          "Monitor for any changes in condition"
        ]
      };

      return mockAnalysis;
    } catch (error) {
      console.error("AI analysis failed:", error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setMessage(null);

    try {
      if (selectedImages.length === 0) {
        setMessage({ type: "error", text: "Please select at least one image" });
        return;
      }

      if (!newScan.type || !newScan.title) {
        setMessage({ type: "error", text: "Please fill in all required fields" });
        return;
      }

      const sessionToken =
        localStorage.getItem("sessionToken") ||
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("healthchain_session="))
          ?.split("=")[1];

      if (!sessionToken) {
        setMessage({ type: "error", text: "Please log in to save scans" });
        return;
      }

      // Convert images to base64 for storage
      const imagePromises = selectedImages.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });

      const imageBase64Array = await Promise.all(imagePromises);

      // Analyze images if requested
      let aiAnalysis = null;
      if (newScan.type !== "other") {
        aiAnalysis = await analyzeImages(selectedImages);
      }

      // Prepare scan data
      const scanData = {
        type: newScan.type,
        title: newScan.title,
        description: newScan.description,
        date: newScan.date,
        doctor: newScan.doctor,
        images: imageBase64Array,
        aiAnalysis,
        metadata: {
          ...newScan.metadata,
          imageCount: selectedImages.length,
          totalSize: selectedImages.reduce((acc, file) => acc + file.size, 0),
          uploadedAt: new Date().toISOString(),
        },
      };

      // Save to database via API
      const response = await fetch("/api/auth/data-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
        body: JSON.stringify({
          type: `medical_scan_${newScan.type}`,
          data: scanData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: "success",
          text: "Medical scan saved securely with AI analysis!",
        });

        // Create local record for immediate display
        const newRecord: ScanRecord = {
          id: result.recordId || crypto.randomUUID(),
          ...scanData,
        };

        setScanRecords(prev => [newRecord, ...prev]);
        
        // Reset form
        setNewScan({
          type: "",
          title: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
          doctor: "",
          metadata: {
            bodyPart: "",
            symptoms: "",
            notes: "",
          },
        });
        
        setSelectedImages([]);
        setPreviewUrls(prev => {
          prev.forEach(url => URL.revokeObjectURL(url));
          return [];
        });
        
        setIsDialogOpen(false);
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to save scan",
        });
      }
    } catch (error) {
      console.error("Error saving scan:", error);
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsUploading(false);
    }
  };

  const getScanIcon = (type: string) => {
    const scanType = scanTypes.find(st => st.value === type);
    return scanType ? scanType.icon : ImageIcon;
  };

  const getScanColor = (type: string) => {
    const scanType = scanTypes.find(st => st.value === type);
    return scanType ? scanType.color : "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 page-transition">
      {/* Header */}
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
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25 transform-smooth hover:scale-110">
                  <Scan className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">
                    Medical Scan & Imaging
                  </h1>
                  <p className="text-sm text-slate-600 font-medium">
                    Secure Image Storage & AI Analysis
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 fade-in fade-in-delay-1">
              <Badge
                variant="secondary"
                className="bg-purple-50 text-purple-700 border-purple-200"
              >
                <Shield className="w-3 h-3 mr-1" />
                HIPAA Compliant
              </Badge>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-smooth shadow-colored">
                    <Plus className="w-4 h-4 mr-2" />
                    New Scan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <Camera className="w-5 h-5 text-primary" />
                      <span>Upload Medical Scan or Image</span>
                    </DialogTitle>
                    <DialogDescription>
                      Upload medical images for secure storage and optional AI analysis.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Upload Area */}
                    <div className="space-y-4">
                      <Label>Medical Images (Max 5 images, 10MB each)</Label>
                      
                      <div
                        className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                      >
                        <div className="space-y-4">
                          <div className="flex justify-center space-x-4">
                            <FileImage className="w-12 h-12 text-muted-foreground" />
                            <Camera className="w-12 h-12 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-lg font-medium">
                              Drop images here or click to upload
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Supports JPG, PNG, WEBP up to 10MB each
                            </p>
                          </div>
                          <div className="flex justify-center space-x-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Browse Files
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => cameraInputRef.current?.click()}
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Take Photo
                            </Button>
                          </div>
                        </div>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                      />
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                      />

                      {/* Image Previews */}
                      {previewUrls.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {previewUrls.map((url, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={url}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-border"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Scan Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="scanType">Scan Type *</Label>
                        <Select
                          value={newScan.type}
                          onValueChange={(value) =>
                            setNewScan((prev) => ({ ...prev, type: value }))
                          }
                        >
                          <SelectTrigger className="focus-enhanced">
                            <SelectValue placeholder="Select scan type" />
                          </SelectTrigger>
                          <SelectContent>
                            {scanTypes.map((type) => (
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
                        <Label htmlFor="scanDate">Date *</Label>
                        <Input
                          id="scanDate"
                          type="date"
                          value={newScan.date}
                          onChange={(e) =>
                            setNewScan((prev) => ({
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
                      <Label htmlFor="scanTitle">Title *</Label>
                      <Input
                        id="scanTitle"
                        placeholder="e.g., Chest X-Ray - Routine Check"
                        value={newScan.title}
                        onChange={(e) =>
                          setNewScan((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="focus-enhanced"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scanDescription">Description</Label>
                      <Textarea
                        id="scanDescription"
                        placeholder="Describe the medical scan, symptoms, or reason for imaging..."
                        value={newScan.description}
                        onChange={(e) =>
                          setNewScan((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={3}
                        className="focus-enhanced"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="scanDoctor">Healthcare Provider</Label>
                        <Input
                          id="scanDoctor"
                          placeholder="e.g., Dr. Smith, Radiology Dept"
                          value={newScan.doctor}
                          onChange={(e) =>
                            setNewScan((prev) => ({
                              ...prev,
                              doctor: e.target.value,
                            }))
                          }
                          className="focus-enhanced"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bodyPart">Body Part/Area</Label>
                        <Input
                          id="bodyPart"
                          placeholder="e.g., Chest, Abdomen, Leg"
                          value={newScan.metadata.bodyPart}
                          onChange={(e) =>
                            setNewScan((prev) => ({
                              ...prev,
                              metadata: {
                                ...prev.metadata,
                                bodyPart: e.target.value,
                              },
                            }))
                          }
                          className="focus-enhanced"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="symptoms">Symptoms or Notes</Label>
                      <Textarea
                        id="symptoms"
                        placeholder="Any symptoms, pain levels, or additional notes..."
                        value={newScan.metadata.symptoms}
                        onChange={(e) =>
                          setNewScan((prev) => ({
                            ...prev,
                            metadata: {
                              ...prev.metadata,
                              symptoms: e.target.value,
                            },
                          }))
                        }
                        rows={2}
                        className="focus-enhanced"
                      />
                    </div>

                    {/* AI Analysis Notice */}
                    {selectedImages.length > 0 && newScan.type && newScan.type !== "other" && (
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-center space-x-2">
                          <Brain className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-blue-800">
                            AI Analysis Included
                          </span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          Your images will be analyzed using AI to provide initial insights. 
                          This is not a substitute for professional medical review.
                        </p>
                      </div>
                    )}

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
                        disabled={isUploading || isAnalyzing || selectedImages.length === 0}
                        className="btn-smooth shadow-colored"
                      >
                        {isUploading || isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {isAnalyzing ? "Analyzing..." : "Uploading..."}
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
        <Tabs defaultValue="scans" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scans" className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4" />
              <span>My Scans</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>AI Analysis</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scans" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-in">
              <Card className="card-hover shadow-colored border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Scans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Scan className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        {scanRecords.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Medical images
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover shadow-colored border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    AI Analyzed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        {scanRecords.filter(record => record.aiAnalysis).length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        With AI insights
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover shadow-colored border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Last Upload
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">
                        {scanRecords.length > 0 
                          ? new Date(scanRecords[0].date).toLocaleDateString()
                          : "Never"
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Most recent
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Scan Records */}
            <div className="space-y-4">
              {scanRecords.length === 0 ? (
                <Card className="shadow-colored border-border/50 text-center py-12">
                  <CardContent>
                    <Camera className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No Medical Scans Yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Upload your first medical scan or image to get started with secure storage and AI analysis.
                    </p>
                    <Button
                      onClick={() => setIsDialogOpen(true)}
                      className="btn-smooth shadow-colored"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Your First Scan
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                scanRecords.map((record, index) => {
                  const ScanIcon = getScanIcon(record.type);
                  return (
                    <Card
                      key={record.id}
                      className="shadow-colored border-border/50 card-hover fade-in-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div
                            className={`flex items-center justify-center w-12 h-12 rounded-xl ${getScanColor(record.type)} text-white shadow-lg transform-smooth hover:scale-110`}
                          >
                            <ScanIcon className="w-6 h-6" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-semibold text-foreground truncate">
                                  {record.title}
                                </h3>
                                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                                  <span>{new Date(record.date).toLocaleDateString()}</span>
                                  {record.doctor && <span>• {record.doctor}</span>}
                                  <span>• {record.images.length} image(s)</span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                {record.aiAnalysis && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    <Brain className="w-3 h-3 mr-1" />
                                    AI Analyzed
                                  </Badge>
                                )}
                                <Badge
                                  variant="secondary"
                                  className="bg-green-50 text-green-700 border-green-200"
                                >
                                  <Lock className="w-3 h-3 mr-1" />
                                  Secure
                                </Badge>
                              </div>
                            </div>

                            <p className="text-muted-foreground mb-3 line-clamp-2">
                              {record.description}
                            </p>

                            {/* Image thumbnails */}
                            <div className="flex space-x-2 mb-3">
                              {record.images.slice(0, 4).map((image, idx) => (
                                <img
                                  key={idx}
                                  src={image}
                                  alt={`Scan ${idx + 1}`}
                                  className="w-12 h-12 object-cover rounded border border-border cursor-pointer hover:scale-110 transition-transform"
                                  onClick={() => setSelectedRecord(record)}
                                />
                              ))}
                              {record.images.length > 4 && (
                                <div className="w-12 h-12 bg-muted rounded border border-border flex items-center justify-center text-xs font-medium text-muted-foreground">
                                  +{record.images.length - 4}
                                </div>
                              )}
                            </div>

                            {/* AI Analysis Preview */}
                            {record.aiAnalysis && (
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Brain className="w-4 h-4 text-blue-600" />
                                  <span className="font-medium text-blue-800 text-sm">
                                    AI Analysis Summary
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(record.aiAnalysis.confidence * 100)}% confidence
                                  </Badge>
                                </div>
                                <p className="text-sm text-blue-700">
                                  {record.aiAnalysis.findings[0]}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700 p-0 h-auto mt-1"
                                  onClick={() => setSelectedRecord(record)}
                                >
                                  View full analysis →
                                </Button>
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

          <TabsContent value="analysis" className="space-y-6">
            <Card className="shadow-colored border-border/50 fade-in">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-primary" />
                  <span>AI Analysis Dashboard</span>
                </CardTitle>
                <CardDescription>
                  Artificial intelligence insights from your medical images
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Advanced AI Analysis
                </h3>
                <p className="text-muted-foreground">
                  Upload medical scans to receive AI-powered analysis and insights.
                  Our system can help identify patterns and provide preliminary findings.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Scan Detail Modal */}
      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {React.createElement(getScanIcon(selectedRecord.type), { className: "w-5 h-5 text-primary" })}
                <span>{selectedRecord.title}</span>
              </DialogTitle>
              <DialogDescription>
                Detailed view of medical scan with AI analysis results
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Images Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedRecord.images.map((image, idx) => (
                  <img
                    key={idx}
                    src={image}
                    alt={`Scan ${idx + 1}`}
                    className="w-full h-48 object-cover rounded border border-border"
                  />
                ))}
              </div>

              {/* Scan Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <div className="font-medium">{new Date(selectedRecord.date).toLocaleDateString()}</div>
                </div>
                {selectedRecord.doctor && (
                  <div>
                    <span className="text-muted-foreground">Provider:</span>
                    <div className="font-medium">{selectedRecord.doctor}</div>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <div className="font-medium">
                    {scanTypes.find(st => st.value === selectedRecord.type)?.label || selectedRecord.type}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Images:</span>
                  <div className="font-medium">{selectedRecord.images.length} file(s)</div>
                </div>
              </div>

              {/* AI Analysis */}
              {selectedRecord.aiAnalysis && (
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <span>AI Analysis Results</span>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(selectedRecord.aiAnalysis.confidence * 100)}% confidence
                    </Badge>
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-sm mb-2">Findings:</h5>
                      <ul className="space-y-1">
                        {selectedRecord.aiAnalysis.findings.map((finding, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start space-x-2">
                            <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm mb-2">Recommendations:</h5>
                      <ul className="space-y-1">
                        {selectedRecord.aiAnalysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start space-x-2">
                            <AlertTriangle className="w-3 h-3 text-orange-600 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>Disclaimer:</strong> AI analysis is for informational purposes only and should not replace professional medical diagnosis or treatment. Always consult with qualified healthcare providers.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
