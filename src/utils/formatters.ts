export function formatPrice(amount: number | undefined | null, currency: string = 'EUR'): string {
  // Return placeholder if amount is not a valid number
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0.00';
  }

  const currencySymbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    KRW: '₩',
    RUB: '₽',
    INR: '₹',
    BRL: 'R$',
    ZAR: 'R',
    CHF: 'CHF',
    CAD: '$',
    AUD: '$',
    NZD: '$',
    AED: 'AED',
    CZK: 'Kč',
    PLN: 'zł',
    HUF: 'Ft',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    RON: 'lei',
    ISK: 'kr',
    MXN: '$',
    SGD: '$',
    HKD: '$',
    TRY: '₺',
    THB: '฿',
    MYR: 'RM',
    PHP: '₱',
    IDR: 'Rp'
  };

  const amountFormatted = amount.toFixed(2);
  const symbol = currencySymbols[currency] || currency;

  // These currencies typically place symbol after the amount
  const suffixFormat = ['EUR', 'CZK', 'PLN', 'HUF', 'SEK', 'NOK', 'DKK', 'RON', 'ISK', 'AED'];

  if (suffixFormat.includes(currency)) {
    return `${amountFormatted} ${symbol}`;
  }

  return `${symbol}${amountFormatted}`;
}