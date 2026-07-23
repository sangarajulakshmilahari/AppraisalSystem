import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getPool } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/getuser";

type ResumeRow = {
  ResumeId: number;
  UserId: number;
  OriginalFileName: string;
  StoredFileName: string;
  FilePath: string;
  MimeType: string;
  FileSize: number;
  IsCurrent: number;
  Version: number;
  UploadedAt: Date;
  UploadedBy: number;
};

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function sanitizeFileName(input: string) {
  return input.replace(/[^a-zA-Z0-9._-]/g, "_");
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
    const [rows] = await pool.query(
      `SELECT ResumeId, UserId, OriginalFileName, StoredFileName, FilePath, MimeType, FileSize, IsCurrent, Version, UploadedAt, UploadedBy
       FROM user_resumes
       WHERE UserId = ? AND IsCurrent = 1
       ORDER BY UploadedAt DESC
       LIMIT 1`,
      [user.id]
    );

    const resume = (rows as ResumeRow[])[0];
    if (!resume) {
      return NextResponse.json({
        resume: null,
        stale: false,
        dueDate: null,
      });
    }

    const dueDate = addMonths(new Date(resume.UploadedAt), 6);
    const stale = Date.now() >= dueDate.getTime();

    return NextResponse.json({
      resume: {
        id: resume.ResumeId,
        fileName: resume.OriginalFileName,
        filePath: resume.FilePath,
        mimeType: resume.MimeType,
        fileSizeBytes: resume.FileSize,
        uploadedAt: new Date(resume.UploadedAt).toISOString(),
        reminderSentAt: null,
      },
      stale,
      dueDate: dueDate.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch resume";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("resume");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Resume file is required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only PDF, DOC, and DOCX files are allowed" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be <= 5MB" }, { status: 400 });
    }

    const safeName = sanitizeFileName(file.name || "resume");
    const ext = path.extname(safeName) || ".pdf";
    const base = path.basename(safeName, ext);
    const stamp = Date.now();
    const finalName = `${base}_${stamp}${ext}`;
    const relativeDir = path.posix.join("uploads", "resumes", String(user.id));
    const relativePath = path.posix.join("/", relativeDir, finalName);

    const diskDir = path.join(process.cwd(), "public", "uploads", "resumes", String(user.id));
    const diskPath = path.join(diskDir, finalName);
    await mkdir(diskDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    await writeFile(diskPath, Buffer.from(arrayBuffer));

    const pool = getPool();
    const [versionRows] = await pool.query(
      "SELECT COALESCE(MAX(Version), 0) AS maxVersion FROM user_resumes WHERE UserId = ?",
      [user.id]
    );
    const maxVersion = Number((versionRows as Array<{ maxVersion: number }>)[0]?.maxVersion || 0);
    const nextVersion = maxVersion + 1;

    await pool.query("UPDATE user_resumes SET IsCurrent = 0 WHERE UserId = ? AND IsCurrent = 1", [user.id]);

    await pool.query(
      `INSERT INTO user_resumes
       (UserId, OriginalFileName, StoredFileName, FilePath, FileSize, MimeType, UploadedAt, UploadedBy, IsCurrent, Version)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, 1, ?)`,
      [user.id, safeName, finalName, relativePath, file.size, file.type, user.id, nextVersion]
    );

    return NextResponse.json({ success: true, filePath: relativePath });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload resume";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

