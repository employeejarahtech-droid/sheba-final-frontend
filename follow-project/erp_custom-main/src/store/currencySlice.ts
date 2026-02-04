import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './store';

export interface CurrencyState {
  value: string | null;
}

const initialState: CurrencyState = {
  value: null,
};

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setCurrency: (state, action: PayloadAction<string>) => {
      state.value = action.payload;
    },
    clearCurrency: (state) => {
      state.value = null;
    },
  },
});

export const { setCurrency, clearCurrency } = currencySlice.actions;

export default currencySlice.reducer;

// Selector
export const selectCurrency = (state: RootState) => state.currency.value;
