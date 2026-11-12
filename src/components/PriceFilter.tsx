import React, { useState, useEffect } from 'react';
import { Currency, Language } from '../types';
import { currencyRates, currencySymbols, formatPrice } from '../utils/currency';
import { translations } from '../i18n';
import { Sliders, X, Check, ArrowRight } from 'lucide-react';

interface PriceFilterProps {
  currency: Currency;
  language: Language;
  minPrice: number | null;
  maxPrice: number | null;
  onPriceFilterChange: (min: number | null, max: number | null) => void;
  totalFilteredCount: number;
}

export const PriceFilter: React.FC<PriceFilterProps> = ({
  currency,
  language,
  minPrice,
  maxPrice,
  onPriceFilterChange,
  totalFilteredCount,
}) => {
  const t = translations[language];
  const rate = currencyRates[currency];
  const symbol = currencySymbols[currency];

  // Local draft inputs for manual typing
  const [minInput, setMinInput] = useState<string>(minPrice !== null ? String(minPrice) : '');
  const [maxInput, setMaxInput] = useState<string>(maxPrice !== null ? String(maxPrice) : '');

  // Keep local inputs in sync when external price filter changes
  useEffect(() => {
    setMinInput(minPrice !== null ? String(minPrice) : '');
  }, [minPrice]);

  useEffect(() => {
    setMaxInput(maxPrice !== null ? String(maxPrice) : '');
  }, [maxPrice]);

  // Dynamic presets adapted to currency
  const getPresets = () => {
    if (currency === 'RUB') {
      return [
        { label: '< 2 500 ₽', max: 2500 },
        { label: '< 5 000 ₽', max: 5000 },
        { label: '< 8 500 ₽', max: 8500 },
        { label: '< 15 000 ₽', max: 15000 },
        { label: '< 25 000 ₽', max: 25000 },
      ];
    }
    if (currency === 'UAH') {
      return [
        { label: '< 1 000 ₴', max: 1000 },
        { label: '< 2 000 ₴', max: 2000 },
        { label: '< 3 800 ₴', max: 3800 },
        { label: '< 6 500 ₴', max: 6500 },
        { label: '< 10 000 ₴', max: 10000 },
      ];
    }
    if (currency === 'EUR') {
      return [
        { label: '< 30 €', max: 30 },
        { label: '< 60 €', max: 60 },
        { label: '< 100 €', max: 100 },
        { label: '< 200 €', max: 200 },
        { label: '< 300 €', max: 300 },
      ];
    }
    // Default USD
    return [
      { label: '< $30', max: 30 },
      { label: '< $60', max: 60 },
      { label: '< $100', max: 100 },
      { label: '< $200', max: 200 },
      { label: '< $300', max: 300 },
    ];
  };

  const handleApplyInputs = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const minVal = minInput.trim() !== '' ? Math.max(0, parseFloat(minInput)) : null;
    const maxVal = maxInput.trim() !== '' ? Math.max(0, parseFloat(maxInput)) : null;

    if (minVal !== null && maxVal !== null && minVal > maxVal) {
      onPriceFilterChange(maxVal, minVal);
    } else {
      onPriceFilterChange(
        minVal !== null && !isNaN(minVal) ? minVal : null,
        maxVal !== null && !isNaN(maxVal) ? maxVal : null
      );
    }
  };

  const handleClear = () => {
    setMinInput('');
    setMaxInput('');
    onPriceFilterChange(null, null);
  };

  const presets = getPresets();
  const hasActiveFilter = minPrice !== null || maxPrice !== null;

  // Maximum slider boundary based on currency
  const sliderMax = Math.round(500 * rate);

  return (
    <div className="bg-slate-900/90 border border-purple-500/20 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.4)] mb-6">
      
      {/* Top Header of Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-500/15">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              {t.priceRangeSlider} ({currency})
            </span>
            <span className="text-[11px] text-slate-400 ml-2 font-mono">
              [100% Real-time Filter]
            </span>
          </div>
        </div>

        {/* Live Filter Indicator Badge */}
        <div className="flex items-center gap-2">
          {hasActiveFilter && (
            <div className="flex items-center gap-2 bg-purple-950/80 border border-purple-500/40 px-2.5 py-1 rounded-xl text-xs font-mono text-purple-300">
              <span>
                {minPrice !== null ? `${minPrice} ${symbol}` : `0 ${symbol}`}
                {' — '}
                {maxPrice !== null ? `${maxPrice} ${symbol}` : `∞`}
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-white p-0.5"
                title="Clear filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="text-xs font-mono text-emerald-400">
            <span className="font-bold tabular-nums">{totalFilteredCount.toLocaleString()}</span> {language === 'ru' ? 'позиций' : 'items'}
          </div>
        </div>
      </div>

      {/* Row: Quick Preset Chips + Exact Custom Inputs */}
      <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Preset Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleClear}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium font-mono transition-all cursor-pointer ${
              !hasActiveFilter
                ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-purple-400 font-bold'
                : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {t.filterAllPrices}
          </button>

          {presets.map((preset) => {
            const isSelected = minPrice === null && maxPrice === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onPriceFilterChange(null, preset.max);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-purple-400 font-bold scale-[1.02]'
                    : 'bg-slate-950/80 text-slate-300 hover:text-white hover:border-purple-500/40 border border-slate-800'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom Exact Price Inputs (Min - Max with Apply) */}
        <form onSubmit={handleApplyInputs} className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-500 pointer-events-none">
              {symbol}
            </span>
            <input
              type="number"
              min={0}
              placeholder="Min"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              className="w-20 pl-6 pr-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
            />
          </div>

          <span className="text-slate-600 font-mono">—</span>

          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-500 pointer-events-none">
              {symbol}
            </span>
            <input
              type="number"
              min={0}
              placeholder="Max"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              className="w-20 pl-6 pr-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-mono rounded-xl transition-all shadow-[0_0_12px_rgba(168,85,247,0.3)] cursor-pointer flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>OK</span>
          </button>
        </form>

      </div>

      {/* Interactive Range Slider */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
          <span>0 {symbol}</span>
          <span className="text-purple-300 font-bold">
            {language === 'ru' ? 'Макс. порог' : 'Max Cutoff'}: {maxPrice !== null ? `${maxPrice} ${symbol}` : `${language === 'ru' ? 'Без лимита' : 'No Limit'}`}
          </span>
          <span>{sliderMax} {symbol}+</span>
        </div>
        <input
          type="range"
          min={10}
          max={sliderMax}
          step={currency === 'RUB' ? 250 : currency === 'UAH' ? 100 : 5}
          value={maxPrice !== null ? maxPrice : sliderMax}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (val >= sliderMax) {
              onPriceFilterChange(minPrice, null);
            } else {
              onPriceFilterChange(minPrice, val);
            }
          }}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
      </div>

    </div>
  );
};
