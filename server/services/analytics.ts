import { SecureDataAccessService } from "./secureDataAccess";
import { NeonDatabaseService } from "./neonDatabase";

export interface HealthGoals {
  stepsTarget?: number;
  waterGlassesPerDay?: number;
  sleepHours?: number;
  updatedAt: string;
}

export interface ReminderPrefs {
  waterEnabled: boolean;
  waterIntervalMinutes?: number; // interval between reminders
  sleepEnabled: boolean;
  bedtime?: string; // HH:MM
  wakeTime?: string; // HH:MM
  updatedAt: string;
}

export class AnalyticsService {
  private static goalsByUser: Map<string, HealthGoals> = new Map(); // key: userHash
  private static remindersByUser: Map<string, ReminderPrefs> = new Map();

  static getUserHashFromSession(sessionToken: string): string | null {
    const user = SecureDataAccessService.getUserFromSession(sessionToken);
    return user?.userHash || null;
  }

  static setGoals(sessionToken: string, goals: Partial<HealthGoals>): { success: boolean; goals?: HealthGoals; message?: string } {
    const userHash = this.getUserHashFromSession(sessionToken);
    if (!userHash) return { success: false, message: "Invalid session" };

    const existing = this.goalsByUser.get(userHash) || { updatedAt: new Date().toISOString() };
    const merged: HealthGoals = {
      stepsTarget: goals.stepsTarget ?? existing.stepsTarget,
      waterGlassesPerDay: goals.waterGlassesPerDay ?? existing.waterGlassesPerDay,
      sleepHours: goals.sleepHours ?? existing.sleepHours,
      updatedAt: new Date().toISOString(),
    };
    this.goalsByUser.set(userHash, merged);

    // Persist to Neon if available
    if (process.env.DATABASE_URL) {
      NeonDatabaseService.upsertUserGoals(userHash, {
        stepsTarget: merged.stepsTarget,
        waterGlassesPerDay: merged.waterGlassesPerDay,
        sleepHours: merged.sleepHours,
      }).catch(() => {});
    }
    return { success: true, goals: merged };
  }

  static getGoals(sessionToken: string): { success: boolean; goals?: HealthGoals; message?: string } {
    const userHash = this.getUserHashFromSession(sessionToken);
    if (!userHash) return { success: false, message: "Invalid session" };
    if (process.env.DATABASE_URL) {
      // Prefer Neon value when available
      return {
        success: true,
        // Note: async Neon call omitted for simplicity in sync signature; using memory as cache
        goals: this.goalsByUser.get(userHash) || { updatedAt: new Date().toISOString() },
      };
    }
    return { success: true, goals: this.goalsByUser.get(userHash) || { updatedAt: new Date().toISOString() } };
  }

  static setReminders(sessionToken: string, prefs: Partial<ReminderPrefs>): { success: boolean; reminders?: ReminderPrefs; message?: string } {
    const userHash = this.getUserHashFromSession(sessionToken);
    if (!userHash) return { success: false, message: "Invalid session" };

    const existing = this.remindersByUser.get(userHash) || {
      waterEnabled: false,
      sleepEnabled: false,
      updatedAt: new Date().toISOString(),
    } as ReminderPrefs;

    const merged: ReminderPrefs = {
      waterEnabled: prefs.waterEnabled ?? existing.waterEnabled,
      waterIntervalMinutes: prefs.waterIntervalMinutes ?? existing.waterIntervalMinutes,
      sleepEnabled: prefs.sleepEnabled ?? existing.sleepEnabled,
      bedtime: prefs.bedtime ?? existing.bedtime,
      wakeTime: prefs.wakeTime ?? existing.wakeTime,
      updatedAt: new Date().toISOString(),
    };

    this.remindersByUser.set(userHash, merged);
    if (process.env.DATABASE_URL) {
      NeonDatabaseService.upsertUserReminders(userHash, {
        waterEnabled: merged.waterEnabled,
        waterIntervalMinutes: merged.waterIntervalMinutes,
        sleepEnabled: merged.sleepEnabled,
        bedtime: merged.bedtime,
        wakeTime: merged.wakeTime,
      }).catch(() => {});
    }
    return { success: true, reminders: merged };
  }

  static getReminders(sessionToken: string): { success: boolean; reminders?: ReminderPrefs; message?: string } {
    const userHash = this.getUserHashFromSession(sessionToken);
    if (!userHash) return { success: false, message: "Invalid session" };
    if (process.env.DATABASE_URL) {
      return {
        success: true,
        reminders: this.remindersByUser.get(userHash) || {
          waterEnabled: false, sleepEnabled: false, updatedAt: new Date().toISOString()
        },
      };
    }
    return { success: true, reminders: this.remindersByUser.get(userHash) || {
      waterEnabled: false, sleepEnabled: false, updatedAt: new Date().toISOString()
    } };
  }
}