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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  ArrowLeft, 
  Settings, 
  Sparkles, 
  Clock, 
  Shield, 
  Activity,
  AlertTriangle,
  User,
  Heart
} from "lucide-react";

interface MedicalCondition {
  name: string;
  type: string;
  severity?: string;
  lastUpdated?: string;
}

interface PersonalizedContext {
  success: boolean;
  hasData: boolean;
  patientId: string;
  context: string;
  summary: {
    totalConditions: number;
    chronicConditions: number;
    currentMedications: number;
    knownAllergies: number;
    recentSymptoms: number;
    lastUpdate: string;
  };
  medicalConditions: MedicalCondition[];
  currentMedications: string[];
  allergies: string[];
  recentSymptoms: string[];
  searchEnhancers: string[];
  aiInstructions: {
    personalizationEnabled: boolean;
    considerConditions: string[];
    medicationInteractions: string[];
    allergyWarnings: string[];
    contextualPrompt: string;
  };
}

interface HealthInsight {
  category: string;
  priority: string;
  title: string;
  description: string;
  recommendations: string[];
  relatedSymptoms?: string[];
  currentMedications?: string[];
  knownAllergies?: string[];
  recentSymptoms?: string[];
}

export default function BmaxAI() {
  const [personalizedContext, setPersonalizedContext] = useState<PersonalizedContext | null>(null);
  const [healthInsights, setHealthInsights] = useState<HealthInsight[]>([]);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showMedicalSummary, setShowMedicalSummary] = useState(false);

  useEffect(() => {
    checkAuthenticationAndLoadContext();
  }, []);

  const checkAuthenticationAndLoadContext = async () => {
    try {
      setIsLoadingContext(true);
      
      // Check if user is authenticated
      const sessionToken = localStorage.getItem("sessionToken") || 
                          document.cookie.split('; ').find(row => row.startsWith('healthchain_session='))?.split('=')[1];

      if (!sessionToken) {
        console.log("No session token found, user not authenticated");
        setIsAuthenticated(false);
        setIsLoadingContext(false);
        return;
      }

      // Verify session
      const authResponse = await fetch("/api/auth/verify", {
        headers: {
          "Authorization": `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
      });

      if (!authResponse.ok) {
        console.log("Session verification failed");
        setIsAuthenticated(false);
        setIsLoadingContext(false);
        return;
      }

      setIsAuthenticated(true);

      // Load personalized medical context
      await loadPersonalizedContext(sessionToken);
      
      // Load health insights
      await loadHealthInsights(sessionToken);

    } catch (error) {
      console.error("Error checking authentication:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingContext(false);
    }
  };

  const loadPersonalizedContext = async (sessionToken: string) => {
    try {
      const response = await fetch("/api/medical-context/personalized", {
        headers: {
          "Authorization": `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPersonalizedContext(data);
        console.log("✅ Personalized medical context loaded:", data);
      } else {
        console.warn("Failed to load personalized context");
      }
    } catch (error) {
      console.error("Error loading personalized context:", error);
    }
  };

  const loadHealthInsights = async (sessionToken: string) => {
    try {
      const response = await fetch("/api/medical-context/insights", {
        headers: {
          "Authorization": `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hasInsights) {
          setHealthInsights(data.insights);
          console.log("✅ Health insights loaded:", data.insights);
        }
      }
    } catch (error) {
      console.error("Error loading health insights:", error);
    }
  };

  const getMedicalContextSummary = () => {
    if (!personalizedContext?.hasData) return null;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center">
              <User className="h-4 w-4 mr-2" />
              Your Medical Profile
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowMedicalSummary(!showMedicalSummary)}
            >
              {showMedicalSummary ? "Hide" : "Show"} Details
            </Button>
          </div>
        </CardHeader>
        {showMedicalSummary && (
          <CardContent className="pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Conditions:</span>
                <div className="text-foreground">{personalizedContext.summary.totalConditions}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Medications:</span>
                <div className="text-foreground">{personalizedContext.summary.currentMedications}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Allergies:</span>
                <div className="text-foreground">{personalizedContext.summary.knownAllergies}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Recent Symptoms:</span>
                <div className="text-foreground">{personalizedContext.summary.recentSymptoms}</div>
              </div>
            </div>

            {personalizedContext.medicalConditions.length > 0 && (
              <div>
                <span className="font-medium text-muted-foreground text-sm">Key Conditions:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {personalizedContext.medicalConditions.slice(0, 5).map((condition, index) => (
                    <Badge 
                      key={index} 
                      variant={condition.type === 'chronic' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {condition.name}
                    </Badge>
                  ))}
                  {personalizedContext.medicalConditions.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{personalizedContext.medicalConditions.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  const getContextualPrompt = () => {
    if (!personalizedContext?.hasData) {
      return "https://agent.jotform.com/0198328d092a7ce998d0bac908260635265d?embedMode=iframe&background=1&shadow=1";
    }

    // Create enhanced prompt with medical conditions
    const medicalConditionsText = personalizedContext.medicalConditions
      .map(condition => condition.name)
      .join(", ");
    
    const medicationsText = personalizedContext.currentMedications.join(", ");
    const allergiesText = personalizedContext.allergies.join(", ");

    const contextPrompt = `PERSONALIZED MEDICAL CONTEXT:
Medical Conditions: ${medicalConditionsText || "None reported"}
Current Medications: ${medicationsText || "None reported"}
Known Allergies: ${allergiesText || "None reported"}

IMPORTANT INSTRUCTIONS:
- Always consider the patient's medical conditions when providing advice
- Be specific about how recommendations relate to their conditions
- Warn about potential medication interactions
- Consider allergy precautions in all recommendations
- For example: If patient asks about dizziness and has diabetes, specifically address diabetic-related causes of dizziness
- Provide condition-specific advice rather than general health information

When the patient mentions symptoms like "feeling dizzy", immediately consider their medical history (diabetes, hypertension, etc.) and provide targeted advice.`;

    return `https://agent.jotform.com/0198328d092a7ce998d0bac908260635265d?embedMode=iframe&background=1&shadow=1&context=${encodeURIComponent(contextPrompt)}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
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
                      B-max AI Assistant
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Your Personal Health AI
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Please log in to access your personalized B-max AI assistant with medical context.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Link to="/login" className="w-full">
                <Button className="w-full">
                  Log In to Access B-max AI
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground text-center">
                B-max AI uses your medical history to provide personalized health recommendations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                    B-max AI Assistant
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Personalized Health AI
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {personalizedContext?.hasData && (
                <Badge variant="default" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  Personalized
                </Badge>
              )}
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* Medical Summary */}
        {personalizedContext?.hasData && getMedicalContextSummary()}

        {/* Health Insights */}
        {healthInsights.length > 0 && (
          <div className="mb-4 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center">
              <Heart className="h-4 w-4 mr-2" />
              Personalized Health Insights
            </h3>
            <div className="grid gap-2">
              {healthInsights.slice(0, 2).map((insight, index) => (
                <Alert key={index} className={`${insight.priority === 'high' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>{insight.title}:</strong> {insight.description}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* AI Chat Interface */}
        <Card className="h-[calc(100vh-280px)] flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-lg sm:text-xl">
                B-max AI Health Assistant
              </CardTitle>
              <div className="flex items-center space-x-2">
                {isLoadingContext ? (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1 animate-spin" />
                    Loading Context
                  </Badge>
                ) : personalizedContext?.hasData ? (
                  <Badge variant="default" className="text-xs">
                    <Brain className="h-3 w-3 mr-1" />
                    Context Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <Brain className="h-3 w-3 mr-1" />
                    General Mode
                  </Badge>
                )}
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Live AI Agent
                </div>
              </div>
            </div>
            <CardDescription className="text-sm">
              {isLoadingContext 
                ? "Loading your medical context..."
                : personalizedContext?.hasData
                ? `AI is personalized with your medical history (${personalizedContext.summary.totalConditions} conditions, ${personalizedContext.summary.currentMedications} medications). Ask about symptoms and get targeted advice.`
                : "AI is ready to help with general health questions. Add medical history for personalized recommendations."}
            </CardDescription>
          </CardHeader>

          {/* AI Agent Interface */}
          <CardContent className="flex-1 overflow-hidden p-0">
            {isLoadingContext ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Loading your personalized medical context...</p>
                </div>
              </div>
            ) : (
              <iframe
                src={getContextualPrompt()}
                className="w-full h-full border-0 rounded-b-lg"
                title="B-max AI Health Assistant"
                allow="microphone; camera"
                style={{ minHeight: "400px" }}
              />
            )}
          </CardContent>
        </Card>

        {/* Example Queries for Personalized Context */}
        {personalizedContext?.hasData && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Try asking B-max about:</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {personalizedContext.medicalConditions.some(c => c.name.toLowerCase().includes('diabetes')) && (
                  <div className="p-2 bg-secondary/50 rounded text-xs">
                    "I'm feeling dizzy" → Gets diabetes-specific advice
                  </div>
                )}
                {personalizedContext.medicalConditions.some(c => c.name.toLowerCase().includes('hypertension')) && (
                  <div className="p-2 bg-secondary/50 rounded text-xs">
                    "I have a headache" → Considers blood pressure
                  </div>
                )}
                {personalizedContext.currentMedications.length > 0 && (
                  <div className="p-2 bg-secondary/50 rounded text-xs">
                    "Can I take [medication]?" → Checks interactions
                  </div>
                )}
                <div className="p-2 bg-secondary/50 rounded text-xs">
                  "What should I monitor?" → Personalized recommendations
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
