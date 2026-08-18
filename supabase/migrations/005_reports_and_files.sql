-- Migration 005: Reports and Report Files Metadata (Storage Architecture)
-- Tracks immutable versioned analytical reports and their generated PDF/artifact storage paths

CREATE TABLE IF NOT EXISTS public.reports (
    id VARCHAR(64) PRIMARY KEY,
    venture_id VARCHAR(64) NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
    report_type VARCHAR(32) NOT NULL, -- 'research' | 'business' | 'red_team' | 'judge' | 'decision'
    version INTEGER NOT NULL DEFAULT 1,
    agent_run_id VARCHAR(64) REFERENCES public.agent_runs(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'completed', -- 'generating' | 'completed' | 'failed'
    executive_summary TEXT,
    confidence_score VARCHAR(32) DEFAULT 'HIGH',
    structured_payload JSONB NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_venture_report_type_version UNIQUE (venture_id, report_type, version)
);

-- Report Files (Storage metadata referencing Supabase Storage assets)
CREATE TABLE IF NOT EXISTS public.report_files (
    id VARCHAR(64) PRIMARY KEY,
    report_id VARCHAR(64) NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    venture_id VARCHAR(64) NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
    storage_bucket VARCHAR(64) NOT NULL DEFAULT 'reports',
    storage_path TEXT NOT NULL, -- e.g. reports/{ventureId}/{reportType}/Research_Report_v1.pdf
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(128) NOT NULL DEFAULT 'application/pdf',
    file_size BIGINT,
    checksum VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_venture_type ON public.reports(venture_id, report_type);
CREATE INDEX IF NOT EXISTS idx_report_files_report ON public.report_files(report_id);
CREATE INDEX IF NOT EXISTS idx_report_files_venture ON public.report_files(venture_id);
