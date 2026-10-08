import type { Pool } from "mysql2/promise";
import { notifyAppraisalSubmission } from "./notifyAppraisalSubmission";

type NotifyGoalSubmissionInput = {
  pool: Pool;
  employeeKeycloakId: string;
  employeeUsername: string;
  appraisalId: number;
  cycleName: string;
  fallbackManagerUserId: number | null;
};

export async function notifyGoalSubmission(input: NotifyGoalSubmissionInput): Promise<void> {
  await notifyAppraisalSubmission({
    ...input,
    notificationType: "GOAL_SUBMISSION",
  });
}
