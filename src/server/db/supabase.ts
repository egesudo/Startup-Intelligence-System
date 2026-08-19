import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
let lastConfigCheck = { url: '', key: '' };

export interface SupabaseHealthCheckResult {
  configured: boolean;
  urlConfigured: boolean;
  keyConfigured: boolean;
  keyType: 'service_role' | 'anon' | 'none';
  urlHost?: string;
  connected: boolean;
  schemaInitialized: boolean;
  message: string;
  latencyMs?: number;
  error?: string;
}

/**
 * Extracts and sanitizes the Supabase URL from possible environment variable names
 */
export function getSupabaseUrl(): string | null {
  const rawUrl = 
    process.env.SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.VITE_SUPABASE_URL;

  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const cleaned = rawUrl.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    return `https://${cleaned}`;
  }
  return cleaned;
}

/**
 * Extracts and sanitizes the Supabase Key from possible environment variable names
 */
export function getSupabaseKey(): { key: string | null; type: 'service_role' | 'anon' | 'none' } {
  const serviceKey = 
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.SUPABASE_SECRET_KEY || 
    process.env.SUPABASE_SERVICE_KEY;

  if (serviceKey && typeof serviceKey === 'string' && serviceKey.trim().length > 0) {
    return {
      key: serviceKey.trim().replace(/^['"]|['"]$/g, ''),
      type: 'service_role'
    };
  }

  const anonKey = 
    process.env.SUPABASE_ANON_KEY || 
    process.env.SUPABASE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.VITE_SUPABASE_ANON_KEY;

  if (anonKey && typeof anonKey === 'string' && anonKey.trim().length > 0) {
    return {
      key: anonKey.trim().replace(/^['"]|['"]$/g, ''),
      type: 'anon'
    };
  }

  return { key: null, type: 'none' };
}

/**
 * Determines whether Supabase environment variables are provided
 */
export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const { key } = getSupabaseKey();
  return Boolean(url && key);
}

/**
 * Retrieves the server-side Supabase client instance with lazy initialization
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const { key } = getSupabaseKey();

  if (!url || !key) {
    return null;
  }

  // Re-create client if env vars changed dynamically
  if (!supabaseClient || lastConfigCheck.url !== url || lastConfigCheck.key !== key) {
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      lastConfigCheck = { url, key };
    } catch (err) {
      console.error('[Supabase] Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseClient;
}

/**
 * Performs a comprehensive health check against Supabase
 * Verifies URL format, credentials match, network connectivity, and table schema presence.
 */
export async function checkSupabaseConnection(): Promise<SupabaseHealthCheckResult> {
  const url = getSupabaseUrl();
  const { key, type: keyType } = getSupabaseKey();
  const startTime = Date.now();

  const baseResult: SupabaseHealthCheckResult = {
    configured: Boolean(url && key),
    urlConfigured: Boolean(url),
    keyConfigured: Boolean(key),
    keyType,
    urlHost: undefined,
    connected: false,
    schemaInitialized: false,
    message: 'Supabase is not configured. Running in in-memory fallback mode.'
  };

  if (!url || !key) {
    return baseResult;
  }

  try {
    const parsed = new URL(url);
    baseResult.urlHost = parsed.host;
  } catch {
    baseResult.message = `Invalid Supabase URL format: ${url}`;
    baseResult.error = 'INVALID_URL_FORMAT';
    return baseResult;
  }

  const client = getSupabaseAdmin();
  if (!client) {
    baseResult.message = 'Failed to create Supabase client instance.';
    baseResult.error = 'CLIENT_CREATION_FAILED';
    return baseResult;
  }

  try {
    // Attempt a light head request to check connection and schema
    const { error, status } = await client
      .from('ventures')
      .select('id', { head: true, count: 'exact' });

    baseResult.latencyMs = Date.now() - startTime;

    if (!error) {
      baseResult.connected = true;
      baseResult.schemaInitialized = true;
      baseResult.message = `Successfully connected to Supabase (${baseResult.urlHost}) using ${keyType} key. PostgreSQL tables verified.`;
      return baseResult;
    }

    const errorMsg = error.message || '';
    const isSchemaError = 
      errorMsg.toLowerCase().includes('does not exist') ||
      errorMsg.toLowerCase().includes('schema cache') ||
      errorMsg.toLowerCase().includes('relation') ||
      error.code === '42P01' ||
      error.code === 'PGRST204' ||
      error.code === 'PGRST205';

    if (isSchemaError) {
      baseResult.connected = true;
      baseResult.schemaInitialized = false;
      baseResult.message = `Connected to Supabase (${baseResult.urlHost}), but 'ventures' table is not yet created. Run SQL migrations in Supabase Dashboard.`;
      baseResult.error = 'SCHEMA_NOT_FOUND';
      return baseResult;
    }

    // Authentication or authorization errors
    if (status === 401 || status === 403 || errorMsg.toLowerCase().includes('jwt') || errorMsg.toLowerCase().includes('invalid api key')) {
      baseResult.connected = false;
      baseResult.schemaInitialized = false;
      baseResult.message = `Supabase authentication failed (${status}). Check SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY.`;
      baseResult.error = 'AUTHENTICATION_FAILED: ' + errorMsg;
      return baseResult;
    }

    baseResult.connected = false;
    baseResult.schemaInitialized = false;
    baseResult.message = `Supabase query returned error: ${errorMsg}`;
    baseResult.error = errorMsg;
    return baseResult;
  } catch (err: any) {
    baseResult.latencyMs = Date.now() - startTime;
    baseResult.connected = false;
    baseResult.schemaInitialized = false;
    baseResult.message = `Failed to reach Supabase server: ${err?.message || 'Network error'}`;
    baseResult.error = err?.message || 'CONNECTION_ERROR';
    return baseResult;
  }
}
