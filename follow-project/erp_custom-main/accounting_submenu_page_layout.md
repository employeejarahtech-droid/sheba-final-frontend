# Accounting Module UI Plan

This document outlines the UI structure and functional requirements for the "Accounting" module. Use this guide to generate the Frontend UI (React/Next.js/etc.) using your AI coding assistant.

---

## 📌 1. Module Overview
**Name**: Accounting & Finance  
**Goal**: Manage double-entry bookkeeping, process daily transactions (Sales, Expense, etc.), and generate realtime financial reports.  
**Theme**: Professional, Clean, Data-Dense (Tables/Charts).

---

## 🗂️ 2. Sidebar Navigation Structure
Ensure these links appear under the "Accounting" section in the Main Sidebar:

| Label | Icon (Lucide/Hero) | Route | Description |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `LayoutDashboard` | `/dashboard/accounting` | Financial Overview & Charts. |
| **Transactions** | `ArrowRightLeft` | `/dashboard/accounting/transactions` | Daily data entry (Sales, Purchase, Expenses). |
| **Chart of Accounts** | `ListTree` | `/dashboard/accounting/accounts` | Manage Account Heads (Assets, Liability, etc.). |
| **Journal Report** | `BookOpen` | `/dashboard/accounting/reports/journal` | Chronological list of all journal entries. |
| **Ledger Report** | `NotebookTabs` | `/dashboard/accounting/reports/ledger` | Account-wise history (e.g., Cash Book). |
| **Trial Balance** | `Scale` | `/dashboard/accounting/reports/trial-balance` | Summary of all account balances. |
| **Profit & Loss** | `TrendingUp` | `/dashboard/accounting/reports/profit-loss` | Income Statement (Revenue vs Expense). |

---

## 🎨 3. Page-by-Page UI Specifications

### A. 📊 Dashboard (`/dashboard/accounting`)
**Objective**: Quick snapshot of financial health.

**Components**:
1.  **Summary Cards** (Row 1):
    *   **Total Income**: Green text/icon. Value from endpoint `GET /overview` (`total_income`).
    *   **Total Expense**: Red text/icon. Value from `total_expense`.
    *   **Net Profit**: Blue text. Value from `net_profit`.
2.  **Charts** (Row 2):
    *   **Income vs Expense Bar Chart**: Visual comparison.
    *   **Expense Breakdown Pie Chart**: "Where is money going?" (e.g., Rent, Salary, Office).
3.  **Recent Activity** (Row 3):
    *   Simple list of last 5 transactions (Date, Description, Amount).

---

### B. 📝 Transactions (`/dashboard/accounting/transactions`)
**Objective**: The main "Workhorse" page for data entry.

**Layout**:
1.  **Header**: Title "Transactions" + Button "New Transaction".
2.  **Data Table**: List of past transactions.
    *   Columns: Date, Type (Badge: Sale/Purchase), Amount, Payment Mode, Description.
3.  **"New Transaction" Modal/Drawer**:
    *   **Transaction Type**: Dropdown (`Sales`, `Purchase`, `Expense`, `Income`, `Journal`).
    *   **Amount**: Number Input (Required).
    *   **Payment Mode**: Dropdown (Cash, Bank, Due).
    *   **Date**: Date Picker (Default: Today).
    *   **Description**: Textarea.
    *   **Submit Button**: POST to `/api/accounting/transactions`.

> **UI Tip**: When "Type" is selected, show a hint explaining what happen (e.g., "Sales: Dr Cash / Cr Sales").

---

### C. 📒 Chart of Accounts (`/dashboard/accounting/accounts`)
**Objective**: Manage the hierarchy of financial heads.

**Layout**:
1.  **Tree View / Nested Table**:
    *   Show accounts grouped by `Type` (Asset, Liability, Equity, Income, Expense).
    *   Indicate hierarchy (Parent -> Child).
2.  **Actions**:
    *   "Add Account" Button: Opens modal.
    *   Edit/Delete icons on row hover.
3.  **Add Account Modal**:
    *   **Name**: Input (e.g., "Petrol Expense").
    *   **Code**: Input (e.g., "5201").
    *   **Type**: Dropdown (Asset, Liability, etc.).
    *   **Parent Account**: Searchable Select (Optional, to make it a sub-account).

---

### D. 📜 Journal Report (`/dashboard/accounting/reports/journal`)
**Objective**: Audit trail.

**Layout**:
1.  **Filters**: Date Range Picker (Start/End Date).
2.  **Display**:
    *   Group by **Transaction/Journal ID**.
    *   Show Header: Date, Narration.
    *   Show Rows: Account Name | Debit | Credit.
    *   **Visual Check**: Ensure Total Debit = Total Credit for each entry.

---

### E. 📖 Ledger Report (`/dashboard/accounting/reports/ledger`)
**Objective**: View history of a specific account (e.g., "Show me all Cash movement").

**Layout**:
1.  **Select Account**: Big searchable dropdown (e.g., Select "Cash").
2.  **Date Range**: From/To.
3.  **Summary Header**:
    *   **Opening Balance**: (from API).
    *   **Closing Balance**: (from API).
4.  **Transaction Table**: Returns chronologically.
    *   Columns: Date, Particulars (Narration), Debit, Credit, **Running Balance**.

---

### F. ⚖️ Trial Balance (`/dashboard/accounting/reports/trial-balance`)
**Objective**: Mathematical accuracy check.

**Layout**:
1.  **Date Filter**: "As of Date".
2.  **Table**:
    *   Columns: Account Code, Account Name, Debit Balance, Credit Balance.
3.  **Footer Row**:
    *   **Total Debit** vs **Total Credit**.
    *   **Status Badge**: "BALANCED" (Green) or "UNBALANCED" (Red).

---

### G. 📈 Profit & Loss (`/dashboard/accounting/reports/profit-loss`)
**Objective**: The "Bottom Line".

**Layout**:
1.  **Date Range**: From/To.
2.  **Split View**:
    *   **Left Column (Income)**: List of all Income accounts & totals.
    *   **Right Column (Expense)**: List of all Expense accounts & totals.
3.  **Footer**:
    *   **Total Income** - **Total Expense** = **NET PROFIT (Big Bold Value)**.

---

## 🔌 API Routes Reference
Use these endpoints to fetch data for the above pages:

*   **Dashboard**: `GET /api/accounting/overview`
*   **Transactions**: `POST /api/accounting/transactions` (Create), `GET /api/accounting/reports/journal` (List)
*   **Accounts**: `GET /api/accounting/accounts`
*   **Journal**: `GET /api/accounting/reports/journal?from=X&to=Y`
*   **Ledger**: `GET /api/accounting/reports/ledger/:id?from=X&to=Y`
*   **Trial Balance**: `GET /api/accounting/reports/trial-balance?date=X`
*   **P&L**: `GET /api/accounting/reports/profit-and-loss?from=X&to=Y`

---

## 🧪 Testing Checklist
1.  Create a "Sales" transaction (Cash).
2.  Go to **Ledger**, select "Sales" -> Should see Credit entry.
3.  Go to **Ledger**, select "Cash" -> Should see Debit entry.
4.  Go to **Trial Balance** -> Total Debit should equal Total Credit.
5.  Go to **P&L** -> Should show the Sales amount as Income and calculated Net Profit.
