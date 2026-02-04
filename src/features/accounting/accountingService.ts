
import api from '@/lib/axios';
import type {
    ChartOfAccount,
    CreateTransactionInput,
    CreditHead,
    DebitHead,
    Expense,
    ExpenseBreakdownResponse,
    Income,
    IncomeHeadResponse,
    ListResponse,
    OverviewResponse,
    Payroll,
    ProfitLossResponse,
    RecentActivityResponse,
    Transaction,
    TrialBalanceResponse,
    ChartResponse,
    CreditHeadByIdResponse,
    CreditHeadResponse,
    DebitHeadByIdResponse,
    DebitHeadResponse,
    ExpenseResponse,
    IncomeResponse,
    JournalReportResponse,
    PayrollResponse
} from '@/types/accounting.types';

// Reuse types from accounting.types where possible, or define response shapes here if needed.
// Note: I am importing some types from the implementation below for convenience if they were exported, 
// but since I am rewriting the service, I should strictly rely on accounting.types.ts
// However, the user provided code had some response types defined in the service file.
// I will redefine necessary response types here or use generics.

export const accountingService = {
    // GET ACCOUNTING OVERVIEW
    getAccountingOverview: async () => {
        const response = await api.get<OverviewResponse>('/accounting/overview');
        return response.data;
    },

    // GET RECENT ACTIVITY
    getRecentActivity: async () => {
        const response = await api.get<RecentActivityResponse>('/accounting/recent-activity');
        return response.data;
    },

    // GET EXPENSE BREAKDOWN
    getExpenseBreakdown: async () => {
        const response = await api.get<ExpenseBreakdownResponse>('/accounting/expense-breakdown');
        return response.data;
    },

    // GET ALL INCOMES
    getIncomes: async (params?: { page?: number; limit?: number; search?: string; date?: string }) => {
        const response = await api.get<IncomeResponse>('/accounting/incomes', { params });
        return response.data;
    },

    // ADD INCOME
    addIncome: async (body: Partial<Income>) => {
        const response = await api.post<IncomeResponse>('/accounting/incomes/head-wise', body);
        return response.data;
    },

    // GET ALL EXPENSES
    getExpenses: async (params?: { page?: number; limit?: number; search?: string; date?: string }) => {
        const response = await api.get<ExpenseResponse>('/accounting/expenses', { params });
        return response.data;
    },

    // ADD EXPENSE
    addExpense: async (body: Partial<Expense>) => {
        const response = await api.post<ExpenseResponse>('/accounting/expenses', body);
        return response.data;
    },

    // ADD EXPENSE HEADWISE
    addExpenseHeadwise: async (body: Partial<Expense>) => {
        const response = await api.post<ExpenseResponse>('/accounting/expenses/head-wise', body);
        return response.data;
    },

    // ADD CREDIT HEAD
    addCreditHead: async (body: Partial<CreditHead>) => {
        const response = await api.post<CreditHeadResponse>('/accounting/credit-head', body);
        return response.data;
    },

    // GET ALL CREDIT HEADS
    getAllCreditHeads: async (params?: { page?: number; limit?: number; search?: string }) => {
        const response = await api.get<CreditHeadResponse>('/accounting/credit-head', { params });
        return response.data;
    },

    // GET INCOME HEADS
    getIncomeHeads: async () => {
        const response = await api.get<IncomeHeadResponse>('/accounting/accounts/heads/income');
        return response.data;
    },

    // GET SINGLE CREDIT HEAD
    getSingleCreditHead: async (id: number) => {
        const response = await api.get<CreditHeadByIdResponse>(`/accounting/credit-head/${id}`);
        return response.data;
    },

    // UPDATE CREDIT HEAD
    updateCreditHead: async (id: number, body: Partial<CreditHead>) => {
        const response = await api.put<CreditHeadResponse>(`/accounting/credit-head/${id}`, body);
        return response.data;
    },

    // DELETE CREDIT HEAD
    deleteCreditHead: async (id: number) => {
        const response = await api.delete<CreditHeadResponse>(`/accounting/credit-head/${id}`);
        return response.data;
    },

    // ADD DEBIT HEAD
    addDebitHead: async (body: Partial<DebitHead>) => {
        const response = await api.post<DebitHeadResponse>('/accounting/debit-head', body);
        return response.data;
    },

    // GET ALL DEBIT HEADS
    getAllDebitHeads: async (params?: { page?: number; limit?: number; search?: string }) => {
        const response = await api.get<DebitHeadResponse>('/accounting/debit-head', { params });
        return response.data;
    },

    // GET SINGLE DEBIT HEAD
    getSingleDebitHead: async (id: number) => {
        const response = await api.get<DebitHeadByIdResponse>(`/accounting/debit-head/${id}`);
        return response.data;
    },

    // UPDATE DEBIT HEAD
    updateDebitHead: async (id: number, body: Partial<DebitHead>) => {
        const response = await api.put<DebitHeadResponse>(`/accounting/debit-head/${id}`, body);
        return response.data;
    },

    // DELETE DEBIT HEAD
    deleteDebitHead: async (id: number) => {
        const response = await api.delete<DebitHeadResponse>(`/accounting/debit-head/${id}`);
        return response.data;
    },

    // GET CHART DATA
    getAccountingChartData: async () => {
        const response = await api.get<ChartResponse>('/accounting/charts');
        return response.data;
    },

    // GET PAYROLL
    getPayroll: async () => {
        const response = await api.get<PayrollResponse>('/accounting/payroll');
        return response.data;
    },

    // ADD PAYROLL
    addPayroll: async (body: Partial<Payroll>) => {
        const response = await api.post<Payroll>('/accounting/payroll', body);
        return response.data;
    },

    // CREATE INCOME HEAD
    createIncomeHead: async (body: Partial<CreditHead>) => {
        const response = await api.post<CreditHeadResponse>('/accounting/accounts/heads/income', body);
        return response.data;
    },

    // CREATE EXPENSE HEAD
    createExpenseHead: async (body: Partial<CreditHead>) => {
        const response = await api.post<ListResponse<CreditHead>>('/accounting/accounts/heads/expense', body);
        return response.data;
    },

    // GET EXPENSE HEADS
    getExpenseHeads: async (params?: { page?: number; limit?: number; search?: string }) => {
        const response = await api.get<ListResponse<CreditHead>>('/accounting/accounts/heads/expense', { params });
        return response.data;
    },

    // GET ACCOUNTING ACCOUNTS (Chart of Accounts)
    getAccountingAccounts: async (params?: { page?: number; limit?: number; search?: string }) => {
        const response = await api.get<ListResponse<ChartOfAccount>>('/accounting/accounts', { params });
        return response.data;
    },

    // ADD ACCOUNTING ACCOUNT
    addAccountingAccount: async (body: Partial<ChartOfAccount>) => {
        const response = await api.post<ListResponse<ChartOfAccount>>('/accounting/accounts', body);
        return response.data;
    },

    // UPDATE ACCOUNTING ACCOUNT
    updateAccountingAccount: async (id: number, body: Partial<ChartOfAccount>) => {
        const response = await api.put<ListResponse<ChartOfAccount>>(`/accounting/accounts/${id}`, body);
        return response.data;
    },

    // ADD JOURNAL ENTRY
    addJournalEntry: async (body: { date: string; narration: string; entries: { account_id: number; debit: number; credit: number }[] }) => {
        const response = await api.post<JournalReportResponse>('/accounting/journal-entry', body);
        return response.data;
    },

    // GET JOURNAL REPORT
    getJournalReport: async (params?: { page?: number; limit?: number; search?: string; from?: string; to?: string }) => {
        const response = await api.get<JournalReportResponse>('/accounting/reports/journal', { params });
        return response.data;
    },

    // GET TRIAL BALANCE
    getTrialBalance: async (params?: { date?: string }) => {
        const response = await api.get<TrialBalanceResponse>('/accounting/reports/trial-balance', { params });
        return response.data;
    },

    // GET PROFIT & LOSS
    getProfitLoss: async (params?: { from?: string; to?: string }) => {
        const response = await api.get<ProfitLossResponse>('/accounting/reports/profit-and-loss', { params });
        return response.data;
    },

    // GET TRANSACTIONS
    getTransactions: async (params?: { page?: number; limit?: number; search?: string; date?: string; start_date?: string; end_date?: string; type?: string }) => {
        const response = await api.get<ListResponse<Transaction>>('/accounting/transactions', { params });
        return response.data;
    },

    // ADD TRANSACTION
    addTransaction: async (body: CreateTransactionInput) => {
        const response = await api.post<ListResponse<Transaction>>('/accounting/transactions', body);
        return response.data;
    },
};
