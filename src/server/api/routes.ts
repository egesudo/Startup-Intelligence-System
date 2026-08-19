/**
 * API Routes for Startup Intelligence
 */

import { Router } from 'express';
import { ventureService } from '../services/ventureService';
import { orchestrationService } from '../services/orchestrationService';
import { ventureRepository } from '../db/repository';
import { checkSupabaseConnection, isSupabaseConfigured } from '../db/supabase';
import { pdfReportService, ReportArtifactType } from '../services/pdfReportService';
import { getSupabaseEnvDiagnostics, logServerEnvDiagnostics } from '../utils/supabaseDiagnostics';
import { sourceGroundingService } from '../services/sourceGroundingService';

export const apiRouter = Router();

// General Health Check
apiRouter.get('/health', async (req, res) => {
  const supabaseConfigured = isSupabaseConfigured();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    supabase: {
      configured: supabaseConfigured
    }
  });
});

// Dedicated Supabase Environment Variables Diagnostic Endpoint
apiRouter.get('/diagnostics/supabase', (req, res) => {
  const report = logServerEnvDiagnostics();
  res.json(report);
});

apiRouter.get('/diagnostics/env', (req, res) => {
  const report = logServerEnvDiagnostics();
  res.json(report);
});

// Dedicated Supabase Connection & Credentials Health Check
apiRouter.get('/supabase/health', async (req, res) => {
  try {
    const healthResult = await checkSupabaseConnection();
    res.json(healthResult);
  } catch (error: any) {
    res.status(500).json({
      configured: false,
      connected: false,
      schemaInitialized: false,
      message: 'Failed to execute Supabase health check',
      error: error?.message || 'UNKNOWN_ERROR'
    });
  }
});

// List all ventures (Safe resilience pattern)
apiRouter.get('/ventures', async (req, res) => {
  try {
    const ventures = await ventureService.listVentures();
    res.json(ventures || []);
  } catch (error: any) {
    console.error('[API /ventures] Error listing ventures, returning in-memory or empty fallback:', error);
    try {
      const fallbackVentures = await ventureRepository.findAll();
      res.json(fallbackVentures || []);
    } catch {
      res.json([]);
    }
  }
});

// Get single venture with all sub-documents
apiRouter.get('/ventures/:id', async (req, res) => {
  try {
    const venture = await ventureService.getVentureById(req.params.id);
    if (!venture) {
      return res.status(404).json({ error: 'Venture not found' });
    }
    res.json(venture);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get full analysis state for a venture
apiRouter.get('/ventures/:id/state', async (req, res) => {
  try {
    const state = await ventureService.getAnalysisState(req.params.id);
    if (!state) {
      return res.status(404).json({ error: 'Venture not found' });
    }
    res.json(state);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Phase 2: Natural language venture intake with Gemini understanding & questions
apiRouter.post('/ventures/intake', async (req, res) => {
  try {
    const { idea, targetCustomer, geography, context } = req.body;
    if (!idea || typeof idea !== 'string' || !idea.trim()) {
      return res.status(400).json({ error: 'A startup idea is required' });
    }

    const result = await ventureService.processIntake({
      idea: idea.trim(),
      targetCustomer: targetCustomer?.trim(),
      geography: geography?.trim(),
      context: context?.trim()
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('[API /ventures/intake] Error during intake processing, applying graceful fallback:', error);
    try {
      // Fallback to direct creation if intake AI pipeline failed
      const rawIdea = req.body?.idea || 'New Startup Venture';
      const created = await ventureRepository.create({
        title: rawIdea.slice(0, 45) + (rawIdea.length > 45 ? '...' : ''),
        description: rawIdea,
        rawIdea: rawIdea,
        targetAudience: req.body?.targetCustomer || '',
        status: 'draft'
      });
      const fallbackState = await ventureService.getAnalysisState(created.id);
      if (fallbackState) {
        return res.status(201).json({
          venture: fallbackState.venture,
          analysisState: fallbackState
        });
      }
      res.status(201).json({ venture: created, analysisState: null });
    } catch (fallbackError: any) {
      res.status(500).json({ error: error?.message || 'Failed to process startup idea' });
    }
  }
});

// Create new venture idea (fallback / standard form)
apiRouter.post('/ventures', async (req, res) => {
  try {
    const { title, description, targetAudience, valueProposition, monetizationIdea, idea } = req.body;
    
    if (idea) {
      const result = await ventureService.processIntake({
        idea: idea.trim(),
        targetCustomer: targetAudience?.trim(),
        context: [valueProposition, monetizationIdea].filter(Boolean).join('; ')
      });
      return res.status(201).json(result.venture);
    }

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description or idea are required' });
    }

    const venture = await ventureService.createVenture({
      title,
      description,
      targetAudience,
      valueProposition,
      monetizationIdea
    });

    res.status(201).json(venture);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Answer a critical question
apiRouter.post('/ventures/:id/questions/:questionId/answer', async (req, res) => {
  try {
    const { answer } = req.body;
    if (!answer) {
      return res.status(400).json({ error: 'Answer is required' });
    }

    const updated = await ventureService.answerQuestion(req.params.id, req.params.questionId, answer);
    if (!updated) {
      return res.status(404).json({ error: 'Question or venture not found' });
    }

    const state = await ventureService.getAnalysisState(req.params.id);
    res.json({ question: updated, state });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Skip a critical question
apiRouter.post('/ventures/:id/questions/:questionId/skip', async (req, res) => {
  try {
    const updated = await ventureService.skipQuestion(req.params.id, req.params.questionId);
    if (!updated) {
      return res.status(404).json({ error: 'Question or venture not found' });
    }

    const state = await ventureService.getAnalysisState(req.params.id);
    res.json({ question: updated, state });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Finalize intake and prepare for agent pipeline
apiRouter.post('/ventures/:id/finalize-intake', async (req, res) => {
  try {
    const state = await ventureService.finalizeIntake(req.params.id);
    if (!state) {
      return res.status(404).json({ error: 'Venture not found' });
    }
    res.json(state);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Run multi-agent analysis orchestration
apiRouter.post('/ventures/:id/analyze', async (req, res) => {
  try {
    const venture = await orchestrationService.runAnalysis(req.params.id);
    res.json(venture);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Run Research Agent explicitly (Phase 3)
apiRouter.post('/ventures/:id/research/run', async (req, res) => {
  try {
    const venture = await orchestrationService.runResearchAgent(req.params.id);
    res.json(venture);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Run Business Agent explicitly (Phase 4)
apiRouter.post('/ventures/:id/business/run', async (req, res) => {
  try {
    const venture = await orchestrationService.runBusinessAgent(req.params.id);
    res.json(venture);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Run Red Team Agent explicitly (Phase 5)
apiRouter.post('/ventures/:id/redteam/run', async (req, res) => {
  try {
    const venture = await orchestrationService.runRedTeamAgent(req.params.id);
    res.json(venture);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Run Judge Agent explicitly (Phase 6)
apiRouter.post('/ventures/:id/judge/run', async (req, res) => {
  try {
    const venture = await orchestrationService.runJudgeAgent(req.params.id);
    res.json(venture);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Research Report for a venture
apiRouter.get('/ventures/:id/research', async (req, res) => {
  try {
    const report = await ventureRepository.getResearchReport(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Research report not found for this venture' });
    }
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Business Report for a venture (Phase 4)
apiRouter.get('/ventures/:id/business', async (req, res) => {
  try {
    const report = await ventureRepository.getBusinessReport(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Business report not found for this venture' });
    }
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Red Team Report for a venture (Phase 5)
apiRouter.get('/ventures/:id/redteam', async (req, res) => {
  try {
    const report = await ventureRepository.getRedTeamReport(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Red Team report not found for this venture' });
    }
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Judge Report for a venture (Phase 6)
apiRouter.get('/ventures/:id/judge', async (req, res) => {
  try {
    const report = await ventureRepository.getJudgeReport(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Judge report not found for this venture' });
    }
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Judge Core Thesis (Phase 6)
apiRouter.get('/ventures/:id/judge/thesis', async (req, res) => {
  try {
    const thesis = await ventureRepository.getJudgeThesis(req.params.id);
    if (!thesis) {
      return res.status(404).json({ error: 'Core venture thesis not found' });
    }
    res.json(thesis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Judge Cross-Agent Assessment (Phase 6)
apiRouter.get('/ventures/:id/judge/cross-agent', async (req, res) => {
  try {
    const assessment = await ventureRepository.getJudgeCrossAgentAssessment(req.params.id);
    if (!assessment) {
      return res.status(404).json({ error: 'Cross agent assessment not found' });
    }
    res.json(assessment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Judge Critical Unknowns (Phase 6)
apiRouter.get('/ventures/:id/judge/unknowns', async (req, res) => {
  try {
    const { impact, confidence } = req.query;
    const unknowns = await ventureRepository.getJudgeCriticalUnknowns(req.params.id, {
      impact: impact as string | undefined,
      confidence: confidence as string | undefined
    });
    res.json(unknowns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Judge Decision-Changing Evidence (Phase 6)
apiRouter.get('/ventures/:id/judge/decision-evidence', async (req, res) => {
  try {
    const evidenceList = await ventureRepository.getJudgeDecisionEvidence(req.params.id);
    res.json(evidenceList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Judge Next Actions (Phase 6)
apiRouter.get('/ventures/:id/judge/next-actions', async (req, res) => {
  try {
    const actions = await ventureRepository.getJudgeNextActions(req.params.id);
    res.json(actions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Judge Evidence Traceability (Phase 6)
apiRouter.get('/ventures/:id/judge/traceability', async (req, res) => {
  try {
    const { status, evidenceLevel } = req.query;
    const traces = await ventureRepository.getJudgeEvidenceTraceability(req.params.id, {
      status: status as string | undefined,
      evidenceLevel: evidenceLevel as string | undefined
    });
    res.json(traces);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get queryable challenged claims (Phase 5)
apiRouter.get('/ventures/:id/redteam/claims', async (req, res) => {
  try {
    const { evidenceStatus, severity, confidence } = req.query;
    const claims = await ventureRepository.getRedTeamClaims(req.params.id, {
      evidenceStatus: evidenceStatus as string | undefined,
      severity: severity as string | undefined,
      confidence: confidence as string | undefined
    });
    res.json(claims);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get queryable red team risks (Phase 5)
apiRouter.get('/ventures/:id/redteam/risks', async (req, res) => {
  try {
    const { category, severity, riskType, evidenceStatus } = req.query;
    const risks = await ventureRepository.getRedTeamRisks(req.params.id, {
      category: category as string | undefined,
      severity: severity as string | undefined,
      riskType: riskType as string | undefined,
      evidenceStatus: evidenceStatus as string | undefined
    });
    res.json(risks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get queryable assumption attacks (Phase 5)
apiRouter.get('/ventures/:id/redteam/assumptions', async (req, res) => {
  try {
    const { importance, evidenceStatus } = req.query;
    const assumptions = await ventureRepository.getRedTeamAssumptions(req.params.id, {
      importance: importance as string | undefined,
      evidenceStatus: evidenceStatus as string | undefined
    });
    res.json(assumptions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get queryable contradictions (Phase 5)
apiRouter.get('/ventures/:id/redteam/contradictions', async (req, res) => {
  try {
    const { severity, evidenceStatus } = req.query;
    const contradictions = await ventureRepository.getRedTeamContradictions(req.params.id, {
      severity: severity as string | undefined,
      evidenceStatus: evidenceStatus as string | undefined
    });
    res.json(contradictions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get queryable competitive threats (Phase 5)
apiRouter.get('/ventures/:id/redteam/threats', async (req, res) => {
  try {
    const { threatType, differentiationStatus } = req.query;
    const threats = await ventureRepository.getRedTeamThreats(req.params.id, {
      threatType: threatType as string | undefined,
      differentiationStatus: differentiationStatus as string | undefined
    });
    res.json(threats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get queryable failure conditions (Phase 5)
apiRouter.get('/ventures/:id/redteam/failure-conditions', async (req, res) => {
  try {
    const { severity, confidence } = req.query;
    const conditions = await ventureRepository.getRedTeamFailureConditions(req.params.id, {
      severity: severity as string | undefined,
      confidence: confidence as string | undefined
    });
    res.json(conditions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get queryable decision changing evidence (Phase 5)
apiRouter.get('/ventures/:id/redteam/decision-evidence', async (req, res) => {
  try {
    const { direction, importance } = req.query;
    const evidenceList = await ventureRepository.getRedTeamDecisionEvidence(req.params.id, {
      direction: direction as string | undefined,
      importance: importance as string | undefined
    });
    res.json(evidenceList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get queryable research findings with filters
apiRouter.get('/ventures/:id/findings', async (req, res) => {
  try {
    const { evidenceType, category, confidence } = req.query;
    const findings = await ventureRepository.getResearchFindings(req.params.id, {
      evidenceType: evidenceType as string | undefined,
      category: category as string | undefined,
      confidence: confidence as string | undefined
    });
    res.json(findings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get queryable business assumptions with filters (Phase 4)
apiRouter.get('/ventures/:id/assumptions', async (req, res) => {
  try {
    const { category, importance, evidenceStatus } = req.query;
    const assumptions = await ventureRepository.getBusinessAssumptions(req.params.id, {
      category: category as string | undefined,
      importance: importance as string | undefined,
      evidenceStatus: evidenceStatus as string | undefined
    });
    res.json(assumptions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get queryable business risks with filters (Phase 4)
apiRouter.get('/ventures/:id/risks', async (req, res) => {
  try {
    const { probability, impact } = req.query;
    const risks = await ventureRepository.getBusinessRisks(req.params.id, {
      probability: probability as string | undefined,
      impact: impact as string | undefined
    });
    res.json(risks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get queryable sources with filters
apiRouter.get('/ventures/:id/sources', async (req, res) => {
  try {
    const { reliabilityTier, credibility } = req.query;
    const sources = await ventureRepository.getSources(req.params.id, {
      reliabilityTier: reliabilityTier as string | undefined,
      credibility: credibility as string | undefined
    });
    res.json(sources);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Record Founder Decision
apiRouter.post('/ventures/:id/decision', async (req, res) => {
  try {
    const { choice, rationale, alignmentWithAI, overrideReason } = req.body;
    if (!choice || !rationale) {
      return res.status(400).json({ error: 'Choice and rationale are required' });
    }

    const decision = await ventureService.recordDecision(req.params.id, {
      choice,
      rationale,
      alignmentWithAI: alignmentWithAI || 'ALIGNED',
      overrideReason
    });

    res.json(decision);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle Action Item completion
apiRouter.post('/ventures/:id/actions/:actionId/toggle', async (req, res) => {
  try {
    const action = await ventureService.toggleAction(req.params.id, req.params.actionId);
    if (!action) {
      return res.status(404).json({ error: 'Action or venture not found' });
    }
    res.json(action);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a venture
apiRouter.delete('/ventures/:id', async (req, res) => {
  try {
    const success = await ventureService.deleteVenture(req.params.id);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Search Grounding & Source Verification via Gemini + Google Search
apiRouter.post('/grounding/verify-source', async (req, res) => {
  try {
    const { sourceTitle, publisher, publishYear, archetype, query, extractedFact, ventureTitle } = req.body;
    if (!sourceTitle && !query) {
      return res.status(400).json({ error: 'sourceTitle or query is required for verification' });
    }

    const result = await sourceGroundingService.verifySource({
      sourceTitle: sourceTitle || 'Market Benchmark',
      publisher,
      publishYear,
      archetype,
      query,
      extractedFact,
      ventureTitle
    });

    res.json(result);
  } catch (error: any) {
    console.error('[API /grounding/verify-source] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify source with search grounding' });
  }
});

// Phase 9: PDF Intelligence File view and download endpoints
apiRouter.get('/ventures/:id/pdf/:type', async (req, res) => {
  try {
    const { id, type } = req.params;
    const validTypes: ReportArtifactType[] = ['research', 'business', 'red_team', 'judge', 'decision'];
    
    // Normalize type parameter
    const normalizedType = type.replace('-', '_') as ReportArtifactType;
    if (!validTypes.includes(normalizedType)) {
      return res.status(400).json({ error: `Invalid report type "${type}". Valid types: ${validTypes.join(', ')}` });
    }

    const venture = await ventureService.getVentureById(id);
    if (!venture) {
      return res.status(404).json({ error: 'Venture not found' });
    }

    const { buffer, fileName } = await pdfReportService.generateReportPdf(venture, normalizedType);

    // Asynchronously save to Supabase Storage in the background without blocking the response
    pdfReportService.generateAndStoreReportPdf(venture, normalizedType).catch(err => {
      console.warn(`[Supabase Storage background upload] ${err.message}`);
    });

    const isDownload = req.query.download === 'true' || req.query.dl === '1';
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${isDownload ? 'attachment' : 'inline'}; filename="${fileName}"`
    );
    res.setHeader('Content-Length', buffer.byteLength);
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    res.send(Buffer.from(buffer));
  } catch (error: any) {
    console.error('[PDF Export Route Error]:', error);
    res.status(500).json({ error: error.message || 'Failed to generate PDF document' });
  }
});

// Phase 9: Get PDF Storage Signed URL
apiRouter.get('/ventures/:id/pdf/:type/url', async (req, res) => {
  try {
    const { id, type } = req.params;
    const normalizedType = type.replace('-', '_') as ReportArtifactType;
    const venture = await ventureService.getVentureById(id);
    if (!venture) {
      return res.status(404).json({ error: 'Venture not found' });
    }

    const storageResult = await pdfReportService.generateAndStoreReportPdf(venture, normalizedType);
    res.json({
      fileName: storageResult.fileName,
      storagePath: storageResult.storagePath,
      signedUrl: storageResult.signedUrl || `/api/ventures/${id}/pdf/${type}?download=true`,
      viewUrl: `/api/ventures/${id}/pdf/${type}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

