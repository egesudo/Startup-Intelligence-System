/**
 * Centralized Gemini Client with Multi-Model Fallback & Exponential Backoff
 * 
 * Protects against 503 (High Demand / Spikes), 429 (Rate Limits), and missing/invalid keys by:
 * 1. Trying primary model: 'gemini-3.7-flash'
 * 2. On 503/429/Unavailable, retrying with exponential backoff
 * 3. Falling back to high-throughput models: 'gemini-3.1-flash-lite' and 'gemini-flash-latest'
 * 4. Gracefully returning null to trigger deterministic synthesis without 500 crashes
 */

import { GoogleGenAI } from '@google/genai';
import { calculateBackoffDelay, isServerRetryable, ServerRetryConfig } from '../utils/retryWithBackoff';

let aiClient: GoogleGenAI | null = null;
let lastTestedApiKey = '';

export function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return null;
  }

  const cleanedKey = apiKey.trim().replace(/^['"]|['"]$/g, '');

  if (!aiClient || lastTestedApiKey !== cleanedKey) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: cleanedKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      lastTestedApiKey = cleanedKey;
    } catch (err) {
      console.warn('[GeminiClient] Initialization error:', err);
      return null;
    }
  }
  return aiClient;
}

export interface GeminiCallConfig {
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: any;
  temperature?: number;
  tools?: any[];
  toolConfig?: any;
}

export interface GeminiGenerateOptions {
  contents: string | any[];
  config?: GeminiCallConfig;
  preferredModel?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface GeminiExecutionResult {
  text: string | null;
  groundingMetadata?: {
    webSearchQueries?: string[];
    groundingChunks?: Array<{
      web?: {
        uri: string;
        title: string;
      };
    }>;
    groundingSupports?: any[];
  };
}

const CANDIDATE_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest'
];

// In-memory model cooldown tracking to avoid burning retries on quota-exhausted or demand-spiked models
const modelCooldownMap = new Map<string, number>();

function isHardQuotaExhaustion(err: any): { isExhausted: boolean; cooldownMs: number } {
  const msg = (err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err || ''))).toLowerCase();
  const status = (err?.status || err?.code || '').toString().toLowerCase();

  const hasQuotaKeyword = 
    msg.includes('quota exceeded') ||
    msg.includes('resource_exhausted') ||
    msg.includes('free_tier_requests') ||
    msg.includes('generaterequestsperday') ||
    msg.includes('exceeded your current quota') ||
    status.includes('resource_exhausted') ||
    status.includes('429');

  if (hasQuotaKeyword) {
    // Extract retryDelay if present in error details (e.g. "56s" -> 56000ms)
    let cooldownMs = 60000;
    const retryDelayMatch = msg.match(/retry in\s+([0-9.]+)\s*s/i) || msg.match(/retrydelay["']?:\s*["']?([0-9.]+)s?/i);
    if (retryDelayMatch && retryDelayMatch[1]) {
      const parsedSeconds = parseFloat(retryDelayMatch[1]);
      if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
        cooldownMs = Math.min(Math.max(parsedSeconds * 1000, 15000), 120000);
      }
    }
    return { isExhausted: true, cooldownMs };
  }

  return { isExhausted: false, cooldownMs: 0 };
}

function isHighDemandSpike(err: any): { isSpike: boolean; cooldownMs: number } {
  const msg = (err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err || ''))).toLowerCase();
  const status = (err?.status || err?.code || '').toString().toLowerCase();

  const isSpike =
    msg.includes('high demand') ||
    msg.includes('spikes in demand') ||
    msg.includes('currently experiencing high demand') ||
    msg.includes('service unavailable') ||
    msg.includes('temporarily unavailable') ||
    msg.includes('503') ||
    status.includes('503') ||
    status.includes('unavailable');

  if (isSpike) {
    return { isSpike: true, cooldownMs: 45000 };
  }

  return { isSpike: false, cooldownMs: 0 };
}

/**
 * Execute a Gemini generation request with intelligent model cascade and exponential backoff retry.
 * Handles network connection drops, timeouts, 503 high-demand, and 429 rate limits during long output generation.
 */
export async function executeGeminiWithFallback(options: GeminiGenerateOptions): Promise<string | null> {
  const result = await executeGeminiWithGrounding(options);
  return result.text;
}

/**
 * Execute Gemini with Grounding metadata preservation and exponential backoff retry.
 */
export async function executeGeminiWithGrounding(options: GeminiGenerateOptions): Promise<GeminiExecutionResult> {
  const ai = getAiClient();
  if (!ai) {
    return { text: null };
  }

  const now = Date.now();
  const allCandidateModels = options.preferredModel 
    ? [options.preferredModel, ...CANDIDATE_MODELS.filter(m => m !== options.preferredModel)]
    : CANDIDATE_MODELS;

  // Filter models that are not currently under hard quota cooldown
  const availableModels = allCandidateModels.filter(m => {
    const cooldownUntil = modelCooldownMap.get(m) || 0;
    return now >= cooldownUntil;
  });

  // If all candidate models are in cooldown, use all candidates as fallback attempt
  const modelsToTry = availableModels.length > 0 ? availableModels : allCandidateModels;

  const timeoutMs = options.timeoutMs || 60000;
  const retryConfig: Pick<ServerRetryConfig, 'initialDelayMs' | 'maxDelayMs' | 'backoffFactor' | 'jitter'> = {
    initialDelayMs: 1200,
    maxDelayMs: 12000,
    backoffFactor: 2,
    jitter: true
  };

  for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
    const model = modelsToTry[mIdx];
    // Primary model gets 2 attempts with exponential backoff, secondary models get 1 attempt
    const maxAttempts = options.maxRetries ?? (mIdx === 0 ? 2 : 1);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const mergedConfig = {
          temperature: 0.0,
          ...options.config
        };

        // Wrap call with timeout race to catch hanging network connections during long output generation
        let timeoutHandle: any;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new Error(`Gemini generateContent timed out after ${timeoutMs}ms on model ${model}`));
          }, timeoutMs);
        });

        const generatePromise = ai.models.generateContent({
          model,
          contents: options.contents,
          config: mergedConfig
        });

        const response = await Promise.race([generatePromise, timeoutPromise]);
        clearTimeout(timeoutHandle);

        if (response && response.text) {
          const candidate = response.candidates?.[0];
          const groundingMetadata = candidate?.groundingMetadata;
          return {
            text: response.text,
            groundingMetadata: groundingMetadata ? {
              webSearchQueries: groundingMetadata.webSearchQueries,
              groundingChunks: groundingMetadata.groundingChunks as any,
              groundingSupports: (groundingMetadata as any).groundingSupports
            } : undefined
          };
        }
      } catch (err: any) {
        // Check for hard quota limit (RESOURCE_EXHAUSTED / free_tier_requests daily limit)
        const quotaInfo = isHardQuotaExhaustion(err);
        if (quotaInfo.isExhausted) {
          modelCooldownMap.set(model, Date.now() + quotaInfo.cooldownMs);
          console.info(`[GeminiClient] Model ${model} quota reached, cooling down for ${Math.round(quotaInfo.cooldownMs / 1000)}s. Cascading to next candidate model.`);
          break; // Immediately break inner attempt loop to try next model
        }

        // Check for 503 high-demand spikes
        const spikeInfo = isHighDemandSpike(err);
        if (spikeInfo.isSpike) {
          modelCooldownMap.set(model, Date.now() + spikeInfo.cooldownMs);
          console.info(`[GeminiClient] Model ${model} high demand spike encountered (503). Setting ${Math.round(spikeInfo.cooldownMs / 1000)}s cooldown and cascading to high-throughput candidate model.`);
          break; // Immediately cascade to next candidate (e.g. gemini-3.1-flash-lite) to avoid user-perceived lag
        }

        const isLastAttempt = attempt >= maxAttempts;
        const retryable = isServerRetryable(err, { retryOnStatus: [408, 429, 500, 502, 503, 504] });

        if (retryable && !isLastAttempt) {
          const backoffDelay = calculateBackoffDelay(attempt, retryConfig);
          console.warn(
            `[GeminiClient] Model ${model} attempt ${attempt}/${maxAttempts} encountered transient error (${err?.message || err}). Retrying in ${Math.round(backoffDelay)}ms...`
          );
          await new Promise(r => setTimeout(r, backoffDelay));
          continue;
        }

        // If not retryable or max attempts exhausted for this model, fallback to next model
        console.warn(`[GeminiClient] Model ${model} unavailable: ${err?.message || err}`);
        break;
      }
    }
  }

  console.info(`[GeminiClient] External AI generation unavailable or quota limit reached on candidate models. Proceeding seamlessly with deterministic intelligence synthesis.`);
  return { text: null };
}
