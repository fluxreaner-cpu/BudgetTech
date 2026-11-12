import React, { useState } from 'react';
import { 
  Bookmark, 
  Check, 
  TrendingDown, 
  Eye,
  Cpu,
  Headphones,
  Keyboard,
  Gamepad2
} from 'lucide-react';
import { Product, Language, Currency, Category } from '../types';
import { translations } from '../i18n';
import { formatPrice } from '../utils/currency';

interface ProductCardProps {
  product: Product;
  language: Language;
  currency: Currency;
  isInWishlist: boolean;
  onToggleWishlist: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  language,
  currency,
  isInWishlist,
  onToggleWishlist,
  onSelectProduct,
}) => {
  const t = translations[language];
  const lowestOffer = product.offers.find((o) => o.isLowest) || product.offers[0];
  const discountPercent = Math.round(
    ((product.originalPriceUsd - product.priceUsd) / product.originalPriceUsd) * 100
  );

  const [imageError, setImageError] = useState(false);

  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
      case 'cpus':
        return <Cpu className="w-10 h-10 text-purple-400 opacity-60" />;
      case 'audio':
        return <Headphones className="w-10 h-10 text-emerald-400 opacity-60" />;
      case 'peripherals':
        return <Keyboard className="w-10 h-10 text-indigo-400 opacity-60" />;
      case 'gpus':
        return <Gamepad2 className="w-10 h-10 text-cyan-400 opacity-60" />;
      default:
        return <Cpu className="w-10 h-10 text-purple-400 opacity-60" />;
    }
  };

  return (
    <div 
      onClick={() => onSelectProduct(product)}
      className="tactile-card rounded-2xl overflow-hidden flex flex-col cursor-pointer group relative transition-all duration-300 hover:border-purple-500/50"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectProduct(product);
        }
      }}
    >
      {/* Top Holographic Corner Ribbon */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 flex-wrap max-w-[70%] pointer-events-none">
        <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold text-emerald-300 bg-[#071310]/90 border border-emerald-500/40 backdrop-blur-md shadow-[0_0_12px_rgba(16,185,129,0.25)]">
          ★ {product.valueScore} / 10
        </span>
        {discountPercent > 0 && (
          <span className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold text-purple-300 bg-[#160b24]/90 border border-purple-500/40 backdrop-blur-md">
            -{discountPercent}% {t.savePercent}
          </span>
        )}
      </div>

      {/* Wishlist / Rig Builder Quick Toggle */}
      <div className="absolute top-3 right-3 z-20">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`p-2 rounded-xl backdrop-blur-md transition-all duration-200 cursor-pointer ${
            isInWishlist
              ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)] border border-purple-400'
              : 'bg-slate-900/85 text-slate-400 hover:text-white border border-slate-700/60 hover:border-purple-500/60'
          }`}
          title={isInWishlist ? t.inPlanner : t.addToPlanner}
        >
          {isInWishlist ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>

      {/* 3D Hardware Image Container with Zero-Broken-Image Fallback */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-slate-900 via-[#0a0d17] to-slate-950 flex items-center justify-center">
        {!imageError ? (
          <img
            src={product.image}
            alt={product.title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#121626] to-[#0a0c16] text-center select-none">
            <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/20 mb-2">
              {getCategoryIcon(product.category)}
            </div>
            <span className="text-xs font-mono uppercase tracking-wider text-purple-300/80">
              {product.category}
            </span>
            <span className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">
              {product.title}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0d101a] via-transparent to-transparent opacity-85 pointer-events-none" />
        
        {/* Marketplace Best Deal Callout overlay */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-slate-300 pointer-events-none">
          <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-semibold truncate max-w-[65%]">
            <TrendingDown className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t.lowestOn} {lowestOffer.marketplace}</span>
          </div>
          <div className="text-slate-400 text-[10px] truncate max-w-[35%] text-right font-mono">
            {lowestOffer.shipping}
          </div>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Clean Unboxed Metadata with · separator & truncation */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1.5 overflow-hidden">
            <span className="uppercase tracking-wider text-[11px] text-purple-400 font-mono shrink-0">
              {product.category}
            </span>
            <span aria-hidden="true" className="text-slate-600 shrink-0">·</span>
            <span className="truncate">{product.specs[0]?.value}</span>
            {product.specs[1] && (
              <>
                <span aria-hidden="true" className="text-slate-600 shrink-0">·</span>
                <span className="truncate">{product.specs[1]?.value}</span>
              </>
            )}
          </div>

          {/* Product Title */}
          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
            {product.title}
          </h3>

          {/* Tagline */}
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed min-h-[2rem]">
            {product.tagline[language]}
          </p>

          {/* Value Benchmark Gauge */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-400 truncate max-w-[190px]">
                {product.benchmark.metricName[language]}
              </span>
              <span className="font-mono text-emerald-400 font-bold tabular-nums">
                {product.benchmark.score}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${product.benchmark.score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Price & Action Row */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <div className="truncate">
            <div className="flex items-baseline gap-1.5 sm:gap-2 truncate">
              <span className="text-lg sm:text-xl font-extrabold font-mono text-white tabular-nums tracking-tight">
                {formatPrice(product.priceUsd, currency)}
              </span>
              <span className="text-xs text-slate-500 line-through font-mono tabular-nums truncate">
                {formatPrice(product.originalPriceUsd, currency)}
              </span>
            </div>
          </div>

          {/* Inspect / View Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectProduct(product);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-300 bg-purple-600/15 border border-purple-500/30 group-hover:bg-purple-600 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t.inspectDetails}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
