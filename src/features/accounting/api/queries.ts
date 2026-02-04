import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface HeadWiseTransactionData {
    type: 'INCOME' | 'EXPENSE';
    title: string;
    amount: number;
    date: string;
    head_id: number;
    payment_method: string | number;
    description?: string;
    reference_number?: string;
}

// --- QUERIES ---

export const useAccounts = ({ page = 1, limit = 10, search = '' } = {}) => {
    return useQuery({
        queryKey: ['accounting:accounts', { page, limit, search }],
        queryFn: async () => {
            const result = await window.electron.invoke('accounting:getAllAccounts', { page, limit, search });
            return result;
        },
    });
};

export const useIncomeHeads = () => {
    return useQuery({
        queryKey: ['accounting:income-heads'],
        queryFn: async () => {
            const result = await window.electron.invoke('accounting:getIncomeHeads');
            return result;
        },
    });
};

export const useExpenseHeads = () => {
    return useQuery({
        queryKey: ['accounting:expense-heads'],
        queryFn: async () => {
            const result = await window.electron.invoke('accounting:getExpenseHeads');
            return result;
        },
    });
};

export const useAccount = (id: number) => {
    return useQuery({
        queryKey: ['accounting:accounts', id],
        queryFn: async () => {
            const result = await window.electron.invoke('accounting:getAccountById', id);
            return result;
        },
        enabled: !!id,
    });
};

export const useAccountingOverview = () => {
    return useQuery({
        queryKey: ['accounting:overview'],
        queryFn: async () => {
            const result = await window.electron.invoke('accounting:getOverview');
            return result;
        },
    });
};

export const useAccountingRecentActivity = () => {
    return useQuery({
        queryKey: ['accounting:recent-activity'],
        queryFn: async () => {
            const result = await window.electron.invoke('accounting:getRecentActivity');
            return result;
        },
    });
};

export const useJournalReport = (filters: { from?: string; to?: string } = {}) => {
    return useQuery({
        queryKey: ['accounting:reports:journal', filters],
        queryFn: async () => {
            const result = await window.electron.invoke('accounting:getJournalReport', filters);
            return result;
        },
    });
};

export const useTrialBalance = (date?: string) => {
    return useQuery({
        queryKey: ['accounting:reports:trial-balance', date],
        queryFn: async () => {
            const result = await window.electron.invoke('accounting:getTrialBalance', date);
            return result;
        },
    });
};

export const useProfitAndLoss = (filters: { from?: string; to?: string } = {}) => {
    return useQuery({
        queryKey: ['accounting:reports:profit-and-loss', filters],
        queryFn: async () => {
            const result = await window.electron.invoke('accounting:getProfitAndLoss', filters);
            return result;
        },
    });
};

// --- MUTATIONS ---

export const useAddAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newAccount: any) => {
            const result = await window.electron.invoke('accounting:createAccount', newAccount);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounting:accounts'] });
        },
    });
};

export const useUpdateAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            const result = await window.electron.invoke('accounting:updateAccount', { id, data });
            return result;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['accounting:accounts'] });
            queryClient.invalidateQueries({ queryKey: ['accounting:accounts', id] });
        },
    });
};

export const useDeleteAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const result = await window.electron.invoke('accounting:deleteAccount', id);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounting:accounts'] });
        },
    });
};

export const useCreateJournalEntry = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const result = await window.electron.invoke('accounting:createJournalEntry', data);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounting:reports:journal'] });
            queryClient.invalidateQueries({ queryKey: ['accounting:overview'] });
            queryClient.invalidateQueries({ queryKey: ['accounting:recent-activity'] });
            queryClient.invalidateQueries({ queryKey: ['accounting:reports:trial-balance'] });
            queryClient.invalidateQueries({ queryKey: ['accounting:reports:profit-and-loss'] });
        },
    });
};

export const useCreateHeadWiseTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: HeadWiseTransactionData) => {
            const result = await window.electron.invoke('accounting:createHeadWiseTransaction', data);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounting:overview'] });
            queryClient.invalidateQueries({ queryKey: ['accounting:recent-activity'] });
            queryClient.invalidateQueries({ queryKey: ['accounting:reports:journal'] });
            queryClient.invalidateQueries({ queryKey: ['accounting:reports:trial-balance'] });
            queryClient.invalidateQueries({ queryKey: ['accounting:reports:profit-and-loss'] });
        },
    });
};

export const useLedgerReport = (params: { account_id: number; from?: string; to?: string }) => {
    return useQuery({
        queryKey: ["accounting", "ledger", params],
        queryFn: () => window.electron.invoke("accounting:getLedger", params),
        enabled: !!params.account_id,
    });
};

export const useAllTransactions = (params: { from?: string; to?: string; type?: string; search?: string } = {}) => {
    return useQuery({
        queryKey: ["accounting", "transactions", params],
        queryFn: async () => {
            // Fetch from Journal Report to ensure consistency
            const journalData: any[] = await window.electron.invoke('accounting:getJournalReport', {
                from: params.from,
                to: params.to
            });

            // Map Journal Entries to Transaction format
            const transactions = journalData.map(entry => {
                const totalAmount = entry.entries.reduce((sum: number, row: any) => sum + Number(row.debit), 0);

                // Find debit and credit accounts (simplified to first found)
                const debitEntry = entry.entries.find((row: any) => Number(row.debit) > 0);
                const creditEntry = entry.entries.find((row: any) => Number(row.credit) > 0);

                return {
                    id: entry.id,
                    date: entry.date,
                    description: entry.narration || "Journal Entry",
                    amount: totalAmount,
                    type: entry.reference_type || "JOURNAL",
                    mode: "JOURNAL", // Default for journal entries
                    debit_account: debitEntry?.account?.name || "Unknown",
                    credit_account: creditEntry?.account?.name || "Unknown",
                    reference: `${entry.reference_type} #${entry.id}`
                };
            });

            // Client-side filtering
            let filtered = transactions;

            if (params.search) {
                const searchLower = params.search.toLowerCase();
                filtered = filtered.filter(tx =>
                    tx.description.toLowerCase().includes(searchLower) ||
                    String(tx.amount).includes(searchLower) ||
                    tx.debit_account.toLowerCase().includes(searchLower) ||
                    tx.credit_account.toLowerCase().includes(searchLower)
                );
            }

            if (params.type) {
                filtered = filtered.filter(tx => tx.type === params.type);
            }

            return { data: filtered };
        },
    });
};

export const useMonthlyTrend = () => {
    return useQuery({
        queryKey: ["accounting", "trend"],
        queryFn: () => window.electron.invoke("accounting:getMonthlyTrend"),
    });
};
