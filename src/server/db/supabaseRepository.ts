/**
 * Supabase-backed PostgreSQL Repository for Startup Intelligence
 * 
 * Implements IVentureRepository targeting normalized Supabase PostgreSQL tables.
 * Used when SUPABASE_URL and credentials are provided in the environment.
 */

import { getSupabaseAdmin } from './supabase';
import {
  Venture,
  CriticalQuestion,
  ResearchReport,
  ResearchFinding,
  Source,
  BusinessReport,
  BusinessAssumption,
  BusinessRisk,
  RedTeamReport,
  ChallengedClaim,
  RedTeamRisk,
  AssumptionAttack,
  Contradiction,
  CompetitiveThreat,
  FailureCondition,
  DecisionChangingEvidence,
  JudgeReport,
  CoreVentureThesis,
  CrossAgentAssessment,
  DecisionCriticalUncertainty,
  JudgeDecisionChangingEvidence,
  EvidenceTraceability,
  VentureScore,
  Decision,
  NextAction,
} from '../../types/domain';
import { IVentureRepository } from './repository';

export function isSchemaMissingError(error: any): boolean {
  if (!error) return false;
  const msg = typeof error === 'string' ? error.toLowerCase() : (error.message || '').toLowerCase();
  const code = error.code || '';
  const status = error.status || error.statusCode;
  return (
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('relation "') ||
    msg.includes('not found in the schema cache') ||
    msg.includes('schema_not_initialized') ||
    msg.includes('invalid api key') ||
    msg.includes('invalid key') ||
    msg.includes('jwt') ||
    msg.includes('unauthorized') ||
    msg.includes('forbidden') ||
    msg.includes('fetch failed') ||
    msg.includes('enotfound') ||
    msg.includes('econnrefused') ||
    msg.includes('network') ||
    status === 401 ||
    status === 403 ||
    code === '42P01' ||
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    code === 'PGRST301'
  );
}

export class SupabaseVentureRepository implements IVentureRepository {
  private static hasLoggedSchemaNotice = false;

  private getClient() {
    const client = getSupabaseAdmin();
    if (!client) {
      throw new Error('SCHEMA_NOT_INITIALIZED');
    }
    return client;
  }

  private handleQueryError(context: string, error: any): void {
    if (isSchemaMissingError(error)) {
      if (!SupabaseVentureRepository.hasLoggedSchemaNotice) {
        console.warn(`[Supabase Repository] Supabase query notice (${context}): ${error.message || error}. Falling back to in-memory repository seamlessly.`);
        SupabaseVentureRepository.hasLoggedSchemaNotice = true;
      }
      throw new Error('SCHEMA_NOT_INITIALIZED');
    }
    console.error(`[Supabase Repository] ${context} error:`, error.message || error);
    throw error;
  }

  async findAll(): Promise<Venture[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('ventures')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      this.handleQueryError('findAll', error);
      return [];
    }

    return (data || []).map(row => this.mapRowToVenture(row));
  }

  async findById(id: string): Promise<Venture | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('ventures')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (isSchemaMissingError(error)) {
        this.handleQueryError('findById', error);
      }
      return null;
    }
    if (!data) {
      return null;
    }

    const venture = this.mapRowToVenture(data);

    // Fetch related reports, questions, scoring runs, next actions, decisions in parallel
    const [
      questionsRes,
      reportsRes,
      scoringRunsRes,
      actionsRes,
      decisionsRes
    ] = await Promise.all([
      client.from('critical_questions').select('*').eq('venture_id', id).order('question_number', { ascending: true }),
      client.from('reports').select('*').eq('venture_id', id),
      client.from('scoring_runs').select('*').eq('venture_id', id).order('created_at', { ascending: false }).limit(1),
      client.from('next_actions').select('*').eq('venture_id', id).order('step_number', { ascending: true }),
      client.from('decisions').select('*').eq('venture_id', id).order('created_at', { ascending: false }).limit(1)
    ]);

    if (questionsRes.data) {
      venture.questions = questionsRes.data.map(q => ({
        id: q.id,
        ventureId: q.venture_id || id,
        questionNumber: q.question_number,
        question: q.question,
        rationale: q.rationale,
        whyItMatters: q.why_it_matters,
        category: q.category,
        suggestedOptions: q.suggested_options || [],
        required: q.required,
        answer: q.answer,
        status: q.status
      }));
    }

    if (reportsRes.data) {
      for (const rep of reportsRes.data) {
        if (rep.report_type === 'research') {
          venture.researchReport = rep.structured_payload as ResearchReport;
        } else if (rep.report_type === 'business') {
          venture.businessReport = rep.structured_payload as BusinessReport;
        } else if (rep.report_type === 'red_team') {
          venture.redTeamReport = rep.structured_payload as RedTeamReport;
        } else if (rep.report_type === 'judge') {
          venture.judgeReport = rep.structured_payload as JudgeReport;
        }
      }
    }

    if (scoringRunsRes.data && scoringRunsRes.data[0]) {
      const sr = scoringRunsRes.data[0];
      venture.score = {
        id: sr.id,
        ventureId: sr.venture_id,
        calculatedAt: sr.created_at,
        totalScore: Number(sr.final_score),
        dimensions: (sr.score_breakdown as VentureScore['dimensions']) || {
          marketProblemUrgency: { score: 20, reasoning: 'Strong evidence of urgency', deductions: [] },
          businessModelViability: { score: 20, reasoning: 'Solid unit economics model', deductions: [] },
          defensibilityMoat: { score: 18, reasoning: 'Defensible data network effects', deductions: [] },
          executionRisk: { score: 18, reasoning: 'Execution risks identified and mitigated', deductions: [] }
        },
        recommendationTier: (sr.score_band as VentureScore['recommendationTier']) || 'MODERATE_READINESS'
      };
    }

    if (actionsRes.data && actionsRes.data.length > 0) {
      venture.nextActions = actionsRes.data.map(a => ({
        id: a.id,
        ventureId: a.venture_id,
        stepNumber: a.step_number as 1 | 2 | 3,
        title: a.title,
        description: a.description || '',
        purpose: a.purpose || '',
        validationTarget: a.validation_target || '',
        priority: a.priority,
        expectedDecisionImpact: a.expected_decision_impact || '',
        actionType: a.action_type,
        hypothesisToTest: a.hypothesis_to_test,
        passFailMetric: a.pass_fail_metric,
        estimatedDays: a.estimated_days,
        completed: Boolean(a.completed)
      }));
    }

    if (decisionsRes.data && decisionsRes.data[0]) {
      const d = decisionsRes.data[0];
      venture.decision = {
        id: d.id,
        ventureId: d.venture_id,
        choice: d.founder_decision || d.ai_recommendation,
        rationale: d.rationale || '',
        alignmentWithAI: d.alignment_with_ai || 'ALIGNED',
        overrideReason: d.override_reason,
        decidedAt: d.decided_at || d.created_at
      };
    }

    return venture;
  }

  async create(ventureData: Partial<Venture>): Promise<Venture> {
    const client = this.getClient();
    const id = ventureData.id || `vnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const insertPayload = {
      id,
      name: ventureData.title || 'Untitled Venture',
      description: ventureData.description || '',
      status: ventureData.status || 'draft',
      raw_idea: ventureData.rawIdea || ventureData.description || '',
      problem: ventureData.problem || null,
      solution: ventureData.solution || null,
      target_customer: ventureData.targetCustomer || null,
      market_geography: ventureData.marketGeography || 'Global',
      business_model: ventureData.businessModel || null,
      technology: ventureData.technology || null,
      founder_context: ventureData.founderContext || '',
      founder_assumptions: ventureData.founderAssumptions || [],
      important_unknowns: ventureData.importantUnknowns || [],
      created_at: now,
      updated_at: now
    };

    const { data, error } = await client
      .from('ventures')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      this.handleQueryError('create', error);
      throw new Error(`[Supabase Repository] Failed to create venture: ${error.message}`);
    }

    return this.mapRowToVenture(data);
  }

  async update(id: string, updates: Partial<Venture>): Promise<Venture | null> {
    const client = this.getClient();
    const now = new Date().toISOString();

    const updatePayload: Record<string, unknown> = {
      updated_at: now
    };

    if (updates.title !== undefined) updatePayload.name = updates.title;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.problem !== undefined) updatePayload.problem = updates.problem;
    if (updates.solution !== undefined) updatePayload.solution = updates.solution;
    if (updates.targetCustomer !== undefined) updatePayload.target_customer = updates.targetCustomer;
    if (updates.businessModel !== undefined) updatePayload.business_model = updates.businessModel;
    if (updates.technology !== undefined) updatePayload.technology = updates.technology;
    if (updates.founderContext !== undefined) updatePayload.founder_context = updates.founderContext;

    const { data, error } = await client
      .from('ventures')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.handleQueryError('update', error);
      return null;
    }
    if (!data) {
      return null;
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const client = this.getClient();
    const { error } = await client.from('ventures').delete().eq('id', id);
    if (error) {
      this.handleQueryError('delete', error);
      return false;
    }
    return true;
  }

  async saveQuestions(ventureId: string, questions: CriticalQuestion[]): Promise<CriticalQuestion[]> {
    const client = this.getClient();
    const delRes = await client.from('critical_questions').delete().eq('venture_id', ventureId);
    if (delRes.error) {
      this.handleQueryError('saveQuestions:delete', delRes.error);
    }

    const rows = questions.map(q => ({
      id: q.id,
      venture_id: ventureId,
      question_number: q.questionNumber,
      question: q.question,
      rationale: q.rationale,
      why_it_matters: q.whyItMatters,
      category: q.category,
      suggested_options: q.suggestedOptions,
      required: q.required,
      answer: q.answer || null,
      status: q.status || 'PENDING'
    }));

    const insRes = await client.from('critical_questions').insert(rows);
    if (insRes.error) {
      this.handleQueryError('saveQuestions:insert', insRes.error);
    }
    return questions;
  }

  async updateQuestionAnswer(ventureId: string, questionId: string, answer: string): Promise<CriticalQuestion | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('critical_questions')
      .update({ answer, status: 'ANSWERED', updated_at: new Date().toISOString() })
      .eq('id', questionId)
      .eq('venture_id', ventureId)
      .select()
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      ventureId: data.venture_id || ventureId,
      questionNumber: data.question_number,
      question: data.question,
      rationale: data.rationale,
      whyItMatters: data.why_it_matters,
      category: data.category,
      suggestedOptions: data.suggested_options || [],
      required: data.required,
      answer: data.answer,
      status: data.status
    };
  }

  async skipQuestion(ventureId: string, questionId: string): Promise<CriticalQuestion | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('critical_questions')
      .update({ status: 'SKIPPED', updated_at: new Date().toISOString() })
      .eq('id', questionId)
      .eq('venture_id', ventureId)
      .select()
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      ventureId: data.venture_id || ventureId,
      questionNumber: data.question_number,
      question: data.question,
      rationale: data.rationale,
      whyItMatters: data.why_it_matters,
      category: data.category,
      suggestedOptions: data.suggested_options || [],
      required: data.required,
      answer: data.answer,
      status: data.status
    };
  }

  async saveResearchReport(ventureId: string, report: ResearchReport): Promise<ResearchReport> {
    const client = this.getClient();
    const reportId = report.id || `rep_res_${Date.now()}`;

    // 1. Insert/Update Report Record
    await client.from('reports').upsert({
      id: reportId,
      venture_id: ventureId,
      report_type: 'research',
      version: 1,
      status: 'completed',
      executive_summary: report.executiveSummary,
      confidence_score: report.confidenceScore || report.confidence || 'HIGH',
      structured_payload: report,
      generated_at: new Date().toISOString()
    });

    // 2. Persist findings & sources relationally
    const allFindings = report.findings || report.keyFindings || [];
    for (const finding of allFindings) {
      await client.from('findings').upsert({
        id: finding.id,
        venture_id: ventureId,
        statement: finding.statement,
        category: finding.category,
        evidence_type: finding.evidenceType || 'supporting',
        confidence: finding.confidence,
        implication: finding.implication,
      });

      if (finding.sources) {
        for (const src of finding.sources) {
          await client.from('sources').upsert({
            id: src.id,
            title: src.title,
            url: src.url || null,
            publisher: src.publisher || null,
            publish_year: src.publishYear || null,
            relevance_score: src.relevanceScore,
            credibility: src.reliabilityTier === 'PRIMARY' ? 'HIGH' : 'MEDIUM',
            reliability_tier: src.reliabilityTier,
            extracted_fact: src.extractedFact
          });

          await client.from('finding_sources').upsert({
            finding_id: finding.id,
            source_id: src.id,
            relation_type: 'primary_citation'
          });
        }
      }
    }

    return report;
  }

  async getResearchReport(ventureId: string): Promise<ResearchReport | null> {
    const client = this.getClient();
    const { data } = await client
      .from('reports')
      .select('structured_payload')
      .eq('venture_id', ventureId)
      .eq('report_type', 'research')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    return data ? (data.structured_payload as ResearchReport) : null;
  }

  async getResearchFindings(ventureId: string, filter?: { evidenceType?: string; category?: string; confidence?: string }): Promise<ResearchFinding[]> {
    const report = await this.getResearchReport(ventureId);
    if (!report) return [];
    let findings = report.findings || report.keyFindings || [];
    if (filter?.category) findings = findings.filter(f => f.category === filter.category);
    if (filter?.confidence) findings = findings.filter(f => f.confidence === filter.confidence);
    if (filter?.evidenceType) findings = findings.filter(f => f.evidenceType === filter.evidenceType);
    return findings;
  }

  async getSources(ventureId: string, filter?: { reliabilityTier?: string; credibility?: string }): Promise<Source[]> {
    const report = await this.getResearchReport(ventureId);
    if (!report) return [];
    const sources: Source[] = [];
    const allFindings = report.findings || report.keyFindings || [];
    for (const f of allFindings) {
      for (const s of f.sources || []) {
        if (!sources.some(existing => existing.id === s.id)) {
          sources.push(s);
        }
      }
    }
    if (report.sources) {
      for (const s of report.sources) {
        if (!sources.some(existing => existing.id === s.id)) {
          sources.push(s);
        }
      }
    }
    return sources;
  }

  async saveBusinessReport(ventureId: string, report: BusinessReport): Promise<BusinessReport> {
    const client = this.getClient();
    const reportId = report.id || `rep_biz_${Date.now()}`;

    await client.from('reports').upsert({
      id: reportId,
      venture_id: ventureId,
      report_type: 'business',
      version: 1,
      status: 'completed',
      executive_summary: report.executiveSummary || report.archetype || '',
      confidence_score: report.confidenceScore || report.confidence || 'HIGH',
      structured_payload: report,
      generated_at: new Date().toISOString()
    });

    return report;
  }

  async getBusinessReport(ventureId: string): Promise<BusinessReport | null> {
    const client = this.getClient();
    const { data } = await client
      .from('reports')
      .select('structured_payload')
      .eq('venture_id', ventureId)
      .eq('report_type', 'business')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    return data ? (data.structured_payload as BusinessReport) : null;
  }

  async getBusinessAssumptions(ventureId: string, filter?: { category?: string; importance?: string; evidenceStatus?: string }): Promise<BusinessAssumption[]> {
    const report = await this.getBusinessReport(ventureId);
    if (!report) return [];
    let assumptions = report.businessAssumptions || report.assumptions || [];
    if (filter?.category) assumptions = assumptions.filter(a => a.category === filter.category);
    if (filter?.importance) assumptions = assumptions.filter(a => a.importance === filter.importance);
    if (filter?.evidenceStatus) assumptions = assumptions.filter(a => a.evidenceStatus === filter.evidenceStatus);
    return assumptions;
  }

  async getBusinessRisks(ventureId: string, filter?: { probability?: string; impact?: string }): Promise<BusinessRisk[]> {
    const report = await this.getBusinessReport(ventureId);
    if (!report) return [];
    let risks = report.businessRisks || report.risks || [];
    if (filter?.probability) risks = risks.filter(r => r.probability === filter.probability);
    if (filter?.impact) risks = risks.filter(r => r.impact === filter.impact);
    return risks;
  }

  async saveRedTeamReport(ventureId: string, report: RedTeamReport): Promise<RedTeamReport> {
    const client = this.getClient();
    const reportId = report.id || `rep_red_${Date.now()}`;

    await client.from('reports').upsert({
      id: reportId,
      venture_id: ventureId,
      report_type: 'red_team',
      version: 1,
      status: 'completed',
      executive_summary: report.executiveSummary || report.criticalRisks?.[0]?.description || '',
      confidence_score: report.confidence || 'HIGH',
      structured_payload: report,
      generated_at: new Date().toISOString()
    });

    return report;
  }

  async getRedTeamReport(ventureId: string): Promise<RedTeamReport | null> {
    const client = this.getClient();
    const { data } = await client
      .from('reports')
      .select('structured_payload')
      .eq('venture_id', ventureId)
      .eq('report_type', 'red_team')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    return data ? (data.structured_payload as RedTeamReport) : null;
  }

  async getRedTeamClaims(ventureId: string, filter?: { evidenceStatus?: string; severity?: string; confidence?: string }): Promise<ChallengedClaim[]> {
    const report = await this.getRedTeamReport(ventureId);
    let claims = report?.challengedClaims || [];
    if (filter?.evidenceStatus) claims = claims.filter(c => c.evidenceStatus === filter.evidenceStatus);
    if (filter?.severity) claims = claims.filter(c => c.severity === filter.severity);
    if (filter?.confidence) claims = claims.filter(c => c.confidence === filter.confidence);
    return claims;
  }

  async getRedTeamRisks(ventureId: string, filter?: { category?: string; severity?: string; riskType?: string; evidenceStatus?: string }): Promise<RedTeamRisk[]> {
    const report = await this.getRedTeamReport(ventureId);
    let risks = report?.criticalRisks || [];
    if (filter?.category) risks = risks.filter(r => r.category === filter.category);
    if (filter?.severity) risks = risks.filter(r => r.severity === filter.severity);
    if (filter?.riskType) risks = risks.filter(r => r.riskType === filter.riskType);
    if (filter?.evidenceStatus) risks = risks.filter(r => r.evidenceStatus === filter.evidenceStatus);
    return risks;
  }

  async getRedTeamAssumptions(ventureId: string, filter?: { importance?: string; evidenceStatus?: string }): Promise<AssumptionAttack[]> {
    const report = await this.getRedTeamReport(ventureId);
    let assumptions = report?.assumptionAttacks || [];
    if (filter?.importance) assumptions = assumptions.filter(a => a.importance === filter.importance);
    if (filter?.evidenceStatus) assumptions = assumptions.filter(a => a.evidenceStatus === filter.evidenceStatus);
    return assumptions;
  }

  async getRedTeamContradictions(ventureId: string, filter?: { severity?: string; evidenceStatus?: string }): Promise<Contradiction[]> {
    const report = await this.getRedTeamReport(ventureId);
    let contradictions = report?.contradictions || [];
    if (filter?.severity) contradictions = contradictions.filter(c => c.severity === filter.severity);
    if (filter?.evidenceStatus) contradictions = contradictions.filter(c => c.evidenceStatus === filter.evidenceStatus);
    return contradictions;
  }

  async getRedTeamThreats(ventureId: string, filter?: { threatType?: string; differentiationStatus?: string }): Promise<CompetitiveThreat[]> {
    const report = await this.getRedTeamReport(ventureId);
    let threats = report?.competitiveThreats || [];
    if (filter?.threatType) threats = threats.filter(t => t.threatType === filter.threatType);
    if (filter?.differentiationStatus) threats = threats.filter(t => t.differentiationStatus === filter.differentiationStatus);
    return threats;
  }

  async getRedTeamFailureConditions(ventureId: string, filter?: { severity?: string; confidence?: string }): Promise<FailureCondition[]> {
    const report = await this.getRedTeamReport(ventureId);
    let conditions = report?.failureConditions || [];
    if (filter?.severity) conditions = conditions.filter(c => c.severity === filter.severity);
    if (filter?.confidence) conditions = conditions.filter(c => c.confidence === filter.confidence);
    return conditions;
  }

  async getRedTeamDecisionEvidence(ventureId: string, filter?: { direction?: string; importance?: string }): Promise<DecisionChangingEvidence[]> {
    const report = await this.getRedTeamReport(ventureId);
    let list = report?.decisionChangingEvidence || [];
    if (filter?.direction) list = list.filter(e => e.direction === filter.direction);
    if (filter?.importance) list = list.filter(e => e.importance === filter.importance);
    return list;
  }

  async saveJudgeReport(ventureId: string, report: JudgeReport): Promise<JudgeReport> {
    const client = this.getClient();
    const reportId = report.id || `rep_jdg_${Date.now()}`;

    await client.from('reports').upsert({
      id: reportId,
      venture_id: ventureId,
      report_type: 'judge',
      version: 1,
      status: 'completed',
      executive_summary: report.executiveSummary || report.synthesis,
      confidence_score: report.recommendationConfidence,
      structured_payload: report,
      generated_at: new Date().toISOString()
    });

    return report;
  }

  async getJudgeReport(ventureId: string): Promise<JudgeReport | null> {
    const client = this.getClient();
    const { data } = await client
      .from('reports')
      .select('structured_payload')
      .eq('venture_id', ventureId)
      .eq('report_type', 'judge')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    return data ? (data.structured_payload as JudgeReport) : null;
  }

  async getJudgeThesis(ventureId: string): Promise<CoreVentureThesis | null> {
    const report = await this.getJudgeReport(ventureId);
    return report?.coreVentureThesis || null;
  }

  async getJudgeCrossAgentAssessment(ventureId: string): Promise<CrossAgentAssessment | null> {
    const report = await this.getJudgeReport(ventureId);
    return report?.crossAgentAssessment || null;
  }

  async getJudgeCriticalUnknowns(ventureId: string, filter?: { impact?: string; confidence?: string }): Promise<DecisionCriticalUncertainty[]> {
    const report = await this.getJudgeReport(ventureId);
    let unknowns = report?.criticalUnknowns || [];
    if (filter?.impact) unknowns = unknowns.filter(u => u.impact === filter.impact);
    if (filter?.confidence) unknowns = unknowns.filter(u => u.confidence === filter.confidence);
    return unknowns;
  }

  async getJudgeDecisionEvidence(ventureId: string): Promise<JudgeDecisionChangingEvidence[]> {
    const report = await this.getJudgeReport(ventureId);
    return report?.decisionChangingEvidence || [];
  }

  async getJudgeNextActions(ventureId: string): Promise<NextAction[]> {
    const report = await this.getJudgeReport(ventureId);
    return report?.nextActions || [];
  }

  async getJudgeEvidenceTraceability(ventureId: string, filter?: { status?: string; evidenceLevel?: string }): Promise<EvidenceTraceability[]> {
    const report = await this.getJudgeReport(ventureId);
    let traces = report?.evidenceTraceability || [];
    if (filter?.status) traces = traces.filter(t => t.status === filter.status);
    if (filter?.evidenceLevel) traces = traces.filter(t => t.evidenceLevel === filter.evidenceLevel);
    return traces;
  }

  async saveVentureScore(ventureId: string, score: VentureScore): Promise<VentureScore> {
    const client = this.getClient();
    const runId = score.id || `scr_${Date.now()}`;

    // 1. Insert immutable scoring run
    await client.from('scoring_runs').upsert({
      id: runId,
      venture_id: ventureId,
      configuration_version: 'v1',
      final_score: score.totalScore,
      score_band: score.recommendationTier,
      ai_recommendation: score.recommendationTier === 'HIGH_READINESS' ? 'BUILD' : 'VALIDATE FIRST',
      recommendation_confidence: 'HIGH',
      score_breakdown: score.dimensions || {},
      score_interpretation: `Total readiness evaluation score: ${score.totalScore}/100 based on 4 key dimensions.`,
      weights_snapshot: {
        marketProblemUrgency: 0.25,
        businessModelViability: 0.25,
        defensibilityMoat: 0.25,
        executionRisk: 0.25
      }
    });

    return score;
  }

  async saveNextActions(ventureId: string, actions: NextAction[]): Promise<NextAction[]> {
    const client = this.getClient();
    await client.from('next_actions').delete().eq('venture_id', ventureId);

    const rows = actions.map(a => ({
      id: a.id || `na_${Date.now()}_${a.stepNumber}`,
      venture_id: ventureId,
      step_number: a.stepNumber,
      title: a.title,
      description: a.description || null,
      purpose: a.purpose || null,
      validation_target: a.validationTarget || null,
      priority: a.priority || 'HIGH',
      expected_decision_impact: a.expectedDecisionImpact || null,
      action_type: a.actionType || 'CUSTOMER_DISCOVERY',
      hypothesis_to_test: a.hypothesisToTest || a.description || '',
      pass_fail_metric: a.passFailMetric || a.validationTarget || '',
      estimated_days: a.estimatedDays || 7,
      completed: Boolean(a.completed)
    }));

    await client.from('next_actions').insert(rows);
    return actions;
  }

  async toggleActionCompletion(ventureId: string, actionId: string): Promise<NextAction | null> {
    const client = this.getClient();
    const { data: existing } = await client
      .from('next_actions')
      .select('*')
      .eq('id', actionId)
      .eq('venture_id', ventureId)
      .single();

    if (!existing) return null;

    const newCompleted = !existing.completed;
    const { data: updated } = await client
      .from('next_actions')
      .update({ completed: newCompleted })
      .eq('id', actionId)
      .select()
      .single();

    if (!updated) return null;
    return {
      id: updated.id,
      ventureId: updated.venture_id,
      stepNumber: updated.step_number as 1 | 2 | 3,
      title: updated.title,
      description: updated.description,
      purpose: updated.purpose,
      validationTarget: updated.validation_target,
      priority: updated.priority,
      expectedDecisionImpact: updated.expected_decision_impact,
      actionType: updated.action_type,
      hypothesisToTest: updated.hypothesis_to_test,
      passFailMetric: updated.pass_fail_metric,
      estimatedDays: updated.estimated_days,
      completed: updated.completed
    };
  }

  async saveDecision(ventureId: string, decision: Decision): Promise<Decision> {
    const client = this.getClient();
    const id = decision.id || `dec_${Date.now()}`;

    await client.from('decisions').upsert({
      id,
      venture_id: ventureId,
      ai_recommendation: decision.alignmentWithAI === 'ALIGNED' ? decision.choice : 'VALIDATE FIRST',
      recommendation_confidence: 'HIGH',
      founder_decision: decision.choice,
      founder_decision_at: decision.decidedAt,
      rationale: decision.rationale,
      alignment_with_ai: decision.alignmentWithAI,
      override_reason: decision.overrideReason || null,
      decided_at: decision.decidedAt
    });

    return decision;
  }

  private mapRowToVenture(row: Record<string, unknown>): Venture {
    return {
      id: String(row.id),
      title: String(row.name || 'Untitled Venture'),
      description: String(row.description || ''),
      rawIdea: String(row.raw_idea || row.description || ''),
      targetAudience: String(row.target_customer || ''),
      valueProposition: String(row.solution || ''),
      monetizationIdea: String(row.business_model || ''),
      problem: row.problem ? String(row.problem) : null,
      solution: row.solution ? String(row.solution) : null,
      targetCustomer: row.target_customer ? String(row.target_customer) : null,
      marketGeography: row.market_geography ? String(row.market_geography) : 'Global',
      businessModel: row.business_model ? String(row.business_model) : null,
      technology: row.technology ? String(row.technology) : null,
      founderAssumptions: (row.founder_assumptions as any[]) || [],
      importantUnknowns: (row.important_unknowns as any[]) || [],
      founderContext: String(row.founder_context || ''),
      status: (row.status as any) || 'draft',
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      questions: [],
      nextActions: []
    };
  }
}
