import React, { useState } from 'react';
import { useVenture } from '../context/VentureContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { AgentIdentity } from '../components/visual/AgentIdentity';
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Plus,
  Minus,
  Search,
  TrendingUp,
  ShieldAlert,
  Scale,
  Zap,
  HelpCircle,
  CheckCircle,
  SkipForward
} from 'lucide-react';

export const IdeaInputView: React.FC = () => {
  const {
    activeVenture,
    createVentureFromIntake,
    answerQuestion,
    skipQuestion,
    finalizeIntake,
    runAnalysis,
    isIntaking,
    isAnalyzing
  } = useVenture();
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  const [idea, setIdea] = useState('');
  const [targetCustomer, setTargetCustomer] = useState('');
  const [geography, setGeography] = useState('');
  const [context, setContext] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');

  const sampleIdeas = language === 'tr' ? [
    {
      label: 'Klinik Deney Yapay Zekası',
      text: 'Onkoloji klinikleri ile biyoteknoloji sponsorlarını eşleştirerek klinik deney hasta alım gecikmelerini sıfırlayan yapay zeka platformu.'
    },
    {
      label: 'DevSecOps Güvenlik Denetçisi',
      text: 'Kod olarak altyapı (IaC) değişikliklerinde IAM yetki yükseltme açıklarını üretime geçmeden önce engelleyen otomatik güvenlik denetçisi.'
    },
    {
      label: 'Tedarik Zinciri FinTech',
      text: 'Otomotiv yan sanayi üreticilerine araç ve sipariş telemetrisine dayalı anında işletme sermayesi faktoringi sağlayan B2B finansman platformu.'
    }
  ] : [
    {
      label: 'Clinical Trial AI',
      text: 'AI-automated clinical trial matching engine connecting community oncology clinics with biotech sponsors to eliminate enrollment delays.'
    },
    {
      label: 'DevSecOps Guard',
      text: 'Automated infrastructure-as-code compliance auditor that catches IAM privilege escalation vulnerabilities before merging to production.'
    },
    {
      label: 'Supply Chain FinTech',
      text: 'Dynamic factoring platform providing instant working capital financing to Tier-2 automotive suppliers based on real-time telematics.'
    }
  ];

  const handleAnalyzeIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim() || isProcessing || isIntaking || isAnalyzing) return;

    setIsProcessing(true);
    try {
      const newVenture = await createVentureFromIntake({
        idea: idea.trim(),
        targetCustomer: targetCustomer.trim() || undefined,
        geography: geography.trim() || undefined,
        context: context.trim() || undefined
      });

      if (newVenture && newVenture.id) {
        // If no questions generated, run analysis directly
        if (!newVenture.criticalQuestions || newVenture.criticalQuestions.length === 0) {
          await runAnalysis(newVenture.id);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const isBusy = isProcessing || isIntaking || isAnalyzing;

  // Check if active venture is in clarifying stage
  const isClarifying = activeVenture?.status === 'clarifying' && activeVenture.criticalQuestions && activeVenture.criticalQuestions.length > 0;
  const unansweredQuestions = activeVenture?.criticalQuestions?.filter(q => !q.isAnswered && !q.isSkipped) || [];
  const currentQuestion = unansweredQuestions[0];

  const handleAnswerSubmit = async () => {
    if (!activeVenture || !currentQuestion || !currentAnswer.trim()) return;
    await answerQuestion(currentQuestion.id, currentAnswer.trim());
    setCurrentAnswer('');
  };

  const handleSkip = async () => {
    if (!activeVenture || !currentQuestion) return;
    await skipQuestion(currentQuestion.id);
    setCurrentAnswer('');
  };

  const handleLaunchPipeline = async () => {
    if (!activeVenture) return;
    await finalizeIntake();
    await runAnalysis(activeVenture.id);
  };

  return (
    <div id="view-idea-input" className="max-w-3xl mx-auto py-6 sm:py-10 space-y-8 animate-fade-in">
      {/* Workspace Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.common.appName}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          {t.input.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
          {t.input.subtitle}
        </p>
      </div>

      {/* CLARIFYING Q&A INTERLUDE IF ACTIVE */}
      {isClarifying && currentQuestion ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-red-600 dark:text-red-400 font-mono uppercase">
              <HelpCircle className="w-4 h-4 text-red-500" />
              <span>{t.input.clarifyingTitle} ({unansweredQuestions.length} remaining)</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">{activeVenture.title}</span>
          </div>

          <div className="space-y-3">
            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              {currentQuestion.question}
            </div>
            {currentQuestion.whyItMatters && (
              <div className="text-xs text-slate-500 font-mono">
                {currentQuestion.whyItMatters}
              </div>
            )}
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder={t.input.answerPlaceholder}
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-red-500"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleSkip}
              className="px-3 py-2 rounded-lg text-xs font-mono font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>{t.input.skipQuestion}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                disabled={!currentAnswer.trim()}
                onClick={handleAnswerSubmit}
                className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 transition-all disabled:opacity-40 cursor-pointer"
              >
                {t.input.submitAnswer}
              </button>
              <button
                onClick={handleLaunchPipeline}
                className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-red-600 hover:bg-red-500 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{t.input.finalizePipelineBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* MAIN SINGLE-INPUT WORKSPACE CARD */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* Sample Idea Quick Starters */}
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono">
              <Zap className="w-3 h-3 text-red-500" />
              {t.input.quickPromptsTitle}:
            </span>
            {sampleIdeas.map((s, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isBusy}
                onClick={() => setIdea(s.text)}
                className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
              >
                {s.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleAnalyzeIdea} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="idea-input"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono"
              >
                {t.input.ideaLabel} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="idea-input"
                disabled={isBusy}
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder={t.input.ideaPlaceholder}
                rows={4}
                required
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-hidden focus:border-red-500/80 focus:ring-1 focus:ring-red-500/50 transition-all font-sans leading-relaxed"
              />
            </div>

            {/* Optional Granular Parameters Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setShowOptionalFields(!showOptionalFields)}
                className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 flex items-center space-x-1.5 transition-colors cursor-pointer font-mono"
              >
                {showOptionalFields ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{showOptionalFields ? 'Hide Additional Context' : '+ Add Target ICP / Geography'}</span>
              </button>

              {showOptionalFields && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {t.input.targetCustomerLabel}
                    </label>
                    <input
                      type="text"
                      disabled={isBusy}
                      value={targetCustomer}
                      onChange={(e) => setTargetCustomer(e.target.value)}
                      placeholder={t.input.targetCustomerPlaceholder}
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {t.input.geographyLabel}
                    </label>
                    <input
                      type="text"
                      disabled={isBusy}
                      value={geography}
                      onChange={(e) => setGeography(e.target.value)}
                      placeholder={t.input.geographyPlaceholder}
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-red-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Launch Pipeline CTA */}
            <div className="pt-2">
              <button
                id="btn-submit-idea"
                type="submit"
                disabled={isBusy || !idea.trim()}
                className={`w-full py-3.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-xs cursor-pointer ${
                  isBusy || !idea.trim()
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.common.loading}</span>
                  </>
                ) : (
                  <>
                    <span>{t.pipeline.title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pipeline Agents Info Footprint */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
          <AgentIdentity agent="RESEARCHER" showRole={true} />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {t.agents.researcher.description}
          </p>
        </div>

        <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
          <AgentIdentity agent="BUSINESS" showRole={true} />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {t.agents.business.description}
          </p>
        </div>

        <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
          <AgentIdentity agent="RED_TEAM" showRole={true} />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {t.agents.redTeam.description}
          </p>
        </div>

        <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
          <AgentIdentity agent="JUDGE" showRole={true} />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {t.agents.judge.description}
          </p>
        </div>
      </div>
    </div>
  );
};
