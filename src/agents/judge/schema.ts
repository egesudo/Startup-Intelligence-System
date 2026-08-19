/**
 * Judge Agent Structured Output Schema Definition (Phase 6)
 */

import { Type } from '@google/genai';
import { JudgeReport, AIRecommendationType, NextAction } from '../../types/domain';

export type JudgeReportPayload = Omit<JudgeReport, 'id' | 'ventureId' | 'createdAt'>;

export const JudgeReportGeminiSchema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: {
      type: Type.STRING,
      description: 'Comprehensive judicial synthesis and strategic verdict balancing market opportunity, unit economics, and red team failure modes.'
    },
    aiRecommendation: {
      type: Type.STRING,
      enum: ['BUILD', 'VALIDATE FIRST', 'REDESIGN', 'DO NOT PURSUE'],
      description: 'The evidence-backed analytical recommendation.'
    },
    recommendationConfidence: {
      type: Type.STRING,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      description: 'Confidence in the analytical recommendation based on evidence strength.'
    },
    coreVentureThesis: {
      type: Type.OBJECT,
      properties: {
        statement: { type: Type.STRING, description: 'The central premise that must be true for the venture to succeed.' },
        supportingEvidence: { type: Type.ARRAY, items: { type: Type.STRING } },
        contradictingEvidence: { type: Type.ARRAY, items: { type: Type.STRING } },
        criticalAssumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
        confidence: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
        status: { type: Type.STRING, enum: ['supported', 'partially_supported', 'weakly_supported', 'contradicted', 'unvalidated', 'unknown'] }
      },
      required: ['statement', 'supportingEvidence', 'contradictingEvidence', 'criticalAssumptions', 'confidence', 'status']
    },
    crossAgentAssessment: {
      type: Type.OBJECT,
      properties: {
        agreements: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Points where Research, Business, and Red Team agree.' },
        disagreements: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              researchPosition: { type: Type.STRING },
              businessPosition: { type: Type.STRING },
              redTeamPosition: { type: Type.STRING },
              evidence: { type: Type.STRING },
              sourceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
              judgeInterpretation: { type: Type.STRING },
              confidence: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] }
            },
            required: ['topic', 'researchPosition', 'businessPosition', 'redTeamPosition', 'evidence', 'judgeInterpretation', 'confidence']
          }
        },
        contradictions: { type: Type.ARRAY, items: { type: Type.STRING } },
        unsupportedClaims: { type: Type.ARRAY, items: { type: Type.STRING } },
        missingInformation: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['agreements', 'disagreements', 'contradictions', 'unsupportedClaims', 'missingInformation']
    },
    strongestSupportingEvidence: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'The top evidence points supporting the venture.'
    },
    strongestContradictoryEvidence: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'The top evidence points contradicting or challenging the venture.'
    },
    criticalUnknowns: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          statement: { type: Type.STRING },
          whyItMatters: { type: Type.STRING },
          currentEvidence: { type: Type.STRING },
          sourceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          confidence: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
          impact: { type: Type.STRING, enum: ['CATASTROPHIC', 'HIGH', 'MODERATE', 'LOW'] },
          validationMethod: { type: Type.STRING },
          decisionChangePotential: { type: Type.STRING }
        },
        required: ['id', 'statement', 'whyItMatters', 'currentEvidence', 'confidence', 'impact', 'validationMethod', 'decisionChangePotential']
      }
    },
    criticalAssumptions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'The most pivotal unverified assumptions.'
    },
    criticalRisks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'The most dangerous identified risks.'
    },
    decisionChangingEvidence: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          evidenceNeeded: { type: Type.STRING, description: 'What specific empirical evidence would change the recommendation?' },
          currentStatus: { type: Type.STRING },
          expectedImpact: { type: Type.STRING },
          validationMethod: { type: Type.STRING },
          relatedAssumptionIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          relatedRiskIds: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['id', 'evidenceNeeded', 'currentStatus', 'expectedImpact', 'validationMethod']
      }
    },
    recommendationRationale: {
      type: Type.OBJECT,
      properties: {
        recommendation: { type: Type.STRING, enum: ['BUILD', 'VALIDATE FIRST', 'REDESIGN', 'DO NOT PURSUE'] },
        confidence: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
        primaryReasons: { type: Type.ARRAY, items: { type: Type.STRING } },
        strongestSupportingEvidence: { type: Type.ARRAY, items: { type: Type.STRING } },
        strongestContradictoryEvidence: { type: Type.ARRAY, items: { type: Type.STRING } },
        criticalUnknowns: { type: Type.ARRAY, items: { type: Type.STRING } },
        decisionChangingEvidence: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['recommendation', 'confidence', 'primaryReasons', 'strongestSupportingEvidence', 'strongestContradictoryEvidence', 'criticalUnknowns', 'decisionChangingEvidence']
    },
    nextActions: {
      type: Type.ARRAY,
      minItems: 3,
      maxItems: 3,
      description: 'Exactly THREE specific, actionable, decision-relevant next steps.',
      items: {
        type: Type.OBJECT,
        properties: {
          stepNumber: { type: Type.INTEGER, description: 'Sequential step number: 1, 2, or 3' },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          purpose: { type: Type.STRING },
          validationTarget: { type: Type.STRING, description: 'Measurable test target (e.g. 5 LOIs, CAC < $500, etc.)' },
          priority: { type: Type.STRING, enum: ['IMMEDIATE', 'HIGH', 'SECONDARY'] },
          expectedDecisionImpact: { type: Type.STRING }
        },
        required: ['stepNumber', 'title', 'description', 'purpose', 'validationTarget', 'priority', 'expectedDecisionImpact']
      }
    },
    evidenceTraceability: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          conclusion: { type: Type.STRING },
          findingIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          sourceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          evidenceLevel: { type: Type.STRING, enum: ['DIRECT_PRIMARY', 'INDEPENDENT_SECONDARY', 'MULTIPLE_CONSISTENT', 'SINGLE_SOURCE', 'INFERENCE', 'FOUNDER_CLAIM', 'HYPOTHESIS', 'UNKNOWN'] },
          status: { type: Type.STRING, enum: ['SUPPORTED', 'PARTIALLY_SUPPORTED', 'UNSUPPORTED', 'INSUFFICIENT_EVIDENCE', 'CONTRADICTED'] },
          notes: { type: Type.STRING }
        },
        required: ['id', 'conclusion', 'findingIds', 'sourceIds', 'evidenceLevel', 'status']
      }
    },
    tradeoffMatrix: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dimension: { type: Type.STRING },
          bullCase: { type: Type.STRING },
          bearCase: { type: Type.STRING },
          judgeVerdict: { type: Type.STRING }
        },
        required: ['dimension', 'bullCase', 'bearCase', 'judgeVerdict']
      }
    },
    rawScoreInput: {
      type: Type.OBJECT,
      properties: {
        marketScoreRaw: { type: Type.NUMBER, description: 'Market problem urgency & pain validation score from 0 to 25 based strictly on empirical evidence.' },
        marketReasoning: { type: Type.STRING },
        businessScoreRaw: { type: Type.NUMBER, description: 'Business model, gross margin & unit economics score from 0 to 25.' },
        businessReasoning: { type: Type.STRING },
        moatScoreRaw: { type: Type.NUMBER, description: 'Defensibility moat & competitive barriers score from 0 to 25.' },
        moatReasoning: { type: Type.STRING },
        riskScoreRaw: { type: Type.NUMBER, description: 'Adversarial risk resilience & execution score from 0 to 25 (penalized for lethal flaws).' },
        riskReasoning: { type: Type.STRING }
      },
      required: [
        'marketScoreRaw',
        'marketReasoning',
        'businessScoreRaw',
        'businessReasoning',
        'moatScoreRaw',
        'moatReasoning',
        'riskScoreRaw',
        'riskReasoning'
      ]
    }
  },
  required: [
    'executiveSummary',
    'aiRecommendation',
    'recommendationConfidence',
    'coreVentureThesis',
    'crossAgentAssessment',
    'strongestSupportingEvidence',
    'strongestContradictoryEvidence',
    'criticalUnknowns',
    'criticalAssumptions',
    'criticalRisks',
    'decisionChangingEvidence',
    'recommendationRationale',
    'nextActions',
    'evidenceTraceability'
  ]
};

