// app/api/lib/db.ts
import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;
let aaramPool: mysql.Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "appraisal_db",
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

// AARAM database pool (for future direct queries if needed)
export function getAaramPool() {
  if (!aaramPool) {
    aaramPool = mysql.createPool({
      host: process.env.AARAM_DB_HOST || process.env.DB_HOST || "localhost",
      port: Number(process.env.AARAM_DB_PORT) || Number(process.env.DB_PORT) || 3306,
      user: process.env.AARAM_DB_USER || process.env.DB_USER || "root",
      password: process.env.AARAM_DB_PASSWORD || process.env.DB_PASSWORD || "",
      database: process.env.AARAM_DB_NAME || "aaram_db",
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return aaramPool;
}