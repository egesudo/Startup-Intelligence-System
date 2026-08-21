/**
 * Core Domain Models for Startup Intelligence
 * Defines structured entities and data contracts across all analysis layers.
 */

export type VentureStatus = 
  | 'draft'
  | 'clarifying'
  | 'analyzing'
  | 'evaluated'
  | 'decided';

export type AIRecommendationType = 
  | 'BUILD'
  | 'VALIDATE FIRST'
  | 'REDESIGN'
  | 'DO NOT PURSUE'
  | 'PROCEED_CONFIDENTLY'
  | 'PROCEED_WITH_VALIDATION'
  | 'PIVOT_REQUIRED'
  | 'KILL_RECOMMENDED';

export type JudgeRecommendationType = AIRecommendationType;

export type FounderDecisionType = 
  | 'BUILD'
  | 'VALIDATE FIRST'
  | 'REDESIGN'
  | 'DO NOT PURSUE'
  | 'PROCEED'
  | 'PIVOT'
  | 'KILL'
  | 'DEFER';

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'LETHAL' | 'CRITICAL';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type QuestionStatus = 'PENDING' | 'ANSWERED' | 'SKIPPED';
export type QuestionCategory = 
  | 'customer'
  | 'problem'
  | 'market'
  | 'business_model'
  | 'competition'
  | 'validation'
  | 'technology'
  | 'geography';

/**
 * Structured Venture Understanding extracted by Gemini from raw idea input
 */
export interface StructuredVentureUnderstanding {
  problem?: string | null;
  solution?: string | null;
  targetCustomer?: string | null;
  marketGeography?: string | null;
  valueProposition?: string | null;
  businessModel?: string | null;
  technology?: string | null;
  founderAssumptions?: string[];
  importantUnknowns?: string[];
  suggestedTitle?: string;
}

export type SourceType = 
  | 'PRIMARY' 
  | 'GOVERNMENT_DATA' 
  | 'OFFICIAL_COMPANY' 
  | 'ACADEMIC' 
  | 'INDUSTRY_REPORT' 
  | 'JOURNALISM' 
  | 'OTHER';

export type ReliabilityTier = 'PRIMARY' | 'INDUSTRY_REPORT' | 'NEWS_ANALYSIS' | 'ANECDOTAL';

export type EvidenceType = 'supporting' | 'contradictory' | 'neutral' | 'unknown';
export type EvidenceStrength = 'strong' | 'moderate' | 'weak';

/**
 * 1. Source entity for evidence-based citations
 */
export interface Source {
  id: string;
  title: string;
  url?: string;
  publisher?: string;
  sourceType?: SourceType;
  publicationDate?: string;
  publishYear?: number;
  accessedAt?: string;
  relevance?: string;
  relevanceScore?: number; // 0 to 1
  credibility?: 'HIGH' | 'MEDIUM' | 'LOW';
  reliabilityTier: ReliabilityTier;
  extractedFact: string;
  relatedFindings?: string[];
}

export interface GroundedWebSource {
  title: string;
  url: string;
  domain?: string;
  snippet?: string;
}

export interface SourceGroundingVerificationResult {
  sourceTitle: string;
  status: 'VERIFIED' | 'UPDATED_WITH_LIVE_DATA' | 'APPROXIMATE_MATCH' | 'UNVERIFIED';
  credibilityRating: 'HIGH' | 'MEDIUM' | 'LOW';
  verificationSummary: string;
  currentUpdates: string[];
  groundedWebSources: GroundedWebSource[];
  liveBenchmarkValue?: string;
  searchQueriesUsed: string[];
  checkedAt: string;
  suggestedFollowUpQuery?: string;
}

/**
 * 2. Research finding entity
 */
export interface ResearchFinding {
  id: string;
  title?: string;
  statement: string;
  evidence?: string;
  evidenceType?: EvidenceType;
  evidenceStrength?: EvidenceStrength;
  category: 'MARKET_SIZE' | 'COMPETITOR' | 'CUSTOMER_NEED' | 'REGULATORY' | 'TECHNOLOGY' | 'PROBLEM' | 'SOLUTION' | 'PRICING' | string;
  confidence: ConfidenceLevel;
  sources: Source[];
  sourceIds?: string[];
  citationIds?: string[];
  implication: string;
}

/**
 * 3. Competitor entity in research
 */
export interface CompetitorProfile {
  name: string;
  category: 'DIRECT' | 'INDIRECT' | 'STATUS_QUO';
  marketPosition: string;
  coreAdvantage: string;
  coreVulnerability: string;
}

/**
 * 4. Research Report Metadata
 */
export interface ResearchReportMetadata {
  status: 'completed' | 'failed' | 'running';
  startedAt: string;
  completedAt: string;
  findingCount: number;
  sourceCount: number;
  unknownCount: number;
  confidence: ConfidenceLevel;
}

/**
 * 5. Research Report entity
 */
export interface ResearchReport {
  id: string;
  ventureId: string;
  agentRunId?: string;
  chainOfThought?: {
    inputEvaluation: string;
    precedingAgentCritique?: string;
    reasoningSteps: string[];
    conclusion: string;
  };
  createdAt: string;
  executiveSummary: string;
  confidenceScore: ConfidenceLevel;
  confidence?: ConfidenceLevel;
  keyFindings?: ResearchFinding[];
  marketFindings?: ResearchFinding[];
  customerFindings?: ResearchFinding[];
  competitorFindings?: ResearchFinding[];
  alternativeSolutions?: string[];
  supportingEvidence?: string[];
  contradictoryEvidence?: string[];
  assumptions?: string[];
  unknowns?: string[];
  findings: ResearchFinding[];
  competitors: CompetitorProfile[];
  tailwinds: string[];
  headwinds: string[];
  unvalidatedAssumptions: string[];
  sources?: Source[];
  metadata?: ResearchReportMetadata;
}

export type AssumptionCategory = 
  | 'customer' 
  | 'pricing' 
  | 'market' 
  | 'distribution' 
  | 'competition' 
  | 'operations' 
  | 'technology' 
  | 'regulation'
  | 'CUSTOMER_ACQUISITION'
  | 'RETENTION'
  | 'COST_STRUCTURE'
  | string;

export type AssumptionImportance = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type EvidenceStatus = 
  | 'verified' 
  | 'partially_verified' 
  | 'unverified' 
  | 'contradicted' 
  | 'unknown'
  | 'supported'
  | 'unsupported'
  | 'partially_supported'
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'UNVERIFIED'
  | 'CONTRADICTED'
  | 'UNSUPPORTED'
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'AMBIGUOUS'
  | 'STRONGLY_SUPPORTED';

export type RiskProbability = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
export type RiskImpact = 'CATASTROPHIC' | 'HIGH' | 'MODERATE' | 'LOW';

/**
 * 6. Business Assumption entity
 */
export interface BusinessAssumption {
  id: string;
  statement: string;
  hypothesis?: string; // backwards compatibility alias
  category: AssumptionCategory;
  importance: AssumptionImportance;
  evidenceStatus: EvidenceStatus;
  supportingSourceIds?: string[];
  confidence: ConfidenceLevel;
  validationMethod: string;
  isHighRisk?: boolean; // backwards compatibility flag
}

/**
 * 7. Business Risk entity
 */
export interface BusinessRisk {
  id: string;
  title: string;
  description?: string;
  category?: 'CAC_LTV_INVERSION' | 'CHURN' | 'MARGIN_EROSION' | 'CHANNEL_DEPENDENCY' | string;
  probability: RiskProbability;
  impact: RiskImpact;
  severity?: RiskSeverity; // backwards compatibility
  evidence?: string;
  sourceIds?: string[];
  confidence: ConfidenceLevel;
  mitigation?: string;
  mitigationStrategy?: string; // backwards compatibility
  validationAction?: string;
}

/**
 * 8. Business Customer Analysis
 */
export interface BusinessCustomerAnalysis {
  targetCustomer: string;
  customerProblem: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'INFREQUENT' | 'UNKNOWN';
  currentAlternatives: string[];
  switchingBehavior: string;
  evidenceOfDemand: string;
  willingnessToPayEvidence: string;
  willingnessToPayStatus: 'VALIDATED' | 'PARTIALLY_VALIDATED' | 'UNVALIDATED' | 'UNKNOWN';
}

/**
 * 9. Problem Economics
 */
export interface BusinessProblemEconomics {
  valueProposition: string;
  costOfInaction: string;
  economicJustification: string;
}

/**
 * 10. Market Structure Analysis
 */
export interface BusinessMarketAnalysis {
  marketStructure: string;
  industryEconomics: string;
  entryBarriers: string[];
  regulatoryConstraints: string[];
}

/**
 * 11. Commercial Competitor Comparison
 */
export interface BusinessCompetitorProfile {
  company: string;
  offering: string;
  targetCustomer: string;
  pricing: string;
  positioning: string;
  strengths: string;
  weaknesses: string;
  sourceIds?: string[];
}

/**
 * 12. Pricing Benchmark Evidence
 */
export interface PricingEvidenceItem {
  benchmark: string;
  model: string;
  priceRange: string;
  evidence: string;
  sourceIds?: string[];
}

export interface WaterfallStep {
  label: string;
  percentage: number;
  amountNormalized: string;
  stepType: 'gross_revenue' | 'cogs' | 'gross_profit' | 'cac' | 'retention_ops' | 'net_contribution';
  color?: string;
  description?: string;
}

export interface CogsItem {
  name: string;
  percentage: number;
  costAmount: string;
  description: string;
}

export interface PricingTierDetail {
  tierName: string;
  price: string;
  billingPeriod: string;
  targetSegment: string;
  keyFeatures: string[];
  marginEstimate: string;
}

export interface EconomicMetricClassification {
  metric: string;
  value: string;
  status: 'FACT' | 'ESTIMATED' | 'ASSUMPTION';
  rationale: string;
  validationMethod?: string;
}

export type FinancialEvidenceLabel = 'VERIFIED' | 'BENCHMARK' | 'FOUNDER_INPUT' | 'ASSUMPTION' | 'UNKNOWN' | 'ESTIMATED';

export interface EconomicUnitSpecification {
  unitType: 'CUSTOMER_MONTH' | 'CUSTOMER_YEAR' | 'GMV_TRANSACTION' | 'ORDER' | 'SUBSCRIBER_YEAR' | 'DEVICE' | 'PROJECT' | 'USAGE_EVENT' | 'OTHER';
  unitName: string;
  justification: string;
  revenuePerUnit: string;
  revenuePerUnitNumeric: number;
  revenueEvidenceLabel: FinancialEvidenceLabel;
}

export interface VentureFinancialMetricItem {
  name: string;
  value: string;
  numericValue?: number;
  evidenceLabel: FinancialEvidenceLabel;
  sourceOrBenchmark?: string;
  calculationRationale: string;
}

export interface VentureFinancialAnalysis {
  // 1. Business Model
  businessModelOverview: string;
  archetype: string;
  archetypeDisplayName: string;

  // 2. Target Customer
  targetCustomerSegment: string;
  economicBuyer: string;
  buyingMotivation: string;

  // 3. Revenue & Pricing
  pricingStructure: string;
  pricingTiers: PricingTierDetail[];
  revenueDrivers: string[];

  // 4. Economic Unit
  economicUnit: EconomicUnitSpecification;

  // 5. COGS (Itemized & Calculated)
  cogsItems: CogsItem[];
  totalCogsPerUnit: string;
  totalCogsPercentage: number;

  // 6. Gross Profit & Gross Margin (Calculated: Gross Profit = Revenue - COGS, Gross Margin = GP / Revenue)
  grossProfitPerUnit: string;
  grossMarginPercentage: number;
  grossMarginRange: string;
  grossMarginEvidenceLabel: FinancialEvidenceLabel;

  // 7. Sales & Marketing
  salesAndMarketingChannels: string[];
  variableMarketingCostPerAcquisition: string;

  // 8. CAC (Calculated: Acquisition Cost / New Customers)
  cacEstimate: string;
  cacCalculationBasis: string;
  cacPaybackMonths: number;
  cacEvidenceLabel: FinancialEvidenceLabel;

  // 9. Retention / Customer Success
  retentionMechanism: string;
  servicingCostPerCustomer: string;
  customerSuccessLaborPct: number;

  // 10. LTV / Churn (Calculated when applicable)
  estimatedAnnualChurnPct?: number;
  estimatedCustomerLifespanMonths?: number;
  ltvEstimate: string;
  ltvToCacRatio: string;
  ltvEvidenceLabel: FinancialEvidenceLabel;

  // 11. Contribution Profit & Contribution Margin (Calculated: GP - Variable Acquisition & Servicing)
  variableServicingCostPerUnit: string;
  contributionProfitPerUnit: string;
  contributionMarginPercentage: number;
  contributionMarginEvidenceLabel: FinancialEvidenceLabel;
  contributionWaterfall: WaterfallStep[];

  // 12. Key Financial Assumptions
  keyFinancialAssumptions: Array<{
    metric: string;
    assumedValue: string;
    evidenceLabel: FinancialEvidenceLabel;
    sensitivity: 'HIGH' | 'MEDIUM' | 'LOW';
    validationPlan: string;
  }>;

  // 13. Sources & Evidence
  sourcesAndEvidence: Source[];

  // 14. Financial Risks (Top 3)
  financialRisks: Array<{
    riskTitle: string;
    impact: 'CATASTROPHIC' | 'HIGH' | 'MEDIUM' | 'LOW';
    evidence: string;
    mitigationStrategy: string;
  }>;

  // 15. Most Important Financial Unknown
  mostImportantFinancialUnknown: {
    question: string;
    impactOnViability: string;
    targetBenchmarkToHit: string;
  };

  // 16. Recommended Validation Experiment
  recommendedValidationExperiment: {
    title: string;
    hypothesis: string;
    protocol: string;
    successThreshold: string;
    timeframe: string;
  };

  // 17. Business Viability Conclusion
  businessViabilityConclusion: {
    whoPays: string;
    whyTheyPay: string;
    canItMakeMoney: string;
    whatRisksRemain: string;
    whatFounderShouldDoNext: string;
    verdict: 'COMMERCIALLY_VIABLE_WITH_GATES' | 'HIGH_FRICTION_MODEL' | 'UNIT_ECONOMICS_CONSTRAINED';
  };

  // Strategic & Technical In-Depth Evaluation (Founder-Oriented)
  strategicRevenueAnalysis?: {
    valueCaptureMechanism: string;
    pricingElasticityEvaluation: string;
    expansionLevers: string[];
    pricingPowerRating: 'STRONG' | 'MODERATE' | 'WEAK';
    pricingPowerRationale: string;
  };
  technicalCostEvaluation?: {
    architecturalDrivers: string;
    infrastructureComplexity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    cogsOptimizationStrategies: string[];
    scalabilityBottleneck: string;
  };
  growthAndRetentionReview?: {
    acquisitionChannelDynamics: string;
    salesCycleFriction: string;
    retentionAndMoatAssessment: string;
    servicingLaborRisk: string;
  };
  profitabilityVerdictAndFounderPlan?: {
    viabilityScore: 'HIGH_POTENTIAL' | 'VIABLE_WITH_GATES' | 'HIGH_FRICTION_MARGIN_RISK';
    executiveSummary: string;
    breakEvenMilestone: string;
    immediateFounderAction: string;
  };

  // Integrity & Audit Flags
  ventureDifferentiationTestPassed: boolean;
  financialConsistencyCheckPassed: boolean;
}

export interface CommercialEconomicsStructure {
  archetype: 'B2B_SAAS' | 'MARKETPLACE' | 'D2C' | 'USAGE_BASED' | 'AGENCY_TECH' | 'HEALTHCARE_TECH' | 'FINTECH' | 'AI_INFRA' | 'HARDWARE_ENABLED' | string;
  archetypeDisplayName?: string;
  targetPricePoint: string;
  pricingCadence: string;
  estimatedGrossMargin: number;
  grossMarginRange: string;
  cogsBreakdown: CogsItem[];
  cacEstimate: string;
  ltvEstimate: string;
  cacToLtvRatio: string;
  paybackMonths: number;
  capitalIntensity: 'LOW_CAPEX_SOFTWARE' | 'MODERATE_SEED' | 'WORKING_CAPITAL_INTENSIVE' | 'HEAVY_CAPEX' | string;
  capitalIntensityDescription: string;
  pricingPower: 'WEAK' | 'MODERATE' | 'STRONG';
  waterfallSteps: WaterfallStep[];
  pricingTiers: PricingTierDetail[];
  economicClassifications: EconomicMetricClassification[];
  overallUnitEconomicsStatus: string;
  economicJustification: string;
  strategicRevenueAnalysis?: {
    valueCaptureMechanism: string;
    pricingElasticityEvaluation: string;
    expansionLevers: string[];
    pricingPowerRating: 'STRONG' | 'MODERATE' | 'WEAK';
    pricingPowerRationale: string;
  };
  technicalCostEvaluation?: {
    architecturalDrivers: string;
    infrastructureComplexity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    cogsOptimizationStrategies: string[];
    scalabilityBottleneck: string;
  };
  growthAndRetentionReview?: {
    acquisitionChannelDynamics: string;
    salesCycleFriction: string;
    retentionAndMoatAssessment: string;
    servicingLaborRisk: string;
  };
  profitabilityVerdictAndFounderPlan?: {
    viabilityScore: 'HIGH_POTENTIAL' | 'VIABLE_WITH_GATES' | 'HIGH_FRICTION_MARGIN_RISK';
    executiveSummary: string;
    breakEvenMilestone: string;
    immediateFounderAction: string;
  };
  financialAnalysis?: VentureFinancialAnalysis;
}

/**
 * 13. Business Model & Unit Economics Hypothesis
 */
export interface BusinessModelStructure {
  revenueModel: string;
  pricingModel: string;
  archetype?: 'B2B_SAAS' | 'MARKETPLACE' | 'D2C' | 'USAGE_BASED' | 'AGENCY_TECH' | 'OTHER' | string;
  costDrivers: string[];
  retentionMechanism: string;
  unitEconomicsHypothesis?: {
    targetPricePoint?: string;
    estimatedMarginProfile?: string;
    paybackPeriodEstimate?: string;
    capitalRequirement?: string;
    notes?: string;
  };
  commercialEconomics?: CommercialEconomicsStructure;
}

/**
 * 14. Distribution Analysis
 */
export interface DistributionAnalysisStructure {
  primaryChannel: string;
  channelViability: string;
  acquisitionChallenges: string[];
  distributionBottlenecks: string[];
}

/**
 * 15. Business Report Metadata
 */
export interface BusinessReportMetadata {
  status: 'completed' | 'failed' | 'running';
  startedAt: string;
  completedAt: string;
  assumptionCount: number;
  riskCount: number;
  sourceCount: number;
  unknownCount: number;
  confidence: ConfidenceLevel;
}

/**
 * 16. Business Report entity
 */
export interface BusinessReport {
  id: string;
  ventureId: string;
  agentRunId?: string;
  chainOfThought?: {
    inputEvaluation: string;
    precedingAgentCritique?: string;
    reasoningSteps: string[];
    conclusion: string;
  };
  createdAt: string;
  executiveSummary: string;
  confidence: ConfidenceLevel;
  confidenceScore?: ConfidenceLevel;
  customerAnalysis: BusinessCustomerAnalysis;
  problemEconomics?: BusinessProblemEconomics;
  marketAnalysis?: BusinessMarketAnalysis;
  competitiveLandscape?: BusinessCompetitorProfile[];
  alternativeSolutions?: string[];
  businessModel: BusinessModelStructure;
  pricingEvidence?: PricingEvidenceItem[];
  distributionAnalysis: DistributionAnalysisStructure;
  acquisitionConsiderations?: string[];
  operationalConsiderations?: string[];
  businessAssumptions: BusinessAssumption[];
  businessRisks: BusinessRisk[];
  supportingEvidence: string[];
  contradictoryEvidence: string[];
  unknowns: string[];
  sources?: Source[];
  metadata?: BusinessReportMetadata;

  // Backwards compatibility properties
  archetype?: 'B2B_SAAS' | 'MARKETPLACE' | 'D2C' | 'USAGE_BASED' | 'AGENCY_TECH' | 'OTHER';
  estimatedMarginProfile?: string;
  pricingPower?: 'WEAK' | 'MODERATE' | 'STRONG';
  capitalRequirement?: 'BOOTSTRAPPABLE' | 'MODERATE_SEED' | 'HEAVY_CAPEX';
  primaryDistributionChannel?: string;
  assumptions?: BusinessAssumption[];
  risks?: BusinessRisk[];
  defensibilityMoat?: {
    type: 'NETWORK_EFFECTS' | 'DATA_LOCKIN' | 'HIGH_SWITCHING_COST' | 'SPEED_EXECUTION' | 'NONE';
    strength: 'NONE' | 'FRAGILE' | 'STRONG';
    rationale: string;
  };
}

/**
 * 8. Challenged Claim entity (Phase 5)
 */
export interface ChallengedClaim {
  id: string;
  claim: string;
  claimSource: string; // 'founder' | 'research' | 'business' | specific statement
  challenge: string;
  evidence: string;
  sourceIds: string[];
  evidenceStatus: EvidenceStatus;
  confidence: ConfidenceLevel;
  severity: RiskSeverity;
  implication: string;
}

/**
 * 9. Assumption Attack entity (Phase 5)
 */
export interface AssumptionAttack {
  id: string;
  assumption: string;
  importance: AssumptionImportance;
  evidenceStatus: EvidenceStatus;
  supportingSourceIds?: string[];
  contradictorySourceIds?: string[];
  confidence: ConfidenceLevel;
  whatWouldValidateIt: string;
  whatWouldInvalidateIt: string;
}

/**
 * 10. Contradiction entity (Phase 5)
 */
export interface Contradiction {
  id: string;
  claimOrAssumption: string;
  sourceA: string;
  sourceB: string;
  description: string;
  severity: RiskSeverity;
  confidence: ConfidenceLevel;
  evidenceStatus: EvidenceStatus;
  sourceIds?: string[];
}

/**
 * 11. Competitive Threat entity (Phase 5)
 */
export interface CompetitiveThreat {
  id: string;
  competitorOrSubstitute: string;
  threatType: 'DIRECT_COMPETITOR' | 'INDIRECT_COMPETITOR' | 'SUBSTITUTE' | 'STATUS_QUO' | 'DO_NOTHING' | string;
  threatDescription: string;
  differentiationStatus: 'VERIFIED_DIFFERENTIATION' | 'UNVERIFIED_DIFFERENTIATION' | 'CONTRADICTED_DIFFERENTIATION';
  whyCustomerWouldNotSwitch: string;
  sourceIds?: string[];
}

/**
 * 12. Failure Condition entity (Phase 5)
 */
export interface FailureCondition {
  id: string;
  condition: string;
  supportingEvidence: string;
  severity: RiskSeverity;
  confidence: ConfidenceLevel;
  validationMethod: string;
}

/**
 * 13. Decision Changing Evidence entity (Phase 5)
 */
export interface DecisionChangingEvidence {
  id: string;
  evidence: string;
  direction: 'positive' | 'negative' | 'uncertain';
  importance: AssumptionImportance;
  sourceIds?: string[];
  currentStatus: string;
  validationAction: string;
}

/**
 * 14. Red Team Risk entity
 */
export interface RedTeamRisk {
  id: string;
  title: string;
  description: string;
  category?: 'customer' | 'market' | 'competition' | 'pricing' | 'business_model' | 'distribution' | 'operations' | 'technology' | 'regulation' | 'execution' | 'data' | 'trust' | 'adoption' | string;
  severity: RiskSeverity;
  evidenceStatus: EvidenceStatus;
  supportingEvidence?: string;
  contradictoryEvidence?: string;
  sourceIds?: string[];
  confidence: ConfidenceLevel;
  potentialImpact: string;
  validationMethod: string;
  riskType: 'HYPOTHESIS' | 'EVIDENCE_BACKED';

  // Backwards compatibility properties
  vulnerability?: string;
  failureMechanism?: string;
  whyCompetitorsWillWin?: string;
  preMortemTrigger?: string;
}

/**
 * 15. Red Team Report Metadata
 */
export interface RedTeamReportMetadata {
  status: 'completed' | 'failed' | 'running';
  startedAt: string;
  completedAt: string;
  challengedClaimCount: number;
  criticalRiskCount: number;
  assumptionAttackCount: number;
  contradictionCount: number;
  failureConditionCount: number;
  decisionEvidenceCount: number;
  sourceCount: number;
  unknownCount: number;
  confidence: ConfidenceLevel;
}

/**
 * 16. Red Team Report entity
 */
export interface RedTeamReport {
  id: string;
  ventureId: string;
  agentRunId?: string;
  chainOfThought?: {
    inputEvaluation: string;
    precedingAgentCritique?: string;
    reasoningSteps: string[];
    conclusion: string;
  };
  createdAt: string;
  executiveSummary: string;
  confidence: ConfidenceLevel;
  challengedClaims: ChallengedClaim[];
  criticalRisks: RedTeamRisk[];
  assumptionAttacks: AssumptionAttack[];
  contradictions: Contradiction[];
  competitiveThreats: CompetitiveThreat[];
  failureConditions: FailureCondition[];
  decisionChangingEvidence: DecisionChangingEvidence[];
  supportingEvidence: string[];
  contradictoryEvidence: string[];
  unknowns: string[];
  sources?: Source[];
  metadata?: RedTeamReportMetadata;

  // Backwards compatibility properties
  overallRiskLevel?: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  riskScore?: number;
  fatalFlaws?: RedTeamRisk[];
  killScenarios?: Array<{
    title: string;
    scenario: string;
    probability: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  untestedDogmasChallenged?: string[];
  counterFactualAnalysis?: string;
}

/**
 * 10. Venture Score breakdown (Deterministic, 0-100 total)
 */
export interface VentureScore {
  id: string;
  ventureId: string;
  calculatedAt: string;
  totalScore: number; // 0-100
  dimensions: {
    marketProblemUrgency: {
      score: number; // 0-25
      reasoning: string;
      deductions: string[];
    };
    businessModelViability: {
      score: number; // 0-25
      reasoning: string;
      deductions: string[];
    };
    defensibilityMoat: {
      score: number; // 0-25
      reasoning: string;
      deductions: string[];
    };
    executionRisk: {
      score: number; // 0-25
      reasoning: string;
      deductions: string[];
    };
  };
  recommendationTier: 'HIGH_READINESS' | 'MODERATE_READINESS' | 'HIGH_VULNERABILITY' | 'CRITICALLY_FLAWED';
}

/**
 * 11. Practical Next Action (Strictly 3 actions)
 */
export interface NextAction {
  id: string;
  ventureId: string;
  stepNumber: 1 | 2 | 3;
  title: string;
  description: string;
  purpose: string;
  validationTarget: string;
  relatedUnknownIds?: string[];
  relatedRiskIds?: string[];
  priority: 'IMMEDIATE' | 'HIGH' | 'SECONDARY' | string;
  expectedDecisionImpact: string;

  // Backwards compatibility properties
  actionType?: 'CUSTOMER_DISCOVERY' | 'SMOKE_TEST' | 'UNIT_ECONOMICS_AUDIT' | 'TECH_SPIKE' | string;
  hypothesisToTest?: string;
  passFailMetric?: string;
  estimatedDays?: number;
  completed?: boolean;
}

/**
 * 12. Core Venture Thesis (Phase 6)
 */
export interface CoreVentureThesis {
  statement: string;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  criticalAssumptions: string[];
  confidence: ConfidenceLevel;
  status: 'supported' | 'partially_supported' | 'weakly_supported' | 'contradicted' | 'unvalidated' | 'unknown';
}

/**
 * 13. Cross Agent Disagreement (Phase 6)
 */
export interface CrossAgentDisagreement {
  topic: string;
  researchPosition: string;
  businessPosition: string;
  redTeamPosition: string;
  evidence: string;
  sourceIds: string[];
  judgeInterpretation: string;
  confidence: ConfidenceLevel;
}

/**
 * 14. Cross Agent Assessment (Phase 6)
 */
export interface CrossAgentAssessment {
  agreements: string[];
  disagreements: CrossAgentDisagreement[];
  contradictions: string[];
  unsupportedClaims: string[];
  duplicatedConclusions?: string[];
  missingInformation: string[];
}

/**
 * 15. Decision Critical Uncertainty (Phase 6)
 */
export interface DecisionCriticalUncertainty {
  id: string;
  statement: string;
  whyItMatters: string;
  currentEvidence: string;
  sourceIds: string[];
  confidence: ConfidenceLevel;
  impact: 'CATASTROPHIC' | 'HIGH' | 'MODERATE' | 'LOW' | string;
  validationMethod: string;
  decisionChangePotential: string;
}

/**
 * 16. Judge Decision-Changing Evidence (Phase 6)
 */
export interface JudgeDecisionChangingEvidence {
  id: string;
  evidenceNeeded: string;
  currentStatus: string;
  expectedImpact: string;
  validationMethod: string;
  relatedAssumptionIds?: string[];
  relatedRiskIds?: string[];
}

/**
 * 17. Structured Recommendation Rationale (Phase 6)
 */
export interface RecommendationRationale {
  recommendation: AIRecommendationType;
  confidence: ConfidenceLevel;
  primaryReasons: string[];
  strongestSupportingEvidence: string[];
  strongestContradictoryEvidence: string[];
  criticalUnknowns: string[];
  decisionChangingEvidence: string[];
}

/**
 * 18. Evidence Traceability Link (Phase 6)
 */
export interface EvidenceTraceability {
  id: string;
  conclusion: string;
  findingIds: string[];
  sourceIds: string[];
  evidenceLevel: 'DIRECT_PRIMARY' | 'INDEPENDENT_SECONDARY' | 'MULTIPLE_CONSISTENT' | 'SINGLE_SOURCE' | 'INFERENCE' | 'FOUNDER_CLAIM' | 'HYPOTHESIS' | 'UNKNOWN' | string;
  status: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNSUPPORTED' | 'INSUFFICIENT_EVIDENCE' | 'CONTRADICTED' | string;
  notes?: string;
}

/**
 * 19. Judge Report Metadata (Phase 6)
 */
export interface JudgeReportMetadata {
  status: 'completed' | 'failed' | 'running';
  startedAt: string;
  completedAt: string;
  sourcesConsultedCount: number;
  findingsEvaluatedCount: number;
  disagreementsCount: number;
  uncertaintiesCount: number;
  confidence: ConfidenceLevel;
  executionTimeMs?: number;
}

/**
 * 20. Collaboration Record entity for internal execution traceability
 */
export interface CollaborationRecord {
  agent: 'RESEARCH' | 'BUSINESS' | 'RED_TEAM' | 'JUDGE';
  ventureId: string;
  inputContext: Record<string, any>;
  previousAgentReference?: string[];
  researchSources?: Array<{ id: string; title: string; publisher?: string }>;
  keyFindings: string[];
  assumptions: string[];
  confidence: ConfidenceLevel;
  timestamp: string;
  status: 'COMPLETED' | 'FAILED';
  error?: string;
}

/**
 * 21. Final Output Integrity answering the 6 Core Questions
 */
export interface FinalOutputIntegrity {
  whatIsTheIdea: string;
  whatDidWeFind: string;
  whatSupportsIt: string[];
  whatCouldBreakIt: string[];
  whatRemainsUnknown: string[];
  whatShouldFounderDoNext: string;
}

/**
 * 22. Judge Report entity (Phase 6)
 */
export interface JudgeReport {
  id: string;
  ventureId: string;
  agentRunId?: string;
  chainOfThought?: {
    inputEvaluation: string;
    precedingAgentCritique?: string;
    reasoningSteps: string[];
    conclusion: string;
  };
  createdAt: string;
  executiveSummary: string;
  coreVentureThesis: CoreVentureThesis;
  crossAgentAssessment: CrossAgentAssessment;
  strongestSupportingEvidence: string[];
  strongestContradictoryEvidence: string[];
  criticalUnknowns: DecisionCriticalUncertainty[];
  criticalAssumptions: string[];
  criticalRisks: string[];
  decisionChangingEvidence: JudgeDecisionChangingEvidence[];
  aiRecommendation: AIRecommendationType;
  recommendationConfidence: ConfidenceLevel;
  recommendationRationale: RecommendationRationale;
  nextActions: NextAction[]; // Exactly 3
  sourceReferences: Source[];
  evidenceTraceability: EvidenceTraceability[];
  evidenceVerificationReport?: EvidenceVerificationReport;
  finalOutputIntegrity?: FinalOutputIntegrity;
  metadata?: JudgeReportMetadata;

  // Backwards compatibility properties
  synthesis?: string;
  tradeoffMatrix?: Array<{
    dimension: string;
    bullCase: string;
    bearCase: string;
    judgeVerdict: string;
  }>;
  uncertaintyNotice?: string;
  keyDivergences?: string[];
}

/**
 * 23. Agent Execution & Evidence Verification Protocol Types
 */
export type VerificationStatus = 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'UNVERIFIED' | 'FAILED';

export type EvidenceVerificationLevel = 
  | 'LEVEL_1_SELF_REPORTED' 
  | 'LEVEL_2_OUTPUT_EVIDENCE' 
  | 'LEVEL_3_EXECUTION_EVIDENCE' 
  | 'LEVEL_4_TRACEABLE_EVIDENCE_CHAIN';

export interface AgentRunRecord {
  agentRunId: string;
  agentName: 'RESEARCH' | 'BUSINESS' | 'RED_TEAM' | 'JUDGE';
  ventureId: string;
  startedAt: string;
  completedAt?: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  previousAgentRunIds: string[];
  inputReferences: Record<string, any>;
  outputReferenceId?: string;
  externalToolCalls?: Array<{
    tool: string;
    params?: any;
    result?: any;
    timestamp: string;
  }>;
  sourceReferences: string[];
  verificationStatus: VerificationStatus;
  warnings?: string[];
  chainOfThought?: {
    inputEvaluation: string;
    precedingAgentCritique?: string;
    reasoningSteps: string[];
    conclusion: string;
  };
}

export interface AgentChainStatus {
  research: {
    execution_verified: boolean | 'UNKNOWN';
    sources_verified: boolean | 'UNKNOWN';
    findings_traceable: boolean | 'UNKNOWN';
  };
  business: {
    research_input_verified: boolean | 'UNKNOWN';
    claims_traceable: boolean | 'UNKNOWN';
    additional_research_verified: boolean | 'UNKNOWN';
  };
  red_team: {
    previous_inputs_verified: boolean | 'UNKNOWN';
    contradiction_search_verified: boolean | 'UNKNOWN';
    claims_challenged: boolean | 'UNKNOWN';
  };
  judge: {
    all_agent_inputs_verified: boolean | 'UNKNOWN';
    evidence_chain_verified: boolean | 'UNKNOWN';
    decision_gate_passed: boolean | 'UNKNOWN';
  };
}

export interface EvidenceVerificationReport {
  researchExecution: VerificationStatus;
  externalSources: VerificationStatus;
  findingToSourceTraceability: VerificationStatus;
  businessInheritance: VerificationStatus;
  redTeamInheritance: VerificationStatus;
  contradictionSearch: VerificationStatus;
  judgeEvidenceChain: VerificationStatus;
  overallEvidenceIntegrity: VerificationStatus;
  decisionGatePassed: boolean;
  downgradedFromBuild: boolean;
  warnings: string[];
  auditTrail: Array<{
    step: string;
    status: VerificationStatus;
    notes: string;
  }>;
}

/**
 * 13. Critical Question entity
 */
export interface CriticalQuestion {
  id: string;
  ventureId: string;
  questionNumber: number;
  question: string;
  rationale: string;
  whyItMatters?: string;
  category: QuestionCategory;
  suggestedOptions?: string[];
  required: boolean;
  answer?: string;
  status: QuestionStatus;
}

/**
 * 14. Founder Decision entity
 */
export interface Decision {
  id: string;
  ventureId: string;
  choice: FounderDecisionType;
  rationale: string;
  alignmentWithAI: 'ALIGNED' | 'OVERRIDDEN' | 'MODIFIED';
  overrideReason?: string;
  decidedAt: string;
}

/**
 * 15. Root Venture entity
 */
export interface Venture {
  id: string;
  title: string;
  description: string;
  rawIdea?: string;
  targetAudience?: string;
  valueProposition?: string;
  monetizationIdea?: string;
  
  // Structured understanding from Gemini
  problem?: string | null;
  solution?: string | null;
  targetCustomer?: string | null;
  marketGeography?: string | null;
  businessModel?: string | null;
  technology?: string | null;
  founderAssumptions?: string[];
  importantUnknowns?: string[];
  founderContext?: string;

  createdAt: string;
  updatedAt: string;
  status: VentureStatus;
  
  // Child entity relationships
  questions: CriticalQuestion[];
  researchReport?: ResearchReport;
  businessReport?: BusinessReport;
  redTeamReport?: RedTeamReport;
  judgeReport?: JudgeReport;
  score?: VentureScore;
  decision?: Decision;
  nextActions: NextAction[];
  collaborationRecords?: CollaborationRecord[];
  agentRunRecords?: AgentRunRecord[];
  agentChainStatus?: AgentChainStatus;
  evidenceVerificationReport?: EvidenceVerificationReport;
  
  // User annotations & feedback on the venture idea
  founderNotes?: string;
  founderComments?: Array<{
    id: string;
    author: string;
    text: string;
    category?: 'idea_pivot' | 'pricing_feedback' | 'market_insight' | 'general';
    createdAt: string;
  }>;
}
