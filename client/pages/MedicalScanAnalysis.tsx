import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Upload, 
  Camera, 
  Brain, 
  Shield, 
  Activity,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  FileText,
  BarChart3,
  Zap,
  Sparkles,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  Settings,
  Database,
  Lock
} from "lucide-react";

interface MedicalScanResult {
  id: string;
  scanType: 'xray' | 'mri' | 'ct' | 'ultrasound' | 'bloodwork' | 'ecg' | 'general';
  confidence: number;
  findings: string[];
  diagnosis: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  metadata: {
    imageHash: string;
    processingTime: number;
    aiModel: string;
    version: string;
  };
}

interface ScanAnalysisRequest {
  imageData: string;
  scanType?: string;
  patientSymptoms?: string;
  patientHistory?: string;
}

export default function MedicalScanAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanType, setScanType] = useState<string>('general');
  const [patientSymptoms, setPatientSymptoms] = useState<string>('');
  const [patientHistory, setPatientHistory] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<MedicalScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<MedicalScanResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [blockchainStats, setBlockchainStats] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    loadScanHistory();
    loadBlockchainStats();
  }, []);

  const loadScanHistory = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/medical-scan/results', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`,
          'x-session-token': localStorage.getItem('sessionToken') || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setScanHistory(data.scans || []);
      }
    } catch (error) {
      console.error('Failed to load scan history:', error);
    }
  };

  const loadBlockchainStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/blockchain/stats');
      if (response.ok) {
        const data = await response.json();
        setBlockchainStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load blockchain stats:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);
    }
  };

  const handleCameraCapture = async () => {
    try {
      if (!cameraRef.current) return;

      const canvas = document.createElement('canvas');
      canvas.width = cameraRef.current.videoWidth;
      canvas.height = cameraRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(cameraRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(blob));
            setError(null);
          }
        }, 'image/jpeg');
      }
    } catch (error) {
      console.error('Camera capture failed:', error);
      setError('Failed to capture image from camera');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
      setError('Failed to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraRef.current && cameraRef.current.srcObject) {
      const stream = cameraRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const analyzeScan = async () => {
    if (!selectedFile) {
      setError('Please select an image to analyze');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setError(null);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(selectedFile);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const request: ScanAnalysisRequest = {
        imageData: base64,
        scanType,
        patientSymptoms,
        patientHistory,
      };

      const response = await fetch('http://localhost:3001/api/medical-scan/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`,
          'x-session-token': localStorage.getItem('sessionToken') || '',
        },
        body: JSON.stringify(request),
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (response.ok) {
        const data = await response.json();
        setAnalysisResult(data.result);
        
        // Add to history
        setScanHistory(prev => [data.result, ...prev]);
        
        setTimeout(() => {
          setIsAnalyzing(false);
          setAnalysisProgress(0);
        }, 1000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="w-4 h-4" />;
      case 'medium': return <AlertCircle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 glass backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="btn-smooth">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
                  <Brain className="h-5 w-5" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-slate-800">
                    Medical Scan AI Analysis
                  </h1>
                  <p className="text-sm text-slate-600 font-medium">
                    AI-Powered Medical Image Analysis
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                <Shield className="w-3 h-3 mr-1" />
                Blockchain Secured
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            <Card className="shadow-colored border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-primary" />
                  <span>Upload Medical Scan</span>
                </CardTitle>
                <CardDescription>
                  Upload medical images for AI-powered analysis and diagnosis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Methods */}
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="upload" className="flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>Upload File</span>
                    </TabsTrigger>
                    <TabsTrigger value="camera" className="flex items-center space-x-2">
                      <Camera className="w-4 h-4" />
                      <span>Camera</span>
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex items-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>URL</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Drag and drop your medical scan image here, or click to browse
                      </p>
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-smooth"
                      >
                        Choose File
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="camera" className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      {!isCameraActive ? (
                        <div>
                          <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">
                            Capture medical scan image using your camera
                          </p>
                          <Button onClick={startCamera} className="btn-smooth">
                            Start Camera
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <video
                            ref={cameraRef}
                            autoPlay
                            playsInline
                            className="w-full max-w-md mx-auto rounded-lg mb-4"
                          />
                          <div className="space-x-2">
                            <Button onClick={handleCameraCapture} className="btn-smooth">
                              Capture Image
                            </Button>
                            <Button onClick={stopCamera} variant="outline">
                              Stop Camera
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="url" className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Enter URL of medical scan image
                      </p>
                      <input
                        type="url"
                        placeholder="https://example.com/scan.jpg"
                        className="w-full p-2 border border-border rounded-md"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Preview */}
                {previewUrl && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Image Preview</h3>
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Medical scan preview"
                        className="w-full max-w-md rounded-lg border border-border"
                      />
                      <Button
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Analysis Options */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Analysis Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Scan Type</label>
                      <select
                        value={scanType}
                        onChange={(e) => setScanType(e.target.value)}
                        className="w-full p-2 border border-border rounded-md"
                      >
                        <option value="general">General</option>
                        <option value="xray">X-Ray</option>
                        <option value="mri">MRI</option>
                        <option value="ct">CT Scan</option>
                        <option value="ultrasound">Ultrasound</option>
                        <option value="bloodwork">Blood Work</option>
                        <option value="ecg">ECG</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Patient Symptoms</label>
                      <input
                        type="text"
                        value={patientSymptoms}
                        onChange={(e) => setPatientSymptoms(e.target.value)}
                        placeholder="e.g., chest pain, fever"
                        className="w-full p-2 border border-border rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Patient History</label>
                    <textarea
                      value={patientHistory}
                      onChange={(e) => setPatientHistory(e.target.value)}
                      placeholder="Relevant medical history..."
                      rows={3}
                      className="w-full p-2 border border-border rounded-md"
                    />
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Analysis Progress */}
                {isAnalyzing && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Analyzing...</span>
                      <span className="text-sm text-muted-foreground">{analysisProgress}%</span>
                    </div>
                    <Progress value={analysisProgress} className="w-full" />
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>AI is analyzing your medical scan</span>
                    </div>
                  </div>
                )}

                {/* Analyze Button */}
                <Button
                  onClick={analyzeScan}
                  disabled={!selectedFile || isAnalyzing}
                  className="w-full btn-smooth shadow-colored"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Analyze with AI
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysisResult && (
              <Card className="shadow-colored border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span>AI Analysis Results</span>
                    <Badge className={getRiskLevelColor(analysisResult.riskLevel)}>
                      {getRiskLevelIcon(analysisResult.riskLevel)}
                      <span className="ml-1 capitalize">{analysisResult.riskLevel} Risk</span>
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    AI-powered analysis completed with {Math.round(analysisResult.confidence * 100)}% confidence
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Confidence & Risk */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">AI Confidence</label>
                      <div className="flex items-center space-x-2">
                        <Progress value={analysisResult.confidence * 100} className="flex-1" />
                        <span className="text-sm font-medium">{Math.round(analysisResult.confidence * 100)}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Processing Time</label>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{analysisResult.metadata.processingTime}ms</span>
                      </div>
                    </div>
                  </div>

                  {/* Findings */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>Key Findings</span>
                    </h3>
                    <div className="space-y-2">
                      {analysisResult.findings.map((finding, index) => (
                        <div key={index} className="flex items-start space-x-2 p-3 bg-muted/50 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{finding}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>AI Diagnosis</span>
                    </h3>
                    <div className="space-y-2">
                      {analysisResult.diagnosis.map((diagnosis, index) => (
                        <Badge key={index} variant="outline" className="mr-2 mb-2">
                          {diagnosis}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center space-x-2">
                      <Activity className="w-4 h-4" />
                      <span>Recommendations</span>
                    </h3>
                    <div className="space-y-2">
                      {analysisResult.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                          <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Blockchain Info */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Blockchain Secured</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      This analysis has been securely stored on the blockchain with hash: {analysisResult.metadata.imageHash.substring(0, 16)}...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Stats & History */}
          <div className="space-y-6">
            {/* Blockchain Stats */}
            {blockchainStats && (
              <Card className="shadow-colored border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lock className="w-5 h-5 text-primary" />
                    <span>Blockchain Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Blocks</p>
                      <p className="font-semibold">{blockchainStats.totalBlocks?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Transactions</p>
                      <p className="font-semibold">{blockchainStats.totalTransactions?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Difficulty</p>
                      <p className="font-semibold">{blockchainStats.currentDifficulty}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Hash Rate</p>
                      <p className="font-semibold">{blockchainStats.networkHashRate} H/s</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-700">Chain Integrity Verified</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scan History */}
            <Card className="shadow-colored border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span>Recent Scans</span>
                </CardTitle>
                <CardDescription>
                  Your recent medical scan analyses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {scanHistory.length > 0 ? (
                  scanHistory.slice(0, 5).map((scan) => (
                    <div key={scan.id} className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="capitalize">
                          {scan.scanType}
                        </Badge>
                        <Badge className={getRiskLevelColor(scan.riskLevel)}>
                          {scan.riskLevel}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mb-1">
                        {scan.findings[0] || 'Analysis completed'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(scan.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                    <p>No scan history yet</p>
                    <p className="text-xs">Upload your first medical scan to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}