import React, { useEffect, useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Check, 
  ShieldCheck, 
  TrendingDown, 
  Bookmark, 
  Star, 
  Cpu, 
  Layers, 
  ThumbsUp, 
  AlertCircle,
  Sparkles,
  Headphones,
  Keyboard,
  Gamepad2
} from 'lucide-react';
import { Product, Language, Currency } from '../types';
import { translations } from '../i18n';
import { formatPrice } from '../utils/currency';

interface ProductDetailModalProps {
  product: Product | null;
  language: Language;
  currency: Currency;
  isInWishlist: boolean;
  onToggleWishlist: (product: Product) => void;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  language,
  currency,
  isInWishlist,
  onToggleWishlist,
  onClose,
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [product?.id]);
  const t = translations[language];

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  const lowestOffer = product.offers.find((o) => o.isLowest) || product.offers[0];
  const discountPercent = Math.round(
    ((product.originalPriceUsd - product.priceUsd) / product.originalPriceUsd) * 100
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#040508]/85 backdrop-blur-xl overflow-y-auto">
      {/* Background Accent glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px] pointer-events-none" />

      {/* 3D Tactile Modal Container */}
      <div 
        className="relative w-full max-w-4xl tactile-modal rounded-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col z-10"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Gradient Accent Line */}
        <div className="h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-purple-500/15 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold text-purple-300 bg-purple-950/80 border border-purple-500/40">
              {product.category.toUpperCase()}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ID: {product.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleWishlist(product)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isInWishlist
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-purple-500'
              }`}
            >
              {isInWishlist ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              <span className="hidden sm:inline">{isInWishlist ? t.inPlanner : t.addToPlanner}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
              title={t.modalClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Main Hero Split: Hardware Image & Purchasing Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Image Preview with 3D Depth */}
            <div className="w-full min-w-0">
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border border-purple-500/20 shadow-[0_15px_30px_rgba(0,0,0,0.6)] flex items-center justify-center">
                {!imageError ? (
                  <img
                    src={product.image}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none bg-gradient-to-b from-[#141829] to-[#0a0c16]">
                    <div className="p-4 rounded-2xl bg-purple-950/50 border border-purple-500/30 mb-2 text-purple-400">
                      {product.category === 'cpus' && <Cpu className="w-12 h-12" />}
                      {product.category === 'audio' && <Headphones className="w-12 h-12" />}
                      {product.category === 'peripherals' && <Keyboard className="w-12 h-12" />}
                      {product.category === 'gpus' && <Gamepad2 className="w-12 h-12" />}
                    </div>
                    <span className="text-xs font-mono uppercase tracking-wider text-purple-300 font-bold">
                      {product.category}
                    </span>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold text-emerald-300 bg-[#071310]/90 border border-emerald-500/50 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    ★ {product.valueScore} / 10 Value
                  </span>
                  {discountPercent > 0 && (
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold text-purple-300 bg-[#160b24]/90 border border-purple-500/50 backdrop-blur-md">
                      -{discountPercent}% OFF
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Title & Instant Purchase Snapshot */}
            <div className="w-full min-w-0 flex flex-col justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {product.title}
                </h2>
                <p className="text-xs sm:text-sm text-purple-300 font-medium mt-1">
                  {product.tagline[language]}
                </p>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  {product.description[language]}
                </p>
              </div>

              {/* Price & Primary CTA */}
              <div className="mt-5 pt-4 border-t border-slate-800">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
                    {formatPrice(product.priceUsd, currency)}
                  </span>
                  <span className="text-sm text-slate-500 line-through font-mono tabular-nums">
                    {formatPrice(product.originalPriceUsd, currency)}
                  </span>
                  <span className="text-xs font-mono text-purple-400 font-semibold">
                    ({formatPrice(product.originalPriceUsd - product.priceUsd, currency)} saved)
                  </span>
                </div>

                {/* Direct Link to Best Deal */}
                <a
                  href={lowestOffer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t.modalDirectBuy} ({lowestOffer.marketplace})</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <p className="text-[11px] text-emerald-400/90 flex items-center gap-1.5 mt-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{product.dealHighlight[language]}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Benchmark Performance Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                {t.modalBenchmarkTitle}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {product.benchmark.score} / {product.benchmark.maxScore} pts
              </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full"
                style={{ width: `${(product.benchmark.score / product.benchmark.maxScore) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 font-medium">
              💡 {product.benchmark.comparisonText[language]}
            </p>
          </div>

          {/* Live Marketplaces Comparison Table (AliExpress, Amazon, eBay) */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-purple-400" />
              <span>{t.modalMarketplaceTitle}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {product.offers.map((offer) => (
                <div 
                  key={offer.marketplace}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                    offer.isLowest
                      ? 'bg-purple-950/20 border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/40'
                      : offer.marketplace === 'Mindfactory'
                      ? 'bg-amber-950/15 border-amber-500/30 hover:border-amber-500/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5 gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-sm text-white truncate">
                          {offer.marketplace}
                        </span>
                        {offer.marketplace === 'Mindfactory' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                            🇩🇪 DE
                          </span>
                        )}
                      </div>
                      {offer.isLowest && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                          BEST PRICE
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-extrabold font-mono text-white tabular-nums">
                      {formatPrice(offer.priceUsd, currency)}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {offer.shipping}
                    </p>
                    {offer.couponCode && (
                      <p className="text-[10px] font-mono text-purple-300 mt-1 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/30 inline-block">
                        Promo: {offer.couponCode}
                      </p>
                    )}
                  </div>

                  <a
                    href={offer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-3 py-1.5 px-3 rounded-lg text-xs font-semibold text-center border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      offer.marketplace === 'Mindfactory'
                        ? 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 border-amber-500/40 hover:border-amber-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 hover:border-purple-500/50'
                    }`}
                  >
                    <span>{offer.marketplace}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Specifications Grid */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>{t.modalSpecsTitle}</span>
            </h3>

            <div className="rounded-xl border border-slate-800 divide-y divide-slate-800/80 bg-slate-950/60 overflow-hidden">
              {product.specs.map((spec, idx) => (
                <div key={idx} className="flex items-center justify-between px-4 py-2.5 text-xs">
                  <span className="text-slate-400 font-medium">
                    {spec.label[language]}
                  </span>
                  <span className="font-mono text-slate-200 font-semibold text-right">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pros & Cons Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pros */}
            <div className="p-4 rounded-xl bg-emerald-950/15 border border-emerald-500/20">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono mb-2.5 flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{t.modalProsTitle}</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {product.pros.map((pro, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{pro[language]}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons */}
            <div className="p-4 rounded-xl bg-rose-950/15 border border-rose-500/20">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono mb-2.5 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{t.modalConsTitle}</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {product.cons.map((con, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0">—</span>
                    <span>{con[language]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-purple-500/15 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            {t.modalLowestPriceGuaranteed}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-700 hover:text-white hover:border-slate-600 transition-colors cursor-pointer"
          >
            {t.modalClose}
          </button>
        </div>
      </div>
    </div>
  );
};
