import { createSlice } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit'; // Assuming toolkit is installed, otherwise mock
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Currency is loaded asynchronously from company settings, so seed the initial
// state from localStorage to make the last-known currency available on first
// paint. Without this the UI flashes the USD fallback until the
// /api/company-settings fetch resolves (and bakes USD into already-rendered
// DataTable headers).
const CURRENCY_STORAGE_KEY = 'app_currency';
const readStoredCurrency = (): string => {
    try {
        return localStorage.getItem(CURRENCY_STORAGE_KEY) || '';
    } catch {
        return '';
    }
};

// Currency Slice
export const currencySlice = createSlice({
    name: 'currency',
    initialState: { value: readStoredCurrency() },
    reducers: {
        setCurrency: (state, action) => {
            state.value = action.payload;
            try {
                if (action.payload) localStorage.setItem(CURRENCY_STORAGE_KEY, action.payload);
            } catch {
                /* ignore storage errors (private mode, quota, etc.) */
            }
        },
    },
});

export const { setCurrency } = currencySlice.actions;
export const selectCurrency = (state: RootState) => state.currency.value;
export default currencySlice.reducer;

// Store
export const store = configureStore({
    reducer: {
        currency: currencySlice.reducer,
        // Add other slices if needed
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
