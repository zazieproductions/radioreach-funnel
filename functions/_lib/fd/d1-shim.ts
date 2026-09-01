/**
 * In-process D1 + KV implementation used by the local dev middleware and the
 * test suite. Production runs the same handler code against real D1.
 *
 * node:sqlite executes exactly the same SQL as D1 (both are SQLite), so
 * migration files ship to prod having already been exercised here.
 */
import { DatabaseSync } from "node:sqlite";
import type { D1Database, D1PreparedStatement, D1Result } from "../types";

export function createD1(db: DatabaseSync): D1Database {
  return {
    prepare(query: string): D1PreparedStatement {
      const values: unknown[] = [];
      const stmt: D1PreparedStatement = {
        bind(...vs: unknown[]) {
          values.push(...vs.map(normalizeBinding));
          return stmt;
        },
        async all<T>() {
          const s = db.prepare(query);
          const results = s.all(...(values as never[])) as T[];
          return { results, meta: {}, success: true } as D1Result<T> & { success: boolean };
        },
        async first<T>() {
          const s = db.prepare(query);
          const rows = s.all(...(values as never[])) as T[];
          return rows.length ? rows[0] : null;
        },
        async run() {
          const s = db.prepare(query);
          const r = s.run(...(values as never[]));
          return { results: [], meta: { changes: Number(r.changes ?? 0), last_row_id: Number(r.lastInsertRowid ?? 0) }, success: true } as never;
        },
      };
      (stmt as unknown as { _values: unknown[] })._values = values;
      return stmt;
    },
    async batch(statements: D1PreparedStatement[]) {
      const out: D1Result[] = [];
      for (const s of statements) {
        out.push(await (s as unknown as { run(): Promise<D1Result> }).run());
      }
      return out;
    },
    async exec(query: string) {
      db.exec(query);
      return { count: 1 };
    },
  };
}

function normalizeBinding(v: unknown): unknown {
  if (v === undefined) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v === null || typeof v === "number" || typeof v === "string") return v;
  if (v instanceof Uint8Array || Buffer.isBuffer(v)) return v;
  return JSON.stringify(v);
}

export function createKV(): KVNamespace {
  const store = new Map<string, { value: string; expires: number }>();
  return {
    async get(key: string) {
      const e = store.get(key);
      if (!e) return null;
      if (e.expires && e.expires < Date.now()) { store.delete(key); return null; }
      return e.value;
    },
    async put(key: string, value: string, opts?: { expirationTtl?: number }) {
      store.set(key, { value, expires: opts?.expirationTtl ? Date.now() + opts.expirationTtl * 1000 : 0 });
    },
    async delete(key: string) { store.delete(key); },
  } as unknown as KVNamespace;
}

declare global {
  interface KVNamespace {
    get(key: string): Promise<string | null>;
    put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
  }
}
