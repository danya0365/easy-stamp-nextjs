import { container } from "@/src/infrastructure/di/container";
import { ListDueFollowUpsUseCase } from "@/src/application/use-cases/lead/ListDueFollowUpsUseCase";

/**
 * A scheduled job. The registry below is run by the single `/api/cron`
 * dispatcher so the whole app fits within one Vercel cron slot (Hobby tier).
 * Each job can be toggled via its `envKey` (set to "off"/"false"/"0" to skip),
 * and triggered individually with `/api/cron?job=<id>` once you upgrade to a
 * plan with multiple cron schedules.
 */
export interface CronJob {
  id: string;
  /** Env var that disables this job when set to off/false/0. */
  envKey: string;
  /** Whether the job runs when its env var is unset. */
  defaultOn: boolean;
  run: () => Promise<unknown>;
}

export function isJobEnabled(job: CronJob): boolean {
  const v = process.env[job.envKey];
  if (v == null || v === "") return job.defaultOn;
  return !["off", "false", "0", "no"].includes(v.trim().toLowerCase());
}

/** Notify admins about leads whose follow-up date has passed. */
async function runLeadFollowUps(): Promise<{ processed: number }> {
  const due = await new ListDueFollowUpsUseCase(
    container.leadRepository,
  ).execute();
  if (due.length > 0) {
    await container.notificationService.notifyAdmins({
      type: "lead_follow_up_due",
      title: "ลีดถึงกำหนดติดตาม",
      body: `มี ${due.length} ลีดถึงกำหนดติดตามแล้ว — เปิดดูเพื่อวางแผนลงพื้นที่`,
      linkUrl: "/admin/leads",
    });
  }
  return { processed: due.length };
}

/** Housekeeping: purge expired sessions so the table doesn't grow unbounded. */
async function runCleanup(): Promise<{ deletedSessions: number }> {
  const deletedSessions = await container.sessionRepository.deleteExpired(
    new Date(),
  );
  return { deletedSessions };
}

export const CRON_JOBS: CronJob[] = [
  {
    id: "lead-follow-ups",
    envKey: "CRON_LEAD_FOLLOWUPS",
    defaultOn: true,
    run: runLeadFollowUps,
  },
  {
    id: "cleanup",
    envKey: "CRON_CLEANUP",
    defaultOn: true,
    run: runCleanup,
  },
];
