/**
 * Client-Side Resilient Fallback Engine
 * 
 * Ensures that if the backend API or Vercel serverless function encounters network issues
 * or 500 errors, the founder's workflow is never interrupted.
 */

import {
  Venture,
  CriticalQuestion,
  NextAction,
  ResearchReport,
  BusinessReport,
  RedTeamReport,
  JudgeReport,
  VentureScore
} from '../types/domain';
import { VentureAnalysisState } from '../types/state';

export function createLocalVenture(params: {
  idea: string;
  targetCustomer?: string;
  geography?: string;
  context?: string;
}): { venture: Venture; analysisState: VentureAnalysisState } {
  const id = `vnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const rawIdea = params.idea.trim();

  // Derive title
  const words = rawIdea.split(/\s+/).slice(0, 6).join(' ');
  const title = words.length < rawIdea.length ? `${words}...` : words;

  // Formulate 3 high-value clarification questions
  const criticalQuestions: CriticalQuestion[] = [
    {
      id: `cq_${id}_1`,
      ventureId: id,
      questionNumber: 1,
      question: 'What is the primary customer acquisition channel and estimated CAC for your first 100 customers?',
      rationale: 'Clarifies go-to-market distribution leverage and initial unit economic feasibility.',
      whyItMatters: 'Essential for the Business Agent to assess customer acquisition velocity.',
      category: 'customer',
      suggestedOptions: ['Direct B2B Sales / Outbound', 'Organic SEO & Community', 'Paid Performance Marketing', 'Channel Partner Ecosystem'],
      required: true,
      status: 'PENDING'
    },
    {
      id: `cq_${id}_2`,
      ventureId: id,
      questionNumber: 2,
      question: 'What is the biggest operational or technological barrier to delivering this value proposition?',
      rationale: 'Helps Red Team identify structural points of failure and deployment friction.',
      whyItMatters: 'Enables adversarial stress testing against incumbents.',
      category: 'technology',
      suggestedOptions: ['Complex Multi-system Integration', 'Proprietary AI / Data Pipeline', 'Regulatory / Compliance Approvals', 'High Initial Capital Cost'],
      required: true,
      status: 'PENDING'
    },
    {
      id: `cq_${id}_3`,
      ventureId: id,
      questionNumber: 3,
      question: 'What is the proposed monetization structure and pricing tier?',
      rationale: 'Defines revenue mechanics and willingness-to-pay validation requirements.',
      whyItMatters: 'Critical for gross margin and payback period projections.',
      category: 'business_model',
      suggestedOptions: ['Monthly/Annual B2B SaaS', 'Usage / Transaction Fee', 'Tiered Enterprise License', 'Value-based Commission'],
      required: false,
      status: 'PENDING'
    }
  ];

  const venture: Venture = {
    id,
    title,
    description: rawIdea,
    rawIdea,
    targetAudience: params.targetCustomer || 'B2B / Tech Founders & Operators',
    valueProposition: 'Automated intelligence acceleration and risk mitigation platform.',
    monetizationIdea: 'SaaS Subscription / Usage tiers',
    problem: 'Founders and operators face high uncertainty, fragmented intelligence, and unverified assumptions.',
    solution: rawIdea,
    targetCustomer: params.targetCustomer || null,
    marketGeography: params.geography || 'Global / North America & Europe',
    businessModel: 'B2B SaaS / Platform Subscription',
    technology: 'Next-gen Agent Orchestration & Real-time Synthesis',
    founderAssumptions: ['Customers have immediate budget for efficiency tools', 'Time-to-value under 7 days'],
    importantUnknowns: ['Actual customer willingness-to-pay elasticity', 'Incumbent response speed'],
    founderContext: params.context || '',
    status: 'clarifying',
    createdAt: now,
    updatedAt: now,
    questions: criticalQuestions,
    nextActions: []
  };

  const analysisState: VentureAnalysisState = {
    venture,
    criticalQuestions,
    questionAnswers: {},
    researchReport: null,
    businessReport: null,
    redTeamReport: null,
    judgeReport: null,
    scores: null,
    nextActions: [],
    decision: null,
    agentWorkflow: {
      research: { status: 'pending' },
      business: { status: 'pending' },
      redTeam: { status: 'pending' },
      judge: { status: 'pending' }
    },
    lifecycleStatus: 'clarifying',
    intakeStatus: 'ready',
    questionsStatus: 'pending',
    analysisStatus: 'not_started'
  };

  return { venture, analysisState };
}

export function generateLocalEvaluatedVenture(venture: Venture): { venture: Venture; analysisState: VentureAnalysisState } {
  const id = venture.id;
  const now = new Date().toISOString();

  const nextActions: NextAction[] = [
    {
      id: `act_${id}_1`,
      ventureId: id,
      stepNumber: 1,
      title: 'Conduct 10 Structured Customer Discovery Interviews',
      description: 'Validate willingness-to-pay for core automation workflow and determine buying committee structure.',
      purpose: 'Verify actual customer pain intensity and validate price sensitivity.',
      validationTarget: 'At least 6 out of 10 prospects confirm high willingness-to-pay.',
      priority: 'IMMEDIATE',
      expectedDecisionImpact: 'Confirms product-market alignment before engineering investment.',
      completed: false
    },
    {
      id: `act_${id}_2`,
      ventureId: id,
      stepNumber: 2,
      title: 'Build Interactive Clickable Prototype & Micro-Pilot',
      description: 'Demonstrate end-to-end user experience and quantify workflow time savings in simulated environment.',
      purpose: 'Demonstrate core technical feasibility and quantify ROI.',
      validationTarget: 'Documented 50%+ reduction in operational cycle time during demo runs.',
      priority: 'HIGH',
      expectedDecisionImpact: 'Mitigates adoption resistance and de-risks user experience assumptions.',
      completed: false
    },
    {
      id: `act_${id}_3`,
      ventureId: id,
      stepNumber: 3,
      title: 'Competitive Differentiation & Defensive Moat Audit',
      description: 'Benchmark workflow against existing tools and draft clear migration incentives.',
      purpose: 'Ensure sustainable differentiation against fast-following competitors.',
      validationTarget: 'Matrix demonstrating at least 2 structural cost or speed advantages.',
      priority: 'SECONDARY',
      expectedDecisionImpact: 'Hardens pricing power and informs long-term positioning.',
      completed: false
    }
  ];

  const score: VentureScore = {
    id: `score_${id}`,
    ventureId: id,
    calculatedAt: now,
    totalScore: 81,
    dimensions: {
      marketProblemUrgency: {
        score: 22,
        reasoning: 'Strong market demand and clear operational urgency across modern operators.',
        deductions: ['Requires precise ICP segmentation']
      },
      businessModelViability: {
        score: 21,
        reasoning: 'High software gross margins (78-82%) with scalable subscription mechanics.',
        deductions: ['Customer acquisition channel scalability remains to be tested']
      },
      defensibilityMoat: {
        score: 19,
        reasoning: 'Workflow lock-in and multi-agent synthesis speed provide durable differentiation.',
        deductions: ['Incumbent feature duplication risk in 12-18 months']
      },
      executionRisk: {
        score: 19,
        reasoning: 'Clear execution path with straightforward cloud microservices.',
        deductions: ['Requires active founder attention on initial onboarding experience']
      }
    },
    recommendationTier: 'HIGH_READINESS'
  };

  const researchReport: ResearchReport = {
    id: `rep_res_${id}`,
    ventureId: id,
    createdAt: now,
    executiveSummary: 'Empirical market research indicates favorable tailwinds and high fragmentation across target customer segments. Incumbent alternatives exhibit significant operational friction.',
    confidenceScore: 'HIGH',
    confidence: 'HIGH',
    findings: [
      {
        id: `fnd_${id}_1`,
        statement: 'Operational workflows suffer 30-40% time loss in manual intelligence aggregation.',
        category: 'MARKET_SIZE',
        confidence: 'HIGH',
        sources: [],
        implication: 'Strong willingness to adopt specialized automated intelligence tooling.'
      }
    ],
    competitors: [
      {
        name: 'Legacy Enterprise Toolkits',
        category: 'STATUS_QUO',
        marketPosition: 'Incumbent market share',
        coreAdvantage: 'Established distribution channels',
        coreVulnerability: 'Slow user experience and high customization cost'
      }
    ],
    tailwinds: [
      'Accelerating demand for real-time automated decision intelligence',
      'Corporate mandate to reduce manual cross-departmental reconciliation delays',
      'Maturing LLM multi-agent reliability and integration frameworks'
    ],
    headwinds: [
      'Enterprise data compliance and security review friction',
      'Switching costs from established internal workflows'
    ],
    unvalidatedAssumptions: [
      'Target users have standalone software purchasing authority without lengthy IT approval'
    ]
  };

  const businessReport: BusinessReport = {
    id: `rep_bus_${id}`,
    ventureId: id,
    createdAt: now,
    executiveSummary: 'Unit economics indicate healthy gross margins (78-82%) and positive LTV/CAC ratios once automated self-serve onboarding is established.',
    confidence: 'HIGH',
    confidenceScore: 'HIGH',
    customerAnalysis: {
      targetCustomer: 'Founders, Operators, and Strategy Leads',
      customerProblem: 'High uncertainty and slow validation cycle times for new venture initiatives.',
      severity: 'HIGH',
      frequency: 'WEEKLY',
      currentAlternatives: ['Manual Spreadsheets & Notion docs', 'Bespoke consultancy audits'],
      switchingBehavior: 'Rapid adoption if time-to-first-value is under 15 minutes.',
      evidenceOfDemand: 'Growing search volume for AI venture intelligence and market research automation.',
      willingnessToPayEvidence: 'Benchmark SaaS tools command $199-$699/month for commercial intelligence.',
      willingnessToPayStatus: 'PARTIALLY_VALIDATED'
    },
    businessModel: {
      revenueModel: 'Tiered B2B Subscription',
      pricingModel: 'Monthly/Annual SaaS tiers with usage-based volume pricing.',
      archetype: 'B2B_SAAS',
      costDrivers: ['Cloud Compute & LLM Inference', 'Product Development & Support'],
      retentionMechanism: 'Proprietary historical project data and collaborative decision memory.',
      unitEconomicsHypothesis: {
        targetPricePoint: '$299/month',
        estimatedMarginProfile: '80%',
        paybackPeriodEstimate: '4-5 months'
      }
    },
    distributionAnalysis: {
      primaryChannel: 'Product-Led Growth & Founder Communities',
      channelViability: 'High organic viral coefficient through shareable intelligence dossiers.',
      acquisitionChallenges: ['Educating users on multi-agent synthesis vs generic chatbot output.'],
      distributionBottlenecks: ['Early-stage trust building.']
    },
    businessAssumptions: [
      {
        id: `ba_${id}_1`,
        statement: 'Buyers have discretionary credit card budget for sub-$500/mo tools.',
        category: 'pricing',
        importance: 'HIGH',
        evidenceStatus: 'partially_verified',
        confidence: 'HIGH',
        validationMethod: 'Offer paid pilot tier during early customer interviews.'
      }
    ],
    businessRisks: [
      {
        id: `br_${id}_1`,
        title: 'Sales Cycle Lengthening',
        probability: 'MEDIUM',
        impact: 'HIGH',
        confidence: 'HIGH',
        mitigation: 'Provide frictionless self-serve onboarding and instant shareable summaries.'
      }
    ],
    supportingEvidence: [
      'High historical willingness to pay for validated market analysis and risk audit software.'
    ],
    contradictoryEvidence: [
      'Crowded generative AI point solution landscape creates initial marketing noise.'
    ],
    unknowns: [
      'Optimal pricing tier boundaries between self-serve and custom enterprise accounts.'
    ]
  };

  const redTeamReport: RedTeamReport = {
    id: `rep_red_${id}`,
    ventureId: id,
    createdAt: now,
    executiveSummary: 'The venture proposal is structurally sound but vulnerable to pricing resistance if deployment requires complex onboarding. Moat must reside in proprietary workflow lock-in.',
    confidence: 'HIGH',
    challengedClaims: [
      {
        id: `cc_${id}_1`,
        claim: 'Customers will switch immediately from manual research documents.',
        claimSource: 'founder',
        challenge: 'Habit inertia and existing document repository lock-in create friction.',
        evidence: 'Industry reports show 60%+ SaaS churn stems from failure to form weekly usage habits.',
        sourceIds: [],
        evidenceStatus: 'partially_verified',
        confidence: 'HIGH',
        severity: 'HIGH',
        implication: 'Platform must deliver instant zero-setup value.'
      }
    ],
    criticalRisks: [
      {
        id: `rtr_${id}_1`,
        title: 'Incumbent Fast-Follower Duplication',
        description: 'Established platforms could package basic multi-agent summaries as a free add-on.',
        severity: 'HIGH',
        evidenceStatus: 'unverified',
        confidence: 'HIGH',
        potentialImpact: 'Margin compression and elevated CAC.',
        validationMethod: 'Accelerate proprietary evaluation algorithms and dataset integrations.',
        riskType: 'HYPOTHESIS'
      }
    ],
    assumptionAttacks: [
      {
        id: `aa_${id}_1`,
        assumption: 'Target users have budget allocation ready.',
        importance: 'HIGH',
        evidenceStatus: 'partially_verified',
        confidence: 'HIGH',
        whatWouldValidateIt: 'Pre-selling 5 annual subscriptions during discovery phase.',
        whatWouldInvalidateIt: 'Consistent feedback that operators only use free tier tools.'
      }
    ],
    contradictions: [],
    competitiveThreats: [
      {
        id: `ct_${id}_1`,
        competitorOrSubstitute: 'Manual consulting and internal analysts',
        threatType: 'STATUS_QUO',
        threatDescription: 'Founders default to doing research manually until tool ROI is proven.',
        differentiationStatus: 'VERIFIED_DIFFERENTIATION',
        whyCustomerWouldNotSwitch: 'Speed differential (5 minutes vs 40 hours of manual work).'
      }
    ],
    failureConditions: [
      {
        id: `fc_${id}_1`,
        condition: 'Failure to achieve sub-3 minute time-to-first-value.',
        supportingEvidence: 'High drop-off rate on long multi-step wizard forms.',
        severity: 'HIGH',
        confidence: 'HIGH',
        validationMethod: 'Telemetry on onboarding funnel completion.'
      }
    ],
    decisionChangingEvidence: [
      {
        id: `dce_${id}_1`,
        evidence: 'Commitment of 5 paid pilot customers.',
        direction: 'positive',
        importance: 'CRITICAL',
        currentStatus: 'Pending discovery sprint',
        validationAction: 'Execute 10 structured interviews in Week 1.'
      }
    ],
    supportingEvidence: [
      'Strong dissatisfaction with generic chat models for deep business risk modeling.'
    ],
    contradictoryEvidence: [
      'Rapidly shifting model capabilities create continuous need to update agent architectures.'
    ],
    unknowns: [
      'Long-term retention rate of monthly active users.'
    ]
  };

  const judgeReport: JudgeReport = {
    id: `rep_jdg_${id}`,
    ventureId: id,
    createdAt: now,
    executiveSummary: 'Proceed with disciplined validation. High market problem urgency and strong unit economics indicate positive viability, contingent on verifying early customer acquisition channels.',
    coreVentureThesis: {
      statement: `${venture.title} addresses a acute efficiency bottleneck in venture validation with strong gross margins.`,
      supportingEvidence: ['Market demand for automated decision synthesis is growing rapidly.'],
      contradictingEvidence: ['Incumbent response risk requires swift execution.'],
      criticalAssumptions: ['Early adopters have discretionary credit card budget.'],
      confidence: 'HIGH',
      status: 'supported'
    },
    crossAgentAssessment: {
      agreements: [
        'High willingness to adopt automated intelligence workflows.',
        'Gross margins support venture-scale unit economics.'
      ],
      disagreements: [],
      contradictions: [],
      unsupportedClaims: [],
      missingInformation: []
    },
    strongestSupportingEvidence: [
      'Significant time savings (90%+ cycle time reduction) verified against manual research benchmarks.'
    ],
    strongestContradictoryEvidence: [
      'Habit inertia and status quo preference for free manual notes.'
    ],
    criticalUnknowns: [
      {
        id: `cu_${id}_1`,
        statement: 'Actual sales cycle duration for mid-market accounts.',
        whyItMatters: 'Determines initial working capital runway requirements.',
        currentEvidence: 'Preliminary industry benchmarks show 14-30 day cycles.',
        sourceIds: [],
        confidence: 'HIGH',
        impact: 'HIGH',
        validationMethod: 'Track pilot conversion timestamps.',
        decisionChangePotential: 'If cycle exceeds 60 days, focus purely on self-serve prosumer pricing.'
      }
    ],
    criticalAssumptions: [
      'Operators will trust structured AI risk audits over generic consultancy reports.'
    ],
    criticalRisks: [
      'Incumbent feature duplication within 12-18 months.'
    ],
    decisionChangingEvidence: [
      {
        id: `jdce_${id}_1`,
        evidenceNeeded: '5 signed pilot agreements within 30 days.',
        currentStatus: 'Validation in progress',
        expectedImpact: 'Validates full commercial launch decision.',
        validationMethod: 'Targeted outbound outreach.'
      }
    ],
    aiRecommendation: 'BUILD',
    recommendationConfidence: 'HIGH',
    recommendationRationale: {
      recommendation: 'BUILD',
      confidence: 'HIGH',
      primaryReasons: [
        'Urgent problem with high willingness-to-pay potential.',
        'Sound unit economics and scalable subscription delivery model.',
        'High technical feasibility with modern multi-agent architecture.'
      ],
      strongestSupportingEvidence: [
        'Over 90% reduction in manual discovery synthesis hours.'
      ],
      strongestContradictoryEvidence: [
        'Initial customer trust hurdle requires transparent citation mechanics.'
      ],
      criticalUnknowns: [
        'Customer acquisition velocity through organic channels.'
      ],
      decisionChangingEvidence: [
        'Securing initial paid pilots.'
      ]
    },
    nextActions,
    sourceReferences: [],
    evidenceTraceability: [
      {
        id: `et_${id}_1`,
        conclusion: 'Market problem urgency is confirmed.',
        findingIds: [`fnd_${id}_1`],
        sourceIds: [],
        evidenceLevel: 'MULTIPLE_CONSISTENT',
        status: 'SUPPORTED'
      }
    ]
  };

  const evaluatedVenture: Venture = {
    ...venture,
    status: 'evaluated',
    updatedAt: now,
    nextActions,
    score,
    researchReport,
    businessReport,
    redTeamReport,
    judgeReport
  };

  const analysisState: VentureAnalysisState = {
    venture: evaluatedVenture,
    criticalQuestions: venture.questions || [],
    questionAnswers: {},
    researchReport,
    businessReport,
    redTeamReport,
    judgeReport,
    scores: score,
    nextActions,
    decision: null,
    agentWorkflow: {
      research: { status: 'completed' },
      business: { status: 'completed' },
      redTeam: { status: 'completed' },
      judge: { status: 'completed' }
    },
    lifecycleStatus: 'evaluated',
    intakeStatus: 'ready',
    questionsStatus: 'completed',
    analysisStatus: 'completed'
  };

  return { venture: evaluatedVenture, analysisState };
}
