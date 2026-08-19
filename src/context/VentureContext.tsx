import React, { createContext, useContext, useState, useEffect } from 'react';
import { Venture, CriticalQuestion, Decision, NextAction } from '../types/domain';
import { VentureAnalysisState } from '../types/state';

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
  runAnalysis: (ventureId: string) => Promise<void>;
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

  const fetchVentures = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/ventures');
      if (!res.ok) {
        console.warn(`[VentureContext] /api/ventures returned status ${res.status}. Falling back to clean initial state.`);
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
    } catch (err: any) {
      console.warn('[VentureContext] fetchVentures network notice:', err?.message || err);
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
      const res = await fetch(`/api/ventures/${ventureId}/state`);
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
        const res = await fetch(`/api/ventures/${activeVenture.id}`);
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
      const res = await fetch(`/api/ventures/${id}`);
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
      const res = await fetch('/api/ventures/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to process startup idea');
      }
      const responseData = await res.json();
      const newVenture: Venture = responseData.venture;
      const state: VentureAnalysisState = responseData.analysisState;

      setVentures(prev => [newVenture, ...prev]);
      setActiveVenture(newVenture);
      setAnalysisState(state);
      setActiveView('input');
      return newVenture;
    } catch (err: any) {
      setError(err.message);
      return null;
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
      const res = await fetch(`/api/ventures/${activeVenture.id}/questions/${questionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer })
      });
      if (!res.ok) throw new Error('Failed to submit question answer');
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
    } catch (err: any) {
      setError(err.message);
    }
  };

  const skipQuestion = async (questionId: string) => {
    if (!activeVenture) return;
    try {
      const res = await fetch(`/api/ventures/${activeVenture.id}/questions/${questionId}/skip`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to skip question');
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
    } catch (err: any) {
      setError(err.message);
    }
  };

  const finalizeIntake = async () => {
    if (!activeVenture) return;
    try {
      const res = await fetch(`/api/ventures/${activeVenture.id}/finalize-intake`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to finalize intake');
      const state: VentureAnalysisState = await res.json();
      setAnalysisState(state);
      setActiveVenture(state.venture);
      setVentures(prev => prev.map(v => v.id === state.venture.id ? state.venture : v));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const runAnalysis = async (ventureId: string) => {
    try {
      setIsAnalyzing(true);
      setActiveView('analysis');
      setError(null);
      const res = await fetch(`/api/ventures/${ventureId}/analyze`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to complete multi-agent analysis');
      const evaluatedVenture: Venture = await res.json();
      setActiveVenture(evaluatedVenture);
      setVentures(prev => prev.map(v => v.id === ventureId ? evaluatedVenture : v));
      await fetchAnalysisState(ventureId);
      setActiveView('dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
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
      const res = await fetch(`/api/ventures/${ventureId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to record founder decision');
      const decision: Decision = await res.json();
      setActiveVenture(prev => {
        if (!prev) return null;
        return { ...prev, decision, status: 'decided' };
      });
      setVentures(prev => prev.map(v => v.id === ventureId ? { ...v, decision, status: 'decided' } : v));
      await fetchAnalysisState(ventureId);
    } catch (err: any) {
      setError(err.message);
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
      const res = await fetch(`/api/ventures/${activeVenture.id}/actions/${actionId}/toggle`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to toggle action completion');
      const updatedAction: NextAction = await res.json();
      setActiveVenture(prev => {
        if (!prev) return null;
        return {
          ...prev,
          nextActions: prev.nextActions.map(a => a.id === actionId ? updatedAction : a)
        };
      });
    } catch (err: any) {
      setError(err.message);
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
        setActiveView,
        selectVenture,
        createVenture,
        createVentureFromIntake,
        answerQuestion,
        skipQuestion,
        finalizeIntake,
        runAnalysis,
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
