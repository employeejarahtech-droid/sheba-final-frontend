
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingService } from './accountingService';

export const ACCOUNTING_KEYS = {
    all: ['accounting'] as const,
    overview: () => [...ACCOUNTING_KEYS.all, 'overview'] as const,
    recentActivity: () => [...ACCOUNTING_KEYS.all, 'recentActivity'] as const,
    expenseBreakdown: () => [...ACCOUNTING_KEYS.all, 'expenseBreakdown'] as const,
    incomes: () => [...ACCOUNTING_KEYS.all, 'incomes'] as const,
    expenses: () => [...ACCOUNTING_KEYS.all, 'expenses'] as const,
    creditHeads: () => [...ACCOUNTING_KEYS.all, 'creditHeads'] as const,
    incomeHeads: () => [...ACCOUNTING_KEYS.all, 'incomeHeads'] as const,
    debitHeads: () => [...ACCOUNTING_KEYS.all, 'debitHeads'] as const,
    expenseHeads: () => [...ACCOUNTING_KEYS.all, 'expenseHeads'] as const,
    chartData: () => [...ACCOUNTING_KEYS.all, 'chartData'] as const,
    payroll: () => [...ACCOUNTING_KEYS.all, 'payroll'] as const,
    accounts: () => [...ACCOUNTING_KEYS.all, 'accounts'] as const,
    journalReport: () => [...ACCOUNTING_KEYS.all, 'journalReport'] as const,
    trialBalance: () => [...ACCOUNTING_KEYS.all, 'trialBalance'] as const,
    profitLoss: () => [...ACCOUNTING_KEYS.all, 'profitLoss'] as const,
    transactions: () => [...ACCOUNTING_KEYS.all, 'transactions'] as const,
};

export const useGetAccountingOverviewQuery = () => {
    return useQuery({
        queryKey: ACCOUNTING_KEYS.overview(),
        queryFn: accountingService.getAccountingOverview,
    });
};

export const useGetRecentActivityQuery = () => {
    return useQuery({
        queryKey: ACCOUNTING_KEYS.recentActivity(),
        queryFn: accountingService.getRecentActivity,
    });
};

export const useGetExpenseBreakdownQuery = () => {
    return useQuery({
        queryKey: ACCOUNTING_KEYS.expenseBreakdown(),
        queryFn: accountingService.getExpenseBreakdown,
    });
};

export const useGetAccountingChartDataQuery = () => {
    return useQuery({
        queryKey: ACCOUNTING_KEYS.chartData(),
        queryFn: accountingService.getAccountingChartData,
    });
};

export const useGetIncomesQuery = (params?: { page?: number; limit?: number; search?: string; date?: string }) => {
    return useQuery({
        queryKey: [...ACCOUNTING_KEYS.incomes(), params],
        queryFn: () => accountingService.getIncomes(params),
    });
};

export const useAddIncomeMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: accountingService.addIncome,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ACCOUNTING_KEYS.incomes() });
            queryClient.invalidateQueries({ queryKey: ACCOUNTING_KEYS.overview() });
            queryClient.invalidateQueries({ queryKey: ACCOUNTING_KEYS.chartData() });
        },
    });
};

export const useGetExpensesQuery = (params?: { page?: number; limit?: number; search?: string; date?: string }) => {
    return useQuery({
        queryKey: [...ACCOUNTING_KEYS.expenses(), params],
        queryFn: () => accountingService.getExpenses(params),
    });
};

export const useAddExpenseMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: accountingService.addExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ACCOUNTING_KEYS.expenses() });
            queryClient.invalidateQueries({ queryKey: ACCOUNTING_KEYS.overview() });
            queryClient.invalidateQueries({ queryKey: ACCOUNTING_KEYS.chartData() });
        },
    });
};

export const useAddExpenseHeadwiseMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: accountingService.addExpenseHeadwise,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ACCOUNTING_KEYS.expenses() });
            queryClient.invalidateQueries({ queryKey: ACCOUNTING_KEYS.overview() });
        },
    });
};

export const useGetAccountingAccountsQuery = (params?: { page?: number; limit?: number; search?: string }) => {
    return useQuery({
        queryKey: [...ACCOUNTING_KEYS.accounts(), params],
        queryFn: () => accountingService.getAccountingAccounts(params),
    });
};

// For lazy loading, we can just use the same hook but enable: false or useQueryClient within the component
export const useLazyGetAccountingAccountsQuery = () => {
    const queryClient = useQueryClient();
    return [
        async (params: any) => {
            return await queryClient.fetchQuery({
                queryKey: [...ACCOUNTING_KEYS.accounts(), params],
                queryFn: () => accountingService.getAccountingAccounts(params),
            })
        },
        {} // Mocking the second arg of RTK lazy query if needed, or just return basic function
    ] as const;
};


export const useAddAccountingAccountMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: accountingService.addAccountingAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ACCOUNTING_KEYS.accounts() });
        },
    });
};

export const useUpdateAccountingAccountMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id: number; body: any }) => accountingService.updateAccountingAccount(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ACCOUNTING_KEYS.accounts() });
        },
    });
};

export const useAddJournalEntryMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: accountingService.addJournalEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ACCOUNTING_KEYS.journalReport() });
            queryClient.invalidateQueries({ queryKey: ACCOUNTING_KEYS.accounts() });
            queryClient.invalidateQueries({ queryKey: ACCOUNTING_KEYS.overview() });
        },
    });
};

export const useGetJournalReportQuery = (params?: { page?: number; limit?: number; search?: string; from?: string; to?: string }) => {
    return useQuery({
        queryKey: [...ACCOUNTING_KEYS.journalReport(), params],
        queryFn: () => accountingService.getJournalReport(params),
    });
};

export const useGetTrialBalanceQuery = (params?: { date?: string }) => {
    return useQuery({
        queryKey: [...ACCOUNTING_KEYS.trialBalance(), params],
        queryFn: () => accountingService.getTrialBalance(params),
    });
};

export const useGetProfitLossQuery = (params?: { from?: string; to?: string }) => {
    return useQuery({
        queryKey: [...ACCOUNTING_KEYS.profitLoss(), params],
        queryFn: () => accountingService.getProfitLoss(params),
    });
};

export const useGetTransactionsQuery = (params?: { page?: number; limit?: number; search?: string; date?: string; start_date?: string; end_date?: string; type?: string }) => {
    return useQuery({
        queryKey: [...ACCOUNTING_KEYS.transactions(), params],
        queryFn: () => accountingService.getTransactions(params),
    });
};

export const useAddTransactionMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: accountingService.addTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ACCOUNTING_KEYS.transactions() });
            queryClient.invalidateQueries({ queryKey: ACCOUNTING_KEYS.overview() });
        },
    });
};

export const useCreateIncomeHeadMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: accountingService.createIncomeHead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ACCOUNTING_KEYS.incomeHeads() });
            queryClient.invalidateQueries({ queryKey: ACCOUNTING_KEYS.accounts() });
        }
    })
}

export const useCreateExpanseHeadMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: accountingService.createExpenseHead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ACCOUNTING_KEYS.expenseHeads() });
            queryClient.invalidateQueries({ queryKey: ACCOUNTING_KEYS.accounts() });
        }
    })
}

export const useGetIncomeHeadsQuery = () => {
    return useQuery({
        queryKey: ACCOUNTING_KEYS.incomeHeads(),
        queryFn: accountingService.getIncomeHeads,
    });
};

export const useGetExpenseHeadsQuery = (params?: { page?: number; limit?: number; search?: string }) => {
    return useQuery({
        queryKey: [...ACCOUNTING_KEYS.expenseHeads(), params],
        queryFn: () => accountingService.getExpenseHeads(params),
    });
};
