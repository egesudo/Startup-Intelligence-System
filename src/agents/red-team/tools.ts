/**
 * Red Team Agent Tool Interfaces (Foundation Definition)
 */

export interface IFailureModeDatabase {
  lookupAnalogousStartupFailures(category: string, failurePattern: string): Promise<Array<{ startupName: string; postMortemReason: string }>>;
}

export interface IIncumbentStrengthAssessor {
  assessBundlingRisk(incumbentName: string, coreFeature: string): Promise<{ bundlingLikelihood: 'LOW' | 'MEDIUM' | 'HIGH'; rationale: string }>;
}
