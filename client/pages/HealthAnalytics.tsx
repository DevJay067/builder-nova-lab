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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function HealthAnalytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("month");
  const [isSaving, setIsSaving] = useState(false);
  const [goals, setGoals] = useState({ stepsTarget: 10000, waterGlassesPerDay: 8, sleepHours: 8 });
  const [reminders, setReminders] = useState({ waterEnabled: false, waterIntervalMinutes: 120, sleepEnabled: false, bedtime: "23:00", wakeTime: "07:00" });
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [savedType, setSavedType] = useState<"goals" | "reminders" | null>(null);

  async function loadSettings() {
    try {
      const sessionToken = localStorage.getItem("sessionToken");
      if (!sessionToken) return;
      const [g, r] = await Promise.all([
        fetch("/api/analytics/goals", { headers: { Authorization: `Bearer ${sessionToken}`, "x-session-token": sessionToken } }).then((r) => r.json()),
        fetch("/api/analytics/reminders", { headers: { Authorization: `Bearer ${sessionToken}`, "x-session-token": sessionToken } }).then((r) => r.json()),
      ]);
      if (g.success && g.goals) setGoals({
        stepsTarget: g.goals.stepsTarget ?? goals.stepsTarget,
        waterGlassesPerDay: g.goals.waterGlassesPerDay ?? goals.waterGlassesPerDay,
        sleepHours: g.goals.sleepHours ?? goals.sleepHours,
      });
      if (r.success && r.reminders) setReminders({
        waterEnabled: !!r.reminders.waterEnabled,
        waterIntervalMinutes: r.reminders.waterIntervalMinutes ?? reminders.waterIntervalMinutes,
        sleepEnabled: !!r.reminders.sleepEnabled,
        bedtime: r.reminders.bedtime ?? reminders.bedtime,
        wakeTime: r.reminders.wakeTime ?? reminders.wakeTime,
      });
    } catch {}
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function ensurePushSubscription() {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        // Application Server Key should be provided for VAPID; placeholder here
        const vapidPublicKey = (window as any).VAPID_PUBLIC_KEY || undefined;
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidPublicKey });
      }
      const sessionToken = localStorage.getItem("sessionToken");
      if (!sessionToken || !sub) return;
      await fetch("/api/analytics/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}`, "x-session-token": sessionToken },
        body: JSON.stringify(sub.toJSON()),
      });
    } catch {}
  }

  async function saveGoals() {
    try {
      setIsSaving(true);
      const sessionToken = localStorage.getItem("sessionToken");
      if (!sessionToken) return toast.error("Please login to save goals");
      const res = await fetch("/api/analytics/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}`, "x-session-token": sessionToken },
        body: JSON.stringify(goals),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Goals saved");
        setSavedMessage("Goals updated successfully");
        setSavedType("goals");
        await ensurePushSubscription();
      } else toast.error(data.message || "Failed to save goals");
    } catch {
      toast.error("Network error");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveReminders() {
    try {
      setIsSaving(true);
      const sessionToken = localStorage.getItem("sessionToken");
      if (!sessionToken) return toast.error("Please login to save reminders");
      const res = await fetch("/api/analytics/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}`, "x-session-token": sessionToken },
        body: JSON.stringify(reminders),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Reminders saved");
        setSavedMessage("Reminders updated successfully");
        setSavedType("reminders");
        await ensurePushSubscription();
      } else toast.error(data.message || "Failed to save reminders");
    } catch {
      toast.error("Network error");
    } finally {
      setIsSaving(false);
    }
  }

  const healthMetrics = [
    {
      title: "Overall Health Score",
      value: 87,
      target: 90,
      trend: "up",
      change: "+3.2%",
      description: "Based on your recent health data and AI analysis"
    },
    {
      title: "Cardiovascular Health",
      value: 82,
      target: 85,
      trend: "up",
      change: "+2.1%",
      description: "Heart rate, blood pressure, and activity trends"
    },
    {
      title: "Mental Wellness",
      value: 78,
      target: 80,
      trend: "down",
      change: "-1.5%",
      description: "Stress levels, sleep quality, and mood tracking"
    },
    {
      title: "Preventive Care",
      value: 95,
      target: 100,
      trend: "up",
      change: "+5.0%",
      description: "Checkups, screenings, and vaccination status"
    }
  ];

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
        {/* Goals and Reminders */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center"><Target className="h-5 w-5 mr-2" /> Health Goals & Reminders</CardTitle>
            <CardDescription>Set personal targets and wellness reminders</CardDescription>
          </CardHeader>
          <CardContent>
            {savedMessage && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200 text-sm">
                {savedMessage}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Goals</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Daily Steps Target</Label>
                    <Input type="number" value={goals.stepsTarget} onChange={(e) => setGoals({ ...goals, stepsTarget: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label className="text-sm">Water Intake (glasses/day)</Label>
                    <Input type="number" value={goals.waterGlassesPerDay} onChange={(e) => setGoals({ ...goals, waterGlassesPerDay: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label className="text-sm">Sleep Hours</Label>
                    <Input type="number" value={goals.sleepHours} step="0.1" onChange={(e) => setGoals({ ...goals, sleepHours: Number(e.target.value) })} />
                  </div>
                  <Button onClick={saveGoals} disabled={isSaving}>Save Goals</Button>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Reminders</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Water Reminders</Label>
                    <Switch checked={reminders.waterEnabled} onCheckedChange={(v) => setReminders({ ...reminders, waterEnabled: !!v })} />
                  </div>
                  <div>
                    <Label className="text-sm">Water Interval (minutes)</Label>
                    <Input type="number" value={reminders.waterIntervalMinutes} onChange={(e) => setReminders({ ...reminders, waterIntervalMinutes: Number(e.target.value) })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Sleep Reminders</Label>
                    <Switch checked={reminders.sleepEnabled} onCheckedChange={(v) => setReminders({ ...reminders, sleepEnabled: !!v })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Bedtime</Label>
                      <Input type="time" value={reminders.bedtime} onChange={(e) => setReminders({ ...reminders, bedtime: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-sm">Wake Time</Label>
                      <Input type="time" value={reminders.wakeTime} onChange={(e) => setReminders({ ...reminders, wakeTime: e.target.value })} />
                    </div>
                  </div>
                  <Button onClick={saveReminders} disabled={isSaving}>Save Reminders</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
