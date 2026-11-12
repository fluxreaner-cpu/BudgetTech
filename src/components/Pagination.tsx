import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  language: Language;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  language,
}) => {
  const t = translations[language];
  const [jumpValue, setJumpValue] = useState('');

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers with ellipsis window
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpValue, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onPageChange(p);
      setJumpValue('');
    }
  };

  return (
    <div className="mt-10 pt-6 border-t border-purple-500/15 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Result metrics */}
      <div className="text-xs text-slate-400 font-mono">
        <span>{t.showingResults} </span>
        <span className="font-bold text-white tabular-nums">{startItem.toLocaleString()}</span>
        <span> - </span>
        <span className="font-bold text-white tabular-nums">{endItem.toLocaleString()}</span>
        <span> / </span>
        <span className="font-bold text-purple-400 tabular-nums">{totalItems.toLocaleString()}</span>
      </div>

      {/* Page Selector Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="First Page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Prev Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title={t.prevPage}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Dynamic Pages */}
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span key={`dots-${index}`} className="px-2 py-1 text-xs text-slate-600 font-mono">
                ...
              </span>
            );
          }
          const isCurrent = page === currentPage;
          return (
            <button
              key={`page-${page}`}
              type="button"
              onClick={() => onPageChange(Number(page))}
              className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-purple-400'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              {page}
            </button>
          );
        })}

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title={t.nextPage}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Last Page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Direct Page Jump Form */}
      <form onSubmit={handleJump} className="flex items-center gap-1.5">
        <input
          type="number"
          min={1}
          max={totalPages}
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          placeholder={`1-${totalPages}`}
          className="w-20 px-2 py-1 text-xs font-mono bg-slate-900/90 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
        />
        <button
          type="submit"
          className="px-2.5 py-1 text-xs font-medium text-purple-300 bg-purple-950/60 border border-purple-500/30 rounded-lg hover:bg-purple-600 hover:text-white transition-all cursor-pointer"
        >
          {t.jumpToPage}
        </button>
      </form>
    </div>
  );
};
