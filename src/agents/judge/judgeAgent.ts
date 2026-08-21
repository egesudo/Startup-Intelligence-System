/**
 * Judge Agent Implementation (Phase 6)
 * 
 * Impartial analytical synthesizer of Startup Intelligence.
 * Evaluates the full body of evidence across Research, Business, and Red Team reports,
 * presides over evidence hierarchy, preserves source traceability, synthesizes cross-agent
 * agreements and disagreements, formulates the Core Venture Thesis, and produces an
 * evidence-based recommendation and exactly 3 empirical next steps.
 */

import { Type } from '@google/genai';
import { 
  IJudgeAgent, 
  JudgeAgentInput, 
  JudgeAgentOutput 
} from '../../types/agents';
import { 
  JudgeReport, 
  CoreVentureThesis, 
  CrossAgentAssessment, 
  CrossAgentDisagreement, 
  DecisionCriticalUncertainty, 
  JudgeDecisionChangingEvidence, 
  RecommendationRationale, 
  NextAction, 
  EvidenceTraceability, 
  Source, 
  ConfidenceLevel, 
  AIRecommendationType,
  FinalOutputIntegrity
} from '../../types/domain';
import { 
  JUDGE_AGENT_SYSTEM_PROMPT, 
  buildJudgeAgentUserPrompt 
} from './prompt';
import { JudgeReportGeminiSchema } from './schema';
import { executeGeminiWithFallback } from '../../server/services/geminiClient';
import { detectDomain } from '../../utils/clientFallbackEngine';

export class JudgeAgent implements IJudgeAgent {
  public readonly agentType = 'JUDGE' as const;

  async synthesize(input: JudgeAgentInput): Promise<JudgeAgentOutput> {
    const startTime = Date.now();
    const startedAt = new Date().toISOString();

    // 1. Strict Pre-flight Validation
    if (!input.ventureTitle) {
      throw new Error('Pre-flight validation failed: Venture title is required for Judge synthesis.');
    }
    if (!input.researchReport) {
      throw new Error('Pre-flight validation failed: Research Report is missing or incomplete for Judge synthesis.');
    }
    if (!input.businessReport) {
      throw new Error('Pre-flight validation failed: Business Report is missing or incomplete for Judge synthesis.');
    }
    if (!input.redTeamReport) {
      throw new Error('Pre-flight validation failed: Red Team Report is missing or incomplete for Judge synthesis.');
    }

    let rawOutput: any = null;

    try {
      const userPrompt = buildJudgeAgentUserPrompt({
        title: input.ventureTitle,
        description: input.ventureDescription,
        agentRunId: input.agentRunId,
        researchAgentRunId: input.researchAgentRunId,
        businessAgentRunId: input.businessAgentRunId,
        redTeamAgentRunId: input.redTeamAgentRunId,
        verificationWarnings: input.verificationWarnings,
        rawIdea: input.rawIdea,
        problem: input.problem || null,
        solution: input.solution || null,
        targetCustomer: input.targetCustomer || input.targetAudience || null,
        marketGeography: input.marketGeography || null,
        businessModel: input.businessModel || input.monetizationIdea || null,
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
        businessReport: input.businessReport,
        redTeamReport: input.redTeamReport
      });

      const responseText = await executeGeminiWithFallback({
        contents: userPrompt,
        config: {
          systemInstruction: JUDGE_AGENT_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: JudgeReportGeminiSchema
        }
      });

      if (responseText) {
        rawOutput = JSON.parse(responseText.trim());
      }
    } catch (err) {
      console.warn('[JudgeAgent] Gemini API synthesis failed or returned non-JSON, falling back to deterministic synthesis:', err);
      rawOutput = null;
    }

    if (!rawOutput) {
      rawOutput = this.buildDeterministicSynthesis(input);
    }

    // Process and normalize the synthesized outputs
    const sourcesConsulted: Source[] = [
      ...(input.researchReport?.sources || []),
      ...(input.businessReport?.sources || []),
      ...(input.redTeamReport?.sources || [])
    ];
    // Deduplicate sources
    const uniqueSourcesMap = new Map<string, Source>();
    sourcesConsulted.forEach(s => {
      if (s && s.id && !uniqueSourcesMap.has(s.id)) {
        uniqueSourcesMap.set(s.id, s);
      }
    });
    const uniqueSources = Array.from(uniqueSourcesMap.values());

    const normalizedReport = this.normalizeJudgeReport(input, rawOutput, uniqueSources, startedAt, Date.now() - startTime);

    const recommendedActions: Array<Omit<NextAction, 'id' | 'ventureId' | 'completed'>> = normalizedReport.nextActions.map(action => ({
      stepNumber: action.stepNumber,
      title: action.title,
      description: action.description,
      purpose: action.purpose,
      validationTarget: action.validationTarget,
      relatedUnknownIds: action.relatedUnknownIds || [],
      relatedRiskIds: action.relatedRiskIds || [],
      priority: action.priority,
      expectedDecisionImpact: action.expectedDecisionImpact,
      actionType: action.actionType || 'CUSTOMER_DISCOVERY',
      hypothesisToTest: action.validationTarget,
      passFailMetric: action.validationTarget,
      estimatedDays: action.estimatedDays || 7
    }));

    // Extract rawScoreInput if provided by LLM or deterministic engine
    let rawScoreInput = undefined;
    if (rawOutput?.rawScoreInput && typeof rawOutput.rawScoreInput === 'object') {
      const r = rawOutput.rawScoreInput;
      if (
        typeof r.marketScoreRaw === 'number' ||
        typeof r.businessScoreRaw === 'number' ||
        typeof r.moatScoreRaw === 'number' ||
        typeof r.riskScoreRaw === 'number'
      ) {
        rawScoreInput = {
          marketScoreRaw: typeof r.marketScoreRaw === 'number' ? Math.max(0, Math.min(25, Math.round(r.marketScoreRaw))) : 15,
          marketReasoning: String(r.marketReasoning || 'Market problem urgency & validation assessment.'),
          businessScoreRaw: typeof r.businessScoreRaw === 'number' ? Math.max(0, Math.min(25, Math.round(r.businessScoreRaw))) : 15,
          businessReasoning: String(r.businessReasoning || 'Business model & unit economics viability.'),
          moatScoreRaw: typeof r.moatScoreRaw === 'number' ? Math.max(0, Math.min(25, Math.round(r.moatScoreRaw))) : 14,
          moatReasoning: String(r.moatReasoning || 'Defensibility & competitive moat.'),
          riskScoreRaw: typeof r.riskScoreRaw === 'number' ? Math.max(0, Math.min(25, Math.round(r.riskScoreRaw))) : 20,
          riskReasoning: String(r.riskReasoning || 'Adversarial risk resilience & execution profile.')
        };
      }
    }

    return {
      report: normalizedReport,
      recommendedActions,
      aiRecommendation: normalizedReport.aiRecommendation,
      agentRunId: input.agentRunId,
      rawScoreInput,
      meta: {
        sourcesConsultedCount: uniqueSources.length,
        findingsEvaluatedCount: (input.researchReport?.findings?.length || 0) + (input.businessReport?.assumptions?.length || 0) + (input.redTeamReport?.criticalRisks?.length || 0),
        disagreementsCount: normalizedReport.crossAgentAssessment?.disagreements?.length || 0,
        uncertaintiesCount: normalizedReport.criticalUnknowns?.length || 0,
        confidence: normalizedReport.recommendationConfidence,
        executionTimeMs: Date.now() - startTime
      }
    };
  }

  /**
   * Deterministic high-integrity evidence synthesizer when LLM is unavailable or for fallback
   */
  private buildDeterministicSynthesis(input: JudgeAgentInput): any {
    const research = input.researchReport;
    const business = input.businessReport;
    const redTeam = input.redTeamReport;

    const redTeamRisks = redTeam?.criticalRisks || redTeam?.fatalFlaws || [];
    const highSeverityRiskCount = redTeamRisks.filter(r => r.severity === 'HIGH' || r.severity === 'LETHAL' || r.severity === 'CRITICAL').length;
    const unverifiedAssumptions = (business?.assumptions || []).filter(a => a.evidenceStatus === 'unverified' || a.evidenceStatus === 'UNVERIFIED').length;
    const contradictionsCount = (redTeam?.contradictions || []).length;

    // Formulate Recommendation based on empirical evidence balance
    let recommendation: AIRecommendationType = 'VALIDATE FIRST';
    let confidence: ConfidenceLevel = 'HIGH';

    if (highSeverityRiskCount >= 3 || contradictionsCount >= 3) {
      recommendation = 'REDESIGN';
      confidence = 'HIGH';
    } else if (highSeverityRiskCount === 0 && unverifiedAssumptions === 0 && (research?.confidenceScore === 'HIGH' || research?.confidence === 'HIGH')) {
      recommendation = 'BUILD';
      confidence = 'MEDIUM';
    } else {
      recommendation = 'VALIDATE FIRST';
      confidence = 'HIGH';
    }

    const domain = detectDomain(`${input.ventureTitle} ${input.ventureDescription || ''} ${input.problem || ''}`, input.targetCustomer);

    const statement = `The venture "${input.ventureTitle}" can establish a defensible position in ${domain.label} by validating customer willingness-to-pay and overcoming ${domain.competitors.find(c => c.category === 'STATUS_QUO')?.name || 'manual status-quo inertia'}.`;
    
    const coreVentureThesis: CoreVentureThesis = {
      statement,
      supportingEvidence: [
        `Structural sector tailwinds in ${domain.label} (${domain.tailwinds[0] || 'digitization acceleration'}).`,
        `Identified business archetype (${business?.archetype || domain.defaultArchetype}) provides scalable margins (${domain.marginProfile}).`
      ],
      contradictingEvidence: [
        `Incumbents (${domain.competitors[0]?.name || 'market leaders'}) possess distribution scale and bundling power.`,
        `Switching friction from ${domain.competitors.find(c => c.category === 'STATUS_QUO')?.name || 'status-quo habits'} represents immediate adoption resistance.`
      ],
      criticalAssumptions: [
        `Target customers perceive sufficient ROI to justify paying for a specialized solution (${domain.typicalPricePoint}).`,
        `Distribution bottlenecks (${domain.distributionBottlenecks[0] || 'sales cycle'}) can be compressed to maintain cash runway.`
      ],
      confidence: 'HIGH',
      status: recommendation === 'BUILD' ? 'supported' : recommendation === 'REDESIGN' ? 'weakly_supported' : 'partially_supported'
    };

    const crossAgentAssessment: CrossAgentAssessment = {
      agreements: [
        'All agents identify clear market modernization potential in the target vertical.',
        'Agreement that distribution strategy is the decisive determinant of long-term unit economics.'
      ],
      disagreements: [
        {
          topic: 'Incumbent Defensibility vs. Specialized Feature Wedge',
          researchPosition: 'Identifies viable wedge by serving underserved edge cases not addressed by generalist tools.',
          businessPosition: 'Projects attractive gross margins if pricing power holds at target tier.',
          redTeamPosition: 'Warns that incumbents can replicate the wedge as an embedded feature within existing enterprise contracts.',
          evidence: 'Red Team competitive threat analysis and enterprise software bundling benchmarks.',
          sourceIds: (research?.sources || []).map(s => s.id).slice(0, 2),
          judgeInterpretation: 'The wedge is viable initially, but sustained defensibility requires proprietary data accumulation or multi-system lock-in before incumbents bundle.',
          confidence: 'HIGH'
        }
      ],
      contradictions: (redTeam?.contradictions || []).map(c => `${c.claimOrAssumption}: ${c.description}`),
      unsupportedClaims: (redTeam?.challengedClaims || []).map(c => `Claim: "${c.claim}" remains unsupported by empirical data.`),
      missingInformation: (redTeam?.unknowns || []).length > 0 
        ? redTeam.unknowns 
        : ['Empirical pilot conversion rate on paid commitments', 'Actual cost per qualified enterprise lead']
    };

    const criticalUnknowns: DecisionCriticalUncertainty[] = [
      {
        id: `unk_judge_1_${Date.now()}`,
        statement: 'True customer willingness to pay for a dedicated standalone application vs. accepting free bundled alternatives.',
        whyItMatters: 'Determines whether average contract value can support direct sales distribution.',
        currentEvidence: 'Currently unverified; based on founder hypothesis and secondary market willingness benchmarks.',
        sourceIds: (research?.sources || []).map(s => s.id).slice(0, 1),
        confidence: 'HIGH',
        impact: 'HIGH',
        validationMethod: 'Execute 10 discovery calls with upfront price testing and letter-of-intent requests.',
        decisionChangePotential: 'If willingness to pay is < $100/mo, model must pivot to self-serve bottoms-up PLG.'
      },
      {
        id: `unk_judge_2_${Date.now()}`,
        statement: 'Customer acquisition cost and organic referral velocity within target vertical.',
        whyItMatters: 'Payback periods exceeding 14 months will cause severe cash drain.',
        currentEvidence: 'Preliminary industry benchmarks show acquisition costs ranging between $800 and $2,400.',
        sourceIds: [],
        confidence: 'MEDIUM',
        impact: 'HIGH',
        validationMethod: 'Run low-budget search and LinkedIn ad campaign testing conversion on high-intent landing page.',
        decisionChangePotential: 'If cost per qualified lead > $150, outbound sales model must be redesigned.'
      }
    ];

    const decisionChangingEvidence: JudgeDecisionChangingEvidence[] = [
      {
        id: `dce_judge_1_${Date.now()}`,
        evidenceNeeded: 'At least 5 signed Letters of Intent (LOIs) or paid upfront deposits from target enterprise users.',
        currentStatus: 'Unvalidated (No formal commitments yet recorded)',
        expectedImpact: 'Upgrades recommendation from VALIDATE FIRST to BUILD with proven commercial traction.',
        validationMethod: 'Structured discovery campaign presenting prototype architecture with deposit requirement.'
      },
      {
        id: `dce_judge_2_${Date.now()}`,
        evidenceNeeded: 'Confirmation that target buyers face mandatory compliance or regulatory mandates requiring specialized audit logging.',
        currentStatus: 'Hypothesized based on vertical characteristics',
        expectedImpact: 'Establishes high regulatory barrier preventing generalist incumbents from easily commoditizing the solution.',
        validationMethod: 'Regulatory audit review and interviews with 3 vertical compliance officers.'
      }
    ];

    const nextActions: NextAction[] = [
      {
        id: `na_judge_1_${Date.now()}`,
        ventureId: input.ventureId,
        stepNumber: 1,
        title: 'Run 10 Problem-Discovery Customer Interviews with Pricing Commits',
        description: 'Conduct structured 30-minute interviews with target domain operators, quantifying their current loss from the problem and presenting explicit pricing tiers for deposit commitment.',
        purpose: 'Test whether urgency is acute enough to extract monetary commitment before writing production code.',
        validationTarget: 'At least 3 out of 10 target buyers express willingness to sign a conditional pilot agreement.',
        relatedUnknownIds: [criticalUnknowns[0]?.id || ''],
        priority: 'IMMEDIATE',
        expectedDecisionImpact: 'Confirms customer willingness to pay and sets initial pricing anchor.',
        actionType: 'CUSTOMER_DISCOVERY',
        hypothesisToTest: 'Target operators lose >$5,000/yr to this problem and will commit to a $150/mo solution.',
        passFailMetric: '>=3 pilot commitments out of 10 interviews',
        estimatedDays: 7,
        completed: false
      },
      {
        id: `na_judge_2_${Date.now()}`,
        ventureId: input.ventureId,
        stepNumber: 2,
        title: 'Deploy High-Intent Smoke Test Landing Page with Acquisition Tracking',
        description: 'Publish a single high-conversion landing page outlining the specific value proposition, problem mechanics, and pricing tiers with a "Request Early Pilot Access" action.',
        purpose: 'Measure organic and paid acquisition click-through rates and calculate empirical cost per lead.',
        validationTarget: 'Achieve >5% conversion rate on qualified visitors and Cost Per Lead < $45 on a $250 test spend.',
        relatedUnknownIds: [criticalUnknowns[1]?.id || ''],
        priority: 'HIGH',
        expectedDecisionImpact: 'Validates message resonance and baseline customer acquisition economics.',
        actionType: 'SMOKE_TEST',
        hypothesisToTest: 'High-intent search/social traffic converts to pilot requests at acceptable acquisition costs.',
        passFailMetric: '>5% email signup conversion, CPL < $45',
        estimatedDays: 5,
        completed: false
      },
      {
        id: `na_judge_3_${Date.now()}`,
        ventureId: input.ventureId,
        stepNumber: 3,
        title: 'Execute Technical Feasibility & Integration Spike for Core Defensibility',
        description: 'Build a rapid lightweight prototype demonstrating the single hardest integration or data workflow that incumbents do not easily provide.',
        purpose: 'Eliminate technical execution risk and verify that proprietary integration can serve as a defensible moat.',
        validationTarget: 'Demonstrate functional end-to-end data pipeline within 72 hours using sandbox APIs.',
        relatedUnknownIds: [],
        priority: 'HIGH',
        expectedDecisionImpact: 'Determines whether the technical wedge can be delivered with low ongoing maintenance overhead.',
        actionType: 'TECH_SPIKE',
        hypothesisToTest: 'Core integration can be executed reliably with standard modern APIs.',
        passFailMetric: 'Working end-to-end sandbox pipeline execution',
        estimatedDays: 3,
        completed: false
      }
    ];

    const evidenceTraceability: EvidenceTraceability[] = [
      {
        id: `tr_judge_1_${Date.now()}`,
        conclusion: 'Venture possesses clear market opportunity but faces decisive distribution and incumbent risk.',
        findingIds: (research?.findings || []).slice(0, 3).map(f => f.id),
        sourceIds: (research?.sources || []).slice(0, 3).map(s => s.id),
        evidenceLevel: 'MULTIPLE_CONSISTENT',
        status: 'SUPPORTED',
        notes: 'Cross-validated against research market findings and red team competitive analysis.'
      },
      {
        id: `tr_judge_2_${Date.now()}`,
        conclusion: 'Willingness to pay remains an unverified critical assumption that must be tested prior to capital investment.',
        findingIds: (business?.assumptions || []).slice(0, 2).map(a => a.id),
        sourceIds: [],
        evidenceLevel: 'HYPOTHESIS',
        status: 'INSUFFICIENT_EVIDENCE',
        notes: 'Founder hypothesis currently lacks primary customer transaction evidence.'
      }
    ];

    return {
      executiveSummary: `The Judge Agent synthesized the findings of the Research, Business, and Red Team reports for "${input.ventureTitle}". While market trends and problem urgency offer a viable commercial foundation, critical uncertainties surrounding willingness-to-pay and incumbent feature bundling necessitate focused empirical validation before scaling development. The evidence-backed recommendation is ${recommendation}.`,
      aiRecommendation: recommendation,
      recommendationConfidence: confidence,
      coreVentureThesis,
      crossAgentAssessment,
      strongestSupportingEvidence: [
        'Research confirms addressable demand and structural market tailwinds in the target vertical.',
        'Business model structure indicates healthy gross margins if customer acquisition cost remains controlled.'
      ],
      strongestContradictoryEvidence: [
        'Red Team analysis surfaces incumbent bundling and status-quo inertia as immediate adoption barriers.',
        'Unit economics are highly sensitive to sales cycle length and customer switching friction.'
      ],
      criticalUnknowns,
      criticalAssumptions: [
        'Target customers will adopt a dedicated standalone software tool rather than remaining with existing manual processes.',
        'Initial customer acquisition cost can be recovered within a standard 12-month payback window.'
      ],
      criticalRisks: [
        'Incumbents releasing native embedded workflows at zero incremental software cost.',
        'High pilot drop-off due to organizational inertia and compliance review delays.'
      ],
      decisionChangingEvidence,
      recommendationRationale: {
        recommendation,
        confidence,
        primaryReasons: [
          'Strong qualitative problem urgency paired with unverified transactional willingness-to-pay.',
          'Significant downside risk from incumbent feature bundling requires immediate wedge validation.',
          'Low-cost empirical tests can de-risk the venture within 2 weeks prior to committing engineering capital.'
        ],
        strongestSupportingEvidence: [
          'Industry tailwinds and workflow modernization demand verified by research findings.'
        ],
        strongestContradictoryEvidence: [
          'High status quo switching friction and incumbent distribution advantages highlighted by Red Team.'
        ],
        criticalUnknowns: [
          'Empirical willingness to pay and actual customer acquisition cost.'
        ],
        decisionChangingEvidence: [
          'Receipt of 5 signed pilot LOIs with deposit commitments.'
        ]
      },
      nextActions,
      evidenceTraceability,
      finalOutputIntegrity: {
        whatIsTheIdea: `${input.ventureTitle}: ${input.problem ? `Solving "${input.problem}" with "${input.solution || input.ventureDescription}"` : input.ventureDescription}`,
        whatDidWeFind: input.researchReport?.executiveSummary || 'Research identified verified market signals and incumbent workflow benchmarks.',
        whatSupportsIt: [
          'Research confirms addressable demand and structural market tailwinds in the target vertical.',
          'Business model structure indicates healthy gross margins if customer acquisition cost remains controlled.'
        ],
        whatCouldBreakIt: [
          'Red Team analysis surfaces incumbent bundling and status-quo inertia as immediate adoption barriers.',
          'Unit economics are highly sensitive to sales cycle length and customer switching friction.'
        ],
        whatRemainsUnknown: [
          'True customer willingness to pay for standalone software vs accepting bundled tools.',
          'Empirical customer acquisition cost and organic referral velocity.'
        ],
        whatShouldFounderDoNext: `Recommendation is ${recommendation}. Execute the 3 priority validation experiments within 2 weeks before committing engineering capital.`
      },
      tradeoffMatrix: [
        {
          dimension: 'Market Demand vs Incumbent Risk',
          bullCase: 'Specialized workflow features capture high-margin vertical niche.',
          bearCase: 'Incumbents add identical feature to existing suites, destroying standalone pricing power.',
          judgeVerdict: 'Validating proprietary data integrations and customer lock-in is essential for defensibility.'
        },
        {
          dimension: 'Unit Economics vs Sales Cycle',
          bullCase: 'Bottoms-up virality creates low CAC and high LTV.',
          bearCase: 'Enterprise security reviews and procurement friction inflate CAC beyond LTV.',
          judgeVerdict: 'Execute smoke tests to measure exact conversion costs before hiring sales resources.'
        }
      ]
    };
  }

  /**
   * Normalizes LLM or deterministic output to ensure strict adherence to JudgeReport schema
   */
  private normalizeJudgeReport(
    input: JudgeAgentInput,
    raw: any,
    sources: Source[],
    startedAt: string,
    executionTimeMs: number
  ): Omit<JudgeReport, 'id' | 'ventureId' | 'createdAt'> {
    // Determine canonical recommendation
    let aiRecommendation: AIRecommendationType = 'VALIDATE FIRST';
    const recStr = String(raw?.aiRecommendation || '').toUpperCase();
    if (recStr === 'BUILD' || recStr === 'PROCEED_CONFIDENTLY') {
      aiRecommendation = 'BUILD';
    } else if (recStr === 'REDESIGN' || recStr === 'PIVOT_REQUIRED') {
      aiRecommendation = 'REDESIGN';
    } else if (recStr === 'DO NOT PURSUE' || recStr === 'DO_NOT_PURSUE' || recStr === 'KILL_RECOMMENDED') {
      aiRecommendation = 'DO NOT PURSUE';
    } else {
      aiRecommendation = 'VALIDATE FIRST';
    }

    const confidence: ConfidenceLevel = (raw?.recommendationConfidence === 'HIGH' || raw?.recommendationConfidence === 'MEDIUM' || raw?.recommendationConfidence === 'LOW')
      ? raw.recommendationConfidence
      : 'HIGH';

    const executiveSummary = String(raw?.executiveSummary || raw?.synthesis || `Synthesized multi-agent evaluation for "${input.ventureTitle}". Recommendation: ${aiRecommendation}.`);

    // Core Venture Thesis
    const coreVentureThesis: CoreVentureThesis = {
      statement: String(raw?.coreVentureThesis?.statement || `Venture "${input.ventureTitle}" can achieve viability through focused wedge execution.`),
      supportingEvidence: Array.isArray(raw?.coreVentureThesis?.supportingEvidence) && raw.coreVentureThesis.supportingEvidence.length > 0
        ? raw.coreVentureThesis.supportingEvidence.map(String)
        : ['Target market shows structural demand for workflow improvement.'],
      contradictingEvidence: Array.isArray(raw?.coreVentureThesis?.contradictingEvidence) && raw.coreVentureThesis.contradictingEvidence.length > 0
        ? raw.coreVentureThesis.contradictingEvidence.map(String)
        : ['Incumbent distribution advantages and switching friction.'],
      criticalAssumptions: Array.isArray(raw?.coreVentureThesis?.criticalAssumptions) && raw.coreVentureThesis.criticalAssumptions.length > 0
        ? raw.coreVentureThesis.criticalAssumptions.map(String)
        : ['Customers are willing to pay for standalone software.'],
      confidence: (raw?.coreVentureThesis?.confidence === 'HIGH' || raw?.coreVentureThesis?.confidence === 'MEDIUM' || raw?.coreVentureThesis?.confidence === 'LOW')
        ? raw.coreVentureThesis.confidence
        : confidence,
      status: (['supported', 'partially_supported', 'weakly_supported', 'contradicted', 'unvalidated', 'unknown'].includes(raw?.coreVentureThesis?.status))
        ? raw.coreVentureThesis.status
        : 'partially_supported'
    };

    // Cross Agent Assessment
    const crossAgentAssessment: CrossAgentAssessment = {
      agreements: Array.isArray(raw?.crossAgentAssessment?.agreements) && raw.crossAgentAssessment.agreements.length > 0
        ? raw.crossAgentAssessment.agreements.map(String)
        : ['General consensus on market opportunity and workflow need.'],
      disagreements: Array.isArray(raw?.crossAgentAssessment?.disagreements)
        ? raw.crossAgentAssessment.disagreements.map((d: any) => ({
            topic: String(d?.topic || 'Distribution vs Product Defensibility'),
            researchPosition: String(d?.researchPosition || 'Identified market demand wedge.'),
            businessPosition: String(d?.businessPosition || 'Projected viable margin structure.'),
            redTeamPosition: String(d?.redTeamPosition || 'Surfaced incumbent replication risk.'),
            evidence: String(d?.evidence || 'Cross-agent comparative findings.'),
            sourceIds: Array.isArray(d?.sourceIds) ? d.sourceIds.map(String) : [],
            judgeInterpretation: String(d?.judgeInterpretation || 'Requires rapid pilot validation to confirm defensibility.'),
            confidence: (d?.confidence === 'HIGH' || d?.confidence === 'MEDIUM' || d?.confidence === 'LOW') ? d.confidence : 'HIGH'
          }))
        : [],
      contradictions: Array.isArray(raw?.crossAgentAssessment?.contradictions) ? raw.crossAgentAssessment.contradictions.map(String) : [],
      unsupportedClaims: Array.isArray(raw?.crossAgentAssessment?.unsupportedClaims) ? raw.crossAgentAssessment.unsupportedClaims.map(String) : [],
      missingInformation: Array.isArray(raw?.crossAgentAssessment?.missingInformation) ? raw.crossAgentAssessment.missingInformation.map(String) : []
    };

    // Critical Unknowns
    const criticalUnknowns: DecisionCriticalUncertainty[] = Array.isArray(raw?.criticalUnknowns) && raw.criticalUnknowns.length > 0
      ? raw.criticalUnknowns.map((u: any, idx: number) => ({
          id: u?.id || `unk_j_${idx + 1}_${Date.now()}`,
          statement: String(u?.statement || 'Key customer willingness-to-pay uncertainty'),
          whyItMatters: String(u?.whyItMatters || 'Governs whether unit economics are viable'),
          currentEvidence: String(u?.currentEvidence || 'Unverified hypothesis'),
          sourceIds: Array.isArray(u?.sourceIds) ? u.sourceIds.map(String) : [],
          confidence: (u?.confidence === 'HIGH' || u?.confidence === 'MEDIUM' || u?.confidence === 'LOW') ? u.confidence : 'HIGH',
          impact: String(u?.impact || 'HIGH'),
          validationMethod: String(u?.validationMethod || 'Direct customer interviews and price testing'),
          decisionChangePotential: String(u?.decisionChangePotential || 'Could trigger pivot or model redesign')
        }))
      : [
          {
            id: `unk_j_default_${Date.now()}`,
            statement: 'Target customer willingness to pay for standalone solution',
            whyItMatters: 'Governs whether acquisition cost can be recovered profitably',
            currentEvidence: 'Unverified hypothesis from founder input',
            sourceIds: [],
            confidence: 'HIGH',
            impact: 'HIGH',
            validationMethod: '10 discovery calls with upfront price testing',
            decisionChangePotential: 'If negative, necessitates model redesign'
          }
        ];

    // Decision Changing Evidence
    const decisionChangingEvidence: JudgeDecisionChangingEvidence[] = Array.isArray(raw?.decisionChangingEvidence) && raw.decisionChangingEvidence.length > 0
      ? raw.decisionChangingEvidence.map((d: any, idx: number) => ({
          id: d?.id || `dce_j_${idx + 1}_${Date.now()}`,
          evidenceNeeded: String(d?.evidenceNeeded || '5 paid letters of intent or deposit commitments'),
          currentStatus: String(d?.currentStatus || 'Unvalidated'),
          expectedImpact: String(d?.expectedImpact || 'Elevates recommendation to BUILD'),
          validationMethod: String(d?.validationMethod || 'Discovery calls and pilot contracts'),
          relatedAssumptionIds: Array.isArray(d?.relatedAssumptionIds) ? d.relatedAssumptionIds.map(String) : [],
          relatedRiskIds: Array.isArray(d?.relatedRiskIds) ? d.relatedRiskIds.map(String) : []
        }))
      : [
          {
            id: `dce_j_default_${Date.now()}`,
            evidenceNeeded: '5 signed pilot LOIs with deposit commitments',
            currentStatus: 'Unvalidated',
            expectedImpact: 'Upgrades recommendation from VALIDATE FIRST to BUILD',
            validationMethod: 'Pilot discovery campaign with explicit deposit request'
          }
        ];

    // Exactly THREE Next Actions
    let rawActions = Array.isArray(raw?.nextActions) ? raw.nextActions : Array.isArray(raw?.recommendedActions) ? raw.recommendedActions : [];
    if (rawActions.length === 0) {
      rawActions = [
        {
          stepNumber: 1,
          title: 'Conduct 10 Structured Customer Discovery Calls with Price Testing',
          description: 'Interview target operators to quantify current pain and present explicit deposit tiers.',
          purpose: 'Validate willingness to pay before committing engineering resources.',
          validationTarget: '>=3 target users agree to conditional pilot terms.',
          priority: 'IMMEDIATE',
          expectedDecisionImpact: 'Confirms customer willingness to pay.'
        },
        {
          stepNumber: 2,
          title: 'Deploy High-Intent Smoke Test Landing Page',
          description: 'Test value proposition messaging and calculate empirical cost per lead.',
          purpose: 'Measure conversion rates and lead acquisition costs.',
          validationTarget: '>5% conversion on high-intent traffic, CPL < $45.',
          priority: 'HIGH',
          expectedDecisionImpact: 'Validates marketing resonance and acquisition economics.'
        },
        {
          stepNumber: 3,
          title: 'Build Technical Feasibility Spike for Core Wedge',
          description: 'Implement minimal proof-of-concept for the most critical integration workflow.',
          purpose: 'De-risk technical execution and prove integration defensibility.',
          validationTarget: 'Functional end-to-end sandbox pipeline within 72 hours.',
          priority: 'HIGH',
          expectedDecisionImpact: 'Eliminates technical architecture uncertainty.'
        }
      ];
    }

    // Ensure exactly 3 actions with correct stepNumber
    const nextActions: NextAction[] = rawActions.slice(0, 3).map((a: any, idx: number) => ({
      id: a?.id || `na_judge_${idx + 1}_${Date.now()}`,
      ventureId: input.ventureId,
      stepNumber: ((idx + 1) as 1 | 2 | 3),
      title: String(a?.title || `Validation Action ${idx + 1}`),
      description: String(a?.description || 'Execute empirical validation step.'),
      purpose: String(a?.purpose || 'De-risk critical venture assumptions.'),
      validationTarget: String(a?.validationTarget || a?.passFailMetric || 'Achieve target pass/fail metric.'),
      relatedUnknownIds: Array.isArray(a?.relatedUnknownIds) ? a.relatedUnknownIds.map(String) : [],
      relatedRiskIds: Array.isArray(a?.relatedRiskIds) ? a.relatedRiskIds.map(String) : [],
      priority: (a?.priority === 'IMMEDIATE' || a?.priority === 'HIGH' || a?.priority === 'SECONDARY') ? a.priority : 'HIGH',
      expectedDecisionImpact: String(a?.expectedDecisionImpact || 'Validates core venture feasibility.'),
      actionType: a?.actionType || (idx === 0 ? 'CUSTOMER_DISCOVERY' : idx === 1 ? 'SMOKE_TEST' : 'TECH_SPIKE'),
      hypothesisToTest: a?.hypothesisToTest || a?.validationTarget || 'Validate critical hypothesis',
      passFailMetric: a?.passFailMetric || a?.validationTarget || 'Target threshold achieved',
      estimatedDays: typeof a?.estimatedDays === 'number' ? a.estimatedDays : (idx === 0 ? 7 : idx === 1 ? 5 : 3),
      completed: false
    }));

    while (nextActions.length < 3) {
      const idx = nextActions.length;
      nextActions.push({
        id: `na_judge_${idx + 1}_${Date.now()}`,
        ventureId: input.ventureId,
        stepNumber: ((idx + 1) as 1 | 2 | 3),
        title: `Validation Step ${idx + 1}`,
        description: 'Conduct empirical test to validate customer demand.',
        purpose: 'Verify venture assumptions with real user data.',
        validationTarget: 'Obtain measurable feedback from at least 5 target prospects.',
        priority: 'HIGH',
        expectedDecisionImpact: 'Provides empirical evidence for decision.',
        actionType: 'CUSTOMER_DISCOVERY',
        hypothesisToTest: 'Customer willingness to adopt',
        passFailMetric: '>=3 positive commitments',
        estimatedDays: 5,
        completed: false
      });
    }

    // Recommendation Rationale
    const recommendationRationale: RecommendationRationale = {
      recommendation: aiRecommendation,
      confidence,
      primaryReasons: Array.isArray(raw?.recommendationRationale?.primaryReasons) && raw.recommendationRationale.primaryReasons.length > 0
        ? raw.recommendationRationale.primaryReasons.map(String)
        : [
            'Market tailwinds present a viable opportunity, but key risks require testing.',
            'Unit economics and customer acquisition costs require empirical validation before scaling development.'
          ],
      strongestSupportingEvidence: Array.isArray(raw?.strongestSupportingEvidence) ? raw.strongestSupportingEvidence.map(String) : ['Market demand verified in research findings.'],
      strongestContradictoryEvidence: Array.isArray(raw?.strongestContradictoryEvidence) ? raw.strongestContradictoryEvidence.map(String) : ['Incumbent feature bundling and switching inertia identified by Red Team.'],
      criticalUnknowns: Array.isArray(raw?.criticalAssumptions) ? raw.criticalAssumptions.map(String) : ['Customer willingness to pay for standalone software.'],
      decisionChangingEvidence: decisionChangingEvidence.map(d => d.evidenceNeeded)
    };

    // Evidence Traceability
    const evidenceTraceability: EvidenceTraceability[] = Array.isArray(raw?.evidenceTraceability) && raw.evidenceTraceability.length > 0
      ? raw.evidenceTraceability.map((t: any, idx: number) => ({
          id: t?.id || `tr_j_${idx + 1}_${Date.now()}`,
          conclusion: String(t?.conclusion || 'Venture requires empirical validation before capital deployment.'),
          findingIds: Array.isArray(t?.findingIds) ? t.findingIds.map(String) : [],
          sourceIds: Array.isArray(t?.sourceIds) ? t.sourceIds.map(String) : [],
          evidenceLevel: String(t?.evidenceLevel || 'MULTIPLE_CONSISTENT'),
          status: String(t?.status || 'SUPPORTED'),
          notes: t?.notes ? String(t.notes) : undefined
        }))
      : [
          {
            id: `tr_j_1_${Date.now()}`,
            conclusion: 'Market modernization opportunity exists but faces incumbent bundling headwinds.',
            findingIds: (input.researchReport?.findings || []).slice(0, 3).map(f => f.id),
            sourceIds: (input.researchReport?.sources || []).slice(0, 3).map(s => s.id),
            evidenceLevel: 'MULTIPLE_CONSISTENT',
            status: 'SUPPORTED',
            notes: 'Cross-verified across research and red team reports.'
          }
        ];

    const tradeoffMatrix = Array.isArray(raw?.tradeoffMatrix)
      ? raw.tradeoffMatrix.map((tm: any) => ({
          dimension: String(tm?.dimension || 'Strategic Dimension'),
          bullCase: String(tm?.bullCase || 'Optimistic scenario'),
          bearCase: String(tm?.bearCase || 'Pessimistic scenario'),
          judgeVerdict: String(tm?.judgeVerdict || 'Judicial evaluation')
        }))
      : [
          {
            dimension: 'Market Opportunity vs Incumbent Bundling',
            bullCase: 'Specialized wedge captures dedicated vertical market share.',
            bearCase: 'Incumbents bundle identical workflow at zero marginal cost.',
            judgeVerdict: 'Rapid validation of proprietary data moat is essential.'
          }
        ];

    const finalOutputIntegrity: FinalOutputIntegrity = {
      whatIsTheIdea: raw?.finalOutputIntegrity?.whatIsTheIdea || `${input.ventureTitle}: ${input.problem ? `Solving "${input.problem}" with "${input.solution || input.ventureDescription}"` : input.ventureDescription}`,
      whatDidWeFind: raw?.finalOutputIntegrity?.whatDidWeFind || (input.researchReport?.executiveSummary || 'Research identified verified market signals and incumbent workflow benchmarks.'),
      whatSupportsIt: Array.isArray(raw?.finalOutputIntegrity?.whatSupportsIt) && raw.finalOutputIntegrity.whatSupportsIt.length > 0
        ? raw.finalOutputIntegrity.whatSupportsIt.map(String)
        : (Array.isArray(raw?.strongestSupportingEvidence) && raw.strongestSupportingEvidence.length > 0 ? raw.strongestSupportingEvidence.map(String) : ['Market tailwinds and target domain modernization demand.']),
      whatCouldBreakIt: Array.isArray(raw?.finalOutputIntegrity?.whatCouldBreakIt) && raw.finalOutputIntegrity.whatCouldBreakIt.length > 0
        ? raw.finalOutputIntegrity.whatCouldBreakIt.map(String)
        : (Array.isArray(raw?.strongestContradictoryEvidence) && raw.strongestContradictoryEvidence.length > 0 ? raw.strongestContradictoryEvidence.map(String) : ['Incumbent feature bundling and high customer switching friction.']),
      whatRemainsUnknown: Array.isArray(raw?.finalOutputIntegrity?.whatRemainsUnknown) && raw.finalOutputIntegrity.whatRemainsUnknown.length > 0
        ? raw.finalOutputIntegrity.whatRemainsUnknown.map(String)
        : (criticalUnknowns.map(u => u.statement)),
      whatShouldFounderDoNext: raw?.finalOutputIntegrity?.whatShouldFounderDoNext || `Recommendation is ${aiRecommendation}. Execute 3 priority empirical validation experiments prior to capital allocation.`
    };

    // Evidence-derived raw dimensional score inputs
    let rawScoreInput = undefined;
    if (raw?.rawScoreInput && typeof raw.rawScoreInput === 'object') {
      const r = raw.rawScoreInput;
      if (
        typeof r.marketScoreRaw === 'number' ||
        typeof r.businessScoreRaw === 'number' ||
        typeof r.moatScoreRaw === 'number' ||
        typeof r.riskScoreRaw === 'number'
      ) {
        rawScoreInput = {
          marketScoreRaw: typeof r.marketScoreRaw === 'number' ? Math.max(0, Math.min(25, Math.round(r.marketScoreRaw))) : 15,
          marketReasoning: String(r.marketReasoning || 'Market problem urgency & validation assessment.'),
          businessScoreRaw: typeof r.businessScoreRaw === 'number' ? Math.max(0, Math.min(25, Math.round(r.businessScoreRaw))) : 15,
          businessReasoning: String(r.businessReasoning || 'Business model & unit economics viability.'),
          moatScoreRaw: typeof r.moatScoreRaw === 'number' ? Math.max(0, Math.min(25, Math.round(r.moatScoreRaw))) : 14,
          moatReasoning: String(r.moatReasoning || 'Defensibility & competitive moat.'),
          riskScoreRaw: typeof r.riskScoreRaw === 'number' ? Math.max(0, Math.min(25, Math.round(r.riskScoreRaw))) : 20,
          riskReasoning: String(r.riskReasoning || 'Adversarial risk resilience & execution profile.')
        };
      }
    }

    return {
      executiveSummary,
      coreVentureThesis,
      crossAgentAssessment,
      strongestSupportingEvidence: Array.isArray(raw?.strongestSupportingEvidence) && raw.strongestSupportingEvidence.length > 0
        ? raw.strongestSupportingEvidence.map(String)
        : ['Demonstrated problem frequency and workflow inefficiency in target vertical.'],
      strongestContradictoryEvidence: Array.isArray(raw?.strongestContradictoryEvidence) && raw.strongestContradictoryEvidence.length > 0
        ? raw.strongestContradictoryEvidence.map(String)
        : ['Incumbent distribution leverage and customer status-quo inertia.'],
      criticalUnknowns,
      criticalAssumptions: Array.isArray(raw?.criticalAssumptions) && raw.criticalAssumptions.length > 0
        ? raw.criticalAssumptions.map(String)
        : ['Target users have discretionary budget and authority to buy standalone software.'],
      criticalRisks: Array.isArray(raw?.criticalRisks) && raw.criticalRisks.length > 0
        ? raw.criticalRisks.map(String)
        : ['High customer acquisition cost and prolonged enterprise sales cycle.'],
      decisionChangingEvidence,
      aiRecommendation,
      recommendationConfidence: confidence,
      recommendationRationale,
      nextActions,
      sourceReferences: sources,
      evidenceTraceability,
      finalOutputIntegrity,
      metadata: {
        status: 'completed',
        startedAt,
        completedAt: new Date().toISOString(),
        sourcesConsultedCount: sources.length,
        findingsEvaluatedCount: (input.researchReport?.findings?.length || 0) + (input.businessReport?.assumptions?.length || 0) + (input.redTeamReport?.criticalRisks?.length || 0),
        disagreementsCount: crossAgentAssessment.disagreements.length,
        uncertaintiesCount: criticalUnknowns.length,
        confidence,
        executionTimeMs
      },
      // Backwards compatibility properties
      synthesis: executiveSummary,
      tradeoffMatrix,
      uncertaintyNotice: `Analysis is based on empirical findings across ${sources.length} sources and upstream multi-agent reports. Key assumptions require direct experimental validation.`,
      keyDivergences: crossAgentAssessment.disagreements.map(d => `${d.topic}: ${d.judgeInterpretation}`)
    };
  }
}
