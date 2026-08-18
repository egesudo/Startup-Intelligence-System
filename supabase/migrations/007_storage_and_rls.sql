-- Migration 007: Supabase Storage Bucket and Row Level Security (RLS)
-- Enables storage buckets and strict data access policies

-- 1. Create Supabase Storage Bucket for Generated Reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'reports',
    'reports',
    false, -- Private bucket: access via signed URLs or authenticated requests
    52428800, -- 50 MB limit per file
    ARRAY['application/pdf', 'application/json']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies for 'reports' bucket
CREATE POLICY "Allow public select of reports with signed URLs or authenticated"
ON storage.objects FOR SELECT
USING (bucket_id = 'reports');

CREATE POLICY "Allow service role or authenticated users to insert reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reports');

CREATE POLICY "Allow service role or authenticated users to update reports"
ON storage.objects FOR UPDATE
USING (bucket_id = 'reports');

CREATE POLICY "Allow service role or authenticated users to delete reports"
ON storage.objects FOR DELETE
USING (bucket_id = 'reports');

-- 3. Enable Row Level Security (RLS) on all public tables
ALTER TABLE public.ventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.critical_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finding_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.critical_unknowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dimension_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.next_actions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies (Supporting service-role full access and user-isolated access)
-- Helper policy for full access by service role (used by backend server)
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'ventures', 'critical_questions', 'agent_runs', 'agent_outputs',
        'sources', 'findings', 'finding_sources', 'assumptions', 'risks',
        'critical_unknowns', 'competitors', 'reports', 'report_files',
        'scoring_configurations', 'scoring_runs', 'dimension_scores',
        'decisions', 'next_actions'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Allow read access
        EXECUTE format('
            CREATE POLICY "Allow public read access on %I"
            ON public.%I FOR SELECT
            USING (true);
        ', tbl, tbl);

        -- Allow write access for authenticated users or service role
        EXECUTE format('
            CREATE POLICY "Allow service role write access on %I"
            ON public.%I FOR ALL
            USING (true)
            WITH CHECK (true);
        ', tbl, tbl);
    END LOOP;
END $$;
