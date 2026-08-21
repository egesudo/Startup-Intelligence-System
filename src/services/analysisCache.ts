/**
 * IndexedDB & Local State Caching Engine for Startup Idea Analysis
 * 
 * Prevents redundant LLM / API calls for identical venture ideas, ensuring 
 * 100% stable, reproducible, deterministic scores across multiple analyses.
 * 
 * Storage Strategy:
 * 1. Primary: IndexedDB (Database: 'StartupIntelligenceDB', Store: 'venture_analysis_cache_v1')
 * 2. Secondary: localStorage mirror for instant synchronous startup reads
 * 3. Fallback: In-memory Map for environments where storage APIs are restricted (sandboxes, incognito)
 */

import { Venture, VentureScore } from '../types/domain';
import { VentureAnalysisState } from '../types/state';

export interface IdeaInputFingerprint {
  idea?: string;
  title?: string;
  description?: string;
  rawIdea?: string;
  problem?: string;
  solution?: string;
  targetCustomer?: string;
  targetAudience?: string;
  geography?: string;
  marketGeography?: string;
  context?: string;
  businessModel?: string;
  answeredQuestions?: Array<{ id: string; question?: string; answer: string }> | Record<string, string>;
}

export interface CachedAnalysisEntry {
  cacheKey: string;
  ideaHash: number;
  canonicalIdea: string;
  title: string;
  rawIdeaText: string;
  targetCustomer?: string;
  geography?: string;
  context?: string;
  answeredQuestions?: Record<string, string>;
  venture: Venture;
  analysisState?: VentureAnalysisState;
  totalScore: number;
  scoreBreakdown: {
    market: number;
    business: number;
    moat: number;
    risk: number;
  };
  cachedAt: string;
  lastAccessedAt: string;
  hitCount: number;
}

const DB_NAME = 'StartupIntelligenceDB';
const DB_VERSION = 1;
const STORE_NAME = 'venture_analysis_cache_v1';
const LOCAL_STORAGE_PREFIX = 'si_idea_cache_';
const MAX_LOCAL_STORAGE_ITEMS = 25;

/**
 * Normalizes text for robust invariant matching
 */
export function normalizeString(val?: string | null): string {
  if (!val) return '';
  return val
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^\w\s]/gi, ' ')       // remove punctuation
    .replace(/\s+/g, ' ')            // collapse whitespace
    .trim();
}

/**
 * Stable 32-bit DJB2 Hash
 */
export function generateStableHash(str: string): number {
  let hash = 5381;
  const clean = (str || '').trim().toLowerCase();
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) + hash) + clean.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Derives a canonical, invariant fingerprint string and unique key for any venture idea.
 * Anchored primarily on normalized idea content so that missing/generated titles or slight
 * formatting differences do not break cache lookups or cause score variance.
 */
export function deriveCanonicalIdeaFingerprint(input: IdeaInputFingerprint): {
  canonicalString: string;
  cacheKey: string;
  ideaHash: number;
} {
  // Extract core idea text in priority order
  const rawIdea = input.idea || input.rawIdea || input.description || [input.problem, input.solution].filter(Boolean).join(' ') || input.title || '';
  const normIdea = normalizeString(rawIdea);
  
  const normCustomer = normalizeString(input.targetCustomer || input.targetAudience);
  const normGeo = normalizeString(input.geography || input.marketGeography);
  const normContext = normalizeString(input.context || input.businessModel);

  // Normalize question answers if provided
  const answersMap: Record<string, string> = {};
  if (Array.isArray(input.answeredQuestions)) {
    for (const item of input.answeredQuestions) {
      if (item.answer && item.answer.trim()) {
        const qKey = normalizeString(item.question || item.id);
        answersMap[qKey] = normalizeString(item.answer);
      }
    }
  } else if (input.answeredQuestions && typeof input.answeredQuestions === 'object') {
    for (const [k, v] of Object.entries(input.answeredQuestions)) {
      if (v && typeof v === 'string' && v.trim()) {
        answersMap[normalizeString(k)] = normalizeString(v);
      }
    }
  }

  const sortedAnswerPairs = Object.entries(answersMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join(';');

  // Invariant canonical string: independent of auto-generated titles
  const canonicalString = [
    `idea=${normIdea}`,
    `cust=${normCustomer}`,
    `geo=${normGeo}`,
    `ctx=${normContext}`,
    `ans=${sortedAnswerPairs}`
  ].join('|');

  const ideaHash = generateStableHash(canonicalString);
  const cacheKey = `idea_${ideaHash}`;

  return { canonicalString, cacheKey, ideaHash };
}

class AnalysisCacheService {
  private memoryCache: Map<string, CachedAnalysisEntry> = new Map();
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private isIndexedDBAvailable: boolean = typeof window !== 'undefined' && 'indexedDB' in window;

  constructor() {
    this.initDatabase();
    this.hydrateFromLocalStorage();
  }

  /**
   * Initializes IndexedDB connection
   */
  private async initDatabase(): Promise<IDBDatabase | null> {
    if (!this.isIndexedDBAvailable) return null;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'cacheKey' });
            store.createIndex('ideaHash', 'ideaHash', { unique: false });
            store.createIndex('cachedAt', 'cachedAt', { unique: false });
            store.createIndex('lastAccessedAt', 'lastAccessedAt', { unique: false });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = (err) => {
          console.warn('[AnalysisCache] IndexedDB open error, falling back to local state:', err);
          resolve(null);
        };
      } catch (err) {
        console.warn('[AnalysisCache] IndexedDB initialization failed:', err);
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  /**
   * Synchronously hydrates the fastest memory cache from localStorage on startup
   */
  private hydrateFromLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LOCAL_STORAGE_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const entry: CachedAnalysisEntry = JSON.parse(raw);
            if (entry && entry.cacheKey) {
              this.memoryCache.set(entry.cacheKey, entry);
            }
          }
        }
      }
    } catch {
      // Non-critical startup read
    }
  }

  /**
   * Retrieves cached analysis result by idea fingerprint
   */
  public async getCachedAnalysis(input: IdeaInputFingerprint): Promise<CachedAnalysisEntry | null> {
    const { cacheKey, canonicalString, ideaHash } = deriveCanonicalIdeaFingerprint(input);

    // 1. Fast Memory Cache
    let cached = this.memoryCache.get(cacheKey) || null;

    // 2. IndexedDB lookup if not in memory
    if (!cached) {
      try {
        const db = await this.initDatabase();
        if (db) {
          cached = await new Promise<CachedAnalysisEntry | null>((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(cacheKey);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
          });
        }
      } catch {
        cached = null;
      }
    }

    // 3. Fallback to localStorage if still not found
    if (!cached && typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${cacheKey}`);
        if (raw) {
          cached = JSON.parse(raw);
        }
      } catch {
        cached = null;
      }
    }

    // 4. Secondary fallback: Exact normalized idea text match across existing cached entries
    if (!cached) {
      const targetNorm = normalizeString(input.idea || input.rawIdea || input.description || input.title);
      if (targetNorm.length >= 20) {
        for (const entry of this.memoryCache.values()) {
          const entryNorm = normalizeString(entry.rawIdeaText || entry.title || entry.canonicalIdea);
          if (entryNorm === targetNorm) {
            cached = entry;
            break;
          }
        }
      }
    }

    if (cached) {
      // Update access stats and save
      cached.hitCount = (cached.hitCount || 0) + 1;
      cached.lastAccessedAt = new Date().toISOString();
      this.memoryCache.set(cacheKey, cached);

      // Async touch in storage
      this.touchStorage(cached).catch(() => {});

      console.log(
        `%c🎯 [AnalysisCache] Cache HIT!%c Restored stable score (${cached.totalScore}/100) for "${cached.title || input.title || 'Venture'}" (Key: ${cacheKey}, Hits: ${cached.hitCount})`,
        'background: #10b981; color: #ffffff; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
        'color: inherit; font-weight: bold;'
      );

      return cached;
    }

    return null;
  }

  /**
   * Checks if an identical idea already has a cached analysis
   */
  public hasCachedAnalysis(input: IdeaInputFingerprint): boolean {
    const { cacheKey } = deriveCanonicalIdeaFingerprint(input);
    return this.memoryCache.has(cacheKey);
  }

  /**
   * Saves completed venture analysis and full state to cache
   */
  public async saveAnalysis(
    input: IdeaInputFingerprint,
    venture: Venture,
    analysisState?: VentureAnalysisState | null
  ): Promise<CachedAnalysisEntry> {
    const { cacheKey, canonicalString, ideaHash } = deriveCanonicalIdeaFingerprint(input);

    const score = venture.score;
    const totalScore = score?.totalScore !== undefined ? score.totalScore : 0;
    const scoreBreakdown = {
      market: score?.dimensions?.marketProblemUrgency?.score || 0,
      business: score?.dimensions?.businessModelViability?.score || 0,
      moat: score?.dimensions?.defensibilityMoat?.score || 0,
      risk: score?.dimensions?.executionRisk?.score || 0
    };

    const existing = this.memoryCache.get(cacheKey);
    const hitCount = existing ? (existing.hitCount || 1) : 1;

    const entry: CachedAnalysisEntry = {
      cacheKey,
      ideaHash,
      canonicalIdea: canonicalString,
      title: venture.title || input.title || 'Untitled Venture',
      rawIdeaText: input.idea || input.rawIdea || input.description || venture.description || '',
      targetCustomer: input.targetCustomer || input.targetAudience || venture.targetCustomer,
      geography: input.geography || input.marketGeography || venture.marketGeography,
      context: input.context || input.businessModel || venture.businessModel,
      answeredQuestions: this.extractAnswersMap(input.answeredQuestions || venture.questions),
      venture: {
        ...venture,
        status: 'evaluated'
      },
      analysisState: analysisState || undefined,
      totalScore,
      scoreBreakdown,
      cachedAt: existing?.cachedAt || new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      hitCount
    };

    // 1. Store in Memory
    this.memoryCache.set(cacheKey, entry);

    // 2. Store in IndexedDB
    try {
      const db = await this.initDatabase();
      if (db) {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(entry);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      }
    } catch (err) {
      console.warn('[AnalysisCache] Failed to write to IndexedDB:', err);
    }

    // 3. Mirror into localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${cacheKey}`, JSON.stringify(entry));
        this.pruneLocalStorage();
      } catch {
        // Handle quota errors smoothly
      }
    }

    console.log(
      `%c💾 [AnalysisCache] Cached Venture Analysis%c "${entry.title}" -> Score: ${entry.totalScore}/100 (Key: ${cacheKey})`,
      'background: #0ea5e9; color: #ffffff; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
      'color: inherit; font-weight: bold;'
    );

    return entry;
  }

  /**
   * Updates access timestamps in persistent stores
   */
  private async touchStorage(entry: CachedAnalysisEntry): Promise<void> {
    try {
      const db = await this.initDatabase();
      if (db) {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(entry);
      }
    } catch {
      // Non-critical touch
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${entry.cacheKey}`, JSON.stringify(entry));
      } catch {
        // Ignore quota
      }
    }
  }

  /**
   * Helper to serialize answers
   */
  private extractAnswersMap(answeredQuestions?: any): Record<string, string> {
    const res: Record<string, string> = {};
    if (Array.isArray(answeredQuestions)) {
      for (const q of answeredQuestions) {
        if (q && q.answer) {
          res[q.id || q.question || 'q'] = q.answer;
        }
      }
    } else if (answeredQuestions && typeof answeredQuestions === 'object') {
      for (const [k, v] of Object.entries(answeredQuestions)) {
        if (typeof v === 'string') {
          res[k] = v;
        }
      }
    }
    return res;
  }

  /**
   * Prevents localStorage quota overflows by keeping most recent entries
   */
  private pruneLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const keys: { key: string; time: number }[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(LOCAL_STORAGE_PREFIX)) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              keys.push({ key: k, time: new Date(parsed.lastAccessedAt || parsed.cachedAt).getTime() });
            } catch {
              keys.push({ key: k, time: 0 });
            }
          }
        }
      }

      if (keys.length > MAX_LOCAL_STORAGE_ITEMS) {
        keys.sort((a, b) => a.time - b.time);
        const toRemove = keys.slice(0, keys.length - MAX_LOCAL_STORAGE_ITEMS);
        for (const item of toRemove) {
          localStorage.removeItem(item.key);
        }
      }
    } catch {
      // Non-critical pruning
    }
  }

  /**
   * Retrieves all cached venture analysis entries
   */
  public async getAllCachedEntries(): Promise<CachedAnalysisEntry[]> {
    const list: CachedAnalysisEntry[] = [];
    const seen = new Set<string>();

    // 1. From memory
    for (const [k, v] of this.memoryCache.entries()) {
      list.push(v);
      seen.add(k);
    }

    // 2. From IndexedDB
    try {
      const db = await this.initDatabase();
      if (db) {
        const idbEntries = await new Promise<CachedAnalysisEntry[]>((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });

        for (const item of idbEntries) {
          if (!seen.has(item.cacheKey)) {
            list.push(item);
            seen.add(item.cacheKey);
            this.memoryCache.set(item.cacheKey, item);
          }
        }
      }
    } catch {
      // Non-critical read
    }

    // Sort by most recently accessed
    return list.sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime());
  }

  public async getAllCachedAnalyses(): Promise<CachedAnalysisEntry[]> {
    return this.getAllCachedEntries();
  }

  /**
   * Clears all cached analyses
   */
  public async clearCache(): Promise<void> {
    this.memoryCache.clear();

    try {
      const db = await this.initDatabase();
      if (db) {
        await new Promise<void>((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.clear();
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        });
      }
    } catch {
      // Non-critical clear
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const toDelete: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(LOCAL_STORAGE_PREFIX)) {
            toDelete.push(k);
          }
        }
        for (const k of toDelete) {
          localStorage.removeItem(k);
        }
      } catch {
        // Non-critical
      }
    }

    console.log('[AnalysisCache] Cache cleared successfully.');
  }

  /**
   * Deletes a specific cache entry
   */
  public async deleteCacheEntry(cacheKey: string): Promise<boolean> {
    this.memoryCache.delete(cacheKey);

    try {
      const db = await this.initDatabase();
      if (db) {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(cacheKey);
      }
    } catch {
      // Non-critical
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${cacheKey}`);
      } catch {
        // Non-critical
      }
    }

    return true;
  }
}

export const analysisCacheService = new AnalysisCacheService();
