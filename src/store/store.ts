import { createSlice } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit'; // Assuming toolkit is installed, otherwise mock
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Currency Slice
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
