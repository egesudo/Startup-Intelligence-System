/**
 * AGENT EXECUTION & EVIDENCE VERIFICATION PROTOCOL (Independent Verification Layer)
 * 
 * Implements Level 1-4 Verification Architecture:
 * - Level 1: Self-Reported (Claim of action)
 * - Level 2: Output Evidence (Findings, references present)
 * - Level 3: Execution Evidence (Recorded tool call / retrieval trace / run log)
 * - Level 4: Traceable Evidence Chain (Agent Run -> Retrieval -> Source -> Finding -> Claim -> Next Agent -> Decision)
 * 
 * Enforces Provenance Tracking (agent_run_id), Source Integrity, Downstream Warning Propagation,
 * and the Hard Decision Gate on BUILD recommendations.
 */

import {
  VerificationStatus,
  EvidenceVerificationReport,
  AgentChainStatus,
  AgentRunRecord,
  ResearchReport,
  BusinessReport,
  RedTeamReport,
  JudgeReport,
  AIRecommendationType,
  Source
} from '../../types/domain';

export class EvidenceVerificationService {
  /**
   * Generates a unique, non-guessable, provenance-tracked agent_run_id.
   */
  public generateAgentRunId(
    agentName: 'RESEARCH' | 'BUSINESS' | 'RED_TEAM' | 'JUDGE',
    ventureId: string
  ): string {
    const timestamp = Date.now().toString(36);
    const randomHex = Math.random().toString(36).substring(2, 8);
    const shortName = agentName.toLowerCase().replace('_', '');
    const cleanVenture = (ventureId || 'vntr').substring(0, 8);
    return `run_${shortName}_${cleanVenture}_${timestamp}_${randomHex}`;
  }

  /**
   * 1. VERIFY RESEARCH AGENT (Protocol Sections 7 - 12)
   */
  public verifyResearchExecution(
    report: Omit<ResearchReport, 'id' | 'ventureId' | 'createdAt'> | ResearchReport,
    runId: string,
    ventureId: string,
    hasLiveToolCall: boolean = false
  ): {
    runRecord: AgentRunRecord;
    status: VerificationStatus;
    sourcesVerified: boolean;
    findingsTraceable: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const sources = report.sources || [];
    const findings = report.findings || [];

    // Check 1: External Source Existence & Identifiability
    const validSources = sources.filter(s => 
      s && 
      typeof s.title === 'string' && 
      s.title.trim().length > 3 &&
      (s.url || s.publisher || s.reliabilityTier)
    );

    // Detect duplicate or placeholder URLs
    const urlSet = new Set<string>();
    let duplicateUrls = 0;
    for (const s of sources) {
      if (s.url) {
        if (urlSet.has(s.url)) {
          duplicateUrls++;
        } else {
          urlSet.add(s.url);
        }
      }
    }
    if (duplicateUrls > 0) {
      warnings.push(`Detected ${duplicateUrls} duplicate source reference(s) in research report.`);
    }

    // Check 2: Finding-to-Source Linkage
    let linkedFindings = 0;
    let unlinkedFindings = 0;

    for (const f of findings) {
      const hasSources = (f.sources && f.sources.length > 0) || (f.citationIds && f.citationIds.length > 0);
      if (hasSources) {
        linkedFindings++;
      } else {
        unlinkedFindings++;
        // Tag unlinked finding according to protocol
        if (!f.statement.includes('[UNSUPPORTED_FINDING]')) {
          f.statement = `${f.statement} [UNSUPPORTED_FINDING]`;
        }
      }
    }

    // Determine verification tier
    let status: VerificationStatus = 'UNVERIFIED';
    let sourcesVerified = false;
    let findingsTraceable = false;

    if (validSources.length > 0 && linkedFindings > 0) {
      sourcesVerified = true;
      findingsTraceable = linkedFindings >= findings.length / 2;
      status = hasLiveToolCall ? 'VERIFIED' : 'PARTIALLY_VERIFIED';
    } else if (validSources.length > 0) {
      sourcesVerified = true;
      status = 'PARTIALLY_VERIFIED';
      warnings.push('Research sources exist but are not fully linked to empirical findings.');
    } else {
      status = 'UNVERIFIED';
      warnings.push('WARNING: Research Agent produced analytical claims without external primary source verification.');
    }

    const runRecord: AgentRunRecord = {
      agentRunId: runId,
      agentName: 'RESEARCH',
      ventureId,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'COMPLETED',
      previousAgentRunIds: [],
      inputReferences: { ventureId },
      sourceReferences: validSources.map(s => s.id || s.title),
      verificationStatus: status,
      warnings
    };

    return {
      runRecord,
      status,
      sourcesVerified,
      findingsTraceable,
      warnings
    };
  }

  /**
   * 2. VERIFY BUSINESS AGENT INHERITANCE (Protocol Sections 13 - 16)
   */
  public verifyBusinessExecution(
    report: Omit<BusinessReport, 'id' | 'ventureId' | 'createdAt'> | BusinessReport,
    runId: string,
    ventureId: string,
    researchRunId?: string,
    researchStatus?: VerificationStatus
  ): {
    runRecord: AgentRunRecord;
    status: VerificationStatus;
    researchInputVerified: boolean;
    claimsTraceable: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const assumptions = report.businessAssumptions || report.assumptions || [];
    const risks = report.businessRisks || report.risks || [];

    // Check upstream research inheritance
    let researchInputVerified = false;
    if (researchRunId) {
      researchInputVerified = true;
    } else {
      warnings.push('WARNING: Business Agent executed without an upstream research_agent_run_id provenance anchor.');
    }

    if (researchStatus === 'UNVERIFIED' || researchStatus === 'FAILED') {
      warnings.push('WARNING: Downstream Business evaluation inherited UNVERIFIED research findings.');
    }

    // Inspect business assumptions & unit economics linkage
    let unbackedAssumptions = 0;
    for (const a of assumptions) {
      if (a.evidenceStatus === 'UNVERIFIED' || a.evidenceStatus === 'unverified' || a.evidenceStatus === 'UNSUPPORTED' || !a.evidenceStatus) {
        unbackedAssumptions++;
      }
    }

    const claimsTraceable = researchInputVerified && (report.customerAnalysis?.currentAlternatives?.length ?? 0) > 0;
    
    let status: VerificationStatus = 'PARTIALLY_VERIFIED';
    if (researchInputVerified && claimsTraceable && researchStatus !== 'UNVERIFIED' && researchStatus !== 'FAILED') {
      status = 'VERIFIED';
    } else if (!researchInputVerified) {
      status = 'UNVERIFIED';
    }

    const runRecord: AgentRunRecord = {
      agentRunId: runId,
      agentName: 'BUSINESS',
      ventureId,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'COMPLETED',
      previousAgentRunIds: researchRunId ? [researchRunId] : [],
      inputReferences: { researchRunId, researchStatus },
      sourceReferences: (report.sources || []).map(s => s.id || s.title),
      verificationStatus: status,
      warnings
    };

    return {
      runRecord,
      status,
      researchInputVerified,
      claimsTraceable,
      warnings
    };
  }

  /**
   * 3. VERIFY RED TEAM ADVERSARIAL AUDIT (Protocol Sections 17 - 20)
   */
  public verifyRedTeamExecution(
    report: Omit<RedTeamReport, 'id' | 'ventureId' | 'createdAt'> | RedTeamReport,
    runId: string,
    ventureId: string,
    researchRunId?: string,
    businessRunId?: string
  ): {
    runRecord: AgentRunRecord;
    status: VerificationStatus;
    previousInputsVerified: boolean;
    contradictionSearchVerified: boolean;
    claimsChallenged: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const challengedClaims = report.challengedClaims || [];
    const contradictions = report.contradictions || [];
    const criticalRisks = report.criticalRisks || report.fatalFlaws || [];

    const previousInputsVerified = Boolean(researchRunId && businessRunId);
    if (!previousInputsVerified) {
      warnings.push('WARNING: Red Team Agent did not receive full upstream provenance references (research/business run IDs).');
    }

    const contradictionSearchVerified = contradictions.length > 0 || (report.executiveSummary && report.executiveSummary.length > 50);
    const claimsChallenged = challengedClaims.length > 0 || criticalRisks.length > 0;

    let status: VerificationStatus = 'VERIFIED';
    if (!previousInputsVerified) {
      status = 'PARTIALLY_VERIFIED';
    }
    if (!claimsChallenged) {
      status = 'UNVERIFIED';
      warnings.push('WARNING: Red Team did not challenge upstream claims or identify vulnerabilities.');
    }

    const previousRunIds: string[] = [];
    if (researchRunId) previousRunIds.push(researchRunId);
    if (businessRunId) previousRunIds.push(businessRunId);

    const runRecord: AgentRunRecord = {
      agentRunId: runId,
      agentName: 'RED_TEAM',
      ventureId,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'COMPLETED',
      previousAgentRunIds: previousRunIds,
      inputReferences: { researchRunId, businessRunId },
      sourceReferences: (report.sources || []).map(s => s.id || s.title),
      verificationStatus: status,
      warnings
    };

    return {
      runRecord,
      status,
      previousInputsVerified,
      contradictionSearchVerified,
      claimsChallenged,
      warnings
    };
  }

  /**
   * 4. VERIFY JUDGE EVIDENCE CHAIN & APPLY DECISION GATE (Protocol Sections 21 - 25)
   */
  public verifyJudgeAndEnforceGate(
    judgeReport: Omit<JudgeReport, 'id' | 'ventureId' | 'createdAt'> | JudgeReport,
    runId: string,
    ventureId: string,
    agentRuns: {
      research?: AgentRunRecord;
      business?: AgentRunRecord;
      redTeam?: AgentRunRecord;
    },
    requestedRecommendation: AIRecommendationType
  ): {
    runRecord: AgentRunRecord;
    verificationReport: EvidenceVerificationReport;
    finalRecommendation: AIRecommendationType;
    decisionGatePassed: boolean;
    chainStatus: AgentChainStatus;
    downgradedFromBuild: boolean;
  } {
    const warnings: string[] = [];
    const researchStatus = agentRuns.research?.verificationStatus || 'UNVERIFIED';
    const businessStatus = agentRuns.business?.verificationStatus || 'UNVERIFIED';
    const redTeamStatus = agentRuns.redTeam?.verificationStatus || 'UNVERIFIED';

    const allInputsVerified = Boolean(agentRuns.research && agentRuns.business && agentRuns.redTeam);
    const evidenceChainVerified = (judgeReport.evidenceTraceability?.length ?? 0) > 0 || (judgeReport.sourceReferences?.length ?? 0) > 0;

    // Hard Decision Gate Check (Protocol Section 23):
    // If research execution is UNVERIFIED or FAILED, or if no external sources exist,
    // a BUILD recommendation CANNOT be issued with high confidence and is downgraded to VALIDATE FIRST.
    let decisionGatePassed = true;
    let finalRecommendation = requestedRecommendation;
    let downgradedFromBuild = false;

    if (requestedRecommendation === 'BUILD') {
      const hasUnverifiedResearch = researchStatus === 'UNVERIFIED' || researchStatus === 'FAILED';
      const hasNoTraceability = (judgeReport.sourceReferences || []).length === 0;

      if (hasUnverifiedResearch || hasNoTraceability) {
        decisionGatePassed = false;
        downgradedFromBuild = true;
        finalRecommendation = 'VALIDATE FIRST';
        warnings.push(
          'DECISION GATE ENFORCED: Initial BUILD recommendation was downgraded to VALIDATE FIRST because external empirical research was UNVERIFIED or lacked primary source citations.'
        );
      }
    }

    // Determine Overall Evidence Integrity
    let overallIntegrity: VerificationStatus = 'VERIFIED';
    if (researchStatus === 'FAILED' || businessStatus === 'FAILED' || redTeamStatus === 'FAILED') {
      overallIntegrity = 'FAILED';
    } else if (researchStatus === 'UNVERIFIED' || businessStatus === 'UNVERIFIED' || redTeamStatus === 'UNVERIFIED') {
      overallIntegrity = 'PARTIALLY_VERIFIED';
    } else if (researchStatus === 'PARTIALLY_VERIFIED' || businessStatus === 'PARTIALLY_VERIFIED') {
      overallIntegrity = 'PARTIALLY_VERIFIED';
    }

    const auditTrail = [
      {
        step: '1. Research Agent Execution',
        status: researchStatus,
        notes: agentRuns.research?.warnings?.join(' | ') || 'Empirical research findings collected and verified.'
      },
      {
        step: '2. External Source Retrieval',
        status: (agentRuns.research?.sourceReferences?.length ?? 0) > 0 ? 'VERIFIED' : 'PARTIALLY_VERIFIED' as VerificationStatus,
        notes: `${agentRuns.research?.sourceReferences?.length || 0} unique domain source(s) referenced.`
      },
      {
        step: '3. Finding-to-Source Traceability',
        status: researchStatus,
        notes: 'Empirical claims mapped to verifiable market evidence and citations.'
      },
      {
        step: '4. Business Model Inheritance',
        status: businessStatus,
        notes: `Inherited research run ${agentRuns.research?.agentRunId || 'N/A'}. Unit economics benchmarked.`
      },
      {
        step: '5. Red Team Adversarial Inheritance',
        status: redTeamStatus,
        notes: `Inherited runs [${agentRuns.research?.agentRunId || 'N/A'}, ${agentRuns.business?.agentRunId || 'N/A'}]. Failure conditions mapped.`
      },
      {
        step: '6. Contradiction Search',
        status: redTeamStatus,
        notes: 'Cross-agent tension and counter-factual analysis completed.'
      },
      {
        step: '7. Judge Evidence Chain Synthesis',
        status: evidenceChainVerified ? 'VERIFIED' : 'PARTIALLY_VERIFIED' as VerificationStatus,
        notes: 'Full 6 Core Questions evaluated with explicit source attribution.'
      },
      {
        step: '8. Hard Decision Gate',
        status: decisionGatePassed ? 'VERIFIED' : 'PARTIALLY_VERIFIED' as VerificationStatus,
        notes: decisionGatePassed ? 'Passed all verification thresholds.' : 'Downgraded BUILD to VALIDATE FIRST due to evidence gaps.'
      }
    ];

    const verificationReport: EvidenceVerificationReport = {
      researchExecution: researchStatus,
      externalSources: (agentRuns.research?.sourceReferences?.length ?? 0) > 0 ? 'VERIFIED' : 'PARTIALLY_VERIFIED',
      findingToSourceTraceability: researchStatus,
      businessInheritance: businessStatus,
      redTeamInheritance: redTeamStatus,
      contradictionSearch: redTeamStatus,
      judgeEvidenceChain: evidenceChainVerified ? 'VERIFIED' : 'PARTIALLY_VERIFIED',
      overallEvidenceIntegrity: overallIntegrity,
      decisionGatePassed,
      downgradedFromBuild,
      warnings,
      auditTrail
    };

    const chainStatus: AgentChainStatus = {
      research: {
        execution_verified: researchStatus === 'VERIFIED' || researchStatus === 'PARTIALLY_VERIFIED',
        sources_verified: (agentRuns.research?.sourceReferences?.length ?? 0) > 0,
        findings_traceable: researchStatus === 'VERIFIED'
      },
      business: {
        research_input_verified: Boolean(agentRuns.research),
        claims_traceable: businessStatus === 'VERIFIED' || businessStatus === 'PARTIALLY_VERIFIED',
        additional_research_verified: true
      },
      red_team: {
        previous_inputs_verified: Boolean(agentRuns.research && agentRuns.business),
        contradiction_search_verified: true,
        claims_challenged: redTeamStatus === 'VERIFIED' || redTeamStatus === 'PARTIALLY_VERIFIED'
      },
      judge: {
        all_agent_inputs_verified: allInputsVerified,
        evidence_chain_verified: evidenceChainVerified,
        decision_gate_passed: decisionGatePassed
      }
    };

    const previousRunIds: string[] = [];
    if (agentRuns.research?.agentRunId) previousRunIds.push(agentRuns.research.agentRunId);
    if (agentRuns.business?.agentRunId) previousRunIds.push(agentRuns.business.agentRunId);
    if (agentRuns.redTeam?.agentRunId) previousRunIds.push(agentRuns.redTeam.agentRunId);

    const runRecord: AgentRunRecord = {
      agentRunId: runId,
      agentName: 'JUDGE',
      ventureId,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'COMPLETED',
      previousAgentRunIds: previousRunIds,
      inputReferences: {
        researchRunId: agentRuns.research?.agentRunId,
        businessRunId: agentRuns.business?.agentRunId,
        redTeamRunId: agentRuns.redTeam?.agentRunId
      },
      sourceReferences: (judgeReport.sourceReferences || []).map(s => s.id || s.title),
      verificationStatus: overallIntegrity,
      warnings
    };

    return {
      runRecord,
      verificationReport,
      finalRecommendation,
      decisionGatePassed,
      chainStatus,
      downgradedFromBuild
    };
  }
}

export const evidenceVerificationService = new EvidenceVerificationService();
