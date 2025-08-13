import webpush from "web-push";
import { NeonDatabaseService } from "./neonDatabase";

export class ReminderScheduler {
  private static timer: NodeJS.Timeout | null = null;

  static configureVapid() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      return true;
    }
    return false;
  }

  static start() {
    if (this.timer) return;
    if (!process.env.DATABASE_URL) return; // needs Neon
    const vapidOk = this.configureVapid();
    if (!vapidOk) return; // must configure VAPID

    this.timer = setInterval(async () => {
      try {
        // In a real app, fetch all users and their reminders. For demo, this is a no-op placeholder.
        // Assume an external cron hits an endpoint to evaluate reminders per user.
      } catch (e) {
        // swallow
      }
    }, 60_000);
  }

  static stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  static async sendReminderToUser(userHash: string, title: string, body: string) {
    if (!process.env.DATABASE_URL) return;
    if (!this.configureVapid()) return;
    const subs = await NeonDatabaseService.listPushSubscriptions(userHash);
    const payload = JSON.stringify({ title, body });
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } } as any, payload);
        } catch (e) {
          // ignore individual failures
        }
      }),
    );
  }
}