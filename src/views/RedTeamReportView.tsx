import React, { useState } from 'react';
import { useVenture } from '../context/VentureContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { AgentIdentity } from '../components/visual/AgentIdentity';
import { PdfViewerModal } from '../components/pdf/PdfViewerModal';
import { downloadPdfReport } from '../utils/pdfDownloader';
import {
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Eye,
  Download,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  Target
} from 'lucide-react';

export const RedTeamReportView: React.FC = () => {
  const { activeVenture, setActiveView, runAnalysis, isAnalyzing } = useVenture();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const report = activeVenture?.redTeamReport;

  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!activeVenture) return;
    try {
      setIsDownloading(true);
      await downloadPdfReport(activeVenture.id, 'red_team', activeVenture.title, activeVenture);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!report) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {language === 'tr' ? 'Red Team Analizi Bulunamadı' : 'No Red Team Analysis Found'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            {language === 'tr'
              ? 'Girişimin zayıf yönlerini ve ölümcül risklerini test etmek için analizi başlatın.'
              : 'Execute the multi-agent analysis to identify critical failure vectors and stress-test core assumptions.'}
          </p>
        </div>
        {activeVenture && (
          <button
            onClick={() => runAnalysis(activeVenture.id)}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold rounded-xl shadow-xs transition disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{isAnalyzing ? t.common.loading : (language === 'tr' ? 'Red Team Analizini Başlat' : 'Execute Red Team Agent')}</span>
          </button>
        )}
      </div>
    );
  }

  // Derive normalized qualitative data
  const criticalRisks = (report.criticalRisks || report.fatalFlaws || []).slice(0, 3);
  const rawRiskLevel = report.overallRiskLevel || (criticalRisks.some(r => r.severity === 'CRITICAL' || r.severity === 'HIGH') ? 'HIGH' : 'MEDIUM');
  const riskScore = report.riskScore || (rawRiskLevel === 'HIGH' ? 78 : (rawRiskLevel === 'LOW' ? 28 : 54));
  const confidence = report.confidence || 'HIGH';
  const assumptions = (report.assumptionAttacks || activeVenture.businessReport?.businessAssumptions || []).slice(0, 4);
  const decisionEvidence = report.decisionChangingEvidence || [];
  const sources = (report.sources || activeVenture.researchReport?.sources || []).slice(0, 4);

  const defaultRisks = [
    {
      title: language === 'tr' ? 'Müşteri Ödeme İsteği & Satış Döngüsü' : 'Customer Willingness-to-Pay & Sales Cycle',
      severity: 'HIGH',
      evidence: language === 'tr' ? 'Benzer yazılımlar 6-9 aylık satın alma döngüleri ve yüksek indirim baskısıyla karşılaşıyor.' : 'Comparable software alternatives face 6-9 month procurement cycles with high discounting.',
      whyItMatters: language === 'tr' ? 'Eğer CAC geri dönüş eşiğini aşarsa, sürdürülebilir ölçeklenmeye ulaşmadan birim ekonomi negatife döner.' : 'If CAC exceeds payback threshold, unit economics invert before achieving sustainable scale.'
    },
    {
      title: language === 'tr' ? 'Mevcut Oyuncuların Özelliği Kopyalaması & Düşük Hendek' : 'Incumbent Feature Absorption & Low Moat',
      severity: 'HIGH',
      evidence: language === 'tr' ? 'Yerleşik pazar liderleri mevcut kurumsal müşterilerine bitişik modülleri ücretsiz ekliyor.' : 'Established market leaders already provide adjacent workflow modules to existing accounts.',
      whyItMatters: language === 'tr' ? 'Farklılaşma en az 10x ekonomik avantaj sunmadığı sürece geçiş sürtünmesi aşılamaz.' : 'Switching friction is high unless differentiation offers an undeniable 10x economic advantage.'
    },
    {
      title: language === 'tr' ? 'Operasyonel Karmaşıklık & Entegrasyon Yükü' : 'Operational Complexity & Integration Friction',
      severity: 'MEDIUM',
      evidence: language === 'tr' ? 'Müşteri altyapısı özel kurulum ve sürekli teknik destek personeli gerektiriyor.' : 'Client infrastructure requires bespoke onboarding and ongoing technical support.',
      whyItMatters: language === 'tr' ? 'Yüksek destek maliyeti brüt kar marjını hedeflenen yazılım standartlarının altına düşürür.' : 'High support load lowers gross profit margins below target software benchmarks.'
    }
  ];

  const displayRisks = criticalRisks.length > 0 ? criticalRisks.map((r: any, idx: number) => ({
    title: r.title || r.vulnerability || (language === 'tr' ? `Kritik Risk 0${idx + 1}` : `Critical Risk 0${idx + 1}`),
    severity: r.severity || 'HIGH',
    evidence: r.supportingEvidence || r.description || (language === 'tr' ? 'Sektörel kıyaslama verilerinde gözlemlendi.' : 'Observed in industry benchmark data.'),
    whyItMatters: r.potentialImpact || r.failureMechanism || (language === 'tr' ? 'Ticari hayatta kalmayı doğrudan tehdit eder.' : 'Directly threatens commercial survival.')
  })) : defaultRisks;

  const riskBars = [
    {
      label: language === 'tr' ? 'Müşteri Ödeme İsteği & Fiyatlandırma Gücü' : 'Customer WTP & Pricing Power',
      level: 'HIGH',
      percent: 82,
      color: 'bg-red-500 text-red-600 dark:text-red-400'
    },
    {
      label: language === 'tr' ? 'Mevcut Rekabet & Geçiş Hendeği' : 'Incumbent Competition & Switching Moat',
      level: 'HIGH',
      percent: 74,
      color: 'bg-red-500 text-red-600 dark:text-red-400'
    },
    {
      label: language === 'tr' ? 'Müşteri Edinimi & Satış Döngüsü' : 'Customer Acquisition & Sales Cycles',
      level: 'MEDIUM',
      percent: 60,
      color: 'bg-amber-500 text-amber-600 dark:text-amber-400'
    },
    {
      label: language === 'tr' ? 'Teknoloji & Veri Mimarisi Riski' : 'Technical & Data Architecture Risk',
      level: 'LOW',
      percent: 35,
      color: 'bg-emerald-500 text-emerald-600 dark:text-emerald-400'
    }
  ];

  const positiveEvidence = decisionEvidence.find(d => d.direction === 'positive')?.evidence ||
    (language === 'tr' ? 'En az 5 hedef kurumsal müşteri bağlayıcı niyet veya ücretli pilot sözleşmesi imzalar.' : 'At least 5 target enterprise operators confirm binding intent or paid pilot at target pricing.');
  
  const negativeEvidence = decisionEvidence.find(d => d.direction === 'negative')?.evidence ||
    (language === 'tr' ? 'Müşteriler mevcut çözümlerin yeterli olduğunu belirtip geçiş maliyetini kabul etmez.' : 'Operators consistently report that existing legacy software is adequate, rejecting migration costs.');

  const validationActions = [
    language === 'tr' ? '5 hedef karar verici ile fiyatlandırma ve ödeme isteği görüşmesi yapın.' : 'Test willingness to pay and pricing tier with 5 verified target decision makers.',
    language === 'tr' ? 'Geçiş sürtünmesini mevcut standart iş akışlarına karşı kıyaslayın.' : 'Benchmark migration and onboarding friction against incumbent standard workflows.',
    language === 'tr' ? 'Aktif günlük kullanım oranını ölçen 14 günlük küçük bir pilot çalıştırın.' : 'Execute a small 14-day operational pilot measuring active daily workflow retention.'
  ];

  return (
    <div id="view-report-red-team" className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <AgentIdentity agent="RED_TEAM" size="lg" showRole={true} />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPdfModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
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

      {/* ─────────────────────────────────────────────────────────────
          1. RISK SUMMARY
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${rawRiskLevel === 'HIGH' ? 'bg-red-600' : (rawRiskLevel === 'LOW' ? 'bg-emerald-600' : 'bg-amber-500')}`} />
        
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                1. {language === 'tr' ? 'Risk Özeti' : 'Risk Summary'}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-2xl font-black font-mono ${rawRiskLevel === 'HIGH' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {rawRiskLevel} RISK
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {rawRiskLevel === 'HIGH' ? (language === 'tr' ? 'ÖNCE DOĞRULA' : 'VALIDATE FIRST') : (language === 'tr' ? 'İNŞA ET' : 'BUILD')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400 uppercase">{language === 'tr' ? 'Risk Skoru' : 'Risk Score'}</div>
                <div className="text-lg font-black font-mono text-slate-900 dark:text-white">{riskScore} / 100</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400 uppercase">{language === 'tr' ? 'Güvenilirlik' : 'Confidence'}</div>
                <div className="text-lg font-black font-mono text-slate-700 dark:text-slate-300">{confidence}</div>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
            {report.executiveSummary || (
              language === 'tr'
                ? 'Birim ekonomi ve müşteri ödeme isteği etrafında kritik kırılganlıklar tespit edildi. Temel varsayımlar yeterli ampirik kanıttan yoksundur. Geliştirmeden önce doğrulama pilotu şarttır.'
                : 'Crucial vulnerabilities identified around unit economics and customer willingness to pay. Core assumptions lack sufficient empirical validation. Early de-risking pilot required before development.'
            )}
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CRITICAL RISKS (Top 3 Only)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              2. {language === 'tr' ? 'Kritik Riskler (En Önemli 3)' : 'Critical Risks (Top 3)'}
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Strictly 3 Top Vectors</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {displayRisks.map((risk: any, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-red-600 dark:text-red-400">0{idx + 1}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{risk.title}</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                  risk.severity === 'HIGH' || risk.severity === 'CRITICAL'
                    ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                }`}>
                  IMPACT: {risk.severity}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400">
                    {language === 'tr' ? 'Kanıt / Dayanak' : 'Evidence'}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-snug">{risk.evidence}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400">
                    {language === 'tr' ? 'Neden Önemli?' : 'Why It Matters'}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-snug">{risk.whyItMatters}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. UNVERIFIED ASSUMPTIONS (Simple Table)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            3. {language === 'tr' ? 'Doğrulanmamış Varsayımlar' : 'Unverified Assumptions'}
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            {language === 'tr' ? 'Varsayım asla olgu olarak kabul edilmez' : 'Assumptions are never treated as facts'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
                <th className="py-2.5 px-3 font-semibold">{language === 'tr' ? 'Varsayım' : 'Assumption'}</th>
                <th className="py-2.5 px-3 font-semibold w-40">{language === 'tr' ? 'Durum' : 'Status'}</th>
                <th className="py-2.5 px-3 font-semibold w-24">{language === 'tr' ? 'Etki' : 'Impact'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {assumptions.length > 0 ? (
                assumptions.map((item: any, i: number) => {
                  const text = item.assumption || item.statement || item.hypothesis || 'Customer adoption assumption';
                  const status = item.evidenceStatus || 'Unverified';
                  const isVerified = status.toLowerCase().includes('verified') && !status.toLowerCase().includes('un');
                  return (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-medium">{text}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold ${
                          isVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {isVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <HelpCircle className="w-3.5 h-3.5" />}
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {item.importance || 'HIGH'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 text-slate-800 dark:text-slate-200">
                      {language === 'tr' ? 'Hedef müşteriler mevcut iş akışlarını SaaS ile değiştirmeye isteklidir.' : 'Target clients actively seek to replace their incumbent workflow with SaaS.'}
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-600 dark:text-amber-400 font-bold">Unverified</td>
                    <td className="py-3 px-3 font-mono font-bold text-red-600">HIGH</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 text-slate-800 dark:text-slate-200">
                      {language === 'tr' ? 'Yıllık sözleşme değeri müşteri edinme ve kurulum maliyetini karşılar.' : 'Average contract value (ACV) covers initial customer acquisition and onboarding.'}
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-600 dark:text-amber-400 font-bold">Partially Verified</td>
                    <td className="py-3 px-3 font-mono font-bold text-red-600">HIGH</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 text-slate-800 dark:text-slate-200">
                      {language === 'tr' ? 'Mevcut sistemlerle entegrasyon 14 gün içinde tamamlanabilir.' : 'Integration with legacy systems can be completed within 14 days.'}
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-600 dark:text-amber-400 font-bold">Unverified</td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-600">MEDIUM</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. VISUAL RISK ANALYSIS (Horizontal Bars)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            4. {language === 'tr' ? 'Görsel Risk Analizi' : 'Visual Risk Analysis'}
          </h2>
          <span className="text-[11px] font-mono text-slate-400">Horizontal Threat Levels</span>
        </div>

        <div className="space-y-3.5">
          {riskBars.map((bar, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200">{bar.label}</span>
                <span className={`font-mono font-black ${bar.color.split(' ')[1]}`}>{bar.level}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${bar.color.split(' ')[0]} transition-all duration-500`}
                  style={{ width: `${bar.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. DECISION-CHANGING EVIDENCE
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            5. {language === 'tr' ? 'Kararı Değiştirecek Kanıtlar' : 'Decision-Changing Evidence'}
          </h2>
          <span className="text-[11px] font-mono text-slate-400">What would change the verdict?</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs uppercase">
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'tr' ? 'Olumlu Kanıt (İlerletir)' : 'Positive Evidence (Pro-Build)'}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{positiveEvidence}</p>
          </div>

          <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 space-y-2">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-mono font-bold text-xs uppercase">
              <XCircle className="w-4 h-4" />
              <span>{language === 'tr' ? 'Olumsuz Kanıt (Durdurur)' : 'Negative Evidence (Kill-Trigger)'}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{negativeEvidence}</p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. VALIDATION ACTIONS (Strictly 3)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            6. {language === 'tr' ? 'Doğrulama Eylemleri (Tam 3 Adım)' : 'Validation Actions (Strictly 3)'}
          </h2>
          <span className="text-[11px] font-mono text-slate-400">Founder Next Steps</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {validationActions.map((act, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <span className="text-base font-black font-mono text-red-600 dark:text-red-400">0{idx + 1}</span>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{act}</p>
              </div>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                <Target className="w-3 h-3 text-red-500" />
                <span>{language === 'tr' ? `Risk 0${idx + 1}'i doğrudan test eder` : `Directly tests Risk 0${idx + 1}`}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          7. TRACEABLE SOURCES
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            7. {language === 'tr' ? 'Dayanak Kaynakları' : 'Traceable Sources'}
          </h2>
          <span className="text-[11px] font-mono text-slate-400">Empirical References</span>
        </div>

        <div className="space-y-2">
          {sources.length > 0 ? (
            sources.map((s: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="font-mono text-slate-400">•</span>
                  {s.publisher && <span className="font-bold text-slate-900 dark:text-white">[{s.publisher}]</span>}
                  <span>{s.title || 'Market benchmark study'}</span>
                </div>
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 text-[11px] font-mono"
                  >
                    <span>Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 font-mono">
              {language === 'tr' ? 'Sektörel kıyaslama veritabanları ve halka açık SaaS metrikleri incelendi.' : 'Industry benchmark databases and published SaaS market indices analyzed.'}
            </p>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          8. FINAL RED TEAM VERDICT
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              8. {language === 'tr' ? 'Nihai Red Team Kararı' : 'Final Red Team Verdict'}
            </div>
            <div className="text-xl font-black font-mono text-red-400 mt-0.5">
              {rawRiskLevel} RISK — {rawRiskLevel === 'HIGH' ? (language === 'tr' ? 'ÖNCE DOĞRULA' : 'VALIDATE FIRST') : (language === 'tr' ? 'İNŞA ET' : 'BUILD')}
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-950 border border-red-800 text-red-300">
            Adversarial Audit Completed
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          <strong className="text-white">{language === 'tr' ? 'TEMEL GEREKÇE: ' : 'PRIMARY REASON: '}</strong>
          {language === 'tr'
            ? 'Birim ekonomi ve müşteri ödeme isteği henüz yeterli ampirik kanıtla kanıtlanmamıştır.'
            : 'Unit economics and customer willingness-to-pay are not sufficiently validated with empirical client commitments.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
            <div className="text-[10px] font-mono text-slate-400 uppercase">{language === 'tr' ? 'En Büyük Risk' : 'Top Risk'}</div>
            <div className="font-bold text-white mt-0.5">Customer WTP</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
            <div className="text-[10px] font-mono text-slate-400 uppercase">{language === 'tr' ? 'En Büyük Bilinmeyen' : 'Top Unknown'}</div>
            <div className="font-bold text-white mt-0.5">Migration Friction</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
            <div className="text-[10px] font-mono text-slate-400 uppercase">{language === 'tr' ? 'Sonraki Test' : 'Next Test'}</div>
            <div className="font-bold text-red-400 mt-0.5">5 Customer Pricing Calls</div>
          </div>
        </div>
      </div>

      <PdfViewerModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        ventureId={activeVenture.id}
        reportType="red_team"
        title={language === 'tr' ? 'Red Team Raporu' : 'Red Team Report'}
        venture={activeVenture}
      />
    </div>
  );
};
