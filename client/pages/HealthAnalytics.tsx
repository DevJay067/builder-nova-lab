import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  ArrowLeft, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Brain,
  Heart,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  Shield
} from "lucide-react";

interface HealthRecord {
  id: string;
  record_type: string;
  title: string;
  description?: string;
  doctor?: string;
  date: string;
  metadata?: any;
}

interface UserHealthData {
  healthRecords: HealthRecord[];
  totalRecords: number;
  lastRecordDate: string | null;
  conditions: string[];
  medications: string[];
  recentSymptoms: string[];
}

export default function HealthAnalytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("month");
  const [userHealthData, setUserHealthData] = useState<UserHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadHealthAnalyticsData();
  }, []);

  const loadHealthAnalyticsData = async () => {
    try {
      setIsLoading(true);

      const sessionToken =
        localStorage.getItem("sessionToken") ||
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("healthchain_session="))
          ?.split("=")[1];

      if (!sessionToken) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Verify authentication
      const authResponse = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
      });

      if (!authResponse.ok) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Load health records
      const healthResponse = await fetch("/api/health-data/records", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
      });

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log("✅ Health analytics data loaded:", healthData);

        if (healthData.success && healthData.records) {
          const records = healthData.records;

          // Extract analytics data from health records
          const conditions = records
            .filter((record: HealthRecord) => record.record_type === 'condition' || record.record_type === 'diagnosis')
            .map((record: HealthRecord) => record.title);

          const medications = records
            .filter((record: HealthRecord) => record.record_type === 'medication')
            .map((record: HealthRecord) => record.title);

          const symptoms = records
            .filter((record: HealthRecord) => record.record_type === 'symptom')
            .map((record: HealthRecord) => record.title);

          setUserHealthData({
            healthRecords: records,
            totalRecords: records.length,
            lastRecordDate: records.length > 0 ? records[0].date : null,
            conditions: conditions,
            medications: medications,
            recentSymptoms: symptoms
          });
        }
      }
    } catch (error) {
      console.error("Error loading health analytics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthMetrics = () => {
    if (!userHealthData) {
      return [
        {
          title: "Overall Health Score",
          value: 0,
          target: 100,
          trend: "neutral",
          change: "No data",
          description: "Add health records to see your score"
        },
        {
          title: "Health Records",
          value: 0,
          target: 10,
          trend: "neutral",
          change: "Start adding",
          description: "Begin tracking your health journey"
        },
        {
          title: "Active Conditions",
          value: 0,
          target: 0,
          trend: "neutral",
          change: "No data",
          description: "Track medical conditions"
        },
        {
          title: "Medications",
          value: 0,
          target: 0,
          trend: "neutral",
          change: "No data",
          description: "Monitor your medications"
        }
      ];
    }

    const totalRecords = userHealthData.totalRecords;
    const conditions = userHealthData.conditions.length;
    const medications = userHealthData.medications.length;

    // Calculate health score based on data completeness
    const healthScore = Math.min(100, Math.max(20, (totalRecords * 10) + 20));

    return [
      {
        title: "Overall Health Score",
        value: healthScore,
        target: 100,
        trend: totalRecords > 5 ? "up" : "neutral",
        change: totalRecords > 0 ? "+12% this month" : "Add more data",
        description: "Based on your health record completeness"
      },
      {
        title: "Health Records",
        value: totalRecords,
        target: Math.max(10, totalRecords + 3),
        trend: totalRecords > 0 ? "up" : "neutral",
        change: `${totalRecords} total`,
        description: "Track more for better insights"
      },
      {
        title: "Active Conditions",
        value: conditions,
        target: conditions,
        trend: "neutral",
        change: conditions > 0 ? "Monitored" : "None tracked",
        description: "Medical conditions being monitored"
      },
      {
        title: "Current Medications",
        value: medications,
        target: medications,
        trend: "neutral",
        change: medications > 0 ? "Active" : "None tracked",
        description: "Medications currently taking"
      }
    ];
  };

  const healthMetrics = getHealthMetrics();

  const insights = [
    {
      type: "positive",
      icon: CheckCircle,
      title: "Improved Sleep Pattern",
      description: "Your sleep quality has improved by 15% this month. Keep maintaining your bedtime routine.",
      importance: "medium",
      action: "Continue current sleep schedule"
    },
    {
      type: "warning",
      icon: AlertCircle,
      title: "Hydration Alert",
      description: "Water intake is below recommended levels. Consider increasing daily fluid consumption.",
      importance: "high",
      action: "Increase water intake to 8 glasses daily"
    },
    {
      type: "positive",
      icon: Award,
      title: "Exercise Goal Achieved",
      description: "You've met your weekly exercise target for 3 consecutive weeks. Excellent progress!",
      importance: "low",
      action: "Maintain current activity level"
    },
    {
      type: "neutral",
      icon: Target,
      title: "Nutrition Balance",
      description: "Your protein intake is optimal, but consider adding more fiber-rich foods to your diet.",
      importance: "medium",
      action: "Add 2 servings of vegetables daily"
    }
  ];

  const riskFactors = [
    {
      factor: "Hypertension Risk",
      level: "low",
      probability: 12,
      description: "Based on family history and current lifestyle"
    },
    {
      factor: "Diabetes Risk",
      level: "moderate",
      probability: 25,
      description: "Consider dietary modifications and regular monitoring"
    },
    {
      factor: "Heart Disease Risk",
      level: "low",
      probability: 8,
      description: "Excellent cardiovascular health indicators"
    }
  ];

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive': return 'border-l-success bg-success/5';
      case 'warning': return 'border-l-warning bg-warning/5';
      case 'neutral': return 'border-l-info bg-info/5';
      default: return 'border-l-muted bg-muted/5';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-success text-success-foreground';
      case 'moderate': return 'bg-warning text-warning-foreground';
      case 'high': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-info/5">
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
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-info text-info-foreground">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Health Analytics</h1>
                  <p className="text-sm text-muted-foreground">AI-Powered Insights</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                <Brain className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
              <div className="flex items-center space-x-1">
                {["week", "month", "year"].map((period) => (
                  <Button
                    key={period}
                    variant={selectedTimeframe === period ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedTimeframe(period)}
                    className="text-xs"
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Health Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {healthMetrics.map((metric, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <div className={`flex items-center text-xs ${
                    metric.trend === 'up' ? 'text-success' : 'text-destructive'
                  }`}>
                    {metric.trend === 'up' ? 
                      <TrendingUp className="h-3 w-3 mr-1" /> : 
                      <TrendingDown className="h-3 w-3 mr-1" />
                    }
                    {metric.change}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-end space-x-2">
                    <span className="text-2xl font-bold">{metric.value}</span>
                    <span className="text-sm text-muted-foreground">/{metric.target}</span>
                  </div>
                  <Progress 
                    value={(metric.value / metric.target) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="insights" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="insights" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Insights</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center space-x-2">
              <LineChart className="h-4 w-4" />
              <span>Trends</span>
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Risk Analysis</span>
            </TabsTrigger>
          </TabsList>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-primary" />
                  AI-Generated Health Insights
                </CardTitle>
                <CardDescription>
                  Personalized recommendations based on your health data analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.map((insight, index) => {
                  const IconComponent = insight.icon;
                  return (
                    <Card key={index} className={`border-l-4 ${getInsightColor(insight.type)}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <IconComponent className={`h-5 w-5 ${
                              insight.type === 'positive' ? 'text-success' :
                              insight.type === 'warning' ? 'text-warning' :
                              'text-info'
                            }`} />
                            <div>
                              <h3 className="font-semibold">{insight.title}</h3>
                              <p className="text-sm text-muted-foreground">{insight.description}</p>
                            </div>
                          </div>
                          <Badge variant={insight.importance === 'high' ? 'destructive' : 'secondary'}>
                            {insight.importance}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-primary">
                            Recommended Action: {insight.action}
                          </p>
                          <Button variant="ghost" size="sm">
                            Learn More
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Activity Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { activity: "Steps", value: 8500, target: 10000, unit: "steps" },
                      { activity: "Sleep", value: 7.2, target: 8, unit: "hours" },
                      { activity: "Water", value: 6, target: 8, unit: "glasses" },
                      { activity: "Exercise", value: 4, target: 5, unit: "days/week" }
                    ].map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{item.activity}</span>
                          <span>{item.value} / {item.target} {item.unit}</span>
                        </div>
                        <Progress value={(item.value / item.target) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Health Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { category: "Physical Health", score: 85, color: "bg-primary" },
                      { category: "Mental Health", score: 78, color: "bg-accent" },
                      { category: "Nutrition", score: 82, color: "bg-success" },
                      { category: "Prevention", score: 95, color: "bg-info" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm">
                            <span>{item.category}</span>
                            <span className="font-semibold">{item.score}%</span>
                          </div>
                          <Progress value={item.score} className="h-2 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Risk Analysis Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-accent" />
                  Predictive Risk Analysis
                </CardTitle>
                <CardDescription>
                  AI-powered risk assessment based on your health data and lifestyle factors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {riskFactors.map((risk, index) => (
                  <Card key={index} className="border-l-4 border-l-accent">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{risk.factor}</h3>
                        <Badge className={getRiskColor(risk.level)}>
                          {risk.level} risk
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Risk Probability</span>
                          <span className="font-semibold">{risk.probability}%</span>
                        </div>
                        <Progress value={risk.probability} className="h-2" />
                        <p className="text-sm text-muted-foreground">{risk.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-accent/5 to-success/5">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent">
                    <Brain className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Personalized Prevention Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      Based on your risk analysis, we've created a customized prevention plan 
                      to help you maintain optimal health and reduce future health risks.
                    </p>
                  </div>
                  <Button>
                    View Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
