/**
 * Server-Side Gemini Service for Startup Intelligence
 * 
 * Handles Idea Understanding and Critical Question Generation using the @google/genai SDK.
 * Implements strict structured outputs, server-only API key handling, and robust fail-safes.
 */

import { Type } from '@google/genai';
import { 
  StructuredVentureUnderstanding, 
  CriticalQuestion, 
  QuestionCategory 
} from '../../types/domain';
import { executeGeminiWithFallback, getAiClient } from './geminiClient';

export interface IntakeRawInput {
  idea: string;
  targetCustomer?: string;
  geography?: string;
  context?: string;
}

export interface CriticalQuestionDraft {
  question: string;
  whyItMatters: string;
  category: QuestionCategory;
  suggestedOptions?: string[];
  required: boolean;
}

export class GeminiIntakeService {
  /**
   * 1. IDEA UNDERSTANDING
   * Transforms raw natural-language idea and optional founder context into a structured representation.
   */
  async understandIdea(input: IntakeRawInput): Promise<StructuredVentureUnderstanding> {
    const ai = getAiClient();
    
    // Heuristic fallback if Gemini API key is missing or offline
    if (!ai) {
      return this.fallbackUnderstanding(input);
    }

    try {
      const prompt = `
Founder's Startup Thesis:
"${input.idea}"

Target Customer (if provided): ${input.targetCustomer || 'Not specified'}
Market/Geography (if provided): ${input.geography || 'Not specified'}
Additional Context (if provided): ${input.context || 'Not specified'}

Analyze the startup thesis above and extract a structured representation.
Strict Rules:
1. DO NOT invent missing information. If information is not mentioned or implied, return null or list it in importantUnknowns.
2. Formulate a crisp, professional suggestedTitle for the venture.
3. Identify the core Problem and proposed Solution.
4. Extract Target Customer, Market/Geography, Value Proposition, Business Model (if mentioned), and Technology (if mentioned).
5. List 2-4 key implicit or explicit Founder Assumptions.
6. List 2-4 Important Unknowns that need empirical investigation.
`;

      const responseText = await executeGeminiWithFallback({
        contents: prompt,
        config: {
          systemInstruction: 'You are the Intake & Understanding Core of Startup Intelligence. Your mission is to parse founder startup theses into rigorous structured models without hallucinating or inventing missing facts.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedTitle: { type: Type.STRING, description: 'Concise, professional title for the venture' },
              problem: { type: Type.STRING, description: 'The specific core problem being addressed, or null if ambiguous' },
              solution: { type: Type.STRING, description: 'The proposed solution and mechanism, or null if unspecified' },
              targetCustomer: { type: Type.STRING, description: 'Primary beachhead customer persona, or null if unspecified' },
              marketGeography: { type: Type.STRING, description: 'Target market region or vertical, or null if unspecified' },
              valueProposition: { type: Type.STRING, description: 'Primary quantifiable value proposition, or null if unspecified' },
              businessModel: { type: Type.STRING, description: 'Proposed monetization/business model if mentioned, or null' },
              technology: { type: Type.STRING, description: 'Core technology stack or AI/hardware mechanism if mentioned, or null' },
              founderAssumptions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Key unvalidated assumptions underlying the idea'
              },
              importantUnknowns: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Crucial unknowns or missing pieces that require clarification'
              }
            },
            required: ['suggestedTitle', 'founderAssumptions', 'importantUnknowns']
          }
        }
      });

      if (!responseText) {
        return this.fallbackUnderstanding(input);
      }

      const parsed: StructuredVentureUnderstanding = JSON.parse(responseText.trim());
      return {
        suggestedTitle: parsed.suggestedTitle || this.deriveTitle(input.idea),
        problem: parsed.problem || null,
        solution: parsed.solution || null,
        targetCustomer: parsed.targetCustomer || input.targetCustomer || null,
        marketGeography: parsed.marketGeography || input.geography || null,
        valueProposition: parsed.valueProposition || null,
        businessModel: parsed.businessModel || null,
        technology: parsed.technology || null,
        founderAssumptions: Array.isArray(parsed.founderAssumptions) ? parsed.founderAssumptions : [],
        importantUnknowns: Array.isArray(parsed.importantUnknowns) ? parsed.importantUnknowns : []
      };
    } catch (err) {
      console.warn('Gemini understandIdea encountered an issue, using fallback heuristic:', err);
      return this.fallbackUnderstanding(input);
    }
  }

  /**
   * 2. CRITICAL QUESTIONS GENERATION
   * Determines if additional information is genuinely necessary (0 to 5 questions maximum).
   */
  async generateCriticalQuestions(
    understanding: StructuredVentureUnderstanding,
    input: IntakeRawInput
  ): Promise<CriticalQuestionDraft[]> {
    const ai = getAiClient();

    if (!ai) {
      return this.fallbackQuestions(understanding, input);
    }

    try {
      const prompt = `
Structured Venture Representation:
- Title: ${understanding.suggestedTitle}
- Problem: ${understanding.problem || 'Unknown'}
- Solution: ${understanding.solution || 'Unknown'}
- Target Customer: ${understanding.targetCustomer || 'Unknown'}
- Market/Geography: ${understanding.marketGeography || 'Unknown'}
- Value Proposition: ${understanding.valueProposition || 'Unknown'}
- Business Model: ${understanding.businessModel || 'Unknown'}
- Technology: ${understanding.technology || 'Unknown'}
- Founder Assumptions: ${JSON.stringify(understanding.founderAssumptions || [])}
- Important Unknowns: ${JSON.stringify(understanding.importantUnknowns || [])}

Raw Founder Notes:
"${input.idea}"
Additional Context: "${input.context || 'None'}"

TASK:
Determine whether additional critical questions are genuinely necessary to resolve high-stakes ambiguities before initiating Research, Business, Red Team, and Judge agent analysis.

STRICT CONSTRAINTS:
1. Generate between 0 and 5 questions (NEVER exceed 5 questions).
2. If sufficient clarity already exists, generate FEWER questions (e.g. 1 to 3). If everything crucial is clear, generate 0 questions.
3. DO NOT ask generic questions (e.g. "Who are your competitors?" or "What is your vision?").
4. Questions must be high-value, laser-focused on this specific venture, decision-relevant, and straightforward for the founder to answer.
5. Provide 2-4 quick select suggestedOptions when practical to make answering effortless.
6. Categorize each question under one of: customer, problem, market, business_model, competition, validation, technology, geography.
`;

      const responseText = await executeGeminiWithFallback({
        contents: prompt,
        config: {
          systemInstruction: 'You are the Critical Question Engine for Startup Intelligence. You ask strictly 0-5 high-value, venture-specific clarification questions that resolve material uncertainties before agent evaluation.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: 'Specific, high-impact clarification question' },
                whyItMatters: { type: Type.STRING, description: 'Clear explanation of why this answer is crucial for the intelligence agents' },
                category: {
                  type: Type.STRING,
                  description: 'Category: customer, problem, market, business_model, competition, validation, technology, geography'
                },
                suggestedOptions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '2 to 4 quick suggested multiple-choice options or archetypes'
                },
                required: { type: Type.BOOLEAN, description: 'True if critical ambiguity, false if optional nuance' }
              },
              required: ['question', 'whyItMatters', 'category', 'required']
            }
          }
        }
      });

      if (!responseText) {
        return this.fallbackQuestions(understanding, input);
      }

      const rawQuestions: any[] = JSON.parse(responseText.trim());
      const validCategories: QuestionCategory[] = [
        'customer', 'problem', 'market', 'business_model', 
        'competition', 'validation', 'technology', 'geography'
      ];

      const questions: CriticalQuestionDraft[] = (Array.isArray(rawQuestions) ? rawQuestions : [])
        .slice(0, 5)
        .map((q) => ({
          question: q.question || 'What is the primary operational constraint for this venture?',
          whyItMatters: q.whyItMatters || 'Helps the agent pipeline evaluate deployment friction.',
          category: validCategories.includes(q.category) ? q.category : 'problem',
          suggestedOptions: Array.isArray(q.suggestedOptions) && q.suggestedOptions.length > 0 ? q.suggestedOptions.slice(0, 4) : undefined,
          required: Boolean(q.required)
        }));

      return questions;
    } catch (err) {
      console.warn('Gemini generateCriticalQuestions encountered an issue, using fallback heuristic:', err);
      return this.fallbackQuestions(understanding, input);
    }
  }

  // --- Fallback Heuristic Parsers ---

  private deriveTitle(idea: string): string {
    const trimmed = idea.trim();
    if (!trimmed) return 'Untitled Venture';
    const firstSentence = trimmed.split(/[.\n]/)[0];
    if (firstSentence.length <= 60) return firstSentence;
    return firstSentence.substring(0, 57) + '...';
  }

  private fallbackUnderstanding(input: IntakeRawInput): StructuredVentureUnderstanding {
    const title = this.deriveTitle(input.idea);
    const hasPricing = /price|subscription|fee|\$|margin|commission|freemium|saas/i.test(input.idea);
    const hasAI = /ai|llm|agent|machine learning|vision|neural/i.test(input.idea);

    return {
      suggestedTitle: title,
      problem: `Identified problem from founder thesis: ${input.idea.slice(0, 140)}...`,
      solution: input.idea.length > 140 ? input.idea.slice(0, 280) : input.idea,
      targetCustomer: input.targetCustomer || null,
      marketGeography: input.geography || null,
      valueProposition: null,
      businessModel: hasPricing ? 'Subscription / Usage-based software fee' : null,
      technology: hasAI ? 'Applied AI / Agentic LLM Automation' : null,
      founderAssumptions: [
        'Customers will actively switch from their current status quo workflow.',
        'Unit economics will sustain sales and customer acquisition costs.'
      ],
      importantUnknowns: [
        'Actual customer willingness to pay and budget authority.',
        'Defensibility against incumbent solutions with established distribution.'
      ]
    };
  }

  private fallbackQuestions(
    understanding: StructuredVentureUnderstanding,
    input: IntakeRawInput
  ): CriticalQuestionDraft[] {
    const questions: CriticalQuestionDraft[] = [];

    if (!understanding.targetCustomer && !input.targetCustomer) {
      questions.push({
        question: 'Who is the single most specific initial customer persona who suffers this pain most urgently?',
        whyItMatters: 'Pinpointing an early beachhead segment prevents broad, unfocused messaging and high CAC.',
        category: 'customer',
        suggestedOptions: [
          'Mid-market operations leaders',
          'Solopreneurs / Freelancers',
          'Enterprise IT / Security directors',
          'High-intent consumer power users'
        ],
        required: true
      });
    }

    if (!understanding.businessModel) {
      questions.push({
        question: 'What is your anticipated primary monetization mechanism?',
        whyItMatters: 'Determines whether your customer lifetime value can outpace acquisition friction.',
        category: 'business_model',
        suggestedOptions: [
          'Monthly recurring B2B subscription',
          'Usage-based / consumption pricing',
          'Percentage commission / marketplace fee',
          'Annual enterprise contract with setup fees'
        ],
        required: false
      });
    }

    questions.push({
      question: 'What is the primary status quo or alternative your target customer currently uses today?',
      whyItMatters: 'Reveals true switching costs and the behavioral friction required to adopt your solution.',
      category: 'competition',
      suggestedOptions: [
        'Manual spreadsheets & email workflows',
        'Legacy enterprise software suites',
        'Outsourced agency / human services',
        'Doing nothing / living with the inefficiency'
      ],
      required: false
    });

    return questions.slice(0, 5);
  }
}

export const geminiIntakeService = new GeminiIntakeService();
