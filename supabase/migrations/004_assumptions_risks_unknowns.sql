-- Migration 004: Assumptions, Risks, Critical Unknowns, and Competitor Intelligence
-- Relational tracking of venture hypotheses, failure modes, unknowns, and market actors

-- Assumptions Table
CREATE TABLE IF NOT EXISTS public.assumptions (
    id VARCHAR(64) PRIMARY KEY,
    venture_id VARCHAR(64) NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
    agent_run_id VARCHAR(64) REFERENCES public.agent_runs(id) ON DELETE SET NULL,
    report_id VARCHAR(64),
    statement TEXT NOT NULL,
    category VARCHAR(64) NOT NULL, -- 'VALUE_PROPOSITION' | 'UNIT_ECONOMICS' | 'DISTRIBUTION' | 'TECHNICAL' | 'REGULATORY'
    importance VARCHAR(32) NOT NULL DEFAULT 'HIGH', -- 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    evidence_status VARCHAR(32) NOT NULL DEFAULT 'unverified', -- 'verified' | 'unverified' | 'refuted'
    confidence VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    validation_method TEXT,
    is_high_risk BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Risks Table (Consolidates Business Risks, Red Team Fatal Vulnerabilities, and Operational Risks)
CREATE TABLE IF NOT EXISTS public.risks (
    id VARCHAR(64) PRIMARY KEY,
    venture_id VARCHAR(64) NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
    agent_run_id VARCHAR(64) REFERENCES public.agent_runs(id) ON DELETE SET NULL,
    report_id VARCHAR(64),
    agent_type VARCHAR(32) NOT NULL, -- 'business' | 'red_team' | 'judge'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(64) NOT NULL, -- 'MARKET' | 'EXECUTION' | 'TECHNICAL' | 'REGULATORY' | 'COMPETITIVE' | 'FINANCIAL'
    probability VARCHAR(32) NOT NULL DEFAULT 'MEDIUM', -- 'HIGH' | 'MEDIUM' | 'LOW'
    impact VARCHAR(32) NOT NULL DEFAULT 'HIGH', -- 'FATAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    severity VARCHAR(32) NOT NULL DEFAULT 'HIGH',
    evidence TEXT,
    confidence VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    mitigation TEXT,
    validation_action TEXT,
    pre_mortem_trigger TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Critical Unknowns Table (Unresolved factual gaps that could flip decisions)
CREATE TABLE IF NOT EXISTS public.critical_unknowns (
    id VARCHAR(64) PRIMARY KEY,
    venture_id VARCHAR(64) NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
    agent_run_id VARCHAR(64) REFERENCES public.agent_runs(id) ON DELETE SET NULL,
    report_id VARCHAR(64),
    statement TEXT NOT NULL,
    why_it_matters TEXT NOT NULL,
    current_evidence TEXT,
    confidence VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    impact VARCHAR(32) NOT NULL DEFAULT 'HIGH',
    validation_method TEXT,
    decision_change_potential TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Competitor Profiles Table
CREATE TABLE IF NOT EXISTS public.competitors (
    id VARCHAR(64) PRIMARY KEY,
    venture_id VARCHAR(64) NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL, -- 'DIRECT' | 'INDIRECT' | 'INCUMBENT' | 'STATUS_QUO'
    market_position VARCHAR(64) NOT NULL,
    core_advantage TEXT NOT NULL,
    core_vulnerability TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assumptions_venture ON public.assumptions(venture_id);
CREATE INDEX IF NOT EXISTS idx_risks_venture_severity ON public.risks(venture_id, severity);
CREATE INDEX IF NOT EXISTS idx_critical_unknowns_venture ON public.critical_unknowns(venture_id);
CREATE INDEX IF NOT EXISTS idx_competitors_venture ON public.competitors(venture_id);
