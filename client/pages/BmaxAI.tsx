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
  Heart,
  Stethoscope,
  Zap,
  CheckCircle,
  Loader2,
  Star,
  TrendingUp,
  Mic,
  Video,
  Plus,
} from "lucide-react";
import VoiceAssistant from "@/components/VoiceAssistant";
import { useTranslation } from "@/contexts/LanguageContext";

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

interface AIHealthContext {
  success: boolean;
  context: {
    totalRecords: number;
    lastRecordDate: string | null;
    medicalProfile: {
      conditions: string[];
      currentMedications: string[];
      recentSymptoms: string[];
      chronicConditions: string[];
    };
    recentActivity: {
      records: any[];
      vitalSigns: any[];
      labResults: any[];
    };
    aiPromptContext: {
      medicalHistory: {
        conditions: string;
        medications: string;
        recentSymptoms: string;
      };
      recentActivity: string;
      instructions: string;
    };
    searchEnhancers: string[];
  };
  lastUpdated: string;
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
  const { t } = useTranslation();
  const [personalizedContext, setPersonalizedContext] =
    useState<PersonalizedContext | null>(null);
  const [aiHealthContext, setAiHealthContext] =
    useState<AIHealthContext | null>(null);
  const [healthInsights, setHealthInsights] = useState<HealthInsight[]>([]);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showMedicalSummary, setShowMedicalSummary] = useState(false);
  const [showHealthRecords, setShowHealthRecords] = useState(false);
  const [aiStatus, setAiStatus] = useState<"connecting" | "ready" | "active">(
    "connecting",
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    checkAuthenticationAndLoadContext();

    // Simulate AI status progression
    const statusTimer = setTimeout(() => {
      setAiStatus("ready");
      setTimeout(() => setAiStatus("active"), 1000);
    }, 2000);

    return () => clearTimeout(statusTimer);
  }, []);

  const checkAuthenticationAndLoadContext = async () => {
    try {
      setIsLoadingContext(true);

      const sessionToken =
        localStorage.getItem("sessionToken") ||
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("healthchain_session="))
          ?.split("=")[1];

      if (!sessionToken) {
        setIsAuthenticated(false);
        setIsLoadingContext(false);
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
        setIsLoadingContext(false);
        return;
      }

      setIsAuthenticated(true);
      await loadPersonalizedContext(sessionToken);
      await loadAIHealthContext(sessionToken);
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
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPersonalizedContext(data);
      }
    } catch (error) {
      console.error("Error loading personalized context:", error);
    }
  };

  const loadAIHealthContext = async (sessionToken: string) => {
    try {
      console.log("�� Loading AI health context from saved records...");
      const response = await fetch("/api/ai/health-context", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ AI health context loaded:", {
          totalRecords: data.context?.totalRecords,
          conditions: data.context?.medicalProfile?.conditions?.length,
          medications: data.context?.medicalProfile?.currentMedications?.length,
        });
        setAiHealthContext(data);
      }
    } catch (error) {
      console.error("Error loading AI health context:", error);
    }
  };

  const loadHealthInsights = async (sessionToken: string) => {
    try {
      const response = await fetch("/api/medical-context/insights", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hasInsights) {
          setHealthInsights(data.insights);
        }
      }
    } catch (error) {
      console.error("Error loading health insights:", error);
    }
  };

  const getMedicalContextSummary = () => {
    // Use AI health context if available, otherwise fall back to personalized context
    const hasData =
      aiHealthContext?.context?.totalRecords > 0 ||
      personalizedContext?.hasData;
    if (!hasData) return null;

    const totalRecords = aiHealthContext?.context?.totalRecords || 0;
    const conditions =
      aiHealthContext?.context?.medicalProfile?.conditions ||
      personalizedContext?.medicalConditions?.map((c) => c.name) ||
      [];
    const medications =
      aiHealthContext?.context?.medicalProfile?.currentMedications ||
      personalizedContext?.currentMedications ||
      [];
    const symptoms =
      aiHealthContext?.context?.medicalProfile?.recentSymptoms ||
      personalizedContext?.recentSymptoms ||
      [];
    const lastUpdate =
      aiHealthContext?.lastUpdated || personalizedContext?.summary?.lastUpdate;

    return (
      <Card className="mb-6 card-hover border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50 fade-in">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center">
              <User className="h-4 w-4 mr-2 text-primary" />
              Your Health Records
              <Badge
                variant="secondary"
                className="ml-2 bg-primary/10 text-primary border-primary/20"
              >
                <Activity className="h-3 w-3 mr-1" />
                {totalRecords} Records
              </Badge>
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHealthRecords(!showHealthRecords)}
                className="btn-smooth text-primary hover:bg-primary/10"
              >
                {showHealthRecords ? "Hide" : "Show"} Health Data
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMedicalSummary(!showMedicalSummary)}
                className="btn-smooth text-primary hover:bg-primary/10"
              >
                {showMedicalSummary ? "Hide" : "Show"} Summary
              </Button>
            </div>
          </div>
        </CardHeader>

        {showMedicalSummary && (
          <CardContent className="pt-0 space-y-4 fade-in-up">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">
                  Total Records:
                </span>
                <div className="text-foreground font-semibold">
                  {totalRecords}
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">
                  Conditions:
                </span>
                <div className="text-foreground font-semibold">
                  {conditions.length}
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">
                  Medications:
                </span>
                <div className="text-foreground font-semibold">
                  {medications.length}
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">
                  Symptoms:
                </span>
                <div className="text-foreground font-semibold">
                  {symptoms.length}
                </div>
              </div>
            </div>

            {conditions.length > 0 && (
              <div className="fade-in-up fade-in-delay-1">
                <span className="font-medium text-muted-foreground text-sm">
                  Key Conditions:
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {conditions.slice(0, 5).map((condition, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-xs transform-smooth hover:scale-105"
                    >
                      {condition}
                    </Badge>
                  ))}
                  {conditions.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{conditions.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {medications.length > 0 && (
              <div className="fade-in-up fade-in-delay-2">
                <span className="font-medium text-muted-foreground text-sm">
                  Current Medications:
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {medications.slice(0, 3).map((medication, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs transform-smooth hover:scale-105 border-blue-200 text-blue-700"
                    >
                      {medication}
                    </Badge>
                  ))}
                  {medications.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{medications.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        )}

        {showHealthRecords && aiHealthContext?.context?.recentActivity && (
          <CardContent className="pt-0 space-y-4 fade-in-up border-t">
            <div className="space-y-3">
              <span className="font-medium text-muted-foreground text-sm flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Recent Health Records
              </span>
              {aiHealthContext.context.recentActivity.records
                .slice(0, 3)
                .map((record, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white/70 rounded-lg border border-primary/10 hover:bg-white/90 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">
                          {record.title}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {record.type}
                        </div>
                        {record.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {record.description}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(record.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  const getContextualPrompt = () => {
    // Use AI health context if available, otherwise fall back to default
    const hasHealthData =
      aiHealthContext?.context?.totalRecords > 0 ||
      personalizedContext?.hasData;

    if (!hasHealthData) {
      const noRecordsContext = `
You are a general health AI assistant. The patient has not yet provided any health records.

IMPORTANT: You currently do not have access to this patient's personal health records because they haven't uploaded any yet.

When providing advice:
- Give general health information only
- Recommend consulting healthcare providers for personal medical advice
- Suggest that the patient can add their health records to this platform for personalized guidance
- Do not make assumptions about their medical history

If they ask about personal health matters, let them know that adding their health records will allow you to provide much more personalized and relevant advice.
      `.trim();

      return `https://agent.jotform.com/0198328d092a7ce998d0bac908260635265d?embedMode=iframe&background=1&shadow=1&context=${encodeURIComponent(noRecordsContext)}`;
    }

    let contextPrompt = "";

    if (aiHealthContext?.context?.aiPromptContext) {
      // Use comprehensive AI health context from actual records
      const aiContext = aiHealthContext.context.aiPromptContext;
      contextPrompt = `AUTHORIZED HEALTH RECORDS ACCESS - PATIENT CONSENT GRANTED

You are authorized to access and use this patient's health records for medical consultation. The patient has explicitly shared their health data with you.

${aiContext.instructions}

VERIFIED PATIENT HEALTH DATA:
✓ Medical Conditions: ${aiContext.medicalHistory.conditions}
✓ Current Medications: ${aiContext.medicalHistory.medications}
✓ Recent Symptoms: ${aiContext.medicalHistory.recentSymptoms}
✓ Recent Health Activity: ${aiContext.recentActivity}
✓ Total Health Records Available: ${aiHealthContext.context.totalRecords}
✓ Most Recent Record: ${aiHealthContext.context.lastRecordDate ? new Date(aiHealthContext.context.lastRecordDate).toLocaleDateString() : "No records"}

IMPORTANT: You have legitimate access to this health data. Do not give privacy disclaimers - provide personalized medical guidance based on their documented health records.`;
    } else if (personalizedContext?.hasData) {
      // Fallback to legacy personalized context
      const medicalConditionsText = personalizedContext.medicalConditions
        .map((condition) => condition.name)
        .join(", ");
      const medicationsText = personalizedContext.currentMedications.join(", ");
      const allergiesText = personalizedContext.allergies.join(", ");

      contextPrompt = `PERSONALIZED MEDICAL CONTEXT:
Medical Conditions: ${medicalConditionsText || "None reported"}
Current Medications: ${medicationsText || "None reported"}
Known Allergies: ${allergiesText || "None reported"}

IMPORTANT INSTRUCTIONS:
- Always consider the patient's medical conditions when providing advice
- Be specific about how recommendations relate to their conditions
- Warn about potential medication interactions
- Consider allergy precautions in all recommendations
- Provide condition-specific advice rather than general health information`;
    }

    return `https://agent.jotform.com/0198328d092a7ce998d0bac908260635265d?embedMode=iframe&background=1&shadow=1&context=${encodeURIComponent(contextPrompt)}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 page-transition">
        <header className="border-b border-border/40 glass backdrop-blur-xl sticky top-0 z-50">
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
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg">
                    <Brain className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">
                      {t("bmax.title")}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {t("bmax.subtitle")}
                  </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto shadow-colored-lg card-hover fade-in">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">Authentication Required</CardTitle>
              <CardDescription className="text-muted-foreground">
                Please log in to access your personalized B-max AI assistant
                with medical context.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Link to="/login" className="w-full">
                <Button className="w-full btn-smooth shadow-colored">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Log In to Access B-max AI
                </Button>
              </Link>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  B-max AI uses your medical history to provide personalized
                  health recommendations.
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Private</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Personalized</span>
                  </div>
                </div>
              </div>
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
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 fade-in min-w-0 flex-1">
              <Link to="/">
                <Button variant="ghost" size="sm" className="btn-smooth px-2 sm:px-3">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 transform-smooth hover:scale-110 flex-shrink-0">
                  <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">
                    B-max AI
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium truncate">
                    Health AI
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 fade-in fade-in-delay-1 flex-shrink-0">
              {(aiHealthContext?.context?.totalRecords > 0 ||
                personalizedContext?.hasData) && (
                <Badge
                  variant="default"
                  className="text-xs bg-gradient-to-r from-primary to-primary/80 border-primary/20 hidden sm:flex"
                >
                  <Activity className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">
                    {aiHealthContext?.context?.totalRecords > 0
                      ? `${aiHealthContext.context.totalRecords} Records`
                      : "Personalized"}
                  </span>
                </Badge>
              )}
              <Badge
                variant="secondary"
                className={`text-xs transition-all ${
                  aiStatus === "active"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : aiStatus === "ready"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-1 ${
                    aiStatus === "active"
                      ? "status-online"
                      : aiStatus === "ready"
                        ? "status-warning"
                        : "status-error"
                  }`}
                ></div>
                <span className="hidden sm:inline">
                  {aiStatus === "active"
                    ? "AI Ready"
                    : aiStatus === "ready"
                      ? "Connecting"
                      : "Starting"}
                </span>
                <span className="sm:hidden">
                  {aiStatus === "active"
                    ? "Ready"
                    : aiStatus === "ready"
                      ? "..."
                      : "..."}
                </span>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="btn-smooth hover:bg-muted px-2"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Medical Summary */}
        {personalizedContext?.hasData && getMedicalContextSummary()}

        {/* No Records Message */}
        {isAuthenticated &&
          !isLoadingContext &&
          (!aiHealthContext?.context?.totalRecords ||
            aiHealthContext.context.totalRecords === 0) && (
            <Card className="mb-6 card-hover border-blue-200 bg-gradient-to-r from-blue-50 to-blue-50/50 fade-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Stethoscope className="h-4 w-4 mr-2 text-blue-600" />
                  No Health Records Found
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3">
                  B-max AI can provide much more personalized and accurate
                  health advice when it has access to your health records.
                </p>
                <div className="flex space-x-2">
                  <Button asChild size="sm" className="btn-smooth">
                    <Link to="/history">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Health Records
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="btn-smooth"
                  >
                    <Link to="/test-storage">
                      <Settings className="w-4 h-4 mr-2" />
                      Test Storage
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Health Insights */}
        {healthInsights.length > 0 && (
          <div className="mb-6 space-y-3 fade-in fade-in-delay-1">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center">
              <Heart className="h-4 w-4 mr-2 text-red-500" />
              Personalized Health Insights
            </h3>
            <div className="grid gap-3">
              {healthInsights.slice(0, 2).map((insight, index) => (
                <Alert
                  key={index}
                  className={`card-hover cursor-pointer ${
                    insight.priority === "high"
                      ? "border-red-200 bg-gradient-to-r from-red-50 to-red-50/50"
                      : "border-blue-200 bg-gradient-to-r from-blue-50 to-blue-50/50"
                  } fade-in-up`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start space-x-3">
                    {insight.priority === "high" ? (
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <AlertDescription className="text-sm">
                        <div className="font-medium mb-1 text-foreground">
                          {insight.title}
                        </div>
                        <div className="text-muted-foreground">
                          {insight.description}
                        </div>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* AI Chat Interface */}
        <Card className="h-[calc(100vh-280px)] sm:h-[calc(100vh-320px)] flex flex-col shadow-colored-lg border-border/50 fade-in fade-in-delay-2">
          <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-t-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-base sm:text-lg md:text-xl flex items-center">
                <Brain className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                <span className="truncate">B-max AI Health Assistant</span>
              </CardTitle>
              <div className="flex items-center space-x-1 sm:space-x-2">
                {isLoadingContext ? (
                  <Badge variant="outline" className="text-xs">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    <span className="hidden sm:inline">Loading Context</span>
                    <span className="sm:hidden">Loading</span>
                  </Badge>
                ) : aiHealthContext?.context?.totalRecords > 0 ||
                  personalizedContext?.hasData ? (
                  <Badge
                    variant="default"
                    className="text-xs bg-gradient-to-r from-green-500 to-green-600"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">
                      {aiHealthContext?.context?.totalRecords > 0
                        ? `${aiHealthContext.context.totalRecords} Records Loaded`
                        : "Context Enabled"}
                    </span>
                    <span className="sm:hidden">
                      {aiHealthContext?.context?.totalRecords > 0
                        ? `${aiHealthContext.context.totalRecords} Records`
                        : "Enabled"}
                    </span>
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <Brain className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">General Mode</span>
                    <span className="sm:hidden">General</span>
                  </Badge>
                )}
                <div className="flex items-center space-x-1 text-xs sm:text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full status-online"></div>
                  <span className="hidden sm:inline">Live AI Agent</span>
                  <span className="sm:hidden">Live</span>
                </div>
              </div>
            </div>
            <CardDescription className="text-xs sm:text-sm leading-relaxed">
              {isLoadingContext
                ? "Loading your health records and medical context..."
                : aiHealthContext?.context?.totalRecords > 0
                  ? `AI personalized with ${aiHealthContext.context.totalRecords} health records (${aiHealthContext.context.medicalProfile.conditions.length} conditions, ${aiHealthContext.context.medicalProfile.currentMedications.length} medications). Ask about symptoms for targeted advice.`
                  : personalizedContext?.hasData
                    ? `AI personalized with your medical history (${personalizedContext.summary.totalConditions} conditions, ${personalizedContext.summary.currentMedications} medications). Ask about symptoms for targeted advice.`
                    : "AI ready for general health questions. Add health records for personalized recommendations."}
            </CardDescription>
          </CardHeader>

          {/* AI Agent Interface */}
          <CardContent className="flex-1 overflow-hidden p-0">
            {isLoadingContext ? (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted/20 to-muted/10">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <Brain className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-foreground font-medium">
                      Loading your personalized medical context...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Analyzing health history and preparing AI recommendations
                    </p>
                  </div>
                  <div className="flex justify-center space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full relative">
                <iframe
                  src={getContextualPrompt()}
                  className="w-full h-full border-0 rounded-b-lg"
                  title="B-max AI Health Assistant"
                  allow="microphone; camera"
                  style={{ minHeight: "350px" }}
                />
                {/* AI Features Overlay */}
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex space-x-1 sm:space-x-2 pointer-events-none">
                  <Badge
                    variant="secondary"
                    className="text-xs bg-white/90 backdrop-blur-sm px-2 py-1"
                  >
                    <Mic className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Voice</span>
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-white/90 backdrop-blur-sm px-2 py-1"
                  >
                    <Video className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Video</span>
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Example Queries for Personalized Context */}
        {(aiHealthContext?.context?.totalRecords > 0 ||
          personalizedContext?.hasData) && (
          <Card className="mt-4 shadow-colored border-primary/20 bg-gradient-to-r from-primary/5 to-primary/5 fade-in fade-in-delay-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Zap className="h-4 w-4 mr-2 text-primary" />
                Try asking B-max about your health:
                {aiHealthContext?.context?.totalRecords > 0 && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Based on {aiHealthContext.context.totalRecords} records
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {/* Dynamic examples based on actual health records */}
                {aiHealthContext?.context?.medicalProfile?.conditions?.some(
                  (c) => c.toLowerCase().includes("diabetes"),
                ) && (
                  <div className="p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-primary/20 hover:bg-white/80 transition-all cursor-pointer transform-smooth hover:scale-105">
                    <div className="font-medium text-primary mb-1">
                      "I'm feeling dizzy"
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Gets diabetes-specific advice from your records
                    </div>
                  </div>
                )}

                {aiHealthContext?.context?.medicalProfile?.conditions?.some(
                  (c) =>
                    c.toLowerCase().includes("hypertension") ||
                    c.toLowerCase().includes("blood pressure"),
                ) && (
                  <div className="p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-primary/20 hover:bg-white/80 transition-all cursor-pointer transform-smooth hover:scale-105">
                    <div className="font-medium text-primary mb-1">
                      "I have a headache"
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Considers your blood pressure history
                    </div>
                  </div>
                )}

                {(aiHealthContext?.context?.medicalProfile?.currentMedications
                  ?.length > 0 ||
                  personalizedContext?.currentMedications?.length > 0) && (
                  <div className="p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-primary/20 hover:bg-white/80 transition-all cursor-pointer transform-smooth hover:scale-105">
                    <div className="font-medium text-primary mb-1">
                      "Can I take [medication]?"
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Checks interactions with your current meds
                    </div>
                  </div>
                )}

                {aiHealthContext?.context?.recentActivity?.records?.length >
                  0 && (
                  <div className="p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-primary/20 hover:bg-white/80 transition-all cursor-pointer transform-smooth hover:scale-105">
                    <div className="font-medium text-primary mb-1">
                      "Explain my recent{" "}
                      {aiHealthContext.context.recentActivity.records[0]?.type}{" "}
                      record"
                    </div>
                    <div className="text-xs text-muted-foreground">
                      References your specific health records
                    </div>
                  </div>
                )}

                <div className="p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-primary/20 hover:bg-white/80 transition-all cursor-pointer transform-smooth hover:scale-105">
                  <div className="font-medium text-primary mb-1">
                    "What should I monitor based on my history?"
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Personalized recommendations from your records
                  </div>
                </div>

                {aiHealthContext?.context?.medicalProfile?.conditions?.length >
                  0 && (
                  <div className="p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-primary/20 hover:bg-white/80 transition-all cursor-pointer transform-smooth hover:scale-105">
                    <div className="font-medium text-primary mb-1">
                      "How do my conditions interact?"
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Analysis based on your documented conditions
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
