import {
  buildAppraisalSubmissionEmail,
  type AppraisalSubmissionEmailParams,
} from "./appraisalSubmissionEmail";

export type GoalSubmissionEmailParams = Omit<AppraisalSubmissionEmailParams, "notificationType">;

export function buildGoalSubmissionEmail(params: GoalSubmissionEmailParams) {
  return buildAppraisalSubmissionEmail({
    ...params,
    notificationType: "GOAL_SUBMISSION",
  });
}
