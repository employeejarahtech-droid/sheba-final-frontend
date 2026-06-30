# Accounts (Accounting) Sidebar — Comparison & Alignment Plan

**Current project:** `h:\jarahtech-clients\sheba-hospital-final\hospital-final\sheba-frontend`
(see [sidebar-data.ts](src/components/layout/data/sidebar-data.ts), edited 2026-06-29)

**Reference project:** `H:\Ronju-Khan-ERP\common-erp-with-db\distribution-system\ronju-mysql-old-project\ronju-erp-frontend`
(see `src/components/layout/data/sidebar-data.ts`)

**Scope:** Sidebar menu for the **Accounts / Accounting** module only. Goal is to align the
current project's Accounting sidebar with the Ronju reference layout (specifically the
**Trial Balance** entry the user flagged).

> Note on duplicate trees: `h:\Sheba-HMS-Final\hms-final\sheba-frontend` is an **older snapshot**
> of this frontend (sidebar-data.ts dated 2026-06-25, no `/dashboard` prefix). This document is
> based on the **current** `jarahtech-clients` tree only.

---

## 1. Ronju reference — Accounting menu

Group: **`FI — Finance & Accounting`**  →  sub-menu **`Accounting`** (icon `HandCoins`, permission `accounting.view`)
URL prefix: `/dashboard/accounting/...`

| # | Title | URL | Icon | Permission |
|---|-------|-----|------|------------|
| 1 | Dashboard | `/dashboard/accounting` | `LayoutDashboard` | `accounting.overview` |
| 2 | Transactions | `/dashboard/accounting/transactions` | `ArrowRightLeft` | `accounting.transactions` |
| 3 | Chart of Accounts | `/dashboard/accounting/accounts` | `List` | `accounting.chart_of_accounts` |
| 4 | Journal Report | `/dashboard/accounting/reports/journal` | `BookOpen` | `accounting.reports.journal.view` |
| 5 | Daily Summary | `/dashboard/accounting/reports/daily-summary` | `CalendarDays` | — |
| 6 | Ledger Report | `/dashboard/accounting/reports/ledger` | `ScrollText` | `accounting.reports.ledger` |
| 7 | **Multi-Ledger Report** | `/dashboard/accounting/reports/multi-ledger` | `ScrollText` | — |
| 8 | Trial Balance | `/dashboard/accounting/reports/trial-balance` | `Scale` | `accounting.reports.trial_balance` |
| 9 | Profit & Loss | `/dashboard/accounting/reports/profit-and-loss` | `PieChart` | `accounting.reports.profit_and_loss` |
| 10 | Balance Sheet | `/dashboard/accounting/reports/balance-sheet` | `FileSpreadsheet` | — |
| 11 | Income List | `/dashboard/accounting/income` | `TrendingUp` | `accounting.incomes` |
| 12 | Expense List | `/dashboard/accounting/expense` | `TrendingDown` | `accounting.expenses` |
| 13 | Cash Flow | `/dashboard/accounting/reports/cash-flow` | `Coins` | — |

**FI group siblings:** `Payroll` (Overview only). **No** Banks / Payments sub-menus in FI.

---

## 2. Current project — Accounting menu

Group: **`Finance`**  →  sub-menu **`Accounting`** (icon `HandCoins`)
URL prefix: `/dashboard/accounting/...`

| # | Title | URL | Icon | Permission |
|---|-------|-----|------|------------|
| 1 | Dashboard | `/dashboard/accounting` | `LayoutDashboard` | — |
| 2 | Transactions | `/dashboard/accounting/transactions` | `FileText` | — |
| 3 | Chart of Accounts | `/dashboard/accounting/accounts` | `List` | — |
| 4 | Journal Report | `/dashboard/accounting/reports/journal` | `FileText` | — |
| 5 | Daily Summary | `/dashboard/accounting/reports/daily-summary` | `Activity` | — |
| 6 | Ledger Report | `/dashboard/accounting/reports/ledger` | `FileText` | — |
| 7 | Trial Balance | `/dashboard/accounting/reports/trial-balance` | `Scale` | — |
| 8 | Profit & Loss | `/dashboard/accounting/reports/profit-and-loss` | `PieChart` | — |
| 9 | Balance Sheet | `/dashboard/accounting/reports/balance-sheet` | `FileText` | — |
| 10 | Cash Flow | `/dashboard/accounting/reports/cash-flow` | `TrendingUp` | — |
| 11 | Income | `/dashboard/accounting/income` | `TrendingUp` | — |
| 12 | Expense | `/dashboard/accounting/expenses` | `TrendingDown` | — |

**Finance group siblings:** `Banks` (Bank Accounts, Transactions, Deposits, Withdrawals),
`Payroll` (Overview, Employees, Attendance, Salary Structure, All Payrolls),
`Payments` (Process Payments, Payment History, Reconciliation).

### Duplicate Accounting entries under the separate **Reports** group

Reports → **Accounting Reports** sub-section (icon `DollarSign`):

| Title | URL | Icon |
|-------|-----|------|
| Daily Transactions | `/dashboard/reports/accounting/daily-transactions` | `FileText` |
| Income vs Expense | `/dashboard/reports/accounting/income-vs-expense` | `Scale` |
| Profit & Loss | `/dashboard/reports/accounting/profit-and-loss` | `PieChart` |
| **Trial Balance** | `/dashboard/reports/accounting/trial-balance` | `Scale` |
| Balance Sheet | `/dashboard/reports/accounting/balance-sheet` | `FileText` |
| Ledger | `/dashboard/reports/accounting/ledger` | `FileText` |
| Journal | `/dashboard/reports/accounting/journal` | `FileText` |
| Cash Flow | `/dashboard/reports/accounting/cash-flow` | `TrendingUp` |
| Bank Book | `/dashboard/reports/accounting/bank-book` | `Landmark` |

> This **Accounting Reports** sub-section does **not** exist in Ronju. Ronju keeps every
> accounting statement under the single **Accounting** menu only.

---

## 3. Differences (current vs Ronju)

| # | Area | Ronju | Current | Severity |
|---|------|-------|---------|----------|
| D1 | **Multi-Ledger Report** | In menu (#7) | **Missing from menu** — but route exists at `routes/.../accounting/reports/multi-ledger/index.tsx` (+ print) | High |
| D2 | **Ordering of last 3** | Balance Sheet → Income List → Expense List → Cash Flow | Balance Sheet → Cash Flow → Income → Expense | Medium |
| D3 | **Labels** | "Income List" / "Expense List" | "Income" / "Expense" | Low |
| D4 | **Expense URL** | `/accounting/expense` (singular) | `/accounting/expenses` (plural) — a stale `/accounting/expense` route folder also exists | Medium |
| D5 | **Permissions** | Granular `permission` on 9/13 items (e.g. `accounting.reports.trial_balance`) | **None** — no access control on the Accounting menu | Medium |
| D6 | **Icons** | Distinct per item (`ArrowRightLeft`, `BookOpen`, `CalendarDays`, `ScrollText`, `FileSpreadsheet`, `Coins`) | `FileText` reused for 5 items → visually identical | Low |
| D7 | **Group name** | `FI — Finance & Accounting` | `Finance` | Low |
| D8 | **Finance siblings** | Only `Payroll` | Adds `Banks` + `Payments`; `Payroll` expanded (5 vs 1) | Info (hospital-specific, likely keep) |
| D9 | **Reports duplication** | Accounting statements live **only** under Accounting | Trial Balance, P&L, Balance Sheet, Ledger, Journal, Cash Flow duplicated under Reports → Accounting Reports | **High** (Trial Balance focus) |
| D10 | **Stale route folders** | — | `accounting/expense/` **and** `accounting/expenses/`; `reports/profit-loss/` **and** `profit-and-loss/` | Low |

---

## 4. Trial Balance — the flagged item (user focus)

Trial Balance currently appears **twice** in the sidebar with the same `Scale` icon:

1. `Finance → Accounting → Trial Balance` → `/dashboard/accounting/reports/trial-balance` ✅ (route exists)
2. `Reports → Accounting Reports → Trial Balance` → `/dashboard/reports/accounting/trial-balance` ✅ (route exists)

Ronju has it **once**, under Accounting, with permission `accounting.reports.trial_balance`.

**To align with Ronju** (minimal change): keep entry #1 under Accounting; remove the duplicate
entry #2 (and ideally the whole Accounting Reports sub-section — see D9) from the Reports group.

---

## 5. Recommended alignment actions (in priority order)

1. **(D9) Remove the duplicate Accounting statements from Reports.** Delete the
   `Accounting Reports` sub-section in the Reports group (or at minimum its `Trial Balance`,
   `Profit & Loss`, `Balance Sheet`, `Ledger`, `Journal`, `Cash Flow` items — the items already
   present once under Accounting). Keep only the truly extra report (`Daily Transactions`,
   `Income vs Expense`, `Bank Book`) if they are not duplicates of existing Accounting pages.
2. **(D1) Add `Multi-Ledger Report`** to the Accounting menu between "Ledger Report" and
   "Trial Balance": `{ title: 'Multi-Ledger Report', url: '/dashboard/accounting/reports/multi-ledger', icon: ScrollText }`
   (route already exists).
3. **(D2) Reorder** the last three Accounting items to: `… Balance Sheet → Income List → Expense List → Cash Flow`.
4. **(D3 + D4) Normalize labels/URLs**: rename "Income"→"Income List", "Expense"→"Expense List";
   settle on one expense slug (`/expense` to match Ronju) and delete the stale duplicate route folder.
5. **(D10) Clean up stale route folders**: remove the unused `accounting/expense/` (or `expenses/`)
   and `reports/profit-loss/` (keeping `profit-and-loss/`).
6. **(D6) Differentiate icons** — stop reusing `FileText`; adopt Ronju's distinct icons.
7. **(D5) Add permissions** (`accounting.*` / `accounting.reports.*`) to each Accounting item
   once the RBAC layer is wired in the current project (optional / deferred).
8. **(D7/D8)** Cosmetic group rename and the Banks/Payments/Payments additions can stay as-is
   (hospital scope differs from Ronju's distribution scope).

---

## 6. Target Accounting menu (after alignment)

```
Accounting  (HandCoins)
├─ Dashboard                 /dashboard/accounting                         LayoutDashboard
├─ Transactions              /dashboard/accounting/transactions            ArrowRightLeft
├─ Chart of Accounts         /dashboard/accounting/accounts               List
├─ Journal Report            /dashboard/accounting/reports/journal        BookOpen
├─ Daily Summary             /dashboard/accounting/reports/daily-summary  CalendarDays
├─ Ledger Report             /dashboard/accounting/reports/ledger         ScrollText
├─ Multi-Ledger Report       /dashboard/accounting/reports/multi-ledger   ScrollText
├─ Trial Balance             /dashboard/accounting/reports/trial-balance  Scale
├─ Profit & Loss             /dashboard/accounting/reports/profit-and-loss PieChart
├─ Balance Sheet             /dashboard/accounting/reports/balance-sheet  FileSpreadsheet
├─ Income List               /dashboard/accounting/income                 TrendingUp
├─ Expense List              /dashboard/accounting/expense                TrendingDown
└─ Cash Flow                 /dashboard/accounting/reports/cash-flow      Coins
```

---

### Source files referenced

- Current menu: `sheba-frontend/src/components/layout/data/sidebar-data.ts` (Finance group, lines ~310–362; Reports group "Accounting Reports", lines ~452–466)
- Current routes: `sheba-frontend/src/routes/_authenticated/dashboard/accounting/**`
- Reference menu: `ronju-erp-frontend/src/components/layout/data/sidebar-data.ts` ("FI — Finance & Accounting" group, ~lines 619–718)
