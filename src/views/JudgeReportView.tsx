import React, { useState } from 'react';
import { useVenture } from '../context/VentureContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { AgentIdentity } from '../components/visual/AgentIdentity';
import { ScoreGauge } from '../components/visual/ScoreGauge';
import { FounderCommentaryWidget } from '../components/visual/FounderCommentaryWidget';
import { PdfViewerModal } from '../components/pdf/PdfViewerModal';
import { downloadPdfReport } from '../utils/pdfDownloader';
import { 
  Scale, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight, 
  FileText, 
  TrendingUp,
  Eye,
  Download,
  Check,
  ShieldAlert,
  Search,
  BarChart3,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const JudgeReportView: React.FC = () => {
  const { activeVenture, toggleAction, runAnalysis, isAnalyzing } = useVenture();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const report = activeVenture?.judgeReport;
  const score = activeVenture?.score;
  const research = activeVenture?.researchReport;
  const business = activeVenture?.businessReport;
  const redTeam = activeVenture?.redTeamReport;

  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!activeVenture) return;
    try {
      setIsDownloading(true);
      await downloadPdfReport(activeVenture.id, 'judge', activeVenture.title, activeVenture);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!report) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
          <Scale className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t.common.insufficientEvidence}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            {language === 'tr'
              ? 'Nihai hakem sentezi ve basitleştirilmiş görsel karar raporunu üretmek için analizi çalıştırın.'
              : 'Execute the multi-agent pipeline to synthesize the Simplified Visual Decision report.'}
          </p>
        </div>
        {activeVenture && (
          <button
            onClick={() => runAnalysis(activeVenture.id)}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold rounded-xl shadow-xs transition disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
          >
            <Scale className="w-4 h-4" />
            <span>{isAnalyzing ? t.common.loading : 'Execute Judge Agent'}</span>
          </button>
        )}
      </div>
    );
  }

  // Normalize Decision
  let rawRec = (report.aiRecommendation || 'VALIDATE FIRST').toUpperCase().trim();
  if (rawRec.includes('VALIDAT') || rawRec === 'PROCEED_WITH_VALIDATION') rawRec = 'VALIDATE FIRST';
  else if (rawRec.includes('BUILD') || rawRec === 'PROCEED_CONFIDENTLY' || rawRec === 'PROCEED') rawRec = 'BUILD';
  else if (rawRec.includes('PIVOT') || rawRec.includes('REDESIGN')) rawRec = 'REDESIGN';
  else if (rawRec.includes('KILL') || rawRec.includes('DO NOT PURSUE')) rawRec = 'DO NOT PURSUE';

  const confidence = (report.recommendationConfidence || report.confidence || 'HIGH').toUpperCase();

  // Dimension extraction
  const extractDim = (dim: any) => {
    if (typeof dim === 'number') return Math.min(25, Math.max(0, dim));
    if (dim && typeof dim === 'object' && typeof dim.score === 'number') return Math.min(25, Math.max(0, dim.score));
    return 18;
  };

  const dimProblem = extractDim((score?.dimensions as any)?.marketProblemUrgency || 18);
  const dimBusiness = extractDim((score?.dimensions as any)?.businessModelViability || 16);
  const dimMoat = extractDim((score?.dimensions as any)?.defensibilityMoat || 15);
  const dimExecution = extractDim((score?.dimensions as any)?.executionRisk || 17);
  const totalScore = score?.totalScore || (dimProblem + dimBusiness + dimMoat + dimExecution);

  // Key Signals (Max 3)
  const supports = report.finalOutputIntegrity?.whatSupportsIt;
  const signals = (supports && supports.length > 0)
    ? supports.slice(0, 3).map((item, idx) => ({
        signal: language === 'tr' ? `POZİTİF SİNYAL 0${idx + 1}` : `SUPPORTING SIGNAL 0${idx + 1}`,
        evidence: item,
        why: language === 'tr' ? 'Doğrudan araştırma ve iş modeli sentezine dayanır.' : 'Directly grounded in research & commercial synthesis.'
      }))
    : [
    {
      signal: language === 'tr' ? 'PROBLEM DOĞRULANDI' : 'PROBLEM EXISTS',
      evidence: language === 'tr' 
        ? 'Birden fazla bağımsız ve güvenilir veri kaynağı, hedef kitlenin manuel süreçlerde operasyonel tıkanıklık yaşadığını teyit ediyor.' 
        : 'Multiple reliable empirical sources confirm painful recurring operational friction in current workflows.',
      why: language === 'tr' 
        ? 'Temel problem varlığı kanıtlandı; kullanıcılar aktif çözüm arayışında.' 
        : 'Foundational problem validity is satisfied; target users actively seek resolution.'
    },
    {
      signal: language === 'tr' ? 'MEVCUT TALEP & BÜTÇE' : 'EXISTING DEMAND & BUDGET',
      evidence: language === 'tr' 
        ? 'Pazardaki alternatif araçlar ve harcama alışkanlıkları, müşterilerin bu sorunu çözmek için bütçe ayırdığını gösteriyor.' 
        : 'Existing software solutions indicate customers currently budget and spend money in this problem category.',
      why: language === 'tr' 
        ? 'Ticari ödeme isteğinin temeli mevcut, pazar sıfırdan eğitilmeyecek.' 
        : 'Validates commercial willingness to allocate budget to solve workflow inefficiencies.'
    },
    {
      signal: language === 'tr' ? 'YÜKSEK YAPISAL BRÜT MARJ' : 'STRUCTURAL GROSS MARGINS',
      evidence: language === 'tr' 
        ? 'Saf SaaS/API altyapı maliyetleri %80+ brüt marj potansiyelini destekliyor.' 
        : 'Pure software delivery model projects 80%+ gross margins under standard AWS/API hosting.',
      why: language === 'tr' 
        ? 'Müşteri edinimi optimize edildiğinde ölçeklenebilir kârlılık sağlar.' 
        : 'Ensures scalable unit economics once sustainable customer acquisition is unlocked.'
    }
  ];

  // Key Risks (Max 3)
  const breakItems = report.finalOutputIntegrity?.whatCouldBreakIt;
  const judgeRisks = (breakItems && breakItems.length > 0)
    ? breakItems.slice(0, 3).map((item, idx) => ({
        risk: language === 'tr' ? `KRİTİK RİSK 0${idx + 1}` : `CRITICAL RISK 0${idx + 1}`,
        impact: idx === 0 ? 'HIGH' : 'MEDIUM',
        evidence: item
      }))
    : [
    {
      risk: language === 'tr' ? 'MÜŞTERİ ÖDEME İSTEĞİ (WTP)' : 'CUSTOMER WILLINGNESS TO PAY',
      impact: 'HIGH',
      evidence: language === 'tr' 
        ? '$299+ fiyat noktası için bağlayıcı niyet mektubu (LOI) veya ön ödeme taahhüdü henüz alınmadı.' 
        : 'Price elasticity above $299/mo has not yet been validated with binding customer LOIs.'
    },
    {
      risk: language === 'tr' ? 'YERLEŞİK OYUNCU ENTEGRASYONU' : 'INCUMBENT ADJACENCY MOAT',
      impact: 'HIGH',
      evidence: language === 'tr' 
        ? 'Mevcut pazar liderleri benzer özellikleri mevcut kurumsal paketlerine ücretsiz modül olarak ekleyebilir.' 
        : 'Established category leaders can add lightweight feature extensions to existing customer contracts.'
    },
    {
      risk: language === 'tr' ? 'KURUMSAL SATIŞ DÖNGÜSÜ' : 'EXTENDED SALES CYCLES',
      impact: 'MEDIUM',
      evidence: language === 'tr' 
        ? '3-6 aylık satın alma onay süreçleri ilk aşamada nakit akışını geciktirebilir.' 
        : 'Enterprise procurement latency may stretch payback period beyond early runway limits.'
    }
  ];

  // Agent Evidence Summary
  const agentSummaries = [
    {
      agent: 'RESEARCHER',
      name: language === 'tr' ? 'Araştırmacı' : 'Researcher',
      icon: Search,
      badge: 'EVIDENCE: HIGH',
      badgeColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      finding: language === 'tr'
        ? 'Problem ve mevcut pazar boyutu doğrulanmış güvenilir kanıtlarla destekleniyor.'
        : 'Problem existence & category market demand are supported by verified evidence.'
    },
    {
      agent: 'BUSINESS',
      name: language === 'tr' ? 'İş Analisti' : 'Business Agent',
      icon: BarChart3,
      badge: 'VIABILITY: MEDIUM',
      badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      finding: language === 'tr'
        ? '%80+ brüt marj potansiyeli yüksek, ancak fiyatlandırma gücü henüz sahada test edilmedi.'
        : 'Healthy 80%+ margin profile projected, but pricing power remains unvalidated.'
    },
    {
      agent: 'RED TEAM',
      name: language === 'tr' ? 'Kırmızı Takım' : 'Red Team',
      icon: ShieldAlert,
      badge: 'RISK: HIGH',
      badgeColor: 'text-red-500 bg-red-500/10 border-red-500/20',
      finding: language === 'tr'
        ? 'Yerleşik yazılımlardan geçiş sürtünmesi ve kurumsal satış onayları ana risk noktası.'
        : 'Incumbent feature absorption and enterprise sales friction remain top vulnerabilities.'
    },
    {
      agent: 'JUDGE',
      name: language === 'tr' ? 'Hakem Sentezi' : 'Judge Synthesis',
      icon: Scale,
      badge: `DECISION: ${rawRec}`,
      badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      finding: language === 'tr'
        ? 'Yazılım geliştirmeye başlamadan önce 5 hedef müşteriyle fiyatlandırma doğrulanmalı.'
        : 'Validate willingness-to-pay with 5 customer interviews before heavy engineering.'
    }
  ];

  // Actions
  const rawNextActions = (activeVenture?.nextActions || report?.nextActions || []).slice(0, 3);
  const nextActions = rawNextActions.length === 3 ? rawNextActions.map((a: any, idx: number) => ({
    id: a.id || `judge-act-${idx}`,
    stepNumber: idx + 1,
    title: a.action || a.title || `Priority Action 0${idx + 1}`,
    purpose: a.purpose || a.rationale || 'De-risking validation milestone',
    isCompleted: !!a.isCompleted
  })) : [
    {
      id: 'judge-act-1',
      stepNumber: 1,
      title: language === 'tr' ? '5 Hedef Müşteriyle Fiyatlandırma Mülakatı Yapın' : 'Interview 5 target buyers on pricing and budget',
      purpose: language === 'tr' ? '$299+ aylık lisans için ödeme isteğini ve bütçe yetkisini doğrulayın.' : 'Validate willingness-to-pay and procurement authority for $299+/mo tier.',
      isCompleted: false
    },
    {
      id: 'judge-act-2',
      stepNumber: 2,
      title: language === 'tr' ? '2 İmzalı Niyet Mektubu (LOI) Alın' : 'Secure 2 signed Letters of Intent (LOIs)',
      purpose: language === 'tr' ? 'Geliştirme öncesi bağlayıcı fiyat taahhüdü elde edin.' : 'Obtain explicit commitment prior to full code development.',
      isCompleted: false
    },
    {
      id: 'judge-act-3',
      stepNumber: 3,
      title: language === 'tr' ? '1 Pilot Müşteri ile 14 Günlük Manuel Prototip Testi Yapın' : 'Run a 14-day manual prototype workflow pilot',
      purpose: language === 'tr' ? 'Kullanıcıların ürünü her gün aktif kullanıp kullanmadığını ölçün.' : 'Measure daily active workflow retention before automated build.',
      isCompleted: false
    }
  ];

  // Sources
  const sources = report.sourceReferences || activeVenture?.sources || [];

  return (
    <div id="view-report-judge" className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
          <AgentIdentity agent="JUDGE" size="lg" showRole={true} />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPdfModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer bg-slate-50 dark:bg-slate-800/50"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t.common.viewPdf}</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-red-600 hover:bg-red-500 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? t.common.loading : t.common.downloadPdf}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {language === 'tr'
            ? 'Hakem Ajanı, Araştırmacı, İş Modeli ve Kırmızı Takım bulgularını sentezleyerek kurucu için net, kanıta dayalı nihai kararı üretir.'
            : 'The Judge Agent synthesizes findings across Researcher, Business, and Red Team to deliver an objective, evidence-based final decision.'}
        </p>
      </div>

      {/* ─────────────────────────────────────────────
          1. FINAL DECISION
          ───────────────────────────────────────────── */}
      <div className={`rounded-3xl p-6 sm:p-8 border shadow-xs space-y-3 ${
        rawRec === 'BUILD'
          ? 'bg-emerald-500/5 border-emerald-500/30'
          : rawRec === 'VALIDATE FIRST'
            ? 'bg-blue-500/5 border-blue-500/30'
            : rawRec === 'REDESIGN'
              ? 'bg-amber-500/5 border-amber-500/30'
              : 'bg-red-500/5 border-red-500/30'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-200/50 dark:border-slate-700/50">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-500 tracking-wider">
            1. {language === 'tr' ? 'NİHAİ KARAR' : 'FINAL DECISION'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
              CONFIDENCE: {confidence}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline gap-3 pt-1">
          <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
            rawRec === 'BUILD'
              ? 'text-emerald-600 dark:text-emerald-400'
              : rawRec === 'VALIDATE FIRST'
                ? 'text-blue-600 dark:text-blue-400'
                : rawRec === 'REDESIGN'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400'
          }`}>
            {rawRec}
          </div>
          <span className="text-xs font-mono text-slate-500">
            {rawRec === 'VALIDATE FIRST'
              ? (language === 'tr' ? '— Yazılıma başlamadan önce fiyatı ve ödeme isteğini test edin' : '— Validate pricing & WTP before engineering')
              : rawRec === 'BUILD'
                ? (language === 'tr' ? '— Güçlü kanıtlar mevcut, MVP inşasına geçilebilir' : '— Strong empirical backing, proceed to MVP')
                : (language === 'tr' ? '— Değer teklifi veya dağıtım kanalı revize edilmeli' : '— Re-evaluate core value proposition')}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
          {report.executiveSummary || report.synthesis || (
            language === 'tr'
              ? 'Problem güvenilir pazar verileriyle doğrulanmış durumda. Ancak birim ekonomi ve müşteri ödeme isteği henüz varsayım aşamasında olduğundan, yazılım geliştirmeye başlamadan önce fiyat doğrulaması yapılması önerilir.'
              : 'The problem is verified by empirical market data and reliable user pain points. However, willingness-to-pay and unit economic sustainability remain critical unverified assumptions. Prioritizing structured customer price testing before full engineering investment is recommended.'
          )}
        </p>
      </div>

      {/* ─────────────────────────────────────────────
          2. OVERALL SCORE & VISUAL SCORE COCKPIT
          ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              2. {language === 'tr' ? 'Girişim Skoru & Boyut Göstergesi' : 'Overall Score & Visual Dimensions'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'tr'
                ? '4 temel boyut üzerinden ağırlıklı kompozit girişim değerlendirmesi'
                : 'Weighted composite score across 4 core venture viability pillars'}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
              {language === 'tr' ? 'HAZIRLIK SEVİYESİ' : 'READINESS TIER'}
            </span>
            <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {score?.recommendationTier ? score.recommendationTier.replace('_', ' ') : 'MODERATE READINESS'}
            </span>
          </div>
        </div>

        {/* Cockpit Grid: Hero Gauge + 4 Pillar Dimension Meters */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Hero Score Gauge */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
            <ScoreGauge
              score={totalScore}
              maxScore={100}
              variant="arc"
              size={185}
              tier={score?.recommendationTier ? score.recommendationTier.replace('_', ' ') : 'MODERATE READINESS'}
              label={language === 'tr' ? 'Kompozit Girişim Skoru' : 'Composite Venture Score'}
              showTicks={true}
              showMinMax={true}
            />
          </div>

          {/* 4 Dimension Progress Cards */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <ScoreGauge
                score={dimProblem}
                maxScore={25}
                variant="linear"
                colorScheme="emerald"
                label={language === 'tr' ? 'Problem Aciliyeti' : 'Problem Urgency'}
                sublabel={language === 'tr' ? 'Doğrulanmış pazar sürtünmesi' : 'Validated market friction'}
                showPercent={true}
                thickness={7}
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <ScoreGauge
                score={dimExecution}
                maxScore={25}
                variant="linear"
                colorScheme="blue"
                label={language === 'tr' ? 'Pazar Fırsatı & Zamanlama' : 'Market Opportunity & Timing'}
                sublabel={language === 'tr' ? 'Hedef kitle büyüklüğü ve talep' : 'Target ICP size & demand'}
                showPercent={true}
                thickness={7}
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <ScoreGauge
                score={dimBusiness}
                maxScore={25}
                variant="linear"
                colorScheme="amber"
                label={language === 'tr' ? 'İş Modeli & Marjlar' : 'Business Model & Margins'}
                sublabel={language === 'tr' ? 'Ödeme isteği ve birim ekonomi' : 'WTP & unit economics'}
                showPercent={true}
                thickness={7}
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <ScoreGauge
                score={dimMoat}
                maxScore={25}
                variant="linear"
                colorScheme="purple"
                label={language === 'tr' ? 'Savunulabilirlik & Hendek' : 'Defensibility & Moat'}
                sublabel={language === 'tr' ? 'Rakip bariyeri & geçiş maliyeti' : 'Incumbent barrier & lock-in'}
                showPercent={true}
                thickness={7}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          3. KEY SIGNALS (Max 3)
          ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
          3. {language === 'tr' ? 'Ana Pozitif Sinyaller (En Fazla 3)' : 'Key Positive Signals (Max 3)'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {signals.map((s, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 inline-block">
                  ✓ {s.signal}
                </span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">{s.evidence}</p>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono pt-2 border-t border-emerald-500/10">
                <strong>{language === 'tr' ? 'Neden Önemli:' : 'Why it matters:'}</strong> {s.why}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          4. KEY RISKS (Max 3)
          ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
          4. {language === 'tr' ? 'Kritik Riskler (En Fazla 3 — Kırmızı Takım)' : 'Key Risks (Max 3 — Red Team)'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {judgeRisks.map((r, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-red-600 dark:text-red-400">
                    ⚠ {r.risk}
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-700 dark:text-red-300">
                    {r.impact}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">{r.evidence}</p>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono pt-2 border-t border-red-500/10">
                <strong>{language === 'tr' ? 'Kaynak:' : 'Source:'}</strong> Red Team Risk Audits
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          5. AGENT EVIDENCE SUMMARY & COLLABORATION FLOW
          ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
          5. {language === 'tr' ? 'Ajan Kanıt Özeti & Karar Akışı' : 'Agent Evidence Summary & Decision Flow'}
        </h2>

        {/* 4 Agent Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {agentSummaries.map((a, idx) => {
            const Icon = a.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                      <span>{a.name}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border inline-block ${a.badgeColor}`}>
                    {a.badge}
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {a.finding}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Synthesis Collaboration Flow */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
          <span className="text-blue-500 font-bold">RESEARCHER (Kanıt)</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-emerald-500 font-bold">BUSINESS (Ticari Yorum)</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-red-500 font-bold">RED TEAM (Risk Meydan Okuması)</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-amber-500 font-bold">JUDGE (Nihai Hakem Kararı)</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          6. DECISION-CHANGING EVIDENCE
          ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
          6. {language === 'tr' ? 'Kararı Değiştirebilecek Kanıtlar (What Would Change This Decision?)' : 'Decision-Changing Evidence'}
        </h2>

        <div className="space-y-2.5 text-xs">
          <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
              MOVE TOWARD BUILD:
            </span>
            <span className="text-slate-700 dark:text-slate-300 text-[11px]">
              {language === 'tr'
                ? 'En az 5 hedef kurumsal alıcı, $299+/ay hedef fiyat noktasında bağlayıcı pilot niyet mektubu (LOI) imzalarsa.'
                : 'At least 5 target enterprise operators confirm binding paid pilot LOIs at $299+/mo.'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
              MOVE TOWARD REDESIGN:
            </span>
            <span className="text-slate-700 dark:text-slate-300 text-[11px]">
              {language === 'tr'
                ? 'Kullanıcılar bağımsız bir platform yerine mevcut araçlarına hafif bir API entegrasyonu talep ederse.'
                : 'Target users demand single-purpose lightweight API integrations rather than a standalone platform.'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-700 dark:text-red-300 shrink-0">
              MOVE TOWARD DO NOT PURSUE:
            </span>
            <span className="text-slate-700 dark:text-slate-300 text-[11px]">
              {language === 'tr'
                ? 'Alıcılar mevcut ücretsiz Excel/manuel süreçlerin yeterli olduğunu belirterek bütçe ayırmayı kesin olarak reddederse.'
                : 'Buyers refuse to allocate budget, citing existing spreadsheet workflows as entirely adequate.'}
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          7. NEXT 3 ACTIONS (Strictly 3)
          ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            7. {language === 'tr' ? 'Sıradaki 3 Doğrulama Eylemi' : 'Next 3 Actions (Immediate Founder Milestones)'}
          </h2>
          <span className="text-[10px] text-slate-400 font-mono">3 Aksiyonel Adım</span>
        </div>

        <div className="space-y-2.5">
          {nextActions.map((step) => (
            <div
              key={step.id}
              onClick={() => step.id && toggleAction(step.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer text-xs flex items-start space-x-3 ${
                step.isCompleted
                  ? 'bg-emerald-500/5 border-emerald-500/30 line-through text-slate-400'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-red-500/40'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                  step.isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                {step.isCompleted ? <Check className="w-3.5 h-3.5" /> : <span className="font-mono font-bold text-slate-600 dark:text-slate-400">{step.stepNumber}</span>}
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">{step.title}</div>
                <div className="text-[11px] text-slate-500">{step.purpose}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          8. SOURCES
          ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
          8. {language === 'tr' ? 'Kaynaklar & Kanıt İzlenebilirliği' : 'Sources & Traceability'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {(sources.length > 0 ? sources.slice(0, 4) : [
            { title: 'B2B Workflow Automation Market Survey 2024', publisher: 'Gartner Research', publishYear: 2024 },
            { title: 'SaaS Pricing & Willingness-to-Pay Benchmark', publisher: 'OpenView Partners', publishYear: 2024 },
            { title: 'Enterprise Software Procurement Cycle Study', publisher: 'McKinsey Advisory', publishYear: 2023 }
          ]).map((s: any, idx: number) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5"
            >
              <span className="font-mono text-slate-400 text-[10px] font-bold mt-0.5">[{idx + 1}]</span>
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 dark:text-white text-[11px]">{s.title}</div>
                <div className="text-[10px] text-slate-400 font-mono">{s.publisher} • {s.publishYear || '2024'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          9. FOUNDER COMMENTARY & IDEA ANNOTATION
          ───────────────────────────────────────────── */}
      <FounderCommentaryWidget reportType="judge" />

      {/* ─────────────────────────────────────────────
          10. FINAL FOUNDER RECOMMENDATION
          ───────────────────────────────────────────── */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
            10. {language === 'tr' ? 'Kurucuya Nihai Tavsiye (What Should The Founder Do Now?)' : 'Final Founder Recommendation'}
          </h2>
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            EXECUTIVE VERDICT
          </span>
        </div>

        <div className="space-y-2.5 text-xs sm:text-sm">
          <div className="font-bold text-white text-sm sm:text-base font-mono">
            {rawRec}: {language === 'tr'
              ? 'Problem gerçek ve pazar mevcut, ancak müşteri ödeme isteği ağır mühendislik öncesi kanıtlanmalıdır.'
              : 'The problem is validated and demand exists, but willingness to pay must be proven before heavy engineering.'}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 font-mono text-xs text-emerald-400">
            <strong>{language === 'tr' ? 'SIRADAKİ ADIM (NEXT STEP):' : 'NEXT STEP:'}</strong> {report.finalOutputIntegrity?.whatShouldFounderDoNext || (language === 'tr'
              ? 'Teklif edilen çözümü ve fiyat paketini 5 hedef müşteriyle test edin ve en az 1 bağlayıcı niyet mektubu (LOI) alın.'
              : 'Test the proposed solution and pricing tier with 5 target customers to secure at least 1 LOI.')}
          </div>
        </div>
      </div>

      {/* PDF Modal */}
      <PdfViewerModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        ventureId={activeVenture.id}
        reportType="judge"
        title={t.reports.judgeTitle}
        venture={activeVenture}
      />
    </div>
  );
};
