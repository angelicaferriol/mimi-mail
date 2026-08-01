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
    let env: any = null;
    try {
      const context = getRequestContext();
      env = context?.env;
    } catch {
      // Not in Cloudflare environment
    }

    if (env?.DB) {
      return await env.DB.prepare(sql).bind(...params).first();
    }
    return await queryBridge('get', sql, params) as T | undefined;
  },
  
  async all<T>(sql: string, ...params: any[]): Promise<T[]> {
    let env: any = null;
    try {
      const context = getRequestContext();
      env = context?.env;
    } catch {
      // Not in Cloudflare environment
    }

    if (env?.DB) {
      const { results } = await env.DB.prepare(sql).bind(...params).all();
      return results as T[];
    }
    return await queryBridge('all', sql, params) as T[];
  },
  
  async run(sql: string, ...params: any[]): Promise<{ changes: number; lastInsertRowid: number | null }> {
    let env: any = null;
    try {
      const context = getRequestContext();
      env = context?.env;
    } catch {
      // Not in Cloudflare environment
    }

    if (env?.DB) {
      const res = await env.DB.prepare(sql).bind(...params).run();
      return {
        changes: res.meta.changes || 0,
        lastInsertRowid: res.meta.last_row_id || null,
      };
    }
    return await queryBridge('run', sql, params);
  },
  
  async exec(sql: string): Promise<void> {
    let env: any = null;
    try {
      const context = getRequestContext();
      env = context?.env;
    } catch {
      // Not in Cloudflare environment
    }

    if (env?.DB) {
      await env.DB.exec(sql);
      return;
    }
    return await queryBridge('exec', sql);
  }
};

export default db;
