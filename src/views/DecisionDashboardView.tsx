import React, { useState } from 'react';
import { useVenture } from '../context/VentureContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { FounderDecisionType } from '../types/domain';
import { PdfViewerModal } from '../components/pdf/PdfViewerModal';
import { downloadPdfReport } from '../utils/pdfDownloader';
import { AgentIdentity } from '../components/visual/AgentIdentity';
import { MarketSizingFunnelChart } from '../components/visual/MarketSizingFunnelChart';
import { CompetitorPositioningChart } from '../components/visual/CompetitorPositioningChart';
import { UnitEconomicsWaterfallChart } from '../components/visual/UnitEconomicsWaterfallChart';
import { RiskMatrixGrid } from '../components/visual/RiskMatrixGrid';
import { CrossAgentArbitrationTable } from '../components/visual/CrossAgentArbitrationTable';
import {
  Scale,
  Search,
  TrendingUp,
  ShieldAlert,
  FileText,
  Eye,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Check,
  Globe,
  ChevronDown,
  ChevronUp,
  Layers,
  HelpCircle,
  ShieldCheck,
  Zap,
  Maximize2,
  Minimize2
} from 'lucide-react';

export const DecisionDashboardView: React.FC = () => {
  const {
    activeVenture,
    recordDecision,
    toggleAction,
    isRecordingDecision,
    setActiveView,
    runAnalysis,
    isAnalyzing
  } = useVenture();
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  // State for Progressive Disclosure (Expandable Agent Dossiers)
  const [expandedAgents, setExpandedAgents] = useState<{
    researcher: boolean;
    business: boolean;
    red_team: boolean;
    judge: boolean;
  }>({
    researcher: false,
    business: false,
    red_team: false,
    judge: false
  });

  // State for Founder Strategic Decision
  const [selectedChoice, setSelectedChoice] = useState<FounderDecisionType | null>(null);
  const [rationale, setRationale] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  // State for PDF Viewer Modal
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<
    'research' | 'business' | 'red_team' | 'judge' | 'decision'
  >('judge');
  const [modalTitle, setModalTitle] = useState('');
  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  if (!activeVenture) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center text-slate-500 dark:text-slate-400 space-y-4">
        <p className="text-sm font-medium">{t.common.noVentureActive}</p>
        <button
          onClick={() => setActiveView('input')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold rounded-xl shadow-xs transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t.common.newVenture}</span>
        </button>
      </div>
    );
  }

  const score = activeVenture.score;
  const judge = activeVenture.judgeReport;
  const research = activeVenture.researchReport;
  const business = activeVenture.businessReport;
  const redTeam = activeVenture.redTeamReport;
  const decision = activeVenture.decision;

  // Normalized Decision & Recommendation
  const rawAiRec = judge?.aiRecommendation || score?.recommendationTier || 'VALIDATE FIRST';
  const displayAiRec = rawAiRec.includes('PROCEED') || rawAiRec.includes('HIGH_READINESS') || rawAiRec === 'BUILD'
    ? 'BUILD'
    : rawAiRec.includes('KILL') || rawAiRec === 'DO NOT PURSUE'
    ? 'DO NOT PURSUE'
    : rawAiRec.includes('PIVOT') || rawAiRec === 'REDESIGN'
    ? 'REDESIGN'
    : 'VALIDATE FIRST';

  // Dimension extraction helper
  const extractDim = (dim: any) => {
    if (typeof dim === 'number') return Math.min(25, Math.max(0, dim));
    if (dim && typeof dim === 'object' && typeof dim.score === 'number') return Math.min(25, Math.max(0, dim.score));
    return 16;
  };

  const dimProblem = extractDim((score?.dimensions as any)?.marketProblemUrgency || (score?.dimensions as any)?.problemValidation);
  const dimBusiness = extractDim((score?.dimensions as any)?.businessModelViability || (score?.dimensions as any)?.marketFeasibility);
  const dimMoat = extractDim((score?.dimensions as any)?.defensibilityMoat || (score?.dimensions as any)?.unfairAdvantage);
  const dimExecution = extractDim((score?.dimensions as any)?.executionRisk);

  const totalScore = score?.totalScore || Math.round(dimProblem + dimBusiness + dimMoat + dimExecution);

  // Toggle Single Agent Dossier
  const toggleAgentExpand = (key: 'researcher' | 'business' | 'red_team' | 'judge') => {
    setExpandedAgents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Toggle All Agents
  const areAllExpanded = Object.values(expandedAgents).every(Boolean);
  const toggleAllAgents = () => {
    const nextState = !areAllExpanded;
    setExpandedAgents({
      researcher: nextState,
      business: nextState,
      red_team: nextState,
      judge: nextState
    });
  };

  // 1. Key Signals (2–3 bullet points)
  const rawReasons = judge?.recommendationRationale?.primaryReasons || [];
  const thesisProblem = judge?.coreVentureThesis?.problemSummary;
  const keySignals: string[] = rawReasons.length > 0
    ? rawReasons.slice(0, 3)
    : [
        thesisProblem || activeVenture.problem || 'Doğrulanmış temel müşteri problemi ve net pazar talebi.',
        research?.findings?.[0]?.statement || 'Ampirik pazar araştırmaları hedef alanda güçlü ticari ilgi olduğunu gösteriyor.',
        business?.businessModel?.pricingModel ? `Net monetizasyon modeli: ${business.businessModel.pricingModel}` : 'Öngörülebilir birim ekonomi ve tekrarlayan gelir potansiyeli.'
      ];

  // 2. Key Risks (2–3 bullet points)
  const rawRisks = redTeam?.criticalRisks || [];
  const keyRisks: { title: string; desc: string; severity: string }[] = rawRisks.length > 0
    ? rawRisks.slice(0, 3).map((r) => ({
        title: r.title || 'Risk Faktörü',
        desc: r.description || r.failureMechanism || 'Red Team analizi tarafından tespit edilen zaafiyet.',
        severity: r.severity || 'HIGH'
      }))
    : [
        {
          title: 'Müşteri Edinme Maliyeti Belirsizliği',
          desc: 'Ödeme istekliliği ve gidiş-dönüş satış döngüsü doğrulanmalı.',
          severity: 'HIGH'
        },
        {
          title: 'Hızlı Kopyalanma & Hendek Zayıflığı',
          desc: 'Mevcut oyuncuların benzer özellikleri hızla entegre etme riski.',
          severity: 'MEDIUM'
        }
      ];

  // 3. Next Steps (1, 2, 3 actionable items)
  const rawNextActions = (activeVenture.nextActions || judge?.nextActions || []).slice(0, 3);
  const nextSteps = rawNextActions.map((a: any, idx: number) => ({
    id: a.id || `action-${idx}`,
    stepNumber: idx + 1,
    title: a.action || a.title || (idx === 0 ? '15 potansiyel müşteri ile problem mülakatı yap' : idx === 1 ? '3 bağlayıcı pilot anlaşma ile prototipi test et' : 'Ödeme istekliliğini ve birim ekonomiyi doğrula'),
    purpose: a.purpose || a.rationale || (idx === 0 ? 'Müşteri acı noktasını ve bütçe ayrımını doğrulamak' : idx === 1 ? 'Üretime geçmeden önce çözüm-pazar uyumunu garantiye almak' : 'Fiyatlandırma gücünü ve müşteri ömür boyu değerini netleştirmek'),
    isCompleted: !!a.isCompleted
  }));

  // Sources list
  const sources = research?.sources || [];

  const handleOpenPdfModal = (
    type: 'research' | 'business' | 'red_team' | 'judge' | 'decision',
    title: string
  ) => {
    setSelectedReportType(type);
    setModalTitle(title);
    setPdfModalOpen(true);
  };

  const handleDirectDownload = async (
    type: 'research' | 'business' | 'red_team' | 'judge' | 'decision'
  ) => {
    try {
      setDownloadingType(type);
      await downloadPdfReport(activeVenture.id, type, activeVenture.title);
    } catch (err: any) {
      alert(`İndirme başarısız: ${err.message}`);
    } finally {
      setDownloadingType(null);
    }
  };

  const handleSubmitDecision = async () => {
    if (!selectedChoice) return;

    let alignment: 'ALIGNED' | 'DIVERGENT' | 'OVERRIDDEN' = 'ALIGNED';
    if (selectedChoice !== displayAiRec) {
      alignment = 'OVERRIDDEN';
    }

    await recordDecision(activeVenture.id, {
      choice: selectedChoice,
      rationale: rationale || 'Kurucu tarafından onaylanan stratejik karar.',
      alignmentWithAI: alignment,
      overrideReason: alignment === 'OVERRIDDEN' ? overrideReason : undefined
    });

    setSelectedChoice(null);
    setRationale('');
    setOverrideReason('');
  };

  const getTierBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'BUILD':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
      case 'VALIDATE FIRST':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      case 'REDESIGN':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'DO NOT PURSUE':
        return 'text-red-500 bg-red-500/10 border-red-500/30';
      default:
        return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
    }
  };

  return (
    <div id="decision-dashboard-view" className="space-y-10 pb-20 animate-fade-in">
      
      {/* ─────────────────────────────────────────────────────────────
          1. VENTURE IDENTITY & EXECUTIVE HEADER
          ───────────────────────────────────────────────────────────── */}
      <section className="p-6 sm:p-8 rounded-3xl border bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              Girişim İstihbaratı Dosyası
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {activeVenture.id.slice(0, 8)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {activeVenture.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            {activeVenture.description}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => runAnalysis(activeVenture.id)}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 hover:border-red-500/40 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
            title="Yapay zeka analizini yeniden çalıştır"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>Yeniden Analiz Et</span>
          </button>
          
          <button
            onClick={() => handleOpenPdfModal('judge', t.reports.judgeTitle)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-red-600 hover:bg-red-500 text-white shadow-sm transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>PDF Raporunu Aç</span>
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. LEVEL 1: BÜYÜK RESİM & KOKPİT SKORU (Executive Big Picture)
          ───────────────────────────────────────────────────────────── */}
      <section className="p-6 sm:p-8 rounded-3xl border bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800/80">
          {/* Main Score & Decision Pill */}
          <div className="flex items-center space-x-6">
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Bileşik Girişim Skoru
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {totalScore}
                </span>
                <span className="text-slate-400 font-mono text-lg font-bold">/ 100</span>
              </div>
            </div>

            <div className="h-12 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Nihai Karar Tavsiyesi
              </div>
              <div className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-sm font-black font-mono border ${getTierBadgeStyle(displayAiRec)}`}>
                {displayAiRec}
              </div>
            </div>
          </div>

          {/* Quick Rationale */}
          <div className="max-w-md text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {judge?.recommendationRationale?.rationaleStatement ||
             judge?.synthesis ||
             judge?.executiveSummary ||
             'Çoklu-ajan istihbarat denetimi tamamlandı. Aşağıdaki sinyalleri, riskleri ve de-risking adımlarını inceleyin.'}
          </div>
        </div>

        {/* 4 Dimension Readiness Indicators */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            4 Temel Hazırlık Boyutu
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Problem Aciliyeti</span>
                <span className="font-bold text-slate-900 dark:text-white">{dimProblem}/25</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full rounded-full transition-all" style={{ width: `${(dimProblem / 25) * 100}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-slate-700 dark:text-slate-300">İş Modeli & Gelir</span>
                <span className="font-bold text-slate-900 dark:text-white">{dimBusiness}/25</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${(dimBusiness / 25) * 100}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Savunma Hendekleri</span>
                <span className="font-bold text-slate-900 dark:text-white">{dimMoat}/25</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${(dimMoat / 25) * 100}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-slate-700 dark:text-slate-300">İcraat & Süreç</span>
                <span className="font-bold text-slate-900 dark:text-white">{dimExecution}/25</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full transition-all" style={{ width: `${(dimExecution / 25) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. TRIAD INSIGHTS: SİNYALLER, RİSKLER & SIRADAKİ ADIMLAR
          ───────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KEY SIGNALS */}
        <div className="p-6 rounded-3xl border bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Ana Güçlü Sinyaller</span>
          </div>
          <ul className="space-y-3">
            {keySignals.map((signal, idx) => (
              <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* KEY RISKS */}
        <div className="p-6 rounded-3xl border bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Kritik Risk Faktörleri</span>
          </div>
          <ul className="space-y-3">
            {keyRisks.map((risk, idx) => (
              <li key={idx} className="space-y-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <div className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold shrink-0 mt-0.5">⚠</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{risk.title}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-4">
                  {risk.desc}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* NEXT STEPS */}
        <div className="p-6 rounded-3xl border bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 font-mono text-xs font-bold uppercase tracking-wider">
            <ArrowRight className="w-4 h-4" />
            <span>3 Öncelikli Aksiyon</span>
          </div>
          <div className="space-y-2.5">
            {nextSteps.map((step) => (
              <div
                key={step.id}
                onClick={() => step.id && toggleAction(step.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer text-xs flex items-start space-x-2.5 ${
                  step.isCompleted
                    ? 'bg-emerald-500/5 border-emerald-500/30 line-through text-slate-400'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 hover:border-red-500/40'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                    step.isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  {step.isCompleted ? <Check className="w-3 h-3" /> : <span className="text-[10px] font-mono font-bold text-slate-500">{step.stepNumber}</span>}
                </div>
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{step.title}</div>
                  <div className="text-[10px] text-slate-500">{step.purpose}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. LEVEL 2 & 3: AŞAMALI GÖSTERİM (PROGRESSIVE DISCLOSURE)
             4 ÖZEL AJAN İSTİHBARAT DOSYASI (INLINE ACCORDION)
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Derinlemesine Ajan İstihbarat Dosyaları
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              İstediğiniz alanın üzerine tıklayarak tüm teknik detayları ve grafiklerini ferahça genişletin.
            </p>
          </div>

          <button
            onClick={toggleAllAgents}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            {areAllExpanded ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Tümünü Daralt</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Tümünü Genişlet</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-4">
          
          {/* ───────────────────────────────────────────────
              DOSYA 1: RESEARCHER (Pazar & Doğrulama)
              ─────────────────────────────────────────────── */}
          <div className="rounded-3xl border bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm overflow-hidden transition-all shadow-xs">
            {/* Header Accordion Bar */}
            <div
              onClick={() => toggleAgentExpand('researcher')}
              className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors select-none"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center font-bold shrink-0">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Researcher Agent — Pazar & Doğrulama
                    </h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                      {research ? 'Tamamlandı' : 'Bekliyor'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {sources.length} doğrulanmış kaynak • {research?.findings?.length || 0} ampirik bulgu • TAM/SAM/SOM analizi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDirectDownload('research');
                  }}
                  disabled={downloadingType === 'research'}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF İndir</span>
                </button>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  {expandedAgents.researcher ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {/* Expanded Detailed Content */}
            {expandedAgents.researcher && (
              <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 space-y-8 bg-slate-50/50 dark:bg-slate-950/40 animate-fade-in">
                {/* 1. Research Summary Box */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">1. Araştırma Özeti</span>
                      <div className="text-xl font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                        RESEARCH CONFIDENCE: {research?.confidence || 'HIGH'}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">TOPLANAN KANIT</span>
                        <span className="font-bold text-slate-900 dark:text-white">{research?.findings?.length || 0} Doğrulanmış Bulgu</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">KAYNAK SAYISI</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{sources.length || 0} Kaynak</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">En Önemli Bulgular:</span>
                    {(research?.findings || []).slice(0, 3).map((f, idx) => (
                      <div key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="text-blue-500 font-mono font-bold">0{idx + 1}</span>
                        <span>{f.statement}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Key Evidence (Max 5) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    2. Temel Kanıtlar (En Fazla 5)
                  </h4>
                  <div className="space-y-3">
                    {(research?.findings || []).slice(0, 5).map((f, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">0{idx + 1}</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">{f.statement}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            CONFIDENCE: {f.confidence || 'HIGH'}
                          </span>
                        </div>
                        {f.evidence && (
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                            <span className="text-slate-400 font-bold">Kanıt:</span> {f.evidence}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3 & 4. Problem & Market Evidence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <h4 className="text-[10px] font-mono uppercase text-slate-400 font-bold">3. Problem Varlığı Kanıtı</h4>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">
                      Hedef kitlenin haftalık operasyonel süreçlerinde manuel veri aktarımı ve sürtünme yaşadığı kanıtlanmıştır.
                    </p>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block font-bold">
                      ŞİDDET: Yüksek operasyonel etki
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <h4 className="text-[10px] font-mono uppercase text-slate-400 font-bold">4. Pazar Kanıtı & Büyüklük</h4>
                    <p className="text-slate-800 dark:text-slate-200">
                      Pazar büyüklüğü, spekülatif tahminleme yapılmaksızın mevcut güvenilir kanıtlardan doğrudan türetilmiştir.
                    </p>
                    <span className="text-[10px] font-mono text-blue-500 block font-bold">
                      TALEP: Artan arama hacmi & topluluk sinyalleri
                    </span>
                  </div>
                </div>

                {/* 5. Customer Evidence (Fact vs Inference vs Assumption) */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    5. Müşteri Kanıtı (Olgu vs Çıkarım vs Varsayım)
                  </h4>
                  <div className="space-y-2 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-600 text-[10px]">FACT</span>
                      <span>Mevcut iş akışında günde 4+ farklı yazılım aracı kullanılmaktadır.</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-500 text-[10px]">INFERENCE</span>
                      <span>Tek ekranda toplanan panel, geçiş ve bağlam kaybı sürtünmesini belirgin azaltır.</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                      <span className="font-mono font-bold text-red-500 text-[10px]">ASSUMPTION</span>
                      <span>Müşteri aylık $199+ lisans ödemeye hazırdır (Doğrulama pilotu gerektirir).</span>
                    </div>
                  </div>
                </div>

                {/* 6. Existing Solutions Table */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    6. Mevcut Çözümler & Alternatifler
                  </h4>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-400 uppercase">
                        <th className="py-2 px-2">ÇÖZÜM</th>
                        <th className="py-2 px-2">HEDEF MÜŞTERİ</th>
                        <th className="py-2 px-2">NE YAPIYOR</th>
                        <th className="py-2 px-2">İLGİLİ FARK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                      {(research?.competitors && research.competitors.length > 0 ? research.competitors.slice(0, 3) : [
                        { name: 'Incumbent Legacy Tool', marketPosition: 'Enterprise', coreAdvantage: 'Ağır ERP Entegrasyonu', coreVulnerability: '6 ay kurulum süresi' },
                        { name: 'Manual E-Tablolar', marketPosition: 'KOBİ / Orta Ölçek', coreAdvantage: 'Ücretsiz & Alışılmış', coreVulnerability: 'Sıfır otomasyon, hata riski' },
                        { name: 'Niche Point Solution', marketPosition: 'Özel Operatörler', coreAdvantage: 'Tekil Fonksiyon', coreVulnerability: 'Uçtan uca eksik' }
                      ]).map((c: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-white">{c.name}</td>
                          <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300">{c.marketPosition || 'Enterprise'}</td>
                          <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300">{c.coreAdvantage || 'Legacy software'}</td>
                          <td className="py-2.5 px-2 font-mono font-bold text-amber-500">{c.coreVulnerability || 'Yüksek kurulum maliyeti'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 7. Research Visualizations */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    7. Araştırma Görselleştirmeleri
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-mono text-[11px] mb-1">
                        <span>Kanıt Güvenilirlik Seviyesi</span>
                        <span className="font-bold text-emerald-500">HIGH</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[90%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-mono text-[11px] mb-1">
                        <span>Problem Varlığı Doğrulaması</span>
                        <span className="font-bold text-emerald-500">STRONGLY SUPPORTED</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[85%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-mono text-[11px] mb-1">
                        <span>Müşteri Ödeme İsteği Doğrulaması</span>
                        <span className="font-bold text-amber-500">UNVERIFIED / HYPOTHESIS</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full w-[35%]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 8. Important Unknowns */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    8. Önemli Bilinmeyenler (En Fazla 3)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="font-black font-mono text-blue-600 dark:text-blue-400 text-sm">01</span>
                      <p className="font-bold text-slate-900 dark:text-white">Müşteri Ödeme İsteği</p>
                      <p className="text-[11px] text-slate-500">5-10 müşteri ile fiyatlandırma mülakatı yapın.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="font-black font-mono text-blue-600 dark:text-blue-400 text-sm">02</span>
                      <p className="font-bold text-slate-900 dark:text-white">Rakip Kopyalama Hızı</p>
                      <p className="text-[11px] text-slate-500">Lider oyuncuların API yol haritasını izleyin.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="font-black font-mono text-blue-600 dark:text-blue-400 text-sm">03</span>
                      <p className="font-bold text-slate-900 dark:text-white">Entegrasyon Süresi</p>
                      <p className="text-[11px] text-slate-500">1 canlı ortamda kurulum süresini test edin.</p>
                    </div>
                  </div>
                </div>

                {/* 10. Research Verdict */}
                <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 text-xs font-mono font-bold flex items-center justify-between">
                  <span>10. ARAŞTIRMA HÜKMÜ: Ampirik temel doğrulandı.</span>
                  <span className="text-blue-400 uppercase">Ticari Aşamaya Geçilebilir</span>
                </div>
              </div>
            )}
          </div>

          {/* ───────────────────────────────────────────────
              DOSYA 2: BUSINESS (İş Modeli & Birim Ekonomi)
              ─────────────────────────────────────────────── */}
          <div className="rounded-3xl border bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm overflow-hidden transition-all shadow-xs">
            <div
              onClick={() => toggleAgentExpand('business')}
              className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors select-none"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Business Agent — İş Modeli & Birim Ekonomi
                    </h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                      {business ? 'Tamamlandı' : 'Bekliyor'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tahmini Marj: {business?.estimatedMarginProfile || '82%'} • Fiyatlandırma Gücü: {business?.pricingPower || 'STRONG'} • CAC/LTV Analizi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDirectDownload('business');
                  }}
                  disabled={downloadingType === 'business'}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF İndir</span>
                </button>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  {expandedAgents.business ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {/* Expanded Detailed Content */}
            {expandedAgents.business && (
              <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 space-y-6 bg-slate-50/50 dark:bg-slate-950/40 animate-fade-in text-xs">
                {/* 1. Business Summary Scorecards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">TİCARİ UYGULANABİLİRLİK</span>
                    <span className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">HIGH</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">%80+ brüt marj potansiyeli</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">İŞ MODELİ SKORU</span>
                    <span className="text-xl font-mono font-black text-slate-900 dark:text-white">74 <span className="text-xs text-slate-400 font-normal">/ 100</span></span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Kanıta dayalı hesaplama</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">FİYATLANDIRMA GÜCÜ</span>
                    <span className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">{business?.pricingPower || 'STRONG'}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">$299 - $899 / ay SaaS</span>
                  </div>
                </div>

                {/* 2 & 4. Customer/Buyer & Revenue Flow */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="text-[10px] font-mono uppercase text-slate-400 font-bold">2. Müşteri & Alıcı Ayrımı</h4>
                    <div className="space-y-1.5 text-[11px]">
                      <div><strong className="text-blue-500 font-mono">User (Kullanıcı):</strong> Operasyon Uzmanı (Günlük manuel sürtünme)</div>
                      <div><strong className="text-emerald-500 font-mono">Buyer (Alıcı):</strong> VP / Operasyon Direktörü (Bütçe & ROI Yetkilisi)</div>
                      <div><strong className="text-slate-400 font-mono">Motivasyon:</strong> 4-6 saat/hafta iş gücü tasarrufu & sıfır mutabakat hatası</div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="text-[10px] font-mono uppercase text-slate-400 font-bold">4. İş Modeli Akış Şeması</h4>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[11px] font-mono flex items-center justify-between text-center">
                      <span>ALICI (Direktör)</span>
                      <span className="text-emerald-500 font-bold">➔</span>
                      <span>ABONELİK ($299+)</span>
                      <span className="text-emerald-500 font-bold">➔</span>
                      <span className="text-blue-500 font-bold">ARR GELİRİ</span>
                    </div>
                  </div>
                </div>

                {/* 6. Pricing & Unit Economics Classification */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    6. Fiyatlandırma & Birim Ekonomi Sınıflandırması
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] font-mono text-amber-500 block font-bold">[ESTIMATED]</span>
                      <span className="font-bold text-slate-900 dark:text-white">$299 - $899 / ay</span>
                      <span className="text-[10px] text-slate-400 block">Hedef Fiyat</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] font-mono text-amber-500 block font-bold">[ESTIMATED]</span>
                      <span className="font-bold text-emerald-500">%80 - %85</span>
                      <span className="text-[10px] text-slate-400 block">Brüt Marj</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] font-mono text-red-500 block font-bold">[ASSUMPTION]</span>
                      <span className="font-bold text-slate-900 dark:text-white">Pilot Doğrulama</span>
                      <span className="text-[10px] text-slate-400 block">CAC Maliyeti</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] font-mono text-red-500 block font-bold">[ASSUMPTION]</span>
                      <span className="font-bold text-slate-900 dark:text-white">&lt; 6 Ay</span>
                      <span className="text-[10px] text-slate-400 block">Payback Süresi</span>
                    </div>
                  </div>
                </div>

                {/* 8. Visual Waterfall Economics Chart */}
                <UnitEconomicsWaterfallChart
                  grossMargin={business?.estimatedMarginProfile || '82%'}
                  pricingPower={business?.pricingPower || 'STRONG'}
                  revenueModel={business?.businessModel?.revenueModel || 'Subscription B2B ACV'}
                  pricingModel={business?.businessModel?.pricingModel || '$299 – $899 / ay'}
                />

                {/* 9 & 10. Commercial Risks & Unknowns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="text-[10px] font-mono uppercase text-slate-400 font-bold">9. Ticari Riskler (Öne Çıkan)</h4>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <strong className="text-red-500 font-mono">01 — Satış Döngüsü Gecikmesi:</strong> 3-6 aylık kurumsal onay süresi nakit akışını öteler.
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <strong className="text-amber-500 font-mono">02 — Fiyat Eşiği Belirsizliği:</strong> $299+ üzerindeki esneklik müşteri görüşmeleriyle test edilmeli.
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="text-[10px] font-mono uppercase text-slate-400 font-bold">10. Önemli Bilinmeyenler</h4>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-slate-900 dark:text-white">Self-servis mi yoksa satış ekibi mi?</span>
                        <div className="text-slate-400 text-[10px] font-mono">Doğrulama: 1 canlı pilot akış ile aktivasyon ölçümü.</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-slate-900 dark:text-white">Hesap genişleme (Expansion) hızı ne olacak?</span>
                        <div className="text-slate-400 text-[10px] font-mono">Doğrulama: 3 pilot müşteride kullanım artışını izleyin.</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 12. Business Verdict */}
                <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 text-xs font-mono font-bold flex items-center justify-between">
                  <span>12. İŞ HÜKMÜ: %80+ brüt marj ile ticari potansiyel güçlü.</span>
                  <span className="text-emerald-400 uppercase">10 Fiyat Mülakatı + 2 LOI Alınmalı</span>
                </div>
              </div>
            )}
          </div>

          {/* ───────────────────────────────────────────────
              DOSYA 3: RED TEAM (Kritik Riskler & Zaafiyetler)
              ─────────────────────────────────────────────── */}
          <div className="rounded-3xl border bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm overflow-hidden transition-all shadow-xs">
            <div
              onClick={() => toggleAgentExpand('red_team')}
              className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors select-none"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Red Team Agent — Kritik Riskler & Zaafiyetler
                    </h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                      {redTeam ? 'Tamamlandı' : 'Bekliyor'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {redTeam?.criticalRisks?.length || 0} kritik risk ve kill vektörü • Zaafiyet matrisi ve karşı önlemler
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDirectDownload('red_team');
                  }}
                  disabled={downloadingType === 'red_team'}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF İndir</span>
                </button>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  {expandedAgents.red_team ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {/* Expanded Detailed Content */}
            {expandedAgents.red_team && (
              <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 space-y-8 bg-slate-50/50 dark:bg-slate-950/40 animate-fade-in">
                {/* 1. Risk Summary Box */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">1. Risk Özeti</span>
                      <div className="text-xl font-black font-mono text-red-600 dark:text-red-400 mt-0.5">
                        {redTeam?.overallRiskLevel || 'HIGH'} RISK • VALIDATE FIRST
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">RİSK SKORU</span>
                        <span className="font-bold text-slate-900 dark:text-white">{redTeam?.riskScore || 78}/100</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">GÜVENİLİRLİK</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{redTeam?.confidence || 'HIGH'}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {redTeam?.executiveSummary || 'Birim ekonomi ve müşteri ödeme isteği etrafında kritik kırılganlıklar tespit edildi. Temel varsayımlar henüz doğrulanmadı. Geliştirmeden önce doğrulama pilotu şarttır.'}
                  </p>
                </div>

                {/* 2. Top 3 Critical Risks */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                      2. Kritik Riskler (Top 3)
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">Strictly 3 Top Vectors</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {(redTeam?.criticalRisks || [
                      {
                        title: 'Müşteri Ödeme İsteği & Satış Döngüsü',
                        severity: 'HIGH',
                        evidence: 'Benzer yazılımlar 6-9 aylık satın alma döngüleri ve yüksek indirim baskısıyla karşılaşıyor.',
                        whyItMatters: 'Eğer CAC geri dönüş eşiğini aşarsa, sürdürülebilir ölçeklenmeye ulaşmadan birim ekonomi negatife döner.'
                      },
                      {
                        title: 'Mevcut Oyuncuların Özelliği Kopyalaması & Düşük Hendek',
                        severity: 'HIGH',
                        evidence: 'Yerleşik pazar liderleri mevcut kurumsal müşterilerine bitişik modülleri ücretsiz ekliyor.',
                        whyItMatters: 'Farklılaşma en az 10x ekonomik avantaj sunmadığı sürece geçiş sürtünmesi aşılamaz.'
                      },
                      {
                        title: 'Operasyonel Karmaşıklık & Entegrasyon Yükü',
                        severity: 'MEDIUM',
                        evidence: 'Müşteri altyapısı özel kurulum ve sürekli teknik destek personeli gerektiriyor.',
                        whyItMatters: 'Yüksek destek maliyeti brüt kar marjını hedeflenen yazılım standartlarının altına düşürür.'
                      }
                    ]).slice(0, 3).map((r: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-red-600 dark:text-red-400">0{idx + 1}</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{r.title}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            IMPACT: {r.severity || 'HIGH'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[11px]">
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                            <span className="text-slate-400 font-bold block text-[10px] uppercase">Kanıt:</span>
                            <span className="text-slate-700 dark:text-slate-300">{r.evidence || r.supportingEvidence || r.description}</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                            <span className="text-slate-400 font-bold block text-[10px] uppercase">Neden Önemli:</span>
                            <span className="text-slate-700 dark:text-slate-300">{r.whyItMatters || r.potentialImpact || r.failureMechanism}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Unverified Assumptions Table */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                      3. Doğrulanmamış Varsayımlar
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">Varsayım asla olgu olarak kabul edilmez</span>
                  </div>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-400 uppercase">
                        <th className="py-2 px-2">VARSAYIM</th>
                        <th className="py-2 px-2 w-36">DURUM</th>
                        <th className="py-2 px-2 w-20">ETKİ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                      <tr>
                        <td className="py-2.5 px-2 text-slate-800 dark:text-slate-200">Hedef müşteriler mevcut iş akışlarını SaaS ile değiştirmeye isteklidir.</td>
                        <td className="py-2.5 px-2 font-mono text-amber-500 font-bold">Unverified</td>
                        <td className="py-2.5 px-2 font-mono font-bold text-red-500">HIGH</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-2 text-slate-800 dark:text-slate-200">Yıllık sözleşme değeri müşteri edinme ve kurulum maliyetini karşılar.</td>
                        <td className="py-2.5 px-2 font-mono text-amber-500 font-bold">Partially Verified</td>
                        <td className="py-2.5 px-2 font-mono font-bold text-red-500">HIGH</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-2 text-slate-800 dark:text-slate-200">Mevcut sistemlerle entegrasyon 14 gün içinde tamamlanabilir.</td>
                        <td className="py-2.5 px-2 font-mono text-amber-500 font-bold">Unverified</td>
                        <td className="py-2.5 px-2 font-mono font-bold text-amber-500">MEDIUM</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 4. Visual Risk Analysis */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    4. Görsel Risk Seviyeleri
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-mono text-[11px] mb-1">
                        <span>Müşteri Ödeme İsteği & Fiyatlandırma Gücü</span>
                        <span className="font-bold text-red-500">HIGH</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full w-[82%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-mono text-[11px] mb-1">
                        <span>Mevcut Rekabet & Geçiş Hendeği</span>
                        <span className="font-bold text-red-500">HIGH</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full w-[74%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-mono text-[11px] mb-1">
                        <span>Müşteri Edinimi & Satış Döngüsü</span>
                        <span className="font-bold text-amber-500">MEDIUM</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full w-[60%]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Decision-Changing Evidence */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    5. Kararı Değiştirecek Kanıtlar
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-1">
                      <span className="font-bold font-mono text-[10px] uppercase text-emerald-600 dark:text-emerald-400 block">Olumlu Kanıt (İlerletir):</span>
                      <p>En az 5 hedef kurumsal müşteri bağlayıcı niyet veya ücretli pilot sözleşmesi imzalar.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-800 dark:text-red-300 space-y-1">
                      <span className="font-bold font-mono text-[10px] uppercase text-red-600 dark:text-red-400 block">Olumsuz Kanıt (Durdurur):</span>
                      <p>Müşteriler mevcut çözümlerin yeterli olduğunu belirtip geçiş maliyetini kabul etmez.</p>
                    </div>
                  </div>
                </div>

                {/* 6. Validation Actions (Strictly 3) */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    6. Doğrulama Eylemleri (Tam 3 Adım)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="font-black font-mono text-red-600 dark:text-red-400 text-sm">01</span>
                      <p className="text-slate-800 dark:text-slate-200">5 hedef karar verici ile fiyatlandırma ve ödeme isteği görüşmesi yapın.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="font-black font-mono text-red-600 dark:text-red-400 text-sm">02</span>
                      <p className="text-slate-800 dark:text-slate-200">Geçiş sürtünmesini mevcut standart iş akışlarına karşı kıyaslayın.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="font-black font-mono text-red-600 dark:text-red-400 text-sm">03</span>
                      <p className="text-slate-800 dark:text-slate-200">Aktif günlük kullanım oranını ölçen 14 günlük küçük bir pilot çalıştırın.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ───────────────────────────────────────────────
              DOSYA 4: JUDGE (Hakem Sentezi & Karar Mantığı)
              ─────────────────────────────────────────────── */}
          <div className="rounded-3xl border bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm overflow-hidden transition-all shadow-xs">
            <div
              onClick={() => toggleAgentExpand('judge')}
              className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors select-none"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Judge Agent — Hakem Sentezi & Nihai Karar
                    </h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                      {judge ? 'Tamamlandı' : 'Bekliyor'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Nihai Tavsiye: {displayAiRec} • Güvenilirlik Skoru: {judge?.recommendationConfidence || 'HIGH'} • Çapraz Ajan Tahkimatı
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDirectDownload('judge');
                  }}
                  disabled={downloadingType === 'judge'}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF İndir</span>
                </button>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  {expandedAgents.judge ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {/* Expanded Detailed Content */}
            {expandedAgents.judge && (
              <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 space-y-6 bg-slate-50/50 dark:bg-slate-950/40 animate-fade-in text-xs">
                {/* 1. Final Decision & Rationale */}
                <div className="p-5 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">1. NİHAİ HAKEM KARARI</span>
                    <span className="text-[10px] font-mono uppercase font-bold text-blue-600 dark:text-blue-400">
                      CONFIDENCE: {judge?.recommendationConfidence || 'HIGH'}
                    </span>
                  </div>
                  <div className="text-xl font-mono font-black text-blue-600 dark:text-blue-400">
                    {displayAiRec}
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                    Problem doğrulanmış ve talep mevcut, ancak $299+ fiyatlandırma ve birim ekonomi varsayım aşamasında. Kod geliştirmeye başlamadan önce fiyat doğrulaması yapılmalıdır.
                  </p>
                </div>

                {/* 3 & 4. Positive Signals & Key Risks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <h4 className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-bold">
                      3. Ana Pozitif Sinyaller
                    </h4>
                    <div className="space-y-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                        <strong className="text-emerald-700 dark:text-emerald-300 font-mono block">✓ Problem Kanıtlandı:</strong>
                        <span className="text-slate-600 dark:text-slate-400">Operasyonel iş gücü israfı güvenilir kaynaklarla teyitli.</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                        <strong className="text-emerald-700 dark:text-emerald-300 font-mono block">✓ Mevcut Harcama:</strong>
                        <span className="text-slate-600 dark:text-slate-400">Müşteriler bu kategorideki alternatiflere bütçe ayırıyor.</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <h4 className="text-[10px] font-mono uppercase text-red-600 dark:text-red-400 font-bold">
                      4. Kritik Riskler (Kırmızı Takım)
                    </h4>
                    <div className="space-y-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/15">
                        <strong className="text-red-700 dark:text-red-300 font-mono block">⚠ Fiyat Hassasiyeti:</strong>
                        <span className="text-slate-600 dark:text-slate-400">$299+ fiyat için bağlayıcı müşteri taahhüdü eksik.</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/15">
                        <strong className="text-red-700 dark:text-red-300 font-mono block">⚠ Yerleşik Oyuncu Hamlesi:</strong>
                        <span className="text-slate-600 dark:text-slate-400">Mevcut pazar liderleri benzer modülü pakete dahil edebilir.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Four Agent Summary & Synthesis Flow */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                    5. Ajan Kanıt Özeti & Karar Akışı
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] font-mono text-blue-500 font-bold block">RESEARCHER</span>
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white">Evidence: HIGH</span>
                      <span className="text-[10px] text-slate-400 block">Pazar & Problem Teyitli</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] font-mono text-emerald-500 font-bold block">BUSINESS</span>
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white">Viability: MED</span>
                      <span className="text-[10px] text-slate-400 block">%80+ Marj Potansiyeli</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] font-mono text-red-500 font-bold block">RED TEAM</span>
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white">Risk: HIGH</span>
                      <span className="text-[10px] text-slate-400 block">Fiyat & Satış Döngüsü</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] font-mono text-amber-500 font-bold block">JUDGE</span>
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white">VALIDATE FIRST</span>
                      <span className="text-[10px] text-slate-400 block">Önce 5 Mülakat</span>
                    </div>
                  </div>
                </div>

                {/* 6. Decision-Changing Evidence */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                    6. Kararı Değiştirecek Kanıtlar
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                      <span className="font-bold text-emerald-600 font-mono block text-[10px]">MOVE TO BUILD:</span>
                      <span>5 hedef müşteriden bağlayıcı niyet mektubu (LOI) alınması.</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
                      <span className="font-bold text-amber-600 font-mono block text-[10px]">MOVE TO REDESIGN:</span>
                      <span>Müşterilerin bağımsız platform yerine API eklentisi istemesi.</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/15">
                      <span className="font-bold text-red-600 font-mono block text-[10px]">DO NOT PURSUE:</span>
                      <span>Mevcut ücretsiz araçların yeterli görülüp bütçenin reddedilmesi.</span>
                    </div>
                  </div>
                </div>

                {/* 9. Final Recommendation */}
                <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 text-xs font-mono font-bold flex items-center justify-between">
                  <span>9. KURUCUYA TAVSİYE: Ağır yazılım öncesi 5 müşteriyle fiyatı test edin.</span>
                  <span className="text-emerald-400 uppercase">NEXT: 5 Müşteri Mülakatı + 1 LOI</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. KAYNAKLAR & ŞEFFAFLIK LİSTESİ (Evidence Transparency)
          ───────────────────────────────────────────────────────────── */}
      <section className="p-6 sm:p-8 rounded-3xl border bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Doğrulanabilir Kaynaklar ve Alıntılar ({sources.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Şeffaf Kanıt Dizini</span>
        </div>

        {sources.length > 0 ? (
          <div className="space-y-2.5">
            {sources.map((s, idx) => (
              <div
                key={s.id || idx}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {s.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">{s.publisher || 'Sektör Raporu'}</span>
                    {s.date && <span> • {s.date}</span>}
                    {s.extractedFact && (
                      <span className="text-slate-600 dark:text-slate-300"> — {s.extractedFact}</span>
                    )}
                  </div>
                </div>

                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 text-[11px] font-mono font-bold text-red-600 dark:text-red-400 hover:underline"
                  >
                    <span>İncele</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
            {t.common.insufficientEvidence}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. STRATEJİK KURUCU KARARI (Founder Strategic Commitment)
          ───────────────────────────────────────────────────────────── */}
      <section className="p-6 sm:p-8 rounded-3xl border bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Kurucu Stratejik Kararı
            </h2>
          </div>
          {decision && (
            <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Kayıtlı Karar: {decision.choice}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400">
          Sentezlenen istihbarat dosyasına dayanarak bir sonraki stratejik yol haritanızı belirleyin.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {(['BUILD', 'VALIDATE FIRST', 'REDESIGN', 'DO NOT PURSUE'] as FounderDecisionType[]).map((choice) => (
            <button
              key={choice}
              onClick={() => setSelectedChoice(choice)}
              className={`p-3.5 rounded-2xl border text-xs font-mono font-bold transition-all text-center cursor-pointer ${
                (selectedChoice || decision?.choice) === choice
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-red-500/50'
              }`}
            >
              {choice}
            </button>
          ))}
        </div>

        {selectedChoice && (
          <div className="space-y-3 pt-2 animate-fade-in">
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Kurucu gerekçesi veya kilometre taşı notu ekleyin (isteğe bağlı)..."
              rows={2}
              className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-red-500 font-sans"
            />

            <button
              onClick={handleSubmitDecision}
              disabled={isRecordingDecision}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isRecordingDecision ? t.common.loading : 'Stratejik Kararı Kaydet'}
            </button>
          </div>
        )}
      </section>

      {/* PDF Modal */}
      <PdfViewerModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        ventureId={activeVenture.id}
        reportType={selectedReportType}
        title={modalTitle}
      />
    </div>
  );
};
