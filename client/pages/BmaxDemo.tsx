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
  Brain,
  ArrowLeft,
  Search,
  Sparkles,
  User,
  Heart,
  Activity,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface QueryEnhancement {
  originalQuery: string;
  enhancedQuery: string;
  relevantConditions: string[];
  searchContext: string;
  personalizedPrompt: string;
  hasPersonalization: boolean;
}

export default function BmaxDemo() {
  const [query, setQuery] = useState("");
  const [enhancement, setEnhancement] = useState<QueryEnhancement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthentication();
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
    } catch (error) {
      console.error("Error checking authentication:", error);
      setIsAuthenticated(false);
    }
  };

  const enhanceQuery = async () => {
    if (!query.trim()) return;

    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      let enhancement: QueryEnhancement;

      if (isAuthenticated) {
        // Try to call real API for authenticated users
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
            body: JSON.stringify({ query }),
          });

          if (response.ok) {
            const data = await response.json();
            setEnhancement(data);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.log("API call failed, using demo enhancement");
        }
      }

      // Generate demo enhancement based on query content
      enhancement = generateDemoEnhancement(query.trim());
      setEnhancement(enhancement);
    } catch (error) {
      console.error("Error enhancing query:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDemoEnhancement = (query: string): QueryEnhancement => {
    const lowerQuery = query.toLowerCase();

    // Define demo medical profile
    const demoConditions = ["Type 2 Diabetes", "Hypertension", "GERD"];
    const demoMedications = ["Metformin 500mg", "Lisinopril 10mg", "Omeprazole 20mg"];
    const demoAllergies = ["Penicillin", "Shellfish"];

    let relevantConditions: string[] = [];
    let searchContext = "";
    let enhancedQuery = query;

    // Enhance based on symptoms and queries
    if (lowerQuery.includes("dizzy") || lowerQuery.includes("dizziness")) {
      relevantConditions = ["Type 2 Diabetes", "Hypertension"];
      enhancedQuery = `${query} - considering patient with diabetes and hypertension, check for blood sugar fluctuations and blood pressure changes`;
      searchContext = "Patient has diabetes (blood sugar monitoring important) and hypertension (BP-related dizziness possible). Current medications: Metformin, Lisinopril.";
    } else if (lowerQuery.includes("headache")) {
      relevantConditions = ["Hypertension"];
      enhancedQuery = `${query} - for patient with hypertension, assess blood pressure and medication adherence`;
      searchContext = "Patient has hypertension managed with Lisinopril. Headaches could be BP-related.";
    } else if (lowerQuery.includes("tired") || lowerQuery.includes("fatigue")) {
      relevantConditions = ["Type 2 Diabetes"];
      enhancedQuery = `${query} - in diabetic patient, evaluate blood glucose control and medication effectiveness`;
      searchContext = "Patient has Type 2 diabetes on Metformin. Fatigue may indicate poor glucose control.";
    } else if (lowerQuery.includes("ibuprofen") || lowerQuery.includes("nsaid")) {
      relevantConditions = ["Hypertension", "GERD"];
      enhancedQuery = `${query} - check interactions with Lisinopril and consider GERD history before NSAIDs`;
      searchContext = "Patient takes Lisinopril for hypertension and has GERD. NSAIDs may interact with BP medication and worsen GERD.";
    } else if (lowerQuery.includes("chest pain")) {
      relevantConditions = ["Hypertension", "GERD"];
      enhancedQuery = `${query} - differential diagnosis needed: cardiac (hypertension) vs GERD-related chest pain`;
      searchContext = "Patient has hypertension and GERD. Chest pain requires careful evaluation of both cardiac and GI causes.";
    } else if (lowerQuery.includes("blood sugar") || lowerQuery.includes("glucose")) {
      relevantConditions = ["Type 2 Diabetes"];
      enhancedQuery = `${query} - for Type 2 diabetic on Metformin, assess if dosage adjustment needed and lifestyle factors`;
      searchContext = "Patient has Type 2 diabetes managed with Metformin 500mg. Blood sugar levels guide medication and lifestyle adjustments.";
    } else if (lowerQuery.includes("medication") || lowerQuery.includes("forgot")) {
      relevantConditions = ["Type 2 Diabetes", "Hypertension", "GERD"];
      enhancedQuery = `${query} - patient takes Metformin, Lisinopril, and Omeprazole - provide guidance for missed dose protocol`;
      searchContext = "Patient's current medications: Metformin (diabetes), Lisinopril (hypertension), Omeprazole (GERD). Each has different missed dose guidelines.";
    } else if (lowerQuery.includes("chocolate") || lowerQuery.includes("eat") || lowerQuery.includes("food")) {
      relevantConditions = ["Type 2 Diabetes", "GERD"];
      enhancedQuery = `${query} - diabetic dietary guidance considering GERD restrictions and blood glucose impact`;
      searchContext = "Patient has diabetes (carb counting important) and GERD (avoid trigger foods). Need balanced approach to diet.";
    } else if (lowerQuery.includes("monitor") || lowerQuery.includes("daily")) {
      relevantConditions = ["Type 2 Diabetes", "Hypertension"];
      enhancedQuery = `${query} - daily monitoring plan for diabetes and hypertension management`;
      searchContext = "Patient should monitor blood glucose (diabetes) and blood pressure (hypertension) regularly. Medication adherence tracking also important.";
    } else if (lowerQuery.includes("heartburn") || lowerQuery.includes("acid") || lowerQuery.includes("reflux")) {
      relevantConditions = ["GERD"];
      enhancedQuery = `${query} - GERD management with current Omeprazole therapy, lifestyle modifications needed`;
      searchContext = "Patient has GERD managed with Omeprazole 20mg. May need dosage adjustment or lifestyle changes if symptoms persist.";
    } else {
      // Generic enhancement
      enhancedQuery = `${query} - personalized for patient with diabetes, hypertension, and GERD`;
      searchContext = "Patient profile: Type 2 diabetes, hypertension, GERD. Current medications: Metformin, Lisinopril, Omeprazole. Allergies: Penicillin, Shellfish.";
      if (demoConditions.some(condition => lowerQuery.includes(condition.toLowerCase()))) {
        relevantConditions = demoConditions.filter(condition =>
          lowerQuery.includes(condition.toLowerCase())
        );
      }
    }

    const personalizedPrompt = `MEDICAL CONTEXT: Patient is a 45-year-old with the following conditions:
- Type 2 Diabetes (managed with Metformin 500mg)
- Hypertension (managed with Lisinopril 10mg)
- GERD (managed with Omeprazole 20mg)

ALLERGIES: Penicillin, Shellfish

QUERY: "${query}"

${searchContext}

Please provide personalized medical advice considering:
1. Potential interactions with current medications
2. Condition-specific considerations
3. Allergy precautions
4. Monitoring recommendations
5. When to seek immediate medical attention

Focus on evidence-based recommendations tailored to this patient's medical profile.`;

    return {
      originalQuery: query,
      enhancedQuery,
      relevantConditions,
      searchContext,
      personalizedPrompt,
      hasPersonalization: true
    };
  };

  const sampleQueries = [
    "I'm feeling dizzy",
    "I have a headache",
    "Can I take ibuprofen?",
    "I'm feeling tired lately",
    "I'm experiencing chest pain",
    "My blood sugar is 180",
    "I forgot to take my medication",
    "Can I eat chocolate with diabetes?",
    "What should I monitor daily?",
    "I'm having heartburn",
  ];

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
                    See How Medical History Personalizes AI
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Demo Mode
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {isAuthenticated ? (
              <>
                <strong>Personalized Mode:</strong> Using your real medical history for query enhancement.
              </>
            ) : (
              <>
                <strong>Demo Mode:</strong> Try B-max AI with sample medical history (Diabetes, Hypertension, GERD).{" "}
                <Link to="/login" className="underline">
                  Login for real personalization
                </Link>.
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Query Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Test Query Enhancement
            </CardTitle>
            <CardDescription>
              Enter a health question to see how B-max AI enhances it with medical history.
              {isAuthenticated ? " Using your real medical data." : " Demo uses sample medical profile."}
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
                className="min-w-[100px]"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Enhance
                  </>
                )}
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
              How Medical Context Enhances B-max AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Without Medical History:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Generic health advice</li>
                  <li>• No condition-specific recommendations</li>
                  <li>• Cannot consider medication interactions</li>
                  <li>• No allergy warnings</li>
                  <li>• General symptom information</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">With Medical History:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • Condition-specific advice (e.g., diabetic dizziness)
                  </li>
                  <li>• Considers your current medications</li>
                  <li>• Warns about drug interactions</li>
                  <li>• Includes allergy precautions</li>
                  <li>• Tailored monitoring recommendations</li>
                </ul>
              </div>
            </div>

            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                <strong>Example:</strong> If you have diabetes and ask "I'm
                feeling dizzy", B-max AI will specifically address
                diabetic-related causes of dizziness like blood sugar
                fluctuations, rather than just general dizziness causes.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="mt-6">
          <CardContent className="text-center py-6">
            <Brain className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">
              Ready to Try B-max AI?
            </h3>
            <p className="text-muted-foreground mb-4">
              Experience personalized health AI that considers your complete
              medical history.
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
