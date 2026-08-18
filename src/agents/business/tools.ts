/**
 * Business Agent Tool Interfaces (Foundation Definition)
 */

export interface IUnitEconomicsCalculator {
  estimateCAC(channel: string, targetACV: number): Promise<{ estimatedCAC: number; paybackMonths: number }>;
}

export interface IPricingBenchmarkTool {
  lookupCategoryPricing(archetype: string, vertical: string): Promise<Array<{ tierName: string; medianPriceMonthly: number }>>;
}
