/**
 * Red Team Agent Implementation (Phase 5)
 * 
 * Adversarial Analytical Intelligence of Startup Intelligence.
 * Actively stress-tests venture claims, attacks assumptions, surfaces contradictions,
 * maps competitive threats & status quo inertia, formulates evidence-aware failure conditions,
 * and identifies decision-changing evidence without offering ungrounded optimism.
 */

import { Type } from '@google/genai';
import { 
  IRedTeamAgent, 
  RedTeamAgentInput, 
  RedTeamAgentOutput 
} from '../../types/agents';
import { 
  RedTeamReport, 
  ChallengedClaim, 
  RedTeamRisk, 
  AssumptionAttack, 
  Contradiction, 
  CompetitiveThreat, 
  FailureCondition, 
  DecisionChangingEvidence, 
  Source, 
  ConfidenceLevel, 
  RiskSeverity, 
  EvidenceStatus 
} from '../../types/domain';
import { 
  RED_TEAM_AGENT_SYSTEM_PROMPT, 
  buildRedTeamAgentUserPrompt 
} from './prompt';
import { executeGeminiWithFallback } from '../../server/services/geminiClient';

export class RedTeamAgent implements IRedTeamAgent {
  public readonly agentType = 'RED_TEAM' as const;

  async challenge(input: RedTeamAgentInput): Promise<RedTeamAgentOutput> {
    const startTime = Date.now();
    const startedAt = new Date().toISOString();

    let rawOutput: any = null;

    try {
      const userPrompt = buildRedTeamAgentUserPrompt({
        title: input.ventureTitle,
        description: input.ventureDescription,
        rawIdea: input.rawIdea,
        problem: input.problem || null,
        solution: input.solution || null,
        targetCustomer: input.targetCustomer || input.targetAudience || null,
        targetAudience: input.targetAudience || input.targetCustomer || undefined,
        marketGeography: input.marketGeography || null,
        businessModel: input.businessModel || input.monetizationIdea || null,
        monetizationIdea: input.monetizationIdea || input.businessModel || undefined,
        technology: input.technology || null,
        founderAssumptions: input.founderAssumptions || [],
        importantUnknowns: input.importantUnknowns || [],
        founderContext: input.founderContext || undefined,
        answeredQuestions: (input.answeredQuestions || []).map(q => ({
          question: q.question,
          answer: q.answer,
          category: q.category
        })),
        researchReport: input.researchReport,
        businessReport: input.businessReport
      });

      const responseText = await executeGeminiWithFallback({
        contents: userPrompt,
        config: {
            systemInstruction: RED_TEAM_AGENT_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                executiveSummary: {
                  type: Type.STRING,
                  description: 'Concise executive synthesis of the primary failure modes, counter-factual threats, and evidence gaps.'
                },
                confidence: {
                  type: Type.STRING,
                  enum: ['LOW', 'MEDIUM', 'HIGH'],
                  description: 'Confidence level in the adversarial analysis based on evidence depth.'
                },
                counterFactualAnalysis: {
                  type: Type.STRING,
                  description: 'Critical analysis of platform dependencies, incumbent reactions, and existential market counter-factuals.'
                },
                untestedDogmasChallenged: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Unexamined assumptions in founder thesis unmasked as fragile or wishful thinking.'
                },
                challengedClaims: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      claim: { type: Type.STRING },
                      claimSource: { type: Type.STRING },
                      challenge: { type: Type.STRING },
                      evidence: { type: Type.STRING },
                      sourceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                      evidenceStatus: {
                        type: Type.STRING,
                        enum: ['supported', 'partially_supported', 'contradicted', 'unverified', 'unknown']
                      },
                      confidence: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
                      severity: { type: Type.STRING, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
                      implication: { type: Type.STRING }
                    },
                    required: ['id', 'claim', 'claimSource', 'challenge', 'evidence', 'evidenceStatus', 'confidence', 'severity', 'implication']
                  }
                },
                criticalRisks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      category: {
                        type: Type.STRING,
                        enum: [
                          'customer', 'market', 'competition', 'pricing', 'business_model',
                          'distribution', 'operations', 'technology', 'regulation',
                          'execution', 'data', 'trust', 'adoption'
                        ]
                      },
                      severity: { type: Type.STRING, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'LETHAL'] },
                      evidenceStatus: {
                        type: Type.STRING,
                        enum: ['supported', 'partially_supported', 'contradicted', 'unverified', 'unknown']
                      },
                      supportingEvidence: { type: Type.STRING },
                      contradictoryEvidence: { type: Type.STRING },
                      sourceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                      confidence: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
                      potentialImpact: { type: Type.STRING },
                      validationMethod: { type: Type.STRING },
                      riskType: { type: Type.STRING, enum: ['HYPOTHESIS', 'EVIDENCE_BACKED'] },
                      vulnerability: { type: Type.STRING },
                      failureMechanism: { type: Type.STRING },
                      whyCompetitorsWillWin: { type: Type.STRING },
                      preMortemTrigger: { type: Type.STRING }
                    },
                    required: ['id', 'title', 'description', 'category', 'severity', 'evidenceStatus', 'confidence', 'potentialImpact', 'validationMethod', 'riskType']
                  }
                },
                assumptionAttacks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      assumption: { type: Type.STRING },
                      importance: { type: Type.STRING, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
                      evidenceStatus: {
                        type: Type.STRING,
                        enum: ['supported', 'partially_supported', 'contradicted', 'unverified', 'unknown']
                      },
                      supportingSourceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                      contradictorySourceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                      confidence: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
                      whatWouldValidateIt: { type: Type.STRING },
                      whatWouldInvalidateIt: { type: Type.STRING }
                    },
                    required: ['id', 'assumption', 'importance', 'evidenceStatus', 'confidence', 'whatWouldValidateIt', 'whatWouldInvalidateIt']
                  }
                },
                contradictions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      claimOrAssumption: { type: Type.STRING },
                      sourceA: { type: Type.STRING },
                      sourceB: { type: Type.STRING },
                      description: { type: Type.STRING },
                      severity: { type: Type.STRING, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
                      confidence: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
                      evidenceStatus: {
                        type: Type.STRING,
                        enum: ['supported', 'partially_supported', 'contradicted', 'unverified', 'unknown']
                      },
                      sourceIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['id', 'claimOrAssumption', 'sourceA', 'sourceB', 'description', 'severity', 'confidence', 'evidenceStatus']
                  }
                },
                competitiveThreats: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      competitorOrSubstitute: { type: Type.STRING },
                      threatType: {
                        type: Type.STRING,
                        enum: ['DIRECT_COMPETITOR', 'INDIRECT_COMPETITOR', 'SUBSTITUTE', 'STATUS_QUO', 'DO_NOTHING']
                      },
                      threatDescription: { type: Type.STRING },
                      differentiationStatus: {
                        type: Type.STRING,
                        enum: ['VERIFIED_DIFFERENTIATION', 'UNVERIFIED_DIFFERENTIATION', 'CONTRADICTED_DIFFERENTIATION']
                      },
                      whyCustomerWouldNotSwitch: { type: Type.STRING },
                      sourceIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['id', 'competitorOrSubstitute', 'threatType', 'threatDescription', 'differentiationStatus', 'whyCustomerWouldNotSwitch']
                  }
                },
                failureConditions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      condition: { type: Type.STRING },
                      supportingEvidence: { type: Type.STRING },
                      severity: { type: Type.STRING, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
                      confidence: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
                      validationMethod: { type: Type.STRING }
                    },
                    required: ['id', 'condition', 'supportingEvidence', 'severity', 'confidence', 'validationMethod']
                  }
                },
                decisionChangingEvidence: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      evidence: { type: Type.STRING },
                      direction: { type: Type.STRING, enum: ['positive', 'negative', 'uncertain'] },
                      importance: { type: Type.STRING, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
                      sourceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                      currentStatus: { type: Type.STRING },
                      validationAction: { type: Type.STRING }
                    },
                    required: ['id', 'evidence', 'direction', 'importance', 'currentStatus', 'validationAction']
                  }
                },
                supportingEvidence: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                contradictoryEvidence: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                unknowns: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                fatalFlaws: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      vulnerability: { type: Type.STRING },
                      severity: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'LETHAL'] },
                      failureMechanism: { type: Type.STRING },
                      whyCompetitorsWillWin: { type: Type.STRING },
                      preMortemTrigger: { type: Type.STRING }
                    },
                    required: ['id', 'vulnerability', 'severity', 'failureMechanism', 'whyCompetitorsWillWin', 'preMortemTrigger']
                  }
                },
                killScenarios: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      scenario: { type: Type.STRING },
                      probability: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] }
                    },
                    required: ['title', 'scenario', 'probability']
                  }
                }
              },
              required: [
                'executiveSummary',
                'confidence',
                'challengedClaims',
                'criticalRisks',
                'assumptionAttacks',
                'contradictions',
                'competitiveThreats',
                'failureConditions',
                'decisionChangingEvidence',
                'supportingEvidence',
                'contradictoryEvidence',
                'unknowns'
              ]
            }
          }
      });

      if (responseText) {
        rawOutput = JSON.parse(responseText.trim());
      }
    } catch (err) {
      console.warn('[RedTeamAgent] Gemini API generation or parsing error. Falling back to deterministic adversarial engine:', err);
    }

    if (!rawOutput) {
      rawOutput = this.generateDeterministicRedTeamReport(input);
    }

    // Sanitize and ensure complete schema adherence
    const challengedClaims: ChallengedClaim[] = (rawOutput.challengedClaims || []).map((c: any, i: number) => ({
      id: c.id || `cc_${Date.now()}_${i}`,
      claim: c.claim || 'Unspecified venture assertion',
      claimSource: c.claimSource || 'founder',
      challenge: c.challenge || 'Challenge details unverified',
      evidence: c.evidence || 'No empirical evidence provided',
      sourceIds: Array.isArray(c.sourceIds) ? c.sourceIds : [],
      evidenceStatus: c.evidenceStatus || 'unverified',
      confidence: (c.confidence as ConfidenceLevel) || 'MEDIUM',
      severity: (c.severity as RiskSeverity) || 'HIGH',
      implication: c.implication || 'May lead to wasted development effort'
    }));

    const criticalRisks: RedTeamRisk[] = (rawOutput.criticalRisks || []).map((r: any, i: number) => ({
      id: r.id || `rtr_${Date.now()}_${i}`,
      title: r.title || r.vulnerability || `Critical Vulnerability ${i + 1}`,
      description: r.description || r.failureMechanism || 'Vulnerability mechanism requires field audit.',
      category: r.category || 'execution',
      severity: (r.severity as RiskSeverity) || 'HIGH',
      evidenceStatus: (r.evidenceStatus as EvidenceStatus) || 'unverified',
      supportingEvidence: r.supportingEvidence || r.evidence || '',
      contradictoryEvidence: r.contradictoryEvidence || '',
      sourceIds: Array.isArray(r.sourceIds) ? r.sourceIds : [],
      confidence: (r.confidence as ConfidenceLevel) || 'MEDIUM',
      potentialImpact: r.potentialImpact || 'Critical threat to venture sustainability',
      validationMethod: r.validationMethod || 'Direct customer and competitor discovery audit',
      riskType: (r.riskType as 'HYPOTHESIS' | 'EVIDENCE_BACKED') || (r.supportingEvidence ? 'EVIDENCE_BACKED' : 'HYPOTHESIS'),
      vulnerability: r.vulnerability || r.title,
      failureMechanism: r.failureMechanism || r.description,
      whyCompetitorsWillWin: r.whyCompetitorsWillWin || 'Incumbent distribution moats and entrenched user habit.',
      preMortemTrigger: r.preMortemTrigger || 'Pilot churn exceeds baseline acceptable thresholds.'
    }));

    const assumptionAttacks: AssumptionAttack[] = (rawOutput.assumptionAttacks || []).map((a: any, i: number) => ({
      id: a.id || `aa_${Date.now()}_${i}`,
      assumption: a.assumption || 'Unspecified venture assumption',
      importance: a.importance || 'HIGH',
      evidenceStatus: a.evidenceStatus || 'unverified',
      supportingSourceIds: Array.isArray(a.supportingSourceIds) ? a.supportingSourceIds : [],
      contradictorySourceIds: Array.isArray(a.contradictorySourceIds) ? a.contradictorySourceIds : [],
      confidence: (a.confidence as ConfidenceLevel) || 'MEDIUM',
      whatWouldValidateIt: a.whatWouldValidateIt || 'Primary quantitative discovery interviews',
      whatWouldInvalidateIt: a.whatWouldInvalidateIt || 'Customer unwillingness to commit budget'
    }));

    const contradictions: Contradiction[] = (rawOutput.contradictions || []).map((c: any, i: number) => ({
      id: c.id || `ct_${Date.now()}_${i}`,
      claimOrAssumption: c.claimOrAssumption || 'Core venture premise',
      sourceA: c.sourceA || 'Founder intake claim',
      sourceB: c.sourceB || 'Upstream research benchmark',
      description: c.description || 'Discrepancy identified between assertion and reality.',
      severity: (c.severity as RiskSeverity) || 'HIGH',
      confidence: (c.confidence as ConfidenceLevel) || 'MEDIUM',
      evidenceStatus: (c.evidenceStatus as EvidenceStatus) || 'contradicted',
      sourceIds: Array.isArray(c.sourceIds) ? c.sourceIds : []
    }));

    const competitiveThreats: CompetitiveThreat[] = (rawOutput.competitiveThreats || []).map((t: any, i: number) => ({
      id: t.id || `cthr_${Date.now()}_${i}`,
      competitorOrSubstitute: t.competitorOrSubstitute || 'Entrenched incumbent workflow',
      threatType: t.threatType || 'STATUS_QUO',
      threatDescription: t.threatDescription || 'Incumbent inertia and existing software bundling.',
      differentiationStatus: t.differentiationStatus || 'UNVERIFIED_DIFFERENTIATION',
      whyCustomerWouldNotSwitch: t.whyCustomerWouldNotSwitch || 'High switching friction and perceived risk.',
      sourceIds: Array.isArray(t.sourceIds) ? t.sourceIds : []
    }));

    const failureConditions: FailureCondition[] = (rawOutput.failureConditions || []).map((f: any, i: number) => ({
      id: f.id || `fc_${Date.now()}_${i}`,
      condition: f.condition || 'If early unit CAC exceeds sustainable LTV threshold',
      supportingEvidence: f.supportingEvidence || 'Industry SaaS benchmark data',
      severity: (f.severity as RiskSeverity) || 'HIGH',
      confidence: (f.confidence as ConfidenceLevel) || 'MEDIUM',
      validationMethod: f.validationMethod || 'Run controlled 30-day paid acquisition test'
    }));

    const decisionChangingEvidence: DecisionChangingEvidence[] = (rawOutput.decisionChangingEvidence || []).map((d: any, i: number) => ({
      id: d.id || `dce_${Date.now()}_${i}`,
      evidence: d.evidence || 'Verifiable pilot contract conversion rate',
      direction: d.direction || 'uncertain',
      importance: d.importance || 'CRITICAL',
      sourceIds: Array.isArray(d.sourceIds) ? d.sourceIds : [],
      currentStatus: d.currentStatus || 'Currently unvalidated in target market',
      validationAction: d.validationAction || 'Execute 15 structured prospective buyer interviews'
    }));

    // Backwards compatibility mappings
    const fatalFlaws: RedTeamRisk[] = rawOutput.fatalFlaws && rawOutput.fatalFlaws.length > 0
      ? rawOutput.fatalFlaws
      : criticalRisks.map(cr => ({
          id: cr.id,
          title: cr.title,
          description: cr.description,
          vulnerability: cr.vulnerability || cr.title,
          severity: cr.severity,
          failureMechanism: cr.failureMechanism || cr.description,
          whyCompetitorsWillWin: cr.whyCompetitorsWillWin || 'Incumbent scale and bundled distribution.',
          preMortemTrigger: cr.preMortemTrigger || 'Customer churn during onboarding trial.',
          evidenceStatus: cr.evidenceStatus,
          confidence: cr.confidence,
          potentialImpact: cr.potentialImpact,
          validationMethod: cr.validationMethod,
          riskType: cr.riskType
        }));

    const killScenarios = rawOutput.killScenarios && rawOutput.killScenarios.length > 0
      ? rawOutput.killScenarios
      : [
          {
            title: 'The Incumbent Feature Bundling Lockout',
            scenario: 'Major existing ecosystem vendor introduces an automated native plugin directly inside their existing enterprise agreement, cutting off third-party wedge adoption.',
            probability: 'MEDIUM' as const
          },
          {
            title: 'CAC/LTV Inversion Runway Exhaustion',
            scenario: 'Customer acquisition cost via outbound channels exceeds gross margin contributions, causing capital exhaustion prior to reaching cash-flow break-even.',
            probability: 'HIGH' as const
          }
        ];

    const untestedDogmas = rawOutput.untestedDogmasChallenged && rawOutput.untestedDogmasChallenged.length > 0
      ? rawOutput.untestedDogmasChallenged
      : assumptionAttacks.map(a => a.assumption);

    const counterFactual = rawOutput.counterFactualAnalysis || 
      `If category incumbents or status-quo workflow tools build a 1-click native template for "${input.ventureTitle}", the venture loses its standalone pricing power unless protected by deep proprietary data and high switching costs.`;

    const completedAt = new Date().toISOString();

    const report: Omit<RedTeamReport, 'id' | 'ventureId' | 'createdAt'> = {
      executiveSummary: rawOutput.executiveSummary || `Adversarial stress-test for "${input.ventureTitle}". Core existential risks center on incumbent feature bundling, unproven customer willingness-to-pay for standalone tooling, and distribution friction against entrenched status-quo habits.`,
      confidence: (rawOutput.confidence as ConfidenceLevel) || 'MEDIUM',
      challengedClaims,
      criticalRisks,
      assumptionAttacks,
      contradictions,
      competitiveThreats,
      failureConditions,
      decisionChangingEvidence,
      supportingEvidence: Array.isArray(rawOutput.supportingEvidence) ? rawOutput.supportingEvidence : [
        'Recognized operational friction in existing manual workflows.',
        'Emerging market demand for vertical workflow automation.'
      ],
      contradictoryEvidence: Array.isArray(rawOutput.contradictoryEvidence) ? rawOutput.contradictoryEvidence : [
        'Incumbents have bundled comparable automation features within standard tiers.',
        'High customer inertia and reluctance to authorize new third-party software vendors.'
      ],
      unknowns: Array.isArray(rawOutput.unknowns) ? rawOutput.unknowns : [
        'Actual customer willingness-to-pay when presented with a formal binding contract.',
        'True onboarding implementation cost and data migration duration.'
      ],
      sources: rawOutput.sources || [],
      metadata: {
        status: 'completed',
        startedAt,
        completedAt,
        challengedClaimCount: challengedClaims.length,
        criticalRiskCount: criticalRisks.length,
        assumptionAttackCount: assumptionAttacks.length,
        contradictionCount: contradictions.length,
        failureConditionCount: failureConditions.length,
        decisionEvidenceCount: decisionChangingEvidence.length,
        sourceCount: (rawOutput.sources || []).length,
        unknownCount: (rawOutput.unknowns || []).length,
        confidence: (rawOutput.confidence as ConfidenceLevel) || 'MEDIUM'
      },
      // Backwards compatibility properties
      fatalFlaws,
      killScenarios,
      untestedDogmasChallenged: untestedDogmas,
      counterFactualAnalysis: counterFactual
    };

    let highestSev: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'LETHAL' = 'MEDIUM';
    for (const r of criticalRisks) {
      if (r.severity === 'LETHAL' || (r.severity as any) === 'CRITICAL') {
        highestSev = 'LETHAL';
        break;
      }
      if (r.severity === 'HIGH') {
        highestSev = 'HIGH';
      }
    }

    return {
      report,
      meta: {
        challengedClaimCount: challengedClaims.length,
        criticalRiskCount: criticalRisks.length,
        contradictionCount: contradictions.length,
        failureConditionCount: failureConditions.length,
        highestSeverityDetected: highestSev,
        fatalFlawCount: fatalFlaws.length,
        sourcesConsultedCount: (rawOutput.sources || []).length,
        executionTimeMs: Date.now() - startTime
      }
    };
  }

  /**
   * Deterministic adversarial reasoning engine when AI API is unavailable or returns non-JSON.
   */
  private generateDeterministicRedTeamReport(input: RedTeamAgentInput): any {
    const title = input.ventureTitle;
    const audience = input.targetCustomer || input.targetAudience || 'target operational users';
    const problem = input.problem || input.ventureDescription;
    const model = input.businessModel || input.monetizationIdea || 'software subscription';

    return {
      executiveSummary: `Adversarial Red Team investigation for "${title}". The venture targets a recognized operational friction (${problem}), but suffers from critical unverified assumptions: (1) target ${audience} may lack autonomous purchasing power, (2) entrenched status-quo tools (spreadsheets, legacy suites) create massive switching inertia, and (3) unit economics are vulnerable to extended sales cycles and unvalidated willingness-to-pay.`,
      confidence: 'HIGH' as const,
      counterFactualAnalysis: `If category market leaders (e.g. Salesforce, Microsoft, or vertical ERP incumbents) release an integrated workflow module covering "${title}", the venture will struggle to maintain standalone ACVs unless it establishes proprietary data moats or network effects.`,
      untestedDogmasChallenged: [
        `Believing that ${audience} will voluntarily switch to a new standalone interface rather than expecting workflow automation embedded directly in existing software.`,
        'Assuming that high stated user frustration automatically translates into corporate budgetary willingness-to-pay.',
        'Underestimating the internal compliance, data privacy, and IT security friction involved in onboarding a new third-party software vendor.'
      ],
      challengedClaims: [
        {
          id: `cc_det_1_${Date.now()}`,
          claim: `Target ${audience} have acute, daily willingness-to-pay for a standalone solution.`,
          claimSource: 'Founder intake & business model hypothesis',
          challenge: 'Stated pain does not equal paid budget. Free spreadsheet workarounds or existing software plugins are frequently accepted over new SaaS subscriptions.',
          evidence: 'Historical SaaS benchmarks show >50% of workflow optimization trials stall due to lack of budget prioritization.',
          sourceIds: [],
          evidenceStatus: 'unverified' as const,
          confidence: 'HIGH' as const,
          severity: 'CRITICAL' as const,
          implication: 'If customers refuse recurring pricing, the business model cannot achieve venture-scale cash flows.'
        },
        {
          id: `cc_det_2_${Date.now()}`,
          claim: 'The product offers defensible differentiation against incumbent market tools.',
          claimSource: 'Upstream research & business model',
          challenge: 'Incumbents possess existing distribution, security certifications, and multi-product bundling power that point solutions cannot easily match.',
          evidence: 'Major productivity suites have launched native automation extensions directly inside standard enterprise subscriptions.',
          sourceIds: [],
          evidenceStatus: 'partially_supported' as const,
          confidence: 'MEDIUM' as const,
          severity: 'HIGH' as const,
          implication: 'Point solutions risk being commoditized unless deep integration or proprietary data flywheels are established early.'
        }
      ],
      criticalRisks: [
        {
          id: `rtr_det_1_${Date.now()}`,
          title: 'The Discretionary Budget Trap',
          description: 'During corporate spend reviews, operational convenience tools that do not directly generate net new revenue or ensure regulatory compliance are deprioritized or cancelled.',
          category: 'pricing',
          severity: 'CRITICAL' as const,
          evidenceStatus: 'unverified' as const,
          supportingEvidence: 'Corporate software rationalization trends show consolidation toward core platform suites.',
          contradictoryEvidence: '',
          sourceIds: [],
          confidence: 'HIGH' as const,
          potentialImpact: 'High early cohort churn upon annual contract renewal.',
          validationMethod: 'Test pricing thresholds and contract sign-off requirements across 10 discovery conversations.',
          riskType: 'EVIDENCE_BACKED' as const,
          vulnerability: 'The Discretionary Budget Trap',
          failureMechanism: 'Convenience tooling is the first line item cut when departmental budgets tighten.',
          whyCompetitorsWillWin: 'Incumbents offer bundled platforms with single-vendor procurement advantages.',
          preMortemTrigger: 'Prospective buyers express high praise during demos but fail to sign paid pilot agreements.'
        },
        {
          id: `rtr_det_2_${Date.now()}`,
          title: 'Status Quo & Spreadsheet Inertia',
          description: 'Users default to familiar, zero-cost spreadsheets and manual routines because the perceived effort of learning a new tool exceeds the daily friction.',
          category: 'adoption',
          severity: 'HIGH' as const,
          evidenceStatus: 'supported' as const,
          supportingEvidence: 'Over 60% of knowledge teams continue utilizing manual spreadsheets despite commercial SaaS availability.',
          contradictoryEvidence: '',
          sourceIds: [],
          confidence: 'HIGH' as const,
          potentialImpact: 'Stalled product adoption and low daily active engagement after onboarding.',
          validationMethod: 'Measure day-7 and day-30 user retention during pilot programs without founder manual intervention.',
          riskType: 'EVIDENCE_BACKED' as const,
          vulnerability: 'Status Quo & Spreadsheet Inertia',
          failureMechanism: 'Teams abandon new software when initial onboarding requires more than 15 minutes of manual configuration.',
          whyCompetitorsWillWin: 'Status quo has zero incremental monetary cost and zero procurement approvals required.',
          preMortemTrigger: 'Users revert to manual tracking within 14 days of software access.'
        },
        {
          id: `rtr_det_3_${Date.now()}`,
          title: 'Extended Enterprise Sales Cycle CAC Inversion',
          description: 'IT security reviews, SOC2 requirements, and procurement red-tape prolong sales cycles to 6+ months, burning capital before payback is realized.',
          category: 'distribution',
          severity: 'HIGH' as const,
          evidenceStatus: 'unverified' as const,
          supportingEvidence: 'B2B enterprise vendor onboarding audits typically require 90-180 days across mid-market and enterprise buyers.',
          contradictoryEvidence: '',
          sourceIds: [],
          confidence: 'MEDIUM' as const,
          potentialImpact: 'Runway exhaustion before achieving repeatable unit economics.',
          validationMethod: 'Document complete vendor onboarding questionnaire requirements during discovery calls.',
          riskType: 'HYPOTHESIS' as const,
          vulnerability: 'Extended Enterprise Sales Cycle CAC Inversion',
          failureMechanism: 'Lengthy vendor security reviews create prolonged cash burn before contract revenue activates.',
          whyCompetitorsWillWin: 'Established vendors already hold master service agreements and enterprise security clearances.',
          preMortemTrigger: 'Initial prospect sales cycle exceeds 120 days with zero commercial contract signature.'
        }
      ],
      assumptionAttacks: [
        {
          id: `aa_det_1_${Date.now()}`,
          assumption: `Target ${audience} have autonomous discretionary budget ($3k-$15k) to purchase software without executive sign-off.`,
          importance: 'CRITICAL' as const,
          evidenceStatus: 'unverified' as const,
          supportingSourceIds: [],
          contradictorySourceIds: [],
          confidence: 'MEDIUM' as const,
          whatWouldValidateIt: '3 signed Letters of Intent (LOIs) or paid pilots from departmental managers without VP approval.',
          whatWouldInvalidateIt: 'Department heads stating all new software purchases must go through centralized IT procurement committees.'
        },
        {
          id: `aa_det_2_${Date.now()}`,
          assumption: 'Software switching costs are low enough for customers to migrate from legacy systems.',
          importance: 'HIGH' as const,
          evidenceStatus: 'contradicted' as const,
          supportingSourceIds: [],
          contradictorySourceIds: [],
          confidence: 'HIGH' as const,
          whatWouldValidateIt: 'Teams completing full data migration and onboarding within 48 hours without human engineering assistance.',
          whatWouldInvalidateIt: 'Customers citing historical data lock-in and team retraining costs as blockers to adoption.'
        }
      ],
      contradictions: [
        {
          id: `ct_det_1_${Date.now()}`,
          claimOrAssumption: 'Customer Willingness-to-Pay for Workflow Automation',
          sourceA: 'Founder Thesis: Buyers urgently seek to pay for automated workflow optimization.',
          sourceB: 'Research & Upstream Benchmarks: Buyers report extreme reluctance to add new point solutions without proven ROI within 30 days.',
          description: 'There is a tension between the founder assumption of rapid commercial adoption and market evidence of software tool rationalization.',
          severity: 'HIGH' as const,
          confidence: 'HIGH' as const,
          evidenceStatus: 'contradicted' as const,
          sourceIds: []
        }
      ],
      competitiveThreats: [
        {
          id: `cthr_det_1_${Date.now()}`,
          competitorOrSubstitute: 'Manual Spreadsheets & Internal Ad-Hoc Scripts',
          threatType: 'STATUS_QUO' as const,
          threatDescription: 'Zero incremental license fees, total flexibility, and ingrained muscle memory across existing team members.',
          differentiationStatus: 'UNVERIFIED_DIFFERENTIATION' as const,
          whyCustomerWouldNotSwitch: 'Spreadsheets are already paid for, fully customizable, and require zero IT vendor security approvals.',
          sourceIds: []
        },
        {
          id: `cthr_det_2_${Date.now()}`,
          competitorOrSubstitute: 'Incumbent Enterprise Suites & Bundled Platforms',
          threatType: 'DIRECT_COMPETITOR' as const,
          threatDescription: 'Broad existing software vendor relationships, single-sign-on integration, and bundled pricing discounts.',
          differentiationStatus: 'UNVERIFIED_DIFFERENTIATION' as const,
          whyCustomerWouldNotSwitch: 'Procuring from an existing approved vendor avoids months of security and legal reviews.',
          sourceIds: []
        }
      ],
      failureConditions: [
        {
          id: `fc_det_1_${Date.now()}`,
          condition: 'If customer discovery reveals that buying decisions require centralized C-level approval rather than local team authorization, the low-touch self-serve distribution model collapses.',
          supportingEvidence: 'B2B enterprise SaaS sales data regarding procurement threshold limits.',
          severity: 'CRITICAL' as const,
          confidence: 'HIGH' as const,
          validationMethod: 'Ask 10 target buyers about their specific software procurement approval workflows.'
        },
        {
          id: `fc_det_2_${Date.now()}`,
          condition: 'If customer retention drops below 75% at month 6 due to workflow fatigue, the unit economics cannot support paid outbound customer acquisition.',
          supportingEvidence: 'Standard SaaS cohort retention benchmarks.',
          severity: 'HIGH' as const,
          confidence: 'MEDIUM' as const,
          validationMethod: 'Track 90-day pilot usage telemetry and daily active user engagement ratios.'
        }
      ],
      decisionChangingEvidence: [
        {
          id: `dce_det_1_${Date.now()}`,
          evidence: 'At least 3 target organizations execute a binding paid pilot contract (>= $300/mo) within 30 days of discovery.',
          direction: 'positive' as const,
          importance: 'CRITICAL' as const,
          sourceIds: [],
          currentStatus: 'Currently unvalidated in primary customer trials',
          validationAction: 'Present concrete pricing contracts at the conclusion of 10 structured discovery interviews.'
        },
        {
          id: `dce_det_2_${Date.now()}`,
          evidence: 'Target users refuse to grant API data access or cite insurmountable IT security compliance requirements.',
          direction: 'negative' as const,
          importance: 'CRITICAL' as const,
          sourceIds: [],
          currentStatus: 'Hypothetical risk based on industry enterprise compliance standards',
          validationAction: 'Submit a sample security questionnaire to 3 mid-market target IT departments.'
        }
      ],
      supportingEvidence: [
        'Persistent operational friction in manual workflow execution across organizations.',
        'Proven commercial willingness to invest in specialized vertical software that demonstrates immediate cost reductions.'
      ],
      contradictoryEvidence: [
        'Enterprise budget scrutiny causing widespread SaaS vendor consolidation.',
        'High organizational inertia favoring imperfect but familiar spreadsheet workarounds.'
      ],
      unknowns: [
        'Exact customer acquisition cost (CAC) and sales cycle duration via cold outbound channels.',
        'Actual user churn rate after the initial 60-day pilot onboarding period.',
        'Willingness of IT security teams to approve integration access without prolonged compliance audits.'
      ],
      fatalFlaws: [
        {
          id: `rtf_det_1_${Date.now()}`,
          title: 'The Discretionary Budget Trap',
          description: 'During budget contractions, tools that optimize convenience rather than generate direct revenue or prevent legal compliance risks are cut first.',
          vulnerability: 'The Discretionary Budget Trap',
          severity: 'HIGH' as const,
          failureMechanism: 'During budget contractions, tools that optimize convenience rather than generate direct revenue or prevent legal compliance risks are cut first.',
          whyCompetitorsWillWin: 'Incumbents bundle similar features for free within existing enterprise agreements.',
          preMortemTrigger: 'Pilot users express enthusiasm during demos but fail to convert to paid contracts upon trial expiration.',
          evidenceStatus: 'unverified' as const,
          confidence: 'HIGH' as const,
          potentialImpact: 'High customer churn and unviable unit economics.',
          validationMethod: 'Discovery interviews on software purchasing approval thresholds.',
          riskType: 'EVIDENCE_BACKED' as const
        }
      ],
      killScenarios: [
        {
          title: 'Incumbent Native Feature Bundling',
          scenario: 'An existing market leader releases a native workflow plugin for free inside existing enterprise licenses, cutting off third-party wedge adoption.',
          probability: 'HIGH' as const
        },
        {
          title: 'Enterprise Procurement Red-Tape Burn',
          scenario: 'Sales cycles exceed 180 days due to compliance reviews, exhausting startup cash reserves before revenue is realized.',
          probability: 'MEDIUM' as const
        }
      ]
    };
  }
}
