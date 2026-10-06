export type GoalSubmissionEmailParams = {
  recipientName: string;
  employeeName: string;
  employeeId: string;
  designation: string;
  department?: string | null;
  cycleName: string;
  submissionDate: string;
  reviewUrl: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;")
    .replace(/'/g, "\u0026#39;");
}

export function buildGoalSubmissionEmail(params: GoalSubmissionEmailParams) {
  const recipientName = escapeHtml(params.recipientName || "there");
  const employeeName = escapeHtml(params.employeeName);
  const employeeId = escapeHtml(params.employeeId || "—");
  const designation = escapeHtml(params.designation || "—");
  const cycleLabel = /appraisal/i.test(params.cycleName || "")
    ? params.cycleName
    : `${params.cycleName} Annual Appraisal`;
  const cycleName = escapeHtml(cycleLabel);
  const submissionDate = escapeHtml(params.submissionDate);
  const reviewUrl = params.reviewUrl;
  const department = params.department?.trim() ? escapeHtml(params.department.trim()) : "";

  const subject = `Goal Submission Notification - ${params.employeeName} - ${params.cycleName}`;

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
                <p style="margin:6px 0 0;color:#dbeafe;font-size:13px;">Goal Submission Notification</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0f172a;">Goal Submission Notification</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">Hello ${recipientName},</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
                  <strong>${employeeName}</strong> has successfully submitted their goals for the
                  <strong>${cycleName}</strong>.
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
                          <td style="padding:6px 0;color:#475569;font-size:14px;">Submission Date:</td>
                          <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${submissionDate}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <p style="margin:20px 0;font-size:15px;line-height:1.6;color:#334155;">
                  The employee's goals are now ready for your review.
                </p>
                <a href="${reviewUrl}"
                   style="display:inline-block;background:#f26522;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;">
                  Review Goals
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 28px 22px;color:#94a3b8;font-size:12px;">
                This is an automated notification from AASA Performance Management.
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

Goal Submission Notification

Hello ${params.recipientName || "there"},

${params.employeeName} has successfully submitted their goals for the ${cycleLabel}.

Employee Details:
- Employee Name: ${params.employeeName}
- Employee ID: ${params.employeeId || "—"}
- Designation: ${params.designation || "—"}
${departmentText}- Appraisal Cycle: ${params.cycleName}
- Submission Date: ${params.submissionDate}

The employee's goals are now ready for your review.

Review Goals: ${reviewUrl}
`;

  return { subject, html, text };
}
