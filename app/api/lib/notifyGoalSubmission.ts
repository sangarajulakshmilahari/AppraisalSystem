import type { Pool, RowDataPacket } from "mysql2/promise";
import { sendEmail } from "@/lib/email/mailService";
import { buildGoalSubmissionEmail } from "@/lib/email/templates/goalSubmissionEmail";
import { getReportingHierarchy, uniqueReviewers } from "./getReportingHierarchy";

const NOTIFICATION_TITLE = "Goals Submitted";
const REVIEW_PATH = "/webpage/manager/team-goals";

type NotifyGoalSubmissionInput = {
  pool: Pool;
  employeeKeycloakId: string;
  employeeUsername: string;
  appraisalId: number;
  cycleName: string;
  fallbackManagerUserId: number | null;
};

function appBaseUrl(): string {
  return (process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

function formatSubmissionDate(date = new Date()): string {
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function isValidEmail(email: string | null | undefined): email is string {
  const value = (email || "").trim();
  return value.includes("@") && value.length > 3;
}

function cycleLabel(cycleName: string): string {
  const name = (cycleName || "Appraisal Cycle").trim();
  return /appraisal/i.test(name) ? name : `${name} Annual Appraisal`;
}

function notificationMessage(employeeName: string, cycleName: string): string {
  return `${employeeName} has successfully submitted their goals for the ${cycleLabel(cycleName)}. The employee's goals are now ready for your review.`;
}

export async function notifyGoalSubmission(input: NotifyGoalSubmissionInput): Promise<void> {
  const { employee, teamLead, manager } = await getReportingHierarchy(
    input.pool,
    input.employeeKeycloakId,
    input.fallbackManagerUserId
  );

  const employeeName = employee?.name || input.employeeUsername;
  const employeeId = employee?.employeeCode || "—";
  const designation = employee?.designation || "—";
  const department = employee?.region || null;
  const cycleName = input.cycleName || "Appraisal Cycle";
  const submissionDate = formatSubmissionDate();
  const reviewUrl = `${appBaseUrl()}${REVIEW_PATH}`;
  const message = notificationMessage(employeeName, cycleName);

  const recipients = uniqueReviewers(teamLead, manager);
  if (recipients.length === 0) {
    console.error(
      `[goal-submit] No Team Lead/Manager recipients found for employee keycloak_id=${input.employeeKeycloakId}, appraisal_id=${input.appraisalId}`
    );
    return;
  }

  for (const recipient of recipients) {
    try {
      if (recipient.userId) {
        const [existing] = await input.pool.query<RowDataPacket[]>(
          `SELECT id
           FROM notifications
           WHERE user_id = ?
             AND title = ?
             AND message = ?
           LIMIT 1`,
          [recipient.userId, NOTIFICATION_TITLE, message]
        );

        if (existing.length > 0) {
          console.log(
            `[goal-submit] In-app notification already exists for user_id=${recipient.userId}, appraisal_id=${input.appraisalId}`
          );
        } else {
          await input.pool.query(
            `INSERT INTO notifications (user_id, title, message, type, link_url)
             VALUES (?, ?, ?, 'action', ?)`,
            [recipient.userId, NOTIFICATION_TITLE, message, REVIEW_PATH]
          );
        }
      }

      if (!isValidEmail(recipient.email)) {
        console.error(
          `[goal-submit] Email skipped: missing/invalid email for recipient "${recipient.name}" (aaram_id=${recipient.aaramEmployeeId}, user_id=${recipient.userId ?? "n/a"}), appraisal_id=${input.appraisalId}`
        );
        continue;
      }

      const template = buildGoalSubmissionEmail({
        recipientName: recipient.name,
        employeeName,
        employeeId,
        designation,
        department,
        cycleName,
        submissionDate,
        reviewUrl,
      });

      const result = await sendEmail({
        to: recipient.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (!result.ok) {
        console.error(
          `[goal-submit] Email failed for "${recipient.name}" <${recipient.email}> appraisal_id=${input.appraisalId}: ${result.error}`
        );
      }
    } catch (err) {
      console.error(
        `[goal-submit] Notification failed for "${recipient.name}" (aaram_id=${recipient.aaramEmployeeId}), appraisal_id=${input.appraisalId}:`,
        err
      );
    }
  }
}
