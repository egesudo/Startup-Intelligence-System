/**
 * Orchestration Service
 * Wraps MultiAgentOrchestrator for Express API endpoints.
 */

import { multiAgentOrchestrator } from '../../agents/orchestrator';
import { Venture } from '../../types/domain';
import { PipelineProgressEvent } from '../../types/agents';
import { ventureRepository } from '../db/repository';

export class OrchestrationService {
  async runAnalysis(
    ventureId: string,
    onProgress?: (event: PipelineProgressEvent) => void
  ): Promise<Venture> {
    const finalState = await multiAgentOrchestrator.executePipeline(ventureId, (state) => {
      if (onProgress) {
        let currentAgent: PipelineProgressEvent['currentAgent'] = 'RESEARCH';
        let percentage = 15;
        let message = 'Starting venture analysis...';

        if (state.agentWorkflow.research.status === 'running') {
          currentAgent = 'RESEARCH';
          percentage = 20;
          message = 'Research Agent: Scanning empirical facts, benchmarks & competitors...';
        } else if (state.agentWorkflow.research.status === 'completed' && state.agentWorkflow.business.status === 'running') {
          currentAgent = 'BUSINESS';
          percentage = 45;
          message = 'Business Agent: Evaluating customer willingness-to-pay, unit economics, assumptions & risks...';
        } else if (state.agentWorkflow.business.status === 'completed' && state.agentWorkflow.redTeam.status === 'running') {
          currentAgent = 'RED_TEAM';
          percentage = 70;
          message = 'Red Team Agent: Adversarially stress-testing claims, assumptions & failure modes...';
        } else if (state.agentWorkflow.redTeam.status === 'completed' && state.agentWorkflow.judge.status === 'running') {
          currentAgent = 'JUDGE';
          percentage = 90;
          message = 'Judge Agent: Adjudicating evidence hierarchy, cross-agent tensions & formulating thesis...';
        } else if (state.agentWorkflow.judge.status === 'completed') {
          currentAgent = 'JUDGE';
          percentage = 100;
          message = 'Multi-agent evaluation and judicial synthesis completed successfully.';
        } else if (state.agentWorkflow.judge.status === 'failed') {
          currentAgent = 'JUDGE';
          percentage = 85;
          message = `Judge Agent failed: ${state.agentWorkflow.judge.error}`;
        } else if (state.agentWorkflow.redTeam.status === 'failed') {
          currentAgent = 'RED_TEAM';
          percentage = 65;
          message = `Red Team Agent failed: ${state.agentWorkflow.redTeam.error}`;
        } else if (state.agentWorkflow.business.status === 'failed') {
          currentAgent = 'BUSINESS';
          percentage = 40;
          message = `Business Agent failed: ${state.agentWorkflow.business.error}`;
        } else if (state.agentWorkflow.research.status === 'failed') {
          currentAgent = 'RESEARCH';
          percentage = 0;
          message = `Research Agent failed: ${state.agentWorkflow.research.error}`;
        }

        onProgress({
          ventureId,
          currentAgent,
          status: state.analysisStatus === 'completed' ? 'COMPLETED' : (state.analysisStatus === 'failed' ? 'FAILED' : 'IN_PROGRESS'),
          percentage,
          message,
          timestamp: new Date().toISOString()
        });
      }
    });

    const updated = await ventureRepository.findById(ventureId);
    return updated || finalState.venture;
  }

  async runResearchAgent(ventureId: string): Promise<Venture> {
    return this.runAnalysis(ventureId);
  }

  async runBusinessAgent(ventureId: string): Promise<Venture> {
    const finalState = await multiAgentOrchestrator.executeBusinessAgentOnly(ventureId);
    const updated = await ventureRepository.findById(ventureId);
    return updated || finalState.venture;
  }

  async runRedTeamAgent(ventureId: string): Promise<Venture> {
    const finalState = await multiAgentOrchestrator.executeRedTeamAgentOnly(ventureId);
    const updated = await ventureRepository.findById(ventureId);
    return updated || finalState.venture;
  }

  async runJudgeAgent(ventureId: string): Promise<Venture> {
    const finalState = await multiAgentOrchestrator.executeJudgeAgentOnly(ventureId);
    const updated = await ventureRepository.findById(ventureId);
    return updated || finalState.venture;
  }
}

export const orchestrationService = new OrchestrationService();
