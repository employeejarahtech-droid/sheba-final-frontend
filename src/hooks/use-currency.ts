import { useAppSelector } from '@/store/store'

// Currency code to symbol mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: 'USD',
  BDT: 'BDT',
  EUR: 'EUR',
  GBP: 'GBP',
  JPY: 'JPY',
  INR: 'INR',
  CAD: 'CAD',
  AUD: 'AUD',
  CNY: 'CNY',
  // Middle East currencies
  AED: 'AED',
  SAR: 'SAR',
  QAR: 'QAR',
  KWD: 'KWD',
  OMR: 'OMR',
  BHD: 'BHD',
  EGP: 'EGP',
  PKR: 'PKR',
  // If the value is already a symbol, return it as-is
  $: 'USD',
  '৳': 'BDT',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  '₹': 'INR',
}

// Currency code to locale mapping
const CURRENCY_LOCALES: Record<string, string> = {
  USD: 'en-US',
  BDT: 'en-BD',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  INR: 'en-IN',
  CAD: 'en-CA',
  AUD: 'en-AU',
  CNY: 'zh-CN',
  // Middle East currencies
  AED: 'ar-AE',
  SAR: 'ar-SA',
  QAR: 'ar-QA',
  KWD: 'ar-KW',
  OMR: 'ar-OM',
  BHD: 'ar-BH',
  EGP: 'ar-EG',
  PKR: 'ur-PK',
}

/**
 * Hook to get the current currency from settings
 * @returns Object containing currency code, symbol, locale, and format function
 */
export function useCurrency() {
  const currency = useAppSelector(state => state.currency.value) || ''

  // Check if it's already a symbol (for backwards compatibility), map to code
  let currencyCode = currency
  if (!currency || currency === '$' || currency === 'USD') currencyCode = 'USD'
  else if (currency === '৳' || currency === 'BDT') currencyCode = 'BDT'
  else if (currency === '€' || currency === 'EUR') currencyCode = 'EUR'
  else if (currency === '£' || currency === 'GBP') currencyCode = 'GBP'
  else if (currency === '¥') currencyCode = 'JPY' // Default to JPY for ¥
  else if (currency === '₹') currencyCode = 'INR'

  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode
  const locale = CURRENCY_LOCALES[currencyCode] || 'en-US'

  // Manual format (not Intl's style:'currency') — Intl's spacing between the
  // currency code and the number is locale-dependent and collapses to "BDT150"
  // for locales like en-BD, so we build the "CODE amount" string ourselves.
  const format = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return `${currencySymbol} ${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return {
    currency: currencyCode,
    currencySymbol,
    locale,
    format,
  }
}

/**
 * Format amount with currency symbol
 * @param amount - The amount to format
 * @param currency - Optional currency code/symbol (defaults to store value)
 */
export function formatCurrency(amount: number | string, currency?: string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  const symbol = currency
    ? CURRENCY_SYMBOLS[currency] || currency
    : CURRENCY_SYMBOLS['USD'] // Default to USD if no currency provided

  return `${symbol} ${numAmount.toLocaleString()}`
}
