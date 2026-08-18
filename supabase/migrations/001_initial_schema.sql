-- Migration 001: Initial Schema, Core Extensions, and Ventures Table
-- Startup Intelligence Platform on Supabase PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core Ventures Table
CREATE TABLE IF NOT EXISTS public.ventures (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'draft',
    raw_idea TEXT,
    problem TEXT,
    solution TEXT,
    target_customer TEXT,
    market_geography VARCHAR(128) DEFAULT 'Global',
    business_model TEXT,
    technology TEXT,
    founder_context TEXT,
    founder_assumptions JSONB NOT NULL DEFAULT '[]'::jsonb,
    important_unknowns JSONB NOT NULL DEFAULT '[]'::jsonb,
    user_id UUID, -- For future Supabase Auth user isolation
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Critical Questions Table
CREATE TABLE IF NOT EXISTS public.critical_questions (
    id VARCHAR(64) PRIMARY KEY,
    venture_id VARCHAR(64) NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question TEXT NOT NULL,
    rationale TEXT NOT NULL,
    why_it_matters TEXT,
    category VARCHAR(64) NOT NULL DEFAULT 'PROBLEM_VALIDATION',
    suggested_options JSONB NOT NULL DEFAULT '[]'::jsonb,
    required BOOLEAN NOT NULL DEFAULT TRUE,
    answer TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ventures_status ON public.ventures(status);
CREATE INDEX IF NOT EXISTS idx_ventures_created_at ON public.ventures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_critical_questions_venture ON public.critical_questions(venture_id);
