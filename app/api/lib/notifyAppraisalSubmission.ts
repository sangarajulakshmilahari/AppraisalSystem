import type { Pool, RowDataPacket } from "mysql2/promise";
import { sendEmail } from "@/lib/email/mailService";
import {
  buildAppraisalSubmissionEmail,
  cycleLabel,
  type AppraisalNotificationType,
} from "@/lib/email/templates/appraisalSubmissionEmail";
import { getReportingHierarchy, uniqueReviewers, type HierarchyPerson } from "./getReportingHierarchy";

export type { AppraisalNotificationType };

type NotifyAppraisalSubmissionInput = {
  pool: Pool;
  notificationType: AppraisalNotificationType;
  employeeKeycloakId: string;
  employeeUsername: string;
  appraisalId: number;
  cycleName: string;
  fallbackManagerUserId: number | null;
};

const CONFIG: Record<
  AppraisalNotificationType,
  { title: string; item: string; log: string }
> = {
  GOAL_SUBMISSION: {
    title: "Goals Submitted",
    item: "goals",
    log: "goal-submit",
  },
  SELF_ASSESSMENT_SUBMISSION: {
    title: "Self-Assessment Submitted",
    item: "self-assessment",
    log: "self-assessment-submit",
  },
  COMPETENCY_SUBMISSION: {
    title: "Competency Assessment Submitted",
    item: "competency assessment",
    log: "competency-submit",
  },
};

function reviewPathFor(type: AppraisalNotificationType, recipient: HierarchyPerson): string {
  const role = (recipient.role || "").trim().toLowerCase();
  const isTeamLead = role === "manager";

  if (type === "GOAL_SUBMISSION") {
    return "/webpage/manager/team-goals";
  }
  if (type === "SELF_ASSESSMENT_SUBMISSION") {
    return "/webpage/manager/team-assessments";
  }
  return isTeamLead ? "/webpage/manager/team-assessments" : "/webpage/manager/competency-ratings";
}

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

function notificationMessage(employeeName: string, cycleName: string, item: string): string {
  return `Employee ${employeeName} has submitted their ${item} for ${cycleLabel(cycleName)}.`;
}

export async function notifyAppraisalSubmission(input: NotifyAppraisalSubmissionInput): Promise<void> {
  const config = CONFIG[input.notificationType];
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
  const message = notificationMessage(employeeName, cycleName, config.item);

  const recipients = uniqueReviewers(teamLead, manager);
  if (recipients.length === 0) {
    console.error(
      `[${config.log}] No Team Lead/Manager recipients found for employee keycloak_id=${input.employeeKeycloakId}, appraisal_id=${input.appraisalId}`
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
          [recipient.userId, config.title, message]
        );

        if (existing.length > 0) {
          console.log(
            `[${config.log}] In-app notification already exists for user_id=${recipient.userId}, appraisal_id=${input.appraisalId}`
          );
        } else {
          const reviewPath = reviewPathFor(input.notificationType, recipient);
          await input.pool.query(
            `INSERT INTO notifications (user_id, title, message, type, link_url)
             VALUES (?, ?, ?, 'action', ?)`,
            [recipient.userId, config.title, message, reviewPath]
          );
        }
      }

      if (!isValidEmail(recipient.email)) {
        console.error(
          `[${config.log}] Email skipped at ${submissionDate}: missing/invalid email for recipient "${recipient.name}" (aaram_id=${recipient.aaramEmployeeId}, user_id=${recipient.userId ?? "n/a"}), employee="${employeeName}", type=${input.notificationType}, appraisal_id=${input.appraisalId}`
        );
        continue;
      }

      const reviewPath = reviewPathFor(input.notificationType, recipient);
      const reviewUrl = `${appBaseUrl()}${reviewPath}`;
      const template = buildAppraisalSubmissionEmail({
        notificationType: input.notificationType,
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
          `[${config.log}] Email failed at ${submissionDate} for employee="${employeeName}", type=${input.notificationType}, recipient="${recipient.name}" <${recipient.email}>, appraisal_id=${input.appraisalId}: ${result.error}`
        );
      }
    } catch (err) {
      console.error(
        `[${config.log}] Notification failed at ${submissionDate} for employee="${employeeName}", type=${input.notificationType}, recipient="${recipient.name}" (aaram_id=${recipient.aaramEmployeeId}), appraisal_id=${input.appraisalId}:`,
        err
      );
    }
  }
}
