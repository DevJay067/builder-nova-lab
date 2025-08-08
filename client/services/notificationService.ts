// Enhanced Notification Service for Health Reminders
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  timestamp: number;
  type: 'water' | 'sleep' | 'medication' | 'health-check';
}

export interface ScheduledNotification {
  id: string;
  type: 'water' | 'sleep' | 'medication';
  enabled: boolean;
  timeoutId?: number;
  intervalId?: number;
  schedule: any;
}

class NotificationService {
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private workers: Worker[] = [];

  constructor() {
    this.initializeService();
  }

  private async initializeService() {
    // Request notification permission if not already granted
    if ('Notification' in window && Notification.permission === 'default') {
      await this.requestPermission();
    }

    // Register service worker for background notifications
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered for notifications');
      } catch (error) {
        console.log('⚠️ Service Worker registration failed:', error);
      }
    }

    // Load previously scheduled notifications
    this.loadScheduledNotifications();
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Test notification
      this.showNotification({
        id: 'welcome',
        title: '🎉 Notifications Enabled!',
        body: 'You\'ll now receive health reminders from HealthChain.',
        type: 'health-check',
        timestamp: Date.now()
      });
      return true;
    }

    return false;
  }

  showNotification(data: NotificationData): void {
    if (!this.canShowNotifications()) {
      console.warn('Cannot show notifications - permission not granted');
      return;
    }

    const notification = new Notification(data.title, {
      body: data.body,
      icon: data.icon || '/manifest.json',
      tag: data.tag || data.id,
      badge: '/manifest.json',
      timestamp: data.timestamp,
      requireInteraction: data.type === 'medication', // Important notifications stay visible
      actions: data.type === 'water' ? [
        { action: 'log', title: 'Log Water' },
        { action: 'remind-later', title: 'Remind Later' }
      ] : [],
    });

    // Auto-close after 10 seconds for non-critical notifications
    if (data.type !== 'medication') {
      setTimeout(() => {
        notification.close();
      }, 10000);
    }

    // Handle notification clicks
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Navigate to relevant page based on type
      switch (data.type) {
        case 'water':
        case 'sleep':
          window.location.href = '/analytics#tracking';
          break;
        case 'health-check':
          window.location.href = '/history';
          break;
      }
    };

    // Log notification for analytics
    this.logNotification(data);
  }

  scheduleWaterReminders(reminder: {
    id: string;
    interval: number; // minutes
    startTime: string; // "HH:MM"
    endTime: string; // "HH:MM"
    enabled: boolean;
    goal: number;
  }): void {
    if (!reminder.enabled) return;

    // Clear existing reminder if it exists
    this.clearScheduledNotification(reminder.id);

    const intervalMs = reminder.interval * 60 * 1000;
    
    const intervalId = setInterval(() => {
      if (!this.isWithinTimeRange(reminder.startTime, reminder.endTime)) {
        return; // Don't remind outside of schedule
      }

      const currentIntake = this.getCurrentWaterIntake();
      const progress = Math.round((currentIntake / reminder.goal) * 100);

      this.showNotification({
        id: `water-${reminder.id}-${Date.now()}`,
        title: '💧 Time to Hydrate!',
        body: `Stay healthy! You've had ${currentIntake}/${reminder.goal} glasses today (${progress}%)`,
        type: 'water',
        timestamp: Date.now(),
        tag: 'water-reminder'
      });
    }, intervalMs);

    // Store the scheduled notification
    this.scheduledNotifications.set(reminder.id, {
      id: reminder.id,
      type: 'water',
      enabled: reminder.enabled,
      intervalId: intervalId as unknown as number,
      schedule: reminder
    });

    // Save to storage
    this.saveScheduledNotifications();

    console.log(`✅ Water reminder scheduled every ${reminder.interval} minutes`);
  }

  scheduleSleepReminder(schedule: {
    id: string;
    bedtime: string; // "HH:MM"
    wakeTime: string; // "HH:MM"
    enabled: boolean;
    days: string[];
  }): void {
    if (!schedule.enabled) return;

    // Clear existing schedule if it exists
    this.clearScheduledNotification(schedule.id);

    // Schedule bedtime reminder
    const bedtimeTimeout = this.calculateTimeUntilTime(schedule.bedtime);
    const bedtimeTimeoutId = setTimeout(() => {
      this.showNotification({
        id: `sleep-bedtime-${schedule.id}`,
        title: '💤 Time for Bed!',
        body: `It's your scheduled bedtime (${schedule.bedtime}). Getting good sleep is important for your health.`,
        type: 'sleep',
        timestamp: Date.now(),
        tag: 'sleep-bedtime'
      });

      // Schedule the next day's bedtime
      this.scheduleSleepReminder(schedule);
    }, bedtimeTimeout);

    // Schedule wake-up reminder
    const wakeupTimeout = this.calculateTimeUntilTime(schedule.wakeTime);
    const wakeupTimeoutId = setTimeout(() => {
      this.showNotification({
        id: `sleep-wakeup-${schedule.id}`,
        title: '🌅 Good Morning!',
        body: `Time to wake up! Hope you had a restful sleep. Start your day with some water.`,
        type: 'sleep',
        timestamp: Date.now(),
        tag: 'sleep-wakeup'
      });
    }, wakeupTimeout);

    // Store the scheduled notification
    this.scheduledNotifications.set(schedule.id, {
      id: schedule.id,
      type: 'sleep',
      enabled: schedule.enabled,
      timeoutId: bedtimeTimeoutId as unknown as number,
      schedule: { ...schedule, wakeupTimeoutId }
    });

    // Save to storage
    this.saveScheduledNotifications();

    console.log(`✅ Sleep reminders scheduled for ${schedule.bedtime} and ${schedule.wakeTime}`);
  }

  clearScheduledNotification(id: string): void {
    const notification = this.scheduledNotifications.get(id);
    if (notification) {
      if (notification.timeoutId) {
        clearTimeout(notification.timeoutId);
      }
      if (notification.intervalId) {
        clearInterval(notification.intervalId);
      }
      this.scheduledNotifications.delete(id);
      this.saveScheduledNotifications();
    }
  }

  clearAllNotifications(): void {
    this.scheduledNotifications.forEach((notification, id) => {
      this.clearScheduledNotification(id);
    });
    localStorage.removeItem('scheduledNotifications');
  }

  getActiveNotifications(): ScheduledNotification[] {
    return Array.from(this.scheduledNotifications.values()).filter(n => n.enabled);
  }

  private canShowNotifications(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  private isWithinTimeRange(startTime: string, endTime: string): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTimeMinutes = startHours * 60 + startMinutes;
    const endTimeMinutes = endHours * 60 + endMinutes;
    
    return currentTime >= startTimeMinutes && currentTime <= endTimeMinutes;
  }

  private calculateTimeUntilTime(timeString: string): number {
    const now = new Date();
    const [hours, minutes] = timeString.split(':').map(Number);
    
    const targetTime = new Date();
    targetTime.setHours(hours, minutes, 0, 0);
    
    // If the target time is in the past today, schedule for tomorrow
    if (targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    return targetTime.getTime() - now.getTime();
  }

  private getCurrentWaterIntake(): number {
    try {
      const trackingData = localStorage.getItem('healthTracking');
      if (trackingData) {
        const data = JSON.parse(trackingData);
        return data.todayWaterIntake || 0;
      }
    } catch (error) {
      console.error('Error getting water intake:', error);
    }
    return 0;
  }

  private saveScheduledNotifications(): void {
    const notificationsData = Array.from(this.scheduledNotifications.entries()).map(([id, notification]) => ({
      id,
      type: notification.type,
      enabled: notification.enabled,
      schedule: notification.schedule
    }));
    
    localStorage.setItem('scheduledNotifications', JSON.stringify(notificationsData));
  }

  private loadScheduledNotifications(): void {
    try {
      const stored = localStorage.getItem('scheduledNotifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        notifications.forEach((notification: any) => {
          if (notification.enabled) {
            if (notification.type === 'water') {
              this.scheduleWaterReminders(notification.schedule);
            } else if (notification.type === 'sleep') {
              this.scheduleSleepReminder(notification.schedule);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
    }
  }

  private logNotification(data: NotificationData): void {
    // Log notification for analytics
    const log = {
      ...data,
      shownAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    
    // Store in notification history
    const history = JSON.parse(localStorage.getItem('notificationHistory') || '[]');
    history.push(log);
    
    // Keep only last 100 notifications
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    localStorage.setItem('notificationHistory', JSON.stringify(history));
  }

  // Test notification
  testNotification(): void {
    this.showNotification({
      id: 'test-' + Date.now(),
      title: '🧪 Test Notification',
      body: 'This is a test notification to verify your setup is working correctly!',
      type: 'health-check',
      timestamp: Date.now()
    });
  }

  // Get notification statistics
  getNotificationStats() {
    const history = JSON.parse(localStorage.getItem('notificationHistory') || '[]');
    const activeNotifications = this.getActiveNotifications();
    
    return {
      totalSent: history.length,
      activeReminders: activeNotifications.length,
      waterReminders: activeNotifications.filter(n => n.type === 'water').length,
      sleepReminders: activeNotifications.filter(n => n.type === 'sleep').length,
      lastNotification: history[history.length - 1],
      permissionStatus: Notification.permission
    };
  }
}

// Create singleton instance
export const notificationService = new NotificationService();
export default notificationService;
