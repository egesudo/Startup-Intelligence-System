/**
 * Database Schema Definitions for Startup Intelligence
 * 
 * Relational Mapping:
 * ventures (1)
 *  ├─ critical_questions (0..5)
 *  ├─ research_reports (0..1)
 *  │   ├─ research_findings (N)
 *  │   │   └─ sources (N)
 *  │   └─ competitor_profiles (N)
 *  ├─ business_reports (0..1)
 *  │   ├─ business_assumptions (N)
 *  │   └─ business_risks (N)
 *  ├─ red_team_reports (0..1)
 *  │   ├─ red_team_risks (N)
 *  │   └─ kill_scenarios (N)
 *  ├─ judge_reports (0..1)
 *  │   └─ tradeoff_dimensions (N)
 *  ├─ venture_scores (0..1)
 *  ├─ next_actions (3)
 *  └─ decisions (0..1)
 */

export interface DbVentureRecord {
  id: string;
  title: string;
  description: string;
  target_audience: string | null;
  value_proposition: string | null;
  monetization_idea: string | null;
  status: string; // 'draft' | 'clarifying' | 'analyzing' | 'evaluated' | 'decided'
  created_at: string;
  updated_at: string;
}

export interface DbCriticalQuestionRecord {
  id: string;
  venture_id: string;
  question_number: number;
  question: string;
  rationale: string;
  suggested_options_json: string | null; // serialized string[]
  answer: string | null;
  status: string; // 'PENDING' | 'ANSWERED' | 'SKIPPED'
}

export interface DbResearchReportRecord {
  id: string;
  venture_id: string;
  executive_summary: string;
  confidence_score: string;
  tailwinds_json: string;
  headwinds_json: string;
  unvalidated_assumptions_json: string;
  created_at: string;
}

export interface DbResearchFindingRecord {
  id: string;
  report_id: string;
  category: string;
  statement: string;
  confidence: string;
  implication: string;
}

export interface DbSourceRecord {
  id: string;
  finding_id: string;
  title: string;
  url: string | null;
  publisher: string | null;
  publish_year: number | null;
  relevance_score: number;
  reliability_tier: string;
  extracted_fact: string;
}

export interface DbCompetitorProfileRecord {
  id: string;
  report_id: string;
  name: string;
  category: string;
  market_position: string;
  core_advantage: string;
  core_vulnerability: string;
}

export interface DbBusinessReportRecord {
  id: string;
  venture_id: string;
  archetype: string;
  estimated_margin_profile: string;
  pricing_power: string;
  capital_requirement: string;
  primary_distribution_channel: string;
  moat_type: string;
  moat_strength: string;
  moat_rationale: string;
  created_at: string;
}

export interface DbBusinessAssumptionRecord {
  id: string;
  report_id: string;
  category: string;
  hypothesis: string;
  validation_method: string;
  is_high_risk: boolean;
}

export interface DbBusinessRiskRecord {
  id: string;
  report_id: string;
  title: string;
  category: string;
  severity: string;
  mitigation_strategy: string;
}

export interface DbRedTeamReportRecord {
  id: string;
  venture_id: string;
  untested_dogmas_json: string;
  counter_factual_analysis: string;
  created_at: string;
}

export interface DbRedTeamRiskRecord {
  id: string;
  report_id: string;
  vulnerability: string;
  severity: string;
  failure_mechanism: string;
  why_competitors_will_win: string;
  pre_mortem_trigger: string;
}

export interface DbKillScenarioRecord {
  id: string;
  report_id: string;
  title: string;
  scenario: string;
  probability: string;
}

export interface DbJudgeReportRecord {
  id: string;
  venture_id: string;
  synthesis: string;
  tradeoff_matrix_json: string;
  ai_recommendation: string;
  uncertainty_notice: string;
  key_divergences_json: string;
  created_at: string;
}

export interface DbVentureScoreRecord {
  id: string;
  venture_id: string;
  total_score: number;
  market_score: number;
  market_reasoning: string;
  market_deductions_json: string;
  business_score: number;
  business_reasoning: string;
  business_deductions_json: string;
  moat_score: number;
  moat_reasoning: string;
  moat_deductions_json: string;
  execution_score: number;
  execution_reasoning: string;
  execution_deductions_json: string;
  recommendation_tier: string;
  calculated_at: string;
}

export interface DbNextActionRecord {
  id: string;
  venture_id: string;
  step_number: number;
  title: string;
  action_type: string;
  hypothesis_to_test: string;
  pass_fail_metric: string;
  estimated_days: number;
  completed: boolean;
}

export interface DbDecisionRecord {
  id: string;
  venture_id: string;
  choice: string;
  rationale: string;
  alignment_with_ai: string;
  override_reason: string | null;
  decided_at: string;
}

export interface DbAgentRunRecord {
  id: string;
  venture_id: string;
  agent_type: 'research' | 'business' | 'red_team' | 'judge';
  status: 'idle' | 'running' | 'completed' | 'failed';
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  analysis_run_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DbAgentOutputRecord {
  id: string;
  agent_run_id: string;
  venture_id: string;
  agent_type: string;
  output_summary: string | null;
  confidence_level: string;
  structured_payload: Record<string, unknown>;
  raw_model_response: string | null;
  execution_time_ms: number | null;
  created_at: string;
}

export interface DbFindingSourceRecord {
  finding_id: string;
  source_id: string;
  relation_type: string;
  notes: string | null;
  created_at: string;
}

export interface DbReportRecord {
  id: string;
  venture_id: string;
  report_type: 'research' | 'business' | 'red_team' | 'judge' | 'decision';
  version: number;
  agent_run_id: string | null;
  status: string;
  executive_summary: string | null;
  confidence_score: string | null;
  structured_payload: Record<string, unknown>;
  generated_at: string;
  created_at: string;
}

export interface DbReportFileRecord {
  id: string;
  report_id: string;
  venture_id: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number | null;
  checksum: string | null;
  created_at: string;
}

export interface DbScoringConfigurationRecord {
  id: string;
  version: string;
  name: string;
  is_active: boolean;
  weights: Record<string, number>;
  thresholds: Record<string, number>;
  scoring_rules: Record<string, unknown>;
  created_at: string;
}

export interface DbScoringRunRecord {
  id: string;
  venture_id: string;
  scoring_configuration_id: string | null;
  configuration_version: string;
  final_score: number;
  score_band: string;
  ai_recommendation: string;
  recommendation_confidence: string;
  score_breakdown: Record<string, number>;
  score_interpretation: string | null;
  weights_snapshot: Record<string, number>;
  created_at: string;
}

export interface DbDimensionScoreRecord {
  id: string;
  scoring_run_id: string;
  dimension: string;
  raw_score: number;
  weight: number;
  weighted_score: number;
  evidence_strength: string;
  confidence: string;
  explanation: string;
  supporting_finding_ids: string[];
  contradictory_finding_ids: string[];
  critical_unknown_ids: string[];
  created_at: string;
}
