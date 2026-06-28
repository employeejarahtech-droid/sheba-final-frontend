// Single source of truth for the currency slice lives in store.ts (that's the
// reducer wired into the store). Re-export from there so importers of
// '@/store/currencySlice' get the same action creators and persistence logic
// rather than a second, dead slice definition.
export { setCurrency, selectCurrency, currencySlice } from './store';
export { default } from './store';
