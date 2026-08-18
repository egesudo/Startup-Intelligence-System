/**
 * Database Repository Layer for Startup Intelligence
 * 
 * Provides an isolated persistence layer for Venture entities and their
 * relational children (Reports, Questions, Risks, Scores, Decisions, Actions).
 */

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
  NextAction
} from '../../types/domain';
import { isSupabaseConfigured } from './supabase';
import { SupabaseVentureRepository, isSchemaMissingError } from './supabaseRepository';

export interface IVentureRepository {
  findAll(): Promise<Venture[]>;
  findById(id: string): Promise<Venture | null>;
  create(ventureData: Partial<Venture>): Promise<Venture>;
  update(id: string, updates: Partial<Venture>): Promise<Venture | null>;
  delete(id: string): Promise<boolean>;
  
  // Child entity management
  saveQuestions(ventureId: string, questions: CriticalQuestion[]): Promise<CriticalQuestion[]>;
  updateQuestionAnswer(ventureId: string, questionId: string, answer: string): Promise<CriticalQuestion | null>;
  skipQuestion(ventureId: string, questionId: string): Promise<CriticalQuestion | null>;
  
  // Phase 3: Research persistence & queries
  saveResearchReport(ventureId: string, report: ResearchReport): Promise<ResearchReport>;
  getResearchReport(ventureId: string): Promise<ResearchReport | null>;
  getResearchFindings(ventureId: string, filter?: { evidenceType?: string; category?: string; confidence?: string }): Promise<ResearchFinding[]>;
  getSources(ventureId: string, filter?: { reliabilityTier?: string; credibility?: string }): Promise<Source[]>;
  
  // Phase 4: Business persistence & queries
  saveBusinessReport(ventureId: string, report: BusinessReport): Promise<BusinessReport>;
  getBusinessReport(ventureId: string): Promise<BusinessReport | null>;
  getBusinessAssumptions(ventureId: string, filter?: { category?: string; importance?: string; evidenceStatus?: string }): Promise<BusinessAssumption[]>;
  getBusinessRisks(ventureId: string, filter?: { probability?: string; impact?: string }): Promise<BusinessRisk[]>;
  
  // Phase 5: Red Team persistence & queries
  saveRedTeamReport(ventureId: string, report: RedTeamReport): Promise<RedTeamReport>;
  getRedTeamReport(ventureId: string): Promise<RedTeamReport | null>;
  getRedTeamClaims(ventureId: string, filter?: { evidenceStatus?: string; severity?: string; confidence?: string }): Promise<ChallengedClaim[]>;
  getRedTeamRisks(ventureId: string, filter?: { category?: string; severity?: string; riskType?: string; evidenceStatus?: string }): Promise<RedTeamRisk[]>;
  getRedTeamAssumptions(ventureId: string, filter?: { importance?: string; evidenceStatus?: string }): Promise<AssumptionAttack[]>;
  getRedTeamContradictions(ventureId: string, filter?: { severity?: string; evidenceStatus?: string }): Promise<Contradiction[]>;
  getRedTeamThreats(ventureId: string, filter?: { threatType?: string; differentiationStatus?: string }): Promise<CompetitiveThreat[]>;
  getRedTeamFailureConditions(ventureId: string, filter?: { severity?: string; confidence?: string }): Promise<FailureCondition[]>;
  getRedTeamDecisionEvidence(ventureId: string, filter?: { direction?: string; importance?: string }): Promise<DecisionChangingEvidence[]>;
  
  // Phase 6: Judge persistence & queries
  saveJudgeReport(ventureId: string, report: JudgeReport): Promise<JudgeReport>;
  getJudgeReport(ventureId: string): Promise<JudgeReport | null>;
  getJudgeThesis(ventureId: string): Promise<CoreVentureThesis | null>;
  getJudgeCrossAgentAssessment(ventureId: string): Promise<CrossAgentAssessment | null>;
  getJudgeCriticalUnknowns(ventureId: string, filter?: { impact?: string; confidence?: string }): Promise<DecisionCriticalUncertainty[]>;
  getJudgeDecisionEvidence(ventureId: string): Promise<JudgeDecisionChangingEvidence[]>;
  getJudgeNextActions(ventureId: string): Promise<NextAction[]>;
  getJudgeEvidenceTraceability(ventureId: string, filter?: { status?: string; evidenceLevel?: string }): Promise<EvidenceTraceability[]>;

  saveVentureScore(ventureId: string, score: VentureScore): Promise<VentureScore>;
  saveNextActions(ventureId: string, actions: NextAction[]): Promise<NextAction[]>;
  toggleActionCompletion(ventureId: string, actionId: string): Promise<NextAction | null>;
  saveDecision(ventureId: string, decision: Decision): Promise<Decision>;
}

// In-memory relational store with seed data
class InMemoryVentureRepository implements IVentureRepository {
  private ventures: Map<string, Venture> = new Map();
  private researchReports: Map<string, ResearchReport> = new Map();
  private researchFindings: Map<string, ResearchFinding & { ventureId: string; reportId: string }> = new Map();
  private sources: Map<string, Source & { ventureId: string; reportId: string }> = new Map();
  private businessReports: Map<string, BusinessReport> = new Map();
  private businessAssumptions: Map<string, BusinessAssumption & { ventureId: string; reportId: string }> = new Map();
  private businessRisks: Map<string, BusinessRisk & { ventureId: string; reportId: string }> = new Map();
  
  // Red Team maps
  private redTeamReports: Map<string, RedTeamReport> = new Map();
  private challengedClaims: Map<string, ChallengedClaim & { ventureId: string; reportId: string }> = new Map();
  private redTeamRisks: Map<string, RedTeamRisk & { ventureId: string; reportId: string }> = new Map();
  private assumptionAttacks: Map<string, AssumptionAttack & { ventureId: string; reportId: string }> = new Map();
  private contradictions: Map<string, Contradiction & { ventureId: string; reportId: string }> = new Map();
  private competitiveThreats: Map<string, CompetitiveThreat & { ventureId: string; reportId: string }> = new Map();
  private failureConditions: Map<string, FailureCondition & { ventureId: string; reportId: string }> = new Map();
  private decisionChangingEvidence: Map<string, DecisionChangingEvidence & { ventureId: string; reportId: string }> = new Map();

  // Phase 6: Judge maps
  private judgeReports: Map<string, JudgeReport> = new Map();
  private judgeUncertainties: Map<string, DecisionCriticalUncertainty & { ventureId: string; reportId: string }> = new Map();
  private judgeDecisionEvidence: Map<string, JudgeDecisionChangingEvidence & { ventureId: string; reportId: string }> = new Map();
  private judgeTraceability: Map<string, EvidenceTraceability & { ventureId: string; reportId: string }> = new Map();

  constructor() {
    this.seedSampleData();
  }

  async findAll(): Promise<Venture[]> {
    return Array.from(this.ventures.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async findById(id: string): Promise<Venture | null> {
    const venture = this.ventures.get(id);
    return venture ? JSON.parse(JSON.stringify(venture)) : null;
  }

  async create(ventureData: Partial<Venture>): Promise<Venture> {
    const id = ventureData.id || `vnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    
    const newVenture: Venture = {
      id,
      title: ventureData.title || 'Untitled Venture',
      description: ventureData.description || '',
      rawIdea: ventureData.rawIdea || ventureData.description || '',
      targetAudience: ventureData.targetAudience || '',
      valueProposition: ventureData.valueProposition || '',
      monetizationIdea: ventureData.monetizationIdea || '',
      problem: ventureData.problem || null,
      solution: ventureData.solution || null,
      targetCustomer: ventureData.targetCustomer || null,
      marketGeography: ventureData.marketGeography || null,
      businessModel: ventureData.businessModel || null,
      technology: ventureData.technology || null,
      founderAssumptions: ventureData.founderAssumptions || [],
      importantUnknowns: ventureData.importantUnknowns || [],
      founderContext: ventureData.founderContext || '',
      status: ventureData.status || 'draft',
      createdAt: now,
      updatedAt: now,
      questions: ventureData.questions || [],
      nextActions: ventureData.nextActions || []
    };

    this.ventures.set(id, newVenture);
    return JSON.parse(JSON.stringify(newVenture));
  }

  async update(id: string, updates: Partial<Venture>): Promise<Venture | null> {
    const existing = this.ventures.get(id);
    if (!existing) return null;

    const updated: Venture = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.ventures.set(id, updated);
    return JSON.parse(JSON.stringify(updated));
  }

  async delete(id: string): Promise<boolean> {
    this.researchReports.delete(id);
    this.businessReports.delete(id);
    this.redTeamReports.delete(id);
    this.judgeReports.delete(id);
    for (const [key, val] of this.researchFindings.entries()) {
      if (val.ventureId === id) this.researchFindings.delete(key);
    }
    for (const [key, val] of this.businessAssumptions.entries()) {
      if (val.ventureId === id) this.businessAssumptions.delete(key);
    }
    for (const [key, val] of this.businessRisks.entries()) {
      if (val.ventureId === id) this.businessRisks.delete(key);
    }
    for (const [key, val] of this.sources.entries()) {
      if (val.ventureId === id) this.sources.delete(key);
    }
    for (const [key, val] of this.challengedClaims.entries()) {
      if (val.ventureId === id) this.challengedClaims.delete(key);
    }
    for (const [key, val] of this.redTeamRisks.entries()) {
      if (val.ventureId === id) this.redTeamRisks.delete(key);
    }
    for (const [key, val] of this.assumptionAttacks.entries()) {
      if (val.ventureId === id) this.assumptionAttacks.delete(key);
    }
    for (const [key, val] of this.contradictions.entries()) {
      if (val.ventureId === id) this.contradictions.delete(key);
    }
    for (const [key, val] of this.competitiveThreats.entries()) {
      if (val.ventureId === id) this.competitiveThreats.delete(key);
    }
    for (const [key, val] of this.failureConditions.entries()) {
      if (val.ventureId === id) this.failureConditions.delete(key);
    }
    for (const [key, val] of this.decisionChangingEvidence.entries()) {
      if (val.ventureId === id) this.decisionChangingEvidence.delete(key);
    }
    for (const [key, val] of this.judgeUncertainties.entries()) {
      if (val.ventureId === id) this.judgeUncertainties.delete(key);
    }
    for (const [key, val] of this.judgeDecisionEvidence.entries()) {
      if (val.ventureId === id) this.judgeDecisionEvidence.delete(key);
    }
    for (const [key, val] of this.judgeTraceability.entries()) {
      if (val.ventureId === id) this.judgeTraceability.delete(key);
    }
    return this.ventures.delete(id);
  }

  async saveQuestions(ventureId: string, questions: CriticalQuestion[]): Promise<CriticalQuestion[]> {
    const venture = this.ventures.get(ventureId);
    if (!venture) throw new Error(`Venture ${ventureId} not found`);

    venture.questions = questions;
    venture.updatedAt = new Date().toISOString();
    return JSON.parse(JSON.stringify(venture.questions));
  }

  async updateQuestionAnswer(ventureId: string, questionId: string, answer: string): Promise<CriticalQuestion | null> {
    const venture = this.ventures.get(ventureId);
    if (!venture) return null;

    const q = venture.questions.find(q => q.id === questionId);
    if (!q) return null;

    q.answer = answer;
    q.status = 'ANSWERED';
    venture.updatedAt = new Date().toISOString();
    return JSON.parse(JSON.stringify(q));
  }

  async skipQuestion(ventureId: string, questionId: string): Promise<CriticalQuestion | null> {
    const venture = this.ventures.get(ventureId);
    if (!venture) return null;

    const q = venture.questions.find(q => q.id === questionId);
    if (!q) return null;

    q.status = 'SKIPPED';
    venture.updatedAt = new Date().toISOString();
    return JSON.parse(JSON.stringify(q));
  }

  async saveResearchReport(ventureId: string, report: ResearchReport): Promise<ResearchReport> {
    const venture = this.ventures.get(ventureId);
    if (!venture) throw new Error(`Venture ${ventureId} not found`);

    // 1. Store the ResearchReport independently
    this.researchReports.set(ventureId, JSON.parse(JSON.stringify(report)));
    this.researchReports.set(report.id, JSON.parse(JSON.stringify(report)));

    // 2. Persist Research Findings individually so they are queryable
    if (report.findings && Array.isArray(report.findings)) {
      for (const finding of report.findings) {
        this.researchFindings.set(finding.id, {
          ...JSON.parse(JSON.stringify(finding)),
          ventureId,
          reportId: report.id
        });
      }
    }

    // 3. Persist Sources individually so they are queryable
    const allSources: Source[] = [];
    if (report.sources && Array.isArray(report.sources)) {
      allSources.push(...report.sources);
    }
    if (report.findings && Array.isArray(report.findings)) {
      for (const finding of report.findings) {
        if (finding.sources && Array.isArray(finding.sources)) {
          for (const s of finding.sources) {
            if (!allSources.some(existing => existing.id === s.id)) {
              allSources.push(s);
            }
          }
        }
      }
    }

    for (const source of allSources) {
      this.sources.set(source.id, {
        ...JSON.parse(JSON.stringify(source)),
        ventureId,
        reportId: report.id
      });
    }

    // 4. Update venture entity reference
    venture.researchReport = report;
    venture.updatedAt = new Date().toISOString();
    return JSON.parse(JSON.stringify(report));
  }

  async getResearchReport(ventureId: string): Promise<ResearchReport | null> {
    const report = this.researchReports.get(ventureId) || this.ventures.get(ventureId)?.researchReport || null;
    return report ? JSON.parse(JSON.stringify(report)) : null;
  }

  async getResearchFindings(
    ventureId: string, 
    filter?: { evidenceType?: string; category?: string; confidence?: string }
  ): Promise<ResearchFinding[]> {
    const findings: ResearchFinding[] = [];
    for (const item of this.researchFindings.values()) {
      if (item.ventureId === ventureId) {
        if (filter?.evidenceType && item.evidenceType !== filter.evidenceType) continue;
        if (filter?.category && item.category !== filter.category) continue;
        if (filter?.confidence && item.confidence !== filter.confidence) continue;
        const { ventureId: _v, reportId: _r, ...pureFinding } = item;
        findings.push(pureFinding);
      }
    }
    return JSON.parse(JSON.stringify(findings));
  }

  async getSources(
    ventureId: string, 
    filter?: { reliabilityTier?: string; credibility?: string }
  ): Promise<Source[]> {
    const sources: Source[] = [];
    for (const item of this.sources.values()) {
      if (item.ventureId === ventureId) {
        if (filter?.reliabilityTier && item.reliabilityTier !== filter.reliabilityTier) continue;
        if (filter?.credibility && item.credibility !== filter.credibility) continue;
        const { ventureId: _v, reportId: _r, ...pureSource } = item;
        sources.push(pureSource);
      }
    }
    return JSON.parse(JSON.stringify(sources));
  }

  async saveBusinessReport(ventureId: string, report: BusinessReport): Promise<BusinessReport> {
    const venture = this.ventures.get(ventureId);
    if (!venture) throw new Error(`Venture ${ventureId} not found`);

    // 1. Persist Business Report entity
    this.businessReports.set(ventureId, JSON.parse(JSON.stringify(report)));

    // 2. Persist Business Assumptions individually so they are queryable
    const assumptions = report.businessAssumptions || report.assumptions || [];
    for (const assumption of assumptions) {
      this.businessAssumptions.set(assumption.id, {
        ...JSON.parse(JSON.stringify(assumption)),
        ventureId,
        reportId: report.id
      });
    }

    // 3. Persist Business Risks individually so they are queryable
    const risks = report.businessRisks || report.risks || [];
    for (const risk of risks) {
      this.businessRisks.set(risk.id, {
        ...JSON.parse(JSON.stringify(risk)),
        ventureId,
        reportId: report.id
      });
    }

    // 4. Persist any new Sources from Business Report
    if (report.sources && Array.isArray(report.sources)) {
      for (const source of report.sources) {
        if (!this.sources.has(source.id)) {
          this.sources.set(source.id, {
            ...JSON.parse(JSON.stringify(source)),
            ventureId,
            reportId: report.id
          });
        }
      }
    }

    // 5. Update venture entity reference
    venture.businessReport = report;
    venture.updatedAt = new Date().toISOString();
    return JSON.parse(JSON.stringify(report));
  }

  async getBusinessReport(ventureId: string): Promise<BusinessReport | null> {
    const report = this.businessReports.get(ventureId) || this.ventures.get(ventureId)?.businessReport || null;
    return report ? JSON.parse(JSON.stringify(report)) : null;
  }

  async getBusinessAssumptions(
    ventureId: string,
    filter?: { category?: string; importance?: string; evidenceStatus?: string }
  ): Promise<BusinessAssumption[]> {
    const assumptions: BusinessAssumption[] = [];
    for (const item of this.businessAssumptions.values()) {
      if (item.ventureId === ventureId) {
        if (filter?.category && item.category !== filter.category) continue;
        if (filter?.importance && item.importance !== filter.importance) continue;
        if (filter?.evidenceStatus && item.evidenceStatus !== filter.evidenceStatus) continue;
        const { ventureId: _v, reportId: _r, ...pureAssumption } = item;
        assumptions.push(pureAssumption);
      }
    }
    return JSON.parse(JSON.stringify(assumptions));
  }

  async getBusinessRisks(
    ventureId: string,
    filter?: { probability?: string; impact?: string }
  ): Promise<BusinessRisk[]> {
    const risks: BusinessRisk[] = [];
    for (const item of this.businessRisks.values()) {
      if (item.ventureId === ventureId) {
        if (filter?.probability && item.probability !== filter.probability) continue;
        if (filter?.impact && item.impact !== filter.impact) continue;
        const { ventureId: _v, reportId: _r, ...pureRisk } = item;
        risks.push(pureRisk);
      }
    }
    return JSON.parse(JSON.stringify(risks));
  }

  async saveRedTeamReport(ventureId: string, report: RedTeamReport): Promise<RedTeamReport> {
    const venture = this.ventures.get(ventureId);
    if (!venture) throw new Error(`Venture ${ventureId} not found`);

    venture.redTeamReport = report;
    venture.updatedAt = new Date().toISOString();
    this.redTeamReports.set(ventureId, report);

    // Persist normalized sub-entities
    if (report.challengedClaims) {
      for (const c of report.challengedClaims) {
        this.challengedClaims.set(c.id, { ...c, ventureId, reportId: report.id });
      }
    }
    if (report.criticalRisks) {
      for (const r of report.criticalRisks) {
        this.redTeamRisks.set(r.id, { ...r, ventureId, reportId: report.id });
      }
    }
    if (report.assumptionAttacks) {
      for (const a of report.assumptionAttacks) {
        this.assumptionAttacks.set(a.id, { ...a, ventureId, reportId: report.id });
      }
    }
    if (report.contradictions) {
      for (const ct of report.contradictions) {
        this.contradictions.set(ct.id, { ...ct, ventureId, reportId: report.id });
      }
    }
    if (report.competitiveThreats) {
      for (const th of report.competitiveThreats) {
        this.competitiveThreats.set(th.id, { ...th, ventureId, reportId: report.id });
      }
    }
    if (report.failureConditions) {
      for (const fc of report.failureConditions) {
        this.failureConditions.set(fc.id, { ...fc, ventureId, reportId: report.id });
      }
    }
    if (report.decisionChangingEvidence) {
      for (const de of report.decisionChangingEvidence) {
        this.decisionChangingEvidence.set(de.id, { ...de, ventureId, reportId: report.id });
      }
    }

    return JSON.parse(JSON.stringify(report));
  }

  async getRedTeamReport(ventureId: string): Promise<RedTeamReport | null> {
    const report = this.redTeamReports.get(ventureId);
    if (report) return JSON.parse(JSON.stringify(report));
    const venture = this.ventures.get(ventureId);
    return venture?.redTeamReport ? JSON.parse(JSON.stringify(venture.redTeamReport)) : null;
  }

  async getRedTeamClaims(
    ventureId: string,
    filter?: { evidenceStatus?: string; severity?: string; confidence?: string }
  ): Promise<ChallengedClaim[]> {
    const claims: ChallengedClaim[] = [];
    for (const item of this.challengedClaims.values()) {
      if (item.ventureId === ventureId) {
        if (filter?.evidenceStatus && item.evidenceStatus !== filter.evidenceStatus) continue;
        if (filter?.severity && item.severity !== filter.severity) continue;
        if (filter?.confidence && item.confidence !== filter.confidence) continue;
        const { ventureId: _v, reportId: _r, ...pureClaim } = item;
        claims.push(pureClaim);
      }
    }
    return JSON.parse(JSON.stringify(claims));
  }

  async getRedTeamRisks(
    ventureId: string,
    filter?: { category?: string; severity?: string; riskType?: string; evidenceStatus?: string }
  ): Promise<RedTeamRisk[]> {
    const risks: RedTeamRisk[] = [];
    for (const item of this.redTeamRisks.values()) {
      if (item.ventureId === ventureId) {
        if (filter?.category && item.category !== filter.category) continue;
        if (filter?.severity && item.severity !== filter.severity) continue;
        if (filter?.riskType && item.riskType !== filter.riskType) continue;
        if (filter?.evidenceStatus && item.evidenceStatus !== filter.evidenceStatus) continue;
        const { ventureId: _v, reportId: _r, ...pureRisk } = item;
        risks.push(pureRisk);
      }
    }
    return JSON.parse(JSON.stringify(risks));
  }

  async getRedTeamAssumptions(
    ventureId: string,
    filter?: { importance?: string; evidenceStatus?: string }
  ): Promise<AssumptionAttack[]> {
    const assumptions: AssumptionAttack[] = [];
    for (const item of this.assumptionAttacks.values()) {
      if (item.ventureId === ventureId) {
        if (filter?.importance && item.importance !== filter.importance) continue;
        if (filter?.evidenceStatus && item.evidenceStatus !== filter.evidenceStatus) continue;
        const { ventureId: _v, reportId: _r, ...pureAssumption } = item;
        assumptions.push(pureAssumption);
      }
    }
    return JSON.parse(JSON.stringify(assumptions));
  }

  async getRedTeamContradictions(
    ventureId: string,
    filter?: { severity?: string; evidenceStatus?: string }
  ): Promise<Contradiction[]> {
    const contradictions: Contradiction[] = [];
    for (const item of this.contradictions.values()) {
      if (item.ventureId === ventureId) {
        if (filter?.severity && item.severity !== filter.severity) continue;
        if (filter?.evidenceStatus && item.evidenceStatus !== filter.evidenceStatus) continue;
        const { ventureId: _v, reportId: _r, ...pureContradiction } = item;
        contradictions.push(pureContradiction);
      }
    }
    return JSON.parse(JSON.stringify(contradictions));
  }

  async getRedTeamThreats(
    ventureId: string,
    filter?: { threatType?: string; differentiationStatus?: string }
  ): Promise<CompetitiveThreat[]> {
    const threats: CompetitiveThreat[] = [];
    for (const item of this.competitiveThreats.values()) {
      if (item.ventureId === ventureId) {
        if (filter?.threatType && item.threatType !== filter.threatType) continue;
        if (filter?.differentiationStatus && item.differentiationStatus !== filter.differentiationStatus) continue;
        const { ventureId: _v, reportId: _r, ...pureThreat } = item;
        threats.push(pureThreat);
      }
    }
    return JSON.parse(JSON.stringify(threats));
  }

  async getRedTeamFailureConditions(
    ventureId: string,
    filter?: { severity?: string; confidence?: string }
  ): Promise<FailureCondition[]> {
    const conditions: FailureCondition[] = [];
    for (const item of this.failureConditions.values()) {
      if (item.ventureId === ventureId) {
        if (filter?.severity && item.severity !== filter.severity) continue;
        if (filter?.confidence && item.confidence !== filter.confidence) continue;
        const { ventureId: _v, reportId: _r, ...pureCondition } = item;
        conditions.push(pureCondition);
      }
    }
    return JSON.parse(JSON.stringify(conditions));
  }

  async getRedTeamDecisionEvidence(
    ventureId: string,
    filter?: { direction?: string; importance?: string }
  ): Promise<DecisionChangingEvidence[]> {
    const evidenceList: DecisionChangingEvidence[] = [];
    for (const item of this.decisionChangingEvidence.values()) {
      if (item.ventureId === ventureId) {
        if (filter?.direction && item.direction !== filter.direction) continue;
        if (filter?.importance && item.importance !== filter.importance) continue;
        const { ventureId: _v, reportId: _r, ...pureEvidence } = item;
        evidenceList.push(pureEvidence);
      }
    }
    return JSON.parse(JSON.stringify(evidenceList));
  }

  async saveJudgeReport(ventureId: string, report: JudgeReport): Promise<JudgeReport> {
    const venture = this.ventures.get(ventureId);
    if (!venture) throw new Error(`Venture ${ventureId} not found`);

    venture.judgeReport = report;
    if (report.nextActions && report.nextActions.length > 0) {
      venture.nextActions = report.nextActions;
    }
    venture.updatedAt = new Date().toISOString();
    this.judgeReports.set(ventureId, report);

    // Persist normalized sub-entities
    if (report.criticalUnknowns) {
      for (const u of report.criticalUnknowns) {
        this.judgeUncertainties.set(u.id, { ...u, ventureId, reportId: report.id });
      }
    }
    if (report.decisionChangingEvidence) {
      for (const de of report.decisionChangingEvidence) {
        this.judgeDecisionEvidence.set(de.id, { ...de, ventureId, reportId: report.id });
      }
    }
    if (report.evidenceTraceability) {
      for (const tr of report.evidenceTraceability) {
        this.judgeTraceability.set(tr.id, { ...tr, ventureId, reportId: report.id });
      }
    }

    return JSON.parse(JSON.stringify(report));
  }

  async getJudgeReport(ventureId: string): Promise<JudgeReport | null> {
    const report = this.judgeReports.get(ventureId);
    if (report) return JSON.parse(JSON.stringify(report));
    const venture = this.ventures.get(ventureId);
    return venture?.judgeReport ? JSON.parse(JSON.stringify(venture.judgeReport)) : null;
  }

  async getJudgeThesis(ventureId: string): Promise<CoreVentureThesis | null> {
    const report = await this.getJudgeReport(ventureId);
    return report?.coreVentureThesis ? JSON.parse(JSON.stringify(report.coreVentureThesis)) : null;
  }

  async getJudgeCrossAgentAssessment(ventureId: string): Promise<CrossAgentAssessment | null> {
    const report = await this.getJudgeReport(ventureId);
    return report?.crossAgentAssessment ? JSON.parse(JSON.stringify(report.crossAgentAssessment)) : null;
  }

  async getJudgeCriticalUnknowns(
    ventureId: string,
    filter?: { impact?: string; confidence?: string }
  ): Promise<DecisionCriticalUncertainty[]> {
    const unknowns: DecisionCriticalUncertainty[] = [];
    for (const item of this.judgeUncertainties.values()) {
      if (item.ventureId === ventureId) {
        if (filter?.impact && item.impact !== filter.impact) continue;
        if (filter?.confidence && item.confidence !== filter.confidence) continue;
        const { ventureId: _v, reportId: _r, ...pureItem } = item;
        unknowns.push(pureItem);
      }
    }
    if (unknowns.length > 0) return JSON.parse(JSON.stringify(unknowns));
    
    const report = await this.getJudgeReport(ventureId);
    return report?.criticalUnknowns ? JSON.parse(JSON.stringify(report.criticalUnknowns)) : [];
  }

  async getJudgeDecisionEvidence(ventureId: string): Promise<JudgeDecisionChangingEvidence[]> {
    const evidenceList: JudgeDecisionChangingEvidence[] = [];
    for (const item of this.judgeDecisionEvidence.values()) {
      if (item.ventureId === ventureId) {
        const { ventureId: _v, reportId: _r, ...pureItem } = item;
        evidenceList.push(pureItem);
      }
    }
    if (evidenceList.length > 0) return JSON.parse(JSON.stringify(evidenceList));

    const report = await this.getJudgeReport(ventureId);
    return report?.decisionChangingEvidence ? JSON.parse(JSON.stringify(report.decisionChangingEvidence)) : [];
  }

  async getJudgeNextActions(ventureId: string): Promise<NextAction[]> {
    const report = await this.getJudgeReport(ventureId);
    if (report?.nextActions && report.nextActions.length > 0) {
      return JSON.parse(JSON.stringify(report.nextActions));
    }
    const venture = this.ventures.get(ventureId);
    return venture?.nextActions ? JSON.parse(JSON.stringify(venture.nextActions)) : [];
  }

  async getJudgeEvidenceTraceability(
    ventureId: string,
    filter?: { status?: string; evidenceLevel?: string }
  ): Promise<EvidenceTraceability[]> {
    const traces: EvidenceTraceability[] = [];
    for (const item of this.judgeTraceability.values()) {
      if (item.ventureId === ventureId) {
        if (filter?.status && item.status !== filter.status) continue;
        if (filter?.evidenceLevel && item.evidenceLevel !== filter.evidenceLevel) continue;
        const { ventureId: _v, reportId: _r, ...pureItem } = item;
        traces.push(pureItem);
      }
    }
    if (traces.length > 0) return JSON.parse(JSON.stringify(traces));

    const report = await this.getJudgeReport(ventureId);
    return report?.evidenceTraceability ? JSON.parse(JSON.stringify(report.evidenceTraceability)) : [];
  }

  async saveVentureScore(ventureId: string, score: VentureScore): Promise<VentureScore> {
    const venture = this.ventures.get(ventureId);
    if (!venture) throw new Error(`Venture ${ventureId} not found`);

    venture.score = score;
    venture.updatedAt = new Date().toISOString();
    return JSON.parse(JSON.stringify(score));
  }

  async saveNextActions(ventureId: string, actions: NextAction[]): Promise<NextAction[]> {
    const venture = this.ventures.get(ventureId);
    if (!venture) throw new Error(`Venture ${ventureId} not found`);

    venture.nextActions = actions;
    venture.updatedAt = new Date().toISOString();
    return JSON.parse(JSON.stringify(actions));
  }

  async toggleActionCompletion(ventureId: string, actionId: string): Promise<NextAction | null> {
    const venture = this.ventures.get(ventureId);
    if (!venture) return null;

    const action = venture.nextActions.find(a => a.id === actionId);
    if (!action) return null;

    action.completed = !action.completed;
    venture.updatedAt = new Date().toISOString();
    return JSON.parse(JSON.stringify(action));
  }

  async saveDecision(ventureId: string, decision: Decision): Promise<Decision> {
    const venture = this.ventures.get(ventureId);
    if (!venture) throw new Error(`Venture ${ventureId} not found`);

    venture.decision = decision;
    venture.status = 'decided';
    venture.updatedAt = new Date().toISOString();
    return JSON.parse(JSON.stringify(decision));
  }

  private seedSampleData() {
    const seedId = 'vnt_sample_01';
    const sampleVenture: Venture = {
      id: seedId,
      title: 'MediSync AI - Automated Clinical Trial Patient Recruitment',
      description: 'An AI-powered recruitment engine that parses electronic health records (EHR) and matches rare disease patients to open clinical trials, cutting recruitment timeline from 14 months to 3 weeks for pharma sponsors.',
      rawIdea: 'An AI-powered recruitment engine that parses electronic health records (EHR) and matches rare disease patients to open clinical trials, cutting recruitment timeline from 14 months to 3 weeks for pharma sponsors.',
      targetAudience: 'Clinical trial managers at Mid-to-Large Biotech and Contract Research Organizations (CROs)',
      valueProposition: 'Reduces clinical trial patient enrollment dropouts by 60% using HIPAA-compliant de-identified vector queries across partner clinic networks.',
      monetizationIdea: '$4,500 per enrolled patient success fee plus $25,000 annual platform subscription per active trial.',
      problem: '80% of Phase II/III clinical trials fail enrollment deadlines, costing pharma $1M/day in delayed patent exclusivity.',
      solution: 'Automated FHIR-based EHR pipeline scanning de-identified patient charts to surface rare disease candidates in 3 weeks.',
      targetCustomer: 'Clinical trial operations directors at mid-to-large biotech and CROs',
      marketGeography: 'United States & EU (FDA/EMA regulated clinical sites)',
      businessModel: '$4,500 per enrolled patient success milestone + $25k annual software license',
      technology: 'HIPAA-compliant LLM chart extraction + FHIR Redox middleware',
      founderAssumptions: [
        'Hospitals will permit third-party AI middleware to query records without demanding heavy equity/rev-share.',
        'Patient consent conversion through digital outreach will exceed 12% in oncology/rare disease.'
      ],
      importantUnknowns: [
        'Hospital CIO compliance audit lead times.',
        'False positive rates on unstructured pathology PDF attachments.'
      ],
      status: 'evaluated',
      createdAt: '2026-08-16T14:30:00.000Z',
      updatedAt: '2026-08-16T15:10:00.000Z',
      questions: [
        {
          id: 'cq_01',
          ventureId: seedId,
          questionNumber: 1,
          question: 'How will you establish your initial integrations with hospital EHR systems given long IT security reviews?',
          rationale: 'EHR integrations represent the largest bottleneck in healthcare software deployment.',
          whyItMatters: 'Determines whether site onboarding takes 3 weeks or 9 months, defining initial runway burn.',
          category: 'technology',
          suggestedOptions: ['Direct FHIR API integrations', 'Partner with existing EHR middleware (e.g., Redox)', 'Start with patient-uploaded consent records'],
          required: true,
          answer: 'Partnering with existing EHR middleware (Redox) for pilot clinics to bypass 9-month custom hospital security audits.',
          status: 'ANSWERED'
        },
        {
          id: 'cq_02',
          ventureId: seedId,
          questionNumber: 2,
          question: 'What is your compliance posture for HIPAA & de-identification validation?',
          rationale: 'Regulatory violations carry extreme legal and financial liabilities.',
          whyItMatters: 'Pharma sponsors cannot engage without certified legal de-identification guarantees.',
          category: 'validation',
          suggestedOptions: ['Safe Harbor de-identification algorithm', 'Expert Determination method', 'On-premise zero-knowledge processing'],
          required: true,
          answer: 'Expert Determination method with an air-gapped tenant architecture on AWS GovCloud.',
          status: 'ANSWERED'
        }
      ],
      researchReport: {
        id: 'rr_01',
        ventureId: seedId,
        createdAt: '2026-08-16T14:45:00.000Z',
        executiveSummary: 'Clinical trial recruitment is an $8.2B global market where 80% of trials fail to meet enrollment deadlines. Primary tailwind is FDA modernizing decentralized trials, but hospital EHR inertia is a high resistance barrier.',
        confidenceScore: 'HIGH',
        tailwinds: [
          'FDA 2024 guidance expanding digital health and decentralized trial recruitment protocols.',
          'Pharma R&D budgets increasing allocation toward AI matching tools to stem $1M/day trial delay losses.',
          'Interoperability mandates (21st Century Cures Act) easing standardized FHIR data extraction.'
        ],
        headwinds: [
          'Hospital CIO procurement cycles routinely span 9 to 18 months.',
          'Incumbent patient registries (e.g., Deep 6 AI, Antidote) hold established CRO distribution partnerships.'
        ],
        unvalidatedAssumptions: [
          'Hospitals will permit third-party AI agents to query patient records without revenue share.',
          'Patient consent conversion rate through digital outreach will exceed 12% in oncology/rare disease.'
        ],
        competitors: [
          {
            name: 'Deep 6 AI',
            category: 'DIRECT',
            marketPosition: 'Well-funded leader with 50+ hospital networks integrated.',
            coreAdvantage: 'Extensive on-prem hospital trust and pre-built NLP pipeline.',
            coreVulnerability: 'Slow deployment cycle (avg 8 months) and heavy enterprise sales overhead.'
          },
          {
            name: 'SubjectWell',
            category: 'INDIRECT',
            marketPosition: 'Risk-free marketplace model focusing on patient direct-to-consumer ads.',
            coreAdvantage: 'High volume for broad indications (e.g., diabetes, asthma).',
            coreVulnerability: 'Extremely poor yield for complex genetic and rare disease inclusion criteria.'
          }
        ],
        findings: [
          {
            id: 'rf_01',
            category: 'MARKET_SIZE',
            statement: 'Clinical trial recruitment expenditure accounts for ~32% of total Phase II/III clinical budgets.',
            confidence: 'HIGH',
            implication: 'Pharma has proven willingness to pay premium rates if delay risk is mitigated.',
            sources: [
              {
                id: 'src_01',
                title: 'Tufts Center for the Study of Drug Development Impact Report',
                publisher: 'Tufts CSDD',
                publishYear: 2024,
                relevanceScore: 0.95,
                reliabilityTier: 'INDUSTRY_REPORT',
                extractedFact: 'Average daily cost of a delayed Phase III trial ranges between $600k and $8M in lost patent exclusivity.'
              }
            ]
          },
          {
            id: 'rf_02',
            category: 'CUSTOMER_NEED',
            statement: '86% of clinical trials experience enrollment delays; 19% are terminated due to recruitment failure.',
            confidence: 'HIGH',
            implication: 'Pain point is urgent and high-stakes rather than a discretionary luxury.',
            sources: [
              {
                id: 'src_02',
                title: 'National Institutes of Health (NIH) Clinical Center Recruitment Benchmarks',
                publisher: 'NIH Clinical Center',
                publishYear: 2023,
                relevanceScore: 0.92,
                reliabilityTier: 'PRIMARY',
                extractedFact: 'Over 80% of clinical research sites fail to meet recruitment targets within the original timeline.'
              }
            ]
          }
        ]
      },
      businessReport: {
        id: 'br_01',
        ventureId: seedId,
        createdAt: '2026-08-16T14:55:00.000Z',
        executiveSummary: 'Commercial viability analysis for MediSync. Clinical trial recruitment is an acute, high-dollar bottleneck ($600k-$8M/day delay cost) where CROs and biotechs have proven willingness to pay for accelerated site enrollment. Unit economics support 78%+ gross margins at scale, provided customer onboarding and EHR integration costs are tightly controlled.',
        confidence: 'HIGH',
        confidenceScore: 'HIGH',
        customerAnalysis: {
          targetCustomer: 'Mid-sized Contract Research Organizations (CROs) and specialized oncology/rare-disease biotechs.',
          customerProblem: '86% of clinical trials experience enrollment delays due to fragmented patient discovery across hospital networks.',
          severity: 'HIGH',
          frequency: 'DAILY',
          currentAlternatives: [
            'Manual medical record audits by on-site research coordinators',
            'Direct-to-consumer digital ad campaigns (SubjectWell)',
            'Legacy clinical trial registries'
          ],
          switchingBehavior: 'CROs readily adopt secondary sourcing vendors if candidate qualification rate exceeds 80%.',
          evidenceOfDemand: 'Recruitment budgets represent 32% of total Phase II/III trial spend ($2.4B total addressable subsegment).',
          willingnessToPayEvidence: 'Tufts CSDD data verifies pharma pays $5k-$15k bounty per randomized oncology patient.',
          willingnessToPayStatus: 'PARTIALLY_VALIDATED'
        },
        problemEconomics: {
          valueProposition: 'Automates patient phenotyping across hospital EHRs to accelerate trial recruitment by 40%.',
          costOfInaction: '$600k to $8M per day in lost patent exclusivity and trial maintenance overhead.',
          economicJustification: 'Enrolling 10 additional patients 30 days early saves a sponsor over $1.2M in trial operational costs.'
        },
        marketAnalysis: {
          marketStructure: 'Specialized enterprise healthtech vertical with high regulatory barriers and incumbent vendor consolidation.',
          industryEconomics: '75-85% software gross margins counterbalanced by 6-9 month enterprise procurement and HIPAA compliance audits.',
          entryBarriers: ['HIPAA / BAA data security agreements', 'Hospital institutional review board (IRB) approvals', 'EHR vendor API integration certification'],
          regulatoryConstraints: ['HIPAA Privacy Rule', 'FDA 21 CFR Part 11 Electronic Records Compliance', 'GDPR for European clinical sites']
        },
        competitiveLandscape: [
          {
            company: 'Deep 6 AI',
            offering: 'Enterprise precision matching platform integrated with 50+ health systems.',
            targetCustomer: 'Top 20 global pharmaceutical sponsors',
            pricing: 'Enterprise license ($150k - $500k / year)',
            positioning: 'Comprehensive hospital-wide clinical research infrastructure',
            strengths: 'Deep hospital network relationships and established brand credibility',
            weaknesses: 'Extremely slow 8-12 month sales cycle and heavy custom integration labor',
            sourceIds: ['src_01']
          },
          {
            company: 'SubjectWell',
            offering: 'Patient marketplace with risk-free per-enrolled patient pricing.',
            targetCustomer: 'Broad indication clinical trials (diabetes, cardiology)',
            pricing: '$2,000 - $6,000 per randomized patient',
            positioning: 'High-volume consumer patient recruitment engine',
            strengths: 'Fast self-serve campaign launch without hospital EHR integration',
            weaknesses: 'Low eligibility yield for complex oncology and genomic biomarker protocols',
            sourceIds: ['src_02']
          }
        ],
        alternativeSolutions: [
          'Manual chart reviews by hospital research coordinators',
          'Physician referral networks and medical conference flyers',
          'General digital patient ad campaigns'
        ],
        businessModel: {
          revenueModel: 'Hybrid platform access fee ($35k/year/CRO) + $4,500 milestone success fee per randomized patient.',
          pricingModel: 'Tiered subscription + performance milestone fees',
          archetype: 'B2B_SAAS',
          costDrivers: [
            'EHR integration connector maintenance and cloud compute',
            'Nurse-in-the-loop candidate screening and verification labor',
            'Enterprise sales and compliance audit certifications'
          ],
          retentionMechanism: 'Proprietary phenotype extraction rules and accumulated pre-consented patient network.',
          unitEconomicsHypothesis: {
            targetPricePoint: '$35,000 platform fee + $4,500 per verified patient',
            estimatedMarginProfile: '78% Gross Margin at operational scale',
            paybackPeriodEstimate: '5 - 7 months per active CRO account',
            capitalRequirement: 'MODERATE_SEED',
            notes: 'Requires $1.5M seed to achieve HIPAA certifications and 5 initial hospital integrations.'
          }
        },
        pricingEvidence: [
          {
            benchmark: 'Pharma Clinical Recruitment Bounties',
            model: 'Milestone per-patient success pricing',
            priceRange: '$3,500 - $12,000 per randomized oncology patient',
            evidence: 'Published Tufts CSDD clinical trial cost benchmarks and CRO RFP rate cards.',
            sourceIds: ['src_01']
          }
        ],
        distributionAnalysis: {
          primaryChannel: 'Direct enterprise sales to mid-tier CROs and specialized rare disease biotechs.',
          channelViability: 'High viability; CROs act as channel aggregators bringing 10-30 clinical trials per contract.',
          acquisitionChallenges: [
            'Navigating hospital Institutional Review Board (IRB) and security approvals.',
            'Overcoming Principal Investigator (PI) skepticism of automated matching algorithms.'
          ],
          distributionBottlenecks: [
            'Hospital IT vendor risk assessments averaging 60-90 days.',
            'Custom EHR API credentialing across diverse hospital health system instances.'
          ]
        },
        acquisitionConsiderations: [
          'Offer initial no-risk pilot where subscription fee is waived until first 3 patients are successfully randomized.',
          'Focus outbound on Phase II oncology biotechs with active FDA Fast Track designations.'
        ],
        operationalConsiderations: [
          'Staff on-demand oncology triage nurses to verify AI candidate matches within 4 hours.',
          'Automate HL7 / FHIR data ingestion pipelines with instant error alerting.'
        ],
        businessAssumptions: [
          {
            id: 'ba_01',
            statement: 'Mid-sized CROs will sponsor hospital EHR onboarding to accelerate their own client deliverables.',
            hypothesis: 'Mid-sized CROs will sponsor hospital EHR onboarding to accelerate their own client deliverables.',
            category: 'customer',
            importance: 'CRITICAL',
            evidenceStatus: 'unverified',
            confidence: 'MEDIUM',
            validationMethod: 'Secure LOI commitments from 3 CRO partner proposals.',
            supportingSourceIds: ['src_01'],
            isHighRisk: true
          },
          {
            id: 'ba_02',
            statement: 'Sponsors will accept hybrid fixed platform fee + per-enrolled-patient milestone pricing.',
            hypothesis: 'Sponsors will accept hybrid fixed platform fee + per-enrolled-patient milestone pricing.',
            category: 'pricing',
            importance: 'HIGH',
            evidenceStatus: 'partially_verified',
            confidence: 'HIGH',
            validationMethod: 'Pricing sensitivity interviews with 10 clinical operations directors.',
            supportingSourceIds: ['src_01'],
            isHighRisk: false
          },
          {
            id: 'ba_03',
            statement: 'Clinical research sites can be integrated via standardized FHIR APIs in under 14 days.',
            hypothesis: 'Clinical research sites can be integrated via standardized FHIR APIs in under 14 days.',
            category: 'operations',
            importance: 'HIGH',
            evidenceStatus: 'unverified',
            confidence: 'LOW',
            validationMethod: 'Technical integration spike with a partner community hospital sandbox.',
            isHighRisk: true
          }
        ],
        businessRisks: [
          {
            id: 'brisk_01',
            title: 'Extended Enterprise Sales Cycle',
            description: 'Hospital security reviews taking 9+ months can deplete startup runway before revenue realization.',
            probability: 'HIGH',
            impact: 'HIGH',
            severity: 'HIGH',
            confidence: 'HIGH',
            evidence: 'Enterprise healthcare software sales cycles consistently average 6-12 months.',
            mitigation: 'Target Phase II trials at venture-backed biotechs with urgent 6-month enrollment windows.',
            mitigationStrategy: 'Target Phase II trials at venture-backed biotechs with urgent 6-month enrollment windows.',
            validationAction: 'Track sales stage velocity across first 10 qualified CRO prospect conversations.'
          },
          {
            id: 'brisk_02',
            title: 'Principal Investigator Site Gatekeeping',
            description: 'Physicians may refuse to contact AI-matched patients unless credited with trial co-authorship.',
            probability: 'MEDIUM',
            impact: 'HIGH',
            severity: 'HIGH',
            confidence: 'MEDIUM',
            evidence: 'Academic medical centers protect patient relationships zealously.',
            mitigation: 'Provide automated PI notification workflows with one-click referral approval and attribution tracking.',
            mitigationStrategy: 'Provide automated PI notification workflows with one-click referral approval and attribution tracking.',
            validationAction: 'Interview 5 site PIs on their preferred workflow for third-party recruitment referrals.'
          }
        ],
        supportingEvidence: [
          'Pharma spend on patient recruitment has grown 14% annually due to rising clinical protocol complexity.',
          'Verified CRO willingness to pay $4k+ per qualified rare disease patient.'
        ],
        contradictoryEvidence: [
          'Hospital IT departments enforce stringent vendor security questionnaires delaying trial start dates.',
          'Legacy EHR vendors charge high API extraction fees for third-party queries.'
        ],
        unknowns: [
          'Exact patient consent conversion rate when notified of trial matches via SMS/email portal.',
          'Average nurse review hours required per 100 raw EHR algorithm candidate matches.',
          'Pricing elasticity if competitor offers pure performance pricing without platform fees.'
        ],
        sources: [
          {
            id: 'src_01',
            title: 'Tufts Center for the Study of Drug Development Impact Report',
            publisher: 'Tufts CSDD',
            publishYear: 2024,
            relevanceScore: 0.95,
            reliabilityTier: 'INDUSTRY_REPORT',
            extractedFact: 'Average daily cost of a delayed Phase III trial ranges between $600k and $8M in lost patent exclusivity.'
          },
          {
            id: 'src_02',
            title: 'National Institutes of Health (NIH) Clinical Center Recruitment Benchmarks',
            publisher: 'NIH Clinical Center',
            publishYear: 2023,
            relevanceScore: 0.92,
            reliabilityTier: 'PRIMARY',
            extractedFact: 'Over 80% of clinical research sites fail to meet recruitment targets within the original timeline.'
          }
        ],
        metadata: {
          status: 'completed',
          startedAt: '2026-08-16T14:50:00.000Z',
          completedAt: '2026-08-16T14:55:00.000Z',
          assumptionCount: 3,
          riskCount: 2,
          sourceCount: 2,
          unknownCount: 3,
          confidence: 'HIGH'
        },
        archetype: 'B2B_SAAS',
        estimatedMarginProfile: '78% Gross Margin at scale (dominated by cloud compute & EHR integration licensing).',
        pricingPower: 'STRONG',
        capitalRequirement: 'MODERATE_SEED',
        primaryDistributionChannel: 'Direct enterprise sales to mid-tier CROs and specialized rare disease biotechs.',
        defensibilityMoat: {
          type: 'DATA_LOCKIN',
          strength: 'STRONG',
          rationale: 'Proprietary phenotype extraction mappings and growing network of pre-consented patient profiles create high switching costs for sponsors.'
        },
        assumptions: [
          {
            id: 'ba_01',
            statement: 'Mid-sized CROs will sponsor hospital EHR onboarding to accelerate their own client deliverables.',
            hypothesis: 'Mid-sized CROs will sponsor hospital EHR onboarding to accelerate their own client deliverables.',
            category: 'customer',
            importance: 'CRITICAL',
            evidenceStatus: 'unverified',
            confidence: 'MEDIUM',
            validationMethod: 'Secure LOI commitments from 3 CRO partner proposals.',
            supportingSourceIds: ['src_01'],
            isHighRisk: true
          },
          {
            id: 'ba_02',
            statement: 'Sponsors will accept hybrid fixed platform fee + per-enrolled-patient milestone pricing.',
            hypothesis: 'Sponsors will accept hybrid fixed platform fee + per-enrolled-patient milestone pricing.',
            category: 'pricing',
            importance: 'HIGH',
            evidenceStatus: 'partially_verified',
            confidence: 'HIGH',
            validationMethod: 'Pricing sensitivity interviews with 10 clinical operations directors.',
            supportingSourceIds: ['src_01'],
            isHighRisk: false
          }
        ],
        risks: [
          {
            id: 'brisk_01',
            title: 'Extended Enterprise Sales Cycle',
            description: 'Hospital security reviews taking 9+ months can deplete startup runway before revenue realization.',
            probability: 'HIGH',
            impact: 'HIGH',
            severity: 'HIGH',
            confidence: 'HIGH',
            evidence: 'Enterprise healthcare software sales cycles consistently average 6-12 months.',
            mitigation: 'Target Phase II trials at venture-backed biotechs with urgent 6-month enrollment windows.',
            mitigationStrategy: 'Target Phase II trials at venture-backed biotechs with urgent 6-month enrollment windows.',
            validationAction: 'Track sales stage velocity across first 10 qualified CRO prospect conversations.'
          }
        ]
      },
      redTeamReport: {
        id: 'rt_01',
        ventureId: seedId,
        createdAt: '2026-08-16T15:02:00.000Z',
        executiveSummary: 'Adversarial investigation of MediSync AI indicates severe risk of false positives from unstructured PDF pathology notes and high organizational friction from Principal Investigator (PI) site gatekeeping. While market willingness-to-pay is robust, hospital EHR integration velocity remains unproven.',
        confidence: 'HIGH',
        counterFactualAnalysis: 'If Epic Systems or Cerner release native clinical trial matching plugins in their app orchards, MediSync loses its core distribution layer overnight.',
        untestedDogmasChallenged: [
          'Assuming EHR data is sufficiently structured for zero-shot patient matching (in reality, 70% of relevant exclusion criteria resides in unformatted physician notes).',
          'Assuming patient consent friction is negligible once matches are identified.',
          'Assuming clinical trial directors have autonomous authority to authorize EHR database integrations.'
        ],
        challengedClaims: [
          {
            id: 'rtcc_01',
            claim: 'Automated FHIR pipelines can identify 100% eligible rare disease oncology patients without human clinical review.',
            claimSource: 'founder',
            challenge: 'Oncology biomarker eligibility criteria frequently reside in unstructured PDF biopsies and scanned pathology reports that FHIR schemas omit.',
            evidence: 'Published ASCO clinical informatics studies report 42% false-positive match rates on purely automated EHR natural language parsing.',
            sourceIds: ['src_01'],
            evidenceStatus: 'contradicted',
            confidence: 'HIGH',
            severity: 'CRITICAL',
            implication: 'Presenting ineligible patients to trial coordinators destroys CRO trust immediately during early pilots.'
          },
          {
            id: 'rtcc_02',
            claim: 'Hospital health systems will approve third-party AI integration within 14 days.',
            claimSource: 'business_report',
            challenge: 'Hospital IT security and institutional review boards (IRBs) enforce rigorous 60-90 day compliance reviews for external data conduits.',
            evidence: 'Healthcare SaaS procurement benchmarks show median health system vendor onboarding duration is 78 days.',
            sourceIds: ['src_02'],
            evidenceStatus: 'contradicted',
            confidence: 'HIGH',
            severity: 'HIGH',
            implication: 'Extended deployment lag threatens to deplete early startup runway before recurring revenue initiates.'
          }
        ],
        criticalRisks: [
          {
            id: 'rtf_01',
            title: 'The Unstructured Pathology Blindspot',
            description: 'Biotech criteria rely on nuanced genomic and histology biomarkers buried in scanned PDF pathology reports that standard EHR APIs fail to parse accurately.',
            category: 'technology',
            severity: 'CRITICAL',
            evidenceStatus: 'supported',
            supportingEvidence: 'Genomic biomarker panel data in 60%+ of community hospital networks is stored in scanned PDF laboratory attachments.',
            sourceIds: ['src_01'],
            confidence: 'HIGH',
            potentialImpact: 'High false-positive rate causing CRO trial sponsors to cancel pilot contracts.',
            validationMethod: 'Run blind match audit on 50 de-identified oncology charts against human oncologist gold-standard annotations.',
            riskType: 'EVIDENCE_BACKED',
            vulnerability: 'The Unstructured Pathology Blindspot',
            failureMechanism: 'Biotech criteria rely on nuanced genomic and histology biomarkers buried in scanned PDF pathology reports that standard EHR APIs fail to parse accurately.',
            whyCompetitorsWillWin: 'Incumbents have human clinical curation teams auditing raw records to guarantee 99%+ eligibility accuracy.',
            preMortemTrigger: 'First trial batch yields 40% false positives rejected at site screening, destroying CRO trust.'
          },
          {
            id: 'rtf_02',
            title: 'Hospital Site PI Gatekeeping',
            description: 'Principal investigators (PIs) refuse to contact their patients for trial matches unless credited with academic co-authorship or consulting fees.',
            category: 'adoption',
            severity: 'HIGH',
            evidenceStatus: 'unverified',
            supportingEvidence: 'Academic medical centers protect patient relationships zealously from uncredentialed tech startups.',
            sourceIds: ['src_02'],
            confidence: 'MEDIUM',
            potentialImpact: 'Sponsors sign enterprise agreements but trial sites generate zero activated patient referrals.',
            validationMethod: 'Conduct 5 interviews with community oncology PIs regarding third-party candidate referral workflows.',
            riskType: 'EVIDENCE_BACKED',
            vulnerability: 'Hospital Site Gatekeeping',
            failureMechanism: 'Principal investigators (PIs) refuse to contact their patients for trial matches unless credited with academic co-authorship or consulting fees.',
            whyCompetitorsWillWin: 'Academic medical centers protect patient relationships zealously from uncredentialed tech startups.',
            preMortemTrigger: 'Pilot signs CRO agreement but zero hospital sites activate automated outreach.'
          }
        ],
        assumptionAttacks: [
          {
            id: 'rtaa_01',
            assumption: 'Standardized FHIR APIs are accessible in production at target community oncology clinic sites.',
            importance: 'CRITICAL',
            evidenceStatus: 'unverified',
            supportingSourceIds: [],
            contradictorySourceIds: ['src_02'],
            confidence: 'HIGH',
            whatWouldValidateIt: '3 clinic pilot partners successfully streaming FHIR test bundles in < 5 business days.',
            whatWouldInvalidateIt: 'Clinic IT demanding custom HL7 v2 interface engine connections and high vendor interface fees.'
          },
          {
            id: 'rtaa_02',
            assumption: 'Patients matched by the algorithm will consent to trial participation at rates exceeding 25%.',
            importance: 'HIGH',
            evidenceStatus: 'unverified',
            supportingSourceIds: ['src_01'],
            confidence: 'MEDIUM',
            whatWouldValidateIt: 'A 30-day cohort simulation showing >30% patient response to physician-endorsed trial invitations.',
            whatWouldInvalidateIt: 'Patient drop-off > 90% due to travel distance constraints or mistrust of automated clinical outreach.'
          }
        ],
        contradictions: [
          {
            id: 'rtct_01',
            claimOrAssumption: 'Deployment Speed vs Healthcare IT Reality',
            sourceA: 'Founder Thesis: Rapid 14-day self-serve onboarding for clinic sites.',
            sourceB: 'Research Report & Industry Data: Median healthcare B2B integration cycle is 60-90 days due to HIPAA BAA & IRB compliance.',
            description: 'Severe friction between low-touch deployment hypothesis and institutional clinical compliance requirements.',
            severity: 'HIGH',
            confidence: 'HIGH',
            evidenceStatus: 'contradicted',
            sourceIds: ['src_02']
          }
        ],
        competitiveThreats: [
          {
            id: 'rtth_01',
            competitorOrSubstitute: 'Deep 6 AI & Paradigm Health',
            threatType: 'DIRECT_COMPETITOR',
            threatDescription: 'Well-capitalized incumbents with existing health system EHR enterprise integrations and human curation networks.',
            differentiationStatus: 'UNVERIFIED_DIFFERENTIATION',
            whyCustomerWouldNotSwitch: 'Incumbents already hold institutional Data Use Agreements and security clearances with top-tier research networks.',
            sourceIds: ['src_01']
          },
          {
            id: 'rtth_02',
            competitorOrSubstitute: 'Manual Clinical Research Coordinator Chart Reviews',
            threatType: 'STATUS_QUO',
            threatDescription: 'Established site staff manually skimming daily patient schedules without requiring new third-party software procurement.',
            differentiationStatus: 'UNVERIFIED_DIFFERENTIATION',
            whyCustomerWouldNotSwitch: 'Zero incremental software budget approval or IT security overhead required.',
            sourceIds: []
          }
        ],
        failureConditions: [
          {
            id: 'rtfc_01',
            condition: 'If false positive match rates exceed 15% during the first CRO trial milestone, the CRO will cancel the contract and trigger clawback provisions.',
            supportingEvidence: 'Standard CRO vendor SLA terms for patient recruitment contractors.',
            severity: 'CRITICAL',
            confidence: 'HIGH',
            validationMethod: 'Implement human oncology nurse review on early pilot matches.'
          },
          {
            id: 'rtfc_02',
            condition: 'If clinic site IT onboarding exceeds 90 days on average, enterprise CAC will outstrip customer lifetime gross profit contributions.',
            supportingEvidence: 'Healthcare SaaS unit economic benchmarks.',
            severity: 'HIGH',
            confidence: 'HIGH',
            validationMethod: 'Measure exact days from BAA signing to live API query across initial clinic cohort.'
          }
        ],
        decisionChangingEvidence: [
          {
            id: 'rtdce_01',
            evidence: '2 commercial biotech trial sponsors sign binding paid pilot contracts ($25k+) after reviewing blind retrospective match accuracy data.',
            direction: 'positive',
            importance: 'CRITICAL',
            sourceIds: ['src_01'],
            currentStatus: 'Currently unvalidated in target market',
            validationAction: 'Execute retrospective match audit on 50 historical trial candidate profiles.'
          },
          {
            id: 'rtdce_02',
            evidence: 'Over 50% of targeted community clinic networks refuse to install EHR extraction connectors without upfront six-figure integration subsidies.',
            direction: 'negative',
            importance: 'CRITICAL',
            sourceIds: ['src_02'],
            currentStatus: 'High risk based on healthcare IT integration precedent',
            validationAction: 'Direct outreach to 10 community oncology clinic IT administrators.'
          }
        ],
        supportingEvidence: [
          'Pharma spend on clinical trial patient recruitment continues to grow by >14% annually.',
          'Mid-sized CROs consistently budget $3.5k-$12k per randomized rare oncology patient.'
        ],
        contradictoryEvidence: [
          'Biomarker eligibility data in community hospitals is heavily locked inside unstructured PDF records.',
          'Health system IT security reviews impose 60-90 day latency on third-party cloud integrations.'
        ],
        unknowns: [
          'True human nurse review cost per patient card when verifying AI-generated eligibility flags.',
          'Willingness of community hospital PIs to accept AI-suggested patient outreach without co-authorship.'
        ],
        metadata: {
          status: 'completed',
          startedAt: '2026-08-16T15:00:00.000Z',
          completedAt: '2026-08-16T15:05:00.000Z',
          challengedClaimCount: 2,
          criticalRiskCount: 2,
          assumptionAttackCount: 2,
          contradictionCount: 1,
          failureConditionCount: 2,
          decisionEvidenceCount: 2,
          sourceCount: 2,
          unknownCount: 2,
          confidence: 'HIGH'
        },
        fatalFlaws: [
          {
            id: 'rtf_01',
            title: 'The Unstructured Pathology Blindspot',
            description: 'Biotech criteria rely on nuanced genomic and histology biomarkers buried in scanned PDF pathology reports that standard EHR APIs fail to parse accurately.',
            vulnerability: 'The Unstructured Pathology Blindspot',
            severity: 'HIGH',
            failureMechanism: 'Biotech criteria rely on nuanced genomic and histology biomarkers buried in scanned PDF pathology reports that standard EHR APIs fail to parse accurately.',
            whyCompetitorsWillWin: 'Incumbents have human clinical curation teams auditing raw records to guarantee 99%+ eligibility accuracy.',
            preMortemTrigger: 'First trial batch yields 40% false positives rejected at site screening, destroying CRO trust.',
            evidenceStatus: 'supported',
            confidence: 'HIGH',
            potentialImpact: 'High false-positive rate causing CRO trial sponsors to cancel pilot contracts.',
            validationMethod: 'Run blind match audit on 50 de-identified oncology charts against human oncologist gold-standard annotations.',
            riskType: 'EVIDENCE_BACKED'
          },
          {
            id: 'rtf_02',
            title: 'Hospital Site Gatekeeping',
            description: 'Principal investigators (PIs) refuse to contact their patients for trial matches unless credited with academic co-authorship or consulting fees.',
            vulnerability: 'Hospital Site Gatekeeping',
            severity: 'MEDIUM',
            failureMechanism: 'Principal investigators (PIs) refuse to contact their patients for trial matches unless credited with academic co-authorship or consulting fees.',
            whyCompetitorsWillWin: 'Academic medical centers protect patient relationships zealously from uncredentialed tech startups.',
            preMortemTrigger: 'Pilot signs CRO agreement but zero hospital sites activate automated outreach.',
            evidenceStatus: 'unverified',
            confidence: 'MEDIUM',
            potentialImpact: 'Sponsors sign enterprise agreements but trial sites generate zero activated patient referrals.',
            validationMethod: 'Conduct 5 interviews with community oncology PIs regarding third-party candidate referral workflows.',
            riskType: 'EVIDENCE_BACKED'
          }
        ],
        killScenarios: [
          {
            title: 'The EHR App Store Lockout',
            scenario: 'Major EHR vendor introduces strict API rate limits and requires a 30% revenue share for third-party matching tools.',
            probability: 'MEDIUM'
          },
          {
            title: 'Sponsor Liability Contagion',
            scenario: 'A patient mis-classified by the AI matching engine enters a trial with an overlooked contraindication, leading to an adverse event investigation.',
            probability: 'LOW'
          }
        ]
      },
      judgeReport: {
        id: 'jr_01',
        ventureId: seedId,
        createdAt: '2026-08-16T15:08:00.000Z',
        executiveSummary: 'MediSync addresses a verified, high-value clinical recruitment bottleneck ($600k-$8M daily delay cost). However, critical empirical friction in unstructured pathology extraction and Principal Investigator gatekeeping necessitates targeted validation before full software deployment. The judicial recommendation is VALIDATE FIRST.',
        aiRecommendation: 'VALIDATE FIRST',
        recommendationConfidence: 'HIGH',
        coreVentureThesis: {
          statement: 'MediSync AI can establish a scalable clinical trial recruitment wedge by parsing oncology EHR records faster and more accurately than manual coordinator skimming.',
          supportingEvidence: [
            'Tufts CSDD data verifies daily Phase III trial delay cost of $600k-$8M in lost patent exclusivity.',
            'NIH benchmarks confirm >80% of clinical research sites miss original patient recruitment timelines.'
          ],
          contradictingEvidence: [
            'ASCO informatics benchmarks show 42% false-positive rate on purely automated PDF pathology note parsing.',
            'Median health system IT vendor onboarding requires 60-90 days due to HIPAA and IRB governance.'
          ],
          criticalAssumptions: [
            'Target clinic sites can provide automated FHIR data streams without expensive custom interface engineering.',
            'Matched oncology patients will consent to trial invitations at rates exceeding 25%.'
          ],
          confidence: 'HIGH',
          status: 'partially_supported'
        },
        crossAgentAssessment: {
          agreements: [
            'All agents agree that clinical trial delay represents a massive, non-discretionary economic pain point.',
            'All agents agree that enterprise healthcare procurement requires substantial upfront compliance overhead.'
          ],
          disagreements: [
            {
              topic: 'Automated FHIR Parsing vs Unstructured Pathology Realities',
              researchPosition: 'Identifies robust demand for automated patient phenotyping across oncology trials.',
              businessPosition: 'Models 78% software gross margin based on automated API ingestion.',
              redTeamPosition: 'Demonstrates that 70% of crucial exclusion criteria is locked in unstructured scanned PDF pathology reports.',
              evidence: 'Tufts CSDD report & ASCO oncology informatics benchmark studies.',
              sourceIds: ['src_01', 'src_02'],
              judgeInterpretation: 'Pure automation will trigger unacceptable false positives; a hybrid nurse-in-the-loop audit is required during early pilots to safeguard CRO trust.',
              confidence: 'HIGH'
            }
          ],
          contradictions: [
            'Deployment Speed: Business model assumes 14-day clinic onboarding, whereas empirical healthcare compliance benchmarks require 60-90 days.'
          ],
          unsupportedClaims: [
            'Claim that automated EHR extraction achieves 100% precision without human clinical oversight.'
          ],
          missingInformation: [
            'Empirical patient consent rate on automated SMS/portal trial notifications.',
            'Nurse review time required per 100 candidate matches.'
          ]
        },
        strongestSupportingEvidence: [
          'High economic urgency: Daily trial delay costs between $600k and $8M.',
          'Over 80% of trial sites miss recruitment timelines, creating immediate CRO buyer willingness to pay.'
        ],
        strongestContradictoryEvidence: [
          '42% false-positive rate on raw unformatted PDF pathology parsing without human curation.',
          '60-90 day enterprise IT security review cycles delay initial recurring revenue recognition.'
        ],
        criticalUnknowns: [
          {
            id: 'unk_jr_01',
            statement: 'Nurse-in-the-loop curation cost per eligible patient profile card.',
            whyItMatters: 'Governs whether 78% gross margin target is achievable.',
            currentEvidence: 'Currently unverified; estimated at $5 per card based on 6-minute triage benchmark.',
            sourceIds: ['src_01'],
            confidence: 'HIGH',
            impact: 'HIGH',
            validationMethod: 'Simulate 50 patient record reviews with a certified oncology research nurse.',
            decisionChangePotential: 'If nurse review exceeds 15 minutes ($18/card), pricing model must be revised.'
          },
          {
            id: 'unk_jr_02',
            statement: 'Hospital site Principal Investigator (PI) cooperation rate for third-party automated alerts.',
            whyItMatters: 'If PIs block patient outreach, signed sponsor agreements will yield zero activated enrollments.',
            currentEvidence: 'Preliminary interviews indicate sensitivity around patient relationship ownership.',
            sourceIds: ['src_02'],
            confidence: 'MEDIUM',
            impact: 'HIGH',
            validationMethod: 'Conduct 5 deep-dive interviews with community oncology PIs.',
            decisionChangePotential: 'May require building a co-investigator credit and portal feature.'
          }
        ],
        criticalAssumptions: [
          'Clinic sites will grant EHR database connectivity within acceptable compliance timelines.',
          'Patients matched via automated screening will respond positively to clinic-endorsed trial invitations.'
        ],
        criticalRisks: [
          'High false-positive rate causing CRO trial sponsors to cancel pilot contracts.',
          'Incumbent EHR vendors introducing native trial matching plugins within their app marketplaces.'
        ],
        decisionChangingEvidence: [
          {
            id: 'dce_jr_01',
            evidenceNeeded: 'At least 2 commercial CRO trial sponsors sign binding paid pilot contracts ($25k+) after reviewing retrospective accuracy audit.',
            currentStatus: 'Unvalidated',
            expectedImpact: 'Upgrades recommendation from VALIDATE FIRST to BUILD.',
            validationMethod: 'Execute retrospective match audit on 50 historical trial profiles with 2 CRO directors.'
          }
        ],
        recommendationRationale: {
          recommendation: 'VALIDATE FIRST',
          confidence: 'HIGH',
          primaryReasons: [
            'Validated, high-urgency market demand is offset by technical risk in unstructured PDF pathology notes.',
            'Nurse-in-the-loop pilot simulation can eliminate fatal accuracy risks in 2 weeks for <$5,000.',
            'Pre-empting hospital IT lag by targeting private clinical research networks preserves seed runway.'
          ],
          strongestSupportingEvidence: ['Tufts CSDD $600k-$8M daily delay cost benchmark.'],
          strongestContradictoryEvidence: ['42% false-positive rate in automated pathology parsing without curation.'],
          criticalUnknowns: ['Nurse curation unit cost per patient card.'],
          decisionChangingEvidence: ['2 signed paid CRO pilot LOIs.']
        },
        nextActions: [
          {
            id: 'na_01',
            ventureId: seedId,
            stepNumber: 1,
            title: 'Manual Pathology Record Extraction Spike',
            description: 'Run automated parser on 50 de-identified oncology PDF notes and compare extracted biomarker criteria against oncologist annotations.',
            purpose: 'Determine true false-positive rate and tune algorithm for oncology inclusion criteria.',
            validationTarget: 'Precision >= 90% and Recall >= 85% across 50 benchmark cases.',
            relatedUnknownIds: ['unk_jr_01'],
            priority: 'IMMEDIATE',
            expectedDecisionImpact: 'Confirms algorithm accuracy meets CRO safety baseline.',
            actionType: 'TECH_SPIKE',
            hypothesisToTest: 'Our NLP parser can extract inclusion criteria from 50 de-identified oncology PDF notes with >90% precision compared to a certified clinical research coordinator.',
            passFailMetric: 'Precision >= 90% and Recall >= 85% across 50 benchmark cases.',
            estimatedDays: 7,
            completed: false
          },
          {
            id: 'na_02',
            ventureId: seedId,
            stepNumber: 2,
            title: 'CRO Pilot Letter of Intent (LOI) Campaign',
            description: 'Engage 15 mid-sized CRO clinical operations directors with retrospective accuracy data to secure pilot test commitments.',
            purpose: 'Validate commercial willingness to pay prior to completing production integrations.',
            validationTarget: '2 signed LOIs secured from 15 target outreach conversations.',
            relatedUnknownIds: ['unk_jr_02'],
            priority: 'HIGH',
            expectedDecisionImpact: 'Establishes commercial demand and pilot revenue commitment.',
            actionType: 'CUSTOMER_DISCOVERY',
            hypothesisToTest: 'At least 2 mid-sized CRO clinical operations directors will sign an unpriced LOI to test patient matching on an upcoming Phase II study.',
            passFailMetric: '2 signed LOIs secured from 15 target outreach conversations.',
            estimatedDays: 14,
            completed: false
          },
          {
            id: 'na_03',
            ventureId: seedId,
            stepNumber: 3,
            title: 'Nurse-in-the-Loop Workflow Simulation',
            description: 'Measure time and cost for a licensed triage nurse to verify 50 AI-generated candidate match cards.',
            purpose: 'Validate unit economics and human curation feasibility.',
            validationTarget: 'Verification time <= 6 min/patient ($5 unit cost) with 100% adherence to trial exclusion criteria.',
            relatedUnknownIds: ['unk_jr_01'],
            priority: 'HIGH',
            expectedDecisionImpact: 'Verifies 78% gross margin viability.',
            actionType: 'UNIT_ECONOMICS_AUDIT',
            hypothesisToTest: 'A licensed triage nurse can verify AI-extracted patient eligibility cards in under 6 minutes per candidate ($5 unit cost).',
            passFailMetric: 'Verification time <= 6 min/patient with 100% adherence to trial exclusion criteria.',
            estimatedDays: 5,
            completed: false
          }
        ],
        evidenceTraceability: [
          {
            id: 'tr_01',
            conclusion: 'Massive economic demand for accelerated patient recruitment is empirically supported.',
            findingIds: ['rf_01', 'rf_02'],
            sourceIds: ['src_01', 'src_02'],
            evidenceLevel: 'INDEPENDENT_SECONDARY',
            status: 'SUPPORTED',
            notes: 'Verified by Tufts CSDD and NIH recruitment benchmarks.'
          },
          {
            id: 'tr_02',
            conclusion: 'Zero-shot automated EHR parsing without human nurse review produces unacceptable false-positive rates.',
            findingIds: ['rtf_01'],
            sourceIds: ['src_01'],
            evidenceLevel: 'INDEPENDENT_SECONDARY',
            status: 'SUPPORTED',
            notes: 'Cross-validated against ASCO clinical informatics failure rates.'
          }
        ],
        sourceReferences: [
          {
            id: 'src_01',
            title: 'Tufts Center for the Study of Drug Development Impact Report',
            publisher: 'Tufts CSDD',
            publishYear: 2024,
            relevanceScore: 0.95,
            reliabilityTier: 'INDUSTRY_REPORT',
            extractedFact: 'Average daily cost of a delayed Phase III trial ranges between $600k and $8M in lost patent exclusivity.'
          },
          {
            id: 'src_02',
            title: 'National Institutes of Health (NIH) Clinical Center Recruitment Benchmarks',
            publisher: 'NIH Clinical Center',
            publishYear: 2023,
            relevanceScore: 0.92,
            reliabilityTier: 'PRIMARY',
            extractedFact: 'Over 80% of clinical research sites fail to meet recruitment targets within the original timeline.'
          }
        ],
        tradeoffMatrix: [
          {
            dimension: 'Market Need vs Integration Friction',
            bullCase: 'Trial delay costs are so extreme that sponsors will pay top dollar for any solution that shaves 6 months off recruitment.',
            bearCase: 'Hospital compliance hurdles will stall deployments until startup runs out of runway.',
            judgeVerdict: 'Focus exclusively on non-academic private research sites first to bypass hospital board delays.'
          },
          {
            dimension: 'Pure AI Automation vs Human-in-the-Loop',
            bullCase: 'Pure algorithmic parsing yields scalable 80%+ software margins.',
            bearCase: 'False positives in clinical criteria destroy clinical sponsor trust permanently.',
            judgeVerdict: 'Implement human nurse validation on all AI-matched candidates before presenting to clinical sites.'
          }
        ],
        synthesis: 'MediSync attacks a genuine, high-dollar pain point with strong macroeconomic tailwinds. However, its core vulnerability is data extraction reliability from unstructured clinic records. Proceed with validation.',
        uncertaintyNotice: 'Evidence indicates massive pharma willingness to pay, but EHR access velocity remains unproven in early trials.',
        keyDivergences: [
          'Research asserts large market tailwinds, while Red Team warns unstructured PDF pathology notes will cause high false-positive rates.',
          'Business model assumes rapid CRO adoption, but Red Team correctly flags Principal Investigator site gatekeeping.'
        ]
      },
      score: {
        id: 'scr_01',
        ventureId: seedId,
        calculatedAt: '2026-08-16T15:08:00.000Z',
        totalScore: 78,
        dimensions: {
          marketProblemUrgency: {
            score: 23,
            reasoning: 'Exceptional willingness to pay and quantifiable ROI for pharmaceutical trial sponsors.',
            deductions: ['-2 pts: Target market restricted to oncology/rare disease subsegments initially.']
          },
          businessModelViability: {
            score: 20,
            reasoning: 'Strong gross margin potential and clear enterprise pricing power.',
            deductions: ['-5 pts: Extended enterprise sales cycles (6-9 months) require higher upfront capital.']
          },
          defensibilityMoat: {
            score: 18,
            reasoning: 'Data lock-in and clinical site network effects build over time.',
            deductions: ['-7 pts: Early stages vulnerable to EHR vendor direct competition or API policy changes.']
          },
          executionRisk: {
            score: 17,
            reasoning: 'Regulatory compliance is complex but manageable via certified hosting and middleware.',
            deductions: ['-8 pts: Severe penalty for Red Team unstructured pathology false-positive risk.']
          }
        },
        recommendationTier: 'MODERATE_READINESS'
      },
      nextActions: [
        {
          id: 'na_01',
          ventureId: seedId,
          stepNumber: 1,
          title: 'Manual Pathology Record Extraction Spike',
          description: 'Run automated parser on 50 de-identified oncology PDF notes and compare extracted biomarker criteria against oncologist annotations.',
          purpose: 'Determine true false-positive rate and tune algorithm for oncology inclusion criteria.',
          validationTarget: 'Precision >= 90% and Recall >= 85% across 50 benchmark cases.',
          priority: 'IMMEDIATE',
          expectedDecisionImpact: 'Confirms algorithm accuracy meets CRO safety baseline.',
          actionType: 'TECH_SPIKE',
          hypothesisToTest: 'Our NLP parser can extract inclusion criteria from 50 de-identified oncology PDF notes with >90% precision compared to a certified clinical research coordinator.',
          passFailMetric: 'Precision >= 90% and Recall >= 85% across 50 benchmark cases.',
          estimatedDays: 7,
          completed: false
        },
        {
          id: 'na_02',
          ventureId: seedId,
          stepNumber: 2,
          title: 'CRO Pilot Letter of Intent (LOI) Campaign',
          description: 'Engage 15 mid-sized CRO clinical operations directors with retrospective accuracy data to secure pilot test commitments.',
          purpose: 'Validate commercial willingness to pay prior to completing production integrations.',
          validationTarget: '2 signed LOIs secured from 15 target outreach conversations.',
          priority: 'HIGH',
          expectedDecisionImpact: 'Establishes commercial demand and pilot revenue commitment.',
          actionType: 'CUSTOMER_DISCOVERY',
          hypothesisToTest: 'At least 2 mid-sized CRO clinical operations directors will sign an unpriced LOI to test patient matching on an upcoming Phase II study.',
          passFailMetric: '2 signed LOIs secured from 15 target outreach conversations.',
          estimatedDays: 14,
          completed: false
        },
        {
          id: 'na_03',
          ventureId: seedId,
          stepNumber: 3,
          title: 'Nurse-in-the-Loop Workflow Simulation',
          description: 'Measure time and cost for a licensed triage nurse to verify 50 AI-generated candidate match cards.',
          purpose: 'Validate unit economics and human curation feasibility.',
          validationTarget: 'Verification time <= 6 min/patient ($5 unit cost) with 100% adherence to trial exclusion criteria.',
          priority: 'HIGH',
          expectedDecisionImpact: 'Verifies 78% gross margin viability.',
          actionType: 'UNIT_ECONOMICS_AUDIT',
          hypothesisToTest: 'A licensed triage nurse can verify AI-extracted patient eligibility cards in under 6 minutes per candidate ($5 unit cost).',
          passFailMetric: 'Verification time <= 6 min/patient with 100% adherence to trial exclusion criteria.',
          estimatedDays: 5,
          completed: false
        }
      ],
      decision: {
        id: 'dec_01',
        ventureId: seedId,
        choice: 'PROCEED',
        rationale: 'Market need is verified and ROI is overwhelming. We will implement the Nurse-in-the-Loop safeguard to neutralize the Red Team pathology accuracy risk before initiating hospital pilot outreach.',
        alignmentWithAI: 'ALIGNED',
        decidedAt: '2026-08-16T15:10:00.000Z'
      }
    };

    this.ventures.set(seedId, sampleVenture);
    if (sampleVenture.businessReport) {
      this.businessReports.set(seedId, sampleVenture.businessReport);
      for (const a of sampleVenture.businessReport.businessAssumptions || []) {
        this.businessAssumptions.set(a.id, { ...a, ventureId: seedId, reportId: sampleVenture.businessReport.id });
      }
      for (const r of sampleVenture.businessReport.businessRisks || []) {
        this.businessRisks.set(r.id, { ...r, ventureId: seedId, reportId: sampleVenture.businessReport.id });
      }
    }
    if (sampleVenture.redTeamReport) {
      this.redTeamReports.set(seedId, sampleVenture.redTeamReport);
      for (const c of sampleVenture.redTeamReport.challengedClaims || []) {
        this.challengedClaims.set(c.id, { ...c, ventureId: seedId, reportId: sampleVenture.redTeamReport.id });
      }
      for (const r of sampleVenture.redTeamReport.criticalRisks || []) {
        this.redTeamRisks.set(r.id, { ...r, ventureId: seedId, reportId: sampleVenture.redTeamReport.id });
      }
      for (const a of sampleVenture.redTeamReport.assumptionAttacks || []) {
        this.assumptionAttacks.set(a.id, { ...a, ventureId: seedId, reportId: sampleVenture.redTeamReport.id });
      }
      for (const ct of sampleVenture.redTeamReport.contradictions || []) {
        this.contradictions.set(ct.id, { ...ct, ventureId: seedId, reportId: sampleVenture.redTeamReport.id });
      }
      for (const th of sampleVenture.redTeamReport.competitiveThreats || []) {
        this.competitiveThreats.set(th.id, { ...th, ventureId: seedId, reportId: sampleVenture.redTeamReport.id });
      }
      for (const fc of sampleVenture.redTeamReport.failureConditions || []) {
        this.failureConditions.set(fc.id, { ...fc, ventureId: seedId, reportId: sampleVenture.redTeamReport.id });
      }
      for (const de of sampleVenture.redTeamReport.decisionChangingEvidence || []) {
        this.decisionChangingEvidence.set(de.id, { ...de, ventureId: seedId, reportId: sampleVenture.redTeamReport.id });
      }
    }
  }
}

class DelegatingVentureRepository implements IVentureRepository {
  private inMemoryRepo = new InMemoryVentureRepository();
  private supabaseRepo: IVentureRepository | null = null;
  private supabaseDisabled = false;

  private getActiveRepo(): IVentureRepository {
    if (isSupabaseConfigured() && !this.supabaseDisabled) {
      if (!this.supabaseRepo) {
        try {
          this.supabaseRepo = new SupabaseVentureRepository();
        } catch (e) {
          console.warn('[Repository] Supabase repository initialization failed, using in-memory fallback:', e);
          this.supabaseDisabled = true;
          return this.inMemoryRepo;
        }
      }
      return this.supabaseRepo || this.inMemoryRepo;
    }
    return this.inMemoryRepo;
  }

  private async execute<T>(
    operation: (repo: IVentureRepository) => Promise<T>
  ): Promise<T> {
    const active = this.getActiveRepo();
    if (active === this.inMemoryRepo) {
      return operation(this.inMemoryRepo);
    }
    try {
      return await operation(active);
    } catch (err: any) {
      if (isSchemaMissingError(err) || err?.message === 'SCHEMA_NOT_INITIALIZED') {
        this.supabaseDisabled = true;
        return operation(this.inMemoryRepo);
      }
      throw err;
    }
  }

  async findAll(): Promise<Venture[]> {
    return this.execute(r => r.findAll());
  }

  async findById(id: string): Promise<Venture | null> {
    return this.execute(r => r.findById(id));
  }

  async create(ventureData: Partial<Venture>): Promise<Venture> {
    return this.execute(r => r.create(ventureData));
  }

  async update(id: string, updates: Partial<Venture>): Promise<Venture | null> {
    return this.execute(r => r.update(id, updates));
  }

  async delete(id: string): Promise<boolean> {
    return this.execute(r => r.delete(id));
  }

  async saveQuestions(ventureId: string, questions: CriticalQuestion[]): Promise<CriticalQuestion[]> {
    return this.execute(r => r.saveQuestions(ventureId, questions));
  }

  async updateQuestionAnswer(ventureId: string, questionId: string, answer: string): Promise<CriticalQuestion | null> {
    return this.execute(r => r.updateQuestionAnswer(ventureId, questionId, answer));
  }

  async skipQuestion(ventureId: string, questionId: string): Promise<CriticalQuestion | null> {
    return this.execute(r => r.skipQuestion(ventureId, questionId));
  }

  async saveResearchReport(ventureId: string, report: ResearchReport): Promise<ResearchReport> {
    return this.execute(r => r.saveResearchReport(ventureId, report));
  }

  async getResearchReport(ventureId: string): Promise<ResearchReport | null> {
    return this.execute(r => r.getResearchReport(ventureId));
  }

  async getResearchFindings(ventureId: string, filter?: { evidenceType?: string; category?: string; confidence?: string }): Promise<ResearchFinding[]> {
    return this.execute(r => r.getResearchFindings(ventureId, filter));
  }

  async getSources(ventureId: string, filter?: { reliabilityTier?: string; credibility?: string }): Promise<Source[]> {
    return this.execute(r => r.getSources(ventureId, filter));
  }

  async saveBusinessReport(ventureId: string, report: BusinessReport): Promise<BusinessReport> {
    return this.execute(r => r.saveBusinessReport(ventureId, report));
  }

  async getBusinessReport(ventureId: string): Promise<BusinessReport | null> {
    return this.execute(r => r.getBusinessReport(ventureId));
  }

  async getBusinessAssumptions(ventureId: string, filter?: { category?: string; importance?: string; evidenceStatus?: string }): Promise<BusinessAssumption[]> {
    return this.execute(r => r.getBusinessAssumptions(ventureId, filter));
  }

  async getBusinessRisks(ventureId: string, filter?: { probability?: string; impact?: string }): Promise<BusinessRisk[]> {
    return this.execute(r => r.getBusinessRisks(ventureId, filter));
  }

  async saveRedTeamReport(ventureId: string, report: RedTeamReport): Promise<RedTeamReport> {
    return this.execute(r => r.saveRedTeamReport(ventureId, report));
  }

  async getRedTeamReport(ventureId: string): Promise<RedTeamReport | null> {
    return this.execute(r => r.getRedTeamReport(ventureId));
  }

  async getRedTeamClaims(ventureId: string, filter?: { evidenceStatus?: string; severity?: string; confidence?: string }): Promise<ChallengedClaim[]> {
    return this.execute(r => r.getRedTeamClaims(ventureId, filter));
  }

  async getRedTeamRisks(ventureId: string, filter?: { category?: string; severity?: string; riskType?: string; evidenceStatus?: string }): Promise<RedTeamRisk[]> {
    return this.execute(r => r.getRedTeamRisks(ventureId, filter));
  }

  async getRedTeamAssumptions(ventureId: string, filter?: { importance?: string; evidenceStatus?: string }): Promise<AssumptionAttack[]> {
    return this.execute(r => r.getRedTeamAssumptions(ventureId, filter));
  }

  async getRedTeamContradictions(ventureId: string, filter?: { severity?: string; evidenceStatus?: string }): Promise<Contradiction[]> {
    return this.execute(r => r.getRedTeamContradictions(ventureId, filter));
  }

  async getRedTeamThreats(ventureId: string, filter?: { threatType?: string; differentiationStatus?: string }): Promise<CompetitiveThreat[]> {
    return this.execute(r => r.getRedTeamThreats(ventureId, filter));
  }

  async getRedTeamFailureConditions(ventureId: string, filter?: { severity?: string; confidence?: string }): Promise<FailureCondition[]> {
    return this.execute(r => r.getRedTeamFailureConditions(ventureId, filter));
  }

  async getRedTeamDecisionEvidence(ventureId: string, filter?: { direction?: string; importance?: string }): Promise<DecisionChangingEvidence[]> {
    return this.execute(r => r.getRedTeamDecisionEvidence(ventureId, filter));
  }

  async saveJudgeReport(ventureId: string, report: JudgeReport): Promise<JudgeReport> {
    return this.execute(r => r.saveJudgeReport(ventureId, report));
  }

  async getJudgeReport(ventureId: string): Promise<JudgeReport | null> {
    return this.execute(r => r.getJudgeReport(ventureId));
  }

  async getJudgeThesis(ventureId: string): Promise<CoreVentureThesis | null> {
    return this.execute(r => r.getJudgeThesis(ventureId));
  }

  async getJudgeCrossAgentAssessment(ventureId: string): Promise<CrossAgentAssessment | null> {
    return this.execute(r => r.getJudgeCrossAgentAssessment(ventureId));
  }

  async getJudgeCriticalUnknowns(ventureId: string, filter?: { impact?: string; confidence?: string }): Promise<DecisionCriticalUncertainty[]> {
    return this.execute(r => r.getJudgeCriticalUnknowns(ventureId, filter));
  }

  async getJudgeDecisionEvidence(ventureId: string): Promise<JudgeDecisionChangingEvidence[]> {
    return this.execute(r => r.getJudgeDecisionEvidence(ventureId));
  }

  async getJudgeNextActions(ventureId: string): Promise<NextAction[]> {
    return this.execute(r => r.getJudgeNextActions(ventureId));
  }

  async getJudgeEvidenceTraceability(ventureId: string, filter?: { status?: string; evidenceLevel?: string }): Promise<EvidenceTraceability[]> {
    return this.execute(r => r.getJudgeEvidenceTraceability(ventureId, filter));
  }

  async saveVentureScore(ventureId: string, score: VentureScore): Promise<VentureScore> {
    return this.execute(r => r.saveVentureScore(ventureId, score));
  }

  async saveNextActions(ventureId: string, actions: NextAction[]): Promise<NextAction[]> {
    return this.execute(r => r.saveNextActions(ventureId, actions));
  }

  async toggleActionCompletion(ventureId: string, actionId: string): Promise<NextAction | null> {
    return this.execute(r => r.toggleActionCompletion(ventureId, actionId));
  }

  async saveDecision(ventureId: string, decision: Decision): Promise<Decision> {
    return this.execute(r => r.saveDecision(ventureId, decision));
  }
}

export const ventureRepository = new DelegatingVentureRepository();
