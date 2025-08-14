import { useState } from "react";
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
  Shield,
  Droplets
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect, useRef } from "react";

export default function HealthAnalytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("month");

  // Goals & Reminders state
  const [waterGoal, setWaterGoal] = useState<number>(() => {
    const v = localStorage.getItem("health_water_goal");
    return v ? parseInt(v) : 8;
  });
  const [waterConsumed, setWaterConsumed] = useState<number>(() => {
    const v = localStorage.getItem("health_water_consumed");
    return v ? parseInt(v) : 0;
  });
  const [sleepHoursGoal, setSleepHoursGoal] = useState<number>(() => {
    const v = localStorage.getItem("health_sleep_goal_hours");
    return v ? parseInt(v) : 8;
  });
  const [bedtime, setBedtime] = useState<string>(() => {
    return localStorage.getItem("health_bedtime") || "22:30";
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const v = localStorage.getItem("health_notifications_enabled");
    return v ? v === "true" : true;
  });

  const [hydrationEndAt, setHydrationEndAt] = useState<number | null>(() => {
    const v = localStorage.getItem("health_hydration_end_at");
    return v ? parseInt(v) : null;
  });
  const [sleepReminderAt, setSleepReminderAt] = useState<number | null>(() => {
    const v = localStorage.getItem("health_sleep_reminder_at");
    return v ? parseInt(v) : null;
  });
  const hydrationIntervalRef = useRef<any>(null);
  const sleepIntervalRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem("health_water_goal", String(waterGoal));
  }, [waterGoal]);

  useEffect(() => {
    localStorage.setItem("health_water_consumed", String(waterConsumed));
  }, [waterConsumed]);

  useEffect(() => {
    localStorage.setItem("health_sleep_goal_hours", String(sleepHoursGoal));
  }, [sleepHoursGoal]);

  useEffect(() => {
    localStorage.setItem("health_bedtime", bedtime);
  }, [bedtime]);

  useEffect(() => {
    localStorage.setItem("health_notifications_enabled", String(notificationsEnabled));
    if (notificationsEnabled && Notification && Notification.permission !== "granted") {
      Notification.requestPermission().catch(() => {});
    }
  }, [notificationsEnabled]);

  const showLocalNotification = async (title: string, body: string) => {
    try {
      if (!notificationsEnabled) return;
      if (Notification && Notification.permission === "granted") {
        const reg = await navigator.serviceWorker?.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon: "/icons/icon-192x192.png",
            vibrate: [200, 100, 200],
            data: { url: "/analytics" },
          });
          return;
        }
        new Notification(title, { body });
      }
    } catch {}
  };

  const saveQuickRecord = async (record: {
    type: string;
    title: string;
    description?: string;
    metadata?: any;
  }) => {
    try {
      const sessionToken =
        localStorage.getItem("sessionToken") ||
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("healthchain_session="))
          ?.split("=")[1];
      if (!sessionToken) return;
      await fetch("/api/health-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
          "x-session-token": sessionToken,
        },
        body: JSON.stringify({
          type: record.type,
          title: record.title,
          description: record.description || "",
          date: new Date().toISOString().split("T")[0],
          doctor: "",
          metadata: record.metadata || {},
        }),
      });
    } catch {}
  };

  // Hydration timer management
  const clearHydrationInterval = () => {
    if (hydrationIntervalRef.current) {
      clearInterval(hydrationIntervalRef.current);
      hydrationIntervalRef.current = null;
    }
  };

  const startHydrationTimer = (minutes: number) => {
    const endAt = Date.now() + minutes * 60 * 1000;
    setHydrationEndAt(endAt);
    localStorage.setItem("health_hydration_end_at", String(endAt));
    clearHydrationInterval();
    hydrationIntervalRef.current = setInterval(() => {
      if (Date.now() >= endAt) {
        clearHydrationInterval();
        setHydrationEndAt(null);
        localStorage.removeItem("health_hydration_end_at");
        showLocalNotification("Hydration Reminder", "Time to drink water 💧");
      }
    }, 1000);
  };

  useEffect(() => {
    if (hydrationEndAt && hydrationEndAt > Date.now()) {
      startHydrationTimer(Math.ceil((hydrationEndAt - Date.now()) / 60000));
    } else if (hydrationEndAt && hydrationEndAt <= Date.now()) {
      // overdue
      setHydrationEndAt(null);
      localStorage.removeItem("health_hydration_end_at");
      showLocalNotification("Hydration Reminder", "Time to drink water 💧");
    }
    return () => clearHydrationInterval();
  }, []);

  // Sleep reminder management
  const clearSleepInterval = () => {
    if (sleepIntervalRef.current) {
      clearInterval(sleepIntervalRef.current);
      sleepIntervalRef.current = null;
    }
  };

  const scheduleTonightSleepReminder = () => {
    const [hh, mm] = bedtime.split(":").map((x) => parseInt(x));
    const now = new Date();
    const target = new Date();
    target.setHours(hh, mm, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    const endAt = target.getTime();
    setSleepReminderAt(endAt);
    localStorage.setItem("health_sleep_reminder_at", String(endAt));
    clearSleepInterval();
    sleepIntervalRef.current = setInterval(() => {
      if (Date.now() >= endAt) {
        clearSleepInterval();
        setSleepReminderAt(null);
        localStorage.removeItem("health_sleep_reminder_at");
        showLocalNotification("Sleep Reminder", "It's bedtime 🛌");
      }
    }, 1000);
  };

  useEffect(() => {
    if (sleepReminderAt && sleepReminderAt > Date.now()) {
      const minutes = Math.ceil((sleepReminderAt - Date.now()) / 60000);
      // reschedule
      clearSleepInterval();
      sleepIntervalRef.current = setInterval(() => {
        if (Date.now() >= sleepReminderAt) {
          clearSleepInterval();
          setSleepReminderAt(null);
          localStorage.removeItem("health_sleep_reminder_at");
          showLocalNotification("Sleep Reminder", "It's bedtime 🛌");
        }
      }, 1000);
    } else if (sleepReminderAt && sleepReminderAt <= Date.now()) {
      setSleepReminderAt(null);
      localStorage.removeItem("health_sleep_reminder_at");
      showLocalNotification("Sleep Reminder", "It's bedtime 🛌");
    }
    return () => clearSleepInterval();
  }, []);

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
        {/* Goals at top */}
        <Tabs defaultValue="goals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
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
            <TabsTrigger value="goals" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Goals & Reminders</span>
            </TabsTrigger>
          </TabsList>

          {/* Goals & Reminders at top */}
          <TabsContent value="goals" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hydration Goal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Droplets className="h-5 w-5 mr-2 text-blue-600" />
                    Hydration
                  </CardTitle>
                  <CardDescription>Set your daily water goal and reminders</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div>
                      <Label htmlFor="water-goal">Daily Goal (glasses)</Label>
                      <Input id="water-goal" type="number" min={1} value={waterGoal} onChange={(e) => setWaterGoal(parseInt(e.target.value || "0"))} />
                    </div>
                    <div>
                      <Label htmlFor="water-consumed">Consumed</Label>
                      <div className="flex items-center space-x-2">
                        <Input id="water-consumed" type="number" min={0} value={waterConsumed} onChange={(e) => setWaterConsumed(parseInt(e.target.value || "0"))} />
                        <Button variant="outline" onClick={() => setWaterConsumed((v) => Math.min(v + 1, 99))}>+1</Button>
                      </div>
                    </div>
                  </div>
                  <Progress value={Math.min(100, (waterConsumed / Math.max(1, waterGoal)) * 100)} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch id="notify-water" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                      <Label htmlFor="notify-water">Notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" onClick={() => { startHydrationTimer(60); saveQuickRecord({ type: "vitals", title: "Hydration Reminder Set", metadata: { goal: waterGoal, consumed: waterConsumed } }); }}>Remind in 60m</Button>
                      <Button onClick={() => { startHydrationTimer(30); saveQuickRecord({ type: "vitals", title: "Hydration Reminder Set", metadata: { goal: waterGoal, consumed: waterConsumed } }); }}>Remind in 30m</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sleep Goal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                    Sleep
                  </CardTitle>
                  <CardDescription>Set sleep goals and bedtime reminders</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div>
                      <Label htmlFor="sleep-goal">Goal (hours)</Label>
                      <Input id="sleep-goal" type="number" min={1} value={sleepHoursGoal} onChange={(e) => setSleepHoursGoal(parseInt(e.target.value || "0"))} />
                    </div>
                    <div>
                      <Label htmlFor="bedtime">Bedtime</Label>
                      <Input id="bedtime" type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch id="notify-sleep" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                      <Label htmlFor="notify-sleep">Notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" onClick={() => { scheduleTonightSleepReminder(); saveQuickRecord({ type: "vitals", title: "Sleep Reminder Set", metadata: { bedtime, sleepHoursGoal } }); }}>Remind at Bedtime</Button>
                      <Button onClick={() => { showLocalNotification("Sleep Goal", `Target ${sleepHoursGoal} hours tonight`); saveQuickRecord({ type: "vitals", title: "Sleep Goal Set", metadata: { sleepHoursGoal } }); }}>Set Goal</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

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
