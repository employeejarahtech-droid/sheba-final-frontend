import React from "react";
import { useGetAccountingAccountsQuery, useGetTrialBalanceQuery } from "@/features/accounting/accountingQueries";

export interface AccountTreeNode {
    id: number;
    name: string;
    code: string;
    type: string;
    parent_id: number | null;
    is_active: boolean;
    is_protected: boolean;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    children: AccountTreeNode[];
    level: number;
}

// Shared by the interactive Chart of Accounts page and its print view: fetches
// every account + the trial balance, then builds the parent/child hierarchy
// with debit/credit/balance rolled up from children into each parent.
export function useChartOfAccountsTree() {
    const { data: accountsData, isFetching } = useGetAccountingAccountsQuery({ page: 1, limit: 1000 });
    const { data: trialBalanceData } = useGetTrialBalanceQuery();

    const balanceMap = React.useMemo(() => {
        // Keyed by account id (NOT name) — several accounts share a name
        // (e.g. "Surgical / OT Supplies"), so name-keying would overwrite and
        // give the wrong debit/credit. id matches exactly one journal-derived row.
        const map = new Map<number, { debit: number; credit: number; balance: number }>();
        const items = trialBalanceData?.trial_balance;
        if (Array.isArray(items)) {
            items.forEach((item: any) => {
                const debit = parseFloat(item.debit) || 0;
                const credit = parseFloat(item.credit) || 0;
                const isDebitNature = ['ASSET', 'EXPENSE'].includes(item.type);
                const balance = isDebitNature ? (debit - credit) : (credit - debit);
                map.set(item.id, { debit, credit, balance });
            });
        }
        return map;
    }, [trialBalanceData]);

    const treeData = React.useMemo(() => {
        const rawAccounts = accountsData?.data || [];
        const nodeMap = new Map<number, AccountTreeNode>();

        rawAccounts.forEach((acc) => {
            const balanceInfo = balanceMap.get(acc.id) || { debit: 0, credit: 0, balance: 0 };
            nodeMap.set(acc.id, {
                id: acc.id,
                name: acc.name,
                code: acc.code,
                type: acc.type,
                parent_id: acc.parent_id,
                is_active: acc.is_active !== false,
                is_protected: !!(acc as any).is_protected,
                description: (acc as any).description || "",
                debit: balanceInfo.debit,
                credit: balanceInfo.credit,
                balance: balanceInfo.balance,
                children: [],
                level: 0,
            });
        });

        const roots: AccountTreeNode[] = [];
        nodeMap.forEach((node) => {
            if (node.parent_id && nodeMap.has(node.parent_id)) {
                nodeMap.get(node.parent_id)!.children.push(node);
            } else {
                roots.push(node);
            }
        });

        const processNode = (node: AccountTreeNode, level: number): { debit: number; credit: number; balance: number } => {
            node.level = level;
            let childrenDebit = 0;
            let childrenCredit = 0;
            let childrenBalance = 0;

            node.children.forEach((child) => {
                const childTotals = processNode(child, level + 1);
                childrenDebit += childTotals.debit;
                childrenCredit += childTotals.credit;
                childrenBalance += childTotals.balance;
            });

            node.debit += childrenDebit;
            node.credit += childrenCredit;
            node.balance += childrenBalance;

            node.children.sort((a, b) => a.code.localeCompare(b.code));

            return { debit: node.debit, credit: node.credit, balance: node.balance };
        };

        roots.forEach((root) => processNode(root, 0));
        roots.sort((a, b) => a.code.localeCompare(b.code));

        return roots;
    }, [accountsData, balanceMap]);

    const assetsTree = React.useMemo(() => treeData.filter(n => n.type.toUpperCase() === "ASSET"), [treeData]);
    const liabilitiesTree = React.useMemo(() => treeData.filter(n => n.type.toUpperCase() === "LIABILITY"), [treeData]);
    const equityTree = React.useMemo(() => treeData.filter(n => n.type.toUpperCase() === "EQUITY"), [treeData]);
    const incomeTree = React.useMemo(() => treeData.filter(n => n.type.toUpperCase() === "INCOME"), [treeData]);
    const expenseTree = React.useMemo(() => treeData.filter(n => n.type.toUpperCase() === "EXPENSE"), [treeData]);

    return { isFetching, treeData, assetsTree, liabilitiesTree, equityTree, incomeTree, expenseTree };
}
