# Project Analysis based on Client Chat

## 1. Project Overview
**Client Type:** Small Retail Shop (Enterprise status)
**Scale:** ~30 Employees total (Company A: 10, Company B: 20)
**Core Needs:** Simple Accounting, LHDN e-Invoice Compliance, Payroll.
**Platform Preference:** Web-based.

## 2. Requirement Extraction & Status Matching

| Feature Category | Client Requirement (from Chat) | Current Project Status | Match Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Platform** | Web-based system | **Implemented** | ✅ Match | The project is a modern web application (React/Node). |
| **Accounting** | Simple accounting system | **Implemented/In-Progress** | ⚠️ Partial | `ChartOfAccounts`, `Transactions` exist. The system is robust (Double Entry), might need a "Simple Mode" view for retail. |
| **e-Invoicing** | **LHDN Compliant e-Invoice** Integration | **Missing** | ❌ **CRITICAL GAP** | No references to "LHDN", "TIN", or "e-Invoice" found in codebase. This is a newly requested core compliance feature. |
| **Payroll** | Salary calculation, Payslips, Basic Reports | **Planned** | ⚠️ Partial | `payroll_plan.md` exists defining logic. API service has some endpoints, but full UI/Logic for "Payslips" & "Reports" is likely incomplete. |
| **Organization** | Single Enterprise with multiple components (Company A & B) | **Branches Feature** | ⚠️ Partial | System supports "Branches" (added recently). Need to verify if Branches can support distinct Tax configurations if required, or if they share the Enterprise Personal TIN. |
| **Tax/Legal** | TIN is Personal (Enterprise), e-Invoice under Company Name | **Settings Needed** | ❌ Gap | Need specific settings to handle "Personal TIN" vs "Business Name" mapping for e-Invoice submission. |

## 3. Detailed Gap Analysis

### A. LHDN e-Invoice (Major Priority)
*   **Requirement:** The client specifically requested LHDN (Malaysia Tax Authority) compliant e-invoicing.
*   **Current State:** Zero implementation.
*   **Action Needed:**
    1.  Research LHDN API requirements (MyInvois Portal).
    2.  Create `e-invoice` module.
    3.  Add settings for TIN (Tax Identification Number), MSIC codes, and Digital Signature certificates.
    4.  Integrate with Sales module to trigger e-Invoice on sale.

### B. Payroll
*   **Requirement:** 10 + 20 employees.
*   **Current State:** `payroll_plan.md` outlines the structure (Basic + Allowances - Deductions).
*   **Action Needed:**
    1.  Implement the logic defined in `payroll_plan.md`.
    2.  Create UI for "Run Payroll", "Payslip View", and "Payroll Reports".

### C. Multi-Entity / Branch Logic
*   **Requirement:** "Company A" and "Company B" (total 30 employees).
*   **Current State:** Branch feature exists.
*   **Action Needed:** Ensure Payroll and Sales can be filtered/managed by "Branch" (A vs B) to keep the 10/20 employee split organized.

## 4. Next Steps Recommendation
1.  **Immediate**: Scaffold the **LHDN e-Invoice** module. This is a compliance requirement and likely the primary selling point.
2.  **Secondary**: Complete the **Payroll** UI based on the existing plan.
3.  **Configuration**: Add "Company Settings" to input Personal TIN and Business Registration Numbers.
