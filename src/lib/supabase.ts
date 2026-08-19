/**
 * Universal Supabase Client & Connection Verification
 * Location: src/lib/supabase.ts
 * 
 * Supports both Vite client-side (import.meta.env) and Node.js environments (process.env).
 * Handles missing environment variables gracefully without throwing runtime errors.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe environment variable resolution across Vite and Node runtimes
function resolveEnv(key: string): string | undefined {
  // Check import.meta.env (Vite client-side)
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv) {
      if (metaEnv[key]) return metaEnv[key];
      if (metaEnv[`VITE_${key}`]) return metaEnv[`VITE_${key}`];
      if (metaEnv[`NEXT_PUBLIC_${key}`]) return metaEnv[`NEXT_PUBLIC_${key}`];
    }
  } catch {
    // Ignore context where import.meta is unavailable
  }

  // Check process.env (Node / Serverless / Server environments)
  try {
    const procEnv = (globalThis as any)?.process?.env;
    if (procEnv) {
      if (procEnv[key]) return procEnv[key];
      if (procEnv[`VITE_${key}`]) return procEnv[`VITE_${key}`];
      if (procEnv[`NEXT_PUBLIC_${key}`]) return procEnv[`NEXT_PUBLIC_${key}`];
    }
  } catch {
    // Ignore context where process is unavailable
  }

  return undefined;
}

function cleanUrl(raw?: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!trimmed) return null;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function cleanKey(raw?: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, '');
  return trimmed.length > 0 ? trimmed : null;
}

export const SUPABASE_URL = cleanUrl(
  resolveEnv('SUPABASE_URL') ||
  resolveEnv('VITE_SUPABASE_URL') ||
  resolveEnv('NEXT_PUBLIC_SUPABASE_URL')
);

export const SUPABASE_KEY = cleanKey(
  resolveEnv('SUPABASE_SERVICE_ROLE_KEY') ||
  resolveEnv('SUPABASE_ANON_KEY') ||
  resolveEnv('VITE_SUPABASE_ANON_KEY') ||
  resolveEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  resolveEnv('SUPABASE_KEY')
);

/**
 * Singleton Supabase Client instance (or null if environment variables are not set)
 */
export const supabase: SupabaseClient | null = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Returns whether Supabase credentials are configured in the environment
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

/**
 * Safe accessor for the Supabase client
 */
export function getSupabase(): SupabaseClient | null {
  return supabase;
}

export interface VerifyConnectionResult {
  success: boolean;
  configured: boolean;
  url: string | null;
  host?: string;
  message: string;
  latencyMs?: number;
  error?: any;
}

/**
 * Verifies the Supabase connection and logs diagnostic information to the console.
 * Safe to invoke in both browser console and server environments.
 */
export async function verifyConnection(): Promise<VerifyConnectionResult> {
  const startTime = Date.now();
  console.log('%c[Supabase] Starting connection verification...', 'color: #3b82f6; font-weight: bold;');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    const missing: string[] = [];
    if (!SUPABASE_URL) missing.push('SUPABASE_URL (or VITE_SUPABASE_URL)');
    if (!SUPABASE_KEY) missing.push('SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY');

    const message = `[Supabase] Missing environment variables: ${missing.join(', ')}. Running with local persistence fallback.`;
    console.warn(
      `%c${message}`,
      'color: #f59e0b; font-weight: bold;'
    );

    return {
      success: false,
      configured: false,
      url: SUPABASE_URL || null,
      message
    };
  }

  let host = '';
  try {
    const parsed = new URL(SUPABASE_URL);
    host = parsed.host;
  } catch {
    const message = `[Supabase] Invalid URL format: "${SUPABASE_URL}"`;
    console.error(`%c${message}`, 'color: #ef4444; font-weight: bold;');
    return {
      success: false,
      configured: true,
      url: SUPABASE_URL,
      message,
      error: 'INVALID_URL'
    };
  }

  const client = getSupabase();
  if (!client) {
    const message = '[Supabase] Failed to initialize Supabase client instance.';
    console.error(`%c${message}`, 'color: #ef4444; font-weight: bold;');
    return {
      success: false,
      configured: true,
      url: SUPABASE_URL,
      host,
      message,
      error: 'CLIENT_NULL'
    };
  }

  try {
    console.log(`[Supabase] Pinging Supabase project at ${host}...`);

    // Perform a lightweight check against the database
    const { error, status } = await client
      .from('ventures')
      .select('id', { head: true, count: 'exact' });

    const latencyMs = Date.now() - startTime;

    if (!error) {
      const message = `[Supabase] Connection verified successfully to ${host} in ${latencyMs}ms. Schema tables verified.`;
      console.log(
        `%c${message}`,
        'color: #10b981; font-weight: bold;'
      );
      return {
        success: true,
        configured: true,
        url: SUPABASE_URL,
        host,
        latencyMs,
        message
      };
    }

    const errText = error.message || String(error);
    const isSchemaNotice = 
      errText.toLowerCase().includes('does not exist') ||
      errText.toLowerCase().includes('relation') ||
      error.code === '42P01' ||
      error.code === 'PGRST204' ||
      error.code === 'PGRST205';

    if (isSchemaNotice) {
      const message = `[Supabase] Connected to ${host} in ${latencyMs}ms! Notice: The 'ventures' table is not created yet (run migrations from supabase/migrations/).`;
      console.log(
        `%c${message}`,
        'color: #3b82f6; font-weight: bold;'
      );
      return {
        success: true,
        configured: true,
        url: SUPABASE_URL,
        host,
        latencyMs,
        message,
        error: 'SCHEMA_NOT_YET_INITIALIZED'
      };
    }

    const message = `[Supabase] Connection query failed with status ${status || 'unknown'}: ${errText}`;
    console.error(`%c${message}`, 'color: #ef4444; font-weight: bold;');
    return {
      success: false,
      configured: true,
      url: SUPABASE_URL,
      host,
      latencyMs,
      message,
      error: error
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const message = `[Supabase] Network/connection error to ${host}: ${err?.message || err}`;
    console.error(`%c${message}`, 'color: #ef4444; font-weight: bold;');
    return {
      success: false,
      configured: true,
      url: SUPABASE_URL,
      host,
      latencyMs,
      message,
      error: err
    };
  }
}

// Make verifyConnection available on window for quick browser console debugging
if (typeof window !== 'undefined') {
  (window as any).verifySupabaseConnection = verifyConnection;
}
