// Sample / placeholder data for the Accounting UI.
// Values are illustrative only and do NOT come from the API.
// Account codes & names follow the chart of accounts defined in
// `account-heads-hms.md` (4-digit scheme: 1xxx Asset, 2xxx Liability,
// 3xxx Equity, 4xxx Income, 5xxx–9xxx Expense). Currency: ৳ (BDT).
//
// NOTE: this file is currently not imported anywhere. It exists as a
// reference shape for components under development.

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface DummyAccount {
    id: number;
    code: string;
    name: string;
    type: AccountType;
    balance: number;
    is_active: boolean;
    parent: number | null;
    level: number;
}

// --- Financial overview -------------------------------------------------

export const dummyAccountingOverview = {
    today: { income: 18500, expense: 7200, net: 11300 },
    this_week: { income: 94600, expense: 41200, net: 53400 },
    this_month: { income: 1320000, expense: 800000, net: 520000 },
    this_year: { income: 14250000, expense: 9680000, net: 4570000 },
};

export const dummyChartData = [
    { date: 'Jan', income: 1180000, expense: 760000 },
    { date: 'Feb', income: 1240000, expense: 795000 },
    { date: 'Mar', income: 1090000, expense: 720000 },
    { date: 'Apr', income: 1360000, expense: 840000 },
    { date: 'May', income: 1280000, expense: 810000 },
    { date: 'Jun', income: 1320000, expense: 800000 },
];

export const dummyExpenseBreakdown = {
    labels: ['Salaries', 'Pharmacy Purchase', 'Utilities', 'Maintenance', 'Administrative', 'Other'],
    data: [
        { name: 'Salaries', value: 480000 },
        { name: 'Pharmacy Purchase', value: 300000 },
        { name: 'Utilities', value: 95000 },
        { name: 'Maintenance', value: 70000 },
        { name: 'Administrative', value: 20000 },
        { name: 'Other', value: 35000 },
    ],
};

export const dummyRecentActivity = {
    data: [
        { title: 'Consultation Fee — OPD', amount: '+৳600', date: '2 hours ago' },
        { title: 'Pharmacy Purchase', amount: '-৳4,500', date: '5 hours ago' },
        { title: 'Laboratory Income', amount: '+৳1,200', date: '1 day ago' },
        { title: 'Electricity Bill', amount: '-৳18,400', date: '1 day ago' },
        { title: 'Bed / Cabin Charges — IPD', amount: '+৳3,500', date: '2 days ago' },
    ],
};

// --- Chart of accounts (sample subset, see account-heads-hms.md) --------

export const dummyAccounts: DummyAccount[] = [
    // ASSETS
    { id: 1, code: '1000', name: 'Current Assets', type: 'Asset', balance: 1320000, is_active: true, parent: null, level: 0 },
    { id: 2, code: '1100', name: 'Cash in Hand', type: 'Asset', balance: 150000, is_active: true, parent: 1, level: 1 },
    { id: 3, code: '1200', name: 'Bank Accounts', type: 'Asset', balance: 850000, is_active: true, parent: 1, level: 1 },
    { id: 4, code: '1210', name: 'Bank — City Bank', type: 'Asset', balance: 850000, is_active: true, parent: 3, level: 2 },
    { id: 5, code: '1300', name: 'Accounts Receivable', type: 'Asset', balance: 120000, is_active: true, parent: 1, level: 1 },
    { id: 6, code: '1500', name: 'Inventory', type: 'Asset', balance: 200000, is_active: true, parent: 1, level: 1 },
    { id: 7, code: '1600', name: 'Fixed Assets', type: 'Asset', balance: 1500000, is_active: true, parent: null, level: 0 },
    { id: 8, code: '1620', name: 'Medical Equipment', type: 'Asset', balance: 1500000, is_active: true, parent: 7, level: 1 },
    // LIABILITIES
    { id: 9, code: '2000', name: 'Current Liabilities', type: 'Liability', balance: 200000, is_active: true, parent: null, level: 0 },
    { id: 10, code: '2100', name: 'Accounts Payable', type: 'Liability', balance: 90000, is_active: true, parent: 9, level: 1 },
    { id: 11, code: '2210', name: 'Payable — Surgeon', type: 'Liability', balance: 50000, is_active: true, parent: 9, level: 1 },
    { id: 12, code: '2300', name: 'Patient Advance Received', type: 'Liability', balance: 60000, is_active: true, parent: 9, level: 1 },
    // EQUITY
    { id: 13, code: '3000', name: 'Owner Capital', type: 'Equity', balance: 2100000, is_active: true, parent: null, level: 0 },
    // INCOME
    { id: 14, code: '4000', name: 'Outdoor / OPD Income', type: 'Revenue', balance: 240000, is_active: true, parent: null, level: 0 },
    { id: 15, code: '4010', name: 'Registration Fee', type: 'Revenue', balance: 40000, is_active: true, parent: 14, level: 1 },
    { id: 16, code: '4020', name: 'Consultation Fee', type: 'Revenue', balance: 200000, is_active: true, parent: 14, level: 1 },
    { id: 17, code: '4100', name: 'Laboratory Income', type: 'Revenue', balance: 360000, is_active: true, parent: null, level: 0 },
    { id: 18, code: '4400', name: 'Indoor / IPD Income', type: 'Revenue', balance: 720000, is_active: true, parent: null, level: 0 },
    { id: 19, code: '4410', name: 'Bed / Cabin Charges', type: 'Revenue', balance: 520000, is_active: true, parent: 18, level: 1 },
    { id: 20, code: '4440', name: 'Surgeon Fee Income', type: 'Revenue', balance: 200000, is_active: true, parent: 18, level: 1 },
    // EXPENSE
    { id: 21, code: '5000', name: 'Cost of Services', type: 'Expense', balance: 300000, is_active: true, parent: null, level: 0 },
    { id: 22, code: '5010', name: 'Pharmacy Purchase', type: 'Expense', balance: 300000, is_active: true, parent: 21, level: 1 },
    { id: 23, code: '5400', name: 'Payroll & HR', type: 'Expense', balance: 480000, is_active: true, parent: null, level: 0 },
    { id: 24, code: '5410', name: 'Salaries & Wages', type: 'Expense', balance: 480000, is_active: true, parent: 23, level: 1 },
    { id: 25, code: '9000', name: 'Administrative & General', type: 'Expense', balance: 20000, is_active: true, parent: null, level: 0 },
    { id: 26, code: '9010', name: 'Stationery & Printing', type: 'Expense', balance: 20000, is_active: true, parent: 25, level: 1 },
];

// --- Head pickers -------------------------------------------------------

export const dummyCreditHeads = [
    { id: 1, name: 'Consultation Fee', code: '4020', description: 'OPD doctor consultation', is_active: true },
    { id: 2, name: 'Laboratory Income', code: '4100', description: 'Pathology / lab tests', is_active: true },
    { id: 3, name: 'Bed / Cabin Charges', code: '4410', description: 'IPD bed & cabin', is_active: true },
    { id: 4, name: 'Surgeon Fee Income', code: '4440', description: 'Surgery fees collected', is_active: true },
];

export const dummyDebitHeads = [
    { id: 1, name: 'Pharmacy Purchase', code: '5010', description: 'Medicine & drug purchases', is_active: true },
    { id: 2, name: 'Salaries & Wages', code: '5410', description: 'Staff payroll', is_active: true },
    { id: 3, name: 'Electricity', code: '5610', description: 'Electricity bill', is_active: true },
    { id: 4, name: 'Stationery & Printing', code: '9010', description: 'Office supplies', is_active: true },
];

export const dummyIncomeHeads = [
    { id: 14, name: 'Outdoor / OPD Income', code: '4000', parent_id: null, is_active: true },
    { id: 15, name: 'Registration Fee', code: '4010', parent_id: 14, is_active: true },
    { id: 16, name: 'Consultation Fee', code: '4020', parent_id: 14, is_active: true },
    { id: 17, name: 'Laboratory Income', code: '4100', parent_id: null, is_active: true },
    { id: 18, name: 'Indoor / IPD Income', code: '4400', parent_id: null, is_active: true },
    { id: 19, name: 'Bed / Cabin Charges', code: '4410', parent_id: 18, is_active: true },
];

export const dummyExpenseHeads = [
    { id: 21, name: 'Cost of Services', code: '5000', parent_id: null, is_active: true },
    { id: 22, name: 'Pharmacy Purchase', code: '5010', parent_id: 21, is_active: true },
    { id: 23, name: 'Payroll & HR', code: '5400', parent_id: null, is_active: true },
    { id: 24, name: 'Salaries & Wages', code: '5410', parent_id: 23, is_active: true },
    { id: 25, name: 'Administrative & General', code: '9000', parent_id: null, is_active: true },
    { id: 26, name: 'Stationery & Printing', code: '9010', parent_id: 25, is_active: true },
];

// --- Transaction lists --------------------------------------------------

export const dummyTransactions = [
    { id: 1, date: '2026-06-15', description: 'OPD Consultation', debit_account: 'Cash', credit_account: 'Consultation Fee', amount: 600, reference: 'INV-0145' },
    { id: 2, date: '2026-06-14', description: 'Pharmacy Purchase', debit_account: 'Pharmacy Purchase', credit_account: 'Cash', amount: 4500, reference: 'PO-0088' },
    { id: 3, date: '2026-06-13', description: 'Lab Test Payment', debit_account: 'Cash', credit_account: 'Laboratory Income', amount: 1200, reference: 'INV-0144' },
    { id: 4, date: '2026-06-12', description: 'Electricity Bill', debit_account: 'Electricity', credit_account: 'Bank — City Bank', amount: 18400, reference: 'UTIL-021' },
];

export const dummyIncomeList = [
    { id: 1, date: '2026-06-15', head: 'Consultation Fee', amount: 600, description: 'OPD visit — Dr. Rahman', reference: 'INV-0145' },
    { id: 2, date: '2026-06-13', head: 'Laboratory Income', amount: 1200, description: 'CBC + Lipid profile', reference: 'INV-0144' },
    { id: 3, date: '2026-06-11', head: 'Bed / Cabin Charges', amount: 3500, description: 'Cabin — 2 nights', reference: 'IPD-0032' },
];

export const dummyExpenseList = [
    { id: 1, date: '2026-06-14', head: 'Pharmacy Purchase', amount: 4500, description: 'Medicine restock', reference: 'PO-0088' },
    { id: 2, date: '2026-06-12', head: 'Electricity', amount: 18400, description: 'May electricity bill', reference: 'UTIL-021' },
    { id: 3, date: '2026-06-10', head: 'Salaries & Wages', amount: 480000, description: 'Staff salary — May', reference: 'PAY-005' },
];

// --- Journal ------------------------------------------------------------

export const dummyJournalEntries = [
    { id: 1, date: '2026-06-15', account: 'Cash', debit: 600, credit: 0, description: 'OPD Consultation' },
    { id: 2, date: '2026-06-15', account: 'Consultation Fee', debit: 0, credit: 600, description: 'OPD Consultation' },
    { id: 3, date: '2026-06-14', account: 'Pharmacy Purchase', debit: 4500, credit: 0, description: 'Pharmacy Purchase' },
    { id: 4, date: '2026-06-14', account: 'Cash', debit: 0, credit: 4500, description: 'Pharmacy Purchase' },
];

export const dummyJournalEntriesDetailed = [
    {
        id: 1,
        date: '2026-06-15',
        narration: 'OPD Consultation — INV-0145',
        reference_type: 'OPD_PAYMENT',
        entries: [
            { id: 1, account: { name: 'Cash', code: '1100' }, debit: 600, credit: 0 },
            { id: 2, account: { name: 'Consultation Fee', code: '4020' }, debit: 0, credit: 600 },
        ],
    },
    {
        id: 2,
        date: '2026-06-14',
        narration: 'Pharmacy Purchase — PO-0088',
        reference_type: 'PHARMACY_PURCHASE',
        entries: [
            { id: 3, account: { name: 'Pharmacy Purchase', code: '5010' }, debit: 4500, credit: 0 },
            { id: 4, account: { name: 'Cash', code: '1100' }, debit: 0, credit: 4500 },
        ],
    },
    {
        id: 3,
        date: '2026-06-13',
        narration: 'Laboratory Test — CBC + Lipid',
        reference_type: 'OPD_PAYMENT',
        entries: [
            { id: 5, account: { name: 'Cash', code: '1100' }, debit: 1200, credit: 0 },
            { id: 6, account: { name: 'Laboratory Income', code: '4100' }, debit: 0, credit: 1200 },
        ],
    },
    {
        id: 4,
        date: '2026-06-12',
        narration: 'Electricity Bill — May',
        reference_type: 'UTILITY_PAYMENT',
        entries: [
            { id: 7, account: { name: 'Electricity', code: '5610' }, debit: 18400, credit: 0 },
            { id: 8, account: { name: 'Bank — City Bank', code: '1210' }, debit: 0, credit: 18400 },
        ],
    },
];

// --- Reports ------------------------------------------------------------

// Balanced: total debit ৳3,620,000 == total credit ৳3,620,000
export const dummyTrialBalance = [
    { account: 'Cash', debit: 150000, credit: 0 },
    { account: 'Bank — City Bank', debit: 850000, credit: 0 },
    { account: 'Accounts Receivable', debit: 120000, credit: 0 },
    { account: 'Inventory', debit: 200000, credit: 0 },
    { account: 'Medical Equipment', debit: 1500000, credit: 0 },
    { account: 'Salaries & Wages', debit: 480000, credit: 0 },
    { account: 'Pharmacy Purchase', debit: 300000, credit: 0 },
    { account: 'Stationery & Printing', debit: 20000, credit: 0 },
    { account: 'Accounts Payable', debit: 0, credit: 90000 },
    { account: 'Payable — Surgeon', debit: 0, credit: 50000 },
    { account: 'Patient Advance Received', debit: 0, credit: 60000 },
    { account: 'Owner Capital', debit: 0, credit: 2100000 },
    { account: 'Registration Fee', debit: 0, credit: 40000 },
    { account: 'Consultation Fee', debit: 0, credit: 200000 },
    { account: 'Laboratory Income', debit: 0, credit: 360000 },
    { account: 'Bed / Cabin Charges', debit: 0, credit: 520000 },
    { account: 'Surgeon Fee Income', debit: 0, credit: 200000 },
];

export const dummyTrialBalanceDetailed = [
    { code: '1100', account: 'Cash', type: 'Asset', debit: 150000, credit: 0 },
    { code: '1210', account: 'Bank — City Bank', type: 'Asset', debit: 850000, credit: 0 },
    { code: '1300', account: 'Accounts Receivable', type: 'Asset', debit: 120000, credit: 0 },
    { code: '1500', account: 'Inventory', type: 'Asset', debit: 200000, credit: 0 },
    { code: '1620', account: 'Medical Equipment', type: 'Asset', debit: 1500000, credit: 0 },
    { code: '2100', account: 'Accounts Payable', type: 'Liability', debit: 0, credit: 90000 },
    { code: '2210', account: 'Payable — Surgeon', type: 'Liability', debit: 0, credit: 50000 },
    { code: '2300', account: 'Patient Advance Received', type: 'Liability', debit: 0, credit: 60000 },
    { code: '3000', account: 'Owner Capital', type: 'Equity', debit: 0, credit: 2100000 },
    { code: '4010', account: 'Registration Fee', type: 'Revenue', debit: 0, credit: 40000 },
    { code: '4020', account: 'Consultation Fee', type: 'Revenue', debit: 0, credit: 200000 },
    { code: '4100', account: 'Laboratory Income', type: 'Revenue', debit: 0, credit: 360000 },
    { code: '4410', account: 'Bed / Cabin Charges', type: 'Revenue', debit: 0, credit: 520000 },
    { code: '4440', account: 'Surgeon Fee Income', type: 'Revenue', debit: 0, credit: 200000 },
    { code: '5010', account: 'Pharmacy Purchase', type: 'Expense', debit: 300000, credit: 0 },
    { code: '5410', account: 'Salaries & Wages', type: 'Expense', debit: 480000, credit: 0 },
    { code: '9010', account: 'Stationery & Printing', type: 'Expense', debit: 200000, credit: 0 },
];

export const dummyProfitLoss = {
    income: 1320000,
    expenses: 800000,
    net_profit: 520000,
};

export const dummyProfitLossDetailed = {
    income: [
        { code: '4010', name: 'Registration Fee', amount: 40000 },
        { code: '4020', name: 'Consultation Fee', amount: 200000 },
        { code: '4100', name: 'Laboratory Income', amount: 360000 },
        { code: '4410', name: 'Bed / Cabin Charges', amount: 520000 },
        { code: '4440', name: 'Surgeon Fee Income', amount: 200000 },
    ],
    expense: [
        { code: '5010', name: 'Pharmacy Purchase', amount: 300000 },
        { code: '5410', name: 'Salaries & Wages', amount: 480000 },
        { code: '9010', name: 'Stationery & Printing', amount: 20000 },
    ],
    total_income: 1320000,
    total_expense: 800000,
    net_profit: 520000,
};

// Running balance of the Cash (1100) account
export const dummyLedger = [
    { date: '2026-06-15', description: 'OPD Consultation', debit: 600, credit: 0, balance: 150600 },
    { date: '2026-06-14', description: 'Pharmacy Purchase', debit: 0, credit: 4500, balance: 150000 },
    { date: '2026-06-13', description: 'Lab Test Payment', debit: 1200, credit: 0, balance: 154500 },
    { date: '2026-06-12', description: 'Opening Balance', debit: 0, credit: 0, balance: 153300 },
];
