/**
 * Research Agent Tool Interfaces (Foundation Definition)
 */

import { Source } from '../../types/domain';

export interface IWebSearchTool {
  searchMarketData(query: string): Promise<Array<{ title: string; snippet: string; url: string }>>;
}

export interface ISourceExtractionTool {
  extractFact(sourceUrl: string, claim: string): Promise<Source | null>;
}

export interface ICompetitorLookupTool {
  findAlternativeSolutions(categoryKeywords: string[]): Promise<Array<{ name: string; domain: string }>>;
}
