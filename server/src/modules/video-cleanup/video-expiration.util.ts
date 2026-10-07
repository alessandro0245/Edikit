import { PlanType } from '@generated/prisma/enums';

/**
 * Video download retention periods in days based on user's subscription tier:
 * Free: 3 days
 * Starter: 30 days
 * Creator: 60 days
 * Studio: 60 days
 * Agency: 60 days
 */
export const PLAN_RETENTION_DAYS: Record<PlanType, number> = {
  [PlanType.FREE]: 3,
  [PlanType.STARTER]: 30,
  [PlanType.CREATOR]: 60,
  [PlanType.STUDIO]: 60,
  [PlanType.AGENCY]: 60,
};

/**
 * Returns retention period in days for the given subscription plan tier.
 * Defaults to PlanType.FREE (3 days) if null/undefined.
 */
export function getRetentionDays(planType?: PlanType | null): number {
  if (planType && planType in PLAN_RETENTION_DAYS) {
    return PLAN_RETENTION_DAYS[planType];
  }
  return PLAN_RETENTION_DAYS[PlanType.FREE];
}

/**
 * Calculates the exact expiration timestamp for a generated video.
 * Retention starts at video completion time.
 *
 * NOTE FOR TESTING: You can set `VIDEO_RETENTION_MINUTES_OVERRIDE=1` in .env
 * to test expiration in minutes (or seconds) instead of waiting days.
 */
export function calculateExpirationDate(
  planType?: PlanType | null,
  startDate: Date = new Date(),
): Date {
  const overrideMinutes = process.env.VIDEO_RETENTION_MINUTES_OVERRIDE;
  if (overrideMinutes && !isNaN(Number(overrideMinutes))) {
    return new Date(startDate.getTime() + Number(overrideMinutes) * 60 * 1000);
  }

  const days = getRetentionDays(planType);
  return new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Determines whether a job has passed its retention expiration timestamp.
 * Legacy videos without an `expiresAt` timestamp (null/undefined) will return false,
 * guaranteeing they are protected from accidental deletion or access blocking.
 */
export function isJobExpired(
  job?: { expiresAt?: Date | string | null } | null,
  referenceTime: Date = new Date(),
): boolean {
  if (!job || !job.expiresAt) {
    return false;
  }
  const expiryTime = new Date(job.expiresAt).getTime();
  return expiryTime <= referenceTime.getTime();
}
