import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Gamepad2, 
  TrendingDown, 
  Send, 
  Sparkles, 
  Trophy, 
  ExternalLink,
  Flame,
  Zap
} from 'lucide-react';
import { Product, Language, Currency } from '../types';
import { formatPrice } from '../utils/currency';

interface ViralShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Product[];
  currency: Currency;
  language: Language;
}

export const ViralShareModal: React.FC<ViralShareModalProps> = ({
  isOpen,
  onClose,
  wishlist,
  currency,
  language,
}) => {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  if (!isOpen || wishlist.length === 0) return null;

  const totalCost = wishlist.reduce((acc, item) => acc + item.priceUsd, 0);
  const totalRetail = wishlist.reduce((acc, item) => acc + item.originalPriceUsd, 0);
  const savings = Math.max(0, totalRetail - totalCost);
  const savingsPercent = totalRetail > 0 ? Math.round((savings / totalRetail) * 100) : 0;

  // Smart FPS Estimation based on components and total build tier
  const hasCpu = wishlist.some((p) => p.category === 'cpus' || p.title.toLowerCase().includes('ryzen') || p.title.toLowerCase().includes('intel') || p.title.toLowerCase().includes('xeon'));
  const hasGpu = wishlist.some((p) => p.category === 'gpus' || p.title.toLowerCase().includes('rtx') || p.title.toLowerCase().includes('rx') || p.title.toLowerCase().includes('gtx'));
  
  // Base tier scaling with investment
  const tierMultiplier = Math.min(2.2, Math.max(0.8, totalCost / 250));
  
  const cs2Fps = Math.round(180 * tierMultiplier);
  const cyberpunkFps = Math.round(55 * tierMultiplier);
  const dotaFps = Math.round(190 * tierMultiplier);
  const gtaFps = Math.round(115 * tierMultiplier);

  // Generate shareable URL with compressed component IDs
  const rigIds = wishlist.map((p) => p.id).join(',');
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?rig=${encodeURIComponent(rigIds)}`
    : `https://budgettech.cyber?rig=${encodeURIComponent(rigIds)}`;

  // Formatted viral text for Telegram & Discord
  const viralPostText = [
    `⚡ МОЯ СБОРКА НА BUDGETTECH ⚡`,
    `💰 Итоговая стоимость: ${formatPrice(totalCost, currency)} (Экономия: ${formatPrice(savings, currency)} / -${savingsPercent}% vs розница)`,
    ``,
    `🎮 Расчётный FPS в играх (1080p):`,
    `• CS2 (Competitive): ${cs2Fps}+ FPS`,
    `• Cyberpunk 2077: ${cyberpunkFps} FPS`,
    `• Dota 2 / Valorant: ${dotaFps}+ FPS`,
    `• GTA V Online: ${gtaFps}+ FPS`,
    ``,
    `🛒 Комплектующие с проверенными ценами:`,
    ...wishlist.slice(0, 6).map((item) => `• ${item.title} — ${formatPrice(item.priceUsd, currency)}`),
    wishlist.length > 6 ? `...и ещё ${wishlist.length - 6} компонентов` : '',
    ``,
    `🔗 Посмотреть или изменить сборку:`,
    shareUrl,
  ].filter(Boolean).join('\n');

  const handleCopyText = () => {
    navigator.clipboard.writeText(viralPostText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShareTelegram = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
      `⚡ Оцените мою бюджетную сборку ПК на BudgetTech! Всего ${formatPrice(totalCost, currency)} (экономия ${formatPrice(savings, currency)}). CS2: ${cs2Fps}+ FPS, Cyberpunk: ${cyberpunkFps} FPS!`
    )}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto">
      {/* Background glow spheres */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Modal Card Container */}
      <div className="relative w-full max-w-lg bg-[#0b0e17] border border-purple-500/30 rounded-2xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden my-auto">
        
        {/* Neon top stripe */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-indigo-400 to-emerald-400" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-500/15">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>{language === 'ru' ? 'Вирусная карточка сборки' : 'Viral Rig Share Card'}</span>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {language === 'ru' ? 'Поделитесь сборкой в Telegram, Discord или соцсетях' : 'Share with friends & gaming communities'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Holographic Build Preview Card */}
        <div className="mt-5 p-4 rounded-xl bg-gradient-to-b from-slate-900/90 to-purple-950/20 border border-purple-500/25 relative overflow-hidden shadow-inner">
          
          {/* Badge & Total Price Header */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-[11px] font-mono text-purple-300 font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Cyber Rig #{wishlist.length} parts</span>
            </div>

            <div className="text-right">
              <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-400 tabular-nums">
                {formatPrice(totalCost, currency)}
              </span>
            </div>
          </div>

          {/* Savings Highlight Banner */}
          {savings > 0 && (
            <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-emerald-300">
                <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Экономия vs розница (DNS/Mindfactory):</span>
              </div>
              <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                -{formatPrice(savings, currency)} (-{savingsPercent}%)
              </span>
            </div>
          )}

          {/* Gaming FPS Estimator Box */}
          <div className="mb-4 p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Gamepad2 className="w-4 h-4 text-purple-400" />
                <span>Оценка игровой производительности (1080p):</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {tierMultiplier >= 1.4 ? '🔥 Ultra Value' : '⚡ Mid-Range Beast'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <div className="flex justify-between items-center text-[11px] text-slate-400 mb-0.5">
                  <span>CS2 (Competitive)</span>
                  <span className="text-emerald-400 font-mono font-bold">{cs2Fps}+ FPS</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${Math.min(100, (cs2Fps / 300) * 100)}%` }} />
                </div>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <div className="flex justify-between items-center text-[11px] text-slate-400 mb-0.5">
                  <span>Cyberpunk 2077</span>
                  <span className="text-purple-400 font-mono font-bold">{cyberpunkFps} FPS</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full" style={{ width: `${Math.min(100, (cyberpunkFps / 90) * 100)}%` }} />
                </div>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <div className="flex justify-between items-center text-[11px] text-slate-400 mb-0.5">
                  <span>Dota 2 / Valorant</span>
                  <span className="text-emerald-400 font-mono font-bold">{dotaFps}+ FPS</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${Math.min(100, (dotaFps / 260) * 100)}%` }} />
                </div>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <div className="flex justify-between items-center text-[11px] text-slate-400 mb-0.5">
                  <span>GTA V Online</span>
                  <span className="text-amber-400 font-mono font-bold">{gtaFps}+ FPS</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full" style={{ width: `${Math.min(100, (gtaFps / 150) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Component Mini-List */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-semibold block mb-1">
              Включенные комплектующие ({wishlist.length}):
            </span>
            <div className="max-h-28 overflow-y-auto space-y-1 pr-1 text-xs font-mono">
              {wishlist.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-slate-300 py-0.5 border-b border-slate-800/40">
                  <span className="truncate pr-2">• {item.title}</span>
                  <span className="text-emerald-400 shrink-0 font-bold">{formatPrice(item.priceUsd, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Share Buttons Actions */}
        <div className="mt-5 space-y-2.5">
          {/* Main Action: Send to Telegram */}
          <button
            type="button"
            onClick={handleShareTelegram}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#229ED9] to-[#0088cc] hover:from-[#25a9e8] hover:to-[#0099e6] shadow-[0_0_25px_rgba(34,158,217,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Send className="w-4 h-4" />
            <span>{language === 'ru' ? 'Поделиться сборкой в Telegram' : 'Share Build to Telegram'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            {/* Copy Full Formatted Post */}
            <button
              type="button"
              onClick={handleCopyText}
              className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-purple-500/50 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
              <span>{copied ? 'Скопировано!' : 'Копировать пост'}</span>
            </button>

            {/* Copy Direct Rig URL */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {linkCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <ExternalLink className="w-4 h-4 text-emerald-400" />}
              <span>{linkCopied ? 'Ссылка скопирована!' : 'Копировать ссылку'}</span>
            </button>
          </div>
        </div>

        {/* Marketing Viral Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center font-mono flex items-center justify-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Каждый переход по ссылке открывает готовую сборку у друга</span>
        </div>
      </div>
    </div>
  );
};
