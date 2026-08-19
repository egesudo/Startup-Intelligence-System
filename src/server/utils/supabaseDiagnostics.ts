/**
 * Supabase Environment Diagnostics Utility
 * 
 * Specifically checks, verifies, and logs the availability and structure of
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the server-side runtime,
 * ensuring they are correctly injected in Vercel, Cloud Run, or local Node environments.
 */

export interface SupabaseEnvDiagnosticReport {
  timestamp: string;
  runtime: {
    nodeVersion: string;
    platform: string;
    isVercel: boolean;
    vercelEnv?: string;
    vercelRegion?: string;
    vercelUrl?: string;
  };
  supabaseUrl: {
    isAvailable: boolean;
    sourceVar: string | null;
    rawLength: number;
    sanitizedUrl: string | null;
    projectRef: string | null;
    isValidFormat: boolean;
    warnings: string[];
  };
  supabaseServiceRoleKey: {
    isAvailable: boolean;
    sourceVar: string | null;
    rawLength: number;
    maskedPreview: string | null;
    isJwtFormat: boolean;
    decodedRole: string | null;
    isServiceRole: boolean;
    warnings: string[];
  };
  fallbackAnonKey: {
    isAvailable: boolean;
    sourceVar: string | null;
    rawLength: number;
    maskedPreview: string | null;
  };
  geminiApiKey: {
    isAvailable: boolean;
    maskedPreview: string | null;
  };
  overallStatus: 'OPTIMAL' | 'DEGRADED_ANON_ONLY' | 'MISSING_CREDENTIALS' | 'INVALID_CONFIG';
  summaryMessage: string;
  actionableSteps: string[];
}

/**
 * Safely decodes a JWT payload without verifying signature (for diagnostic role inspection only)
 */
function parseJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Masks a secret key for safe diagnostic logging (e.g. "eyJhbG...[214 chars]...e30=")
 */
function maskSecret(secret?: string | null): string | null {
  if (!secret || typeof secret !== 'string') return null;
  const trimmed = secret.trim();
  if (trimmed.length <= 12) return '***[SHORT_SECRET]***';
  const start = trimmed.substring(0, 6);
  const end = trimmed.substring(trimmed.length - 4);
  return `${start}...[${trimmed.length} chars]...${end}`;
}

/**
 * Performs a comprehensive inspection of the server-side environment variables
 */
export function getSupabaseEnvDiagnostics(): SupabaseEnvDiagnosticReport {
  const env = process.env;

  // 1. Inspect SUPABASE_URL variations
  let urlSource: string | null = null;
  let rawUrl: string | undefined;

  if (env.SUPABASE_URL && env.SUPABASE_URL.trim().length > 0) {
    urlSource = 'SUPABASE_URL';
    rawUrl = env.SUPABASE_URL;
  } else if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_URL.trim().length > 0) {
    urlSource = 'NEXT_PUBLIC_SUPABASE_URL';
    rawUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  } else if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_URL.trim().length > 0) {
    urlSource = 'VITE_SUPABASE_URL';
    rawUrl = env.VITE_SUPABASE_URL;
  }

  const urlWarnings: string[] = [];
  let sanitizedUrl: string | null = null;
  let projectRef: string | null = null;
  let isValidUrlFormat = false;

  if (rawUrl) {
    let clean = rawUrl.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      urlWarnings.push('URL was missing http(s) protocol prefix; automatically adding https://');
      clean = `https://${clean}`;
    }
    sanitizedUrl = clean;

    try {
      const parsed = new URL(sanitizedUrl);
      isValidUrlFormat = true;
      const hostParts = parsed.hostname.split('.');
      if (hostParts.length >= 3 && parsed.hostname.endsWith('supabase.co')) {
        projectRef = hostParts[0];
      } else {
        projectRef = parsed.hostname;
      }
    } catch {
      isValidUrlFormat = false;
      urlWarnings.push('Value is not a valid URL structure');
    }
  } else {
    urlWarnings.push('SUPABASE_URL is not defined in server process.env');
  }

  // 2. Inspect SUPABASE_SERVICE_ROLE_KEY variations
  let serviceKeySource: string | null = null;
  let rawServiceKey: string | undefined;

  if (env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY.trim().length > 0) {
    serviceKeySource = 'SUPABASE_SERVICE_ROLE_KEY';
    rawServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  } else if (env.SUPABASE_SECRET_KEY && env.SUPABASE_SECRET_KEY.trim().length > 0) {
    serviceKeySource = 'SUPABASE_SECRET_KEY';
    rawServiceKey = env.SUPABASE_SECRET_KEY;
  } else if (env.SUPABASE_SERVICE_KEY && env.SUPABASE_SERVICE_KEY.trim().length > 0) {
    serviceKeySource = 'SUPABASE_SERVICE_KEY';
    rawServiceKey = env.SUPABASE_SERVICE_KEY;
  }

  const serviceKeyWarnings: string[] = [];
  let isJwt = false;
  let decodedRole: string | null = null;
  let isServiceRole = false;

  if (rawServiceKey) {
    const cleanKey = rawServiceKey.trim().replace(/^['"]|['"]$/g, '');
    const parts = cleanKey.split('.');
    if (parts.length === 3) {
      isJwt = true;
      const payload = parseJwtPayload(cleanKey);
      if (payload) {
        decodedRole = payload.role || null;
        if (decodedRole === 'service_role') {
          isServiceRole = true;
        } else {
          serviceKeyWarnings.push(
            `Key contains role '${decodedRole}' instead of expected 'service_role'. Row Level Security (RLS) bypass will not be active.`
          );
        }
      } else {
        serviceKeyWarnings.push('Key has 3 JWT parts but payload could not be decoded.');
      }
    } else {
      serviceKeyWarnings.push('Key does not conform to standard Supabase 3-part JWT format.');
    }
  } else {
    serviceKeyWarnings.push('SUPABASE_SERVICE_ROLE_KEY is not defined in server process.env');
  }

  // 3. Inspect Fallback Anon Key
  let anonKeySource: string | null = null;
  let rawAnonKey: string | undefined;

  if (env.SUPABASE_ANON_KEY && env.SUPABASE_ANON_KEY.trim().length > 0) {
    anonKeySource = 'SUPABASE_ANON_KEY';
    rawAnonKey = env.SUPABASE_ANON_KEY;
  } else if (env.NEXT_PUBLIC_SUPABASE_ANON_KEY && env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim().length > 0) {
    anonKeySource = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';
    rawAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  } else if (env.VITE_SUPABASE_ANON_KEY && env.VITE_SUPABASE_ANON_KEY.trim().length > 0) {
    anonKeySource = 'VITE_SUPABASE_ANON_KEY';
    rawAnonKey = env.VITE_SUPABASE_ANON_KEY;
  } else if (env.SUPABASE_KEY && env.SUPABASE_KEY.trim().length > 0) {
    anonKeySource = 'SUPABASE_KEY';
    rawAnonKey = env.SUPABASE_KEY;
  }

  // 4. Overall status calculation
  let overallStatus: SupabaseEnvDiagnosticReport['overallStatus'] = 'MISSING_CREDENTIALS';
  let summaryMessage = '';
  const actionableSteps: string[] = [];

  const urlAvailable = Boolean(rawUrl && isValidUrlFormat);
  const serviceKeyAvailable = Boolean(rawServiceKey && isServiceRole);
  const anonKeyAvailable = Boolean(rawAnonKey);

  if (urlAvailable && serviceKeyAvailable) {
    overallStatus = 'OPTIMAL';
    summaryMessage = `Supabase is fully configured with a valid SUPABASE_URL (${projectRef}) and verified SUPABASE_SERVICE_ROLE_KEY.`;
  } else if (urlAvailable && rawServiceKey && !isServiceRole) {
    overallStatus = 'INVALID_CONFIG';
    summaryMessage = `SUPABASE_URL is valid, but the provided SUPABASE_SERVICE_ROLE_KEY has role '${decodedRole || 'unknown'}' rather than 'service_role'.`;
    actionableSteps.push('In Vercel Project Settings > Environment Variables, copy the `service_role` secret key from Supabase Dashboard > Project Settings > API.');
  } else if (urlAvailable && anonKeyAvailable) {
    overallStatus = 'DEGRADED_ANON_ONLY';
    summaryMessage = `SUPABASE_URL is valid, but only SUPABASE_ANON_KEY was found. Server operations will respect RLS policies and may fail on private tables unless SUPABASE_SERVICE_ROLE_KEY is injected.`;
    actionableSteps.push('Add `SUPABASE_SERVICE_ROLE_KEY` to your Vercel Environment Variables to allow server backend queries to bypass RLS.');
  } else if (!urlAvailable && serviceKeyAvailable) {
    overallStatus = 'INVALID_CONFIG';
    summaryMessage = 'SUPABASE_SERVICE_ROLE_KEY is present, but SUPABASE_URL is missing or invalid.';
    actionableSteps.push('Add `SUPABASE_URL` (e.g. `https://your-project.supabase.co`) to Vercel Environment Variables.');
  } else {
    overallStatus = 'MISSING_CREDENTIALS';
    summaryMessage = 'Both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are missing from server runtime. In-memory repository fallback is active.';
    actionableSteps.push('Go to Vercel Dashboard > Your Project > Settings > Environment Variables.');
    actionableSteps.push('Add `SUPABASE_URL` with your Supabase Project URL (e.g., https://xyz.supabase.co).');
    actionableSteps.push('Add `SUPABASE_SERVICE_ROLE_KEY` with your Supabase `service_role` secret.');
    actionableSteps.push('Redeploy the project in Vercel to apply the new environment variables.');
  }

  return {
    timestamp: new Date().toISOString(),
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
      isVercel: Boolean(env.VERCEL || env.VERCEL_ENV),
      vercelEnv: env.VERCEL_ENV,
      vercelRegion: env.VERCEL_REGION,
      vercelUrl: env.VERCEL_URL
    },
    supabaseUrl: {
      isAvailable: Boolean(rawUrl),
      sourceVar: urlSource,
      rawLength: rawUrl?.length || 0,
      sanitizedUrl,
      projectRef,
      isValidFormat: isValidUrlFormat,
      warnings: urlWarnings
    },
    supabaseServiceRoleKey: {
      isAvailable: Boolean(rawServiceKey),
      sourceVar: serviceKeySource,
      rawLength: rawServiceKey?.length || 0,
      maskedPreview: maskSecret(rawServiceKey),
      isJwtFormat: isJwt,
      decodedRole,
      isServiceRole,
      warnings: serviceKeyWarnings
    },
    fallbackAnonKey: {
      isAvailable: Boolean(rawAnonKey),
      sourceVar: anonKeySource,
      rawLength: rawAnonKey?.length || 0,
      maskedPreview: maskSecret(rawAnonKey)
    },
    geminiApiKey: {
      isAvailable: Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0),
      maskedPreview: maskSecret(env.GEMINI_API_KEY)
    },
    overallStatus,
    summaryMessage,
    actionableSteps
  };
}

/**
 * Logs a high-visibility, formatted diagnostic block directly to the server console.
 * Specifically helpful for Vercel Serverless Function and Cloud Run logs.
 */
export function logServerEnvDiagnostics(): SupabaseEnvDiagnosticReport {
  const diag = getSupabaseEnvDiagnostics();

  const divider = '================================================================================';
  const miniDivider = '--------------------------------------------------------------------------------';

  console.log('\n' + divider);
  console.log('⚡ [SERVER-SIDE RUNTIME DIAGNOSTIC: SUPABASE & VERCEL ENV INJECTION]');
  console.log(divider);
  console.log(`⏰ Timestamp    : ${diag.timestamp}`);
  console.log(`🌍 Runtime Env  : Node ${diag.runtime.nodeVersion} (${diag.runtime.platform})`);
  console.log(`🚀 Vercel Target: ${diag.runtime.isVercel ? `YES (Env: ${diag.runtime.vercelEnv || 'production'}, Region: ${diag.runtime.vercelRegion || 'auto'})` : 'Local / Non-Vercel Container'}`);
  console.log(miniDivider);

  // SUPABASE_URL
  console.log('🔍 SUPABASE_URL:');
  if (diag.supabaseUrl.isAvailable) {
    console.log(`   ✅ Status     : DETECTED via process.env.${diag.supabaseUrl.sourceVar}`);
    console.log(`   🔗 Host / Ref : ${diag.supabaseUrl.sanitizedUrl} (Project Ref: ${diag.supabaseUrl.projectRef || 'custom'})`);
    console.log(`   📏 Length     : ${diag.supabaseUrl.rawLength} characters`);
  } else {
    console.log('   ❌ Status     : NOT FOUND in process.env');
  }
  if (diag.supabaseUrl.warnings.length > 0) {
    diag.supabaseUrl.warnings.forEach(w => console.log(`   ⚠️ Warning    : ${w}`));
  }

  // SUPABASE_SERVICE_ROLE_KEY
  console.log('🔍 SUPABASE_SERVICE_ROLE_KEY:');
  if (diag.supabaseServiceRoleKey.isAvailable) {
    console.log(`   ✅ Status     : DETECTED via process.env.${diag.supabaseServiceRoleKey.sourceVar}`);
    console.log(`   🔑 Preview    : ${diag.supabaseServiceRoleKey.maskedPreview}`);
    console.log(`   🛡️ Role Payload: ${diag.supabaseServiceRoleKey.decodedRole || 'Unknown'}`);
    console.log(`   ✨ ServiceRole: ${diag.supabaseServiceRoleKey.isServiceRole ? 'CONFIRMED (RLS Bypass Active)' : 'FAILED (Not service_role)'}`);
  } else {
    console.log('   ❌ Status     : NOT FOUND in process.env');
  }
  if (diag.supabaseServiceRoleKey.warnings.length > 0) {
    diag.supabaseServiceRoleKey.warnings.forEach(w => console.log(`   ⚠️ Warning    : ${w}`));
  }

  // Fallback / Gemini status
  console.log(miniDivider);
  console.log(`🛡️ Fallback Anon Key : ${diag.fallbackAnonKey.isAvailable ? `DETECTED via ${diag.fallbackAnonKey.sourceVar} (${diag.fallbackAnonKey.maskedPreview})` : 'NOT SET'}`);
  console.log(`🤖 Gemini API Key     : ${diag.geminiApiKey.isAvailable ? `DETECTED (${diag.geminiApiKey.maskedPreview})` : 'NOT SET'}`);
  console.log(miniDivider);
  console.log(`🎯 Overall Status    : [${diag.overallStatus}]`);
  console.log(`📝 Summary           : ${diag.summaryMessage}`);

  if (diag.actionableSteps.length > 0) {
    console.log('💡 Actionable Steps  :');
    diag.actionableSteps.forEach((step, idx) => {
      console.log(`   ${idx + 1}. ${step}`);
    });
  }
  console.log(divider + '\n');

  return diag;
}
