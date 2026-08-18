/**
 * Business Agent Structured Output Schema Definition (Phase 4)
 */

import { BusinessReport } from '../../types/domain';

export type BusinessReportPayload = Omit<BusinessReport, 'id' | 'ventureId' | 'createdAt'>;

export const BusinessReportJsonSchema = {
  type: 'object',
  properties: {
    executiveSummary: {
      type: 'string',
      description: 'Concise executive synthesis of the commercial viability, customer dynamics, and unit economics.'
    },
    confidence: {
      type: 'string',
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      description: 'Analytical confidence level in available commercial evidence.'
    },
    customerAnalysis: {
      type: 'object',
      properties: {
        targetCustomer: { type: 'string' },
        customerProblem: { type: 'string' },
        severity: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'] },
        frequency: { type: 'string', enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'INFREQUENT', 'UNKNOWN'] },
        currentAlternatives: {
          type: 'array',
          items: { type: 'string' }
        },
        switchingBehavior: { type: 'string' },
        evidenceOfDemand: { type: 'string' },
        willingnessToPayEvidence: { type: 'string' },
        willingnessToPayStatus: {
          type: 'string',
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
      type: 'object',
      properties: {
        valueProposition: { type: 'string' },
        costOfInaction: { type: 'string' },
        economicJustification: { type: 'string' }
      },
      required: ['valueProposition', 'costOfInaction', 'economicJustification']
    },
    marketAnalysis: {
      type: 'object',
      properties: {
        marketStructure: { type: 'string' },
        industryEconomics: { type: 'string' },
        entryBarriers: {
          type: 'array',
          items: { type: 'string' }
        },
        regulatoryConstraints: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['marketStructure', 'industryEconomics', 'entryBarriers', 'regulatoryConstraints']
    },
    competitiveLandscape: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          company: { type: 'string' },
          offering: { type: 'string' },
          targetCustomer: { type: 'string' },
          pricing: { type: 'string' },
          positioning: { type: 'string' },
          strengths: { type: 'string' },
          weaknesses: { type: 'string' },
          sourceIds: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['company', 'offering', 'targetCustomer', 'pricing', 'positioning', 'strengths', 'weaknesses']
      }
    },
    alternativeSolutions: {
      type: 'array',
      items: { type: 'string' }
    },
    businessModel: {
      type: 'object',
      properties: {
        revenueModel: { type: 'string' },
        pricingModel: { type: 'string' },
        archetype: {
          type: 'string',
          enum: ['B2B_SAAS', 'MARKETPLACE', 'D2C', 'USAGE_BASED', 'AGENCY_TECH', 'OTHER']
        },
        costDrivers: {
          type: 'array',
          items: { type: 'string' }
        },
        retentionMechanism: { type: 'string' },
        unitEconomicsHypothesis: {
          type: 'object',
          properties: {
            targetPricePoint: { type: 'string' },
            estimatedMarginProfile: { type: 'string' },
            paybackPeriodEstimate: { type: 'string' },
            capitalRequirement: { type: 'string' },
            notes: { type: 'string' }
          }
        }
      },
      required: ['revenueModel', 'pricingModel', 'costDrivers', 'retentionMechanism']
    },
    pricingEvidence: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          benchmark: { type: 'string' },
          model: { type: 'string' },
          priceRange: { type: 'string' },
          evidence: { type: 'string' },
          sourceIds: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['benchmark', 'model', 'priceRange', 'evidence']
      }
    },
    distributionAnalysis: {
      type: 'object',
      properties: {
        primaryChannel: { type: 'string' },
        channelViability: { type: 'string' },
        acquisitionChallenges: {
          type: 'array',
          items: { type: 'string' }
        },
        distributionBottlenecks: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['primaryChannel', 'channelViability', 'acquisitionChallenges', 'distributionBottlenecks']
    },
    acquisitionConsiderations: {
      type: 'array',
      items: { type: 'string' }
    },
    operationalConsiderations: {
      type: 'array',
      items: { type: 'string' }
    },
    businessAssumptions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          statement: { type: 'string' },
          category: {
            type: 'string',
            enum: ['customer', 'pricing', 'market', 'distribution', 'competition', 'operations', 'technology', 'regulation']
          },
          importance: {
            type: 'string',
            enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
          },
          evidenceStatus: {
            type: 'string',
            enum: ['verified', 'partially_verified', 'unverified', 'contradicted', 'unknown']
          },
          confidence: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH']
          },
          validationMethod: { type: 'string' },
          supportingSourceIds: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['id', 'statement', 'category', 'importance', 'evidenceStatus', 'confidence', 'validationMethod']
      }
    },
    businessRisks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          probability: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN']
          },
          impact: {
            type: 'string',
            enum: ['CATASTROPHIC', 'HIGH', 'MODERATE', 'LOW']
          },
          confidence: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH']
          },
          evidence: { type: 'string' },
          mitigation: { type: 'string' },
          validationAction: { type: 'string' },
          sourceIds: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['id', 'title', 'probability', 'impact', 'confidence', 'mitigation']
      }
    },
    supportingEvidence: {
      type: 'array',
      items: { type: 'string' }
    },
    contradictoryEvidence: {
      type: 'array',
      items: { type: 'string' }
    },
    unknowns: {
      type: 'array',
      items: { type: 'string' }
    },
    defensibilityMoat: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['NETWORK_EFFECTS', 'DATA_LOCKIN', 'HIGH_SWITCHING_COST', 'SPEED_EXECUTION', 'NONE']
        },
        strength: {
          type: 'string',
          enum: ['NONE', 'FRAGILE', 'STRONG']
        },
        rationale: { type: 'string' }
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
};

