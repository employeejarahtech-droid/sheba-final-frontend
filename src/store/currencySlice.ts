// Re-export from store or duplicate slice definition if needed by imports
// But based on my check, I put it in store.ts. 
// If imports expect 'src/store/currencySlice', I should create it.

import { createSlice } from '@reduxjs/toolkit';

export const currencySlice = createSlice({
    name: 'currency',
    initialState: { value: '$' },
    reducers: {
        setCurrency: (state, action) => {
            state.value = action.payload;
        },
    },
});

export const { setCurrency } = currencySlice.actions;
export const selectCurrency = (state: { currency: { value: string } }) => state.currency.value;
export default currencySlice.reducer;
