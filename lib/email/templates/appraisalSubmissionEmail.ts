export type AppraisalNotificationType =
  | "GOAL_SUBMISSION"
  | "SELF_ASSESSMENT_SUBMISSION"
  | "COMPETENCY_SUBMISSION";

export type AppraisalSubmissionEmailParams = {
  notificationType: AppraisalNotificationType;
  recipientName: string;
  employeeName: string;
  employeeId: string;
  designation: string;
  department?: string | null;
  cycleName: string;
  submissionDate: string;
  reviewUrl: string;
};

const COPY: Record<
  AppraisalNotificationType,
  {
    subjectPrefix: string;
    heading: string;
    item: string;
    button: string;
    ready: string;
  }
> = {
  GOAL_SUBMISSION: {
    subjectPrefix: "Goal Submission Notification",
    heading: "Goal Submission Notification",
    item: "goals",
    button: "Review Goals",
    ready: "goals",
  },
  SELF_ASSESSMENT_SUBMISSION: {
    subjectPrefix: "Self-Assessment Submission Notification",
    heading: "Self-Assessment Submission Notification",
    item: "Self-Assessment",
    button: "Review Self-Assessment",
    ready: "self-assessment",
  },
  COMPETENCY_SUBMISSION: {
    subjectPrefix: "Competency Assessment Submission Notification",
    heading: "Competency Assessment Submission Notification",
    item: "Competency Assessment",
    button: "Review Competency",
    ready: "competency assessment",
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;")
    .replace(/'/g, "\u0026#39;");
}

export function cycleLabel(cycleName: string): string {
  const name = (cycleName || "Appraisal Cycle").trim();
  return /appraisal/i.test(name) ? name : `${name} Annual Appraisal`;
}

export function buildAppraisalSubmissionEmail(params: AppraisalSubmissionEmailParams) {
  const copy = COPY[params.notificationType];
  const recipientName = escapeHtml(params.recipientName || "there");
  const employeeName = escapeHtml(params.employeeName);
  const employeeId = escapeHtml(params.employeeId || "—");
  const designation = escapeHtml(params.designation || "—");
  const labeledCycle = cycleLabel(params.cycleName);
  const cycleName = escapeHtml(labeledCycle);
  const submissionDate = escapeHtml(params.submissionDate);
  const reviewUrl = params.reviewUrl;
  const department = params.department?.trim() ? escapeHtml(params.department.trim()) : "";
  const subject = `${copy.subjectPrefix} - ${params.employeeName} - ${params.cycleName}`;

  const departmentRow = department
    ? `<tr>
        <td style="padding:6px 0;color:#475569;font-size:14px;">Department/Team:</td>
        <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${department}</td>
      </tr>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="background:#1f3a68;padding:22px 28px;">
                <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.02em;">AASA Performance Management</p>
                <p style="margin:6px 0 0;color:#dbeafe;font-size:13px;">${copy.heading}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0f172a;">${copy.heading}</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">Hello ${recipientName},</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
                  <strong>${employeeName}</strong> has successfully submitted their ${copy.item}
                  for the <strong>${cycleName}</strong>.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;">
                  <tr>
                    <td>
                      <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1f3a68;text-transform:uppercase;letter-spacing:0.04em;">Employee Details</p>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:6px 0;color:#475569;font-size:14px;width:180px;">Employee Name:</td>
                          <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${employeeName}</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;color:#475569;font-size:14px;">Employee ID:</td>
                          <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${employeeId}</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;color:#475569;font-size:14px;">Designation:</td>
                          <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${designation}</td>
                        </tr>
                        ${departmentRow}
                        <tr>
                          <td style="padding:6px 0;color:#475569;font-size:14px;">Appraisal Cycle:</td>
                          <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${cycleName}</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;color:#475569;font-size:14px;">Submitted On:</td>
                          <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${submissionDate}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <p style="margin:20px 0;font-size:15px;line-height:1.6;color:#334155;">
                  The ${copy.ready} is now ready for your review.
                </p>
                <a href="${reviewUrl}"
                   style="display:inline-block;background:#f26522;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;">
                  ${copy.button}
                </a>
                <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#334155;">
                  Regards,<br />
                  AASA Performance Management System
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const departmentText = department ? `- Department/Team: ${params.department}\n` : "";
  const text = `AASA Performance Management

${copy.heading}

Hello ${params.recipientName || "there"},

${params.employeeName} has successfully submitted their ${copy.item} for the ${labeledCycle}.

Employee Details:
- Employee Name: ${params.employeeName}
- Employee ID: ${params.employeeId || "—"}
- Designation: ${params.designation || "—"}
${departmentText}- Appraisal Cycle: ${labeledCycle}
- Submitted On: ${params.submissionDate}

The ${copy.ready} is now ready for your review.

${copy.button}: ${reviewUrl}

Regards,
AASA Performance Management System
`;

  return { subject, html, text };
}
