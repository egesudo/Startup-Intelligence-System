/**
 * PDF Client Utilities
 * 
 * Provides robust in-memory Blob-based viewing and downloading
 * that completely bypasses cross-origin, iframe restrictions, and third-party security cookie barriers
 * across desktop Safari, iOS Safari, Chrome, Firefox, and Edge.
 */

import { generateClientReportPdf } from './clientPdfGenerator';
import { Venture } from '../types/domain';

export interface FetchPdfBlobResult {
  blobUrl: string;
  fileName: string;
  blob: Blob;
}

/**
 * Attempts to retrieve locally stored venture state for offline/client fallback
 */
function findLocalVenture(ventureId: string): Partial<Venture> | null {
  if (typeof window === 'undefined') return null;
  try {
    // 1. Try local storage ventures
    const venturesRaw = localStorage.getItem('ai_startup_ventures');
    if (venturesRaw) {
      const ventures: Venture[] = JSON.parse(venturesRaw);
      const found = ventures.find(v => v.id === ventureId);
      if (found) return found;
      if (ventures.length > 0) return ventures[0];
    }
    // 2. Try analysis cache
    const cacheRaw = localStorage.getItem('ai_startup_analysis_cache_v1');
    if (cacheRaw) {
      const cacheEntries = JSON.parse(cacheRaw);
      const values = Object.values(cacheEntries);
      if (values.length > 0) {
        const entry: any = values[0];
        return {
          id: ventureId,
          title: entry.title || 'Venture',
          problem: entry.rawIdeaText || entry.title,
          researchReport: entry.researchReport,
          businessReport: entry.businessReport,
          redTeamReport: entry.redTeamReport,
          judgeReport: entry.judgeReport,
          score: entry.score,
          nextActions: entry.nextActions
        };
      }
    }
  } catch (e) {
    console.warn('[pdfDownloader] notice reading local venture:', e);
  }
  return { id: ventureId, title: 'Venture' };
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
  const targetVenture = ventureData || findLocalVenture(ventureId) || { id: ventureId };

  try {
    // Attempt POST with full venture payload first so server generates the full rich layout
    let response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venture: targetVenture, download: isDownload })
    }).catch(() => null);

    // If POST not successful, try standard GET
    if (!response || !response.ok) {
      response = await fetch(url).catch(() => null);
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
    console.warn('[pdfDownloader] Server PDF endpoint unavailable, using high-fidelity client generator:', err);
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

