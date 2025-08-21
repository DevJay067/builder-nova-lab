import { useState, useEffect } from "react";

// Suppress Recharts defaultProps warnings in development
const originalConsoleWarn = console.warn;
if (typeof console !== "undefined" && !console.warn._rechartsPatched) {
  console.warn = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes(
        "Support for defaultProps will be removed from function components",
      ) &&
      (args[0].includes("XAxis") ||
        args[0].includes("YAxis") ||
        args[0].includes("Recharts"))
    ) {
      return; // Suppress these specific warnings
    }
    originalConsoleWarn.apply(console, args);
  };
  console.warn._rechartsPatched = true;
}
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Brain,
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  Heart,
  Activity,
  Thermometer,
  Droplets,
  Target,
  Zap,
  BarChart3,
  Calendar,
  Clock,
  Info,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
} from "recharts";

interface RiskFactor {
  id: string;
  name: string;
  category: "lifestyle" | "genetic" | "environmental" | "medical";
  impact: "low" | "medium" | "high" | "critical";
  value: number;
  trend: "improving" | "stable" | "worsening";
  description: string;
  recommendations: string[];
}

interface HealthRisk {
  condition: string;
  probability: number;
  severity: "low" | "medium" | "high" | "critical";
  timeframe: "1 month" | "6 months" | "1 year" | "5 years";
  confidence: number;
  primaryFactors: string[];
  prevention: string[];
  icon: any;
  color: string;
}

interface MLPrediction {
  timestamp: string;
  overallRiskScore: number;
  category: string;
  prediction: string;
  confidence: number;
  factors: string[];
}

export default function HealthRiskPrediction() {
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([
    {
      id: "blood_pressure",
      name: "Blood Pressure",
      category: "medical",
      impact: "high",
      value: 78,
      trend: "stable",
      description: "Current BP readings within normal range",
      recommendations: [
        "Continue regular monitoring",
        "Maintain low-sodium diet",
        "Regular exercise",
      ],
    },
    {
      id: "cholesterol",
      name: "Cholesterol Levels",
      category: "medical",
      impact: "medium",
      value: 65,
      trend: "improving",
      description: "LDL levels slightly elevated but improving",
      recommendations: [
        "Increase fiber intake",
        "Consider statin therapy",
        "Regular lipid panel checks",
      ],
    },
    {
      id: "exercise",
      name: "Physical Activity",
      category: "lifestyle",
      impact: "high",
      value: 85,
      trend: "improving",
      description: "Excellent activity levels based on wearable data",
      recommendations: [
        "Maintain current routine",
        "Add strength training",
        "Track heart rate zones",
      ],
    },
    {
      id: "sleep",
      name: "Sleep Quality",
      category: "lifestyle",
      impact: "medium",
      value: 72,
      trend: "stable",
      description: "Good sleep duration, some quality issues",
      recommendations: [
        "Consistent sleep schedule",
        "Limit screen time before bed",
        "Optimize sleep environment",
      ],
    },
    {
      id: "stress",
      name: "Stress Level",
      category: "lifestyle",
      impact: "high",
      value: 45,
      trend: "worsening",
      description: "Elevated stress based on HRV analysis",
      recommendations: [
        "Practice meditation",
        "Consider stress management therapy",
        "Regular relaxation techniques",
      ],
    },
    {
      id: "family_history",
      name: "Genetic Risk Factors",
      category: "genetic",
      impact: "medium",
      value: 60,
      trend: "stable",
      description: "Family history of cardiovascular disease",
      recommendations: [
        "Enhanced screening",
        "Genetic counseling",
        "Proactive lifestyle modifications",
      ],
    },
  ]);

  const [healthRisks, setHealthRisks] = useState<HealthRisk[]>([
    {
      condition: "Cardiovascular Disease",
      probability: 15,
      severity: "medium",
      timeframe: "5 years",
      confidence: 87,
      primaryFactors: ["Family History", "Stress Level", "Blood Pressure"],
      prevention: [
        "Regular cardio exercise",
        "Mediterranean diet",
        "Stress management",
      ],
      icon: Heart,
      color: "#ef4444",
    },
    {
      condition: "Type 2 Diabetes",
      probability: 8,
      severity: "low",
      timeframe: "5 years",
      confidence: 82,
      primaryFactors: ["BMI", "Family History", "Physical Activity"],
      prevention: [
        "Weight management",
        "Regular glucose monitoring",
        "Balanced nutrition",
      ],
      icon: Activity,
      color: "#f59e0b",
    },
    {
      condition: "Hypertension",
      probability: 25,
      severity: "medium",
      timeframe: "1 year",
      confidence: 91,
      primaryFactors: ["Current BP readings", "Stress", "Sodium intake"],
      prevention: [
        "DASH diet",
        "Regular BP monitoring",
        "Medication compliance",
      ],
      icon: TrendingUp,
      color: "#3b82f6",
    },
    {
      condition: "Mental Health Issues",
      probability: 35,
      severity: "high",
      timeframe: "6 months",
      confidence: 76,
      primaryFactors: ["Stress Level", "Sleep Quality", "Social Support"],
      prevention: [
        "Therapy sessions",
        "Social connections",
        "Mindfulness practice",
      ],
      icon: Brain,
      color: "#8b5cf6",
    },
  ]);

  const [mlPredictions, setMlPredictions] = useState<MLPrediction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<string>("");

  // Simulate AI/ML analysis
  useEffect(() => {
    generateMLPredictions();
    setLastAnalysis(new Date().toLocaleString());
  }, []);

  const generateMLPredictions = () => {
    const predictions: MLPrediction[] = [];
    const timeframes = [
      "Current",
      "1 Week",
      "1 Month",
      "3 Months",
      "6 Months",
      "1 Year",
    ];

    timeframes.forEach((timeframe, index) => {
      const baseRisk = 15 + index * 5 + Math.random() * 10;
      predictions.push({
        timestamp: timeframe,
        overallRiskScore: Math.min(baseRisk, 100),
        category:
          baseRisk < 20
            ? "Low Risk"
            : baseRisk < 50
              ? "Moderate Risk"
              : "High Risk",
        prediction: generatePredictionText(baseRisk),
        confidence: 75 + Math.random() * 20,
        factors: ["Cardiovascular", "Metabolic", "Mental Health"].slice(
          0,
          Math.floor(Math.random() * 3) + 1,
        ),
      });
    });

    setMlPredictions(predictions);
  };

  const generatePredictionText = (risk: number): string => {
    if (risk < 20) return "Excellent health trajectory with low risk factors";
    if (risk < 35) return "Good health with minor areas for improvement";
    if (risk < 50) return "Moderate risk requiring lifestyle adjustments";
    if (risk < 70) return "Elevated risk needing medical intervention";
    return "High risk requiring immediate medical attention";
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Update risk factors with slight variations
    setRiskFactors((prev) =>
      prev.map((factor) => ({
        ...factor,
        value: Math.max(
          0,
          Math.min(100, factor.value + (Math.random() - 0.5) * 10),
        ),
      })),
    );

    // Update health risks
    setHealthRisks((prev) =>
      prev.map((risk) => ({
        ...risk,
        probability: Math.max(
          0,
          Math.min(100, risk.probability + (Math.random() - 0.5) * 5),
        ),
        confidence: Math.max(
          70,
          Math.min(95, risk.confidence + (Math.random() - 0.5) * 10),
        ),
      })),
    );

    generateMLPredictions();
    setLastAnalysis(new Date().toLocaleString());
    setIsAnalyzing(false);
  };

  const getRiskColor = (probability: number) => {
    if (probability < 15) return "text-green-600";
    if (probability < 30) return "text-yellow-600";
    if (probability < 50) return "text-orange-600";
    return "text-red-600";
  };

  const getRiskBadgeVariant = (severity: string) => {
    switch (severity) {
      case "low":
        return "default";
      case "medium":
        return "secondary";
      case "high":
        return "destructive";
      case "critical":
        return "destructive";
      default:
        return "default";
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case "low":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "medium":
        return <Info className="w-4 h-4 text-yellow-600" />;
      case "high":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "critical":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "worsening":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case "stable":
        return <Activity className="w-4 h-4 text-blue-600" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const overallRiskScore = Math.round(
    riskFactors.reduce((acc, factor) => {
      const weight =
        factor.impact === "critical"
          ? 0.3
          : factor.impact === "high"
            ? 0.25
            : factor.impact === "medium"
              ? 0.15
              : 0.1;
      return acc + (100 - factor.value) * weight;
    }, 0),
  );

  const radarData = riskFactors.map((factor) => ({
    factor: factor.name,
    value: factor.value,
    fullMark: 100,
  }));

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="shadow-colored-lg border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  AI Health Risk Prediction
                </CardTitle>
                <CardDescription>
                  Advanced machine learning analysis of your health trajectory
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                ML Powered
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={runAIAnalysis}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Run Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Risk Score */}
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
              <div className="text-4xl font-bold mb-2">
                <span className={getRiskColor(overallRiskScore)}>
                  {overallRiskScore}
                </span>
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
              <div className="text-sm font-medium text-gray-600 mb-2">
                Overall Risk Score
              </div>
              <Progress value={100 - overallRiskScore} className="mb-2" />
              <div className="text-xs text-muted-foreground">
                Lower scores indicate better health outlook
              </div>
            </div>

            {/* Last Analysis */}
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
              <Clock className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-sm font-medium text-gray-600 mb-1">
                Last Analysis
              </div>
              <div className="text-sm text-gray-800">{lastAnalysis}</div>
              <div className="text-xs text-muted-foreground mt-2">
                Analysis updates every 24 hours
              </div>
            </div>

            {/* AI Confidence */}
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
              <Target className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600 mb-1">94%</div>
              <div className="text-sm font-medium text-gray-600 mb-1">
                AI Confidence
              </div>
              <div className="text-xs text-muted-foreground">
                Based on 50,000+ health profiles
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Factors Radar Chart */}
        <Card className="shadow-colored border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Risk Factors Analysis
            </CardTitle>
            <CardDescription>
              Current health risk factors across different categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="factor" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                  />
                  <Radar
                    name="Risk Level"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ML Prediction Timeline */}
        <Card className="shadow-colored border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Risk Prediction Timeline
            </CardTitle>
            <CardDescription>
              AI-predicted health risk progression over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mlPredictions}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 11 }}
                    axisLine={true}
                    tickLine={true}
                    height={50}
                    type="category"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    axisLine={true}
                    tickLine={true}
                    width={70}
                    type="number"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value, name) => [`${value}%`, "Risk Score"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="overallRiskScore"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Risk Factors */}
      <Card className="shadow-colored border-border/50">
        <CardHeader>
          <CardTitle>Detailed Risk Factor Analysis</CardTitle>
          <CardDescription>
            Individual analysis of factors contributing to your health risk
            profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riskFactors.map((factor) => (
              <div
                key={factor.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getImpactIcon(factor.impact)}
                    <div>
                      <h4 className="font-medium">{factor.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {factor.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getTrendIcon(factor.trend)}
                    <Badge
                      variant={getRiskBadgeVariant(factor.impact)}
                      className="text-xs"
                    >
                      {factor.impact}
                    </Badge>
                    <div className="text-right">
                      <div className="font-bold text-lg">{factor.value}%</div>
                      <div className="text-xs text-muted-foreground">
                        Health Score
                      </div>
                    </div>
                  </div>
                </div>
                <Progress value={factor.value} className="mb-3" />
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-700">
                    Recommendations:
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {factor.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-3 h-3 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Risk Predictions */}
      <Card className="shadow-colored border-border/50">
        <CardHeader>
          <CardTitle>AI Health Risk Predictions</CardTitle>
          <CardDescription>
            Machine learning predictions for potential health conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthRisks.map((risk, index) => {
              const IconComponent = risk.icon;
              return (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="p-2 rounded-lg text-white"
                        style={{ backgroundColor: risk.color }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{risk.condition}</h4>
                        <p className="text-sm text-muted-foreground">
                          {risk.timeframe} prediction
                        </p>
                      </div>
                    </div>
                    <Badge variant={getRiskBadgeVariant(risk.severity)}>
                      {risk.severity}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Risk Probability</span>
                        <span className={getRiskColor(risk.probability)}>
                          {risk.probability}%
                        </span>
                      </div>
                      <Progress value={risk.probability} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>AI Confidence</span>
                        <span className="text-blue-600">
                          {risk.confidence}%
                        </span>
                      </div>
                      <Progress value={risk.confidence} className="h-2" />
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        Primary Risk Factors:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {risk.primaryFactors.map((factor, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        Prevention Strategies:
                      </div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {risk.prevention.slice(0, 2).map((strategy, idx) => (
                          <li key={idx} className="flex items-start">
                            <Shield className="w-3 h-3 mr-1 mt-0.5 text-green-600 flex-shrink-0" />
                            {strategy}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights & Recommendations */}
      <Card className="shadow-colored border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2 text-purple-600" />
            AI Health Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Key Insight:</strong> Your stress levels show an
                increasing trend that correlates with elevated cardiovascular
                risk. Consider implementing stress reduction techniques and
                monitor heart rate variability.
              </AlertDescription>
            </Alert>

            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Positive Trend:</strong> Your physical activity levels
                are excellent and significantly reducing your risk for metabolic
                conditions. Continue current exercise routine for optimal health
                benefits.
              </AlertDescription>
            </Alert>

            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Action Required:</strong> Sleep quality metrics suggest
                room for improvement. Poor sleep is linked to increased
                inflammation and cardiovascular risk. Consider sleep hygiene
                optimization and possibly sleep study evaluation.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
