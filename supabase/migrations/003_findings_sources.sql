-- Migration 003: Sources, Findings, and Many-to-Many Finding-Source Relationships
-- Provides normalized, empirical citations supporting individual findings across all agents

-- Normalized Sources Table
CREATE TABLE IF NOT EXISTS public.sources (
    id VARCHAR(64) PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT,
    publisher VARCHAR(255),
    source_type VARCHAR(64) NOT NULL DEFAULT 'OTHER', -- 'PRIMARY' | 'GOVERNMENT_DATA' | 'ACADEMIC' | 'INDUSTRY_REPORT' | 'NEWS_ANALYSIS'
    publication_date TIMESTAMPTZ,
    publish_year INTEGER,
    accessed_at TIMESTAMPTZ,
    relevance TEXT,
    relevance_score NUMERIC(4,3) CHECK (relevance_score >= 0 AND relevance_score <= 1),
    credibility VARCHAR(32) NOT NULL DEFAULT 'MEDIUM', -- 'HIGH' | 'MEDIUM' | 'LOW'
    reliability_tier VARCHAR(64) NOT NULL DEFAULT 'INDUSTRY_REPORT',
    extracted_fact TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Normalized Findings Table
CREATE TABLE IF NOT EXISTS public.findings (
    id VARCHAR(64) PRIMARY KEY,
    venture_id VARCHAR(64) NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
    agent_run_id VARCHAR(64) REFERENCES public.agent_runs(id) ON DELETE SET NULL,
    title VARCHAR(255),
    statement TEXT NOT NULL,
    category VARCHAR(64) NOT NULL, -- 'MARKET_SIZE' | 'CUSTOMER_NEED' | 'COMPETITIVE_LANDSCAPE' | 'TECH_FEASIBILITY' | 'REGULATORY' | 'UNIT_ECONOMICS'
    evidence_type VARCHAR(32) NOT NULL DEFAULT 'supporting', -- 'supporting' | 'contradictory' | 'neutral' | 'unknown'
    evidence_strength VARCHAR(32) NOT NULL DEFAULT 'moderate', -- 'strong' | 'moderate' | 'weak'
    confidence VARCHAR(32) NOT NULL DEFAULT 'MEDIUM', -- 'HIGH' | 'MEDIUM' | 'LOW'
    implication TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Many-to-Many Finding Sources Join Table
CREATE TABLE IF NOT EXISTS public.finding_sources (
    finding_id VARCHAR(64) NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
    source_id VARCHAR(64) NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
    relation_type VARCHAR(64) NOT NULL DEFAULT 'primary_citation', -- 'primary_citation' | 'contradictory_evidence' | 'supporting_benchmark'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (finding_id, source_id)
);

CREATE INDEX IF NOT EXISTS idx_sources_reliability ON public.sources(reliability_tier);
CREATE INDEX IF NOT EXISTS idx_findings_venture ON public.findings(venture_id);
CREATE INDEX IF NOT EXISTS idx_findings_category ON public.findings(category);
CREATE INDEX IF NOT EXISTS idx_finding_sources_source ON public.finding_sources(source_id);
