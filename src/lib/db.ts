/* eslint-disable @typescript-eslint/no-explicit-any */
import { getRequestContext } from '@cloudflare/next-on-pages';

async function queryBridge(action: string, sql: string, params: any[] = []) {
  try {
    const res = await fetch('http://127.0.0.1:3002', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, sql, params }),
    });
    const data = await res.json() as any;
    if (data.error) {
      throw new Error(data.error);
    }
    return data.result;
  } catch (err: any) {
    console.error('[DB CONNECTION ERROR] Failed to connect to local database bridge:', err.message);
    throw new Error('Local database connection failed: Make sure "node db-bridge.js" is running in the background.');
  }
}

export const db = {
  async get<T>(sql: string, ...params: any[]): Promise<T | undefined> {
    try {
      const context = getRequestContext();
      const env = context?.env as any;
      if (env?.DB) {
        return await env.DB.prepare(sql).bind(...params).first();
      }
    } catch {
      // Fallback to local dev database bridge
    }
    return await queryBridge('get', sql, params) as T | undefined;
  },
  
  async all<T>(sql: string, ...params: any[]): Promise<T[]> {
    try {
      const context = getRequestContext();
      const env = context?.env as any;
      if (env?.DB) {
        const { results } = await env.DB.prepare(sql).bind(...params).all();
        return results as T[];
      }
    } catch {
      // Fallback
    }
    return await queryBridge('all', sql, params) as T[];
  },
  
  async run(sql: string, ...params: any[]): Promise<{ changes: number; lastInsertRowid: number | null }> {
    try {
      const context = getRequestContext();
      const env = context?.env as any;
      if (env?.DB) {
        const res = await env.DB.prepare(sql).bind(...params).run();
        return {
          changes: res.meta.changes || 0,
          lastInsertRowid: res.meta.last_row_id || null,
        };
      }
    } catch {
      // Fallback
    }
    return await queryBridge('run', sql, params);
  },
  
  async exec(sql: string): Promise<void> {
    try {
      const context = getRequestContext();
      const env = context?.env as any;
      if (env?.DB) {
        await env.DB.exec(sql);
        return;
      }
    } catch {
      // Fallback
    }
    return await queryBridge('exec', sql);
  }
};

export default db;
