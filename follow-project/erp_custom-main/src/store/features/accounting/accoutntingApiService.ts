import { baseApi } from "@/store/baseApi";
import type {
  CreditHead,
  DebitHead,
  Expense,
  Income,
  Overview,
  Payroll,
  Transaction,
  CreateTransactionInput,
  RecentActivity,
  ExpenseBreakdown,
} from "@/types/accounting.types";


//-------------------- OVERVIEW --------------------

export type OverviewResponse = {
  status: boolean;
  message: string;
  data: Overview;
};

// -------------------- PAGINATION --------------------
export type Pagination = {
  total: number;
  page: string;
  limit: string;
  totalPage: number;
};

// -------------------- INCOME / EXPENSE --------------------
export type ListResponse<T> = {
  status: boolean;
  message: string;
  pagination: Pagination;
  data: T[];
};

export type IncomeResponse = ListResponse<Income>;

export type ExpenseResponse = ListResponse<Expense>;

// -------------------- Credit Head --------------------
export type CreditHeadResponse = ListResponse<CreditHead>;

export type IncomeHeadResponse = {
  status: boolean;
  message: string;
  data: CreditHead[];
};

export type CreditHeadByIdResponse = {
  status: boolean;
  message: string;
  data: CreditHead;
};

// -------------------- Debit Head --------------------
export type DebitHeadResponse = ListResponse<DebitHead>;

export type DebitHeadByIdResponse = {
  status: boolean;
  message: string;
  data: DebitHead;
};

// -------------------- RECENT ACTIVITY --------------------
export type RecentActivityResponse = {
  status: boolean;
  message: string;
  data: RecentActivity[];
};

// -------------------- EXPENSE BREAKDOWN --------------------
export type ExpenseBreakdownResponse = {
  status: boolean;
  message: string;
  data: ExpenseBreakdown[];
};



// -------------------- PAYROLL --------------------

export type PayrollResponse = ListResponse<Payroll>;

// -------------------- CHART DATA --------------------

export type ChartDataPoint = {
  date: string;
  income: number;
  expense: number;
};

export type ChartResponse = {
  status: boolean;
  message: string;
  data: ChartDataPoint[];
};





// ===================================   New Accounting Endpoints  ===================================

export type AccountType =
  | "Asset"
  | "Liability"
  | "Equity"
  | "Income"
  | "Expense";

export interface ChartOfAccount {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  parent: number | null;
  level: number;
}

// -------------------- JOURNAL REPORT --------------------

export interface JournalEntryAccount {
  code: string;
  name: string;
}

export interface JournalEntryDetail {
  id: number;
  journal_id: number;
  account_id: number;
  debit: string;
  credit: string;
  account: JournalEntryAccount;
}

export interface JournalEntry {
  id: number;
  date: string;
  reference_type: string;
  reference_id: number | null;
  narration: string;
  created_at: string;
  updated_at: string;
  entries: JournalEntryDetail[];
}

export type JournalReportResponse = ListResponse<JournalEntry>;

// -------------------- TRIAL BALANCE --------------------

export interface TrialBalanceItem {
  account: string;
  code: string;
  type: string;
  debit: number;
  credit: number;
}

export interface TrialBalanceResponse {
  status: boolean;
  message: string;
  data: {
    trial_balance: TrialBalanceItem[];
    total_debit: number;
    total_credit: number;
    status: "BALANCED" | "UNBALANCED";
  };
}

// -------------------- PROFIT & LOSS --------------------

export interface ProfitLossItem {
  code: string;
  name: string;
  amount: number;
}

export interface ProfitLossResponse {
  status: boolean;
  message: string;
  data: {
    income: ProfitLossItem[];
    expense: ProfitLossItem[];
    total_income: number;
    total_expense: number;
    net_profit: number;
  };
}








// -------------------- RTK QUERY SERVICE --------------------
export const accountingApiService = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET ACCOUNTING OVERVIEW
    getAccountingOverview: builder.query<OverviewResponse, void>({
      query: () => ({ url: "/accounting/overview", method: "GET" }),
      providesTags: ["Accounting"],
    }),

    // GET RECENT ACTIVITY
    getRecentActivity: builder.query<RecentActivityResponse, void>({
      query: () => ({ url: "/accounting/recent-activity", method: "GET" }),
      providesTags: ["Accounting"],
    }),

    // GET EXPENSE BREAKDOWN
    getExpenseBreakdown: builder.query<ExpenseBreakdownResponse, void>({
      query: () => ({ url: "/accounting/expense-breakdown", method: "GET" }),
      providesTags: ["Accounting"],
    }),


    // GET ALL INCOMES
    getIncomes: builder.query<
      IncomeResponse,
      { page?: number; limit?: number; search?: string; date?: string }
    >({
      query: (params) => ({
        url: "/accounting/incomes",
        method: "GET",
        params,
      }),
      providesTags: ["Accounting"],
    }),

    // ADD INCOME
    addIncome: builder.mutation<IncomeResponse, Partial<Income>>({
      query: (body) => ({ url: "/accounting/incomes/head-wise", method: "POST", body }),
      invalidatesTags: ["Accounting"],
    }),

    // GET ALL EXPENSES
    getExpenses: builder.query<
      ExpenseResponse,
      { page?: number; limit?: number; search?: string; date?: string }
    >({
      query: (params) => ({
        url: "/accounting/expenses",
        method: "GET",
        params,
      }),
      providesTags: ["Accounting"],
    }),

    // ADD EXPENSE
    addExpense: builder.mutation<ExpenseResponse, Partial<Expense>>({
      query: (body) => ({ url: "/accounting/expenses", method: "POST", body }),
      invalidatesTags: ["Accounting"],
    }),

    //Add credit head
    addCreditHead: builder.mutation<CreditHeadResponse, Partial<CreditHead>>({
      query: (body) => ({
        url: "/accounting/credit-head",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Accounting"],
    }),

    // GET CREDIT HEAD
    getAllCreditHeads: builder.query<
      CreditHeadResponse,
      { page?: number; limit?: number; search?: string }
    >({
      query: (params) => ({
        url: "/accounting/credit-head",
        method: "GET",
        params,
      }),
      providesTags: ["Accounting"],
    }),

    // GET INCOME HEADS
    getIncomeHeads: builder.query<IncomeHeadResponse, void>({
      query: () => ({
        url: "/accounting/accounts/heads/income",
        method: "GET",
      }),
      providesTags: ["Accounting"],
    }),

    //get single credit head
    getSingleCreditHead: builder.query<CreditHeadByIdResponse, number>({
      query: (id) => ({ url: `/accounting/credit-head/${id}`, method: "GET" }),
      providesTags: ["Accounting"],
    }),

    //update credit head
    updateCreditHead: builder.mutation<
      CreditHeadResponse,
      { id: number; body: Partial<CreditHead> }
    >({
      query: ({ id, body }) => ({
        url: `/accounting/credit-head/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Accounting"],
    }),

    //delete credit head
    deleteCreditHead: builder.mutation<CreditHeadResponse, number>({
      query: (id) => ({
        url: `/accounting/credit-head/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Accounting"],
    }),

    //Add debit head
    addDebitHead: builder.mutation<DebitHeadResponse, Partial<DebitHead>>({
      query: (body) => ({
        url: "/accounting/debit-head",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Accounting"],
    }),

    // GET CREDIT HEAD
    getAllDebitHeads: builder.query<
      DebitHeadResponse,
      { page?: number; limit?: number; search?: string }
    >({
      query: (params) => ({
        url: "/accounting/debit-head",
        method: "GET",
        params,
      }),
      providesTags: ["Accounting"],
    }),

    //get single credit head
    getSingleDebitHead: builder.query<DebitHeadByIdResponse, number>({
      query: (id) => ({ url: `/accounting/debit-head/${id}`, method: "GET" }),
      providesTags: ["Accounting"],
    }),

    //update credit head
    updateDebitHead: builder.mutation<
      DebitHeadResponse,
      { id: number; body: Partial<CreditHead> }
    >({
      query: ({ id, body }) => ({
        url: `/accounting/debit-head/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Accounting"],
    }),

    //delete credit head
    deleteDebitHead: builder.mutation<DebitHeadResponse, number>({
      query: (id) => ({
        url: `/accounting/debit-head/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Accounting"],
    }),

    //GET chart data

    getAccountingChartData: builder.query<ChartResponse, void>({
      query: () => ({ url: "/accounting/charts", method: "GET" }),
      providesTags: ["Accounting"],
    }),

    // GET PAYROLL
    getPayroll: builder.query<PayrollResponse, void>({
      query: () => ({ url: "/accounting/payroll", method: "GET" }),
      providesTags: ["Accounting"],
    }),

    // ADD PAYROLL
    addPayroll: builder.mutation<Payroll, Partial<Payroll>>({
      query: (body) => ({ url: "/accounting/payroll", method: "POST", body }),
      invalidatesTags: ["Accounting"],
    }),


    // ===================================================================================
    // New Endpoint of accounting 
    // ===================================================================================




    // ========================== CREDIT HEADS FOR SPECIFIC TYPES ==========================

    // create Income credit head
    createIncomeHead: builder.mutation<CreditHeadResponse, Partial<CreditHead>>({
      query: (body) => ({
        url: "/accounting/accounts/heads/income",
        method: "POST",
        body,
      }),
      invalidatesTags: ["incomeCreditHead", "AccountingAccounts"],
    }),

    // create Income credit head
    createExpanseHead: builder.mutation<ListResponse<CreditHead>, Partial<CreditHead>>({
      query: (body) => ({
        url: "/accounting/accounts/heads/expense",
        method: "POST",
        body,
      }),
      invalidatesTags: ["expenseCreditHead", "AccountingAccounts"],
    }),
    // ======================== GET Expanse head ===========================================================

    getExpenseHeads: builder.query<ListResponse<CreditHead>, { page?: number; limit?: number; search?: string }>({
      query: (params) => ({
        url: "/accounting/accounts/heads/expense",
        method: "GET",
        params,
      }),
      providesTags: ["expenseCreditHead"],
    }),

    // ================================ Accounts API ==================================================

    getAccountingAccounts: builder.query<ListResponse<ChartOfAccount>, { page?: number; limit?: number; search?: string }>({
      query: (params) => ({ url: "/accounting/accounts", method: "GET", params }),
      providesTags: ["AccountingAccounts"],
    }),
    addAccountingAccount: builder.mutation<ListResponse<ChartOfAccount>, Partial<ChartOfAccount>>({
      query: (body) => ({ url: "/accounting/accounts", method: "POST", body }),
      invalidatesTags: ["AccountingAccounts"],
    }),

    // CREATE JOURNAL ENTRY
    addJournalEntry: builder.mutation<JournalReportResponse, { date: string; narration: string; entries: { account_id: number; debit: number; credit: number }[] }>({
      query: (body) => ({
        url: "/accounting/journal-entry",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Accounting", "AccountingAccounts"], // Assuming it affects accounts/overview
    }),

    // GET JOURNAL REPORT
    getJournalReport: builder.query<JournalReportResponse, { page?: number; limit?: number; search?: string; from?: string; to?: string }>({
      query: (params) => ({
        url: "/accounting/reports/journal",
        method: "GET",
        params,
      }),
      providesTags: ["Accounting"],
    }),

    // GET TRIAL BALANCE
    getTrialBalance: builder.query<TrialBalanceResponse, { date?: string }>({
      query: (params) => ({
        url: "/accounting/reports/trial-balance",
        method: "GET",
        params,
      }),
      providesTags: ["Accounting"],
    }),

    // GET PROFIT & LOSS
    getProfitLoss: builder.query<ProfitLossResponse, { from?: string; to?: string }>({
      query: (params) => ({
        url: "/accounting/reports/profit-and-loss",
        method: "GET",
        params,
      }),
      providesTags: ["Accounting"],
    }),


    updateAccountingAccount: builder.mutation<ListResponse<ChartOfAccount>, { id: number; body: Partial<ChartOfAccount> }>({
      query: ({ id, body }) => ({
        url: `/accounting/accounts/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["AccountingAccounts"],
    }),





    // GET TRANSACTIONS
    getTransactions: builder.query<ListResponse<Transaction>, { page?: number; limit?: number; search?: string; date?: string; start_date?: string; end_date?: string; type?: string }>({
      query: (params) => ({
        url: "/accounting/transactions",
        method: "GET",
        params,
      }),
      providesTags: ["Accounting"],
    }),

    // ADD TRANSACTION
    addTransaction: builder.mutation<ListResponse<Transaction>, CreateTransactionInput>({
      query: (body) => ({
        url: "/accounting/transactions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Accounting"],
    }),






    // income expanse endpoint

    // ADD EXPENSE
    addExpenseHeadwise: builder.mutation<ExpenseResponse, Partial<Expense>>({
      query: (body) => ({ url: "/accounting/expenses/head-wise", method: "POST", body }),
      invalidatesTags: ["Accounting"],
    }),





  }),





});

export const {
  useGetAccountingOverviewQuery,
  useGetRecentActivityQuery,
  useGetExpenseBreakdownQuery,
  useGetIncomesQuery,
  useAddIncomeMutation,
  useGetExpensesQuery,
  useAddExpenseMutation,
  useAddCreditHeadMutation,
  useGetAllCreditHeadsQuery,
  useGetIncomeHeadsQuery,
  useGetSingleCreditHeadQuery,
  useUpdateCreditHeadMutation,
  useDeleteCreditHeadMutation,
  useAddDebitHeadMutation,
  useGetAllDebitHeadsQuery,
  useGetSingleDebitHeadQuery,
  useUpdateDebitHeadMutation,
  useDeleteDebitHeadMutation,
  useGetAccountingChartDataQuery,
  useGetPayrollQuery,
  useAddPayrollMutation,
  //  newly added hooks
  useCreateIncomeHeadMutation,
  useCreateExpanseHeadMutation,
  useGetAccountingAccountsQuery,
  useLazyGetAccountingAccountsQuery,
  useAddAccountingAccountMutation,
  useUpdateAccountingAccountMutation,
  useAddJournalEntryMutation,
  useGetJournalReportQuery,
  useGetTransactionsQuery,
  useAddTransactionMutation,
  useGetTrialBalanceQuery,
  useGetProfitLossQuery,
  useGetExpenseHeadsQuery,
  useAddExpenseHeadwiseMutation,

} = accountingApiService;
