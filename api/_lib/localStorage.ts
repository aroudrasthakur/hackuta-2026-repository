import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DB_FILE = join(process.cwd(), ".vercel", "registrations.json");

interface Database {
  codes: Record<string, { code: string; attempts: number; expiresAt: number }>;
  registrations: Record<
    string,
    { email: string; firstName: string; submittedAt: string; [key: string]: unknown }
  >;
  cooldowns: Record<string, number>;
}

function load(): Database {
  try {
    const content = readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return { codes: {}, registrations: {}, cooldowns: {} };
  }
}

function save(db: Database): void {
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export async function get<T>(key: string): Promise<T | null> {
  const db = load();
  const [type, ...rest] = key.split(":");
  const id = rest.join(":");

  if (type === "register" && "code" in db.codes) {
    return (db.codes[id] ?? null) as T | null;
  }
  if (type === "registration") {
    return (db.registrations[id] ?? null) as T | null;
  }
  if (type === "cooldown") {
    const expiry = db.cooldowns[id];
    if (expiry && Date.now() < expiry) return ("1" as unknown) as T;
    return null;
  }
  return null;
}

export async function set(
  key: string,
  value: unknown,
  options?: { ex?: number; keepTtl?: boolean },
): Promise<void> {
  const db = load();
  const [type, ...rest] = key.split(":");
  const id = rest.join(":");

  if (type === "register:code") {
    db.codes[id] = {
      ...(value as Record<string, unknown>),
      expiresAt: Date.now() + (options?.ex ?? 600) * 1000,
    } as Database["codes"][string];
  } else if (type === "registration") {
    db.registrations[id] = value as Database["registrations"][string];
  } else if (type === "register:cooldown") {
    db.cooldowns[id] = Date.now() + (options?.ex ?? 60) * 1000;
  }

  save(db);
}

export async function del(key: string): Promise<void> {
  const db = load();
  const [type, ...rest] = key.split(":");
  const id = rest.join(":");

  if (type === "register" && "code" in db.codes) {
    delete db.codes[id];
  } else if (type === "registration") {
    delete db.registrations[id];
  } else if (type === "register:cooldown") {
    delete db.cooldowns[id];
  }

  save(db);
}

export async function sadd(key: string, value: string): Promise<void> {
  // No-op for local dev (registrations are stored separately)
}

export function cleanupExpired(): void {
  const db = load();
  const now = Date.now();
  for (const id in db.codes) {
    if (db.codes[id].expiresAt < now) {
      delete db.codes[id];
    }
  }
  save(db);
}
