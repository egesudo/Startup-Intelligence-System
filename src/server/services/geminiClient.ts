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
}

export interface GeminiGenerateOptions {
  contents: string | any[];
  config?: GeminiCallConfig;
  preferredModel?: string;
  maxRetries?: number;
}

const CANDIDATE_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest'
];

/**
 * Execute a Gemini generation request with intelligent model cascade and retry on 503/429.
 * Always catches errors and returns null on failure so the system falls back safely without 500s.
 */
export async function executeGeminiWithFallback(options: GeminiGenerateOptions): Promise<string | null> {
  const ai = getAiClient();
  if (!ai) {
    return null;
  }

  const modelsToTry = options.preferredModel 
    ? [options.preferredModel, ...CANDIDATE_MODELS.filter(m => m !== options.preferredModel)]
    : CANDIDATE_MODELS;

  for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
    const model = modelsToTry[mIdx];
    const maxAttempts = mIdx === 0 ? 2 : 1; // 2 attempts on primary, 1 on backups

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: options.config
        });

        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        const msg = err?.message || String(err);
        const statusCode = err?.status || err?.code || (msg.includes('503') ? 503 : (msg.includes('429') ? 429 : 0));
        const isTemporary = statusCode === 503 || statusCode === 429 || msg.includes('high demand') || msg.includes('UNAVAILABLE') || msg.includes('resource_exhausted') || msg.includes('quota');

        if (isTemporary && attempt < maxAttempts) {
          const waitTime = attempt * 500;
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }

        // If this model failed, break inner loop to try next candidate model
        break;
      }
    }
  }

  console.warn(`[GeminiClient] AI generation unavailable or quota reached on models (${modelsToTry.join(', ')}). Using deterministic synthesis.`);
  return null;
}
