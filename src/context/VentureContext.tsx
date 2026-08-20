import React, { createContext, useContext, useState, useEffect } from 'react';
import { Venture, CriticalQuestion, Decision, NextAction } from '../types/domain';
import { VentureAnalysisState } from '../types/state';
import { createLocalVenture, generateLocalEvaluatedVenture } from '../utils/clientFallbackEngine';
import { 
  analysisCacheService, 
  CachedAnalysisEntry, 
  IdeaInputFingerprint 
} from '../services/analysisCache';

export type ActiveView = 
  | 'input'
  | 'analysis'
  | 'workspace'
  | 'report_research'
  | 'report_business'
  | 'report_red_team'
  | 'report_judge'
  | 'dashboard';

interface VentureContextType {
  ventures: Venture[];
  activeVenture: Venture | null;
  analysisState: VentureAnalysisState | null;
  activeView: ActiveView;
  isLoading: boolean;
  isIntaking: boolean;
  isAnalyzing: boolean;
  isRecordingDecision: boolean;
  error: string | null;
  isLoadedFromCache: boolean;
  activeCacheEntry: CachedAnalysisEntry | null;
  cachedAnalyses: CachedAnalysisEntry[];
  setActiveView: (view: ActiveView) => void;
  selectVenture: (id: string) => Promise<void>;
  createVenture: (data: {
    title: string;
    description: string;
    targetAudience?: string;
    valueProposition?: string;
    monetizationIdea?: string;
  }) => Promise<Venture | null>;
  createVentureFromIntake: (data: {
    idea: string;
    targetCustomer?: string;
    geography?: string;
    context?: string;
  }) => Promise<Venture | null>;
  answerQuestion: (questionId: string, answer: string) => Promise<void>;
  skipQuestion: (questionId: string) => Promise<void>;
  finalizeIntake: () => Promise<void>;
  runAnalysis: (ventureId: string, forceFresh?: boolean) => Promise<void>;
  reAnalyzeVenture: (ventureId: string, forceFresh?: boolean) => Promise<void>;
  clearCache: () => Promise<void>;
  loadFromCacheEntry: (entry: CachedAnalysisEntry) => Promise<void>;
  recordDecision: (
    ventureId: string,
    data: {
      choice: Decision['choice'];
      rationale: string;
      alignmentWithAI: Decision['alignmentWithAI'];
      overrideReason?: string;
    }
  ) => Promise<void>;
  submitDecision: (data: {
    choice: Decision['choice'];
    rationale: string;
    alignmentWithAI: Decision['alignmentWithAI'];
    overrideReason?: string;
  }) => Promise<void>;
  toggleAction: (actionId: string) => Promise<void>;
  refreshVentures: () => Promise<void>;
}

/**
 * Enhanced API Fetch client with granular error & metadata logging
 * Specifically pinpoints 500 error causes, request metadata, and upstream service failures.
 */
async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const startTime = Date.now();
  const method = init?.method || 'GET';
  const url = input;
  const timestamp = new Date().toISOString();

  // Extract metadata safely
  let payloadSummary: any = undefined;
  let payloadBytes = 0;
  if (init?.body) {
    if (typeof init.body === 'string') {
      payloadBytes = init.body.length;
      try {
        payloadSummary = JSON.parse(init.body);
      } catch {
        payloadSummary = init.body.substring(0, 200);
      }
    } else {
      payloadBytes = 1;
      payloadSummary = '[Binary/FormData]';
    }
  }

  const requestMetadata = {
    method,
    url,
    timestamp,
    headers: init?.headers,
    payloadBytes,
    payloadSummary
  };

  try {
    const response = await fetch(input, init);
    const durationMs = Date.now() - startTime;

    // Granular logging when status code is 500 or any error >= 400
    if (!response.ok) {
      // Clone response to read body without consuming the original stream
      let responseBody: any = null;
      let rawText = '';
      try {
        const clone = response.clone();
        rawText = await clone.text();
        try {
          responseBody = JSON.parse(rawText);
        } catch {
          responseBody = rawText;
        }
      } catch (cloneErr) {
        responseBody = `[Failed to read response body: ${cloneErr}]`;
      }

      // Analyze error context to identify failing upstream service
      let failingService = 'Unknown / Server Gateway';
      let diagnosisHint = 'Inspect server runtime logs or run await checkServerSupabaseEnv()';

      const errorString = (typeof responseBody === 'object' ? JSON.stringify(responseBody) : String(responseBody || '')).toLowerCase();
      
      if (errorString.includes('supabase') || errorString.includes('relation') || errorString.includes('pgrst') || errorString.includes('service_role')) {
        failingService = 'Supabase Database / PostgreSQL';
        diagnosisHint = 'Check if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in Vercel. Run window.checkServerSupabaseEnv() in console.';
      } else if (errorString.includes('gemini') || errorString.includes('genai') || errorString.includes('api_key') || errorString.includes('model')) {
        failingService = 'Google Gemini AI Service';
        diagnosisHint = 'Check GEMINI_API_KEY environment variable in server environment settings.';
      } else if (errorString.includes('vercel') || response.status === 504 || response.status === 502) {
        failingService = 'Vercel Serverless Function Gateway';
        diagnosisHint = 'Serverless function timed out or encountered unhandled exception during cold boot.';
      } else if (url.includes('/analyze')) {
        failingService = 'Multi-Agent Orchestration Engine (Research/Business/RedTeam/Judge)';
        diagnosisHint = 'Multi-agent analysis pipeline failed. Local client synthesis engine fallback will engage automatically.';
      } else if (url.includes('/intake')) {
        failingService = 'Venture Intake Pipeline';
        diagnosisHint = 'Idea parsing failed. Local intake fallback will engage automatically.';
      }

      const is500 = response.status >= 500;
      const logHeaderStyle = is500
        ? 'background: #dc2626; color: #ffffff; font-weight: bold; padding: 3px 6px; border-radius: 3px;'
        : 'background: #d97706; color: #ffffff; font-weight: bold; padding: 3px 6px; border-radius: 3px;';

      console.groupCollapsed(
        `%c${is500 ? '🚨 HTTP 500 ERROR' : `⚠️ HTTP ${response.status} ERROR`}%c ${method} ${url} (${durationMs}ms)`,
        logHeaderStyle,
        'color: inherit; font-weight: bold;'
      );

      console.log('%c🎯 Identified Failing Component:', 'color: #ef4444; font-weight: bold;', failingService);
      console.log('%c💡 Diagnostic Recommendation:', 'color: #3b82f6; font-weight: bold;', diagnosisHint);
      
      console.group('Request Metadata');
      console.log('Target URL     :', url);
      console.log('HTTP Method    :', method);
      console.log('Sent Timestamp :', timestamp);
      console.log('Payload Size   :', `${payloadBytes} bytes`);
      if (payloadSummary) console.log('Payload Summary:', payloadSummary);
      console.log('Headers        :', init?.headers || {});
      console.groupEnd();

      console.group('Response Metadata');
      console.log('Status Code    :', response.status);
      console.log('Status Text    :', response.statusText);
      console.log('Round-Trip Time:', `${durationMs}ms`);
      console.log('Response Body  :', responseBody);
      console.groupEnd();

      console.groupEnd();
    }

    return response;
  } catch (networkError: any) {
    const durationMs = Date.now() - startTime;

    console.groupCollapsed(
      `%c🚨 NETWORK FETCH FAILED%c ${method} ${url} (${durationMs}ms)`,
      'background: #dc2626; color: #ffffff; font-weight: bold; padding: 3px 6px; border-radius: 3px;',
      'color: inherit; font-weight: bold;'
    );
    console.error('Network Error Detail:', networkError?.message || networkError);
    console.log('%c💡 Diagnostic Hint:', 'color: #3b82f6; font-weight: bold;', 'Server is unreachable or CORS / deployment rewrite failed. Engaging zero-crash local fallback.');
    console.group('Failed Request Metadata');
    console.log('Target URL     :', url);
    console.log('HTTP Method    :', method);
    console.log('Sent Timestamp :', timestamp);
    console.log('Payload Size   :', `${payloadBytes} bytes`);
    if (payloadSummary) console.log('Payload Summary:', payloadSummary);
    console.groupEnd();
    console.groupEnd();

    throw networkError;
  }
}

const VentureContext = createContext<VentureContextType | undefined>(undefined);

export const VentureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [activeVenture, setActiveVenture] = useState<Venture | null>(null);
  const [analysisState, setAnalysisState] = useState<VentureAnalysisState | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isIntaking, setIsIntaking] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isRecordingDecision, setIsRecordingDecision] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadedFromCache, setIsLoadedFromCache] = useState<boolean>(false);
  const [activeCacheEntry, setActiveCacheEntry] = useState<CachedAnalysisEntry | null>(null);
  const [cachedAnalyses, setCachedAnalyses] = useState<CachedAnalysisEntry[]>([]);

  const refreshCachedList = async () => {
    try {
      const all = await analysisCacheService.getAllCachedAnalyses();
      setCachedAnalyses(all);
    } catch {
      // Ignore cache list read failures
    }
  };

  useEffect(() => {
    refreshCachedList();
  }, []);

  const fetchVentures = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetch('/api/ventures');
      if (!res.ok) {
        setVentures([]);
        setActiveVenture(null);
        setAnalysisState(null);
        setActiveView('input');
        return;
      }
      const data: Venture[] = await res.json();
      const safeVentures = Array.isArray(data) ? data : [];
      setVentures(safeVentures);

      if (safeVentures.length > 0) {
        if (!activeVenture || !safeVentures.some(v => v.id === activeVenture.id)) {
          const selected = safeVentures[0];
          setActiveVenture(selected);
          await fetchAnalysisState(selected.id);
          if (selected.status === 'draft' || selected.status === 'clarifying') {
            setActiveView('input');
          } else {
            setActiveView('dashboard');
          }
        }
      } else {
        setActiveVenture(null);
        setAnalysisState(null);
        setActiveView('input');
      }
    } catch {
      // Soft fallback to empty ventures so the user can immediately use the input view
      setVentures([]);
      setActiveVenture(null);
      setAnalysisState(null);
      setActiveView('input');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalysisState = async (ventureId: string) => {
    try {
      const res = await apiFetch(`/api/ventures/${ventureId}/state`);
      if (res.ok) {
        const state: VentureAnalysisState = await res.json();
        setAnalysisState(state);
      }
    } catch {
      // Non-critical fallback
    }
  };

  useEffect(() => {
    fetchVentures();
  }, []);

  // Poll analysis state during active analysis
  useEffect(() => {
    if (!isAnalyzing || !activeVenture?.id) return;

    const interval = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/ventures/${activeVenture.id}`);
        if (res.ok) {
          const v: Venture = await res.json();
          setActiveVenture(v);
          await fetchAnalysisState(v.id);
        }
      } catch {
        // Non-critical poll catch
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isAnalyzing, activeVenture?.id]);

  const selectVenture = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/api/ventures/${id}`);
      if (!res.ok) throw new Error('Failed to load venture');
      const data: Venture = await res.json();
      setActiveVenture(data);
      await fetchAnalysisState(id);
      if (data.status === 'evaluated' || data.status === 'decided') {
        setActiveView('dashboard');
      } else if (data.status === 'analyzing') {
        setActiveView('analysis');
      } else {
        setActiveView('input');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createVentureFromIntake = async (data: {
    idea: string;
    targetCustomer?: string;
    geography?: string;
    context?: string;
  }): Promise<Venture | null> => {
    try {
      setIsIntaking(true);
      setError(null);

      // Check if an identical idea was already analyzed and stored in cache
      const cached = await analysisCacheService.getCachedAnalysis({
        idea: data.idea,
        targetCustomer: data.targetCustomer,
        geography: data.geography,
        context: data.context
      });

      if (cached && cached.venture && cached.venture.score) {
        console.log(`[VentureContext] ⚡ Instant Cache Hit in Intake for "${data.idea.slice(0, 40)}...". Restoring deterministic score: ${cached.venture.score.totalScore}/100.`);
        
        const restoredVenture: Venture = {
          ...cached.venture,
          id: `v_cached_${Date.now()}`,
          status: 'evaluated',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setVentures(prev => [restoredVenture, ...prev]);
        setActiveVenture(restoredVenture);
        
        if (cached.analysisState) {
          setAnalysisState({
            ...cached.analysisState,
            venture: restoredVenture,
            scores: cached.venture.score,
            analysisStatus: 'completed',
            lifecycleStatus: 'evaluated'
          });
        }

        setIsLoadedFromCache(true);
        setActiveCacheEntry(cached);
        await refreshCachedList();
        setActiveView('dashboard');
        return restoredVenture;
      }
      
      try {
        const res = await apiFetch('/api/ventures/intake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (res.ok) {
          const responseData = await res.json();
          const newVenture: Venture = responseData.venture;
          const state: VentureAnalysisState = responseData.analysisState;

          setVentures(prev => [newVenture, ...prev]);
          setActiveVenture(newVenture);
          setAnalysisState(state);
          setIsLoadedFromCache(false);
          setActiveCacheEntry(null);
          setActiveView('input');
          return newVenture;
        }
      } catch {
        // Handled in apiFetch with granular log
      }

      // Graceful local engine fallback if server is unreachable or returned 500
      const localResult = createLocalVenture(data);
      setVentures(prev => [localResult.venture, ...prev]);
      setActiveVenture(localResult.venture);
      setAnalysisState(localResult.analysisState);
      setIsLoadedFromCache(false);
      setActiveCacheEntry(null);
      setActiveView('input');
      return localResult.venture;
    } catch {
      const localResult = createLocalVenture(data);
      setVentures(prev => [localResult.venture, ...prev]);
      setActiveVenture(localResult.venture);
      setAnalysisState(localResult.analysisState);
      setIsLoadedFromCache(false);
      setActiveCacheEntry(null);
      setActiveView('input');
      return localResult.venture;
    } finally {
      setIsIntaking(false);
    }
  };

  const createVenture = async (data: {
    title: string;
    description: string;
    targetAudience?: string;
    valueProposition?: string;
    monetizationIdea?: string;
  }): Promise<Venture | null> => {
    return createVentureFromIntake({
      idea: `${data.title}: ${data.description}`,
      targetCustomer: data.targetAudience,
      context: [data.valueProposition, data.monetizationIdea].filter(Boolean).join('; ')
    });
  };

  const answerQuestion = async (questionId: string, answer: string) => {
    if (!activeVenture) return;
    try {
      try {
        const res = await apiFetch(`/api/ventures/${activeVenture.id}/questions/${questionId}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer })
        });
        if (res.ok) {
          const responseData = await res.json();
          const updatedQuestion: CriticalQuestion = responseData.question || responseData;
          if (responseData.state) {
            setAnalysisState(responseData.state);
          }
          setActiveVenture(prev => {
            if (!prev) return null;
            return {
              ...prev,
              questions: prev.questions.map(q => q.id === questionId ? updatedQuestion : q)
            };
          });
          setVentures(prev => prev.map(v => v.id === activeVenture.id ? {
            ...v,
            questions: v.questions.map(q => q.id === questionId ? updatedQuestion : q)
          } : v));
          return;
        }
      } catch {
        // Fall through to local update
      }

      // Local state fallback
      const updatedQuestions = activeVenture.questions.map(q =>
        q.id === questionId ? { ...q, answer, status: 'ANSWERED' as const } : q
      );
      const updatedVenture = { ...activeVenture, questions: updatedQuestions };
      setActiveVenture(updatedVenture);
      setVentures(prev => prev.map(v => v.id === activeVenture.id ? updatedVenture : v));
    } catch (err: any) {
      console.warn('[VentureContext] answerQuestion notice:', err?.message || err);
    }
  };

  const skipQuestion = async (questionId: string) => {
    if (!activeVenture) return;
    try {
      try {
        const res = await apiFetch(`/api/ventures/${activeVenture.id}/questions/${questionId}/skip`, {
          method: 'POST'
        });
        if (res.ok) {
          const responseData = await res.json();
          const updatedQuestion: CriticalQuestion = responseData.question || responseData;
          if (responseData.state) {
            setAnalysisState(responseData.state);
          }
          setActiveVenture(prev => {
            if (!prev) return null;
            return {
              ...prev,
              questions: prev.questions.map(q => q.id === questionId ? updatedQuestion : q)
            };
          });
          setVentures(prev => prev.map(v => v.id === activeVenture.id ? {
            ...v,
            questions: v.questions.map(q => q.id === questionId ? updatedQuestion : q)
          } : v));
          return;
        }
      } catch {
        // Fall through to local update
      }

      // Local state fallback
      const updatedQuestions = activeVenture.questions.map(q =>
        q.id === questionId ? { ...q, status: 'SKIPPED' as const } : q
      );
      const updatedVenture = { ...activeVenture, questions: updatedQuestions };
      setActiveVenture(updatedVenture);
      setVentures(prev => prev.map(v => v.id === activeVenture.id ? updatedVenture : v));
    } catch (err: any) {
      console.warn('[VentureContext] skipQuestion notice:', err?.message || err);
    }
  };

  const finalizeIntake = async () => {
    if (!activeVenture) return;
    try {
      try {
        const res = await apiFetch(`/api/ventures/${activeVenture.id}/finalize-intake`, {
          method: 'POST'
        });
        if (res.ok) {
          const state: VentureAnalysisState = await res.json();
          setAnalysisState(state);
          setActiveVenture(state.venture);
          setVentures(prev => prev.map(v => v.id === state.venture.id ? state.venture : v));
          return;
        }
      } catch {
        // Fall through to local update
      }

      const finalizedVenture = { ...activeVenture, status: 'draft' as const };
      setActiveVenture(finalizedVenture);
      setVentures(prev => prev.map(v => v.id === activeVenture.id ? finalizedVenture : v));
    } catch (err: any) {
      console.warn('[VentureContext] finalizeIntake notice:', err?.message || err);
    }
  };

  const runAnalysis = async (ventureId: string, forceFresh: boolean = false) => {
    try {
      setIsAnalyzing(true);
      setActiveView('analysis');
      setError(null);

      const targetVenture = activeVenture?.id === ventureId ? activeVenture : ventures.find(v => v.id === ventureId);
      
      const fingerprint: IdeaInputFingerprint = {
        title: targetVenture?.title,
        idea: targetVenture?.rawIdea || targetVenture?.description,
        description: targetVenture?.description,
        problem: targetVenture?.problem,
        solution: targetVenture?.solution,
        targetCustomer: targetVenture?.targetCustomer || targetVenture?.targetAudience,
        geography: targetVenture?.marketGeography,
        context: targetVenture?.businessModel || targetVenture?.monetizationIdea,
        answeredQuestions: targetVenture?.questions?.filter(q => q.status === 'ANSWERED' || !!q.answer)
      };

      // 1. Check client-side IndexedDB & memory cache if not forced fresh
      if (!forceFresh) {
        const cached = await analysisCacheService.getCachedAnalysis(fingerprint);
        if (cached && cached.venture && cached.venture.score) {
          console.log(`[VentureContext] ⚡ Instant Cache Hit for "${targetVenture?.title || ventureId}". Score: ${cached.venture.score.totalScore}/100.`);
          
          await new Promise(r => setTimeout(r, 600));

          const mergedVenture: Venture = {
            ...cached.venture,
            id: ventureId,
            title: targetVenture?.title || cached.venture.title,
            status: 'evaluated'
          };

          setActiveVenture(mergedVenture);
          setVentures(prev => prev.map(v => v.id === ventureId ? mergedVenture : v));

          if (cached.analysisState) {
            setAnalysisState({
              ...cached.analysisState,
              venture: mergedVenture,
              scores: cached.venture.score || null,
              analysisStatus: 'completed',
              lifecycleStatus: 'evaluated'
            });
          }

          setIsLoadedFromCache(true);
          setActiveCacheEntry(cached);
          await refreshCachedList();
          setActiveView('dashboard');
          return;
        }
      }

      // 2. Cache miss or forced rerun: Execute analysis pipeline
      setIsLoadedFromCache(false);
      setActiveCacheEntry(null);

      // Brief animation delay so user sees pipeline in progress
      await new Promise(r => setTimeout(r, 1000));

      let evaluatedVenture: Venture | null = null;
      let evaluatedState: VentureAnalysisState | null = null;

      try {
        const res = await apiFetch(`/api/ventures/${ventureId}/analyze`, {
          method: 'POST'
        });
        if (res.ok) {
          evaluatedVenture = await res.json();
          if (evaluatedVenture) {
            setActiveVenture(evaluatedVenture);
            setVentures(prev => prev.map(v => v.id === ventureId ? evaluatedVenture! : v));
            await fetchAnalysisState(ventureId);
          }
        }
      } catch {
        // Handled in apiFetch with granular log
      }

      // Local synthesis fallback if server was unavailable
      if (!evaluatedVenture && targetVenture) {
        const localEvaluated = generateLocalEvaluatedVenture(targetVenture);
        evaluatedVenture = localEvaluated.venture;
        evaluatedState = localEvaluated.analysisState;
        setActiveVenture(localEvaluated.venture);
        setAnalysisState(localEvaluated.analysisState);
        setVentures(prev => prev.map(v => v.id === ventureId ? localEvaluated.venture : v));
      }

      // 3. Save evaluated venture and score to IndexedDB cache
      if (evaluatedVenture && evaluatedVenture.score) {
        const saved = await analysisCacheService.saveAnalysis(
          fingerprint,
          evaluatedVenture,
          analysisState || evaluatedState
        );
        setActiveCacheEntry(saved);
        await refreshCachedList();
      }

      setActiveView('dashboard');
    } catch (err: any) {
      console.warn('[VentureContext] runAnalysis notice:', err?.message || err);
      if (activeVenture) {
        const localEvaluated = generateLocalEvaluatedVenture(activeVenture);
        setActiveVenture(localEvaluated.venture);
        setAnalysisState(localEvaluated.analysisState);
        if (localEvaluated.venture.score) {
          const saved = await analysisCacheService.saveAnalysis(
            { title: activeVenture.title, idea: activeVenture.rawIdea || activeVenture.description },
            localEvaluated.venture,
            localEvaluated.analysisState
          );
          setActiveCacheEntry(saved);
          await refreshCachedList();
        }
      }
      setActiveView('dashboard');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reAnalyzeVenture = async (ventureId: string, forceFresh: boolean = true) => {
    await runAnalysis(ventureId, forceFresh);
  };

  const clearCache = async () => {
    await analysisCacheService.clearCache();
    setActiveCacheEntry(null);
    setIsLoadedFromCache(false);
    await refreshCachedList();
  };

  const loadFromCacheEntry = async (entry: CachedAnalysisEntry) => {
    if (!entry.venture) return;
    const restoredVenture: Venture = {
      ...entry.venture,
      id: `v_cached_${Date.now()}_${entry.ideaHash}`,
      status: 'evaluated',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setVentures(prev => [restoredVenture, ...prev]);
    setActiveVenture(restoredVenture);
    if (entry.analysisState) {
      setAnalysisState({
        ...entry.analysisState,
        venture: restoredVenture,
        scores: entry.venture.score || null,
        analysisStatus: 'completed',
        lifecycleStatus: 'evaluated'
      });
    }
    setIsLoadedFromCache(true);
    setActiveCacheEntry(entry);
    setActiveView('dashboard');
  };

  const recordDecision = async (
    ventureId: string,
    data: {
      choice: Decision['choice'];
      rationale: string;
      alignmentWithAI: Decision['alignmentWithAI'];
      overrideReason?: string;
    }
  ) => {
    try {
      setIsRecordingDecision(true);
      setError(null);
      const newDecision: Decision = {
        id: `dec_${ventureId}_${Date.now()}`,
        ventureId,
        choice: data.choice,
        rationale: data.rationale,
        alignmentWithAI: data.alignmentWithAI,
        overrideReason: data.overrideReason,
        decidedAt: new Date().toISOString()
      };

      try {
        const res = await apiFetch(`/api/ventures/${ventureId}/decision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          const decision: Decision = await res.json();
          setActiveVenture(prev => {
            if (!prev) return null;
            return { ...prev, decision, status: 'decided' };
          });
          setVentures(prev => prev.map(v => v.id === ventureId ? { ...v, decision, status: 'decided' } : v));
          await fetchAnalysisState(ventureId);
          return;
        }
      } catch {
        // Fall through to local update
      }

      setActiveVenture(prev => {
        if (!prev) return null;
        return { ...prev, decision: newDecision, status: 'decided' };
      });
      setVentures(prev => prev.map(v => v.id === ventureId ? { ...v, decision: newDecision, status: 'decided' } : v));
    } catch (err: any) {
      console.warn('[VentureContext] recordDecision notice:', err?.message || err);
    } finally {
      setIsRecordingDecision(false);
    }
  };

  const submitDecision = async (data: {
    choice: Decision['choice'];
    rationale: string;
    alignmentWithAI: Decision['alignmentWithAI'];
    overrideReason?: string;
  }) => {
    if (!activeVenture) return;
    await recordDecision(activeVenture.id, data);
  };

  const toggleAction = async (actionId: string) => {
    if (!activeVenture) return;
    try {
      try {
        const res = await apiFetch(`/api/ventures/${activeVenture.id}/actions/${actionId}/toggle`, {
          method: 'POST'
        });
        if (res.ok) {
          const updatedAction: NextAction = await res.json();
          setActiveVenture(prev => {
            if (!prev) return null;
            const updatedActions = (prev.nextActions || []).map(a => a.id === actionId ? updatedAction : a);
            return { ...prev, nextActions: updatedActions };
          });
          setVentures(prev => prev.map(v => v.id === activeVenture.id ? {
            ...v,
            nextActions: (v.nextActions || []).map(a => a.id === actionId ? updatedAction : a)
          } : v));
          return;
        }
      } catch {
        // Fall through to local update
      }

      // Local state fallback
      setActiveVenture(prev => {
        if (!prev) return null;
        const updatedActions = (prev.nextActions || []).map(a =>
          a.id === actionId ? { ...a, completed: !a.completed } : a
        );
        return { ...prev, nextActions: updatedActions };
      });
      setVentures(prev => prev.map(v => v.id === activeVenture.id ? {
        ...v,
        nextActions: (v.nextActions || []).map(a => a.id === actionId ? { ...a, completed: !a.completed } : a)
      } : v));
    } catch (err: any) {
      console.warn('[VentureContext] toggleAction notice:', err?.message || err);
    }
  };

  return (
    <VentureContext.Provider
      value={{
        ventures,
        activeVenture,
        analysisState,
        activeView,
        isLoading,
        isIntaking,
        isAnalyzing,
        isRecordingDecision,
        error,
        isLoadedFromCache,
        activeCacheEntry,
        cachedAnalyses,
        setActiveView,
        selectVenture,
        createVenture,
        createVentureFromIntake,
        answerQuestion,
        skipQuestion,
        finalizeIntake,
        runAnalysis,
        reAnalyzeVenture,
        clearCache,
        loadFromCacheEntry,
        recordDecision,
        submitDecision,
        toggleAction,
        refreshVentures: fetchVentures
      }}
    >
      {children}
    </VentureContext.Provider>
  );
};

export const useVenture = () => {
  const context = useContext(VentureContext);
  if (!context) {
    throw new Error('useVenture must be used within a VentureProvider');
  }
  return context;
};
