-- Migration 002: Agent Runs and Structured Agent Outputs
-- Tracks lifecycle of specialized agents: research, business, red_team, judge

CREATE TABLE IF NOT EXISTS public.agent_runs (
    id VARCHAR(64) PRIMARY KEY,
    venture_id VARCHAR(64) NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
    agent_type VARCHAR(32) NOT NULL, -- 'research' | 'business' | 'red_team' | 'judge'
    status VARCHAR(32) NOT NULL DEFAULT 'idle', -- 'idle' | 'running' | 'completed' | 'failed'
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error TEXT,
    analysis_run_id VARCHAR(64),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Structured Agent Outputs (Separates structured domain entities from raw model logs)
CREATE TABLE IF NOT EXISTS public.agent_outputs (
    id VARCHAR(64) PRIMARY KEY,
    agent_run_id VARCHAR(64) NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
    venture_id VARCHAR(64) NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
    agent_type VARCHAR(32) NOT NULL,
    output_summary TEXT,
    confidence_level VARCHAR(32) DEFAULT 'MEDIUM',
    structured_payload JSONB NOT NULL,
    raw_model_response TEXT, -- Retained specifically for debugging / telemetry
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_venture ON public.agent_runs(venture_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_type_status ON public.agent_runs(agent_type, status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_analysis_run ON public.agent_runs(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_run ON public.agent_outputs(agent_run_id);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_venture ON public.agent_outputs(venture_id);
