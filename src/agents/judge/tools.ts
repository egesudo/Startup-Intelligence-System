/**
 * Judge Agent Tool Interfaces (Foundation Definition)
 */

import { VentureScore } from '../../types/domain';

export interface IScoreValidationTool {
  validateScoreBounds(score: VentureScore): boolean;
}

export interface IExperimentDesignerTool {
  suggestPassFailCriteria(actionType: string, targetHypothesis: string): Promise<string>;
}
