import { Language } from './types';

export interface Translations {
  appName: string;
  tagline: string;
  heroBadge: string;
  heroTitle1: string;
  heroTitleHighlight: string;
  heroTitle2: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  categoryAll: string;
  categoryCpus: string;
  categoryAudio: string;
  categoryPeripherals: string;
  categoryGpus: string;
  sortLabel: string;
  sortValue: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  sortDiscount: string;
  filterPriceRange: string;
  filterUnder50: string;
  filterUnder100: string;
  filterAllPrices: string;
  valueScoreLabel: string;
  savePercent: string;
  lowestOn: string;
  inspectDetails: string;
  addToPlanner: string;
  inPlanner: string;
  // Auth Modal
  authModalTitle: string;
  authModalSubtitle: string;
  tabLogin: string;
  tabRegister: string;
  emailLabel: string;
  passwordLabel: string;
  loginButton: string;
  registerButton: string;
  guestLoginButton: string;
  guestLoginSubtext: string;
  authSecurityNote: string;
  authDemoHint: string;
  nameLabel: string;
  namePlaceholder: string;
  verifyCodeTitle: string;
  verifyCodeSubtitle: string;
  enterCodeLabel: string;
  confirmCodeButton: string;
  resendCodeButton: string;
  resendInSeconds: string;
  changeEmail: string;
  codeSentNotice: string;
  verifiedBadge: string;
  // Profile
  profileTitle: string;
  guestNameDefault: string;
  profileStatsTitle: string;
  profileItemsInWishlist: string;
  profileEstimatedSavings: string;
  profileCurrency: string;
  logoutButton: string;
  // Detail Modal
  modalSpecsTitle: string;
  modalProsTitle: string;
  modalConsTitle: string;
  modalMarketplaceTitle: string;
  modalDirectBuy: string;
  modalLowestPriceGuaranteed: string;
  modalClose: string;
  modalBenchmarkTitle: string;
  // Build Planner Drawer
  plannerTitle: string;
  plannerSubtitle: string;
  plannerEmpty: string;
  plannerTotal: string;
  plannerSavings: string;
  plannerClear: string;
  plannerExport: string;
  // Marketplaces
  freeShipping: string;
  verifiedSeller: string;
  // Stats
  statSavings: string;
  statSavingsDesc: string;
  statDeals: string;
  statDealsDesc: string;
  statPlatforms: string;
  statPlatformsDesc: string;
  // 50k Database & Pagination
  pageOf: string;
  showingResults: string;
  prevPage: string;
  nextPage: string;
  jumpToPage: string;
  databaseScale: string;
  brandFilter: string;
  allBrands: string;
  priceRangeSlider: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'BudgetTech',
    tagline: 'The Ultimate Budget Hardware Aggregator',
    heroBadge: 'Live Verified Deals · Updated Hourly',
    heroTitle1: 'Max FPS & Audio.',
    heroTitleHighlight: 'Minimum Budget.',
    heroTitle2: 'No Tech Overpayment.',
    heroSubtitle: 'Aggregating rock-bottom global prices across AliExpress, Amazon, and eBay for verified price-to-performance champions.',
    searchPlaceholder: 'Search CPUs, planar IEMs, gasket keyboards, mice...',
    categoryAll: 'All Hardware',
    categoryCpus: 'Processors & CPUs',
    categoryAudio: 'Audio & Sound',
    categoryPeripherals: 'Peripherals',
    categoryGpus: 'GPUs & Kits',
    sortLabel: 'Sort by',
    sortValue: 'Highest Value Score',
    sortPriceAsc: 'Price: Low to High',
    sortPriceDesc: 'Price: High to Low',
    sortDiscount: 'Biggest Discount',
    filterPriceRange: 'Max Budget',
    filterUnder50: 'Under $50',
    filterUnder100: 'Under $100',
    filterAllPrices: 'Any Price',
    valueScoreLabel: 'Value Score',
    savePercent: 'OFF',
    lowestOn: 'Lowest on',
    inspectDetails: 'View',
    addToPlanner: 'Add to Rig',
    inPlanner: 'In Rig Planner',
    // Auth Modal
    authModalTitle: 'System Access Protocol',
    authModalSubtitle: 'Sign in to access real-time price scrapers, custom currency conversions, and budget build planning.',
    tabLogin: 'Sign In',
    tabRegister: 'Create Account',
    emailLabel: 'Cyber Email Address',
    passwordLabel: 'Security Key / Password',
    loginButton: 'Enter Terminal',
    registerButton: 'Generate Account',
    guestLoginButton: 'Quick Guest Access',
    guestLoginSubtext: 'No registration needed · Instant profile creation',
    authSecurityNote: 'Profile saved permanently in server database with verified session',
    authDemoHint: 'Code is sent to your email. You can also view it right in the verification screen.',
    nameLabel: 'Your Name or Callout',
    namePlaceholder: 'e.g. Alex Hardware',
    verifyCodeTitle: 'Email Verification Code',
    verifyCodeSubtitle: 'We sent a 6-digit verification code to your email. Enter it below to activate your account.',
    enterCodeLabel: 'Enter 6-digit confirmation code',
    confirmCodeButton: 'Confirm & Activate Account',
    resendCodeButton: 'Resend Code',
    resendInSeconds: 'Resend in',
    changeEmail: 'Change Email',
    codeSentNotice: 'Code sent to',
    verifiedBadge: 'Verified Profile',
    // Profile
    profileTitle: 'User Profile Terminal',
    guestNameDefault: 'Cyber-Guest',
    profileStatsTitle: 'Hardware Telemetry',
    profileItemsInWishlist: 'Saved Rig Components',
    profileEstimatedSavings: 'Total Budget Saved',
    profileCurrency: 'Active Currency',
    logoutButton: 'Disconnect Session',
    // Detail Modal
    modalSpecsTitle: 'Hardware Specifications',
    modalProsTitle: 'Technical Strengths & Features',
    modalConsTitle: 'Technical Limitations & Considerations',
    modalMarketplaceTitle: 'Live Marketplace Comparison',
    modalDirectBuy: 'Go to Marketplace Deal',
    modalLowestPriceGuaranteed: 'Verified real-time marketplace prices',
    modalClose: 'Close Inspector',
    modalBenchmarkTitle: 'Price-to-Performance Benchmark',
    // Build Planner Drawer
    plannerTitle: 'Budget Rig Planner',
    plannerSubtitle: 'Real-time total cost and savings calculated across global marketplaces',
    plannerEmpty: 'Your build planner is empty. Click "+ Add to Rig" on any component.',
    plannerTotal: 'Total Rig Cost',
    plannerSavings: 'Total Saved vs MSRP',
    plannerClear: 'Clear Build',
    plannerExport: 'Copy Build Spec',
    // Marketplaces
    freeShipping: 'Free Global Shipping',
    verifiedSeller: 'Top Rated Plus Store',
    // Stats
    statSavings: '42.8%',
    statSavingsDesc: 'Avg. Savings vs Retail',
    statDeals: '100,000+',
    statDealsDesc: 'Global & Mindfactory 🇩🇪 Deals',
    statPlatforms: '4 Stores',
    statPlatformsDesc: 'AliExpress, Mindfactory 🇩🇪, Amazon, eBay',
    pageOf: 'Page',
    showingResults: 'Showing',
    prevPage: 'Previous',
    nextPage: 'Next',
    jumpToPage: 'Go to page',
    databaseScale: '100,000+ Hardware Items in Database',
    brandFilter: 'Brand',
    allBrands: 'All Brands',
    priceRangeSlider: 'Price Range',
  },
  de: {
    appName: 'BudgetTech',
    tagline: 'Der ultimative Budget-Hardware-Aggregator',
    heroBadge: 'Live geprüfte Angebote · Stündlich aktualisiert',
    heroTitle1: 'Max FPS & Audio.',
    heroTitleHighlight: 'Minimales Budget.',
    heroTitle2: 'Keine Überzahlung.',
    heroSubtitle: 'Aggregiert weltweite Tiefstpreise von AliExpress, Amazon und eBay für unschlagbare Preis-Leistungs-Sieger.',
    searchPlaceholder: 'Suche nach CPUs, IEMs, Tastaturen, Mäusen...',
    categoryAll: 'Alle Hardware',
    categoryCpus: 'Prozessoren & CPUs',
    categoryAudio: 'Audio & Sound',
    categoryPeripherals: 'Peripherie',
    categoryGpus: 'Grafikkarten & Bundles',
    sortLabel: 'Sortierung',
    sortValue: 'Beste Wertung (P/L)',
    sortPriceAsc: 'Preis: Niedrig bis Hoch',
    sortPriceDesc: 'Preis: Hoch bis Niedrig',
    sortDiscount: 'Größter Rabatt',
    filterPriceRange: 'Budgetgrenze',
    filterUnder50: 'Unter 50 €',
    filterUnder100: 'Unter 100 €',
    filterAllPrices: 'Alle Preise',
    valueScoreLabel: 'P/L-Score',
    savePercent: 'RABATT',
    lowestOn: 'Tiefstpreis bei',
    inspectDetails: 'Ansehen',
    addToPlanner: 'Zum Build hinzufügen',
    inPlanner: 'Im Build-Planer',
    // Auth Modal
    authModalTitle: 'System-Zugangsprotokoll',
    authModalSubtitle: 'Melden Sie sich an, um Live-Preise, Währungsumrechnung und Build-Planer freizuschalten.',
    tabLogin: 'Anmelden',
    tabRegister: 'Registrieren',
    emailLabel: 'E-Mail-Adresse',
    passwordLabel: 'Passwort',
    loginButton: 'Terminal betreten',
    registerButton: 'Konto erstellen',
    guestLoginButton: 'Schneller Gastzugang',
    guestLoginSubtext: 'Keine Registrierung erforderlich · Sofortiger Start',
    authSecurityNote: 'Profil dauerhaft in der Server-Datenbank mit verifizierter Sitzung gespeichert',
    authDemoHint: 'Der Code wird an Ihre E-Mail gesendet. Sie können ihn auch direkt im Verifizierungsfenster einsehen.',
    nameLabel: 'Ihr Name oder Rufzeichen',
    namePlaceholder: 'z.B. Alex Hardware',
    verifyCodeTitle: 'E-Mail-Bestätigungscode',
    verifyCodeSubtitle: 'Wir haben einen 6-stelligen Bestätigungscode an Ihre E-Mail gesendet. Geben Sie ihn ein, um Ihr Konto zu aktivieren.',
    enterCodeLabel: '6-stelligen Bestätigungscode eingeben',
    confirmCodeButton: 'Bestätigen & Konto aktivieren',
    resendCodeButton: 'Code erneut senden',
    resendInSeconds: 'Erneut senden in',
    changeEmail: 'E-Mail ändern',
    codeSentNotice: 'Code gesendet an',
    verifiedBadge: 'Verifiziertes Profil',
    // Profile
    profileTitle: 'Benutzerprofil',
    guestNameDefault: 'Cyber-Gast',
    profileStatsTitle: 'Hardware-Statistiken',
    profileItemsInWishlist: 'Gespeicherte Komponenten',
    profileEstimatedSavings: 'Gesamtersparnis',
    profileCurrency: 'Aktive Währung',
    logoutButton: 'Sitzung beenden',
    // Detail Modal
    modalSpecsTitle: 'Technische Daten',
    modalProsTitle: 'Technische Stärken & Merkmale',
    modalConsTitle: 'Technische Einschränkungen',
    modalMarketplaceTitle: 'Live-Marktplatz-Vergleich',
    modalDirectBuy: 'Zum Angebot weiterleiten',
    modalLowestPriceGuaranteed: 'Verifizierte Echtzeit-Marktplatzpreise',
    modalClose: 'Schließen',
    modalBenchmarkTitle: 'Leistungs-Preis-Vergleich',
    // Build Planner Drawer
    plannerTitle: 'Budget-Build-Planer',
    plannerSubtitle: 'Echtzeit-Gesamtkosten und Ersparnis über Marktplätze hinweg',
    plannerEmpty: 'Dein Build-Planer ist leer. Klicke auf "+ Zum Build hinzufügen".',
    plannerTotal: 'Gesamtkosten',
    plannerSavings: 'Ersparnis geg. UVP',
    plannerClear: 'Build leeren',
    plannerExport: 'Build kopieren',
    // Marketplaces
    freeShipping: 'Kostenloser Versand',
    verifiedSeller: 'Top-Bewerteter Händler',
    // Stats
    statSavings: '42.8%',
    statSavingsDesc: 'Ø Ersparnis ggü. UVP',
    statDeals: '100.000+',
    statDealsDesc: 'Globale & Mindfactory 🇩🇪 Deals',
    statPlatforms: '4 Shops',
    statPlatformsDesc: 'Mindfactory 🇩🇪, AliExpress, Amazon, eBay',
    pageOf: 'Seite',
    showingResults: 'Angezeigt',
    prevPage: 'Zurück',
    nextPage: 'Weiter',
    jumpToPage: 'Gehe zu Seite',
    databaseScale: '100.000+ Hardware-Artikel in Datenbank',
    brandFilter: 'Marke',
    allBrands: 'Alle Marken',
    priceRangeSlider: 'Preisbereich',
  },
  ru: {
    appName: 'BudgetTech',
    tagline: 'Мультиязычный агрегатор бюджетного железа',
    heroBadge: 'Проверенные скидки · Мониторинг в реальном времени',
    heroTitle1: 'Максимум FPS и Звука.',
    heroTitleHighlight: 'Минимум Бюджета.',
    heroTitle2: 'Без переплат за маркетинг.',
    heroSubtitle: 'Агрегируем лучшие цены с AliExpress, Amazon и eBay на легендарные компоненты с рекордным соотношением цена/производительность.',
    searchPlaceholder: 'Поиск процессоров, планарных IEM, клавиатур, мышей...',
    categoryAll: 'Все железо',
    categoryCpus: 'Процессоры',
    categoryAudio: 'Звук и Наушники',
    categoryPeripherals: 'Периферия',
    categoryGpus: 'Видеокарты и Комплекты',
    sortLabel: 'Сортировка',
    sortValue: 'По топ-выгоде (Score)',
    sortPriceAsc: 'Сначала дешевые',
    sortPriceDesc: 'Сначала дорогие',
    sortDiscount: 'По размеру скидки',
    filterPriceRange: 'Лимит бюджета',
    filterUnder50: 'До 50 $',
    filterUnder100: 'До 100 $',
    filterAllPrices: 'Любая цена',
    valueScoreLabel: 'Индекс выгоды',
    savePercent: 'СКИДКА',
    lowestOn: 'Дешевле всего на',
    inspectDetails: 'Смотреть',
    addToPlanner: 'В сборку',
    inPlanner: 'В сборке',
    // Auth Modal
    authModalTitle: 'Авторизация в терминале',
    authModalSubtitle: 'Войдите для доступа к закрытой базе проверенных скидок, мультивалютному конвертеру и конструктору бюджетных сборок.',
    tabLogin: 'Вход',
    tabRegister: 'Регистрация',
    emailLabel: 'Email адрес',
    passwordLabel: 'Пароль',
    loginButton: 'Войти в терминал',
    registerButton: 'Создать аккаунт',
    guestLoginButton: 'Быстрый вход как Кибер-Гость',
    guestLoginSubtext: 'Без ввода пароля · Мгновенное открытие сайта',
    authSecurityNote: 'Профиль надежно сохраняется в базе сервера и не вылетает при перезагрузках',
    authDemoHint: 'Код подтверждения высылается на вашу почту, а также доступен прямо в окне для мгновенного теста.',
    nameLabel: 'Ваше имя или позывной',
    namePlaceholder: 'Например, Алекс Сборщик',
    verifyCodeTitle: 'Код подтверждения Email',
    verifyCodeSubtitle: 'Мы отправили 6-значный проверочный код на указанный email. Введите его ниже для активации аккаунта.',
    enterCodeLabel: 'Введите 6-значный код подтверждения',
    confirmCodeButton: 'Подтвердить и войти в профиль',
    resendCodeButton: 'Отправить код повторно',
    resendInSeconds: 'Повтор через',
    changeEmail: 'Сменить Email',
    codeSentNotice: 'Код отправлен на',
    verifiedBadge: 'Подтверждённый профиль',
    // Profile
    profileTitle: 'Профиль пользователя',
    guestNameDefault: 'Кибер-Гость',
    profileStatsTitle: 'Статистика железа',
    profileItemsInWishlist: 'Компонентов в сборке',
    profileEstimatedSavings: 'Сэкономлено бюджета',
    profileCurrency: 'Текущая валюта',
    logoutButton: 'Выйти из аккаунта',
    // Detail Modal
    modalSpecsTitle: 'Технические характеристики',
    modalProsTitle: 'Технические преимущества',
    modalConsTitle: 'Технические нюансы и ограничения',
    modalMarketplaceTitle: 'Сравнение реальных цен на маркетплейсах',
    modalDirectBuy: 'Перейти к предложению',
    modalLowestPriceGuaranteed: 'Подтвержденные рыночные цены на маркетплейсах',
    modalClose: 'Закрыть окно',
    modalBenchmarkTitle: 'Бенчмарк эффективности на каждый доллар',
    // Build Planner Drawer
    plannerTitle: 'Конструктор бюджетного ПК / Сетапа',
    plannerSubtitle: 'Суммарная стоимость и экономия с учетом всех маркетплейсов',
    plannerEmpty: 'Ваш конфигуратор пока пуст. Нажмите "+ В сборку" на любой карточке.',
    plannerTotal: 'Итоговая стоимость',
    plannerSavings: 'Экономия против ритейла',
    plannerClear: 'Очистить сборку',
    plannerExport: 'Скопировать спецификацию',
    // Marketplaces
    freeShipping: 'Бесплатная доставка',
    verifiedSeller: 'Проверенный продавец с высоким рейтингом',
    // Stats
    statSavings: '42.8%',
    statSavingsDesc: 'Средняя экономия к MSRP',
    statDeals: '100 000+',
    statDealsDesc: 'Глобальных и немецких предложений',
    statPlatforms: '4 Магазина',
    statPlatformsDesc: 'Mindfactory 🇩🇪, AliExpress, Amazon, eBay',
    pageOf: 'Страница',
    showingResults: 'Показано',
    prevPage: 'Назад',
    nextPage: 'Вперед',
    jumpToPage: 'Перейти к стр.',
    databaseScale: '100 000+ товаров в базе железа',
    brandFilter: 'Бренд',
    allBrands: 'Все бренды',
    priceRangeSlider: 'Диапазон цен',
  },
  uk: {
    appName: 'BudgetTech',
    tagline: 'Мультимовний агрегатор бюджетного заліза',
    heroBadge: 'Перевірені знижки · Оновлення щогодини',
    heroTitle1: 'Максимум FPS і Звуку.',
    heroTitleHighlight: 'Мінімум Бюджету.',
    heroTitle2: 'Без переплат за бренд.',
    heroSubtitle: 'Агрегуємо найнижчі ціни з AliExpress, Amazon та eBay на топові компоненти з рекордним співвідношенням ціна/продуктивність.',
    searchPlaceholder: 'Пошук процесорів, планарних IEM, клавіатур, мишок...',
    categoryAll: 'Все залізо',
    categoryCpus: 'Процесори',
    categoryAudio: 'Звук та Навушники',
    categoryPeripherals: 'Периферія',
    categoryGpus: 'Відеокарти та Комплекти',
    sortLabel: 'Сортування',
    sortValue: 'За індексом вигоди',
    sortPriceAsc: 'Спочатку дешевші',
    sortPriceDesc: 'Спочатку дорожчі',
    sortDiscount: 'За розміром знижки',
    filterPriceRange: 'Ліміт бюджету',
    filterUnder50: 'До 50 $',
    filterUnder100: 'До 100 $',
    filterAllPrices: 'Будь-яка ціна',
    valueScoreLabel: 'Індекс вигоди',
    savePercent: 'ЗНИЖКА',
    lowestOn: 'Найдешевше на',
    inspectDetails: 'Дивитися',
    addToPlanner: 'У збірку',
    inPlanner: 'У збірці',
    // Auth Modal
    authModalTitle: 'Авторизація у терміналі',
    authModalSubtitle: 'Увійдіть для доступу до живих цін з маркетплейсів, конвертера валют та конструктора збірок.',
    tabLogin: 'Вхід',
    tabRegister: 'Реєстрація',
    emailLabel: 'Email адреса',
    passwordLabel: 'Пароль',
    loginButton: 'Увійти в термінал',
    registerButton: 'Створити акаунт',
    guestLoginButton: 'Швидкий вхід як Кібер-Гість',
    guestLoginSubtext: 'Без пароля · Миттєвий доступ до сайту',
    authSecurityNote: 'Профіль надійно зберігається у базі сервера та не вилітає при перезавантаженнях',
    authDemoHint: 'Код підтвердження відправляється на вашу пошту, а також доступний прямо у вікні для швидкого тесту.',
    nameLabel: 'Ваше імʼя або нікнейм',
    namePlaceholder: 'Наприклад, Алекс Збирач',
    verifyCodeTitle: 'Код підтвердження Email',
    verifyCodeSubtitle: 'Ми надіслали 6-значний код перевірки на вказаний email. Введіть його нижче для активації акаунта.',
    enterCodeLabel: 'Введіть 6-значний код підтвердження',
    confirmCodeButton: 'Підтвердити та увійти в профіль',
    resendCodeButton: 'Надіслати код повторно',
    resendInSeconds: 'Повтор через',
    changeEmail: 'Змінити Email',
    codeSentNotice: 'Код надіслано на',
    verifiedBadge: 'Підтверджений профіль',
    // Profile
    profileTitle: 'Профіль користувача',
    guestNameDefault: 'Кібер-Гість',
    profileStatsTitle: 'Статистика заліза',
    profileItemsInWishlist: 'Компонентів у збірці',
    profileEstimatedSavings: 'Заощаджено коштів',
    profileCurrency: 'Активна валюта',
    logoutButton: 'Вийти з акаунта',
    // Detail Modal
    modalSpecsTitle: 'Технічні характеристики',
    modalProsTitle: 'Технічні переваги',
    modalConsTitle: 'Технічні нюанси та обмеження',
    modalMarketplaceTitle: 'Порівняння реальних цін на маркетплейсах',
    modalDirectBuy: 'Перейти до пропозиції',
    modalLowestPriceGuaranteed: 'Підтверджені ринкові ціни на маркетплейсах',
    modalClose: 'Закрити вікно',
    modalBenchmarkTitle: 'Бенчмарк вигоди за кожну гривню/долар',
    // Build Planner Drawer
    plannerTitle: 'Конструктор бюджетного сетапу',
    plannerSubtitle: 'Загальна вартість та економія на різних маркетплейсах',
    plannerEmpty: 'Конфігуратор поки порожній. Натисніть "+ У збірку" на будь-якому товарі.',
    plannerTotal: 'Загальна вартість',
    plannerSavings: 'Економія проти роздрібу',
    plannerClear: 'Очистити збірку',
    plannerExport: 'Скопіювати специфікацію',
    // Marketplaces
    freeShipping: 'Безкоштовна доставка',
    verifiedSeller: 'Перевірений продавець з високим рейтингом',
    // Stats
    statSavings: '42.8%',
    statSavingsDesc: 'Середня економія до MSRP',
    statDeals: '100 000+',
    statDealsDesc: 'Глобальних та німецьких пропозицій',
    statPlatforms: '4 Магазини',
    statPlatformsDesc: 'Mindfactory 🇩🇪, AliExpress, Amazon, eBay',
    pageOf: 'Сторінка',
    showingResults: 'Показано',
    prevPage: 'Назад',
    nextPage: 'Вперед',
    jumpToPage: 'Перейти до стор.',
    databaseScale: '100 000+ товарів у базі заліза',
    brandFilter: 'Бренд',
    allBrands: 'Всі бренди',
    priceRangeSlider: 'Діапазон цін',
  },
};
