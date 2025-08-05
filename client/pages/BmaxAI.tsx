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
} from "lucide-react";
import VoiceAssistant from "@/components/VoiceAssistant";

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
  const [personalizedContext, setPersonalizedContext] =
    useState<PersonalizedContext | null>(null);
  const [healthInsights, setHealthInsights] = useState<HealthInsight[]>([]);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showMedicalSummary, setShowMedicalSummary] = useState(false);
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
      // First try to get data from the medical context API
      const contextResponse = await fetch("/api/medical-context/personalized", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
      });

      let contextData = null;
      if (contextResponse.ok) {
        contextData = await contextResponse.json();
      }

      // Also get real health records from cloud/local storage for more comprehensive personalization
      const healthRecordsResponse = await fetch("/api/cloud/records", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
      });

      let healthRecords = [];
      if (healthRecordsResponse.ok) {
        const healthData = await healthRecordsResponse.json();
        if (healthData.success && healthData.records) {
          healthRecords = healthData.records;
        }
      } else {
        // Fallback to local health records if cloud is not available
        const localResponse = await fetch("/api/auth/data-access/records", {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "x-session-token": sessionToken,
          },
        });

        if (localResponse.ok) {
          const localData = await localResponse.json();
          if (localData.success && localData.records) {
            healthRecords = localData.records;
          }
        }
      }

      // Enhance personalized context with real health records
      const enhancedContext = await createEnhancedPersonalizedContext(contextData, healthRecords);
      setPersonalizedContext(enhancedContext);

    } catch (error) {
      console.error("Error loading personalized context:", error);
    }
  };

  const createEnhancedPersonalizedContext = async (contextData: any, healthRecords: any[]): Promise<PersonalizedContext> => {
    // Extract medical information from health records
    const extractedConditions: MedicalCondition[] = [];
    const extractedMedications: string[] = [];
    const extractedSymptoms: string[] = [];
    const recentRecords: string[] = [];

    // Analyze health records to extract medical data
    healthRecords.forEach(record => {
      if (record.recordType) {
        // Extract diagnoses from descriptions
        const description = record.description?.toLowerCase() || '';
        const title = record.title?.toLowerCase() || '';

        // Common medical conditions detection
        const conditions = [
          { name: 'Diabetes', keywords: ['diabetes', 'diabetic', 'blood sugar', 'glucose'] },
          { name: 'Hypertension', keywords: ['hypertension', 'high blood pressure', 'bp'] },
          { name: 'Asthma', keywords: ['asthma', 'inhaler', 'breathing difficulty'] },
          { name: 'Heart Disease', keywords: ['heart disease', 'cardiac', 'chest pain'] },
          { name: 'Arthritis', keywords: ['arthritis', 'joint pain', 'rheumatic'] },
          { name: 'Depression', keywords: ['depression', 'anxiety', 'mental health'] },
          { name: 'Allergies', keywords: ['allergy', 'allergic reaction', 'allergen'] }
        ];

        conditions.forEach(condition => {
          if (condition.keywords.some(keyword =>
            description.includes(keyword) || title.includes(keyword)
          )) {
            if (!extractedConditions.find(c => c.name === condition.name)) {
              extractedConditions.push({
                name: condition.name,
                type: ['diabetes', 'hypertension', 'heart disease'].includes(condition.name.toLowerCase()) ? 'chronic' : 'condition',
                severity: 'moderate',
                lastUpdated: record.date || record.createdAt
              });
            }
          }
        });

        // Extract medications
        const medications = [
          'metformin', 'insulin', 'lisinopril', 'amlodipine', 'atorvastatin',
          'metoprolol', 'omeprazole', 'aspirin', 'ibuprofen', 'acetaminophen'
        ];

        medications.forEach(med => {
          if ((description.includes(med) || title.includes(med)) &&
              !extractedMedications.includes(med)) {
            extractedMedications.push(med);
          }
        });

        // Extract recent symptoms and issues
        const symptoms = [
          'headache', 'dizziness', 'fatigue', 'chest pain', 'shortness of breath',
          'nausea', 'fever', 'cough', 'abdominal pain', 'back pain'
        ];

        symptoms.forEach(symptom => {
          if ((description.includes(symptom) || title.includes(symptom)) &&
              !extractedSymptoms.includes(symptom)) {
            extractedSymptoms.push(symptom);
          }
        });

        // Add recent record titles for context
        const recordDate = new Date(record.date || record.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (recordDate > thirtyDaysAgo) {
          recentRecords.push(record.title);
        }
      }
    });

    // Create enhanced context
    const enhancedContext: PersonalizedContext = {
      success: true,
      hasData: healthRecords.length > 0 || extractedConditions.length > 0,
      patientId: "enhanced_user_profile",
      context: `Enhanced medical context from ${healthRecords.length} health records`,
      summary: {
        totalConditions: extractedConditions.length,
        chronicConditions: extractedConditions.filter(c => c.type === 'chronic').length,
        currentMedications: extractedMedications.length,
        knownAllergies: extractedConditions.filter(c => c.name === 'Allergies').length,
        recentSymptoms: extractedSymptoms.length,
        lastUpdate: healthRecords.length > 0 ?
          Math.max(...healthRecords.map(r => new Date(r.date || r.createdAt).getTime())).toString() :
          new Date().toISOString()
      },
      medicalConditions: extractedConditions,
      currentMedications: extractedMedications,
      allergies: extractedConditions.filter(c => c.name === 'Allergies').map(c => c.name),
      recentSymptoms: extractedSymptoms,
      searchEnhancers: [
        ...extractedConditions.map(c => c.name),
        ...extractedMedications,
        ...extractedSymptoms
      ],
      aiInstructions: {
        personalizationEnabled: true,
        considerConditions: extractedConditions.map(c => c.name),
        medicationInteractions: extractedMedications,
        allergyWarnings: extractedConditions.filter(c => c.name === 'Allergies').map(c => c.name),
        contextualPrompt: createContextualPromptFromRecords(extractedConditions, extractedMedications, extractedSymptoms, recentRecords)
      }
    };

    // Merge with existing context data if available
    if (contextData?.hasData) {
      enhancedContext.medicalConditions = [
        ...enhancedContext.medicalConditions,
        ...(contextData.medicalConditions || [])
      ];
      enhancedContext.currentMedications = [
        ...new Set([...enhancedContext.currentMedications, ...(contextData.currentMedications || [])])
      ];
      enhancedContext.allergies = [
        ...new Set([...enhancedContext.allergies, ...(contextData.allergies || [])])
      ];
    }

    return enhancedContext;
  };

  const createContextualPromptFromRecords = (
    conditions: MedicalCondition[],
    medications: string[],
    symptoms: string[],
    recentRecords: string[]
  ): string => {
    const conditionsText = conditions.map(c => c.name).join(", ");
    const medicationsText = medications.join(", ");
    const symptomsText = symptoms.join(", ");
    const recentText = recentRecords.slice(0, 5).join(", ");

    return `COMPREHENSIVE PATIENT MEDICAL PROFILE:

CURRENT CONDITIONS: ${conditionsText || "None documented"}
CURRENT MEDICATIONS: ${medicationsText || "None documented"}
RECENT SYMPTOMS: ${symptomsText || "None documented"}
RECENT MEDICAL VISITS: ${recentText || "None recent"}

PERSONALIZATION INSTRUCTIONS:
- Always reference the patient's specific conditions when providing advice
- Consider medication interactions with current prescriptions: ${medicationsText}
- Be specific about how recommendations relate to their documented conditions
- Reference their recent medical history when relevant
- Provide condition-specific monitoring and care recommendations
- Alert about symptoms that may indicate complications of their existing conditions

EXAMPLES OF PERSONALIZED RESPONSES:
- If patient asks about dizziness and has diabetes: Address diabetic-related causes (blood sugar, neuropathy, medication side effects)
- If patient has hypertension and asks about headaches: Consider blood pressure spikes, medication timing
- If patient takes multiple medications: Always check for interactions with any new recommendations

Provide targeted, condition-specific advice rather than general health information.`;
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
    if (!personalizedContext?.hasData) return null;

    return (
      <Card className="mb-6 card-hover border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50 fade-in">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center">
              <User className="h-4 w-4 mr-2 text-primary" />
              Your Medical Profile
              <Badge
                variant="secondary"
                className="ml-2 bg-primary/10 text-primary border-primary/20"
              >
                <Star className="h-3 w-3 mr-1" />
                Personalized
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMedicalSummary(!showMedicalSummary)}
              className="btn-smooth text-primary hover:bg-primary/10"
            >
              {showMedicalSummary ? "Hide" : "Show"} Details
            </Button>
          </div>
        </CardHeader>
        {showMedicalSummary && (
          <CardContent className="pt-0 space-y-4 fade-in-up">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">
                  Conditions:
                </span>
                <div className="text-foreground font-semibold">
                  {personalizedContext.summary.totalConditions}
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">
                  Medications:
                </span>
                <div className="text-foreground font-semibold">
                  {personalizedContext.summary.currentMedications}
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">
                  Allergies:
                </span>
                <div className="text-foreground font-semibold">
                  {personalizedContext.summary.knownAllergies}
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">
                  Recent Symptoms:
                </span>
                <div className="text-foreground font-semibold">
                  {personalizedContext.summary.recentSymptoms}
                </div>
              </div>
            </div>

            {personalizedContext.medicalConditions.length > 0 && (
              <div className="fade-in-up fade-in-delay-1">
                <span className="font-medium text-muted-foreground text-sm">
                  Key Conditions:
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {personalizedContext.medicalConditions
                    .slice(0, 5)
                    .map((condition, index) => (
                      <Badge
                        key={index}
                        variant={
                          condition.type === "chronic"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs transform-smooth hover:scale-105"
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

    // Use the enhanced contextual prompt if available
    const contextPrompt = personalizedContext.aiInstructions?.contextualPrompt ||
      createBasicContextPrompt();

    return `https://agent.jotform.com/0198328d092a7ce998d0bac908260635265d?embedMode=iframe&background=1&shadow=1&context=${encodeURIComponent(contextPrompt)}`;
  };

  const createBasicContextPrompt = () => {
    if (!personalizedContext) return "";

    const medicalConditionsText = personalizedContext.medicalConditions
      .map((condition) => condition.name)
      .join(", ");

    const medicationsText = personalizedContext.currentMedications.join(", ");
    const allergiesText = personalizedContext.allergies.join(", ");
    const symptomsText = personalizedContext.recentSymptoms?.join(", ") || "";

    return `PERSONALIZED MEDICAL CONTEXT FROM HEALTH RECORDS:
Medical Conditions: ${medicalConditionsText || "None reported"}
Current Medications: ${medicationsText || "None reported"}
Known Allergies: ${allergiesText || "None reported"}
Recent Symptoms: ${symptomsText || "None reported"}

PERSONALIZATION INSTRUCTIONS:
- This patient has ${personalizedContext.summary.totalConditions} documented medical conditions
- They are currently taking ${personalizedContext.summary.currentMedications} medications
- Always consider their specific medical history when providing advice
- Be specific about how recommendations relate to their documented conditions
- Warn about potential medication interactions with: ${medicationsText}
- Consider allergy precautions for: ${allergiesText}
- Reference their recent symptoms when relevant: ${symptomsText}

IMPORTANT: When the patient mentions symptoms, immediately consider their documented medical history and provide targeted, personalized advice rather than general health information.`;
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
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 transform-smooth hover:scale-110">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">
                    B-max AI Assistant
                  </h1>
                  <p className="text-sm text-slate-600 font-medium">
                    Personalized Health AI
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 fade-in fade-in-delay-1">
              {personalizedContext?.hasData && (
                <Badge
                  variant="default"
                  className="text-xs bg-gradient-to-r from-primary to-primary/80 border-primary/20"
                >
                  <Activity className="h-3 w-3 mr-1" />
                  Personalized
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
                {aiStatus === "active"
                  ? "AI Ready"
                  : aiStatus === "ready"
                    ? "Connecting"
                    : "Starting"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="btn-smooth hover:bg-muted"
              >
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
        <Card className="h-[calc(100vh-320px)] flex flex-col shadow-colored-lg border-border/50 fade-in fade-in-delay-2">
          <CardHeader className="pb-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-t-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-lg sm:text-xl flex items-center">
                <Brain className="h-5 w-5 mr-2 text-primary" />
                B-max AI Health Assistant
              </CardTitle>
              <div className="flex items-center space-x-2">
                {isLoadingContext ? (
                  <Badge variant="outline" className="text-xs">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Loading Context
                  </Badge>
                ) : personalizedContext?.hasData ? (
                  <Badge
                    variant="default"
                    className="text-xs bg-gradient-to-r from-green-500 to-green-600"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Context Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <Brain className="h-3 w-3 mr-1" />
                    General Mode
                  </Badge>
                )}
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full status-online"></div>
                  <span className="hidden sm:inline">Live AI Agent</span>
                </div>
              </div>
            </div>
            <CardDescription className="text-sm leading-relaxed">
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
                  style={{ minHeight: "400px" }}
                />
                {/* AI Features Overlay */}
                <div className="absolute top-4 right-4 flex space-x-2 pointer-events-none">
                  <Badge
                    variant="secondary"
                    className="text-xs bg-white/90 backdrop-blur-sm"
                  >
                    <Mic className="w-3 h-3 mr-1" />
                    Voice
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-white/90 backdrop-blur-sm"
                  >
                    <Video className="w-3 h-3 mr-1" />
                    Video
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Example Queries for Personalized Context */}
        {personalizedContext?.hasData && (
          <Card className="mt-4 shadow-colored border-primary/20 bg-gradient-to-r from-primary/5 to-primary/5 fade-in fade-in-delay-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Zap className="h-4 w-4 mr-2 text-primary" />
                Try asking B-max about:
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {personalizedContext.medicalConditions.some((c) =>
                  c.name.toLowerCase().includes("diabetes"),
                ) && (
                  <div className="p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-primary/20 hover:bg-white/80 transition-all cursor-pointer transform-smooth hover:scale-105">
                    <div className="font-medium text-primary mb-1">
                      "I'm feeling dizzy"
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Gets diabetes-specific advice
                    </div>
                  </div>
                )}
                {personalizedContext.medicalConditions.some((c) =>
                  c.name.toLowerCase().includes("hypertension"),
                ) && (
                  <div className="p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-primary/20 hover:bg-white/80 transition-all cursor-pointer transform-smooth hover:scale-105">
                    <div className="font-medium text-primary mb-1">
                      "I have a headache"
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Considers blood pressure
                    </div>
                  </div>
                )}
                {personalizedContext.currentMedications.length > 0 && (
                  <div className="p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-primary/20 hover:bg-white/80 transition-all cursor-pointer transform-smooth hover:scale-105">
                    <div className="font-medium text-primary mb-1">
                      "Can I take [medication]?"
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Checks interactions
                    </div>
                  </div>
                )}
                <div className="p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-primary/20 hover:bg-white/80 transition-all cursor-pointer transform-smooth hover:scale-105">
                  <div className="font-medium text-primary mb-1">
                    "What should I monitor?"
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Personalized recommendations
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
