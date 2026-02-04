# Payroll Management & Accounting Integration Plan

## 1. Core Concept: Unified Identity
**Staff = User = Employee**
In this system, a single entity represents the workforce. We refer to them as **Staff**. 
- **Table**: `staffs` (or `users` with role `staff`)
- **Key Fields**: `id`, `basic_salary`, `bank_details`, `department`, `designation`.

---

## 2. Payroll Structure & Calculation

To manage payroll effectively, we need a structure that allows for dynamic earnings and deductions.

### A. Salary Structure (The Components)
We define specific components that make up a salary.
- **Allowances** (Additions):
  - Basic Salary (Fixed)
  - House Rent Allowance (Percentage or Fixed)
  - Transport Allowance (Fixed)
  - Performance Bonus (Variable)
- **Deductions** (Subtractions):
  - Tax / TDS (Percentage of Gross)
  - Provident Fund (EPF) (Percentage of Basic)
  - Advance Salary/Loan Repayment (Fixed)

### B. Calculation Logic
For a given Payroll Run (e.g., January 2025):

1.  **Gross Salary** = `Basic Salary` + `Total Allowances` + `Overtime Pay`
2.  **Total Deductions** = `Tax` + `EPF` + `Loan Deductions`
3.  **Net Salary (Payable)** = `Gross Salary` - `Total Deductions`

**Formula:**
```javascript
Net_Salary = (Basic + HRA + Transport + Bonus) - (Tax + EPF + Loan_Repayment)
```

---

## 3. Workflow

1.  **Setup**: Assign `basic_salary` and recurring components (like Transport Allowance) to each Staff member via their profile.
2.  **Generate Run**: HR creates a "Payroll Run" for a specific month (e.g., "PR-2025-01").
    - The system fetches active staff.
    - Calculates Gross and Net based on defined structure.
    - Status: `PENDING`.
3.  **Review**: HR reviews the calculated figures. Adjustments (e.g., unpaid leave deductions, bonuses) are made manually if needed.
4.  **Approve**: Manager approves the run. Status: `APPROVED`.
5.  **Pay**: Finance/HR marks the run as paid. Status: `PAID`.
    - **Trigger**: **This step updates the Accounts.**

---

## 4. Impact on Accounts (Financial Integration)

This is the critical integration point. Payroll directly affects the Company's Financial Statements (Profit & Loss and Balance Sheet).

### A. Setup Requirements in Accounting Module
We need specific "Heads" in the Accounting module to map these transactions.

1.  **Debit Heads (Expenses)**:
    - `Salaries & Wages` (Main Expense Head)
    - `Employer EPF Contribution` (Expense)
    - `Bonuses` (Expense)
2.  **Credit Heads (Liability/Asset)**:
    - `Cash / Bank` (Asset - Reduces when paid)
    - `TDS Payable` (Liability - Owed to Gov)
    - `EPF Payable` (Liability - Owed to Gov)

### B. Accounting Entries (The Flow)

**Scenario 1: Simple Cash/Bank Payment (Cash Basis)**
When the Payroll Run status changes to **PAID**:
*   **Action**: Automatically create a record in the `Expense` table.
*   **Data Mapping**:
    *   `Amount`: Total Net Salary of the Payroll Run.
    *   `Debit Head`: "Salaries & Wages" (ID mapped in settings).
    *   `Date`: Payment Date.
    *   `Description`: "Payroll Payment for [Month] - [Run Code]".
    *   `Reference`: Bank Transaction ID.

**Scenario 2: Detailed Journal Entry (Accrual Basis - Advanced)**
If the system supports double-entry bookkeeping:
*   **Debit**: Salary Expense (Gross Amount)
*   **Credit**: Bank Account (Net Amount Paid)
*   **Credit**: Taxes Payable (Tax Deducted)
*   **Credit**: EPF Payable (EPF Deducted)

### C. Implementation in Current System (Simple Approach)
Since we have an `Expenses` module:
1.  **Trigger**: When `PATCH /api/payroll/runs/:id/pay` is called.
2.  **Process**:
    - Calculate `Total Net Pay` for the run.
    - Insert into `expenses` table:
      ```json
      {
        "date": "2025-01-31",
        "amount": 50000.00,
        "description": "Staff Payroll - Jan 2025",
        "debit_head_id": <ID_FOR_SALARY_EXPENSE>,
        "status": "paid",
        "paid_via": "bank_transfer"
      }
      ```

---

## 5. Development Tasks

### Backend
1.  **Database Migration**:
    - `payroll_runs`: `id`, `month`, `total_gross`, `total_net`, `status`, `payment_date`.
    - `payroll_items`: `id`, `run_id`, `staff_id`, `basic`, `allowances`, `deductions`, `net_pay`.
2.  **API Endpoints**:
    - `POST /api/payroll/generate`: Calculate and create draft run.
    - `POST /api/payroll/pay/:run_id`: Mark as paid and **create Accounting Expense**.

### Frontend
1.  **Staff Profile**: Add "Salary Settings" tab (Basic Salary, Allowances).
2.  **Payroll Run Page**: Show breakdown of calculation.
3.  **Payment Action**: A "Pay Now" button that confirms the action and shows a success message "Payroll Paid & Expense Recorded".

---

## 6. Summary of Accounting Effect
| Action | Accounting Impact | Report Affected |
| :--- | :--- | :--- |
| **Salary Payment** | Adds an **Expense** entry | **Profit & Loss** (Reduces Profit) |
| **Tax Deduction** | Creates/Adds to a **Liability** (if tracking liabilities) | **Balance Sheet** |
| **Payout** | Reduces **Cash/Bank** Balance | **Overview / Cash Flow** |

