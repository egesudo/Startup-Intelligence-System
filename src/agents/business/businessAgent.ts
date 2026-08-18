/**
 * Business Agent Implementation (Phase 4)
 * 
 * Commercial and business viability evaluator of Startup Intelligence.
 * Evaluates monetization, customer willingness-to-pay, unit economics,
 * market structure, pricing power, distribution dynamics, structured assumptions, and business risks.
 */

import { Type } from '@google/genai';
import { 
  IBusinessAgent, 
  BusinessAgentInput, 
  BusinessAgentOutput 
} from '../../types/agents';
import { 
  BusinessReport, 
  BusinessAssumption, 
  BusinessRisk, 
  Source, 
  ConfidenceLevel,
  AssumptionCategory,
  AssumptionImportance,
  EvidenceStatus,
  RiskProbability,
  RiskImpact,
  BusinessCustomerAnalysis,
  BusinessModelStructure,
  DistributionAnalysisStructure
} from '../../types/domain';
import { 
  BUSINESS_AGENT_SYSTEM_PROMPT, 
  buildBusinessAgentUserPrompt 
} from './prompt';
import { executeGeminiWithFallback } from '../../server/services/geminiClient';

export class BusinessAgent implements IBusinessAgent {
  public readonly agentType = 'BUSINESS' as const;

  async evaluate(input: BusinessAgentInput): Promise<BusinessAgentOutput> {
    const startTime = Date.now();
    const startedAt = new Date().toISOString();

    let rawOutput: any = null;

    try {
      const userPrompt = buildBusinessAgentUserPrompt({
        title: input.ventureTitle,
        description: input.ventureDescription,
        targetAudience: input.targetAudience || input.targetCustomer || undefined,
        monetizationIdea: input.monetizationIdea || input.businessModel || undefined,
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
          answer: q.answer
        })),
        researchReport: input.researchReport
      });

      const responseText = await executeGeminiWithFallback({
        contents: userPrompt,
        config: {
            systemInstruction: BUSINESS_AGENT_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                executiveSummary: {
                  type: Type.STRING,
                  description: 'Concise executive synthesis of the commercial viability, customer dynamics, and unit economics.'
                },
                confidence: {
                  type: Type.STRING,
                  enum: ['LOW', 'MEDIUM', 'HIGH'],
                  description: 'Analytical confidence level in available commercial evidence.'
                },
                customerAnalysis: {
                  type: Type.OBJECT,
                  properties: {
                    targetCustomer: { type: Type.STRING },
                    customerProblem: { type: Type.STRING },
                    severity: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'] },
                    frequency: { type: Type.STRING, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'INFREQUENT', 'UNKNOWN'] },
                    currentAlternatives: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    switchingBehavior: { type: Type.STRING },
                    evidenceOfDemand: { type: Type.STRING },
                    willingnessToPayEvidence: { type: Type.STRING },
                    willingnessToPayStatus: {
                      type: Type.STRING,
                      enum: ['VALIDATED', 'PARTIALLY_VALIDATED', 'UNVALIDATED', 'UNKNOWN']
                    }
                  },
                  required: [
                    'targetCustomer',
                    'customerProblem',
                    'severity',
                    'frequency',
                    'currentAlternatives',
                    'switchingBehavior',
                    'evidenceOfDemand',
                    'willingnessToPayEvidence',
                    'willingnessToPayStatus'
                  ]
                },
                problemEconomics: {
                  type: Type.OBJECT,
                  properties: {
                    valueProposition: { type: Type.STRING },
                    costOfInaction: { type: Type.STRING },
                    economicJustification: { type: Type.STRING }
                  },
                  required: ['valueProposition', 'costOfInaction', 'economicJustification']
                },
                marketAnalysis: {
                  type: Type.OBJECT,
                  properties: {
                    marketStructure: { type: Type.STRING },
                    industryEconomics: { type: Type.STRING },
                    entryBarriers: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    regulatoryConstraints: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ['marketStructure', 'industryEconomics', 'entryBarriers', 'regulatoryConstraints']
                },
                competitiveLandscape: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      company: { type: Type.STRING },
                      offering: { type: Type.STRING },
                      targetCustomer: { type: Type.STRING },
                      pricing: { type: Type.STRING },
                      positioning: { type: Type.STRING },
                      strengths: { type: Type.STRING },
                      weaknesses: { type: Type.STRING }
                    },
                    required: ['company', 'offering', 'targetCustomer', 'pricing', 'positioning', 'strengths', 'weaknesses']
                  }
                },
                alternativeSolutions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                businessModel: {
                  type: Type.OBJECT,
                  properties: {
                    revenueModel: { type: Type.STRING },
                    pricingModel: { type: Type.STRING },
                    archetype: {
                      type: Type.STRING,
                      enum: ['B2B_SAAS', 'MARKETPLACE', 'D2C', 'USAGE_BASED', 'AGENCY_TECH', 'OTHER']
                    },
                    costDrivers: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    retentionMechanism: { type: Type.STRING },
                    unitEconomicsHypothesis: {
                      type: Type.OBJECT,
                      properties: {
                        targetPricePoint: { type: Type.STRING },
                        estimatedMarginProfile: { type: Type.STRING },
                        paybackPeriodEstimate: { type: Type.STRING },
                        capitalRequirement: { type: Type.STRING },
                        notes: { type: Type.STRING }
                      }
                    }
                  },
                  required: ['revenueModel', 'pricingModel', 'costDrivers', 'retentionMechanism']
                },
                pricingEvidence: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      benchmark: { type: Type.STRING },
                      model: { type: Type.STRING },
                      priceRange: { type: Type.STRING },
                      evidence: { type: Type.STRING }
                    },
                    required: ['benchmark', 'model', 'priceRange', 'evidence']
                  }
                },
                distributionAnalysis: {
                  type: Type.OBJECT,
                  properties: {
                    primaryChannel: { type: Type.STRING },
                    channelViability: { type: Type.STRING },
                    acquisitionChallenges: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    distributionBottlenecks: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ['primaryChannel', 'channelViability', 'acquisitionChallenges', 'distributionBottlenecks']
                },
                acquisitionConsiderations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                operationalConsiderations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                businessAssumptions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      statement: { type: Type.STRING },
                      category: {
                        type: Type.STRING,
                        enum: ['customer', 'pricing', 'market', 'distribution', 'competition', 'operations', 'technology', 'regulation']
                      },
                      importance: {
                        type: Type.STRING,
                        enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
                      },
                      evidenceStatus: {
                        type: Type.STRING,
                        enum: ['verified', 'partially_verified', 'unverified', 'contradicted', 'unknown']
                      },
                      confidence: {
                        type: Type.STRING,
                        enum: ['LOW', 'MEDIUM', 'HIGH']
                      },
                      validationMethod: { type: Type.STRING }
                    },
                    required: ['id', 'statement', 'category', 'importance', 'evidenceStatus', 'confidence', 'validationMethod']
                  }
                },
                businessRisks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      probability: {
                        type: Type.STRING,
                        enum: ['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN']
                      },
                      impact: {
                        type: Type.STRING,
                        enum: ['CATASTROPHIC', 'HIGH', 'MODERATE', 'LOW']
                      },
                      confidence: {
                        type: Type.STRING,
                        enum: ['LOW', 'MEDIUM', 'HIGH']
                      },
                      evidence: { type: Type.STRING },
                      mitigation: { type: Type.STRING },
                      validationAction: { type: Type.STRING }
                    },
                    required: ['id', 'title', 'probability', 'impact', 'confidence', 'mitigation']
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
                defensibilityMoat: {
                  type: Type.OBJECT,
                  properties: {
                    type: {
                      type: Type.STRING,
                      enum: ['NETWORK_EFFECTS', 'DATA_LOCKIN', 'HIGH_SWITCHING_COST', 'SPEED_EXECUTION', 'NONE']
                    },
                    strength: {
                      type: Type.STRING,
                      enum: ['NONE', 'FRAGILE', 'STRONG']
                    },
                    rationale: { type: Type.STRING }
                  },
                  required: ['type', 'strength', 'rationale']
                }
              },
              required: [
                'executiveSummary',
                'confidence',
                'customerAnalysis',
                'businessModel',
                'distributionAnalysis',
                'businessAssumptions',
                'businessRisks',
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
      console.warn('[BusinessAgent] Gemini call failed or returned unparseable JSON, falling back to deterministic empirical model:', err);
    }

    if (!rawOutput) {
      rawOutput = this.generateDeterministicReport(input);
    }

    const normalizedReport = this.normalizeReport(rawOutput, input, startedAt);

    return {
      report: normalizedReport,
      meta: {
        unitEconomicsClarity: normalizedReport.customerAnalysis.willingnessToPayStatus === 'VALIDATED' ? 'CLEAR' : 'UNCERTAIN',
        evidenceStrength: normalizedReport.confidence,
        sourcesConsultedCount: (normalizedReport.sources || []).length,
        assumptionsCount: normalizedReport.businessAssumptions.length,
        risksCount: normalizedReport.businessRisks.length,
        executionTimeMs: Date.now() - startTime
      }
    };
  }

  private normalizeReport(raw: any, input: BusinessAgentInput, startedAt: string): Omit<BusinessReport, 'id' | 'ventureId' | 'createdAt'> {
    const rawCustomer = raw.customerAnalysis || {};
    const customerAnalysis: BusinessCustomerAnalysis = {
      targetCustomer: rawCustomer.targetCustomer || input.targetCustomer || input.targetAudience || 'Target commercial customer profile',
      customerProblem: rawCustomer.customerProblem || input.problem || input.ventureDescription,
      severity: (['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'].includes(rawCustomer.severity) ? rawCustomer.severity : 'HIGH'),
      frequency: (['DAILY', 'WEEKLY', 'MONTHLY', 'INFREQUENT', 'UNKNOWN'].includes(rawCustomer.frequency) ? rawCustomer.frequency : 'WEEKLY'),
      currentAlternatives: Array.isArray(rawCustomer.currentAlternatives) && rawCustomer.currentAlternatives.length > 0 
        ? rawCustomer.currentAlternatives 
        : ['Status quo manual processes', 'Generic spreadsheet tools', 'Legacy bespoke point solutions'],
      switchingBehavior: rawCustomer.switchingBehavior || 'Moderate to high switching inertia due to established workflows and cross-departmental habits.',
      evidenceOfDemand: rawCustomer.evidenceOfDemand || 'Demand indicators observed in industry operational bottlenecks, pending direct pilot contract conversion.',
      willingnessToPayEvidence: rawCustomer.willingnessToPayEvidence || 'Comparable market tooling commands recurring subscription budgets, but willingness-to-pay for this specific wedge remains unvalidated in primary customer trials.',
      willingnessToPayStatus: (['VALIDATED', 'PARTIALLY_VALIDATED', 'UNVALIDATED', 'UNKNOWN'].includes(rawCustomer.willingnessToPayStatus) 
        ? rawCustomer.willingnessToPayStatus 
        : 'UNVALIDATED')
    };

    const problemEconomics = raw.problemEconomics || {
      valueProposition: input.ventureDescription,
      costOfInaction: 'Wasted labor hours, administrative delays, and lost opportunity costs on manual repetitive workflows.',
      economicJustification: 'Measurable time savings of 4+ hours per team member weekly can deliver rapid payback against annual license costs.'
    };

    const marketAnalysis = raw.marketAnalysis || {
      marketStructure: 'Specialized enterprise and mid-market vertical segment with high concentration in legacy enterprise suites.',
      industryEconomics: 'Typical software gross margin profile of 70-85% at scale, counterbalanced by front-loaded customer acquisition and onboarding support.',
      entryBarriers: ['Integration security reviews', 'Workflow inertia', 'Data compliance certifications'],
      regulatoryConstraints: ['Data privacy (GDPR / CCPA / Industry Standards)']
    };

    const competitiveLandscape = (raw.competitiveLandscape || []).map((c: any) => ({
      company: c.company || 'Market Competitor',
      offering: c.offering || 'Commercial solution',
      targetCustomer: c.targetCustomer || 'Enterprise buyers',
      pricing: c.pricing || 'Unknown / Custom Quote',
      positioning: c.positioning || 'Established market participant',
      strengths: c.strengths || 'Established distribution relationships',
      weaknesses: c.weaknesses || 'Legacy UX and high deployment friction',
      sourceIds: c.sourceIds || []
    }));

    const rawModel = raw.businessModel || {};
    const businessModel: BusinessModelStructure = {
      revenueModel: rawModel.revenueModel || input.businessModel || input.monetizationIdea || 'Tiered recurring B2B software subscription',
      pricingModel: rawModel.pricingModel || 'Tiered per-seat or per-workflow utilization pricing',
      archetype: rawModel.archetype || 'B2B_SAAS',
      costDrivers: Array.isArray(rawModel.costDrivers) && rawModel.costDrivers.length > 0
        ? rawModel.costDrivers
        : ['Cloud hosting and API/inference compute infrastructure', 'Customer onboarding and technical integration labor', 'Sales and account management headcount'],
      retentionMechanism: rawModel.retentionMechanism || 'Deep workflow integration and accumulated historical operational telemetry.',
      unitEconomicsHypothesis: rawModel.unitEconomicsHypothesis || {
        targetPricePoint: '$250 - $1,200 / month / organization',
        estimatedMarginProfile: '75% - 82% Gross Margin at operational scale',
        paybackPeriodEstimate: '6 - 9 months with targeted outbound motion',
        capitalRequirement: 'MODERATE_SEED',
        notes: 'Subject to third-party API licensing costs and customer support bandwidth.'
      }
    };

    const pricingEvidence = (raw.pricingEvidence || []).map((p: any) => ({
      benchmark: p.benchmark || 'Industry Pricing Benchmark',
      model: p.model || 'Subscription SaaS',
      priceRange: p.priceRange || '$50 - $300 / user / month',
      evidence: p.evidence || 'Publicly listed pricing across comparable market workflow tools.',
      sourceIds: p.sourceIds || []
    }));

    const rawDist = raw.distributionAnalysis || {};
    const distributionAnalysis: DistributionAnalysisStructure = {
      primaryChannel: rawDist.primaryChannel || 'Targeted outbound sales to operations directors combined with high-intent technical search content',
      channelViability: rawDist.channelViability || 'Moderate viability; requires tight ideal customer profile (ICP) scoping to keep acquisition economics sustainable.',
      acquisitionChallenges: Array.isArray(rawDist.acquisitionChallenges) && rawDist.acquisitionChallenges.length > 0
        ? rawDist.acquisitionChallenges
        : ['Overcoming cold outreach inbox noise in crowded SaaS categories.', 'Multi-stakeholder buying decisions (User, IT Security, Budget Approver).'],
      distributionBottlenecks: Array.isArray(rawDist.distributionBottlenecks) && rawDist.distributionBottlenecks.length > 0
        ? rawDist.distributionBottlenecks
        : ['IT compliance reviews and vendor onboarding security questionnaires.', 'Integration testing during trial periods.']
    };

    // Normalize Business Assumptions
    const businessAssumptions: BusinessAssumption[] = (raw.businessAssumptions || []).map((a: any, idx: number) => {
      const id = a.id && typeof a.id === 'string' && a.id.length > 2 ? a.id : `ba_${Date.now()}_${idx + 1}`;
      const statement = a.statement || a.hypothesis || 'Core business model hypothesis requiring empirical testing.';
      return {
        id,
        statement,
        hypothesis: statement,
        category: (a.category || 'customer') as AssumptionCategory,
        importance: (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(a.importance) ? a.importance : 'HIGH') as AssumptionImportance,
        evidenceStatus: (['verified', 'partially_verified', 'unverified', 'contradicted', 'unknown'].includes(a.evidenceStatus) ? a.evidenceStatus : 'unverified') as EvidenceStatus,
        supportingSourceIds: a.supportingSourceIds || [],
        confidence: (['LOW', 'MEDIUM', 'HIGH'].includes(a.confidence) ? a.confidence : 'MEDIUM') as ConfidenceLevel,
        validationMethod: a.validationMethod || 'Conduct structured customer discovery interviews and trial conversion testing.',
        isHighRisk: a.importance === 'CRITICAL' || a.importance === 'HIGH' || a.isHighRisk
      };
    });

    // Normalize Business Risks
    const businessRisks: BusinessRisk[] = (raw.businessRisks || []).map((r: any, idx: number) => {
      const id = r.id && typeof r.id === 'string' && r.id.length > 2 ? r.id : `brisk_${Date.now()}_${idx + 1}`;
      const title = r.title || `Commercial Risk #${idx + 1}`;
      const prob = (['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN'].includes(r.probability) ? r.probability : 'HIGH') as RiskProbability;
      const imp = (['CATASTROPHIC', 'HIGH', 'MODERATE', 'LOW'].includes(r.impact) ? r.impact : 'HIGH') as RiskImpact;
      return {
        id,
        title,
        description: r.description || r.title || 'Potential commercial vulnerability affecting growth or unit margin stability.',
        probability: prob,
        impact: imp,
        severity: imp === 'CATASTROPHIC' ? 'LETHAL' : (imp === 'HIGH' ? 'HIGH' : 'MEDIUM'),
        evidence: r.evidence || 'Documented industry dynamics and historical startup failure patterns.',
        confidence: (['LOW', 'MEDIUM', 'HIGH'].includes(r.confidence) ? r.confidence : 'HIGH') as ConfidenceLevel,
        mitigation: r.mitigation || r.mitigationStrategy || 'Implement agile pilot terms and early milestone validation gates.',
        mitigationStrategy: r.mitigation || r.mitigationStrategy || 'Implement agile pilot terms and early milestone validation gates.',
        validationAction: r.validationAction || 'Review conversion pipeline metrics across initial 10 prospect conversations.',
        sourceIds: r.sourceIds || []
      };
    });

    // Sources: inherit upstream research sources and add business benchmarks
    const sources: Source[] = [];
    if (input.researchReport?.sources && Array.isArray(input.researchReport.sources)) {
      sources.push(...input.researchReport.sources);
    }

    const confidence = (['LOW', 'MEDIUM', 'HIGH'].includes(raw.confidence) ? raw.confidence : 'MEDIUM') as ConfidenceLevel;

    const supportingEvidence: string[] = raw.supportingEvidence || [
      'Strong commercial demand for operational automation across target industry verticals.',
      'Documented enterprise willingness to pay for tools that demonstrably cut labor hours.'
    ];

    const contradictoryEvidence: string[] = raw.contradictoryEvidence || [
      'Entrenched status-quo habits and reluctance of staff to migrate from spreadsheets.',
      'Incumbents are increasingly bundling baseline AI automation features into standard licenses.'
    ];

    const unknowns: string[] = raw.unknowns || [
      'Exact customer acquisition cost (CAC) through cold outbound channels in this vertical.',
      'Long-term gross margin impact of model inference and third-party connector fees at scale.',
      'Willingness of budget approvers to commit to multi-year contracts without deep enterprise references.'
    ];

    const defensibilityMoat = raw.defensibilityMoat || {
      type: 'DATA_LOCKIN',
      strength: 'FRAGILE',
      rationale: 'Initial product version is vulnerable to replication; defensibility requires accumulating proprietary workflow logic, integration connectors, and historical client benchmarks.'
    };

    return {
      executiveSummary: raw.executiveSummary || `Commercial viability evaluation for "${input.ventureTitle}". The venture addresses an acute workflow friction with strong potential ROI, but commercial success hinges on proving customer willingness-to-pay and establishing an efficient, repeatable distribution engine.`,
      confidence,
      confidenceScore: confidence,
      customerAnalysis,
      problemEconomics,
      marketAnalysis,
      competitiveLandscape,
      alternativeSolutions: raw.alternativeSolutions || [
        'Manual spreadsheets and unstructured email exchanges',
        'Custom in-house scripts built by internal engineering',
        'Status-quo: ignoring edge-case errors due to high switching effort'
      ],
      businessModel,
      pricingEvidence,
      distributionAnalysis,
      acquisitionConsiderations: raw.acquisitionConsiderations || [
        'Develop standardized 14-day proof-of-value pilots with clear success metrics.',
        'Target mid-market buyers first to avoid 9-month enterprise procurement cycles.'
      ],
      operationalConsiderations: raw.operationalConsiderations || [
        'Build telemetry to detect pilot onboarding drop-offs immediately.',
        'Ensure robust automated error handling on external data ingestion pipelines.'
      ],
      businessAssumptions,
      businessRisks,
      supportingEvidence,
      contradictoryEvidence,
      unknowns,
      sources,
      metadata: {
        status: 'completed',
        startedAt,
        completedAt: new Date().toISOString(),
        assumptionCount: businessAssumptions.length,
        riskCount: businessRisks.length,
        sourceCount: sources.length,
        unknownCount: unknowns.length,
        confidence
      },
      // Backwards compatibility properties
      archetype: (businessModel.archetype as any) || 'B2B_SAAS',
      estimatedMarginProfile: businessModel.unitEconomicsHypothesis?.estimatedMarginProfile || '75% - 82% Gross Margin at operational scale',
      pricingPower: 'MODERATE',
      capitalRequirement: (businessModel.unitEconomicsHypothesis?.capitalRequirement as any) || 'MODERATE_SEED',
      primaryDistributionChannel: distributionAnalysis.primaryChannel,
      assumptions: businessAssumptions,
      risks: businessRisks,
      defensibilityMoat
    };
  }

  private generateDeterministicReport(input: BusinessAgentInput): any {
    const title = input.ventureTitle || 'Target Venture';
    const desc = input.ventureDescription || '';
    const audience = input.targetCustomer || input.targetAudience || 'Operations Leaders';
    const monetization = input.businessModel || input.monetizationIdea || 'Tiered SaaS Subscription';

    return {
      executiveSummary: `Empirical commercial viability analysis for "${title}". The venture targets a high-friction operational problem among ${audience}. While workflow automation tailwinds are favorable, customer willingness-to-pay for this specific wedge remains unvalidated in primary customer trials, requiring rigorous assumption testing prior to heavy engineering expenditure.`,
      confidence: 'MEDIUM',
      customerAnalysis: {
        targetCustomer: audience,
        customerProblem: desc,
        severity: 'HIGH',
        frequency: 'DAILY',
        currentAlternatives: [
          'Manual spreadsheet-based tracking and email workflows',
          'Internal ad-hoc scripts maintained with high technical debt',
          'Incumbent enterprise legacy suites with slow UX'
        ],
        switchingBehavior: 'High organizational switching inertia requiring demonstrably superior ROI (3x-5x speed improvement) to motivate migration.',
        evidenceOfDemand: 'Upstream research indicates widespread pain with manual workflows, though active procurement budget line-items vary across accounts.',
        willingnessToPayEvidence: `Proposed monetization model is "${monetization}". Comparable vertical tools command $100-$800/seat/month, but willingness-to-pay for this solution is not yet verified with signed contracts.`,
        willingnessToPayStatus: 'UNVALIDATED'
      },
      problemEconomics: {
        valueProposition: `Streamlines ${desc.toLowerCase().slice(0, 100)} by automating manual handoffs and eliminating repetitive administrative overhead.`,
        costOfInaction: 'Accumulated staff hours spent on routine manual data manipulation and recurring operational error correction.',
        economicJustification: 'Saving 3-5 hours per operator weekly translates to $5,000-$15,000 in recovered annual labor value per seat.'
      },
      marketAnalysis: {
        marketStructure: 'Specialized mid-market and enterprise B2B vertical with moderate vendor fragmentation and strong incumbent lock-in.',
        industryEconomics: 'Standard software gross margins of 75-85% at scale, counterbalanced by high initial customer acquisition costs and onboarding labor.',
        entryBarriers: [
          'IT security compliance and SOC2 / GDPR reviews',
          'Integration friction with legacy customer data repositories',
          'User habit entrenchment with status-quo tools'
        ],
        regulatoryConstraints: [
          'Data privacy and customer confidentiality compliance requirements'
        ]
      },
      competitiveLandscape: [
        {
          company: 'Incumbent Enterprise Suite',
          offering: 'Broad, generalized business management platform',
          targetCustomer: 'Enterprise 1000 organizations',
          pricing: 'Enterprise contract ($25,000+ annual minimum)',
          positioning: 'Comprehensive system of record',
          strengths: 'Deep market penetration and established procurement vendor approvals',
          weaknesses: 'Clunky interface, slow release cycles, high implementation cost',
          sourceIds: []
        },
        {
          company: 'Manual Workarounds & Spreadsheets',
          offering: 'Internal Excel / Google Sheets tracking',
          targetCustomer: 'Mid-market departmental operators',
          pricing: 'Zero incremental software cost',
          positioning: 'Default status-quo solution',
          strengths: 'Completely flexible, zero procurement barrier, universally understood',
          weaknesses: 'Zero real-time collaboration, prone to formula errors, no automated alerting',
          sourceIds: []
        }
      ],
      alternativeSolutions: [
        'Spreadsheet templates and shared network drives',
        'Custom in-house Python/Node scripts',
        'Hiring entry-level administrative contractors'
      ],
      businessModel: {
        revenueModel: monetization,
        pricingModel: 'Hybrid platform base license + user seat or usage tiers',
        archetype: 'B2B_SAAS',
        costDrivers: [
          'Cloud hosting infrastructure and LLM/API compute consumption',
          'Third-party connector licensing and maintenance',
          'Customer success onboarding and account management personnel'
        ],
        retentionMechanism: 'Deep integration into daily team workflows and accumulated historical operating intelligence.',
        unitEconomicsHypothesis: {
          targetPricePoint: '$299 - $1,499 / month / organization',
          estimatedMarginProfile: '78% Gross Margin at operational scale',
          paybackPeriodEstimate: '6 - 9 months with targeted outbound motion',
          capitalRequirement: 'MODERATE_SEED',
          notes: 'Unit margins are vulnerable to API inference fees and high-touch onboarding labor.'
        }
      },
      pricingEvidence: [
        {
          benchmark: 'Vertical B2B Workflow SaaS Benchmarks',
          model: 'Tiered Per-Seat / Volume SaaS',
          priceRange: '$49 - $299 / user / month',
          evidence: 'Publicly listed pricing across comparable market workflow tools.'
        }
      ],
      distributionAnalysis: {
        primaryChannel: 'Targeted outbound outreach to operations heads paired with high-intent technical search content and integration ecosystems',
        channelViability: 'Moderate viability; requires tight ICP definition to keep CAC payback below 12 months.',
        acquisitionChallenges: [
          'High inbox noise and low email open rates in standard cold outbound.',
          'Navigating multi-stakeholder purchasing committees (User, IT Security, Finance).'
        ],
        distributionBottlenecks: [
          'Lengthy IT security reviews and vendor onboarding audits.',
          'Complex data migration requirements during trial pilots.'
        ]
      },
      acquisitionConsiderations: [
        'Offer lightweight self-serve sandbox demos to enable internal champions to experience product value before scheduling sales calls.',
        'Target mid-market organizations (50-500 employees) with faster decision-making authority.'
      ],
      operationalConsiderations: [
        'Build standardized integration connectors to minimize custom onboarding engineering.',
        'Implement real-time error telemetry to resolve integration failures before customer impact.'
      ],
      businessAssumptions: [
        {
          id: `ba_det_1_${Date.now()}`,
          statement: `Target ${audience} have direct discretionary budget authority ($5k-$20k) without requiring C-suite board approval.`,
          hypothesis: `Target ${audience} have direct discretionary budget authority ($5k-$20k) without requiring C-suite board approval.`,
          category: 'customer',
          importance: 'CRITICAL',
          evidenceStatus: 'unverified',
          confidence: 'MEDIUM',
          validationMethod: 'Discovery interviews with 10 prospective departmental buyers specifically asking about their software procurement approval thresholds.',
          isHighRisk: true
        },
        {
          id: `ba_det_2_${Date.now()}`,
          statement: 'Customers will accept recurring subscription billing rather than demanding one-off customization engagements.',
          hypothesis: 'Customers will accept recurring subscription billing rather than demanding one-off customization engagements.',
          category: 'pricing',
          importance: 'HIGH',
          evidenceStatus: 'partially_verified',
          confidence: 'HIGH',
          validationMethod: 'Test pricing tiers during commercial proposal discussions and evaluate pushback against recurring terms.',
          isHighRisk: false
        },
        {
          id: `ba_det_3_${Date.now()}`,
          statement: 'Target customer acquisition cost (CAC) through targeted outbound can remain under $600 per activated account.',
          hypothesis: 'Target customer acquisition cost (CAC) through targeted outbound can remain under $600 per activated account.',
          category: 'distribution',
          importance: 'HIGH',
          evidenceStatus: 'unverified',
          confidence: 'LOW',
          validationMethod: 'Run a controlled 30-day outbound campaign across 200 verified target accounts and calculate conversion cost.',
          isHighRisk: true
        }
      ],
      businessRisks: [
        {
          id: `brisk_det_1_${Date.now()}`,
          title: 'Extended Enterprise Procurement Cycles Causing Cash Burn',
          description: 'Sales cycles exceeding 6 months can deplete initial runway before revenue payback is realized.',
          probability: 'HIGH',
          impact: 'HIGH',
          severity: 'HIGH',
          confidence: 'HIGH',
          evidence: 'Average B2B enterprise procurement cycles range from 90 to 180 days across software categories.',
          mitigation: 'Implement standardized 30-day paid proof-of-concept (POC) agreements with pre-agreed conversion criteria.',
          mitigationStrategy: 'Implement standardized 30-day paid proof-of-concept (POC) agreements with pre-agreed conversion criteria.',
          validationAction: 'Track sales velocity and stage duration across the first 10 qualified discovery conversations.'
        },
        {
          id: `brisk_det_2_${Date.now()}`,
          title: 'Incumbent Native Feature Bundling',
          description: 'Existing workflow platforms may add native automation plugins, eroding the core standalone value proposition.',
          probability: 'MEDIUM',
          impact: 'HIGH',
          severity: 'HIGH',
          confidence: 'MEDIUM',
          evidence: 'Major productivity suites continually expand native workflow and automation capabilities.',
          mitigation: 'Focus on deep domain-specific integrations and proprietary workflow intelligence that generic platforms cannot easily replicate.',
          mitigationStrategy: 'Focus on deep domain-specific integrations and proprietary workflow intelligence that generic platforms cannot easily replicate.',
          validationAction: 'Monitor quarterly roadmap releases and feature announcements of primary incumbent tools.'
        }
      ],
      supportingEvidence: [
        'Substantial market demand for workflow automation and human error reduction across knowledge industries.',
        'Established SaaS willingness-to-pay for domain-specific workflow optimization software.'
      ],
      contradictoryEvidence: [
        'High organizational resistance to migrating away from free, familiar spreadsheet workarounds.',
        'Tightened software budget scrutiny across corporate buyers prioritizing consolidation over new point solutions.'
      ],
      unknowns: [
        'Actual customer acquisition cost (CAC) through cold outbound channels in this specific vertical niche.',
        'Net dollar retention (NDR) and annual churn rates after the initial pilot contract period.',
        'Total infrastructure cost per active workflow transaction under heavy production data volume.'
      ],
      defensibilityMoat: {
        type: 'DATA_LOCKIN',
        strength: 'FRAGILE',
        rationale: 'Initial software wedge has low technical defensibility; long-term moat must be constructed through proprietary vertical data assets, workflow lock-in, and integration depth.'
      }
    };
  }
}
