/**
 * PDF Client Utilities
 * 
 * Provides robust in-memory Blob-based viewing and downloading
 * that completely bypasses cross-origin, iframe restrictions, and third-party security cookie barriers
 * across desktop Safari, iOS Safari, Chrome, Firefox, and Edge.
 */

export interface FetchPdfBlobResult {
  blobUrl: string;
  fileName: string;
  blob: Blob;
}

/**
 * Fetches PDF binary data as a Blob and generates a memory-safe object URL.
 */
export async function fetchPdfBlob(
  ventureId: string,
  reportType: 'research' | 'business' | 'red_team' | 'judge' | 'decision',
  isDownload: boolean = false
): Promise<FetchPdfBlobResult> {
  const queryParam = isDownload ? '?download=true' : '';
  const url = `/api/ventures/${ventureId}/pdf/${reportType}${queryParam}`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch PDF report (${response.status} ${response.statusText})`);
  }

  // Extract filename from Content-Disposition header if available
  const contentDisposition = response.headers.get('Content-Disposition') || '';
  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  const formattedType = reportType.replace('_', '-');
  const fileName = filenameMatch ? filenameMatch[1] : `${ventureId}_${formattedType}_report.pdf`;

  const blob = await response.blob();
  // Force mime-type application/pdf for consistent browser handling
  const pdfBlob = new Blob([blob], { type: 'application/pdf' });
  const blobUrl = window.URL.createObjectURL(pdfBlob);

  return {
    blobUrl,
    fileName,
    blob: pdfBlob
  };
}

/**
 * Downloads a PDF report directly from memory without triggering page navigation or cookie interstitials.
 */
export async function downloadPdfReport(
  ventureId: string,
  reportType: 'research' | 'business' | 'red_team' | 'judge' | 'decision',
  customFileName?: string
): Promise<string> {
  const { blobUrl, fileName } = await fetchPdfBlob(ventureId, reportType, true);
  const finalName = customFileName || fileName;

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
  }, 10000);

  return finalName;
}

/**
 * Opens a PDF report in a new tab using a direct Blob URL.
 */
export async function openPdfInNewTab(
  ventureId: string,
  reportType: 'research' | 'business' | 'red_team' | 'judge' | 'decision'
): Promise<void> {
  const { blobUrl } = await fetchPdfBlob(ventureId, reportType, false);
  window.open(blobUrl, '_blank', 'noopener,noreferrer');
}
