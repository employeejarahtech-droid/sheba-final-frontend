import { useAppSelector } from '@/store/store'

// Currency code to symbol mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  BDT: '৳',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  INR: '₹',
  CAD: 'C$',
  AUD: 'A$',
  CNY: '¥',
  // If the value is already a symbol, return it as-is
  $: '$',
  '৳': '৳',
  '€': '€',
  '£': '£',
  '¥': '¥',
  '₹': '₹',
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
}

/**
 * Hook to get the current currency from settings
 * @returns Object containing currency code, symbol, locale, and format function
 */
export function useCurrency() {
  const currency = useAppSelector(state => state.currency.value) || 'USD'

  // Check if it's already a symbol (for backwards compatibility), map to code
  let currencyCode = currency
  if (currency === '$' || currency === 'USD') currencyCode = 'USD'
  else if (currency === '৳' || currency === 'BDT') currencyCode = 'BDT'
  else if (currency === '€' || currency === 'EUR') currencyCode = 'EUR'
  else if (currency === '£' || currency === 'GBP') currencyCode = 'GBP'
  else if (currency === '¥') currencyCode = 'JPY' // Default to JPY for ¥
  else if (currency === '₹') currencyCode = 'INR'

  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode
  const locale = CURRENCY_LOCALES[currencyCode] || 'en-US'

  // Format function using Intl.NumberFormat
  const format = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return numAmount.toLocaleString(locale, {
      style: 'currency',
      currency: currencyCode,
    })
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

  return `${symbol}${numAmount.toLocaleString()}`
}
