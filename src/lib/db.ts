import mysql from "mysql2/promise";

type DbConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

function mask(value: string | undefined | null) {
  if (!value) return "";
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}****${value.slice(-2)}`;
}

function logDbEnvOnce() {
  // Avoid noisy logs in production: log once per process.
  const g = globalThis as unknown as { __gkhbs_db_env_logged?: boolean };
  if (g.__gkhbs_db_env_logged) return;
  g.__gkhbs_db_env_logged = true;

  const isProd = process.env.NODE_ENV === "production";
  const allowSecrets = process.env.LOG_DB_PASSWORD === "1";

  console.log("[db] env check", {
    DB_HOST: process.env.DB_HOST || "(default)",
    DB_PORT: process.env.DB_PORT || "(default 3306)",
    DB_NAME: process.env.DB_NAME ? mask(process.env.DB_NAME) : "(missing)",
    DB_USER: process.env.DB_USER ? mask(process.env.DB_USER) : "(missing)",
    DB_PASSWORD: process.env.DB_PASSWORD
      ? isProd
        ? "(set)"
        : allowSecrets
          ? process.env.DB_PASSWORD
          : `(set, length=${process.env.DB_PASSWORD.length})`
      : "(missing)",
  });
}

function getDbConfig(): DbConfig | null {
  logDbEnvOnce();
  const database = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  if (!database || !user || !password) return null;

  const host = process.env.DB_HOST || "127.0.0.1";
  const port = Number(process.env.DB_PORT || "3306");
  return {
    host,
    port: Number.isFinite(port) ? port : 3306,
    user,
    password,
    database,
  };
}

let pool: mysql.Pool | null = null;

export function isDbConfigured() {
  return Boolean(getDbConfig());
}

export function getDbPool() {
  if (pool) return pool;
  const cfg = getDbConfig();
  if (!cfg) {
    throw new Error("db_not_configured");
  }
  pool = mysql.createPool({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Hostinger shared MySQL often needs this.
    enableKeepAlive: true,
  });
  return pool;
}
