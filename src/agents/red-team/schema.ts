/**
 * Red Team Agent Structured Output Schema Definition (Phase 5)
 */

import { RedTeamReport } from '../../types/domain';

export type RedTeamReportPayload = Omit<RedTeamReport, 'id' | 'ventureId' | 'createdAt'>;

export const RedTeamReportJsonSchema = {
  type: 'object',
  properties: {
    executiveSummary: {
      type: 'string',
      description: 'Concise executive synthesis of the primary failure modes, counter-factual threats, and evidence gaps.'
    },
    confidence: {
      type: 'string',
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      description: 'Confidence level in the adversarial analysis based on evidence depth.'
    },
    counterFactualAnalysis: {
      type: 'string',
      description: 'Critical analysis of platform dependencies, incumbent reactions, and existential market counter-factuals.'
    },
    untestedDogmasChallenged: {
      type: 'array',
      items: { type: 'string' },
      description: 'Unexamined assumptions in founder thesis unmasked as fragile or wishful thinking.'
    },
    challengedClaims: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          claim: { type: 'string', description: 'The specific assertion being challenged' },
          claimSource: { type: 'string', description: 'Origin: founder, research, business report, or specific quote' },
          challenge: { type: 'string', description: 'Adversarial counter-argument or test' },
          evidence: { type: 'string', description: 'Empirical counter-evidence or benchmark' },
          sourceIds: { type: 'array', items: { type: 'string' } },
          evidenceStatus: { 
            type: 'string', 
            enum: ['supported', 'partially_supported', 'contradicted', 'unverified', 'unknown'] 
          },
          confidence: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
          severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
          implication: { type: 'string', description: 'Material impact on venture survival if invalid' }
        },
        required: ['id', 'claim', 'claimSource', 'challenge', 'evidence', 'evidenceStatus', 'confidence', 'severity', 'implication']
      }
    },
    criticalRisks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          category: { 
            type: 'string',
            enum: [
              'customer', 'market', 'competition', 'pricing', 'business_model',
              'distribution', 'operations', 'technology', 'regulation',
              'execution', 'data', 'trust', 'adoption'
            ]
          },
          severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'LETHAL'] },
          evidenceStatus: { 
            type: 'string', 
            enum: ['supported', 'partially_supported', 'contradicted', 'unverified', 'unknown'] 
          },
          supportingEvidence: { type: 'string' },
          contradictoryEvidence: { type: 'string' },
          sourceIds: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
          potentialImpact: { type: 'string' },
          validationMethod: { type: 'string' },
          riskType: { type: 'string', enum: ['HYPOTHESIS', 'EVIDENCE_BACKED'] },
          vulnerability: { type: 'string' },
          failureMechanism: { type: 'string' },
          whyCompetitorsWillWin: { type: 'string' },
          preMortemTrigger: { type: 'string' }
        },
        required: ['id', 'title', 'description', 'category', 'severity', 'evidenceStatus', 'confidence', 'potentialImpact', 'validationMethod', 'riskType']
      }
    },
    assumptionAttacks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          assumption: { type: 'string' },
          importance: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
          evidenceStatus: { 
            type: 'string', 
            enum: ['supported', 'partially_supported', 'contradicted', 'unverified', 'unknown'] 
          },
          supportingSourceIds: { type: 'array', items: { type: 'string' } },
          contradictorySourceIds: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
          whatWouldValidateIt: { type: 'string' },
          whatWouldInvalidateIt: { type: 'string' }
        },
        required: ['id', 'assumption', 'importance', 'evidenceStatus', 'confidence', 'whatWouldValidateIt', 'whatWouldInvalidateIt']
      }
    },
    contradictions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          claimOrAssumption: { type: 'string' },
          sourceA: { type: 'string', description: 'e.g. Founder assertion' },
          sourceB: { type: 'string', description: 'e.g. Upstream research finding or competitor benchmark' },
          description: { type: 'string' },
          severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
          confidence: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
          evidenceStatus: { 
            type: 'string', 
            enum: ['supported', 'partially_supported', 'contradicted', 'unverified', 'unknown'] 
          },
          sourceIds: { type: 'array', items: { type: 'string' } }
        },
        required: ['id', 'claimOrAssumption', 'sourceA', 'sourceB', 'description', 'severity', 'confidence', 'evidenceStatus']
      }
    },
    competitiveThreats: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          competitorOrSubstitute: { type: 'string' },
          threatType: { 
            type: 'string', 
            enum: ['DIRECT_COMPETITOR', 'INDIRECT_COMPETITOR', 'SUBSTITUTE', 'STATUS_QUO', 'DO_NOTHING'] 
          },
          threatDescription: { type: 'string' },
          differentiationStatus: { 
            type: 'string', 
            enum: ['VERIFIED_DIFFERENTIATION', 'UNVERIFIED_DIFFERENTIATION', 'CONTRADICTED_DIFFERENTIATION'] 
          },
          whyCustomerWouldNotSwitch: { type: 'string' },
          sourceIds: { type: 'array', items: { type: 'string' } }
        },
        required: ['id', 'competitorOrSubstitute', 'threatType', 'threatDescription', 'differentiationStatus', 'whyCustomerWouldNotSwitch']
      }
    },
    failureConditions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          condition: { type: 'string', description: 'e.g. If willingness-to-pay cannot be demonstrated...' },
          supportingEvidence: { type: 'string' },
          severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
          confidence: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
          validationMethod: { type: 'string' }
        },
        required: ['id', 'condition', 'supportingEvidence', 'severity', 'confidence', 'validationMethod']
      }
    },
    decisionChangingEvidence: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          evidence: { type: 'string' },
          direction: { type: 'string', enum: ['positive', 'negative', 'uncertain'] },
          importance: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
          sourceIds: { type: 'array', items: { type: 'string' } },
          currentStatus: { type: 'string' },
          validationAction: { type: 'string' }
        },
        required: ['id', 'evidence', 'direction', 'importance', 'currentStatus', 'validationAction']
      }
    },
    supportingEvidence: {
      type: 'array',
      items: { type: 'string' },
      description: 'Adversarially conceded strengths or verified evidence points'
    },
    contradictoryEvidence: {
      type: 'array',
      items: { type: 'string' },
      description: 'Direct empirical evidence disproving core assumptions'
    },
    unknowns: {
      type: 'array',
      items: { type: 'string' },
      description: 'Essential unknown questions that must be resolved via physical market testing'
    },
    fatalFlaws: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          vulnerability: { type: 'string' },
          severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'LETHAL'] },
          failureMechanism: { type: 'string' },
          whyCompetitorsWillWin: { type: 'string' },
          preMortemTrigger: { type: 'string' }
        },
        required: ['id', 'vulnerability', 'severity', 'failureMechanism', 'whyCompetitorsWillWin', 'preMortemTrigger']
      }
    },
    killScenarios: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          scenario: { type: 'string' },
          probability: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] }
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
};

