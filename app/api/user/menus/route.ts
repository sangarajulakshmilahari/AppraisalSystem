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

    const menus = Array.isArray(rows) ? ([...rows] as Array<{ menu_id: number; menu_name: string; menu_order: number }>) : [];
    const existingNames = new Set(menus.map((m) => m.menu_name));

    // Safety fallback: always include core navigation items even when DB role permissions miss them.
    // This avoids role-specific misconfiguration hiding Profile/Help for Team Lead/Manager users.
    const requiredMenus = ["My Profile", "Help"];
    for (const menuName of requiredMenus) {
      if (existingNames.has(menuName)) continue;

      const [menuRows] = await pool.query(
        `SELECT menu_id, menu_name, menu_order
         FROM menus
         WHERE menu_name = ?
         LIMIT 1`,
        [menuName]
      );

      const row = Array.isArray(menuRows) ? (menuRows as Array<{ menu_id: number; menu_name: string; menu_order: number }>)[0] : null;
      if (row) {
        menus.push(row);
        existingNames.add(row.menu_name);
      }
    }

    menus.sort((a, b) => {
      if (a.menu_order !== b.menu_order) return a.menu_order - b.menu_order;
      return a.menu_id - b.menu_id;
    });

    return NextResponse.json({ roleId: Number(roleId), menus });
  } catch (error: any) {
    console.error("GET /api/user/menus error:", error);
    return NextResponse.json(
      { error: "Failed to fetch menus", details: error.message },
      { status: 500 }
    );
  }
}
