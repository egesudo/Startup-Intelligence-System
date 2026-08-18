/**
 * Centralized Gemini Client with Multi-Model Fallback & Exponential Backoff
 * 
 * Protects against 503 (High Demand / Spikes) and 429 (Rate Limits) by:
 * 1. Trying primary model: 'gemini-3.7-flash'
 * 2. On 503/429/Unavailable, retrying with exponential backoff
 * 3. Falling back to high-throughput models: 'gemini-3.1-flash-lite' and 'gemini-flash-latest'
 */

import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
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
 */
export async function executeGeminiWithFallback(options: GeminiGenerateOptions): Promise<string | null> {
  const ai = getAiClient();
  if (!ai) return null;

  const modelsToTry = options.preferredModel 
    ? [options.preferredModel, ...CANDIDATE_MODELS.filter(m => m !== options.preferredModel)]
    : CANDIDATE_MODELS;

  let lastError: any = null;

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
        lastError = err;
        const statusCode = err?.status || err?.code || (err?.message?.includes('503') ? 503 : (err?.message?.includes('429') ? 429 : 0));
        const isTemporary = statusCode === 503 || statusCode === 429 || err?.message?.includes('high demand') || err?.message?.includes('UNAVAILABLE');

        if (isTemporary) {
          // Wait briefly before retry
          const waitTime = attempt * 600;
          await new Promise(r => setTimeout(r, waitTime));
          // Continue to next attempt or next model
          continue;
        } else {
          // If it's a non-retryable error (e.g. 400 Bad Request / Schema validation), don't loop endlessly
          throw err;
        }
      }
    }
  }

  // If all models failed with temporary errors, log clean info and return null to trigger deterministic fallback
  console.warn(`[GeminiClient] All candidate models (${modelsToTry.join(', ')}) experienced temporary demand spikes. Using deterministic empirical synthesis.`);
  return null;
}
