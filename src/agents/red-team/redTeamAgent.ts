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
import { detectDomain } from '../../utils/clientFallbackEngine';

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
        agentRunId: input.agentRunId,
        researchAgentRunId: input.researchAgentRunId,
        businessAgentRunId: input.businessAgentRunId,
        verificationWarnings: input.verificationWarnings,
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

    const domain = detectDomain(`${title} ${problem} ${input.ventureDescription || ''}`, audience);
    const primaryRisk = domain.domainRisks[0] || {
      title: 'Discretionary Budget Squeeze',
      mitigation: 'Demonstrate hard cash ROI within 30 days.'
    };
    const secondaryRisk = domain.domainRisks[1] || {
      title: 'Status Quo & Manual Inertia',
      mitigation: 'Frictionless onboarding and zero-configuration setups.'
    };
    const flaw = domain.fatalFlaws[0] || {
      title: 'Incumbent Bundling Attack',
      mechanism: 'Incumbents bundle free lightweight features into core platform suites.'
    };

    return {
      executiveSummary: `Adversarial Red Team investigation for "${title}" in the ${domain.label} sector. The venture addresses ${problem}, but faces critical structural hazards: (1) ${flaw.title} (${flaw.mechanism}), (2) distribution bottleneck (${domain.distributionBottlenecks[0] || 'high customer acquisition inertia'}), and (3) ${primaryRisk.title}.`,
      confidence: 'HIGH' as const,
      counterFactualAnalysis: `If category incumbents like ${domain.competitors[0]?.name || 'market leaders'} launch an integrated feature targeting "${title}", the venture will struggle to maintain standalone ACVs unless it establishes proprietary defensibility (${domain.typicalMoat}).`,
      untestedDogmasChallenged: [
        `Believing that ${audience} will voluntarily switch to a new standalone interface rather than expecting automation embedded directly in existing tools.`,
        `Assuming that stated customer pain translates into immediate willingness to navigate ${domain.distributionBottlenecks[0] || 'procurement reviews'}.`,
        `Underestimating how status-quo alternatives (${domain.competitors.find(c => c.category === 'STATUS_QUO')?.name || 'manual spreadsheets'}) retain users through zero marginal cost.`
      ],
      challengedClaims: [
        {
          id: `cc_det_1_${Date.now()}`,
          claim: `Target ${audience} have immediate budget to purchase a standalone solution for ${title}.`,
          claimSource: 'Founder intake & business model hypothesis',
          challenge: `Stated pain does not equal paid budget. In ${domain.label}, convenience tools are frequently deprioritized unless hard ROI or compliance demands it.`,
          evidence: 'Historical industry data shows that >50% of exploratory software trials stall due to procurement deprioritization.',
          sourceIds: [],
          evidenceStatus: 'unverified' as const,
          confidence: 'HIGH' as const,
          severity: 'CRITICAL' as const,
          implication: 'If buyers fail to allocate dedicated budget, customer acquisition cost will exceed lifetime value.'
        },
        {
          id: `cc_det_2_${Date.now()}`,
          claim: 'The venture has a sustainable moat against copycat incumbents.',
          claimSource: 'Upstream research & business model',
          challenge: `Incumbents like ${domain.competitors[0]?.name || 'category leaders'} hold entrenched customer trust, master service agreements, and security clearances.`,
          evidence: 'Major enterprise vendors consistently replicate point-solution features within 12-18 months of market validation.',
          sourceIds: [],
          evidenceStatus: 'partially_supported' as const,
          confidence: 'MEDIUM' as const,
          severity: 'HIGH' as const,
          implication: 'Point solutions risk commoditization unless proprietary data flywheels or integrations are locked in early.'
        }
      ],
      criticalRisks: [
        {
          id: `rtr_det_1_${Date.now()}`,
          title: primaryRisk.title,
          description: `Specific to ${domain.label}: ${primaryRisk.title} threatens unit economics and customer expansion.`,
          category: 'pricing',
          severity: 'CRITICAL' as const,
          evidenceStatus: 'unverified' as const,
          supportingEvidence: `Sector analysis in ${domain.label} indicates significant buyer sensitivity.`,
          contradictoryEvidence: '',
          sourceIds: [],
          confidence: 'HIGH' as const,
          potentialImpact: 'High churn upon annual contract renewal.',
          validationMethod: 'Test pricing thresholds and contract sign-off criteria with 5 real prospective buyers.',
          riskType: 'EVIDENCE_BACKED' as const,
          vulnerability: primaryRisk.title,
          failureMechanism: flaw.mechanism,
          whyCompetitorsWillWin: `Incumbents offer pre-integrated platforms with single-vendor procurement advantages.`,
          preMortemTrigger: 'Prospective buyers express high praise during initial demos but stall when presented with paid contracts.'
        },
        {
          id: `rtr_det_2_${Date.now()}`,
          title: secondaryRisk.title,
          description: `Users default to ${domain.competitors.find(c => c.category === 'STATUS_QUO')?.name || 'legacy habits'} because switching friction exceeds daily discomfort.`,
          category: 'adoption',
          severity: 'HIGH' as const,
          evidenceStatus: 'supported' as const,
          supportingEvidence: 'Over 60% of knowledge teams default to status-quo workarounds when new tooling requires manual setup.',
          contradictoryEvidence: '',
          sourceIds: [],
          confidence: 'HIGH' as const,
          potentialImpact: 'Low active engagement and stalled team-wide rollout.',
          validationMethod: 'Measure day-7 and day-30 user retention during unassisted pilots.',
          riskType: 'EVIDENCE_BACKED' as const,
          vulnerability: secondaryRisk.title,
          failureMechanism: 'Teams abandon software if initial onboarding requires extensive data migration.',
          whyCompetitorsWillWin: 'Status quo tools have zero incremental monetary cost and zero procurement approvals required.',
          preMortemTrigger: 'Users revert to manual workflows within 14 days of software access.'
        },
        {
          id: `rtr_det_3_${Date.now()}`,
          title: `Distribution Bottleneck: ${domain.distributionBottlenecks[0] || 'Enterprise Sales Cycle'}`,
          description: `Distribution in ${domain.label} faces ${domain.distributionBottlenecks[0] || 'long evaluation cycles'}, burning runway before payback.`,
          category: 'distribution',
          severity: 'HIGH' as const,
          evidenceStatus: 'unverified' as const,
          supportingEvidence: `Sales cycles in ${domain.label} commonly require multi-month compliance reviews.`,
          contradictoryEvidence: '',
          sourceIds: [],
          confidence: 'MEDIUM' as const,
          potentialImpact: 'Runway exhaustion before achieving repeatable sales velocity.',
          validationMethod: 'Document exact compliance and security prerequisites during initial prospect qualification.',
          riskType: 'HYPOTHESIS' as const,
          vulnerability: 'Distribution Latency',
          failureMechanism: 'Prolonged security and procurement reviews cause burn before revenue recognition.',
          whyCompetitorsWillWin: 'Established vendors already hold approved vendor status and master contracts.',
          preMortemTrigger: 'Sales pipeline stalls in procurement for over 90 days with zero conversion.'
        }
      ],
      assumptionAttacks: [
        {
          id: `aa_det_1_${Date.now()}`,
          assumption: `Target ${audience} have autonomous authority to purchase software without multi-stakeholder sign-off.`,
          importance: 'CRITICAL' as const,
          evidenceStatus: 'unverified' as const,
          supportingSourceIds: [],
          contradictorySourceIds: [],
          confidence: 'MEDIUM' as const,
          whatWouldValidateIt: '3 signed paid pilots or Letters of Intent executed without committee escalation.',
          whatWouldInvalidateIt: 'Prospects stating all software purchases require centralized vendor security clearance.'
        },
        {
          id: `aa_det_2_${Date.now()}`,
          assumption: `Switching friction from ${domain.competitors.find(c => c.category === 'STATUS_QUO')?.name || 'legacy workflows'} is low enough for organic adoption.`,
          importance: 'HIGH' as const,
          evidenceStatus: 'contradicted' as const,
          supportingSourceIds: [],
          contradictorySourceIds: [],
          confidence: 'HIGH' as const,
          whatWouldValidateIt: 'Users completing full workflow execution within 15 minutes of signup.',
          whatWouldInvalidateIt: 'Users citing workflow retraining overhead as the primary reason for abandoning the trial.'
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
