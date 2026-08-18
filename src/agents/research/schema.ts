/**
 * Research Agent Structured Output Schema Definition (Phase 3)
 */

import { ResearchReport, ConfidenceLevel, Source, CompetitorProfile, ResearchFinding } from '../../types/domain';

export type ResearchReportPayload = Omit<ResearchReport, 'id' | 'ventureId' | 'createdAt'>;

export const ResearchReportJsonSchema = {
  type: 'object',
  properties: {
    executiveSummary: {
      type: 'string',
      description: 'High-level empirical synthesis of external reality, customer need, and market conditions.'
    },
    confidenceScore: {
      type: 'string',
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      description: 'Overall empirical confidence based on source availability and data clarity.'
    },
    alternativeSolutions: {
      type: 'array',
      items: { type: 'string' },
      description: 'Current status quo, manual workarounds, spreadsheets, or legacy practices users rely on.'
    },
    supportingEvidence: {
      type: 'array',
      items: { type: 'string' },
      description: 'Specific empirical facts, trends, and proof points supporting the venture problem/market.'
    },
    contradictoryEvidence: {
      type: 'array',
      items: { type: 'string' },
      description: 'Specific market barriers, negative signals, high switching costs, or counter-evidence.'
    },
    tailwinds: {
      type: 'array',
      items: { type: 'string' },
      description: 'Macroeconomic, regulatory, behavioral, or technological tailwinds propelling this space.'
    },
    headwinds: {
      type: 'array',
      items: { type: 'string' },
      description: 'Structural barriers, legal frictions, budget scrutiny, or platform dependencies.'
    },
    assumptions: {
      type: 'array',
      items: { type: 'string' },
      description: 'Core founder hypotheses requiring empirical external validation.'
    },
    unvalidatedAssumptions: {
      type: 'array',
      items: { type: 'string' },
      description: 'High-risk founder claims that currently lack any verified third-party proof.'
    },
    unknowns: {
      type: 'array',
      items: { type: 'string' },
      description: 'Material unknowns that could alter the venture trajectory or feasibility.'
    },
    competitors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          category: { type: 'string', enum: ['DIRECT', 'INDIRECT', 'STATUS_QUO'] },
          marketPosition: { type: 'string' },
          coreAdvantage: { type: 'string' },
          coreVulnerability: { type: 'string' }
        },
        required: ['name', 'category', 'marketPosition', 'coreAdvantage', 'coreVulnerability']
      }
    },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          statement: { type: 'string' },
          evidence: { type: 'string' },
          evidenceType: { type: 'string', enum: ['supporting', 'contradictory', 'neutral', 'unknown'] },
          evidenceStrength: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
          category: { 
            type: 'string', 
            enum: ['MARKET_SIZE', 'COMPETITOR', 'CUSTOMER_NEED', 'REGULATORY', 'TECHNOLOGY', 'PROBLEM', 'SOLUTION', 'PRICING'] 
          },
          confidence: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
          implication: { type: 'string' },
          sources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                publisher: { type: 'string' },
                sourceType: { 
                  type: 'string', 
                  enum: ['PRIMARY', 'GOVERNMENT_DATA', 'OFFICIAL_COMPANY', 'ACADEMIC', 'INDUSTRY_REPORT', 'JOURNALISM', 'OTHER'] 
                },
                publishYear: { type: 'number' },
                relevanceScore: { type: 'number' },
                credibility: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
                reliabilityTier: { type: 'string', enum: ['PRIMARY', 'INDUSTRY_REPORT', 'NEWS_ANALYSIS', 'ANECDOTAL'] },
                extractedFact: { type: 'string' }
              },
              required: ['id', 'title', 'publisher', 'relevanceScore', 'reliabilityTier', 'extractedFact']
            }
          }
        },
        required: ['id', 'title', 'statement', 'evidenceType', 'evidenceStrength', 'category', 'confidence', 'implication', 'sources']
      }
    }
  },
  required: [
    'executiveSummary', 
    'confidenceScore', 
    'alternativeSolutions',
    'supportingEvidence',
    'contradictoryEvidence',
    'tailwinds', 
    'headwinds', 
    'unvalidatedAssumptions', 
    'unknowns',
    'competitors', 
    'findings'
  ]
};

