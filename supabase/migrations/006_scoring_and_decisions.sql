-- Migration 006: Deterministic Scoring Engine, Decisions, and Empirical Next Actions
-- Preserves immutable scoring runs, dimension breakdowns, founder decisions, and empirical milestones

-- Scoring Configurations (Versioned rules and weight matrices)
CREATE TABLE IF NOT EXISTS public.scoring_configurations (
    id VARCHAR(64) PRIMARY KEY,
    version VARCHAR(32) NOT NULL UNIQUE, -- e.g. 'v1'
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    weights JSONB NOT NULL,
    thresholds JSONB NOT NULL,
    scoring_rules JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scoring Runs (Immutable evaluation snapshots)
CREATE TABLE IF NOT EXISTS public.scoring_runs (
    id VARCHAR(64) PRIMARY KEY,
    venture_id VARCHAR(64) NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
    scoring_configuration_id VARCHAR(64) REFERENCES public.scoring_configurations(id) ON DELETE SET NULL,
    configuration_version VARCHAR(32) NOT NULL DEFAULT 'v1',
    final_score NUMERIC(5,2) NOT NULL CHECK (final_score >= 0 AND final_score <= 100),
    score_band VARCHAR(64) NOT NULL, -- 'STRONG EVIDENCE' | 'PROMISING BUT VALIDATE' | 'SIGNIFICANT UNCERTAINTY' | 'HIGH RISK' | 'WEAK EVIDENCE'
    ai_recommendation VARCHAR(64) NOT NULL, -- 'BUILD' | 'VALIDATE FIRST' | 'REDESIGN' | 'DO NOT PURSUE'
    recommendation_confidence VARCHAR(32) NOT NULL, -- 'HIGH' | 'MEDIUM' | 'LOW'
    score_breakdown JSONB NOT NULL,
    score_interpretation TEXT,
    weights_snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dimension Scores (Explainable itemized dimensional evaluations)
CREATE TABLE IF NOT EXISTS public.dimension_scores (
    id VARCHAR(64) PRIMARY KEY,
    scoring_run_id VARCHAR(64) NOT NULL REFERENCES public.scoring_runs(id) ON DELETE CASCADE,
    dimension VARCHAR(64) NOT NULL, -- 'problemValidation' | 'customerDemand' | 'marketOpportunity' | etc.
    raw_score NUMERIC(5,2) NOT NULL CHECK (raw_score >= 0 AND raw_score <= 100),
    weight NUMERIC(4,3) NOT NULL CHECK (weight >= 0 AND weight <= 1),
    weighted_score NUMERIC(5,2) NOT NULL CHECK (weighted_score >= 0 AND weighted_score <= 100),
    evidence_strength VARCHAR(32) NOT NULL, -- 'strong' | 'moderate' | 'weak'
    confidence VARCHAR(32) NOT NULL, -- 'HIGH' | 'MEDIUM' | 'LOW'
    explanation TEXT NOT NULL,
    supporting_finding_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    contradictory_finding_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    critical_unknown_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Decisions Table (Founder Decision explicitly separated from AI Recommendation)
CREATE TABLE IF NOT EXISTS public.decisions (
    id VARCHAR(64) PRIMARY KEY,
    venture_id VARCHAR(64) NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
    scoring_run_id VARCHAR(64) REFERENCES public.scoring_runs(id) ON DELETE SET NULL,
    ai_recommendation VARCHAR(64) NOT NULL,
    recommendation_confidence VARCHAR(32) NOT NULL,
    founder_decision VARCHAR(64), -- NULL initially! ('BUILD' | 'VALIDATE_FIRST' | 'REDESIGN' | 'DO_NOT_PURSUE')
    founder_decision_at TIMESTAMPTZ, -- NULL initially until founder takes action
    rationale TEXT,
    alignment_with_ai VARCHAR(64) DEFAULT 'ALIGNED', -- 'ALIGNED' | 'PARTIALLY_ALIGNED' | 'DIVERGENT'
    override_reason TEXT,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Next Actions Table (Exactly 3 empirical validation milestones)
CREATE TABLE IF NOT EXISTS public.next_actions (
    id VARCHAR(64) PRIMARY KEY,
    venture_id VARCHAR(64) NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
    scoring_run_id VARCHAR(64) REFERENCES public.scoring_runs(id) ON DELETE SET NULL,
    report_id VARCHAR(64) REFERENCES public.reports(id) ON DELETE SET NULL,
    step_number INTEGER NOT NULL CHECK (step_number IN (1, 2, 3)),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    purpose TEXT,
    validation_target TEXT,
    priority VARCHAR(32) NOT NULL DEFAULT 'HIGH', -- 'IMMEDIATE' | 'HIGH' | 'MEDIUM'
    expected_decision_impact TEXT,
    action_type VARCHAR(64) NOT NULL, -- 'CUSTOMER_DISCOVERY' | 'SMOKE_TEST' | 'UNIT_ECONOMICS_AUDIT' | 'TECH_SPIKE'
    hypothesis_to_test TEXT NOT NULL,
    pass_fail_metric TEXT NOT NULL,
    estimated_days INTEGER NOT NULL DEFAULT 7,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scoring_runs_venture ON public.scoring_runs(venture_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dimension_scores_run ON public.dimension_scores(scoring_run_id);
CREATE INDEX IF NOT EXISTS idx_decisions_venture ON public.decisions(venture_id);
CREATE INDEX IF NOT EXISTS idx_next_actions_venture ON public.next_actions(venture_id);
