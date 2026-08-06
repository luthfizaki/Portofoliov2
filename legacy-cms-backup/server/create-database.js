import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(projectRoot, ".env"), quiet: true });
dotenv.config({
  path: path.join(projectRoot, ".env.local"),
  override: true,
  quiet: true
});

const databaseName = process.env.DB_NAME || "portfolio_v2";
if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(databaseName)) {
  throw new Error("DB_NAME must be a valid PostgreSQL identifier.");
}

const client = new pg.Client({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number.parseInt(process.env.DB_PORT || "5432", 10),
  database: process.env.DB_MAINTENANCE_NAME || "postgres",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  ssl:
    process.env.DB_SSL === "true"
      ? { rejectUnauthorized: false }
      : false
});

await client.connect();
const existing = await client.query(
  "SELECT 1 FROM pg_database WHERE datname = $1",
  [databaseName]
);

if (existing.rowCount === 0) {
  await client.query(`CREATE DATABASE "${databaseName}"`);
  console.log(`Created PostgreSQL database: ${databaseName}`);
} else {
  console.log(`PostgreSQL database already exists: ${databaseName}`);
}

await client.end();
