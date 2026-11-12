import { Currency } from '../types';

export const currencyRates: Record<Currency, number> = {
  USD: 1.0,
  EUR: 0.92,
  RUB: 92.5,
  UAH: 41.2,
};

export const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  RUB: '₽',
  UAH: '₴',
};

export function formatPrice(priceUsd: number, currency: Currency): string {
  const converted = priceUsd * currencyRates[currency];
  const symbol = currencySymbols[currency];

  if (currency === 'USD' || currency === 'EUR') {
    return `${symbol}${converted.toFixed(converted < 10 ? 2 : 0)}`;
  }
  return `${Math.round(converted).toLocaleString()} ${symbol}`;
}
