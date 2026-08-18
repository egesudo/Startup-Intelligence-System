# Supabase Database & Storage Architecture (Phase 8)

This directory contains the database migration scripts, seed data, and schema definitions for the **Startup Intelligence** platform on **Supabase PostgreSQL** and **Supabase Storage**.

---

## 1. Database Architecture & Principles

1. **Supabase PostgreSQL as Source of Truth**: All structured venture data, multi-agent artifacts, normalized findings, sources, scoring runs, and decisions reside in PostgreSQL tables.
2. **Supabase Storage for Document Artifacts**: Generated PDF reports (Research, Business, Red Team, Judge, Decision) are stored in the private `reports` bucket and referenced via `report_files` metadata.
3. **Normalized, Queryable Relational Schema**: AI analyses are never stored as single opaque text blobs. Each finding, source, assumption, risk, score dimension, and next action is individually indexed, queryable, and traceable.
4. **Referential Integrity**: PostgreSQL foreign keys with `ON DELETE CASCADE` or `ON DELETE SET NULL` enforce data consistency.
5. **Separation of Founder Decision from AI Recommendation**: The `decisions` table tracks AI recommendations alongside founder decisions, ensuring `founder_decision` remains `NULL` until explicitly chosen.
6. **Immutable Scoring Runs & Versioned Configurations**: Historical scoring runs are preserved for longitudinal comparison across analysis cycles.

---

## 2. Relational Entity Overview

| Table Name | Description | Key Foreign Keys |
| :--- | :--- | :--- |
| `ventures` | Core venture entity & original founder intake. | `user_id` -> auth.users |
| `critical_questions` | Dynamic clarification questions for intake refinement. | `venture_id` -> `ventures.id` |
| `agent_runs` | Individual execution runs per agent type. | `venture_id` -> `ventures.id` |
| `agent_outputs` | Structured payloads and debug logs per agent run. | `agent_run_id` -> `agent_runs.id` |
| `sources` | Normalized citations, publications, and reliability tiers. | - |
| `findings` | Atomic factual findings with confidence and implication. | `venture_id`, `agent_run_id` |
| `finding_sources` | Many-to-Many join table linking findings and sources. | `finding_id`, `source_id` |
| `assumptions` | Hypotheses and importance/evidence status. | `venture_id`, `agent_run_id` |
| `risks` | Business risks, red team failure modes, and severity. | `venture_id`, `agent_run_id` |
| `critical_unknowns` | High-impact unvalidated factual gaps. | `venture_id`, `agent_run_id` |
| `competitors` | Competitor profiles, advantages, and vulnerabilities. | `venture_id` -> `ventures.id` |
| `reports` | Versioned analytical reports (Research, Business, etc.). | `venture_id`, `agent_run_id` |
| `report_files` | Metadata pointing to Supabase Storage PDF artifacts. | `report_id`, `venture_id` |
| `scoring_configurations` | Versioned scoring weights and threshold matrices. | - |
| `scoring_runs` | Immutable venture evaluation scores and bands. | `venture_id`, `scoring_configuration_id` |
| `dimension_scores` | Itemized 8-dimension score calculations with explanations. | `scoring_run_id` -> `scoring_runs.id` |
| `decisions` | AI recommendations vs. founder decisions. | `venture_id`, `scoring_run_id` |
| `next_actions` | Exactly 3 empirical validation milestones with pass/fail metrics. | `venture_id`, `scoring_run_id` |

---

## 3. Entity-Relationship Diagram

```
ventures (1)
  ├── critical_questions (0..N)
  ├── agent_runs (0..N)
  │     └── agent_outputs (1..1)
  ├── findings (0..N)
  │     └── finding_sources (M..N) ─── sources (1..N)
  ├── assumptions (0..N)
  ├── risks (0..N)
  ├── critical_unknowns (0..N)
  ├── competitors (0..N)
  ├── reports (0..N)
  │     └── report_files (0..N) [Storage: reports/{ventureId}/{type}/{file}.pdf]
  ├── scoring_runs (0..N) ─── scoring_configurations (N..1)
  │     ├── dimension_scores (8..8)
  │     ├── decisions (1..1)
  │     └── next_actions (3..3)
```

---

## 4. Migration Execution Order

Migrations are located in `supabase/migrations/` and must be applied sequentially:

1. `001_initial_schema.sql` — Core extensions (`uuid-ossp`, `pgcrypto`), `ventures`, and `critical_questions`.
2. `002_agent_runs.sql` — `agent_runs` and `agent_outputs`.
3. `003_findings_sources.sql` — `sources`, `findings`, and `finding_sources` (M:N).
4. `004_assumptions_risks_unknowns.sql` — `assumptions`, `risks`, `critical_unknowns`, `competitors`.
5. `005_reports_and_files.sql` — `reports` and `report_files` metadata.
6. `006_scoring_and_decisions.sql` — `scoring_configurations`, `scoring_runs`, `dimension_scores`, `decisions`, `next_actions`.
7. `007_storage_and_rls.sql` — Storage bucket `reports`, RLS policies, and index optimizations.

---

## 5. Supabase Storage Architecture

Generated PDF and JSON reports are stored in the private `reports` bucket:

```text
reports/
  {ventureId}/
    research/
      Research_Report_v1.pdf
    business/
      Business_Report_v1.pdf
    red-team/
      Red_Team_Report_v1.pdf
    judge/
      Judge_Report_v1.pdf
    decision/
      Decision_Report_v1.pdf
```

Access to file binaries is mediated through signed download URLs or server-side service-role streams.

---

## 6. Example SQL Queries for Inspection & Verification

### Query 1: Retrieve Venture Profile with Founder Input
```sql
SELECT 
    id, name, description, status, problem, solution, 
    target_customer, business_model, created_at
FROM public.ventures
WHERE id = 'test_venture_medisync_01';
```

### Query 2: Retrieve All Agent Runs for a Venture
```sql
SELECT 
    id, agent_type, status, started_at, completed_at, 
    EXTRACT(EPOCH FROM (completed_at - started_at)) AS duration_seconds,
    error
FROM public.agent_runs
WHERE venture_id = 'test_venture_medisync_01'
ORDER BY created_at ASC;
```

### Query 3: Retrieve All Research Findings with Supporting Evidence
```sql
SELECT 
    id, title, category, evidence_type, evidence_strength, 
    confidence, statement, implication
FROM public.findings
WHERE venture_id = 'test_venture_medisync_01'
ORDER BY created_at ASC;
```

### Query 4: Retrieve Findings with Joined Normalized Citations (M:N)
```sql
SELECT 
    f.id AS finding_id,
    f.title AS finding_title,
    f.statement,
    s.id AS source_id,
    s.title AS source_title,
    s.publisher,
    s.reliability_tier,
    s.extracted_fact,
    fs.relation_type
FROM public.findings f
JOIN public.finding_sources fs ON f.id = fs.finding_id
JOIN public.sources s ON fs.source_id = s.id
WHERE f.venture_id = 'test_venture_medisync_01';
```

### Query 5: Retrieve All Versioned Reports for a Venture
```sql
SELECT 
    id, report_type, version, status, confidence_score, 
    executive_summary, generated_at
FROM public.reports
WHERE venture_id = 'test_venture_medisync_01'
ORDER BY generated_at DESC;
```

### Query 6: Retrieve Latest Scoring Run with Weights Snapshot
```sql
SELECT 
    sr.id,
    sr.venture_id,
    sr.final_score,
    sr.score_band,
    sr.ai_recommendation,
    sr.recommendation_confidence,
    sr.score_interpretation,
    sr.configuration_version,
    sr.created_at
FROM public.scoring_runs sr
WHERE sr.venture_id = 'test_venture_medisync_01'
ORDER BY sr.created_at DESC
LIMIT 1;
```

### Query 7: Retrieve Itemized Dimension Scores & Explanations
```sql
SELECT 
    ds.dimension,
    ds.raw_score,
    ds.weight,
    ds.weighted_score,
    ds.evidence_strength,
    ds.confidence,
    ds.explanation
FROM public.dimension_scores ds
JOIN public.scoring_runs sr ON ds.scoring_run_id = sr.id
WHERE sr.venture_id = 'test_venture_medisync_01'
ORDER BY ds.weight DESC;
```

### Query 8: Retrieve Decision Record (AI Recommendation vs Founder Decision)
```sql
SELECT 
    d.id,
    d.venture_id,
    d.ai_recommendation,
    d.recommendation_confidence,
    d.founder_decision,
    d.founder_decision_at,
    d.alignment_with_ai,
    d.rationale
FROM public.decisions d
WHERE d.venture_id = 'test_venture_medisync_01';
```

### Query 9: Retrieve Report Files & Supabase Storage Paths
```sql
SELECT 
    rf.id,
    rf.report_id,
    r.report_type,
    rf.storage_bucket,
    rf.storage_path,
    rf.file_name,
    rf.mime_type,
    rf.file_size,
    rf.created_at
FROM public.report_files rf
JOIN public.reports r ON rf.report_id = r.id
WHERE rf.venture_id = 'test_venture_medisync_01';
```

### Query 10: Retrieve Critical Unknowns and High-Severity Risks
```sql
SELECT 
    'UNKNOWN' AS item_type,
    statement AS title_or_statement,
    why_it_matters AS detail,
    confidence,
    impact
FROM public.critical_unknowns
WHERE venture_id = 'test_venture_medisync_01'

UNION ALL

SELECT 
    'RISK' AS item_type,
    title AS title_or_statement,
    description AS detail,
    confidence,
    severity AS impact
FROM public.risks
WHERE venture_id = 'test_venture_medisync_01' AND severity = 'HIGH';
```

---

## 7. Supabase Dashboard Inspection Guide

1. **Table Editor**:
   - Open your Supabase Project Dashboard -> **Table Editor**.
   - Navigate to `public.ventures` to view venture submissions.
   - Inspect `public.findings`, `public.sources`, and `public.finding_sources` to trace empirical citations.
   - Navigate to `public.scoring_runs` and `public.dimension_scores` to verify deterministic 8-dimension calculations.
   - Check `public.decisions` to observe `founder_decision` remaining `NULL` until founder interaction.

2. **Storage**:
   - Navigate to **Storage** -> **Buckets**.
   - Open the `reports` bucket to inspect `{ventureId}/{reportType}/*.pdf` files.

3. **SQL Editor**:
   - Paste any of the 10 queries above into the Supabase **SQL Editor** to run live relational checks.
