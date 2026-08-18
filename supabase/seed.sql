-- ============================================================================
-- DEVELOPMENT / TEST SEED DATA
-- WARNING: THIS FILE CONTAINS SYNTHETIC TEST FIXTURES FOR LOCAL/DEV ENVIRONMENT TESTING.
-- THIS DATA IS CLEARLY MARKED AS DEVELOPMENT / TEST DATA.
-- DO NOT TREAT THESE RECORDS AS REAL-WORLD RESEARCH EVIDENCE OR LIVE VENTURE DATA.
-- ============================================================================

-- 1. Default Scoring Configuration v1
INSERT INTO public.scoring_configurations (
    id, version, name, is_active, weights, thresholds, scoring_rules, created_at
) VALUES (
    'sc_v1',
    'v1',
    'Standard Evidence-Based Venture Readiness Matrix v1',
    true,
    '{
        "problemValidation": 0.15,
        "customerDemand": 0.15,
        "marketOpportunity": 0.10,
        "competitivePosition": 0.10,
        "businessModel": 0.15,
        "feasibility": 0.10,
        "riskProfile": 0.15,
        "evidenceQuality": 0.10
    }'::jsonb,
    '{
        "strongEvidenceMin": 80,
        "promisingMin": 65,
        "significantUncertaintyMin": 45,
        "highRiskMin": 25,
        "weakEvidenceMin": 0
    }'::jsonb,
    '{
        "unknownPenaltyFactor": 0.5,
        "contradictoryEvidenceDeductionMax": 20,
        "redTeamFatalRiskMultiplier": 0.7
    }'::jsonb,
    NOW()
) ON CONFLICT (version) DO NOTHING;

-- 2. Test Venture: MediSync AI
INSERT INTO public.ventures (
    id, name, description, status, raw_idea, problem, solution, target_customer, market_geography, business_model, technology, founder_context, founder_assumptions, important_unknowns, created_at, updated_at
) VALUES (
    'test_venture_medisync_01',
    'MediSync AI (TEST FIXTURE)',
    'AI-powered clinical trial recruitment and patient matching middleware for oncology trials.',
    'evaluated',
    'MediSync AI connects oncology clinical trial criteria with electronic health records (EHR) using LLM-powered phenotyping to match eligible cancer patients in hours instead of months.',
    '86% of oncology clinical trials face costly multi-month delays due to inefficient manual patient screening from unstructured health records.',
    'Automated EHR ingestion and structured biomarker phenotyping engine with nurse-in-the-loop verification.',
    'Mid-sized Contract Research Organizations (CROs) and pharmaceutical clinical trial sponsors.',
    'United States',
    'Tiered annual enterprise SaaS license ($45k–$180k/yr) + $750 success fee per enrolled trial participant.',
    'FastAPI, PyTorch EHR ClinicalBERT, FHIR HL7 Integration Middleware, Next.js dashboard.',
    'Founded by former oncology research coordinator and ML engineer.',
    '[
        {"id": "fa_01", "statement": "Hospital compliance boards will grant de-identified EHR access within 6 weeks.", "category": "REGULATORY", "risk": "HIGH"},
        {"id": "fa_02", "statement": "CROs will pay per-patient enrollment success fees in addition to software platform fees.", "category": "MONETIZATION", "risk": "MEDIUM"}
    ]'::jsonb,
    '[
        {"id": "iu_01", "statement": "True precision of zero-shot oncology criteria extraction on scanned PDF pathology reports.", "impact": "FATAL"}
    ]'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Test Agent Runs
INSERT INTO public.agent_runs (
    id, venture_id, agent_type, status, started_at, completed_at, analysis_run_id, created_at
) VALUES
    ('ar_res_01', 'test_venture_medisync_01', 'research', 'completed', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '25 minutes', 'an_run_01', NOW()),
    ('ar_biz_01', 'test_venture_medisync_01', 'business', 'completed', NOW() - INTERVAL '24 minutes', NOW() - INTERVAL '20 minutes', 'an_run_01', NOW()),
    ('ar_red_01', 'test_venture_medisync_01', 'red_team', 'completed', NOW() - INTERVAL '19 minutes', NOW() - INTERVAL '15 minutes', 'an_run_01', NOW()),
    ('ar_jdg_01', 'test_venture_medisync_01', 'judge', 'completed', NOW() - INTERVAL '14 minutes', NOW() - INTERVAL '10 minutes', 'an_run_01', NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Test Sources (Clearly synthetic academic/industry test fixtures)
INSERT INTO public.sources (
    id, title, url, publisher, source_type, publish_year, relevance_score, credibility, reliability_tier, extracted_fact, created_at
) VALUES
    ('src_test_01', '[TEST BENCHMARK] Tufts CSDD Clinical Trial Recruitment Cost Study', 'https://example.com/test-tufts-report', 'Tufts CSDD (Synthetic Reference)', 'INDUSTRY_REPORT', 2024, 0.95, 'HIGH', 'INDUSTRY_REPORT', 'Phase III clinical trial delays cost sponsors between $600k and $8M daily in lost patent exclusivity.', NOW()),
    ('src_test_02', '[TEST BENCHMARK] NIH Clinical Center Enrollment Metrics Review', 'https://example.com/test-nih-benchmarks', 'NIH Clinical Center (Synthetic Reference)', 'PRIMARY', 2023, 0.92, 'HIGH', 'PRIMARY', 'Over 80% of clinical research sites fail to meet target enrollment timelines without digital screening assistance.', NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. Test Findings
INSERT INTO public.findings (
    id, venture_id, agent_run_id, title, statement, category, evidence_type, evidence_strength, confidence, implication, created_at
) VALUES
    ('fnd_test_01', 'test_venture_medisync_01', 'ar_res_01', 'Clinical Trial Recruitment Economic Drain', 'Clinical trial recruitment accounts for ~32% of total Phase II/III clinical budgets.', 'MARKET_SIZE', 'supporting', 'strong', 'HIGH', 'Pharma sponsors possess proven willingness to pay premium rates if delay risk is mitigated.', NOW()),
    ('fnd_test_02', 'test_venture_medisync_01', 'ar_red_01', 'Unstructured Pathology PDF Parsing Error Rate', 'Zero-shot NLP extraction on scanned pathology notes has an unverified false-positive rate of 28% without human nurse review.', 'TECH_FEASIBILITY', 'contradictory', 'moderate', 'MEDIUM', 'Human-in-the-loop review is mandatory to prevent sponsor churn.', NOW())
ON CONFLICT (id) DO NOTHING;

-- 6. Test Finding Sources Many-to-Many
INSERT INTO public.finding_sources (
    finding_id, source_id, relation_type, notes
) VALUES
    ('fnd_test_01', 'src_test_01', 'primary_citation', 'Validated through Tufts CSDD benchmark metrics.'),
    ('fnd_test_01', 'src_test_02', 'supporting_benchmark', 'Cross-referenced against NIH recruitment failure rates.')
ON CONFLICT (finding_id, source_id) DO NOTHING;

-- 7. Test Scoring Run (Deterministic Score: 78.0 / 100)
INSERT INTO public.scoring_runs (
    id, venture_id, scoring_configuration_id, configuration_version, final_score, score_band, ai_recommendation, recommendation_confidence, score_breakdown, score_interpretation, weights_snapshot, created_at
) VALUES (
    'scr_test_01',
    'test_venture_medisync_01',
    'sc_v1',
    'v1',
    78.00,
    'PROMISING BUT VALIDATE',
    'VALIDATE FIRST',
    'HIGH',
    '{
        "problemValidation": 85,
        "customerDemand": 80,
        "marketOpportunity": 82,
        "competitivePosition": 74,
        "businessModel": 76,
        "feasibility": 70,
        "riskProfile": 65,
        "evidenceQuality": 88
    }'::jsonb,
    'MediSync AI addresses an empirically verified high-dollar problem with strong market tailwinds. However, EHR data extraction reliability and clinical site compliance barriers require structured pre-pilot de-risking.',
    '{
        "problemValidation": 0.15,
        "customerDemand": 0.15,
        "marketOpportunity": 0.10,
        "competitivePosition": 0.10,
        "businessModel": 0.15,
        "feasibility": 0.10,
        "riskProfile": 0.15,
        "evidenceQuality": 0.10
    }'::jsonb,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 8. Test Dimension Scores
INSERT INTO public.dimension_scores (
    id, scoring_run_id, dimension, raw_score, weight, weighted_score, evidence_strength, confidence, explanation
) VALUES
    ('ds_test_01', 'scr_test_01', 'problemValidation', 85.00, 0.15, 12.75, 'strong', 'HIGH', 'Empirical data confirms 86% of oncology trials experience recruitment delays.'),
    ('ds_test_02', 'scr_test_01', 'customerDemand', 80.00, 0.15, 12.00, 'strong', 'HIGH', 'CROs face heavy financial penalty clauses for trial timeline overruns.'),
    ('ds_test_03', 'scr_test_01', 'marketOpportunity', 82.00, 0.10, 8.20, 'moderate', 'HIGH', 'Oncology trial matching TAM exceeds $4.2B across North America and Western Europe.'),
    ('ds_test_04', 'scr_test_01', 'competitivePosition', 74.00, 0.10, 7.40, 'moderate', 'MEDIUM', 'Competitive density is moderate, dominated by legacy manual recruitment agencies.'),
    ('ds_test_05', 'scr_test_01', 'businessModel', 76.00, 0.15, 11.40, 'moderate', 'HIGH', 'Dual SaaS + success fee model generates high gross margins if verification cost is controlled.'),
    ('ds_test_06', 'scr_test_01', 'feasibility', 70.00, 0.10, 7.00, 'moderate', 'MEDIUM', 'EHR HL7/FHIR integration standard is established but hospital security reviews remain slow.'),
    ('ds_test_07', 'scr_test_01', 'riskProfile', 65.00, 0.15, 9.75, 'moderate', 'HIGH', 'Red Team flags unstructured PDF error rates and hospital compliance inertia.'),
    ('ds_test_08', 'scr_test_01', 'evidenceQuality', 88.00, 0.10, 8.80, 'strong', 'HIGH', 'High source credibility with independent peer-reviewed and industry citations.')
ON CONFLICT (id) DO NOTHING;

-- 9. Test Next Actions (Exactly 3 empirical milestones)
INSERT INTO public.next_actions (
    id, venture_id, scoring_run_id, step_number, title, description, purpose, validation_target, priority, expected_decision_impact, action_type, hypothesis_to_test, pass_fail_metric, estimated_days, completed
) VALUES
    ('na_test_01', 'test_venture_medisync_01', 'scr_test_01', 1, 'Manual Pathology Record Extraction Spike', 'Run automated parser on 50 de-identified oncology PDF notes and compare extracted biomarker criteria against oncologist annotations.', 'Determine true false-positive rate and tune algorithm for oncology inclusion criteria.', 'Precision >= 90% and Recall >= 85% across 50 benchmark cases.', 'IMMEDIATE', 'Confirms algorithm accuracy meets CRO safety baseline.', 'TECH_SPIKE', 'Our NLP parser can extract inclusion criteria from 50 de-identified oncology PDF notes with >90% precision compared to a certified clinical research coordinator.', 'Precision >= 90% and Recall >= 85% across 50 benchmark cases.', 7, false),
    ('na_test_02', 'test_venture_medisync_01', 'scr_test_01', 2, 'CRO Pilot Letter of Intent (LOI) Campaign', 'Engage 15 mid-sized CRO clinical operations directors with retrospective accuracy data to secure pilot test commitments.', 'Validate commercial willingness to pay prior to completing production integrations.', '2 signed LOIs secured from 15 target outreach conversations.', 'HIGH', 'Establishes commercial demand and pilot revenue commitment.', 'CUSTOMER_DISCOVERY', 'At least 2 mid-sized CRO clinical operations directors will sign an unpriced LOI to test patient matching on an upcoming Phase II study.', '2 signed LOIs secured from 15 target outreach conversations.', 14, false),
    ('na_test_03', 'test_venture_medisync_01', 'scr_test_01', 3, 'Nurse-in-the-Loop Workflow Simulation', 'Measure time and cost for a licensed triage nurse to verify 50 AI-generated candidate match cards.', 'Validate unit economics and human curation feasibility.', 'Verification time <= 6 min/patient ($5 unit cost) with 100% adherence to trial exclusion criteria.', 'HIGH', 'Verifies 78% gross margin viability.', 'UNIT_ECONOMICS_AUDIT', 'A licensed triage nurse can verify AI-extracted patient eligibility cards in under 6 minutes per candidate ($5 unit cost).', 'Verification time <= 6 min/patient with 100% adherence to trial exclusion criteria.', 5, false)
ON CONFLICT (id) DO NOTHING;

-- 10. Test Decisions (Founder Decision initially NULL)
INSERT INTO public.decisions (
    id, venture_id, scoring_run_id, ai_recommendation, recommendation_confidence, founder_decision, founder_decision_at, rationale, alignment_with_ai, override_reason, decided_at
) VALUES (
    'dec_test_01',
    'test_venture_medisync_01',
    'scr_test_01',
    'VALIDATE FIRST',
    'HIGH',
    NULL, -- Founder decision deliberately left null
    NULL, -- Founder decision timestamp deliberately left null
    'AI recommendation indicates strong market tailwinds but requires accuracy validation spike before hospital pilot kickoff.',
    'ALIGNED',
    NULL,
    NULL
) ON CONFLICT (id) DO NOTHING;
