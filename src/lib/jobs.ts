import type { Job } from "@/lib/types";

export const EMPLOYMENT_LABELS: Record<Job["employment_type"], string> = {
  full_time: "Full time",
  part_time: "Part time",
  contract: "Contract",
  internship: "Internship",
  cofounder: "Co-founder",
  volunteer: "Volunteer",
};

export const WORKPLACE_LABELS: Record<Job["workplace_type"], string> = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

export function formatCompensation(job: Job): string | null {
  if (job.compensation_min === null && job.compensation_max === null) return null;
  const currency = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: job.compensation_currency,
    maximumFractionDigits: 0,
  });
  const range = job.compensation_min !== null && job.compensation_max !== null
    ? `${currency.format(job.compensation_min)}–${currency.format(job.compensation_max)}`
    : currency.format(job.compensation_min ?? job.compensation_max ?? 0);
  return job.compensation_period ? `${range} / ${job.compensation_period}` : range;
}
