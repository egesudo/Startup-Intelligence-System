/**
 * PDF Client Utilities
 * 
 * Provides robust in-memory Blob-based viewing and downloading
 * that completely bypasses cross-origin, iframe restrictions, and third-party security cookie barriers
 * across desktop Safari, iOS Safari, Chrome, Firefox, and Edge.
 */

import { generateClientReportPdf } from './clientPdfGenerator';
import { Venture } from '../types/domain';
import { fetchWithExponentialBackoff } from './retryWithBackoff';
import { generateLocalEvaluatedVenture } from './clientFallbackEngine';

export interface FetchPdfBlobResult {
  blobUrl: string;
  fileName: string;
  blob: Blob;
}

/**
 * Attempts to retrieve locally stored venture state for offline/client fallback
 * Strictly isolates lookups to the requested ventureId to guarantee project-specific data.
 */
function findLocalVenture(ventureId: string): Partial<Venture> | null {
  if (typeof window === 'undefined') return null;
  try {
    // 1. Try local storage ventures by exact ID
    const venturesRaw = localStorage.getItem('ai_startup_ventures');
    if (venturesRaw) {
      const ventures: Venture[] = JSON.parse(venturesRaw);
      const found = ventures.find(v => v && v.id === ventureId);
      if (found) return found;
    }

    // 2. Try analysis cache by exact ID or matching key
    const cacheRaw = localStorage.getItem('ai_startup_analysis_cache_v1');
    if (cacheRaw) {
      const cacheEntries = JSON.parse(cacheRaw);
      if (cacheEntries[ventureId]) {
        const entry: any = cacheEntries[ventureId];
        return {
          id: ventureId,
          title: entry.title || entry.rawIdeaText || 'Venture',
          problem: entry.rawIdeaText || entry.title,
          targetAudience: entry.targetAudience,
          businessModel: entry.businessModel,
          researchReport: entry.researchReport,
          businessReport: entry.businessReport,
          redTeamReport: entry.redTeamReport,
          judgeReport: entry.judgeReport,
          score: entry.score,
          nextActions: entry.nextActions
        };
      }

      // Check entries by entry.venture?.id or entry.id
      for (const key of Object.keys(cacheEntries)) {
        const entry: any = cacheEntries[key];
        if (entry && (entry.id === ventureId || entry.ventureId === ventureId || entry.venture?.id === ventureId)) {
          return entry.venture || {
            id: ventureId,
            title: entry.title || entry.rawIdeaText || 'Venture',
            problem: entry.rawIdeaText || entry.title,
            targetAudience: entry.targetAudience,
            businessModel: entry.businessModel,
            researchReport: entry.researchReport,
            businessReport: entry.businessReport,
            redTeamReport: entry.redTeamReport,
            judgeReport: entry.judgeReport,
            score: entry.score,
            nextActions: entry.nextActions
          };
        }
      }
    }

    // 3. Try current active venture in sessionStorage
    const activeRaw = sessionStorage.getItem('ai_startup_active_venture');
    if (activeRaw) {
      const active = JSON.parse(activeRaw);
      if (active && (active.id === ventureId || !ventureId)) {
        return active;
      }
    }
  } catch (e) {
    console.warn('[pdfDownloader] notice reading local venture:', e);
  }
  return null;
}

/**
 * Fetches PDF binary data as a Blob and generates a memory-safe object URL.
 * Automatically falls back to high-fidelity client-side PDF generation if server is unreachable.
 */
export async function fetchPdfBlob(
  ventureId: string,
  reportType: 'research' | 'business' | 'red_team' | 'judge' | 'decision',
  isDownload: boolean = false,
  ventureData?: Partial<Venture>
): Promise<FetchPdfBlobResult> {
  const queryParam = isDownload ? '?download=true' : '';
  const url = `/api/ventures/${ventureId}/pdf/${reportType}${queryParam}`;
  const baseVenture = ventureData || findLocalVenture(ventureId) || { id: ventureId };
  let targetVenture: Partial<Venture> = { ...baseVenture };

  if (!targetVenture.researchReport || !targetVenture.businessReport || !targetVenture.redTeamReport || !targetVenture.judgeReport) {
    try {
      const generated = generateLocalEvaluatedVenture({
        id: targetVenture.id || ventureId,
        title: targetVenture.title || 'Startup Venture',
        problem: targetVenture.problem || targetVenture.title || 'Target customer workflow bottleneck',
        targetAudience: targetVenture.targetAudience,
        businessModel: targetVenture.businessModel,
        status: 'evaluated',
        createdAt: targetVenture.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...targetVenture
      } as any);
      targetVenture = {
        ...generated.venture,
        ...targetVenture,
        researchReport: targetVenture.researchReport || generated.venture.researchReport,
        businessReport: targetVenture.businessReport || generated.venture.businessReport,
        redTeamReport: targetVenture.redTeamReport || generated.venture.redTeamReport,
        judgeReport: targetVenture.judgeReport || generated.venture.judgeReport,
        score: targetVenture.score || generated.venture.score,
        nextActions: (targetVenture.nextActions && targetVenture.nextActions.length > 0) ? targetVenture.nextActions : generated.venture.nextActions
      };
    } catch (e) {
      console.warn('[pdfDownloader] notice hydrating venture evaluation:', e);
    }
  }

  try {
    // Attempt POST with full venture payload first with exponential backoff and connection timeout protection
    let response = await fetchWithExponentialBackoff(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venture: targetVenture, download: isDownload })
      },
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 8000,
        timeoutMs: 35000,
        onRetry: (attempt, err, delay) => {
          console.warn(`[pdfDownloader] PDF generation retry #${attempt} for ${reportType} in ${Math.round(delay)}ms...`);
        }
      }
    ).catch(() => null);

    // If POST not successful, try GET with exponential backoff
    if (!response || !response.ok) {
      response = await fetchWithExponentialBackoff(
        url,
        undefined,
        {
          maxRetries: 2,
          initialDelayMs: 1000,
          maxDelayMs: 6000,
          timeoutMs: 30000
        }
      ).catch(() => null);
    }

    if (response && response.ok) {
      const contentDisposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
      const formattedType = reportType.replace('_', '-');
      const safeTitle = (targetVenture.title || 'Venture').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
      const fileName = filenameMatch ? filenameMatch[1] : `${safeTitle}_${formattedType}_report.pdf`;

      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(pdfBlob);

      return {
        blobUrl,
        fileName,
        blob: pdfBlob
      };
    }
  } catch (err) {
    console.warn('[pdfDownloader] Server PDF endpoint unavailable after retries, using high-fidelity client generator:', err);
  }

  // High-fidelity client-side PDF fallback generator
  const clientPdf = await generateClientReportPdf(targetVenture, reportType);
  return {
    blobUrl: clientPdf.blobUrl,
    fileName: clientPdf.fileName,
    blob: clientPdf.blob
  };
}

/**
 * Downloads a PDF report directly from memory without triggering page navigation or cookie interstitials.
 */
export async function downloadPdfReport(
  ventureId: string,
  reportType: 'research' | 'business' | 'red_team' | 'judge' | 'decision',
  customFileName?: string,
  ventureData?: Partial<Venture>
): Promise<string> {
  const { blobUrl, fileName } = await fetchPdfBlob(ventureId, reportType, true, ventureData);
  const finalName = customFileName 
    ? (customFileName.endsWith('.pdf') ? customFileName : `${customFileName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${reportType}_report.pdf`)
    : fileName;

  const downloadLink = document.createElement('a');
  downloadLink.href = blobUrl;
  downloadLink.download = finalName;
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  // Clean up object URL after download trigger
  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 15000);

  return finalName;
}

/**
 * Opens a PDF report in a new tab using a direct Blob URL.
 */
export async function openPdfInNewTab(
  ventureId: string,
  reportType: 'research' | 'business' | 'red_team' | 'judge' | 'decision',
  ventureData?: Partial<Venture>
): Promise<void> {
  const { blobUrl } = await fetchPdfBlob(ventureId, reportType, false, ventureData);
  window.open(blobUrl, '_blank', 'noopener,noreferrer');
}

