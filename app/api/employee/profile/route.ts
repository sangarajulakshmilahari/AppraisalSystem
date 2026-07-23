// app/api/employee/profile/route.ts
import { NextResponse } from "next/server";
import { getPool } from "../../lib/db";
import { getCurrentUser, getActiveAppraisal } from "../../lib/getuser";

type DateLike = string | number | Date | null | undefined;

type UserRow = {
  id: number;
  username: string;
  email: string;
  keycloak_id: string;
  created_at: DateLike;
};

type RoleRow = { role_name: string };
type ManagerRow = { username: string };
type ResumeRow = {
  ResumeId: number;
  OriginalFileName: string;
  StoredFileName: string;
  FilePath: string;
  MimeType: string;
  FileSize: number;
  UploadedAt: DateLike;
  IsCurrent: number;
  Version: number;
};

type DbError = {
  code?: string;
  message?: string;
};

function formatDate(d: DateLike): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function addMonths(base: Date, months: number) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    // Get user details
    const [userRows] = await pool.query(
      "SELECT * FROM users WHERE id = ?",
      [user.id]
    );
    const userInfo = (userRows as UserRow[])[0];

    // Get user's roles
    const [roles] = await pool.query(
      `SELECT r.role_name FROM user_roles ur
       JOIN roles r ON ur.role_id = r.role_id
       WHERE ur.user_id = ?
       ORDER BY r.role_id`,
      [user.id]
    );

    // Get active appraisal info
    const active = await getActiveAppraisal(user.id);
    let cycleInfo = null;
    let managerName = null;

    if (active) {
      const { cycle, appraisal } = active;
      cycleInfo = {
        cycleName: cycle.cycle_name,
        currentPhase: appraisal.current_phase,
        periodStart: formatDate(cycle.period_start),
        periodEnd: formatDate(cycle.period_end),
      };

      if (appraisal.manager_id) {
        const [mgr] = await pool.query("SELECT username FROM users WHERE id = ?", [appraisal.manager_id]);
        if ((mgr as ManagerRow[]).length > 0) managerName = (mgr as ManagerRow[])[0].username;
      }
    }

    let resume: ResumeRow | null = null;
    try {
      const [resumeRows] = await pool.query(
        `SELECT ResumeId, OriginalFileName, StoredFileName, FilePath, MimeType, FileSize, UploadedAt, IsCurrent, Version
         FROM user_resumes
         WHERE UserId = ? AND IsCurrent = 1
         ORDER BY UploadedAt DESC
         LIMIT 1`,
        [user.id]
      );
      resume = (resumeRows as ResumeRow[])[0] || null;
    } catch (resumeError: unknown) {
      const dbErr = resumeError as DbError;
      // Migration may not be applied yet; keep profile endpoint functional.
      if (dbErr?.code !== "ER_NO_SUCH_TABLE") {
        throw resumeError;
      }
    }

    const resumeDueDate = resume?.UploadedAt ? addMonths(new Date(resume.UploadedAt), 6) : null;
    const resumeStale = resumeDueDate ? Date.now() >= resumeDueDate.getTime() : false;

    return NextResponse.json({
      profile: {
        id: userInfo.id,
        username: userInfo.username,
        email: userInfo.email,
        keycloakId: userInfo.keycloak_id,
        createdAt: formatDate(userInfo.created_at),
        roles: (roles as RoleRow[]).map((r) => r.role_name),
        managerName,
        resume: resume
          ? {
              id: resume.ResumeId,
              fileName: resume.OriginalFileName,
              filePath: resume.FilePath,
              mimeType: resume.MimeType,
              fileSizeBytes: resume.FileSize,
              uploadedAt: formatDate(resume.UploadedAt),
              dueDate: resumeDueDate ? formatDate(resumeDueDate) : null,
              stale: resumeStale,
              reminderSentAt: null,
            }
          : null,
      },
      cycle: cycleInfo,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load profile";
    console.error("GET /api/employee/profile error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
