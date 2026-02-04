

import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

import { toast } from 'sonner';
import { logout, setCredentials } from './features/auth/authSlice';
import type { RootState } from './store'; // make sure this is your correct path

interface RefreshTokenResponse {
  data?: {
    token: string;
  };
}

// Basic baseQuery with auth header
const baseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_API_URL}/api`,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Enhanced baseQuery with refresh token logic
const baseQueryWithRefreshToken: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (arg, api, extraOptions) => {
  let result = await baseQuery(arg, api, extraOptions);

  if (result.error?.status === 404 || result.error?.status === 403) {
    const errorData = result.error.data as { message?: string };
    const url = typeof arg === 'string' ? arg : arg.url || '';

    if (!url.includes('/auth/change-password')) {
      toast.error(errorData?.message || 'Request failed', {
        position: 'top-right',
        style: { backgroundColor: 'red', color: 'white' },
      });
    }
  }

  if (result.error?.status === 401) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
        {
          credentials: 'include',
          method: 'POST',
        }
      );

      const data: RefreshTokenResponse = await res.json();

      if (data?.data?.token) {
        const user = (api.getState() as RootState).auth.user;
        if (user) {
          api.dispatch(setCredentials({ user, token: data.data.token }));
          // Retry original request with new token
          result = await baseQuery(arg, api, extraOptions);
        }
      } else {
        api.dispatch(logout());
        // optional: trigger logout endpoint if needed
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      api.dispatch(logout());
    }
  }

  return result;
};

// Create the API instance
export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithRefreshToken,
  tagTypes: [
    'Auth',
    'Users',
    'Departments',
    'Category',
    'Unit',
    'Customers',
    'Product',
    'Stock',
    'StockMovement',
    'Attendance',
    'Leaves',
    'Roles',
    'Role',
    'Accounting',
    'Staffs',
    'Suppliers',
    'Purchases',
    'Sales',
    'Expenses',
    'SalesRoutes',
    'Warehouses',
    'SalesInvoices',
    'SalesPayments',
    'SalesOrders',
    'SalesInvoice',
    'SalesInvoiceByCustomers',
    'SalesPayment',
    'SalesRoute',
    "Settings",
    "PurchaseInvoices",
    "PurchasePayments",
    "PurchaseMaps",
    "Purchase",
    "Stats",
    "Reports",
    "SalesOrdersByRoute",
    "RawMaterialCategory",
    "RawMaterialUnit",
    "RawMaterial",
    'RawMaterialSupplier',
    'RawMaterialPurchaseOrder',
    'RawMaterialPurchaseInvoice',
    'RawMaterialPayment',
    'ProductionBatch',
    'BillOfMaterial',
    'FinishedGood',
    'InactiveCustomers',
    'ActiveCustomers',
    'StaffCheckIn',
    'staffRoutes',
    "incomeCreditHead",
    "expenseCreditHead",
    "AccountingAccounts",
    "PayrollStructure"
  ],
  endpoints: () => ({}),
});
