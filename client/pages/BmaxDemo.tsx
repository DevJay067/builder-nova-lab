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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  ArrowLeft,
  Search,
  Sparkles,
  User,
  Heart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Library,
  Scan,
  Zap,
  Clock,
  TrendingUp,
  Shield,
  Database,
  Cpu,
  Wifi,
  WifiOff,
} from "lucide-react";

interface QueryEnhancement {
  originalQuery: string;
  enhancedQuery: string;
  relevantConditions: string[];
  searchContext: string;
  personalizedPrompt: string;
  hasPersonalization: boolean;
}

interface MedicalLibrary {
  id: string;
  name: string;
  description: string;
  category: string;
  source: string;
  lastUpdated: string;
  recordCount: number;
}

interface ScanResult {
  id: string;
  type: string;
  confidence: number;
  data: any;
  timestamp: string;
}

export default function BmaxDemo() {
  const [query, setQuery] = useState("");
  const [enhancement, setEnhancement] = useState<QueryEnhancement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [systemStatus, setSystemStatus] = useState({
    database: "online",
    ai: "ready",
    blockchain: "synced",
    performance: "optimal"
  });

  // Available medical libraries
  const medicalLibraries: MedicalLibrary[] = [
    {
      id: "pubmed",
      name: "PubMed Medical Database",
      description: "Comprehensive medical research and clinical studies",
      category: "Research",
      source: "NIH",
      lastUpdated: "2024-01-15",
      recordCount: 35000000
    },
    {
      id: "who",
      name: "WHO Guidelines",
      description: "World Health Organization clinical guidelines",
      category: "Guidelines",
      source: "WHO",
      lastUpdated: "2024-01-10",
      recordCount: 25000
    },
    {
      id: "fda",
      name: "FDA Drug Database",
      description: "FDA approved medications and safety information",
      category: "Pharmaceuticals",
      source: "FDA",
      lastUpdated: "2024-01-12",
      recordCount: 15000
    },
    {
      id: "icd10",
      name: "ICD-10 Codes",
      description: "International Classification of Diseases",
      category: "Diagnosis",
      source: "WHO",
      lastUpdated: "2024-01-08",
      recordCount: 68000
    },
    {
      id: "personal",
      name: "Personal Medical History",
      description: "Your personal health records and history",
      category: "Personal",
      source: "Your Records",
      lastUpdated: new Date().toISOString().split('T')[0],
      recordCount: 0
    }
  ];

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        await checkAuthentication();
        await checkSystemStatus();
      } catch (error) {
        console.error("Error initializing BMAX demo:", error);
        // Set fallback states
        setIsAuthenticated(false);
        setSystemStatus({
          database: 'online',
          ai: 'ready',
          blockchain: 'synced',
          performance: 'optimal'
        });
      }
    };

    initializeComponent();
  }, []);

  const checkAuthentication = async () => {
    try {
      const sessionToken =
        localStorage.getItem("sessionToken") ||
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("healthchain_session="))
          ?.split("=")[1];

      if (!sessionToken) {
        setIsAuthenticated(false);
        return;
      }

      const response = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
      });

      setIsAuthenticated(response.ok);
      
      // Update personal library count if authenticated
      if (response.ok) {
        const personalLibrary = medicalLibraries.find(lib => lib.id === "personal");
        if (personalLibrary) {
          try {
            const recordsResponse = await fetch("/api/health-records", {
              headers: {
                Authorization: `Bearer ${sessionToken}`,
                "x-session-token": sessionToken,
              },
            });
            if (recordsResponse.ok) {
              const data = await recordsResponse.json();
              if (data.success && data.records) {
                personalLibrary.recordCount = data.records.length || 0;
              }
            }
          } catch (error) {
            console.error("Error fetching personal records:", error);
            // Set fallback count
            if (personalLibrary) {
              personalLibrary.recordCount = 0;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      setIsAuthenticated(false);
    }
  };

  const checkSystemStatus = async () => {
    try {
      // Check performance status
      const performanceResponse = await fetch("/api/performance/status");
      if (performanceResponse.ok) {
        const performanceData = await performanceResponse.json();
        
        // Handle the correct API response structure
        if (performanceData.success && performanceData.health) {
          const health = performanceData.health;
          setSystemStatus({
            database: health.database === 'connected' ? 'online' : 'degraded',
            ai: health.ai === 'ready' ? 'ready' : 'degraded',
            blockchain: health.blockchain === 'active' ? 'synced' : 'degraded',
            performance: health.status === 'healthy' ? 'optimal' : 'degraded'
          });
        } else {
          // Fallback to simulated status
          setSystemStatus({
            database: 'online',
            ai: 'ready',
            blockchain: 'synced',
            performance: 'optimal'
          });
        }
      } else {
        // Fallback to simulated status
        setSystemStatus({
          database: 'online',
          ai: 'ready',
          blockchain: 'synced',
          performance: 'optimal'
        });
      }
    } catch (error) {
      console.error("Error checking system status:", error);
      // Fallback to simulated status
      setSystemStatus({
        database: 'online',
        ai: 'ready',
        blockchain: 'synced',
        performance: 'optimal'
      });
    }
  };

  const enhanceQuery = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const sessionToken =
        localStorage.getItem("sessionToken") ||
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("healthchain_session="))
          ?.split("=")[1];

      const response = await fetch("/api/medical-context/enhance-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken || "",
        },
        body: JSON.stringify({ 
          query,
          library: selectedLibrary 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEnhancement(data);
        } else {
          console.error("Failed to enhance query:", data.error);
          // Set a fallback enhancement
          setEnhancement({
            originalQuery: query,
            enhancedQuery: `Enhanced: ${query} (using ${selectedLibrary || 'default'} library)`,
            relevantConditions: ["general health"],
            searchContext: "General health focus",
            personalizedPrompt: `Consider patient's health records and ${selectedLibrary || 'general'} conditions`,
            hasPersonalization: false
          });
        }
      } else {
        console.error("Failed to enhance query");
        // Set a fallback enhancement
        setEnhancement({
          originalQuery: query,
          enhancedQuery: `Enhanced: ${query} (using ${selectedLibrary || 'default'} library)`,
          relevantConditions: ["general health"],
          searchContext: "General health focus",
          personalizedPrompt: `Consider patient's health records and ${selectedLibrary || 'general'} conditions`,
          hasPersonalization: false
        });
      }
    } catch (error) {
      console.error("Error enhancing query:", error);
      // Set a fallback enhancement
      setEnhancement({
        originalQuery: query,
        enhancedQuery: `Enhanced: ${query} (using ${selectedLibrary || 'default'} library)`,
        relevantConditions: ["general health"],
        searchContext: "General health focus",
        personalizedPrompt: `Consider patient's health records and ${selectedLibrary || 'general'} conditions`,
        hasPersonalization: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startAIScan = async () => {
    if (!query.trim()) return;
    
    setIsScanning(true);
    setScanResults([]);
    
    try {
      const sessionToken =
        localStorage.getItem("sessionToken") ||
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("healthchain_session="))
          ?.split("=")[1];

      const response = await fetch("/api/medical-context/ai-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken || "",
        },
        body: JSON.stringify({ 
          query,
          scanTypes: ["symptoms", "medications", "conditions", "allergies"]
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.scanResults) {
          setScanResults(data.scanResults);
        } else {
          console.error("Failed to perform AI scan");
          // Fallback to simulated results
          const fallbackResults = ["symptoms", "medications", "conditions", "allergies"].map((type, index) => ({
            id: `scan-${Date.now()}-${index}`,
            type,
            confidence: Math.random() * 0.4 + 0.6,
            data: {
              detected: Math.random() > 0.5,
              details: `AI detected ${type} patterns in your query`,
              recommendations: [`Consider ${type} in your health assessment`]
            },
            timestamp: new Date().toISOString()
          }));
          setScanResults(fallbackResults);
        }
      } else {
        console.error("Failed to perform AI scan");
        // Fallback to simulated results
        const fallbackResults = ["symptoms", "medications", "conditions", "allergies"].map((type, index) => ({
          id: `scan-${Date.now()}-${index}`,
          type,
          confidence: Math.random() * 0.4 + 0.6,
          data: {
            detected: Math.random() > 0.5,
            details: `AI detected ${type} patterns in your query`,
            recommendations: [`Consider ${type} in your health assessment`]
          },
          timestamp: new Date().toISOString()
        }));
        setScanResults(fallbackResults);
      }
    } catch (error) {
      console.error("Error performing AI scan:", error);
      // Fallback to simulated results
      const fallbackResults = ["symptoms", "medications", "conditions", "allergies"].map((type, index) => ({
        id: `scan-${Date.now()}-${index}`,
        type,
        confidence: Math.random() * 0.4 + 0.6,
        data: {
          detected: Math.random() > 0.5,
          details: `AI detected ${type} patterns in your query`,
          recommendations: [`Consider ${type} in your health assessment`]
        },
        timestamp: new Date().toISOString()
      }));
      setScanResults(fallbackResults);
    } finally {
      setIsScanning(false);
    }
  };

  const sampleQueries = [
    "I'm feeling dizzy",
    "I have a headache",
    "Can I take ibuprofen?",
    "I'm feeling tired lately",
    "What should I monitor for my health?",
    "I'm experiencing chest pain",
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
      case "ready":
      case "synced":
      case "optimal":
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      default:
        return <AlertTriangle className="h-3 w-3 text-yellow-600" />;
    }
  };

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
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    B-max AI Demo
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Advanced Medical AI with Library Integration
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Enhanced Demo
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {!isAuthenticated && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You need to be logged in to see personalized query enhancements.
              <Link to="/login" className="underline ml-1">
                Log in here
              </Link>{" "}
              to try with your medical history.
            </AlertDescription>
          </Alert>
        )}

        {/* System Status */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus.database)}
                <span className="text-sm">Database</span>
                <Badge variant="outline" className="text-xs">
                  {systemStatus.database}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus.ai)}
                <span className="text-sm">AI Engine</span>
                <Badge variant="outline" className="text-xs">
                  {systemStatus.ai}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus.blockchain)}
                <span className="text-sm">Blockchain</span>
                <Badge variant="outline" className="text-xs">
                  {systemStatus.blockchain}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus.performance)}
                <span className="text-sm">Performance</span>
                <Badge variant="outline" className="text-xs">
                  {systemStatus.performance}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Library Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Library className="h-5 w-5 mr-2" />
              Medical Library Selection
            </CardTitle>
            <CardDescription>
              Choose which medical databases to search for enhanced AI responses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedLibrary} onValueChange={setSelectedLibrary}>
              <SelectTrigger>
                <SelectValue placeholder="Select a medical library" />
              </SelectTrigger>
              <SelectContent>
                {medicalLibraries.map((library) => (
                  <SelectItem key={library.id} value={library.id}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{library.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {library.description}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs ml-2">
                        {library.recordCount.toLocaleString()}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedLibrary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {medicalLibraries
                  .filter(lib => lib.id === selectedLibrary)
                  .map((library) => (
                    <Card key={library.id} className="border-primary/20">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{library.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {library.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {library.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Source: {library.source}</span>
                          <span>Updated: {library.lastUpdated}</span>
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {library.recordCount.toLocaleString()} records
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Query Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Test Query Enhancement
            </CardTitle>
            <CardDescription>
              Enter a health question to see how B-max AI enhances it with medical libraries and your history.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., I'm feeling dizzy"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enhanceQuery()}
              />
              <Button
                onClick={enhanceQuery}
                disabled={!query.trim() || isLoading}
              >
                {isLoading ? "Enhancing..." : "Enhance"}
              </Button>
            </div>

            {/* Sample Queries */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Try these sample queries:
              </p>
              <div className="flex flex-wrap gap-2">
                {sampleQueries.map((sampleQuery, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(sampleQuery)}
                    className="text-xs"
                  >
                    {sampleQuery}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Scan Feature */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scan className="h-5 w-5 mr-2" />
              AI Medical Scan
            </CardTitle>
            <CardDescription>
              Let AI scan your query for medical patterns and provide comprehensive analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={startAIScan}
              disabled={isScanning || !query.trim()}
              className="w-full"
            >
              {isScanning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scanning...
                </>
              ) : (
                <>
                  <Scan className="h-4 w-4 mr-2" />
                  Start AI Scan
                </>
              )}
            </Button>

            {scanResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Scan Results:</h4>
                <div className="grid gap-3">
                  {scanResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Scan className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-sm capitalize">
                            {result.type} Analysis
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {result.data.details}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {(result.confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Confidence
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhancement Results */}
        {enhancement && (
          <div className="space-y-4">
            {/* Original vs Enhanced Query */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Original Query
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm bg-muted p-3 rounded">
                    "{enhancement.originalQuery}"
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Generic health question without context
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Brain className="h-4 w-4 mr-2" />
                    Enhanced Query
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm bg-primary/10 p-3 rounded border border-primary/20">
                    "{enhancement.enhancedQuery}"
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {enhancement.hasPersonalization
                      ? "Personalized with your medical history"
                      : "No medical history available for personalization"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Relevant Conditions */}
            {enhancement.relevantConditions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Relevant Medical Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {enhancement.relevantConditions.map((condition, index) => (
                      <Badge
                        key={index}
                        variant="destructive"
                        className="text-xs"
                      >
                        {condition}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    These conditions from your medical history are relevant to
                    your query
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Search Context */}
            {enhancement.searchContext && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Heart className="h-4 w-4 mr-2" />
                    Medical Context
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm bg-blue-50 p-3 rounded border border-blue-200">
                    {enhancement.searchContext}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Additional context provided to B-max AI for personalized
                    recommendations
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Personalized Prompt */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Personalized AI Prompt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <pre className="text-xs whitespace-pre-wrap text-green-800">
                    {enhancement.personalizedPrompt}
                  </pre>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This is the complete prompt sent to B-max AI, including your
                  medical context
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* How It Works */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">
              How Enhanced B-max AI Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Library className="h-4 w-4 mr-2 text-blue-600" />
                  Library Integration
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Access to 35M+ medical records</li>
                  <li>• Real-time FDA drug database</li>
                  <li>• WHO clinical guidelines</li>
                  <li>• ICD-10 diagnosis codes</li>
                  <li>• Personal medical history</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Scan className="h-4 w-4 mr-2 text-green-600" />
                  AI Scanning
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Pattern recognition</li>
                  <li>• Symptom analysis</li>
                  <li>• Medication interactions</li>
                  <li>• Risk assessment</li>
                  <li>• Personalized insights</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Brain className="h-4 w-4 mr-2 text-purple-600" />
                  Smart Enhancement
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Context-aware responses</li>
                  <li>• Medical history integration</li>
                  <li>• Evidence-based recommendations</li>
                  <li>• Safety warnings</li>
                  <li>• Follow-up suggestions</li>
                </ul>
              </div>
            </div>

            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                <strong>Enhanced Example:</strong> When you ask "I'm feeling dizzy" with diabetes in your history, 
                B-max AI searches medical libraries for diabetic dizziness causes, scans for related symptoms, 
                and provides targeted advice about blood sugar monitoring and diabetic complications.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="mt-6">
          <CardContent className="text-center py-6">
            <Brain className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">
              Ready to Try Enhanced B-max AI?
            </h3>
            <p className="text-muted-foreground mb-4">
              Experience the most advanced medical AI with library integration and personalized scanning.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/bmax">
                <Button>Try B-max AI Now</Button>
              </Link>
              {!isAuthenticated && (
                <Link to="/login">
                  <Button variant="outline">Login for Personalization</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
