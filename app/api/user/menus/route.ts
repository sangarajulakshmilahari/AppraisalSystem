// app/api/user/menus/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../lib/db";

export async function GET(req: NextRequest) {
  try {
    const roleId = req.nextUrl.searchParams.get("roleId");

    if (!roleId) {
      return NextResponse.json(
        { error: "roleId query parameter is required" },
        { status: 400 }
      );
    }

    const pool = getPool();

    const [rows] = await pool.query(
      `SELECT m.menu_id, m.menu_name, m.menu_order
       FROM role_menu_permissions rmp
       JOIN menus m ON rmp.menu_id = m.menu_id
       WHERE rmp.role_id = ?
       ORDER BY m.menu_order`,
      [roleId]
    );

    return NextResponse.json({ roleId: Number(roleId), menus: rows });
  } catch (error: any) {
    console.error("GET /api/user/menus error:", error);
    return NextResponse.json(
      { error: "Failed to fetch menus", details: error.message },
      { status: 500 }
    );
  }
}