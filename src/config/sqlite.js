import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let databasePromise;
let filePath;

const databasePath = () => {
  if (process.env.VERCEL) return "/tmp/vampire-token-auth.db";
  return path.resolve(__dirname, "../../", process.env.SQLITE_DB_PATH || "data/auth.db");
};

export const getDatabase = async () => {
  if (databasePromise) return databasePromise;

  databasePromise = (async () => {
    filePath = databasePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const SQL = await initSqlJs({
      locateFile: (file) => path.join(__dirname, "../../node_modules/sql.js/dist", file),
    });
    const savedDatabase = fs.existsSync(filePath) ? fs.readFileSync(filePath) : undefined;
    const db = new SQL.Database(savedDatabase);
    db.run("PRAGMA foreign_keys = ON");
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS token_usage (
        jti TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        remaining_uses INTEGER NOT NULL DEFAULT 10 CHECK (remaining_uses BETWEEN 0 AND 10),
        revoked_at INTEGER,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage(user_id);
      CREATE INDEX IF NOT EXISTS idx_token_usage_expires_at ON token_usage(expires_at);
    `);
    persistDatabase(db);
    return db;
  })();

  return databasePromise;
};

export const persistDatabase = (db) => fs.writeFileSync(filePath, Buffer.from(db.export()));
export const initializeDatabase = () => getDatabase();
