import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Moon, 
  Droplets, 
  Bell, 
  Clock, 
  Plus,
  CheckCircle,
  AlertCircle,
  Calendar,
  Trash2,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SleepSchedule {
  id: string;
  bedtime: string;
  wakeTime: string;
  enabled: boolean;
  days: string[];
}

interface WaterReminder {
  id: string;
  interval: number; // minutes
  startTime: string;
  endTime: string;
  enabled: boolean;
  goal: number; // glasses per day
}

interface TrackingData {
  sleepSchedules: SleepSchedule[];
  waterReminders: WaterReminder[];
  todayWaterIntake: number;
  lastSleepTime?: string;
  lastWakeTime?: string;
}

export default function HealthTracking() {
  const { toast } = useToast();
  const [trackingData, setTrackingData] = useState<TrackingData>({
    sleepSchedules: [],
    waterReminders: [],
    todayWaterIntake: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sleep form state
  const [newSleep, setNewSleep] = useState({
    bedtime: "22:00",
    wakeTime: "07:00",
    days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
  });

  // Water form state
  const [newWater, setNewWater] = useState({
    interval: 60,
    startTime: "08:00",
    endTime: "22:00",
    goal: 8
  });

  useEffect(() => {
    loadTrackingData();
    requestNotificationPermission();
  }, []);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive health tracking reminders",
        });
      } else if (permission === "denied") {
        toast({
          title: "Notifications Blocked",
          description: "Please enable notifications in your browser settings for reminders to work",
          variant: "destructive",
        });
      }
    }
  };

  const loadTrackingData = async () => {
    try {
      setIsLoading(true);
      
      // Load from localStorage first
      const stored = localStorage.getItem("healthTracking");
      if (stored) {
        setTrackingData(JSON.parse(stored));
      }

      // TODO: Load from cloud vault API when available
      const sessionToken = localStorage.getItem("sessionToken");
      if (sessionToken) {
        try {
          const response = await fetch("/api/vault/retrieve/health-tracking", {
            headers: {
              "x-session-token": sessionToken,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setTrackingData(data.data);
            }
          }
        } catch (error) {
          console.log("Using local storage for health tracking");
        }
      }
    } catch (error) {
      console.error("Error loading tracking data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTrackingData = async (newData: TrackingData) => {
    try {
      // Save to localStorage
      localStorage.setItem("healthTracking", JSON.stringify(newData));
      
      // Save to cloud vault
      const sessionToken = localStorage.getItem("sessionToken");
      if (sessionToken) {
        try {
          await fetch("/api/vault/store", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-session-token": sessionToken,
            },
            body: JSON.stringify({
              data: newData,
              filename: "health-tracking.json",
              dataType: "health-tracking",
              metadata: {
                updatedAt: new Date().toISOString(),
                source: "health-tracking-component"
              }
            }),
          });
        } catch (error) {
          console.log("Cloud save failed, data saved locally");
        }
      }
      
      setTrackingData(newData);
    } catch (error) {
      console.error("Error saving tracking data:", error);
      toast({
        title: "Error",
        description: "Failed to save tracking data",
        variant: "destructive",
      });
    }
  };

  const addSleepSchedule = () => {
    if (!newSleep.bedtime || !newSleep.wakeTime) {
      toast({
        title: "Invalid Schedule",
        description: "Please set both bedtime and wake time",
        variant: "destructive",
      });
      return;
    }

    const schedule: SleepSchedule = {
      id: crypto.randomUUID(),
      bedtime: newSleep.bedtime,
      wakeTime: newSleep.wakeTime,
      enabled: true,
      days: newSleep.days
    };

    const newData = {
      ...trackingData,
      sleepSchedules: [...trackingData.sleepSchedules, schedule]
    };

    saveTrackingData(newData);
    scheduleSleepNotifications(schedule);

    toast({
      title: "Sleep Schedule Added",
      description: "Notifications will remind you of bedtime and wake time",
    });
  };

  const addWaterReminder = () => {
    if (newWater.interval < 15 || newWater.interval > 300) {
      toast({
        title: "Invalid Interval",
        description: "Reminder interval must be between 15 and 300 minutes",
        variant: "destructive",
      });
      return;
    }

    if (!newWater.startTime || !newWater.endTime) {
      toast({
        title: "Invalid Times",
        description: "Please set both start and end times",
        variant: "destructive",
      });
      return;
    }

    const reminder: WaterReminder = {
      id: crypto.randomUUID(),
      interval: newWater.interval,
      startTime: newWater.startTime,
      endTime: newWater.endTime,
      enabled: true,
      goal: newWater.goal
    };

    const newData = {
      ...trackingData,
      waterReminders: [...trackingData.waterReminders, reminder]
    };

    saveTrackingData(newData);
    scheduleWaterNotifications(reminder);

    toast({
      title: "Water Reminder Added",
      description: `You'll be reminded every ${newWater.interval} minutes`,
    });
  };

  const scheduleSleepNotifications = (schedule: SleepSchedule) => {
    if ("Notification" in window && Notification.permission === "granted") {
      // Calculate time until bedtime
      const now = new Date();
      const bedtimeToday = new Date();
      const [bedHours, bedMinutes] = schedule.bedtime.split(':').map(Number);
      bedtimeToday.setHours(bedHours, bedMinutes, 0, 0);
      
      if (bedtimeToday <= now) {
        bedtimeToday.setDate(bedtimeToday.getDate() + 1);
      }
      
      const timeUntilBedtime = bedtimeToday.getTime() - now.getTime();
      
      setTimeout(() => {
        new Notification("💤 Time for Bed!", {
          body: "It's your scheduled bedtime. Getting good sleep is important for your health.",
          icon: "/manifest.json"
        });
      }, timeUntilBedtime);
    }
  };

  const scheduleWaterNotifications = (reminder: WaterReminder) => {
    if ("Notification" in window && Notification.permission === "granted") {
      const intervalMs = reminder.interval * 60 * 1000;
      
      const waterInterval = setInterval(() => {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [startHours, startMinutes] = reminder.startTime.split(':').map(Number);
        const [endHours, endMinutes] = reminder.endTime.split(':').map(Number);
        const startTime = startHours * 60 + startMinutes;
        const endTime = endHours * 60 + endMinutes;
        
        if (currentTime >= startTime && currentTime <= endTime) {
          new Notification("💧 Time to Hydrate!", {
            body: "Remember to drink water to stay healthy and hydrated.",
            icon: "/manifest.json"
          });
        }
      }, intervalMs);
      
      // Store interval ID for cleanup
      (reminder as any).intervalId = waterInterval;
    }
  };

  const logWater = () => {
    const newData = {
      ...trackingData,
      todayWaterIntake: trackingData.todayWaterIntake + 1
    };
    saveTrackingData(newData);
    
    toast({
      title: "Water Logged!",
      description: `${newData.todayWaterIntake} glasses today`,
    });
  };

  const toggleSchedule = (id: string, enabled: boolean) => {
    const newData = {
      ...trackingData,
      sleepSchedules: trackingData.sleepSchedules.map(schedule =>
        schedule.id === id ? { ...schedule, enabled } : schedule
      )
    };
    saveTrackingData(newData);
  };

  const toggleWaterReminder = (id: string, enabled: boolean) => {
    const newData = {
      ...trackingData,
      waterReminders: trackingData.waterReminders.map(reminder =>
        reminder.id === id ? { ...reminder, enabled } : reminder
      )
    };
    saveTrackingData(newData);
  };

  const deleteSchedule = (id: string) => {
    const newData = {
      ...trackingData,
      sleepSchedules: trackingData.sleepSchedules.filter(schedule => schedule.id !== id)
    };
    saveTrackingData(newData);
    
    toast({
      title: "Schedule Deleted",
      description: "Sleep schedule has been removed",
    });
  };

  const deleteWaterReminder = (id: string) => {
    const newData = {
      ...trackingData,
      waterReminders: trackingData.waterReminders.filter(reminder => reminder.id !== id)
    };
    saveTrackingData(newData);

    toast({
      title: "Reminder Deleted",
      description: "Water reminder has been removed",
    });
  };

  const testNotifications = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🎉 Health Tracking Test", {
        body: "Great! Your notifications are working properly. You'll receive health reminders like this.",
        icon: "/manifest.json"
      });

      toast({
        title: "Test Notification Sent",
        description: "Check if you received the notification above",
      });
    } else {
      toast({
        title: "Notifications Not Available",
        description: "Please enable notifications first",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Settings className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading health tracking...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="h-5 w-5 mr-2 text-primary" />
          Health Tracking & Notifications
        </CardTitle>
        <CardDescription>
          Set up personalized reminders for sleep and hydration to maintain healthy habits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sleep" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sleep" className="flex items-center space-x-2">
              <Moon className="h-4 w-4" />
              <span>Sleep</span>
            </TabsTrigger>
            <TabsTrigger value="water" className="flex items-center space-x-2">
              <Droplets className="h-4 w-4" />
              <span>Water</span>
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
          </TabsList>

          {/* Sleep Tracking Tab */}
          <TabsContent value="sleep" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Add Sleep Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Sleep Schedule</CardTitle>
                  <CardDescription>Set your ideal bedtime and wake time</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bedtime">Bedtime</Label>
                      <Input
                        id="bedtime"
                        type="time"
                        value={newSleep.bedtime}
                        onChange={(e) => setNewSleep({ ...newSleep, bedtime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="waketime">Wake Time</Label>
                      <Input
                        id="waketime"
                        type="time"
                        value={newSleep.wakeTime}
                        onChange={(e) => setNewSleep({ ...newSleep, wakeTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={addSleepSchedule} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sleep Schedule
                  </Button>
                </CardContent>
              </Card>

              {/* Current Sleep Schedules */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Sleep Schedules</CardTitle>
                  <CardDescription>Manage your sleep notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trackingData.sleepSchedules.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No sleep schedules set up yet
                    </p>
                  ) : (
                    trackingData.sleepSchedules.map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Moon className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium">{schedule.bedtime} - {schedule.wakeTime}</p>
                            <p className="text-xs text-muted-foreground">Daily schedule</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={schedule.enabled}
                            onCheckedChange={(enabled) => toggleSchedule(schedule.id, enabled)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSchedule(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Water Tracking Tab */}
          <TabsContent value="water" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Add Water Reminder */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Water Reminder</CardTitle>
                  <CardDescription>Set up hydration notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="interval">Reminder Interval (minutes)</Label>
                    <Input
                      id="interval"
                      type="number"
                      value={newWater.interval}
                      onChange={(e) => setNewWater({ ...newWater, interval: parseInt(e.target.value) })}
                      min="15"
                      max="300"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={newWater.startTime}
                        onChange={(e) => setNewWater({ ...newWater, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={newWater.endTime}
                        onChange={(e) => setNewWater({ ...newWater, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="goal">Daily Goal (glasses)</Label>
                    <Input
                      id="goal"
                      type="number"
                      value={newWater.goal}
                      onChange={(e) => setNewWater({ ...newWater, goal: parseInt(e.target.value) })}
                      min="1"
                      max="20"
                    />
                  </div>
                  <Button onClick={addWaterReminder} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Water Reminder
                  </Button>
                </CardContent>
              </Card>

              {/* Water Tracking */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Today's Water Intake</CardTitle>
                  <CardDescription>Track your daily hydration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {trackingData.todayWaterIntake}
                    </div>
                    <p className="text-sm text-muted-foreground">glasses today</p>
                  </div>
                  <Button onClick={logWater} className="w-full">
                    <Droplets className="h-4 w-4 mr-2" />
                    Log a Glass of Water
                  </Button>
                  {trackingData.waterReminders.map((reminder) => (
                    <div key={reminder.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Droplets className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="font-medium">Every {reminder.interval} min</p>
                          <p className="text-xs text-muted-foreground">
                            {reminder.startTime} - {reminder.endTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={reminder.enabled}
                          onCheckedChange={(enabled) => toggleWaterReminder(reminder.id, enabled)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteWaterReminder(reminder.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Moon className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{trackingData.sleepSchedules.length}</p>
                      <p className="text-xs text-muted-foreground">Sleep Schedules</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Droplets className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{trackingData.todayWaterIntake}</p>
                      <p className="text-xs text-muted-foreground">Glasses Today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{trackingData.waterReminders.length}</p>
                      <p className="text-xs text-muted-foreground">Active Reminders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Notification Status */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Notification.permission === "granted" ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>Notifications are enabled</span>
                  </div>
                ) : Notification.permission === "denied" ? (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <span>Notifications are blocked. Please enable them in browser settings.</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-yellow-600">
                    <AlertCircle className="h-5 w-5" />
                    <span>Please enable notifications for reminders to work</span>
                  </div>
                )}

                <div className="flex space-x-2">
                  {Notification.permission !== "granted" && (
                    <Button onClick={requestNotificationPermission} size="sm">
                      <Bell className="h-4 w-4 mr-2" />
                      Enable Notifications
                    </Button>
                  )}

                  {Notification.permission === "granted" && (
                    <Button onClick={testNotifications} variant="outline" size="sm">
                      <Zap className="h-4 w-4 mr-2" />
                      Test Notifications
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
