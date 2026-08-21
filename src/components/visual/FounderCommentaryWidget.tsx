import React, { useState } from 'react';
import { useVenture } from '../../context/VentureContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  MessageSquarePlus, 
  Send, 
  Lightbulb, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Tag, 
  User, 
  CheckCircle2,
  FileText
} from 'lucide-react';

interface FounderCommentaryWidgetProps {
  reportType?: string;
  className?: string;
}

export const FounderCommentaryWidget: React.FC<FounderCommentaryWidgetProps> = ({
  reportType = 'general',
  className = ''
}) => {
  const { activeVenture, addFounderComment, updateFounderNotes } = useVenture();
  const { language } = useLanguage();

  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('Founder / Team');
  const [selectedCategory, setSelectedCategory] = useState<'general' | 'idea_pivot' | 'pricing_feedback' | 'market_insight'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notesText, setNotesText] = useState(activeVenture?.founderNotes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showNotesSuccess, setShowNotesSuccess] = useState(false);

  if (!activeVenture) return null;

  const comments = activeVenture.founderComments || [];

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setIsSubmitting(true);
      await addFounderComment({
        text: commentText.trim(),
        author: authorName.trim() || 'Founder',
        category: selectedCategory
      });
      setCommentText('');
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setIsSavingNotes(true);
      await updateFounderNotes(notesText);
      setShowNotesSuccess(true);
      setTimeout(() => setShowNotesSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const getCategoryLabel = (cat?: string) => {
    switch (cat) {
      case 'idea_pivot':
        return language === 'tr' ? 'Fikir Revizyonu & Pivot' : 'Idea Revision / Pivot';
      case 'pricing_feedback':
        return language === 'tr' ? 'Fiyat & Gelir Notu' : 'Pricing & Revenue Note';
      case 'market_insight':
        return language === 'tr' ? 'Pazar & Hedef Kitle' : 'Market & ICP Insight';
      default:
        return language === 'tr' ? 'Genel Yorum' : 'General Feedback';
    }
  };

  const getCategoryBadgeClass = (cat?: string) => {
    switch (cat) {
      case 'idea_pivot':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'pricing_feedback':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'market_insight':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <MessageSquarePlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'tr' ? 'Girişimcinin Proje Yorumları ve Notları' : 'Founder Insights & Idea Notes'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'tr'
                ? 'Raporlara yönelik düşüncelerinizi, müşteri geri bildirimlerinizi ekleyin; indirilen PDF raporunda yer alsın.'
                : 'Annotate the report with real-world feedback; your commentary is automatically included in the PDF.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {comments.length} {language === 'tr' ? 'Yorum' : 'Comments'}
          </span>
        </div>
      </div>

      {/* Grid: Left - Add Comment Form, Right - Quick Strategic Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Add Comment */}
        <div className="lg:col-span-7 space-y-4">
          <form onSubmit={handleAddComment} className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                {language === 'tr' ? 'Konu Başlığı:' : 'Category:'}
              </span>
              {[
                { id: 'general', labelTr: 'Genel', labelEn: 'General' },
                { id: 'idea_pivot', labelTr: 'Fikir / Pivot', labelEn: 'Idea / Pivot' },
                { id: 'pricing_feedback', labelTr: 'Fiyatlandırma', labelEn: 'Pricing' },
                { id: 'market_insight', labelTr: 'Müşteri Görüşü', labelEn: 'Customer Feedback' }
              ].map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`text-xs px-2.5 py-1 rounded-xl font-medium border transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {language === 'tr' ? cat.labelTr : cat.labelEn}
                </button>
              ))}
            </div>

            <div>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  language === 'tr'
                    ? 'Örnek: "Müşterilerle konuştum, ayda 500 TL yerine 1.500 TL vermeye hazırlar fakat WhatsApp entegrasyonu şart..."'
                    : 'Example: "Talked with 3 buyers; they are willing to pay $499/mo provided we offer direct ERP sync..."'
                }
                rows={3}
                className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder={language === 'tr' ? 'Adınız / Ekip Rolü' : 'Your name / role'}
                  className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 w-36 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{language === 'tr' ? 'Yorumu Kaydet & PDF\'e Ekle' : 'Add Note to Dossier'}</span>
              </button>
            </div>
          </form>

          {/* List of Existing Comments */}
          {comments.length > 0 && (
            <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                {language === 'tr' ? 'Kayıtlı Girişimci Yorumları:' : 'Recorded Founder Commentary:'}
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {comments.map((com) => (
                  <div
                    key={com.id}
                    className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{com.author}</span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${getCategoryBadgeClass(com.category)}`}>
                          {getCategoryLabel(com.category)}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(com.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {com.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Strategic Working Scratchpad / Notes */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                <span>{language === 'tr' ? 'Genel Proje Notları & Hedefler' : 'Executive Working Notes'}</span>
              </div>
              {showNotesSuccess && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  {language === 'tr' ? 'Kaydedildi' : 'Saved'}
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'tr'
                ? 'Bu alana yazdığınız tüm özet notlar, PDF raporunun "Girişimci Notları" bölümünde doğrudan yer alacaktır.'
                : 'Any strategic context written here will be rendered in the founder summary section of the export dossier.'}
            </p>

            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder={
                language === 'tr'
                  ? 'Fikrinizin güçlü yönleri, mevcut müşteri temasları veya önümüzdeki 30 günün hedefleri...'
                  : 'Key venture assumptions, target customer contacts, or 30-day focus milestones...'
              }
              rows={5}
              className="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSavingNotes ? (language === 'tr' ? 'Kaydediliyor...' : 'Saving...') : (language === 'tr' ? 'Notları Kaydet' : 'Save Notes')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
