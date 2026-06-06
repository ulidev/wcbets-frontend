import type { components } from '@/types/api';

type DeadlineConfigResponse = components['schemas']['DeadlineConfigResponse'];
type DeadlineType = components['schemas']['DeadlineType'];

export function deadlineHasPassed(
  deadlines: DeadlineConfigResponse[],
  type: DeadlineType,
): boolean {
  const config = deadlines.find((d) => d.deadline_type === type);
  if (!config) return false;
  return new Date() >= new Date(config.deadline_dt);
}
