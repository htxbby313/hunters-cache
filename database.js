import pg from "pg";
import { mkdirSync } from "node:fs";
import path from "node:path";

const __dirname = process.cwd();
const usingNetlifyDatabase = Boolean(process.env.DATABASE_URL);
const databasePath = usingNetlifyDatabase ? "Neon Postgres" : process.env.DATABASE_PATH || path.join(__dirname, "data", "hunters-cache.db");
const postgresPool = usingNetlifyDatabase ? new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 }) : null;
let sqliteDatabase = null;

async function getSqliteDatabase() {
  if (sqliteDatabase) return sqliteDatabase;
  mkdirSync(path.dirname(databasePath), { recursive: true });
  const sqliteModule = ["node", "sqlite"].join(":");
  const { DatabaseSync } = await import(sqliteModule);
  sqliteDatabase = new DatabaseSync(databasePath);
  sqliteDatabase.exec("PRAGMA foreign_keys = ON");
  sqliteDatabase.exec("PRAGMA journal_mode = WAL");
  sqliteDatabase.exec("PRAGMA busy_timeout = 5000");
  return sqliteDatabase;
}

export async function runQuery(query) {
  if (usingNetlifyDatabase) {
    const result = await postgresPool.query(query);
    return result.rows;
  }
  const database = await getSqliteDatabase();
  const command = query.trim().split(/\s+/, 1)[0].toUpperCase();
  if (["SELECT", "WITH", "PRAGMA"].includes(command)) return database.prepare(query).all();
  database.exec(query);
  return [];
}

export function closeDatabase() {
  if (sqliteDatabase) {
    sqliteDatabase.close();
    sqliteDatabase = null;
  }
  if (postgresPool) return postgresPool.end();
}

export { databasePath, usingNetlifyDatabase };
