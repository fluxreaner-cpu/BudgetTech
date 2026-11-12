/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Language, 
  Currency, 
  Category, 
  Product, 
  UserSession 
} from './types';
import { translations } from './i18n';
import { currencyRates } from './utils/currency';
import { 
  initializeCatalog50k, 
  expandToFullProduct, 
  CompactProduct,
  TOTAL_CATALOG_SIZE
} from './data/databaseEngine';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { BuildPlannerDrawer } from './components/BuildPlannerDrawer';
import { AuthModal } from './components/AuthModal';
import { Pagination } from './components/Pagination';
import { PriceFilter } from './components/PriceFilter';
import { BrandSelectorModal } from './components/BrandSelectorModal';
import { 
  Cpu, 
  Headphones, 
  Keyboard, 
  Gamepad2, 
  LayoutGrid, 
  SlidersHorizontal,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Database,
  Filter
} from 'lucide-react';

export default function App() {
  // Session & Authentication
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('budgettech_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Language state
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('budgettech_lang');
      return (saved as Language) || 'ru';
    } catch {
      return 'ru';
    }
  });

  // Currency state
  const [currency, setCurrency] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem('budgettech_curr');
      return (saved as Currency) || 'USD';
    } catch {
      return 'USD';
    }
  });

  // Catalog Filtering & Search across 50,000 items
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real Price Filter states (in active currency: e.g. min/max in USD, EUR, RUB, or UAH)
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const [sortBy, setSortBy] = useState<'value' | 'price-asc' | 'price-desc' | 'discount'>('value');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  
  // Pagination State for 50k dataset
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 24;

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Restore and validate server-verified user profile on mount
  useEffect(() => {
    const token = localStorage.getItem('budgettech_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.user) {
            setUserSession(data.user);
            localStorage.setItem('budgettech_user_session', JSON.stringify(data.user));
          }
        })
        .catch((err) => console.error('Failed to restore session:', err));
    }
  }, []);

  // Close sorting dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Saved Rig / Wishlist
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('budgettech_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Initialize the 50,000 products catalog index once
  const catalog50k: CompactProduct[] = useMemo(() => {
    return initializeCatalog50k();
  }, []);

  // Compute category counts across the 50k database
  const categoryCounts = useMemo(() => {
    const counts = { all: catalog50k.length, cpus: 0, audio: 0, peripherals: 0, gpus: 0 };
    for (let i = 0; i < catalog50k.length; i++) {
      const cat = catalog50k[i].category;
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    }
    return counts;
  }, [catalog50k]);

  // Handle Viral Shared Rig URL parameter (?rig=id1,id2,...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const rigParam = params.get('rig');
      if (rigParam) {
        const ids = rigParam.split(',').map((id) => id.trim()).filter(Boolean);
        if (ids.length > 0) {
          const matchedProducts: Product[] = [];
          for (const id of ids) {
            const compact = catalog50k.find((p) => p.id === id);
            if (compact) {
              matchedProducts.push(expandToFullProduct(compact));
            }
          }
          if (matchedProducts.length > 0) {
            setWishlist(matchedProducts);
            localStorage.setItem('budgettech_wishlist', JSON.stringify(matchedProducts));
            setIsWishlistOpen(true);
          }
        }
      }
    } catch (err) {
      console.warn('Failed parsing shared rig URL:', err);
    }
  }, [catalog50k]);

  // Exact brand item counts for the 50,000 items database
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (let i = 0; i < catalog50k.length; i++) {
      const b = catalog50k[i].brand;
      counts[b] = (counts[b] || 0) + 1;
    }
    return counts;
  }, [catalog50k]);

  // Available brands list
  const availableBrands = useMemo(() => {
    return Object.keys(brandCounts).sort();
  }, [brandCounts]);

  // Sync Language & Currency to localStorage
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('budgettech_lang', lang);
  };

  const handleCurrencyChange = (newCurr: Currency) => {
    // Convert active price boundaries to the new currency rate
    const oldRate = currencyRates[currency];
    const newRate = currencyRates[newCurr];
    const conversionFactor = newRate / oldRate;

    if (minPrice !== null) {
      setMinPrice(Math.round(minPrice * conversionFactor));
    }
    if (maxPrice !== null) {
      setMaxPrice(Math.round(maxPrice * conversionFactor));
    }

    setCurrency(newCurr);
    localStorage.setItem('budgettech_curr', newCurr);
    setCurrentPage(1);
  };

  // Sync Wishlist to localStorage
  const handleToggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      const next = exists 
        ? prev.filter((item) => item.id !== product.id)
        : [...prev, product];
      localStorage.setItem('budgettech_wishlist', JSON.stringify(next));
      return next;
    });
  };

  const handleRemoveWishlistItem = (productId: string) => {
    setWishlist((prev) => {
      const next = prev.filter((item) => item.id !== productId);
      localStorage.setItem('budgettech_wishlist', JSON.stringify(next));
      return next;
    });
  };

  const handleClearWishlist = () => {
    setWishlist([]);
    localStorage.removeItem('budgettech_wishlist');
  };

  // Logout handler
  const handleLogout = async () => {
    const token = localStorage.getItem('budgettech_token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error(err);
      }
    }
    localStorage.removeItem('budgettech_token');
    localStorage.removeItem('budgettech_user_session');
    setUserSession(null);
  };

  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    setIsAuthModalOpen(false);
  };

  const t = translations[language];

  // Reset page when filter criteria change
  const handleCategorySelect = (cat: Category) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePriceFilterChange = (min: number | null, max: number | null) => {
    setMinPrice(min);
    setMaxPrice(max);
    setCurrentPage(1);
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setCurrentPage(1);
  };

  // 100% REAL and ACCURATE filtering across 50,000 items in active currency!
  const filteredCompactList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const activeRate = currencyRates[currency];

    return catalog50k
      .filter((item) => {
        // Category filter
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }
        // Brand filter
        if (selectedBrand !== 'all' && item.brand !== selectedBrand) {
          return false;
        }
        
        // Exact real price filter evaluated against the product's price in the active currency:
        const itemPriceInCurrency = item.priceUsd * activeRate;
        if (minPrice !== null && itemPriceInCurrency < minPrice) {
          return false;
        }
        if (maxPrice !== null && itemPriceInCurrency > maxPrice) {
          return false;
        }

        // Search query filter
        if (q) {
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchBrand = item.brand.toLowerCase().includes(q);
          const matchCategory = item.category.toLowerCase().includes(q);
          if (!matchTitle && !matchBrand && !matchCategory) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'value') {
          return b.valueScore - a.valueScore;
        }
        if (sortBy === 'price-asc') {
          return a.priceUsd - b.priceUsd;
        }
        if (sortBy === 'price-desc') {
          return b.priceUsd - a.priceUsd;
        }
        if (sortBy === 'discount') {
          const discA = (a.originalPriceUsd - a.priceUsd) / a.originalPriceUsd;
          const discB = (b.originalPriceUsd - b.priceUsd) / b.originalPriceUsd;
          return discB - discA;
        }
        return 0;
      });
  }, [catalog50k, selectedCategory, selectedBrand, minPrice, maxPrice, currency, searchQuery, sortBy]);

  const totalFilteredCount = filteredCompactList.length;
  const totalPages = Math.ceil(totalFilteredCount / itemsPerPage);

  // Paginated and fully expanded products for current page (24 items only)
  const currentPaginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const pageSlice = filteredCompactList.slice(start, start + itemsPerPage);
    return pageSlice.map((compact) => expandToFullProduct(compact, language));
  }, [filteredCompactList, currentPage, itemsPerPage, language]);

  const categories: { id: Category; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: t.categoryAll, icon: <LayoutGrid className="w-4 h-4" />, count: categoryCounts.all },
    { id: 'cpus', label: t.categoryCpus, icon: <Cpu className="w-4 h-4" />, count: categoryCounts.cpus },
    { id: 'audio', label: t.categoryAudio, icon: <Headphones className="w-4 h-4" />, count: categoryCounts.audio },
    { id: 'peripherals', label: t.categoryPeripherals, icon: <Keyboard className="w-4 h-4" />, count: categoryCounts.peripherals },
    { id: 'gpus', label: t.categoryGpus, icon: <Gamepad2 className="w-4 h-4" />, count: categoryCounts.gpus },
  ];

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 cyber-grid relative selection:bg-purple-600 selection:text-white">
      
      {/* Authentication & Verification Modal (Opens on demand or login click) */}
      {isAuthModalOpen && (
        <AuthModal
          language={language}
          onLanguageChange={handleLanguageChange}
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      {/* Main Interface */}
      <div>
        
        {/* Top Navbar */}
        <Navbar
          language={language}
          onLanguageChange={handleLanguageChange}
          currency={currency}
          onCurrencyChange={handleCurrencyChange}
          userSession={userSession}
          onLogout={handleLogout}
          wishlistCount={wishlist.length}
          onOpenWishlist={() => setIsWishlistOpen(true)}
          onSelectCategory={(cat) => handleCategorySelect(cat)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        {/* Hero Section with Search & Instant Currency-Aware Presets */}
        <HeroSection
          language={language}
          currency={currency}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onPriceFilterChange={handlePriceFilterChange}
        />

        {/* Main Catalog Viewport */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          
          {/* Controls Bar: Category Tabs & Sorting / Brand Selector */}
          <div className="flex flex-col gap-4 mb-5 pt-2 border-b border-purple-500/15 pb-4">
            
            {/* Row 1: Category Filter Tabs with Live 50k Database Counts */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-purple-400'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className="text-[10px] font-mono opacity-70">
                      ({cat.count.toLocaleString()})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Row 2: Secondary Controls (Brand filter, Sorting, 50k Database Indicator) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              
              {/* Database status pill */}
              <div className="flex items-center gap-2 text-slate-400 font-mono">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-bold tabular-nums">
                  {totalFilteredCount.toLocaleString()}
                </span>
                <span>/ {TOTAL_CATALOG_SIZE.toLocaleString()} {language === 'ru' ? 'позиций в выдаче' : 'items indexed'}</span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Custom Cyber Brand Selector Button (NO NATIVE GRAY SYSTEM SELECT) */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsBrandModalOpen(true)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      selectedBrand !== 'all'
                        ? 'bg-purple-600/25 text-purple-300 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                        : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-purple-500/50 hover:text-white'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-slate-400 font-mono">{t.brandFilter}:</span>
                    <span className="font-bold text-white max-w-[130px] truncate">
                      {selectedBrand === 'all' ? t.allBrands : selectedBrand}
                    </span>
                    {selectedBrand !== 'all' ? (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBrandChange('all');
                        }}
                        className="text-slate-400 hover:text-rose-400 ml-0.5 p-0.5 font-bold"
                        title="Reset brand filter"
                      >
                        ✕
                      </span>
                    ) : (
                      <span className="text-[10px] text-purple-400 font-mono">▼</span>
                    )}
                  </button>
                </div>

                {/* Custom Cyber Sorting Dropdown (No native gray OS dialogs) */}
                <div className="relative" ref={sortRef}>
                  <button
                    type="button"
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 text-xs font-medium text-slate-200 transition-all cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-slate-400 font-mono">{t.sortLabel}:</span>
                    <span className="font-bold text-white max-w-[130px] truncate">
                      {sortBy === 'value' ? t.sortValue : sortBy === 'discount' ? t.sortDiscount : sortBy === 'price-asc' ? t.sortPriceAsc : t.sortPriceDesc}
                    </span>
                    <span className="text-[10px] text-purple-400 font-mono">▼</span>
                  </button>

                  {isSortOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-[#0e111c] border border-purple-500/30 rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.85)] py-1.5 z-40">
                      {[
                        { id: 'value', label: t.sortValue },
                        { id: 'discount', label: t.sortDiscount },
                        { id: 'price-asc', label: t.sortPriceAsc },
                        { id: 'price-desc', label: t.sortPriceDesc },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.id as any);
                            setIsSortOpen(false);
                          }}
                          className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            sortBy === opt.id
                              ? 'bg-purple-600/20 text-purple-300 font-bold'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {sortBy === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* REAL Interactive Price Filter Module (Presets, Exact Min-Max Inputs, Range Slider) */}
          <PriceFilter
            currency={currency}
            language={language}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onPriceFilterChange={handlePriceFilterChange}
            totalFilteredCount={totalFilteredCount}
          />

          {/* Product Grid (Volumetric 3D Cards) */}
          {currentPaginatedProducts.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto mb-3">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="text-base font-bold text-white">
                {language === 'ru' ? 'Нет товаров в данном ценовом диапазоне' : language === 'de' ? 'Keine Hardware in diesem Preisbereich' : language === 'uk' ? 'Немає товарів у цьому діапазоні' : 'No components found in this price range'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {language === 'ru' ? 'Попробуйте увеличить максимальную цену или сбросить фильтры.' : 'Try expanding the max budget cutoff or resetting filters.'}
              </p>
              <button
                type="button"
                onClick={() => { setSelectedCategory('all'); setSelectedBrand('all'); setSearchQuery(''); setMinPrice(null); setMaxPrice(null); }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 transition-colors cursor-pointer"
              >
                {language === 'ru' ? 'Сбросить фильтр цен и показать всё' : 'Reset price filter and show all'}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {currentPaginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    language={language}
                    currency={currency}
                    isInWishlist={wishlist.some((item) => item.id === product.id)}
                    onToggleWishlist={handleToggleWishlist}
                    onSelectProduct={(p) => setSelectedProduct(p)}
                  />
                ))}
              </div>

              {/* High Performance 50k Pagination Control */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalFilteredCount}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }}
                language={language}
              />
            </>
          )}

        </main>

        {/* Footer */}
        <footer className="border-t border-purple-500/15 bg-[#06080d] py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm">
                Budget<span className="text-purple-400">Tech</span>
              </span>
              <span>— {t.tagline}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Wire E2EE: AES-256-GCM + RSA-OAEP</span>
              </div>
              <span className="text-purple-400 font-mono font-bold">100,000+ Deals Online</span>
              <span className="hidden md:inline">AliExpress · Mindfactory 🇩🇪 · Amazon · eBay</span>
            </div>
          </div>
        </footer>

        {/* 3D Product Detail Modal */}
        <ProductDetailModal
          product={selectedProduct}
          language={language}
          currency={currency}
          isInWishlist={selectedProduct ? wishlist.some((item) => item.id === selectedProduct.id) : false}
          onToggleWishlist={handleToggleWishlist}
          onClose={() => setSelectedProduct(null)}
        />

        {/* Build Planner & Wishlist Drawer */}
        <BuildPlannerDrawer
          isOpen={isWishlistOpen}
          onClose={() => setIsWishlistOpen(false)}
          wishlist={wishlist}
          onRemoveItem={handleRemoveWishlistItem}
          onClearAll={handleClearWishlist}
          language={language}
          currency={currency}
          onSelectProduct={(p) => setSelectedProduct(p)}
        />

        {/* Custom Cyber Brand Selector Modal */}
        <BrandSelectorModal
          isOpen={isBrandModalOpen}
          onClose={() => setIsBrandModalOpen(false)}
          selectedBrand={selectedBrand}
          onSelectBrand={(brand) => handleBrandChange(brand)}
          brandCounts={brandCounts}
          totalItems={catalog50k.length}
          language={language}
        />

      </div>
    </div>
  );
}
