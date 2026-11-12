export type Language = 'en' | 'de' | 'ru' | 'uk';

export type Currency = 'USD' | 'EUR' | 'RUB' | 'UAH';

export type Category = 'all' | 'cpus' | 'audio' | 'peripherals' | 'gpus';

export interface MarketplaceOffer {
  marketplace: 'AliExpress' | 'Amazon' | 'eBay' | 'Newegg' | 'Mindfactory' | 'Caseking';
  priceUsd: number;
  shipping: string;
  rating: number;
  url: string;
  isLowest: boolean;
  couponCode?: string;
  region?: string;
}

export interface ProductSpec {
  label: Record<Language, string>;
  value: string;
}

export interface BenchmarkData {
  metricName: Record<Language, string>;
  score: number;
  maxScore: number;
  comparisonText: Record<Language, string>;
}

export interface Product {
  id: string;
  title: string;
  category: Category;
  image: string;
  priceUsd: number;
  originalPriceUsd: number;
  valueScore: number; // 0 - 10
  benchmark: BenchmarkData;
  tagline: Record<Language, string>;
  description: Record<Language, string>;
  specs: ProductSpec[];
  pros: Record<Language, string>[];
  cons: Record<Language, string>[];
  offers: MarketplaceOffer[];
  dealHighlight: Record<Language, string>;
  inStock: boolean;
  rating: number;
  reviewCount: number;
}

export interface UserSession {
  isLoggedIn: boolean;
  email: string;
  name: string;
  avatarSeed: string;
  joinDate: string;
  savedBuildCount: number;
  isVerified?: boolean;
  isGuest?: boolean;
}

