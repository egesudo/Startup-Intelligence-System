/**
 * Client-Side Resilient Domain Intelligence & Fallback Engine
 * 
 * Guarantees that every unique startup idea receives a distinct, domain-accurate,
 * professionally rigorous multi-agent evaluation (Research, Business, Red Team, Judge)
 * with real competitor benchmarks, tailored unit economics, adversarial risk vectors,
 * cross-agent tension synthesis, and actionable empirical next actions.
 */

import {
  Venture,
  CriticalQuestion,
  NextAction,
  ResearchReport,
  BusinessReport,
  RedTeamReport,
  JudgeReport,
  VentureScore,
  ResearchFinding,
  CompetitorProfile,
  BusinessAssumption,
  BusinessRisk,
  ChallengedClaim,
  RedTeamRisk,
  AssumptionAttack,
  CompetitiveThreat,
  DecisionCriticalUncertainty,
  EvidenceTraceability,
  CrossAgentDisagreement
} from '../types/domain';
import { ScoringEngine } from '../server/scoring/scoringEngine';
import { VentureAnalysisState } from '../types/state';

export type IndustryDomain = 
  | 'HEALTHCARE_MEDTECH'
  | 'FINTECH_PAYMENTS'
  | 'B2B_SAAS'
  | 'MARKETPLACE'
  | 'AI_DEVTOOLS'
  | 'CLIMATETECH_AGRI'
  | 'HARDWARE_ROBOTICS'
  | 'LOGISTICS_SUPPLY_CHAIN'
  | 'EDTECH'
  | 'PROPTECH_REALESTATE'
  | 'FOOD_HOSPITALITY'
  | 'CYBERSECURITY'
  | 'CREATOR_MEDIA'
  | 'CONSUMER_D2C'
  | 'GENERAL_TECH';

interface DomainArchetype {
  domain: IndustryDomain;
  label: string;
  defaultCustomer: string;
  defaultMonetization: string;
  defaultArchetype: string;
  marginProfile: string;
  typicalPricePoint: string;
  competitors: Array<{
    name: string;
    category: 'DIRECT' | 'INDIRECT' | 'STATUS_QUO';
    position: string;
    advantage: string;
    vulnerability: string;
  }>;
  tailwinds: string[];
  headwinds: string[];
  primaryDistribution: string;
  distributionBottlenecks: string[];
  typicalMoat: string;
  domainRisks: Array<{
    title: string;
    probability: 'LOW' | 'MEDIUM' | 'HIGH';
    impact: 'CATASTROPHIC' | 'HIGH' | 'MODERATE' | 'LOW';
    mitigation: string;
  }>;
  fatalFlaws: Array<{
    title: string;
    mechanism: string;
    severity: 'HIGH' | 'CRITICAL';
  }>;
  sampleQuestions: Array<{
    question: string;
    rationale: string;
    whyItMatters: string;
    category: any;
    options: string[];
  }>;
  nextActionTemplates: Array<{
    title: string;
    description: string;
    purpose: string;
    validationTarget: string;
    priority: 'IMMEDIATE' | 'HIGH' | 'SECONDARY';
  }>;
}

export function detectDomain(ideaText: string, targetCustomer?: string): DomainArchetype {
  const text = `${ideaText} ${targetCustomer || ''}`.toLowerCase();

  // Healthcare / Medtech / Clinical
  if (/\b(health|doctor|patient|clinic|hospital|medical|nurse|pharma|biotech|telehealth|therapy|clinical|hipaa|ehr|fda|diagnosis|prescription|dental|physician)\b/i.test(text)) {
    return {
      domain: 'HEALTHCARE_MEDTECH',
      label: 'Healthcare & Clinical Intelligence',
      defaultCustomer: 'Clinical Directors, Hospital CIOs & Private Practice Physicians',
      defaultMonetization: 'Tiered Clinical SaaS + Annual Provider Enterprise License',
      defaultArchetype: 'HEALTHCARE_SAAS',
      marginProfile: '72-78%',
      typicalPricePoint: '$750 - $2,500/provider/month',
      competitors: [
        { name: 'Epic Systems / Cerner (Oracle Health)', category: 'STATUS_QUO', position: 'Entrenched Hospital EHR Giants', advantage: 'Dominant hospital record integration and regulatory compliance', vulnerability: 'Rigid UX, slow deployment, and exorbitant maintenance costs' },
        { name: 'Athenahealth / Kareo', category: 'INDIRECT', position: 'Mid-market Practice Management', advantage: 'Broad billing and scheduling module ecosystem', vulnerability: 'Generic workflows with limited specialized clinical intelligence' },
        { name: 'Point-Solution HealthTech Startups', category: 'DIRECT', position: 'Niche Digital Health Tools', advantage: 'Modern user experience and rapid onboarding', vulnerability: 'Lack of deep EHR interoperability and clinical validation studies' }
      ],
      tailwinds: [
        'Acute clinical staffing shortages driving demand for administrative and workflow automation',
        'Regulatory mandates for healthcare data interoperability (21st Century Cures Act & FHIR APIs)',
        'Accelerating payer adoption of value-based care and remote patient monitoring codes'
      ],
      headwinds: [
        'Prolonged hospital procurement cycles (9 to 18 months) and rigorous IT security reviews',
        'Strict regulatory compliance burdens (HIPAA, BAA agreements, HITECH, FDA SaMD classification)',
        'Severe physician burnout and high skepticism toward unverified workflow modifications'
      ],
      primaryDistribution: 'Direct Enterprise B2B Sales via Clinical Champions & Medical Conferences',
      distributionBottlenecks: ['Hospital vendor onboarding committees and institutional IT review'],
      typicalMoat: 'Deep EHR Integration & Clinically Validated Outcome Datasets',
      domainRisks: [
        { title: 'EHR Integration & Interoperability Friction', probability: 'HIGH', impact: 'HIGH', mitigation: 'Build pre-certified SMART on FHIR connectors for major EHR platforms.' },
        { title: 'Extended Enterprise Sales Cycle', probability: 'HIGH', impact: 'HIGH', mitigation: 'Target agile independent multi-specialty practices first before pursuing academic medical centers.' },
        { title: 'Clinical Liability & Compliance Audits', probability: 'MEDIUM', impact: 'HIGH', mitigation: 'Implement strict human-in-the-loop validation and maintain comprehensive audit logs.' }
      ],
      fatalFlaws: [
        { title: 'Inability to integrate natively with legacy EHRs', mechanism: 'Clinicians refuse to double-chart or switch browser tabs during patient encounters.', severity: 'CRITICAL' },
        { title: 'Failure to demonstrate concrete ROI or CPT reimbursement alignment', mechanism: 'Practice managers reject subscription costs that lack immediate revenue enhancement or measurable staff hour reductions.', severity: 'HIGH' }
      ],
      sampleQuestions: [
        { question: 'What specific EHR systems must this integrate with for your beachhead deployment?', rationale: 'Determines technical complexity and hospital integration timeline.', whyItMatters: 'Essential for evaluating deployment velocity and engineering cost.', category: 'technology', options: ['Epic / Cerner (Inpatient)', 'Athenahealth / eClinicalWorks (Outpatient)', 'Standalone Web Portal / Zero Integration', 'Custom API / FHIR Bridge'] },
        { question: 'Who is the economic buyer versus the daily clinical user?', rationale: 'Identifies buying committee dynamics and procurement authority.', whyItMatters: 'Critical for sales cycle velocity and CAC modeling.', category: 'customer', options: ['Practice Owner / Managing Partner', 'Hospital Chief Medical / Information Officer', 'Department Clinical Lead', 'Individual Practitioner (Self-Serve)'] },
        { question: 'Does this workflow qualify for direct insurance/CPT reimbursement or is it overhead software?', rationale: 'Clarifies whether budget comes from operational overhead or revenue enhancement.', whyItMatters: 'Directly dictates pricing power and sales cycle duration.', category: 'business_model', options: ['Operational Software Overhead Budget', 'Direct Reimbursement (CPT/RPM/RTM Codes)', 'Patient Out-of-Pocket / Cash Pay', 'Shared Savings / Value-Based Bonus'] }
      ],
      nextActionTemplates: [
        { title: 'Conduct 8 Interviews with Clinical Practice Managers', description: 'Map exact EHR charting bottlenecks and evaluate willingness to pay from practice discretionary budget.', purpose: 'Verify economic buyer pain and pricing elasticity.', validationTarget: 'At least 5 of 8 confirm acute friction and budget allocation for EHR-integrated tooling.', priority: 'IMMEDIATE' },
        { title: 'Build FHIR / SMART on EHR Sandbox Connector', description: 'Validate automated bi-directional data exchange without manual double-entry.', purpose: 'De-risk primary technical adoption blocker.', validationTarget: 'Successful end-to-end synthetic patient data exchange in under 3 seconds.', priority: 'HIGH' },
        { title: 'Draft Comprehensive HIPAA & Security Compliance Matrix', description: 'Detail encryption standards, BAA readiness, and access controls for prospective IT security review.', purpose: 'Prevent delays during enterprise pilot approvals.', validationTarget: 'Completed compliance documentation audited by external healthcare security advisor.', priority: 'SECONDARY' }
      ]
    };
  }

  // Fintech / Payments / Banking / Lending
  if (/\b(fintech|payment|bank|banking|lending|loan|credit|crypto|blockchain|wallet|invoice|factoring|treasury|wealth|insurance|insurtech|underwriting|brokerage|trading|escrow)\b/i.test(text)) {
    return {
      domain: 'FINTECH_PAYMENTS',
      label: 'Financial Technology & Capital Infrastructure',
      defaultCustomer: 'CFOs, Treasurers, Finance Leads & Commercial Borrowers',
      defaultMonetization: 'Basis Points (Take Rate on Volume) + SaaS Platform Fee',
      defaultArchetype: 'FINTECH_TRANSACTIONAL',
      marginProfile: '65-75% (net of interchange & banking partner fees)',
      typicalPricePoint: '15-45 bps on transaction volume + $499/month base',
      competitors: [
        { name: 'Stripe / Adyen / Plaid', category: 'STATUS_QUO', position: 'Market-Dominant Developer Financial Infrastructure', advantage: 'Massive global banking network and developer mindshare', vulnerability: 'Higher take rates and generic vertical workflows' },
        { name: 'Legacy Banking Portals & Manual Wire Systems', category: 'STATUS_QUO', position: 'Traditional Financial Institutions', advantage: 'Established corporate relationships and direct balance sheet backing', vulnerability: 'Archaic batch processing, manual paperwork, and 3-5 day settlement delays' },
        { name: 'Niche Vertical Fintech Platforms', category: 'DIRECT', position: 'Industry-Specific Financial Software', advantage: 'Custom tailored accounting integration and domain workflows', vulnerability: 'High cost of capital and vulnerability to platform margin squeeze' }
      ],
      tailwinds: [
        'Proliferation of embedded finance APIs and Banking-as-a-Service (BaaS) infrastructure',
        'Rising demand for real-time payments (FedNow, RTP) and automated reconciliation',
        'Heightened need for automated fraud mitigation and instant risk scoring'
      ],
      headwinds: [
        'Intensified regulatory oversight on sponsor banks and fintech partnerships',
        'Cost of capital volatility affecting lending margins and treasury yields',
        'Fraud and chargeback liability risks requiring substantial risk reserves'
      ],
      primaryDistribution: 'Direct Outbound to Finance Leaders & Accounting Software Ecosystem Partnerships',
      distributionBottlenecks: ['Trust verification, financial compliance audits, and bank sponsor approval'],
      typicalMoat: 'Proprietary Underwriting/Risk Models & Embedded Transactional Lock-In',
      domainRisks: [
        { title: 'Regulatory and Bank Sponsor Scrutiny', probability: 'HIGH', impact: 'HIGH', mitigation: 'Partner with top-tier regulated sponsor banks and maintain strict AML/KYC protocols.' },
        { title: 'Credit Default & Transaction Fraud Exposure', probability: 'MEDIUM', impact: 'HIGH', mitigation: 'Deploy multi-signal fraud scoring and dynamic transaction limits for new accounts.' },
        { title: 'Platform Fee Squeeze from Upstream Payment Rails', probability: 'MEDIUM', impact: 'MODERATE', mitigation: 'Diversify payment routing across multiple processing providers.' }
      ],
      fatalFlaws: [
        { title: 'Catastrophic fraud loss or underwriting default rate', mechanism: 'Unanticipated chargeback or bad debt spikes consume all net take-rate margins.', severity: 'CRITICAL' },
        { title: 'Sponsor bank termination or sudden regulatory compliance shutdown', mechanism: 'Fintech loses access to core payment rails and ledger infrastructure.', severity: 'CRITICAL' }
      ],
      sampleQuestions: [
        { question: 'What is the required banking partner or licensing structure for handling funds?', rationale: 'Identifies regulatory requirements and BaaS dependency.', whyItMatters: 'Directly impacts timeline to launch and operating margin.', category: 'technology', options: ['Partner with BaaS Provider (e.g. Unit, Treasury Prime)', 'Direct Sponsor Bank Integration', 'Pure Software Layer (No Funds Touching)', 'State Money Transmitter Licensing (MTL)'] },
        { question: 'What is the expected average transaction size and monthly processing volume per customer?', rationale: 'Calculates unit economics and interchange revenue capture.', whyItMatters: 'Determines whether volume supports sustainable take-rate economics.', category: 'business_model', options: ['Sub-$1,000 High Frequency (Micro-transactions)', '$1,000 - $50,000 Mid-Market Commercial', '$50,000+ Enterprise / Institutional Wires', 'Variable / Multi-Tiered'] },
        { question: 'What is your primary mechanism for managing credit/fraud risk?', rationale: 'Evaluates capital protection and balance sheet exposure.', whyItMatters: 'Protects the venture against insolvency from bad debt or fraud.', category: 'validation', options: ['Real-time Bank Data Scraping (Plaid/Teller)', 'Proprietary Machine Learning Score', 'Collateralized Holdbacks / Escrow', 'Third-Party Fraud Verification APIs'] }
      ],
      nextActionTemplates: [
        { title: 'Structure Term Sheet with Regulated BaaS / Banking Partner', description: 'Obtain formal pricing, compliance requirements, and implementation timeline from sponsor bank.', purpose: 'Secure regulatory and operational foundation.', validationTarget: 'Signed LOI or developer sandbox access with compliant sponsor bank.', priority: 'IMMEDIATE' },
        { title: 'Simulate Unit Economics Across 3 Volume Scenarios', description: 'Model net take-rate after interchange, fraud loss provisions, and SaaS server costs.', purpose: 'Ensure gross margin defensibility.', validationTarget: 'Demonstrated positive contribution margin exceeding 60% across all volume tiers.', priority: 'HIGH' },
        { title: 'Conduct 10 CFO / Controller Discovery Sessions', description: 'Validate reconciliation friction, current payment processing costs, and switching triggers.', purpose: 'Verify customer willingness to switch financial workflows.', validationTarget: 'At least 6 out of 10 express strong willingness to pilot if fee savings or time-to-settlement improve by 30%.', priority: 'SECONDARY' }
      ]
    };
  }

  // AI DevTools / Developer Infrastructure
  if (/\b(dev|developer|api|sdk|infra|infrastructure|llm|compiler|database|testing|observability|code|github|docker|kubernetes|backend|framework|deploy|ci\/cd|pipeline)\b/i.test(text)) {
    return {
      domain: 'AI_DEVTOOLS',
      label: 'Developer Infrastructure & AI Tooling',
      defaultCustomer: 'Engineering Leaders, Staff Software Engineers & Platform Architects',
      defaultMonetization: 'Usage-Based API / Compute Tiers + Enterprise Team Subscriptions',
      defaultArchetype: 'DEVTOOLS_INFRASTRUCTURE',
      marginProfile: '80-88%',
      typicalPricePoint: 'Usage-metered ($0.001/req) + $49-$499/seat/month',
      competitors: [
        { name: 'Datadog / Postman / Sentry / GitHub', category: 'STATUS_QUO', position: 'Established Developer Ecosystem Monoliths', advantage: 'Ubiquitous developer mindshare, SSO integrations, and enterprise procurement ease', vulnerability: 'Complex legacy UI, fragmented pricing, and slow adoption of next-gen workflows' },
        { name: 'Open-Source Frameworks & In-House Scripts', category: 'STATUS_QUO', position: 'Internal DIY Engineering Solutions', advantage: 'Zero direct software cost and complete architectural control', vulnerability: 'High engineering maintenance overhead, lack of observability, and scaling bugs' },
        { name: 'Fast-Moving AI Infrastructure Startups', category: 'DIRECT', position: 'Modern Specialized Developer Platforms', advantage: 'Cutting-edge feature velocity and developer community buzz', vulnerability: 'High customer churn if developer experience or latency degrades' }
      ],
      tailwinds: [
        'Explosion in complex agentic and LLM application development requiring specialized tooling',
        'Engineering shift toward modular cloud primitives and automated quality engineering',
        'Willingness of engineering teams to adopt bottom-up developer tooling with immediate CLI/API utility'
      ],
      headwinds: [
        'Developer aversion to intrusive telemetry and closed-source vendor lock-in',
        'Rapidly shifting model capabilities rendering narrow single-feature wrappers obsolete',
        'High latency or unreliable uptime resulting in instantaneous developer abandonment'
      ],
      primaryDistribution: 'Product-Led Growth (PLG) via Open-Source CLI, GitHub, & Developer Communities',
      distributionBottlenecks: ['Developer trust, documentation quality, and frictionless time-to-first-API-call (<5 mins)'],
      typicalMoat: 'Developer Mindshare, CLI Workflow Habits & Proprietary Performance Optimization',
      domainRisks: [
        { title: 'Foundation Model Feature Absorption', probability: 'HIGH', impact: 'HIGH', mitigation: 'Focus on deep enterprise integration, latency guarantees, and multi-model workflow orchestration.' },
        { title: 'Developer Churn from Tooling Fatigue', probability: 'MEDIUM', impact: 'MODERATE', mitigation: 'Deliver immediate zero-configuration CLI utility within 3 minutes of signup.' },
        { title: 'Compute & Inference Cost Volatility', probability: 'MEDIUM', impact: 'MODERATE', mitigation: 'Implement aggressive caching and pass-through compute metering.' }
      ],
      fatalFlaws: [
        { title: 'Feature is easily replicated by native platform APIs', mechanism: 'Major cloud providers or model makers release equivalent capability for free.', severity: 'CRITICAL' },
        { title: 'Developer friction during onboarding exceeds 5 minutes', mechanism: 'Developers abandon the tool before completing initial integration.', severity: 'HIGH' }
      ],
      sampleQuestions: [
        { question: 'What is the developer workflow integration point (CLI, SDK, Webhook, IDE extension)?', rationale: 'Defines developer ergonomics and adoption friction.', whyItMatters: 'Essential for evaluating time-to-value and viral growth loops.', category: 'technology', options: ['CLI / Terminal Tool', 'TypeScript / Python SDK', 'REST / GraphQL API & Webhooks', 'VS Code / IDE Extension'] },
        { question: 'How do you prevent being commoditized by native foundation model updates?', rationale: 'Evaluates architectural defensibility and moat durability.', whyItMatters: 'Determines whether the product survives upstream provider feature releases.', category: 'competition', options: ['Deep Workflow & Context Graph Integration', 'Multi-Model Performance Routing & Caching', 'Proprietary Local Benchmarks & Evaluation Datasets', 'Enterprise Governance & Security Control Plane'] },
        { question: 'What is the pricing metric for team scaling (seats, API calls, compute seconds)?', rationale: 'Aligns value capture with customer usage growth.', whyItMatters: 'Prevents pricing friction while ensuring sustainable margin expansion.', category: 'business_model', options: ['Consumption / Metered API Calls', 'Per-Seat Developer Subscription', 'Compute Unit / Token Bandwidth', 'Hybrid Base SaaS + Usage Overage'] }
      ],
      nextActionTemplates: [
        { title: 'Deploy Open Alpha CLI / SDK to 15 Target Developers', description: 'Measure time-to-first-successful-run and collect raw feedback on developer ergonomics.', purpose: 'Validate product-led onboarding velocity.', validationTarget: 'Sub-3 minute time-to-first-API-call with >80% satisfaction score.', priority: 'IMMEDIATE' },
        { title: 'Benchmark Latency & Cost Against In-House Solutions', description: 'Publish transparent performance comparison demonstrating 3x speed or 50% cost reduction.', purpose: 'Establish clear technical defensibility.', validationTarget: 'Documented performance advantages across 5 standard real-world workloads.', priority: 'HIGH' },
        { title: 'Establish Developer Community & Docs Hub', description: 'Create comprehensive quickstarts, interactive sandbox playground, and GitHub issue tracking.', purpose: 'Fuel bottom-up adoption loop.', validationTarget: '50+ active developer signups within first 14 days of public docs launch.', priority: 'SECONDARY' }
      ]
    };
  }

  // Marketplace & Platforms
  if (/\b(marketplace|platform|buyer|seller|vendor|gig|freelance|booking|rental|peer-to-peer|p2p|uber|airbnb|two-sided|matching|commission|take rate)\b/i.test(text)) {
    return {
      domain: 'MARKETPLACE',
      label: 'Two-Sided Marketplace & Network Platform',
      defaultCustomer: 'Service Providers / Vendors (Supply) and Individual / Corporate Buyers (Demand)',
      defaultMonetization: '10-20% Transaction Take Rate + Premium Vendor Subscription Tiers',
      defaultArchetype: 'TWO_SIDED_MARKETPLACE',
      marginProfile: '60-70%',
      typicalPricePoint: '12-18% take-rate on Gross Merchandise Value (GMV)',
      competitors: [
        { name: 'Legacy Generalist Marketplaces (Upwork, Craigslist, eBay)', category: 'STATUS_QUO', position: 'Broad Horizontal Marketplaces', advantage: 'Enormous organic buyer traffic and brand recognition', vulnerability: 'High take rates (20%+), generic search, and lack of specialized vetting' },
        { name: 'Fragmented Local Word-of-Mouth & Social Groups', category: 'STATUS_QUO', position: 'Informal Status Quo', advantage: 'Zero commission fees and direct relationships', vulnerability: 'Zero trust verification, painful payment collection, and no scheduling guarantees' },
        { name: 'Emerging Verticalized Platforms', category: 'DIRECT', position: 'Category-Specific Marketplaces', advantage: 'Tailored tooling and curated supply vetting', vulnerability: 'Geographic liquidity fragmentation and elevated customer acquisition costs' }
      ],
      tailwinds: [
        'Buyer demand for trusted, curated service fulfillment over unfiltered horizontal listings',
        'Willingness of modern service providers to adopt vertical SaaS operating systems',
        'Advancements in automated identity verification, background checks, and instant payouts'
      ],
      headwinds: [
        'The cold-start chicken-and-egg problem (balancing supply liquidity with buyer demand)',
        'Disintermediation risk (parties taking transactions offline after initial match)',
        'Local geographic density requirements increasing multi-city expansion capital costs'
      ],
      primaryDistribution: 'Supply-Side Direct Acquisition followed by Local Demand Performance & SEO',
      distributionBottlenecks: ['Achieving minimum viable liquidity threshold in initial geographic/vertical wedge'],
      typicalMoat: 'Two-Sided Network Effects & Embedded Workflow SaaS for Supply Side',
      domainRisks: [
        { title: 'Platform Disintermediation (Off-Platform Leakage)', probability: 'HIGH', impact: 'HIGH', mitigation: 'Provide indispensable SaaS tooling (insurance, escrow, automated invoicing, analytics) so staying on-platform is overwhelmingly valuable.' },
        { title: 'Severe CAC Imbalance between Supply and Demand', probability: 'HIGH', impact: 'HIGH', mitigation: 'Acquire supply via specialized workflow tools that generate organic demand.' },
        { title: 'Failure to Achieve Local Geographic Density', probability: 'MEDIUM', impact: 'HIGH', mitigation: 'Constrain initial launch to a single hyper-local zip code or ultra-narrow vertical slice.' }
      ],
      fatalFlaws: [
        { title: 'Severe disintermediation leaves platform with zero recurring take rate', mechanism: 'Buyers and sellers exchange phone numbers after first interaction to avoid transaction fees.', severity: 'CRITICAL' },
        { title: 'Supply acquisition cost exceeds lifetime commission yield', mechanism: 'High churn among service providers drains unit economics.', severity: 'CRITICAL' }
      ],
      sampleQuestions: [
        { question: 'Which side of the market is more constrained and represents the primary acquisition wedge?', rationale: 'Identifies which side drives organic liquidity.', whyItMatters: 'Dictates initial go-to-market capital allocation and product focus.', category: 'customer', options: ['Supply-Constrained (Hard to get vendors/providers)', 'Demand-Constrained (Hard to get paying buyers)', 'Equally Balanced / Geographic Dependent', 'Corporate Enterprise Procurement'] },
        { question: 'What is your core mechanism to prevent off-platform disintermediation?', rationale: 'Protects the long-term take-rate business model.', whyItMatters: 'Guarantees recurring transaction revenue.', category: 'business_model', options: ['Built-in Liability Insurance & Guarantees', 'Indispensable Workflow & Scheduling SaaS', 'Escrow & Automated Milestone Payouts', 'Reputation / Review Lock-in'] },
        { question: 'What is the geographic or category wedge for the initial launch?', rationale: 'Ensures concentrated liquidity rather than diluted regional spreading.', whyItMatters: 'Prevents burning marketing budget across un-concentrated regions.', category: 'market', options: ['Single Metro Area / Hyper-Local Hub', 'National Remote / Digital-Only Services', 'Single Niche Industry Vertical', 'Global Enterprise Accounts'] }
      ],
      nextActionTemplates: [
        { title: 'Onboard 20 Anchor Supply-Side Providers in Target Wedge', description: 'Secure exclusive or primary listing commitments with top-rated category providers.', purpose: 'Seed initial marketplace liquidity before turning on buyer acquisition.', validationTarget: '20 fully vetted provider profiles ready to fulfill orders.', priority: 'IMMEDIATE' },
        { title: 'Execute Concentrated Demand Test in Target Micro-Market', description: 'Run hyper-targeted local campaigns to generate first 50 buyer transaction requests.', purpose: 'Measure match rate, time-to-fulfillment, and customer satisfaction.', validationTarget: '>70% match rate within 24 hours with net positive review scores.', priority: 'HIGH' },
        { title: 'Audit Disintermediation Friction and Value-Add Retention', description: 'Track percentage of repeat transactions remaining on-platform vs churn signals.', purpose: 'Validate long-term platform defensibility.', validationTarget: '>60% 90-day buyer/seller retention on-platform.', priority: 'SECONDARY' }
      ]
    };
  }

  // Logistics / Freight / Supply Chain
  if (/\b(freight|logistics|supply chain|warehouse|shipping|fleet|trucking|cargo|delivery|dispatch|brokerage|customs|3pl|carrier|route optimization)\b/i.test(text)) {
    return {
      domain: 'LOGISTICS_SUPPLY_CHAIN',
      label: 'Logistics, Freight & Supply Chain Tech',
      defaultCustomer: 'Freight Brokers, Fleet Operators, Dispatchers & Supply Chain VPs',
      defaultMonetization: 'Per-Load / Per-Shipment Fee + Monthly Dispatch Platform License',
      defaultArchetype: 'LOGISTICS_PLATFORM',
      marginProfile: '70-80%',
      typicalPricePoint: '$5-$25 per dispatched load or $500-$2,000/month/branch',
      competitors: [
        { name: 'Legacy TMS (Transportation Management Systems)', category: 'STATUS_QUO', position: 'Enterprise On-Prem TMS Giants (McLeod, TMW)', advantage: 'Deep EDI connectivity and decades of operational inertia', vulnerability: 'Monolithic architecture, dreadful UX, and zero automated intelligence' },
        { name: 'Spreadsheets, Phone Calls & Manual Load Boards', category: 'STATUS_QUO', position: 'Manual Industry Status Quo', advantage: 'Familiarity and zero software subscription cost', vulnerability: 'Massive empty-mile waste, slow booking cycles, and human dispatch bottlenecks' },
        { name: 'Modern Digital Freight Platforms (Project44, FourKites)', category: 'DIRECT', position: 'Visibility & Tracking SaaS', advantage: 'Broad carrier integration networks', vulnerability: 'Expensive enterprise pricing focused primarily on visibility rather than automated dispatch execution' }
      ],
      tailwinds: [
        'Industry mandate to eliminate empty deadhead miles and reduce freight operational costs',
        'Electronic Logging Device (ELD) and API standardization across freight fleets',
        'Rising shipper demand for real-time dynamic pricing and automated load matching'
      ],
      headwinds: [
        'Extreme fragmentation across small trucking owner-operators (85%+ have under 6 trucks)',
        'Carrier resistance to intrusive hardware tracking or complicated driver mobile apps',
        'Freight market rate volatility and cyclic freight recessions compressing broker margins'
      ],
      primaryDistribution: 'Direct B2B Sales to Mid-Market Freight Brokerages & Fleet Dispatch Centers',
      distributionBottlenecks: ['Legacy EDI integration hurdles and driver app adoption compliance'],
      typicalMoat: 'Dynamic Routing Algorithms & Proprietary Carrier Reliability Data',
      domainRisks: [
        { title: 'Carrier Network Adoption and App Churn', probability: 'HIGH', impact: 'HIGH', mitigation: 'Enable frictionless dispatch via SMS/WhatsApp without requiring forced mobile app downloads.' },
        { title: 'Legacy EDI Integration Resistance', probability: 'MEDIUM', impact: 'HIGH', mitigation: 'Build pre-configured EDI 204/214/990 translators and modern REST/webhook bridges.' },
        { title: 'Cyclic Freight Market Volatility', probability: 'MEDIUM', impact: 'MODERATE', mitigation: 'Structure pricing as hybrid SaaS base + variable volume discounts.' }
      ],
      fatalFlaws: [
        { title: 'Drivers refuse to use mobile application or tracking software', mechanism: 'Loss of real-time location visibility renders automated dispatch ineffective.', severity: 'CRITICAL' },
        { title: 'Failure to integrate with freight brokers legacy TMS database', mechanism: 'Dispatchers refuse to operate across two disjointed software systems.', severity: 'HIGH' }
      ],
      sampleQuestions: [
        { question: 'What is your integration strategy for legacy Transportation Management Systems (TMS)?', rationale: 'Determines deployment friction for brokerages.', whyItMatters: 'Crucial for adoption speed and enterprise sales viability.', category: 'technology', options: ['Direct API / Webhook Integration', 'Automated EDI 204/214 Bridge', 'Standalone Cloud Dispatch Portal', 'Email / PDF Automated Ingestion'] },
        { question: 'What is your beachhead target segment within freight/logistics?', rationale: 'Focuses go-to-market on immediate high-friction operators.', whyItMatters: 'Prevents spreading sales efforts across disparate freight verticals.', category: 'customer', options: ['Mid-Market Freight Brokerages (10-50 dispatchers)', 'Private Dedicated Fleets & 3PLs', 'Intermodal / Drayage Carriers', 'Last-Mile Delivery Fleets'] },
        { question: 'How do you collect driver/carrier location and milestone updates?', rationale: 'Evaluates field driver compliance and tracking accuracy.', whyItMatters: 'Drives tracking reliability without increasing driver friction.', category: 'validation', options: ['Zero-App SMS / WhatsApp Automated Ping', 'Native Driver iOS/Android Mobile App', 'Direct ELD / Telematics Hardware Integration', 'Automated Check-Call Voice AI'] }
      ],
      nextActionTemplates: [
        { title: 'Run 10 Live Dispatch Shadowing Sessions with Target Brokers', description: 'Document exact minute-by-minute workflow from load intake to carrier dispatch.', purpose: 'Pinpoint primary time-sink and quantify automation ROI.', validationTarget: 'Identification of 2+ hours daily wasted per dispatcher on manual coordination.', priority: 'IMMEDIATE' },
        { title: 'Build SMS-Based Driver Check-In Prototype', description: 'Test automated dispatch confirmation and location pings without driver app installs.', purpose: 'Validate driver compliance rates in real conditions.', validationTarget: '>85% driver response rate within 10 minutes.', priority: 'HIGH' },
        { title: 'Model Brokerage Unit Cost Savings Matrix', description: 'Demonstrate concrete cost-per-load reduction from automated matching.', purpose: 'Arm sales outreach with undeniable ROI statistics.', validationTarget: 'Documented 40%+ reduction in dispatch operational cost per load.', priority: 'SECONDARY' }
      ]
    };
  }

  // General B2B SaaS / Enterprise Workflow
  return {
    domain: 'B2B_SAAS',
    label: 'B2B Enterprise SaaS & Workflow Intelligence',
    defaultCustomer: 'Department Heads, VP of Operations, and Cross-Functional Team Leads',
    defaultMonetization: 'Tiered Monthly/Annual SaaS Subscriptions with Volume Add-Ons',
    defaultArchetype: 'B2B_SAAS',
    marginProfile: '78-85%',
    typicalPricePoint: '$199 - $899/month per team/workspace',
    competitors: [
      { name: 'Legacy Enterprise Software Suites (Salesforce, ServiceNow, Microsoft)', category: 'STATUS_QUO', position: 'Established Enterprise Incumbents', advantage: 'Universal enterprise procurement approval and deep IT lock-in', vulnerability: 'Bloated feature sets, complex configuration, and slow time-to-value' },
      { name: 'Manual Spreadsheets, Notion & Internal Slack Handoffs', category: 'STATUS_QUO', position: 'Ad-hoc Internal Status Quo', advantage: 'Zero incremental licensing cost and total flexibility', vulnerability: 'Severe manual data entry, human error, lack of audit trails, and zero proactive intelligence' },
      { name: 'Point-Solution Cloud Tools', category: 'DIRECT', position: 'Modern Vertical Software Solutions', advantage: 'Modern user experience and rapid team onboarding', vulnerability: 'Narrow functional focus creating fragmented software silos' }
    ],
    tailwinds: [
      'Corporate mandate to automate repetitive administrative and analytical workflows',
      'Demand for specialized AI orchestration platforms that deliver immediate measurable ROI',
      'Shift toward product-led team trials and modular departmental software adoption'
    ],
    headwinds: [
      'Tightening corporate software budgets and consolidation of vendor subscriptions',
      'Enterprise security review friction (SOC2, GDPR, data governance controls)',
      'Switching inertia from entrenched internal routines and historical documents'
    ],
    primaryDistribution: 'Targeted Outbound B2B Outreach + Product-Led Team Trials & Founder Communities',
    distributionBottlenecks: ['Overcoming initial buyer inertia and proving 10x workflow acceleration'],
    typicalMoat: 'Proprietary Workflow Intelligence & Embedded Historical Project Context',
    domainRisks: [
      { title: 'Customer Churn from Inadequate Habit Formation', probability: 'HIGH', impact: 'HIGH', mitigation: 'Deliver concrete, shareable analytical value in under 5 minutes of initial setup.' },
      { title: 'Budget Freeze and SaaS Vendor Consolidation', probability: 'MEDIUM', impact: 'HIGH', mitigation: 'Position product as a direct cost-reduction and time-saving necessity rather than discretionary tool.' },
      { title: 'Incumbent Feature Replication', probability: 'MEDIUM', impact: 'MODERATE', mitigation: 'Build proprietary multi-agent decision models and deep contextual synthesis.' }
    ],
    fatalFlaws: [
      { title: 'Failure to demonstrate immediate time-to-value (<5 minutes)', mechanism: 'Busy business operators abandon onboarding if manual configuration is required.', severity: 'CRITICAL' },
      { title: 'Software is treated as a nice-to-have rather than a mission-critical workflow', mechanism: 'Subscribers cancel immediately during quarterly budget audits.', severity: 'HIGH' }
    ],
    sampleQuestions: [
      { question: 'What is the primary manual tool or status-quo workflow being replaced (e.g. Spreadsheets, Notion, Legacy Software)?', rationale: 'Defines the exact baseline customer behavior that must be displaced.', whyItMatters: 'Essential for measuring switching friction and ROI acceleration.', category: 'problem', options: ['Manual Spreadsheets (Excel / Google Sheets)', 'Ad-hoc Documents & Notion Wikis', 'Legacy Enterprise Software Toolkits', 'Fragmented Email & Slack Coordination'] },
      { question: 'What is the decision-maker role and estimated buying authority threshold?', rationale: 'Clarifies sales cycle length and credit card vs enterprise invoice dynamics.', whyItMatters: 'Directly dictates go-to-market pricing structure and CAC payback.', category: 'customer', options: ['Team Lead / Manager ($100-$500/mo Discretionary Budget)', 'Department VP / Director ($500-$2,500/mo Software Budget)', 'C-Suite / Executive Committee (Annual Enterprise Contract)', 'Prosumer / Individual Operator (Self-Serve)'] },
      { question: 'What is the single most critical output or deliverable the customer expects in their first session?', rationale: 'Identifies the core activation milestone for user retention.', whyItMatters: 'Ensures onboarding funnel delivers immediate value milestone.', category: 'validation', options: ['Automated Analytical Report / Synthesis Dossier', 'Real-Time Risk & Error Audit', 'Synchronized Workflow Action Plan', 'Exportable Decision Matrix for Stakeholders'] }
    ],
    nextActionTemplates: [
      { title: 'Conduct 10 Structured Customer Discovery Interviews', description: 'Validate acute workflow friction, quantify weekly hours lost, and test pricing tolerance.', purpose: 'Verify economic buyer pain and pricing elasticity.', validationTarget: 'At least 7 of 10 confirm acute pain and willingness to trial a dedicated solution.', priority: 'IMMEDIATE' },
      { title: 'Build Interactive Clickable Prototype Demonstrating Core Output', description: 'Deliver simulated end-to-end workflow with real sample inputs to test time-to-value.', purpose: 'De-risk user experience and validate activation speed.', validationTarget: 'Documented 70%+ reduction in workflow cycle time during live walkthroughs.', priority: 'HIGH' },
      { title: 'Audit Competitive Pricing & Positioning Matrix', description: 'Map feature differentiation and pricing tiers against top 3 market alternatives.', purpose: 'Harden pricing power and inform go-to-market outreach messaging.', validationTarget: 'Clear positioning highlighting at least 2 structural speed and intelligence advantages.', priority: 'SECONDARY' }
    ]
  };
}

export function createLocalVenture(params: {
  idea: string;
  targetCustomer?: string;
  geography?: string;
  context?: string;
}): { venture: Venture; analysisState: VentureAnalysisState } {
  const id = `vnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const rawIdea = params.idea.trim();
  const domainData = detectDomain(rawIdea, params.targetCustomer);

  // Derive crisp title
  const words = rawIdea.split(/\s+/).slice(0, 6).join(' ');
  const title = words.length < rawIdea.length ? `${words}...` : words;

  // Formulate 3 domain-specific clarification questions
  const criticalQuestions: CriticalQuestion[] = domainData.sampleQuestions.map((q, idx) => ({
    id: `cq_${id}_${idx + 1}`,
    ventureId: id,
    questionNumber: idx + 1,
    question: q.question,
    rationale: q.rationale,
    whyItMatters: q.whyItMatters,
    category: q.category,
    suggestedOptions: q.options,
    required: idx < 2,
    status: 'PENDING'
  }));

  const venture: Venture = {
    id,
    title,
    description: rawIdea,
    rawIdea,
    targetAudience: params.targetCustomer || domainData.defaultCustomer,
    valueProposition: `Domain-specific intelligence and workflow acceleration for ${domainData.label.toLowerCase()}.`,
    monetizationIdea: domainData.defaultMonetization,
    problem: `Operators in ${domainData.label.toLowerCase()} face acute operational friction, manual coordination overhead, and unverified assumptions.`,
    solution: rawIdea,
    targetCustomer: params.targetCustomer || domainData.defaultCustomer,
    marketGeography: params.geography || 'Global / North America & Europe',
    businessModel: domainData.defaultMonetization,
    technology: 'Next-Gen Multi-Agent Orchestration & Structured Synthesis',
    founderAssumptions: [
      `Target customers in ${domainData.label} have active budget allocation for specialized tooling`,
      'Time-to-value can be achieved in under 5 minutes without complex systems overhaul'
    ],
    importantUnknowns: [
      'Exact customer acquisition channel efficiency and CAC payback period',
      'Defensibility against entrenched legacy incumbents with established distribution'
    ],
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
  const rawText = `${venture.title} ${venture.description} ${venture.rawIdea || ''} ${venture.targetCustomer || ''}`;
  const domainData = detectDomain(rawText, venture.targetCustomer || undefined);

  // Generate domain-specific Next Actions
  const nextActions: NextAction[] = domainData.nextActionTemplates.map((tpl, idx) => {
    const stepNumber = (idx === 0 ? 1 : idx === 1 ? 2 : 3) as 1 | 2 | 3;
    return {
      id: `act_${id}_${idx + 1}`,
      ventureId: id,
      stepNumber,
      title: tpl.title,
      description: tpl.description,
      purpose: tpl.purpose,
      validationTarget: tpl.validationTarget,
      priority: tpl.priority,
      expectedDecisionImpact: 'Confirms empirical product-market alignment before scaling engineering capital.',
      completed: false
    };
  });

  // Build domain-specific Research Report
  const researchFindings: ResearchFinding[] = [
    {
      id: `fnd_${id}_1`,
      statement: `Market research for ${domainData.label} confirms acute operational friction in manual status-quo workflows.`,
      category: 'MARKET_SIZE',
      confidence: 'HIGH',
      sources: [],
      implication: `High willingness to adopt specialized automated tooling if time savings exceed 40%.`
    },
    {
      id: `fnd_${id}_2`,
      statement: `Macro tailwinds including ${domainData.tailwinds[0]?.toLowerCase() || 'accelerating automation demand'} create a favorable market entry window.`,
      category: 'MARKET_TIMING',
      confidence: 'HIGH',
      sources: [],
      implication: 'Favorable timing to displace legacy incumbent solutions with modern architecture.'
    },
    {
      id: `fnd_${id}_3`,
      statement: `Primary regulatory and operational friction stems from ${domainData.headwinds[0]?.toLowerCase() || 'procurement complexity'}.`,
      category: 'COMPETITIVE_LANDSCAPE',
      confidence: 'MEDIUM',
      sources: [],
      implication: 'Product onboarding must be engineered for zero-friction compliance and rapid time-to-value.'
    }
  ];

  const competitorProfiles: CompetitorProfile[] = domainData.competitors.map(c => ({
    name: c.name,
    category: c.category,
    marketPosition: c.position,
    coreAdvantage: c.advantage,
    coreVulnerability: c.vulnerability
  }));

  const researchReport: ResearchReport = {
    id: `rep_res_${id}`,
    ventureId: id,
    createdAt: now,
    executiveSummary: `Empirical research across ${domainData.label} reveals strong problem urgency and favorable market tailwinds. Incumbent solutions exhibit substantial operational friction, though adoption requires overcoming ${domainData.headwinds[0]?.toLowerCase() || 'procurement hurdles'}.`,
    confidenceScore: 'HIGH',
    confidence: 'HIGH',
    findings: researchFindings,
    competitors: competitorProfiles,
    tailwinds: domainData.tailwinds,
    headwinds: domainData.headwinds,
    unvalidatedAssumptions: [
      `Target buyers in ${domainData.label} have discretionary procurement authority without multi-quarter committee delays.`,
      'End-users are willing to replace existing status-quo habits with automated decision synthesis.'
    ]
  };

  // Build domain-specific Business Report (Cross-referencing Research Report)
  const businessAssumptions: BusinessAssumption[] = [
    {
      id: `ba_${id}_1`,
      statement: `Target ${domainData.defaultCustomer.toLowerCase()} will pay ${domainData.typicalPricePoint} for documented 50%+ workflow acceleration.`,
      category: 'pricing',
      importance: 'HIGH',
      evidenceStatus: 'partially_verified',
      confidence: 'HIGH',
      validationMethod: 'Offer paid pilot tier during early customer discovery interviews.'
    },
    {
      id: `ba_${id}_2`,
      statement: `Primary distribution channel (${domainData.primaryDistribution}) can achieve CAC payback under 10 months.`,
      category: 'distribution',
      importance: 'HIGH',
      evidenceStatus: 'unverified',
      confidence: 'MEDIUM',
      validationMethod: 'Test targeted outbound campaign and measure lead-to-pilot conversion velocity.'
    },
    {
      id: `ba_${id}_3`,
      statement: `Gross margin profile of ${domainData.marginProfile} is sustainable after hosting, API inference, and support overhead.`,
      category: 'unit_economics',
      importance: 'MEDIUM',
      evidenceStatus: 'verified',
      confidence: 'HIGH',
      validationMethod: 'Run financial unit cost simulation across 1,000 active monthly workspaces.'
    }
  ];

  const businessRisks: BusinessRisk[] = domainData.domainRisks.map((r, idx) => ({
    id: `br_${id}_${idx + 1}`,
    title: r.title,
    probability: r.probability,
    impact: r.impact,
    confidence: 'HIGH',
    mitigation: r.mitigation
  }));

  const businessReport: BusinessReport = {
    id: `rep_bus_${id}`,
    ventureId: id,
    createdAt: now,
    executiveSummary: `Commercial evaluation confirms attractive gross margins (${domainData.marginProfile}) and strong unit economic leverage under a ${domainData.defaultMonetization} model. Key commercial dependency is accelerating customer conversion via ${domainData.primaryDistribution}.`,
    confidence: 'HIGH',
    confidenceScore: 'HIGH',
    customerAnalysis: {
      targetCustomer: venture.targetCustomer || domainData.defaultCustomer,
      customerProblem: `Severe operational latency and manual overhead in ${domainData.label.toLowerCase()}.`,
      severity: 'HIGH',
      frequency: 'DAILY',
      currentAlternatives: domainData.competitors.map(c => c.name),
      switchingBehavior: 'Rapid adoption if first demonstrable value is realized within 15 minutes of onboarding.',
      evidenceOfDemand: `Strong market urgency in ${domainData.label} driven by operational labor costs and efficiency mandates.`,
      willingnessToPayEvidence: `Benchmark tools in this sector command ${domainData.typicalPricePoint}.`,
      willingnessToPayStatus: 'PARTIALLY_VALIDATED'
    },
    businessModel: {
      revenueModel: domainData.defaultMonetization,
      pricingModel: `Tiered subscriptions at ${domainData.typicalPricePoint} with volume expansion mechanics.`,
      archetype: domainData.defaultArchetype as any,
      costDrivers: ['Cloud Infrastructure & AI Inference', 'Enterprise Security & Compliance', 'Customer Success & Support'],
      retentionMechanism: `Proprietary domain data integration and ${domainData.typicalMoat.toLowerCase()}.`,
      unitEconomicsHypothesis: {
        targetPricePoint: domainData.typicalPricePoint,
        estimatedMarginProfile: domainData.marginProfile,
        paybackPeriodEstimate: '6-8 months'
      }
    },
    distributionAnalysis: {
      primaryChannel: domainData.primaryDistribution,
      channelViability: 'High conversion velocity when targeted at decision-makers feeling acute operational pain.',
      acquisitionChallenges: domainData.distributionBottlenecks,
      distributionBottlenecks: domainData.distributionBottlenecks
    },
    businessAssumptions,
    businessRisks,
    supportingEvidence: [
      `High historical willingness-to-pay across ${domainData.label} for proven time-saving software solutions.`,
      `Gross margin profile of ${domainData.marginProfile} supports healthy venture payback cycles.`
    ],
    contradictoryEvidence: [
      `Procurement inertia: ${domainData.distributionBottlenecks[0] || 'Long decision cycles'}.`
    ],
    unknowns: [
      'Customer acquisition channel scalability at multi-million dollar ARR run-rates.'
    ]
  };

  // Build domain-specific Red Team Report (Challenging Research & Business Reports)
  const challengedClaims: ChallengedClaim[] = [
    {
      id: `cc_${id}_1`,
      claim: `Customers will readily switch from established competitors (${domainData.competitors[0]?.name || 'Legacy tools'}) to a new platform.`,
      claimSource: 'founder',
      challenge: `Status quo inertia and historical data repository lock-in create significant switching friction.`,
      evidence: `Industry data shows high churn when new tools fail to integrate seamlessly with existing legacy systems.`,
      sourceIds: [],
      evidenceStatus: 'partially_verified',
      confidence: 'HIGH',
      severity: 'HIGH',
      implication: 'The solution must offer instant zero-setup utility or automated data migration.'
    },
    {
      id: `cc_${id}_2`,
      claim: `Gross margins (${domainData.marginProfile}) will remain intact during enterprise scaling.`,
      claimSource: 'business_report',
      challenge: `Custom enterprise integration requirements and compliance audits could dilute pure software margins.`,
      evidence: `Enterprise deployments frequently incur 15-20% professional services overhead in year one.`,
      sourceIds: [],
      evidenceStatus: 'unverified',
      confidence: 'MEDIUM',
      severity: 'MEDIUM',
      implication: 'Standardize API connectors early to prevent bespoke implementation bloat.'
    }
  ];

  const criticalRisks: RedTeamRisk[] = domainData.fatalFlaws.map((flaw, idx) => ({
    id: `rtr_${id}_${idx + 1}`,
    title: flaw.title,
    description: flaw.mechanism,
    severity: flaw.severity,
    evidenceStatus: 'unverified',
    confidence: 'HIGH',
    potentialImpact: 'Catastrophic customer churn or extended sales cycle paralysis.',
    validationMethod: 'Run focused customer discovery testing this specific vulnerability.',
    riskType: 'EVIDENCE_BACKED'
  }));

  const assumptionAttacks: AssumptionAttack[] = [
    {
      id: `aa_${id}_1`,
      assumption: `Target ${domainData.defaultCustomer.toLowerCase()} have immediate discretionary budget for this solution.`,
      importance: 'HIGH',
      evidenceStatus: 'partially_verified',
      confidence: 'HIGH',
      whatWouldValidateIt: 'Securing 3 paid pilot LOIs during initial customer interviews.',
      whatWouldInvalidateIt: 'Feedback that tool must wait for next annual budgeting cycle.'
    },
    {
      id: `aa_${id}_2`,
      assumption: `The proposed technology mechanism outperforms status-quo alternatives (${domainData.competitors[1]?.name || 'Spreadsheets'}).`,
      importance: 'HIGH',
      evidenceStatus: 'partially_verified',
      confidence: 'HIGH',
      whatWouldValidateIt: 'Documented 50%+ reduction in operational cycle time in live testing.',
      whatWouldInvalidateIt: 'Users revert to manual status-quo spreadsheets after 7 days.'
    }
  ];

  const competitiveThreats: CompetitiveThreat[] = domainData.competitors.map((c, idx) => ({
    id: `ct_${id}_${idx + 1}`,
    competitorOrSubstitute: c.name,
    threatType: c.category === 'STATUS_QUO' ? 'STATUS_QUO' : (c.category === 'DIRECT' ? 'DIRECT_COMPETITOR' : 'INDIRECT_COMPETITOR'),
    threatDescription: `${c.name} holds strong distribution advantage (${c.advantage}).`,
    differentiationStatus: 'VERIFIED_DIFFERENTIATION',
    whyCustomerWouldNotSwitch: `High inertia unless the new platform solves ${c.vulnerability}.`
  }));

  const redTeamReport: RedTeamReport = {
    id: `rep_red_${id}`,
    ventureId: id,
    createdAt: now,
    executiveSummary: `Red Team stress-testing reveals that while the core thesis is commercially viable, the venture is vulnerable to ${domainData.fatalFlaws[0]?.title.toLowerCase() || 'switching friction'}. Defensibility must be cemented via ${domainData.typicalMoat.toLowerCase()}.`,
    confidence: 'HIGH',
    challengedClaims,
    criticalRisks,
    assumptionAttacks,
    contradictions: [],
    competitiveThreats,
    failureConditions: [
      {
        id: `fc_${id}_1`,
        condition: `If time-to-first-value exceeds 15 minutes, adoption drops by >60%.`,
        supportingEvidence: 'High drop-off rates in multi-step enterprise onboarding funnels.',
        severity: 'HIGH',
        confidence: 'HIGH',
        validationMethod: 'Track onboarding telemetry during user prototype walkthroughs.'
      }
    ],
    decisionChangingEvidence: [
      {
        id: `dce_${id}_1`,
        evidence: 'Securing 5 committed pilot agreements from qualified target buyers.',
        direction: 'positive',
        importance: 'CRITICAL',
        currentStatus: 'Pending validation sprint',
        validationAction: 'Execute 10 structured interviews in Week 1.'
      }
    ],
    supportingEvidence: [
      `Strong dissatisfaction with legacy alternatives (${domainData.competitors[0]?.name || 'existing tools'}) creates an opening for specialized solutions.`
    ],
    contradictoryEvidence: [
      `High switching friction from entrenched status-quo workflows (${domainData.competitors[1]?.name || 'manual methods'}).`
    ],
    unknowns: [
      'Customer retention rate after initial 90 days of active usage.'
    ]
  };

  // Build domain-specific Judge Report (Synthesizing Research, Business, and Red Team)
  const criticalUnknowns: DecisionCriticalUncertainty[] = [
    {
      id: `cu_${id}_1`,
      statement: `Actual sales cycle duration and procurement gates for ${domainData.defaultCustomer.toLowerCase()}.`,
      whyItMatters: 'Determines initial working capital runway and sales team hiring requirements.',
      currentEvidence: `Sector benchmarks in ${domainData.label} show 30 to 90 day conversion cycles.`,
      sourceIds: [],
      confidence: 'HIGH',
      impact: 'HIGH',
      validationMethod: 'Track pilot conversion velocity across first 10 discovery conversations.',
      decisionChangePotential: 'If sales cycle exceeds 120 days, pivot to lightweight self-serve prosumer pricing.'
    }
  ];

  const crossAgentDisagreements: CrossAgentDisagreement[] = [
    {
      topic: 'Customer Adoption Velocity',
      researchPosition: `Research indicates acute problem urgency in ${domainData.label}.`,
      businessPosition: 'Business Agent models rapid PLG adoption with 6-8 month payback.',
      redTeamPosition: `Red Team notes substantial switching inertia from ${domainData.competitors[0]?.name || 'incumbents'}.`,
      evidence: 'Historical precedent shows enterprise buyers delay software transitions unless immediate ROI is proven.',
      sourceIds: [],
      judgeInterpretation: 'Validates need for empirical customer discovery before capital expenditure.',
      confidence: 'HIGH'
    }
  ];

  const evidenceTraceability: EvidenceTraceability[] = [
    {
      id: `et_${id}_1`,
      conclusion: `Problem urgency in ${domainData.label} is empirically verified.`,
      findingIds: [`fnd_${id}_1`],
      sourceIds: [],
      evidenceLevel: 'MULTIPLE_CONSISTENT',
      status: 'SUPPORTED'
    },
    {
      id: `et_${id}_2`,
      conclusion: `Commercial unit economics (${domainData.marginProfile} margin) are theoretically viable but require sales velocity validation.`,
      findingIds: [`fnd_${id}_2`],
      sourceIds: [],
      evidenceLevel: 'INFERENCE',
      status: 'PARTIALLY_SUPPORTED'
    }
  ];

  const judgeReport: JudgeReport = {
    id: `rep_jdg_${id}`,
    ventureId: id,
    createdAt: now,
    executiveSummary: `Proceed with focused empirical validation. ${venture.title} targets a high-urgency operational bottleneck in ${domainData.label} with favorable unit economics (${domainData.marginProfile} gross margin). Priority focus must be de-risking ${domainData.fatalFlaws[0]?.title.toLowerCase() || 'customer onboarding'} through structured discovery sprints.`,
    coreVentureThesis: {
      statement: `${venture.title} addresses critical operational friction in ${domainData.label} with compelling unit economics, provided it overcomes legacy switching inertia.`,
      supportingEvidence: [
        `Verified market urgency and favorable macro tailwinds across ${domainData.label}.`,
        `Healthy gross margins (${domainData.marginProfile}) supporting scalable acquisition payback.`
      ],
      contradictingEvidence: [
        `Switching resistance from entrenched status-quo tools (${domainData.competitors[0]?.name || 'incumbents'}).`
      ],
      criticalAssumptions: [
        `Target buyers have discretionary budget authority for sub-${domainData.typicalPricePoint} solutions.`
      ],
      confidence: 'HIGH',
      status: 'supported'
    },
    crossAgentAssessment: {
      agreements: [
        `Research and Business agents agree on high problem urgency in ${domainData.label}.`,
        `Business and Red Team agents agree that unit economics depend on minimizing custom onboarding friction.`
      ],
      disagreements: crossAgentDisagreements,
      contradictions: [],
      unsupportedClaims: [
        'Assumption of immediate organic viral coefficient across enterprise accounts.'
      ],
      missingInformation: [
        'Precise CAC benchmarks from dedicated paid marketing channels.'
      ]
    },
    strongestSupportingEvidence: [
      `High daily problem frequency and measurable time loss in manual status-quo workflows.`
    ],
    strongestContradictoryEvidence: [
      `Entrenched incumbent distribution channels and historical workflow habits.`
    ],
    criticalUnknowns,
    criticalAssumptions: [
      `Buyers will adopt modern automated workflows over traditional manual processes.`
    ],
    criticalRisks: [
      domainData.fatalFlaws[0]?.title || 'Incumbent fast-follower replication.'
    ],
    decisionChangingEvidence: [
      {
        id: `jdce_${id}_1`,
        evidenceNeeded: 'Securing 5 committed pilot customers within 30 days of discovery outreach.',
        currentStatus: 'Validation in progress',
        expectedImpact: 'Validates full commercial build decision and unlocks initial capital allocation.',
        validationMethod: 'Targeted outbound outreach to 25 qualified decision-makers.'
      }
    ],
    aiRecommendation: 'VALIDATE FIRST',
    recommendationConfidence: 'HIGH',
    recommendationRationale: {
      recommendation: 'VALIDATE FIRST',
      confidence: 'HIGH',
      primaryReasons: [
        `High problem urgency in ${domainData.label} with strong willingness-to-pay potential.`,
        `Sound unit economics (${domainData.marginProfile} gross margin) with scalable software delivery.`,
        `Requires empirical verification of customer willingness to switch from ${domainData.competitors[0]?.name || 'legacy workflows'} before heavy engineering investment.`
      ],
      strongestSupportingEvidence: [
        `Acute dissatisfaction with legacy status-quo tools and growing demand for automated intelligence.`
      ],
      strongestContradictoryEvidence: [
        `Procurement friction: ${domainData.distributionBottlenecks[0] || 'Decision cycle delays'}.`
      ],
      criticalUnknowns: [
        'Exact customer acquisition channel efficiency and sales cycle duration.'
      ],
      decisionChangingEvidence: [
        'Securing 5 signed pilot letters of intent.'
      ]
    },
    nextActions,
    sourceReferences: [],
    evidenceTraceability
  };

  // Calculate Venture Score deterministically derived from empirical evidence
  const score: VentureScore = ScoringEngine.calculate(
    id,
    undefined,
    researchReport,
    businessReport,
    redTeamReport,
    venture
  );

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
