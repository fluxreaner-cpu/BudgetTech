import React, { useState, useRef, useEffect } from 'react';
import { 
  Globe, 
  ChevronDown, 
  LogOut, 
  Cpu, 
  Layers, 
  Sparkles,
  Bookmark
} from 'lucide-react';
import { Language, Currency, UserSession } from '../types';
import { translations } from '../i18n';
import { formatPrice } from '../utils/currency';

interface NavbarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  currency: Currency;
  onCurrencyChange: (curr: Currency) => void;
  userSession: UserSession | null;
  onLogout: () => void;
  wishlistCount: number;
  onOpenWishlist: () => void;
  onSelectCategory: (category: any) => void;
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageChange,
  currency,
  onCurrencyChange,
  userSession,
  onLogout,
  wishlistCount,
  onOpenWishlist,
  onSelectCategory,
  onOpenAuth,
}) => {
  const t = translations[language];
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  const displayName = userSession?.isGuest 
    ? t.guestNameDefault 
    : (userSession?.name || t.guestNameDefault);

  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const currRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
      if (currRef.current && !currRef.current.contains(event.target as Node)) {
        setIsCurrencyOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languageLabels: Record<Language, { label: string; flag: string }> = {
    en: { label: 'English', flag: '🇬🇧' },
    de: { label: 'Deutsch', flag: '🇩🇪' },
    ru: { label: 'Русский', flag: '🇷🇺' },
    uk: { label: 'Українська', flag: '🇺🇦' },
  };

  const currencies: Currency[] = ['USD', 'EUR', 'RUB', 'UAH'];

  return (
    <header className="sticky top-0 z-40 bg-[#080a0f]/90 backdrop-blur-xl border-b border-purple-500/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single-element Brand Wordmark */}
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onSelectCategory('all'); }}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-[0_0_15px_rgba(168,85,247,0.35)] group-hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] transition-all">
            <Cpu className="w-4 h-4 text-emerald-300" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-white flex items-center">
            Budget<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400">Tech</span>
          </span>
        </a>

        {/* Zone 2: Clean 4–5 single-line Nav category links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button 
            type="button" 
            onClick={() => onSelectCategory('all')}
            className="hover:text-purple-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.categoryAll}
          </button>
          <button 
            type="button" 
            onClick={() => onSelectCategory('cpus')}
            className="hover:text-purple-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.categoryCpus}
          </button>
          <button 
            type="button" 
            onClick={() => onSelectCategory('audio')}
            className="hover:text-purple-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.categoryAudio}
          </button>
          <button 
            type="button" 
            onClick={() => onSelectCategory('peripherals')}
            className="hover:text-purple-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.categoryPeripherals}
          </button>
          <button 
            type="button" 
            onClick={() => onSelectCategory('gpus')}
            className="hover:text-purple-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.categoryGpus}
          </button>
        </nav>

        {/* Zone 3: Interactive Affordances & User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Currency Switcher */}
          <div className="relative" ref={currRef}>
            <button
              type="button"
              onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono font-medium text-slate-200 hover:border-purple-500/50 hover:text-white transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>{currency}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isCurrencyOpen && (
              <div className="absolute right-0 mt-2 w-28 bg-[#0e111c] border border-purple-500/30 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] py-1.5 z-50">
                {currencies.map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => {
                      onCurrencyChange(curr);
                      setIsCurrencyOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs font-mono flex items-center justify-between transition-colors cursor-pointer ${
                      currency === curr
                        ? 'bg-purple-600/20 text-purple-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{curr}</span>
                    {currency === curr && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Switcher Dropdown (English, Deutsch, Русский, Українська) */}
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-200 hover:border-purple-500/50 hover:text-white transition-all cursor-pointer whitespace-nowrap shrink-0"
              title="Select Language"
            >
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>{languageLabels[language].flag} {language.toUpperCase()}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-[#0e111c] border border-purple-500/30 rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.8)] py-1.5 z-50">
                {(Object.keys(languageLabels) as Language[]).map((langKey) => (
                  <button
                    key={langKey}
                    type="button"
                    onClick={() => {
                      onLanguageChange(langKey);
                      setIsLangOpen(false);
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      language === langKey
                        ? 'bg-purple-600/20 text-purple-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{languageLabels[langKey].flag}</span>
                      <span>{languageLabels[langKey].label}</span>
                    </div>
                    {language === langKey && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rig Builder / Wishlist Drawer Button */}
          <button
            type="button"
            onClick={onOpenWishlist}
            className="relative p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/40 transition-all cursor-pointer"
            title={t.plannerTitle}
          >
            <Bookmark className="w-4 h-4" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.7)]">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar & Dropdown */}
          {userSession && userSession.isLoggedIn ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full bg-slate-900/90 border border-purple-500/30 hover:border-purple-500/70 hover:shadow-[0_0_15px_rgba(168,85,247,0.25)] transition-all cursor-pointer"
              >
                {/* Round Avatar */}
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-400 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-slate-200 hidden sm:inline-block max-w-[110px] truncate">
                  {displayName}
                </span>
                {userSession.isVerified && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" title="Verified" />
                )}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Profile Dropdown Panel */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#0e111c] border border-purple-500/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-4 z-50">
                  {/* User Lockup */}
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-400 flex items-center justify-center text-white text-sm font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-white truncate">
                          {displayName}
                        </p>
                        {userSession.isVerified && (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.2 rounded">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        {userSession.email}
                      </p>
                    </div>
                  </div>

                  {/* Profile Telemetry */}
                  <div className="py-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>{t.profileItemsInWishlist}</span>
                      <span className="font-mono text-purple-300 font-bold">{wishlistCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>{t.profileCurrency}</span>
                      <span className="font-mono text-emerald-300 font-bold">{currency}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>{t.profileEstimatedSavings}</span>
                      <span className="font-mono text-emerald-400 font-bold">~{formatPrice(124, currency)}</span>
                    </div>
                  </div>

                  {/* If Guest: Prompt to register real account */}
                  {userSession.isGuest && onOpenAuth && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onOpenAuth();
                      }}
                      className="w-full mb-2 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t.tabRegister}</span>
                    </button>
                  )}

                  {/* Rig Planner Quick Action */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenWishlist();
                    }}
                    className="w-full mb-2 py-2 px-3 rounded-xl bg-purple-600/15 border border-purple-500/30 text-purple-300 hover:bg-purple-600/25 transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{t.plannerTitle} ({wishlistCount})</span>
                  </button>

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t.logoutButton}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)]"
              >
                {t.tabLogin}
              </button>
            )
          )}

        </div>
      </div>
    </header>
  );
};
