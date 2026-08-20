import React, { useEffect, useState } from 'react';
import { X, Download, FileText, ExternalLink, Loader2, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { fetchPdfBlob } from '../../utils/pdfDownloader';
import { Venture } from '../../types/domain';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  ventureId: string;
  reportType: 'research' | 'business' | 'red_team' | 'judge' | 'decision';
  title: string;
  venture?: Partial<Venture> | null;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  ventureId,
  reportType,
  title,
  venture
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const loadPdf = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPdfBlob(ventureId, reportType, false, venture || undefined);
      setBlobUrl(result.blobUrl);
      setFileName(result.fileName);
    } catch (err: any) {
      setError(err.message || 'Failed to render PDF document.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      loadPdf();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      if (blobUrl) {
        window.URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
    };
  }, [isOpen, ventureId, reportType]);

  if (!isOpen) return null;

  const handleOpenInNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = () => {
    if (blobUrl) {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || `${ventureId}_${reportType}_report.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div
      id="pdf-viewer-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        id="pdf-viewer-modal-container"
        className="bg-slate-900 rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl h-[90vh] overflow-hidden border border-slate-800 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between bg-slate-950 shrink-0 gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">{title}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono truncate">
                  {fileName || `reports/${ventureId}/${reportType}.pdf`}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 inline-flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  Direct Stream
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {blobUrl && (
              <>
                <button
                  id="btn-modal-open-new-tab"
                  onClick={handleOpenInNewTab}
                  className="px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
                  title="Open PDF directly in a new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Tab</span>
                </button>
                <button
                  id="btn-modal-download-pdf"
                  onClick={handleDownload}
                  className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
                  title="Download PDF to your computer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </>
            )}
            <button
              id="btn-modal-close-pdf"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1 cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / PDF Viewer Area */}
        <div className="flex-1 bg-slate-950 relative flex flex-col items-center justify-center overflow-hidden">
          {loading && (
            <div id="pdf-viewer-loading" className="flex flex-col items-center justify-center p-8 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <div className="text-sm font-bold text-white">Streaming Verified Dossier...</div>
              <p className="text-xs text-slate-400 max-w-xs">
                Assembling analytical pages with cited evidence benchmarks.
              </p>
            </div>
          )}

          {error && (
            <div id="pdf-viewer-error" className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Unable to Stream PDF</h3>
                <p className="text-xs text-slate-400 mt-1">{error}</p>
              </div>
              <button
                id="btn-retry-pdf-load"
                onClick={loadPdf}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg flex items-center gap-2 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Loading</span>
              </button>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <div className="w-full h-full flex flex-col">
              {/* Responsive Notice for Mobile Safari / Restricted Viewers */}
              <div className="sm:hidden px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                <span>Mobile view mode</span>
                <button
                  onClick={handleOpenInNewTab}
                  className="font-bold underline text-emerald-400 ml-2"
                >
                  Open in New Tab
                </button>
              </div>

              {/* PDF Container with <object> and iframe fallback */}
              <object
                id="pdf-preview-object"
                data={`${blobUrl}#toolbar=1&navpanes=0`}
                type="application/pdf"
                className="w-full h-full flex-1 border-0"
              >
                <iframe
                  id="pdf-preview-frame"
                  src={`${blobUrl}#toolbar=1&navpanes=0`}
                  title={title}
                  className="w-full h-full border-0"
                >
                  {/* Safari / iOS fallback card if neither object nor iframe can render inline PDF */}
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="max-w-sm">
                      <h3 className="text-sm font-bold text-white">{title} Ready</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Your browser or mobile device blocks embedded PDF frames. You can view or download the report directly below:
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleOpenInNewTab}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 border border-slate-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open PDF</span>
                      </button>
                      <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-lg flex items-center gap-1.5 shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  </div>
                </iframe>
              </object>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
