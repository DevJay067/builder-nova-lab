import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  ArrowLeft,
  Settings,
  Sparkles,
  Clock,
  FileText,
  Shield,
  Activity,
  Pill,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react";

export default function BmaxAI() {
  const [medicalContext, setMedicalContext] = useState(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [contextError, setContextError] = useState(null);

  useEffect(() => {
    loadMedicalContext();
  }, []);

  const loadMedicalContext = async () => {
    try {
      setIsLoadingContext(true);
      const response = await fetch('/api/medical-context', {
        headers: {
          'patient-id': 'default-patient'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMedicalContext(data);
      } else {
        setContextError('Failed to load medical context');
      }
    } catch (error) {
      console.error('Error loading medical context:', error);
      setContextError('Failed to connect to medical records');
    } finally {
      setIsLoadingContext(false);
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
                  <h1 className="text-xl font-bold text-foreground">B-max AI Assistant</h1>
                  <p className="text-sm text-muted-foreground">Your Personal Health AI</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Medical Context Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  Medical Context
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingContext ? (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading medical history...</span>
                  </div>
                ) : contextError ? (
                  <Alert className="border-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {contextError}
                    </AlertDescription>
                  </Alert>
                ) : medicalContext?.hasData ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">Medical History Loaded</span>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium">Total Records:</span>
                        <span className="ml-2">{medicalContext.summary.totalRecords}</span>
                      </div>

                      {medicalContext.summary.vitals && (
                        <div>
                          <span className="font-medium">Latest Vitals:</span>
                          <div className="ml-2 text-xs text-muted-foreground">
                            {medicalContext.summary.vitals.bloodPressure && (
                              <div>BP: {medicalContext.summary.vitals.bloodPressure}</div>
                            )}
                            {medicalContext.summary.vitals.weight && (
                              <div>Weight: {medicalContext.summary.vitals.weight}kg</div>
                            )}
                          </div>
                        </div>
                      )}

                      {medicalContext.summary.medications.length > 0 && (
                        <div>
                          <span className="font-medium flex items-center">
                            <Pill className="h-3 w-3 mr-1" />
                            Medications:
                          </span>
                          <div className="ml-2 text-xs text-muted-foreground">
                            {medicalContext.summary.medications.slice(0, 3).map((med, index) => (
                              <div key={index}>• {med}</div>
                            ))}
                            {medicalContext.summary.medications.length > 3 && (
                              <div>• +{medicalContext.summary.medications.length - 3} more</div>
                            )}
                          </div>
                        </div>
                      )}

                      {medicalContext.summary.allergies.length > 0 && (
                        <div>
                          <span className="font-medium flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Allergies:
                          </span>
                          <div className="ml-2 text-xs text-muted-foreground">
                            {medicalContext.summary.allergies.map((allergy, index) => (
                              <div key={index}>• {allergy}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <Badge variant="secondary" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Blockchain Verified
                    </Badge>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity className="h-4 w-4" />
                      <span>No medical history found</span>
                    </div>
                    <p className="text-xs">
                      Add your health records to get personalized AI recommendations.
                    </p>
                    <Link to="/history">
                      <Button variant="outline" size="sm" className="mt-2 text-xs">
                        Add Health Data
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {medicalContext?.hasData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Context Active</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="border-primary bg-primary/5">
                    <Brain className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      B-max AI now has access to your medical history for personalized health recommendations.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main AI Agent Area */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-200px)] flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">B-max AI Health Assistant</CardTitle>
                  <div className="flex items-center space-x-2">
                    {medicalContext?.hasData && (
                      <Badge variant="default" className="text-xs">
                        <Brain className="h-3 w-3 mr-1" />
                        Context Enabled
                      </Badge>
                    )}
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Live AI Agent
                    </div>
                  </div>
                </div>
                <CardDescription>
                  {medicalContext?.hasData
                    ? "AI is now personalized with your medical history for more accurate health recommendations."
                    : "Your personal AI health companion. Add medical history for personalized recommendations."
                  }
                </CardDescription>
              </CardHeader>

              {/* Enhanced AI Agent with Medical Context */}
              <CardContent className="flex-1 overflow-hidden p-0">
                {medicalContext?.hasData ? (
                  <Tabs defaultValue="ai-chat" className="h-full flex flex-col">
                    <div className="px-4 pb-2">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="ai-chat">AI Chat</TabsTrigger>
                        <TabsTrigger value="medical-context">Medical Context</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="ai-chat" className="flex-1 mt-0">
                      <iframe
                        src={`https://agent.jotform.com/0198328d092a7ce998d0bac908260635265d?embedMode=iframe&background=1&shadow=1&context=${encodeURIComponent(medicalContext.context)}`}
                        className="w-full h-full border-0"
                        title="B-max AI Health Assistant"
                        allow="microphone; camera"
                        style={{ minHeight: '500px' }}
                      />
                    </TabsContent>

                    <TabsContent value="medical-context" className="flex-1 mt-0 p-4 overflow-y-auto">
                      <div className="space-y-4">
                        <h3 className="font-semibold">Current Medical Context Sent to AI:</h3>
                        <pre className="bg-muted p-4 rounded-lg text-xs whitespace-pre-wrap font-mono overflow-x-auto">
                          {medicalContext.context}
                        </pre>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Shield className="h-3 w-3" />
                          <span>This data is encrypted and stored on blockchain</span>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <iframe
                    src="https://agent.jotform.com/0198328d092a7ce998d0bac908260635265d?embedMode=iframe&background=1&shadow=1"
                    className="w-full h-full border-0 rounded-b-lg"
                    title="B-max AI Health Assistant"
                    allow="microphone; camera"
                    style={{ minHeight: '600px' }}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
