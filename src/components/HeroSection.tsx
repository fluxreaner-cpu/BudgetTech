import React from 'react';
import { Search, Sparkles, TrendingDown, Cpu, ShieldCheck } from 'lucide-react';
import { Language, Currency } from '../types';
import { translations } from '../i18n';
import { currencyRates, currencySymbols, formatPrice } from '../utils/currency';

interface HeroSectionProps {
  language: Language;
  currency: Currency;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  minPrice: number | null;
  maxPrice: number | null;
  onPriceFilterChange: (min: number | null, max: number | null) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  language,
  currency,
  searchQuery,
  onSearchChange,
  minPrice,
  maxPrice,
  onPriceFilterChange,
}) => {
  const t = translations[language];
  const symbol = currencySymbols[currency];

  // Currency-native quick presets
  const getQuickPresets = () => {
    if (currency === 'RUB') {
      return [
        { label: '< 2 500 ₽', max: 2500 },
        { label: '< 5 000 ₽', max: 5000 },
        { label: '< 8 500 ₽', max: 8500 },
        { label: '< 15 000 ₽', max: 15000 },
      ];
    }
    if (currency === 'UAH') {
      return [
        { label: '< 1 000 ₴', max: 1000 },
        { label: '< 2 000 ₴', max: 2000 },
        { label: '< 3 800 ₴', max: 3800 },
        { label: '< 7 000 ₴', max: 7000 },
      ];
    }
    if (currency === 'EUR') {
      return [
        { label: '< 25 €', max: 25 },
        { label: '< 50 €', max: 50 },
        { label: '< 92 €', max: 92 }, // Specifically requested by user!
        { label: '< 150 €', max: 150 },
        { label: '< 250 €', max: 250 },
      ];
    }
    // Default USD
    return [
      { label: '< $25', max: 25 },
      { label: '< $50', max: 50 },
      { label: '< $92', max: 92 }, // Specifically requested by user!
      { label: '< $100', max: 100 },
      { label: '< $200', max: 200 },
    ];
  };

  const quickPresets = getQuickPresets();
  const hasActivePrice = minPrice !== null || maxPrice !== null;

  return (
    <section className="relative pt-12 pb-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Cyber Ambient Lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-80 bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        
        {/* Subtle 50k Database Live Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/70 border border-purple-500/40 text-purple-300 text-xs font-mono mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.2)]">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold text-white">100,000+</span>
          <span className="text-slate-400">·</span>
          <span>{t.heroBadge}</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] text-balance">
          {t.heroTitle1}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-emerald-400">
            {t.heroTitleHighlight}
          </span>{' '}
          {t.heroTitle2}
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {t.heroSubtitle}
        </p>

        {/* Instant Search Bar */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-purple-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border border-purple-500/30 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-4 text-xs font-mono text-slate-400 hover:text-white"
              >
                ESC
              </button>
            )}
          </div>

          {/* Quick Budget Filter Controls (strictly matching active currency) */}
          <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
            <span className="text-[11px] text-slate-500 font-mono mr-1">
              {t.filterPriceRange}:
            </span>
            
            <button
              type="button"
              onClick={() => onPriceFilterChange(null, null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                !hasActivePrice
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] border border-purple-400 font-bold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t.filterAllPrices}
            </button>

            {quickPresets.map((preset) => {
              const isSelected = minPrice === null && maxPrice === preset.max;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onPriceFilterChange(null, preset.max)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] border border-purple-400 font-bold'
                      : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800 hover:border-purple-500/40'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 Value Anchor Metrics */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-10 pt-8 border-t border-purple-500/15">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-400 tabular-nums">
              {t.statSavings}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {t.statSavingsDesc}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-purple-400 tabular-nums">
              {t.statDeals}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {t.statDealsDesc}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-sky-400 tabular-nums">
              {t.statPlatforms}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {t.statPlatformsDesc}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
