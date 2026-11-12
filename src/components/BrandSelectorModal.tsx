import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Search, 
  Check, 
  Filter, 
  Sparkles, 
  Cpu, 
  Headphones, 
  Keyboard, 
  Gamepad2, 
  Layers 
} from 'lucide-react';
import { Language, Category } from '../types';
import { translations } from '../i18n';

interface BrandInfo {
  name: string;
  category: Category;
  description: Record<Language, string>;
  origin?: string;
}

export const BRAND_DIRECTORY: BrandInfo[] = [
  // CPUs & Motherboards
  { name: 'AMD', category: 'cpus', description: { en: 'Ryzen processors & AM4/AM5 architectures', de: 'Ryzen Prozessoren & Architekturen', ru: 'Процессоры Ryzen и сокеты AM4/AM5', uk: 'Процесори Ryzen та сокети AM4/AM5' } },
  { name: 'Intel', category: 'cpus', description: { en: 'Core i3, i5 processors and LGA platforms', de: 'Core i3/i5 Prozessoren und Plattformen', ru: 'Процессоры Core i3/i5 и платформы LGA', uk: 'Процесори Core i3/i5 та платформи LGA' } },
  { name: 'Intel Xeon', category: 'cpus', description: { en: 'High-core server kits and homelab combos', de: 'Multi-Core Server-Kits & Workstations', ru: 'Многоядерные серверные комплекты и X99', uk: 'Багатоядерні серверні комплекти та X99' } },
  { name: 'Machinist', category: 'cpus', description: { en: 'Budget X99/B550 enthusiast motherboards', de: 'Budget X99/B550 Mainboards', ru: 'Бюджетные материнские платы X99 и B550', uk: 'Бюджетні материнські плати X99 та B550' } },
  { name: 'Huananzhi', category: 'cpus', description: { en: 'Heavy-duty workstation motherboards', de: 'Robuste Workstation-Mainboards', ru: 'Материнские платы для тяжелых сборок', uk: 'Материнські плати для важких навантажень' } },
  { name: 'Jginyue', category: 'cpus', description: { en: 'Reliable AMD & Intel budget motherboards', de: 'Zuverlässige Budget-Mainboards', ru: 'Надежные платы для процессоров Ryzen/Core', uk: 'Надійні плати для Ryzen/Core' } },
  { name: 'Maxsun', category: 'cpus', description: { en: 'Challenger series gaming motherboards', de: 'Challenger Gaming-Mainboards', ru: 'Игровые материнские платы серии Challenger', uk: 'Ігрові материнські плати серії Challenger' } },

  // German Mindfactory & European PC Hardware
  { name: 'be quiet!', category: 'cpus', description: { en: 'German silent CPU cooling & Pure Rock series', de: 'Deutsche Silent-Kühler & Pure Rock Serie', ru: 'Немецкие тихие кулеры и системы Pure Rock', uk: 'Німецькі тихі кулери та системи Pure Rock' } },
  { name: 'Arctic', category: 'cpus', description: { en: 'Liquid Freezer III AIOs & pressure fans', de: 'Liquid Freezer III Wasserkühlungen', ru: 'Водяное охлаждение Liquid Freezer III и P12', uk: 'Водяне охолодження Liquid Freezer III та P12' } },
  { name: 'Thermalright', category: 'cpus', description: { en: 'Peerless Assassin & Phantom Spirit dual towers', de: 'Peerless Assassin Doppel-Turmkühler', ru: 'Двухбашенные суперкулеры Peerless Assassin', uk: 'Двобаштові суперкулери Peerless Assassin' } },
  { name: 'Endorfy', category: 'cpus', description: { en: 'Fortis 5 & Fluctus static pressure cooling', de: 'Fortis 5 & Fluctus High-End Kühlung', ru: 'Системы охлаждения Fortis 5 и вентиляторы Fluctus', uk: 'Системи охолодження Fortis 5 та вентилятори' } },
  { name: 'Alpenföhn', category: 'cpus', description: { en: 'German premium Dolomit & Brocken series', de: 'Deutsche Dolomit & Brocken Kühler', ru: 'Премиальные немецкие кулеры Dolomit', uk: 'Преміальні німецькі кулери Dolomit' } },

  // GPUs
  { name: 'KFA2', category: 'gpus', description: { en: 'Top German store RTX 4060 & 3060 1-Click OC cards', de: 'Bestseller GeForce RTX Grafikkarten', ru: 'Топ продаж видеокарт GeForce RTX в Германии', uk: 'Хіт продажів відеокарт GeForce RTX у Німеччині' } },
  { name: 'Sapphire', category: 'gpus', description: { en: 'Pulse & Nitro+ AMD Radeon graphics cards', de: 'Pulse & Nitro+ Radeon Grafikkarten', ru: 'Видеокарты Radeon Pulse и Nitro+', uk: 'Відеокарти Radeon Pulse та Nitro+' } },
  { name: 'PowerColor', category: 'gpus', description: { en: 'Fighter & Hellhound Radeon gaming cards', de: 'Fighter & Hellhound Grafikkarten', ru: 'Видеокарты Fighter и Hellhound на Mindfactory', uk: 'Відеокарти Fighter та Hellhound на Mindfactory' } },
  { name: 'XFX', category: 'gpus', description: { en: 'Speedster SWFT & QICK 16GB Radeon cards', de: 'Speedster SWFT Radeon Grafikkarten', ru: 'Видеокарты Speedster SWFT с 16 ГБ VRAM', uk: 'Відеокарти Speedster SWFT з 16 ГБ VRAM' } },
  { name: 'Peladn', category: 'gpus', description: { en: 'Refurbished & new RX 580 / RX 6600 cards', de: 'Grafikkarten der RX-Serie', ru: 'Видеокарты RX 580 и RX 6600 по суперценам', uk: 'Відеокарти RX 580 та RX 6600' } },
  { name: 'SOYO', category: 'gpus', description: { en: 'High-yield AMD Radeon dual-fan cards', de: 'Radeon Dual-Fan Grafikkarten', ru: 'Видеокарты Radeon с эффективным охлаждением', uk: 'Відеокарти Radeon з подвійним обдувом' } },
  { name: 'MLLSE', category: 'gpus', description: { en: 'Value-tested compact graphics cards', de: 'Kompakte Budget-Grafikkarten', ru: 'Компактные бюджетные видеокарты', uk: 'Компактні бюджетні відеокарти' } },
  { name: 'ZOTAC', category: 'gpus', description: { en: 'Twin Edge GTX & RTX graphics adapters', de: 'Twin Edge Grafikkarten', ru: 'Видеокарты серии GTX 1660S и RTX', uk: 'Відеокарти серії GTX та RTX' } },
  { name: 'JIESHUO', category: 'gpus', description: { en: 'Popular AliExpress graphics card seller', de: 'Preiswerte Gaming-Grafikkarten', ru: 'Народные видеокарты с гарантией', uk: 'Популярні відеокарти з гарантією' } },
  { name: 'Gainward', category: 'gpus', description: { en: 'Ghost series RTX 3050 and 3060 models', de: 'Ghost-Serie Grafikkarten', ru: 'Видеокарты Ghost RTX 3050 и 3060', uk: 'Відеокарти Ghost RTX 3050 та 3060' } },
  { name: 'Palit', category: 'gpus', description: { en: 'Dual and StormX compact gaming graphics', de: 'Dual & StormX Grafikkarten', ru: 'Компактные карты Palit Dual/StormX', uk: 'Компактні відеокарти Palit' } },
  { name: 'Sparkle', category: 'gpus', description: { en: 'Official Intel Arc A580 & A750 partner', de: 'Intel Arc A580/A750 Partner', ru: 'Официальный партнер Intel Arc A580/A750', uk: 'Офіційний партнер Intel Arc' } },
  { name: 'ASRock', category: 'gpus', description: { en: 'Challenger Intel Arc and Radeon cards', de: 'Challenger Grafikkarten', ru: 'Видеокарты ASRock Challenger', uk: 'Відеокарти ASRock Challenger' } },

  // Audio & Sound
  { name: 'Moondrop', category: 'audio', description: { en: 'Harman target audiophile IEMs and DACs', de: 'Audiophile In-Ears & DACs', ru: 'Аудиофильские наушники IEM и ЦАПы', uk: 'Аудіофільські навушники IEM та ЦАПи' } },
  { name: 'Tangzu', category: 'audio', description: { en: 'Classic Chinese acoustic tuning & IEMs', de: 'Musikalische IEMs & Zubehör', ru: 'Легендарная серия наушников Wan\'er', uk: 'Легендарні навушники Wan\'er' } },
  { name: '7Hz', category: 'audio', description: { en: 'Crinacle collaborated Salnotes Zero series', de: 'Präzise abgestimmte In-Ears', ru: 'Высокоточные нейтральные наушники Zero', uk: 'Нейтральні студійні навушники Zero' } },
  { name: 'Truthear', category: 'audio', description: { en: 'Dual dynamic driver reference champions', de: 'Dual-Treiber Referenz-IEMs', ru: 'Двухдрайверные мониторы Zero:RED', uk: 'Дводрайверні монітори Zero:RED' } },
  { name: 'KZ Acoustics', category: 'audio', description: { en: 'Multi-driver hybrid in-ear monitors', de: 'Hybrid-IEMs mit vielen Treibern', ru: 'Многодрайверные гибридные наушники', uk: 'Багатодрайверні гібридні навушники' } },
  { name: 'CCA', category: 'audio', description: { en: 'Ultra-thin diaphragm budget IEMs', de: 'Extrem günstige Hi-Fi In-Ears', ru: 'Сверхбюджетный качественный Hi-Fi звук', uk: 'Бюджетний якісний Hi-Fi звук' } },
  { name: 'Kiwi Ears', category: 'audio', description: { en: 'Beryllium coated dynamic drivers', de: 'Beryllium-beschichtete Treiber', ru: 'Бериллиевые динамические излучатели', uk: 'Берилієві динамічні випромінювачі' } },
  { name: 'Simgot', category: 'audio', description: { en: 'Metal acoustic chambers and high resolution', de: 'Metallgehäuse & hohe Auflösung', ru: 'Цельнометаллические наушники EW200', uk: 'Суцільнометалеві навушники EW200' } },
  { name: 'Fifine', category: 'audio', description: { en: 'Streaming USB microphones with RGB & shockmounts', de: 'Streaming-USB-Mikrofone', ru: 'Студийные USB-микрофоны AmpliGame', uk: 'Студійні USB-мікрофони AmpliGame' } },
  { name: 'Maono', category: 'audio', description: { en: 'XLR and USB broadcast vocal microphones', de: 'Broadcast-Mikrofone', ru: 'Микрофоны для стримов и подкастов', uk: 'Мікрофони для стрімів та подкастів' } },
  { name: 'Fosi Audio', category: 'audio', description: { en: 'Desktop headphone amplifiers and DACs', de: 'Desktop-Kopfhörerverstärker & DACs', ru: 'Усилители для наушников и ЦАПы', uk: 'Підсилювачі для навушників та ЦАПи' } },
  { name: 'GraveAudio', category: 'audio', description: { en: 'CX31993 32-bit Type-C audio decoders', de: 'Hi-Res Type-C Audio-Dongles', ru: 'Портативные ЦАПы CX31993 32-бит', uk: 'Портативні ЦАПи CX31993 32-біт' } },

  // Peripherals
  { name: 'Attack Shark', category: 'peripherals', description: { en: 'Ultralight PAW3395 wireless gaming mice', de: 'Ultraleichte Wireless-Gaming-Mäuse', ru: 'Сверхлегкие беспроводные мыши PAW3395', uk: 'Надлегкі бездротові мишки PAW3395' } },
  { name: 'VGN', category: 'peripherals', description: { en: 'Flagship Dragonfly ultralight gaming mice', de: 'Dragonfly Gaming-Mäuse', ru: 'Флагманские мыши серии Dragonfly F1', uk: 'Флагманські мишки Dragonfly F1' } },
  { name: 'VXE', category: 'peripherals', description: { en: 'Ergonomic competitive wireless mice', de: 'Wettkampf-Gaming-Mäuse', ru: 'Киберспортивные мыши серии R1 Pro', uk: 'Кіберспортивні мишки серії R1 Pro' } },
  { name: 'Darmoshark', category: 'peripherals', description: { en: 'Large ergonomic 4K polling rate mice', de: 'Ergonomische 4K-Gaming-Mäuse', ru: 'Эргономичные мыши с частотой 4000 Гц', uk: 'Ергономічні мишки з частотою 4000 Гц' } },
  { name: 'Zaopin', category: 'peripherals', description: { en: 'Egg-shaped fingertip wireless mice', de: 'Egg-Shape Wireless-Mäuse', ru: 'Компактные яйцевидные мыши Z1 Pro', uk: 'Компактні яйцеподібні мишки Z1 Pro' } },
  { name: 'Delux', category: 'peripherals', description: { en: 'M800 Pro lightweight optical mice', de: 'Leichte optische Gaming-Mäuse', ru: 'Легкие оптические мыши M800 Pro', uk: 'Легкі оптичні мишки M800 Pro' } },
  { name: 'Xinmeng', category: 'peripherals', description: { en: 'CNC aluminum gasket mechanical keyboards', de: 'CNC-Aluminium Gasket-Tastaturen', ru: 'Тяжелые алюминиевые клавиатуры M71', uk: 'Важкі алюмінієві клавіатури M71' } },
  { name: 'Aula', category: 'peripherals', description: { en: 'F75 gasket mount deep thock keyboards', de: 'F75 Thock-Mechanik-Tastaturen', ru: 'Клавиатуры F75 с глубоким звуком Thock', uk: 'Клавіатури F75 з глибоким звуком Thock' } },
  { name: 'Epomaker', category: 'peripherals', description: { en: 'Custom mechanical keyboards and keycaps', de: 'Custom-Tastaturen & Keycaps', ru: 'Кастомные механические клавиатуры', uk: 'Кастомні механічні клавіатури' } },
  { name: 'Cherry', category: 'peripherals', description: { en: 'Pioneering German mechanical switches & keyboards', de: 'Deutsche MX-Schalter & KC-Tastaturen', ru: 'Оригинальные немецкие свитчи и клавиатуры KC 200', uk: 'Оригінальні німецькі світчі та клавіатури' } },
  { name: 'Sharkoon', category: 'peripherals', description: { en: 'German lightweight Light² mice and gaming gear', de: 'Deutsche Light² Gaming-Mäuse & Gear', ru: 'Немецкие ультралегкие мыши Light² 200 и девайсы', uk: 'Німецькі надлегкі мишки Light² 200 та девайси' } },
  { name: 'Royal Kludge', category: 'peripherals', description: { en: 'Affordable compact hot-swap keyboards', de: 'Kompakte Hot-Swap Tastaturen', ru: 'Компактные клавиатуры RK61 и RK71', uk: 'Компактні клавіатури RK61 та RK71' } },
  { name: 'Ajazz', category: 'peripherals', description: { en: 'AK820 keyboards with TFT smart screens', de: 'Tastaturen mit Display & Mäuse', ru: 'Клавиатуры с экраном AK820 и мыши', uk: 'Клавіатури з екраном AK820 та мишки' } },
  { name: 'Redragon', category: 'peripherals', description: { en: 'Durable metal-plate gaming keyboards', de: 'Robuste Gaming-Tastaturen', ru: 'Надежные механические клавиатуры', uk: 'Надійні механічні клавіатури' } },
  { name: 'Machenike', category: 'peripherals', description: { en: 'Tri-mode gaming keyboards and controllers', de: 'Tri-Mode Tastaturen & Controller', ru: 'Игровые клавиатуры и контроллеры', uk: 'Ігрові клавіатури та контролери' } },
];

interface BrandSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  brandCounts: Record<string, number>;
  totalItems: number;
  language: Language;
}

export const BrandSelectorModal: React.FC<BrandSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedBrand,
  onSelectBrand,
  brandCounts,
  totalItems,
  language,
}) => {
  const t = translations[language];
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category>('all');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredBrands = useMemo(() => {
    const q = search.trim().toLowerCase();
    return BRAND_DIRECTORY.filter((brand) => {
      if (filterCategory !== 'all' && brand.category !== filterCategory) {
        return false;
      }
      if (q) {
        const matchName = brand.name.toLowerCase().includes(q);
        const matchDesc = brand.description[language].toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [search, filterCategory, language]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#04060a]/85 backdrop-blur-xl">
      {/* Background Cyber Glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* 3D Cyber Styled Modal Box */}
      <div 
        className="relative w-full max-w-3xl tactile-modal rounded-2xl overflow-hidden flex flex-col max-h-[88vh] z-10 border border-purple-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Accent Gradient Line */}
        <div className="h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 shrink-0" />

        {/* Modal Header */}
        <div className="p-5 border-b border-purple-500/15 flex items-center justify-between shrink-0 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>{language === 'ru' ? 'Выбор бренда гаджета' : language === 'de' ? 'Markenauswahl' : language === 'uk' ? 'Вибір бренду' : 'Select Hardware Brand'}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {BRAND_DIRECTORY.length} {language === 'ru' ? 'брендов' : 'brands'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'ru' ? 'Все проверенные производители в нашей базе 100 000 товаров' : 'All verified hardware manufacturers in our 100,000 database'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Sub-bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 space-y-3 shrink-0">
          
          {/* Custom Cyber Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === 'ru' ? 'Поиск бренда (AMD, Moondrop, Attack Shark, Xinmeng...)' : 'Search brand name...'}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                filterCategory === 'all'
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t.allBrands}
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('cpus')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                filterCategory === 'cpus'
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t.categoryCpus}
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('audio')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                filterCategory === 'audio'
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t.categoryAudio}
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('peripherals')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                filterCategory === 'peripherals'
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t.categoryPeripherals}
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('gpus')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                filterCategory === 'gpus'
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t.categoryGpus}
            </button>
          </div>
        </div>

        {/* Brands Grid (Scrollable Body) */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          
          {/* "All Brands" Card */}
          <div
            onClick={() => {
              onSelectBrand('all');
              onClose();
            }}
            className={`p-3.5 mb-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              selectedBrand === 'all'
                ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] ring-1 ring-purple-500'
                : 'bg-slate-900/60 border-slate-800 hover:border-purple-500/40 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                ★
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{t.allBrands}</span>
                  {selectedBrand === 'all' && (
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-500/40">
                      ACTIVE
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'ru' ? 'Показать все товары каталога без ограничения по производителю' : 'Show all components without brand filtering'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                {totalItems.toLocaleString()}
              </span>
              <p className="text-[10px] text-slate-500 font-mono">
                {language === 'ru' ? 'всего' : 'total'}
              </p>
            </div>
          </div>

          {/* Grid of Individual Brands */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {filteredBrands.map((brand) => {
              const isSelected = selectedBrand === brand.name;
              const count = brandCounts[brand.name] || 0;

              return (
                <div
                  key={brand.name}
                  onClick={() => {
                    onSelectBrand(brand.name);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] ring-1 ring-purple-500'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-purple-500/40 hover:bg-slate-900 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {/* Stylized Brand Badge Icon */}
                      <div className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-xs text-purple-300 font-mono group-hover:border-purple-500/60 group-hover:text-white transition-colors">
                        {brand.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                        {brand.name}
                      </span>
                    </div>

                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold tabular-nums">
                        {count.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {brand.description[language]}
                  </p>
                </div>
              );
            })}
          </div>

          {filteredBrands.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p>{language === 'ru' ? 'Бренды не найдены. Попробуйте другой запрос.' : 'No brands match your search.'}</p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-purple-500/15 bg-slate-950/80 flex items-center justify-between shrink-0 text-xs">
          <div className="text-slate-400 font-mono">
            {language === 'ru' ? 'Текущий выбор' : 'Selected'}: <span className="font-bold text-purple-300">{selectedBrand === 'all' ? t.allBrands : selectedBrand}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          >
            {language === 'ru' ? 'Применить выбор' : 'Apply'}
          </button>
        </div>

      </div>
    </div>
  );
};
