export const dummyAccountingOverview = {
    today: { income: 5000, expense: 2000, net: 3000 },
    this_week: { income: 25000, expense: 12000, net: 13000 },
    this_month: { income: 100000, expense: 60000, net: 40000 },
    this_year: { income: 1200000, expense: 800000, net: 400000 },
};

export const dummyChartData = [
    { date: 'Jan', income: 45000, expense: 32000 },
    { date: 'Feb', income: 52000, expense: 38000 },
    { date: 'Mar', income: 48000, expense: 35000 },
    { date: 'Apr', income: 61000, expense: 42000 },
    { date: 'May', income: 58000, expense: 40000 },
    { date: 'Jun', income: 65000, expense: 45000 },
];

export const dummyExpenseBreakdown = {
    labels: ['Salaries', 'Rent', 'Utilities', 'Supplies', 'Marketing', 'Other'],
    data: [
        { name: 'Salaries', value: 30000 },
        { name: 'Rent', value: 18000 },
        { name: 'Utilities', value: 12000 },
        { name: 'Supplies', value: 8000 },
        { name: 'Marketing', value: 7000 }
    ]
};

export const dummyRecentActivity = {
    data: [
        { title: 'Product Sale', amount: '+$2,500', date: '2 hours ago' },
        { title: 'Office Rent Payment', amount: '-$1,500', date: '5 hours ago' },
        { title: 'Service Revenue', amount: '+$3,200', date: '1 day ago' },
        { title: 'Utility Bill', amount: '-$450', date: '1 day ago' },
        { title: 'Product Sale', amount: '+$1,800', date: '2 days ago' },
    ]
};

export const dummyAccounts = [
    { id: 1, code: '1000', name: 'Cash', type: 'Asset', balance: 50000, is_active: true, parent: null, level: 0 },
    { id: 2, code: '1100', name: 'Bank', type: 'Asset', balance: 75000, is_active: true, parent: null, level: 0 },
    { id: 38, code: 'B2025', name: 'DBBL 2025', type: 'Asset', balance: 45000, is_active: true, parent: 2, level: 1 },
    { id: 3, code: '1200', name: 'Accounts Receivable', type: 'Asset', balance: 25000, is_active: true, parent: null, level: 0 },
    { id: 33, code: '54', name: 'update2', type: 'Asset', balance: 5000, is_active: true, parent: 3, level: 1 },
    { id: 32, code: '56458', name: 'Property', type: 'Asset', balance: 150000, is_active: true, parent: 3, level: 1 },
    { id: 35, code: '55221', name: 'result', type: 'Asset', balance: 25000, is_active: true, parent: 32, level: 2 },
    { id: 4, code: '1300', name: 'Inventory', type: 'Asset', balance: 80000, is_active: true, parent: null, level: 0 },
    { id: 37, code: '5220', name: 'test', type: 'Liability', balance: 5000, is_active: true, parent: 4, level: 1 },
    { id: 5, code: '2000', name: 'Accounts Payable', type: 'Liability', balance: 15000, is_active: true, parent: null, level: 0 },
    { id: 7, code: '3000', name: 'Owner Capital', type: 'Equity', balance: 100000, is_active: true, parent: null, level: 0 },
    { id: 8, code: '4000', name: 'Sales', type: 'Revenue', balance: 85000, is_active: true, parent: null, level: 0 },
    { id: 9, code: '4100', name: 'Other Income', type: 'Revenue', balance: 12000, is_active: true, parent: null, level: 0 },
    { id: 23, code: '4845', name: 'level check expnase', type: 'Expense', balance: 3000, is_active: true, parent: null, level: 0 },
    { id: 10, code: '5000', name: 'Purchase', type: 'Expense', balance: 45000, is_active: true, parent: null, level: 0 },
    { id: 11, code: '5100', name: 'Sales Return', type: 'Expense', balance: 2000, is_active: true, parent: null, level: 0 },
    { id: 12, code: '5200', name: 'Office Expense', type: 'Expense', balance: 18000, is_active: true, parent: null, level: 0 },
    { id: 14, code: '5400', name: 'Purchase Return', type: 'Expense', balance: 1500, is_active: true, parent: null, level: 0 },
    { id: 34, code: '55', name: 'gdgd', type: 'Asset', balance: 0, is_active: true, parent: null, level: 0 },
    { id: 36, code: '5520', name: 'test', type: 'Liability', balance: 8000, is_active: true, parent: null, level: 0 },
    { id: 24, code: '5755', name: 'level expanse check', type: 'Revenue', balance: 5000, is_active: true, parent: null, level: 0 },
    { id: 22, code: '854', name: 'level check', type: 'Revenue', balance: 3500, is_active: true, parent: null, level: 0 },
    { id: 27, code: 'ROOT_EXPENSE', name: 'Expenses', type: 'Expense', balance: 65000, is_active: true, parent: null, level: 0 },
    { id: 28, code: '544', name: 'testing expanse', type: 'Expense', balance: 8000, is_active: true, parent: 27, level: 1 },
    { id: 31, code: '5455', name: 'expanse 5640', type: 'Expense', balance: 12000, is_active: true, parent: 27, level: 1 },
    { id: 25, code: 'ROOT_INCOME', name: 'Income', type: 'Revenue', balance: 95000, is_active: true, parent: null, level: 0 },
    { id: 39, code: '4500', name: 'Consulting Income', type: 'Revenue', balance: 25000, is_active: true, parent: 25, level: 1 },
    { id: 26, code: '5454', name: 'hijibiji', type: 'Revenue', balance: 8000, is_active: true, parent: 25, level: 1 },
    { id: 30, code: '5478', name: 'Income 450', type: 'Revenue', balance: 15000, is_active: true, parent: 25, level: 1 },
    { id: 29, code: '5541', name: 'check', type: 'Revenue', balance: 7000, is_active: true, parent: 25, level: 1 },
    { id: 21, code: 't1', name: 'check income head', type: 'Revenue', balance: 4500, is_active: true, parent: null, level: 0 },
    { id: 16, code: 'teh', name: 'test expanse ', type: 'Expense', balance: 2500, is_active: true, parent: null, level: 0 },
    { id: 15, code: 'test', name: 'for test income head', type: 'Revenue', balance: 6000, is_active: true, parent: null, level: 0 },
];

export const dummyTransactions = [
    { id: 1, date: '2026-01-15', description: 'Product Sale', debit_account: 'Cash', credit_account: 'Sales Revenue', amount: 2500, reference: 'INV-001' },
    { id: 2, date: '2026-01-14', description: 'Rent Payment', debit_account: 'Rent Expense', credit_account: 'Cash', amount: 1500, reference: 'RENT-JAN' },
    { id: 3, date: '2026-01-13', description: 'Service Revenue', debit_account: 'Cash', credit_account: 'Service Revenue', amount: 3200, reference: 'SRV-045' },
    { id: 4, date: '2026-01-12', description: 'Utility Bill', debit_account: 'Utilities Expense', credit_account: 'Cash', amount: 450, reference: 'UTIL-001' },
];

export const dummyCreditHeads = [
    { id: 1, name: 'Sales Revenue', code: '4000', description: 'Revenue from product sales', is_active: true },
    { id: 2, name: 'Service Revenue', code: '4100', description: 'Revenue from services', is_active: true },
    { id: 3, name: 'Interest Income', code: '4200', description: 'Interest earned', is_active: true },
];

export const dummyDebitHeads = [
    { id: 1, name: 'Cost of Goods Sold', code: '5000', description: 'Direct costs of products sold', is_active: true },
    { id: 2, name: 'Salaries Expense', code: '5100', description: 'Employee salaries', is_active: true },
    { id: 3, name: 'Rent Expense', code: '5200', description: 'Office rent', is_active: true },
    { id: 4, name: 'Utilities Expense', code: '5300', description: 'Electricity, water, internet', is_active: true },
];

export const dummyIncomeHeads = [
    { id: 1, name: 'Product Sales', code: '4000', parent_id: null, is_active: true },
    { id: 2, name: 'Service Revenue', code: '4100', parent_id: null, is_active: true },
    { id: 3, name: 'Consulting', code: '4110', parent_id: 2, is_active: true },
];

export const dummyExpenseHeads = [
    { id: 1, name: 'Operating Expenses', code: '5000', parent_id: null, is_active: true },
    { id: 2, name: 'Salaries', code: '5100', parent_id: 1, is_active: true },
    { id: 3, name: 'Rent', code: '5200', parent_id: 1, is_active: true },
];

export const dummyIncomeList = [
    { id: 1, date: '2026-01-15', head: 'Product Sales', amount: 2500, description: 'Sale of electronics', reference: 'INV-001' },
    { id: 2, date: '2026-01-13', head: 'Service Revenue', amount: 3200, description: 'Consulting service', reference: 'SRV-045' },
    { id: 3, date: '2026-01-10', head: 'Product Sales', amount: 1800, description: 'Sale of accessories', reference: 'INV-002' },
];

export const dummyExpenseList = [
    { id: 1, date: '2026-01-14', head: 'Rent', amount: 1500, description: 'January office rent', reference: 'RENT-JAN' },
    { id: 2, date: '2026-01-12', head: 'Utilities', amount: 450, description: 'Electricity bill', reference: 'UTIL-001' },
    { id: 3, date: '2026-01-11', head: 'Salaries', amount: 5000, description: 'Staff salaries', reference: 'SAL-001' },
];

export const dummyJournalEntries = [
    { id: 1, date: '2026-01-15', account: 'Cash', debit: 2500, credit: 0, description: 'Product Sale' },
    { id: 2, date: '2026-01-15', account: 'Sales Revenue', debit: 0, credit: 2500, description: 'Product Sale' },
    { id: 3, date: '2026-01-14', account: 'Rent Expense', debit: 1500, credit: 0, description: 'Rent Payment' },
    { id: 4, date: '2026-01-14', account: 'Cash', debit: 0, credit: 1500, description: 'Rent Payment' },
];

export const dummyTrialBalance = [
    { account: 'Cash', debit: 50000, credit: 0 },
    { account: 'Accounts Receivable', debit: 25000, credit: 0 },
    { account: 'Inventory', debit: 35000, credit: 0 },
    { account: 'Equipment', debit: 45000, credit: 0 },
    { account: 'Accounts Payable', debit: 0, credit: 15000 },
    { account: 'Notes Payable', debit: 0, credit: 20000 },
    { account: 'Capital', debit: 0, credit: 100000 },
    { account: 'Sales Revenue', debit: 0, credit: 85000 },
    { account: 'Service Revenue', debit: 0, credit: 25000 },
    { account: 'Cost of Goods Sold', debit: 45000, credit: 0 },
    { account: 'Salaries Expense', debit: 30000, credit: 0 },
    { account: 'Rent Expense', debit: 18000, credit: 0 },
    { account: 'Utilities Expense', debit: 12000, credit: 0 },
];

export const dummyProfitLoss = {
    income: 115000,
    expenses: 115000,
    netProfit: 0
};

export const dummyLedger = [
    { date: '2026-01-15', description: 'Product Sale', debit: 2500, credit: 0, balance: 52500 },
    { date: '2026-01-14', description: 'Rent Payment', debit: 0, credit: 1500, balance: 51000 },
    { date: '2026-01-13', description: 'Service Revenue', debit: 3200, credit: 0, balance: 49200 },
    { date: '2026-01-12', description: 'Utility Bill', debit: 0, credit: 450, balance: 48750 },
];


export const dummyJournalEntriesDetailed = [
    {
        id: 1,
        date: '2026-01-15',
        narration: 'Product Sale - Electronics',
        reference_type: 'SALE',
        entries: [
            { id: 1, account: { name: 'Cash', code: '1000' }, debit: 2500, credit: 0 },
            { id: 2, account: { name: 'Sales Revenue', code: '4000' }, debit: 0, credit: 2500 },
        ]
    },
    {
        id: 2,
        date: '2026-01-14',
        narration: 'Monthly Office Rent Payment',
        reference_type: 'EXPENSE',
        entries: [
            { id: 3, account: { name: 'Rent Expense', code: '5200' }, debit: 1500, credit: 0 },
            { id: 4, account: { name: 'Cash', code: '1000' }, debit: 0, credit: 1500 },
        ]
    },
    {
        id: 3,
        date: '2026-01-13',
        narration: 'Consulting Service Revenue',
        reference_type: 'INCOME',
        entries: [
            { id: 5, account: { name: 'Cash', code: '1000' }, debit: 3200, credit: 0 },
            { id: 6, account: { name: 'Service Revenue', code: '4100' }, debit: 0, credit: 3200 },
        ]
    },
    {
        id: 4,
        date: '2026-01-12',
        narration: 'Electricity Bill Payment',
        reference_type: 'EXPENSE',
        entries: [
            { id: 7, account: { name: 'Utilities Expense', code: '5300' }, debit: 450, credit: 0 },
            { id: 8, account: { name: 'Cash', code: '1000' }, debit: 0, credit: 450 },
        ]
    },
    {
        id: 5,
        date: '2026-01-10',
        narration: 'Purchase of Office Supplies',
        reference_type: 'EXPENSE',
        entries: [
            { id: 9, account: { name: 'Supplies Expense', code: '5400' }, debit: 850, credit: 0 },
            { id: 10, account: { name: 'Accounts Payable', code: '2000' }, debit: 0, credit: 850 },
        ]
    },
];



export const dummyTrialBalanceDetailed = [
    { code: '1000', account: 'Cash', type: 'Asset', debit: 50000, credit: 0 },
    { code: '1100', account: 'Accounts Receivable', type: 'Asset', debit: 25000, credit: 0 },
    { code: '1200', account: 'Inventory', type: 'Asset', debit: 35000, credit: 0 },
    { code: '1500', account: 'Equipment', type: 'Asset', debit: 45000, credit: 0 },
    { code: '2000', account: 'Accounts Payable', type: 'Liability', debit: 0, credit: 15000 },
    { code: '2100', account: 'Notes Payable', type: 'Liability', debit: 0, credit: 20000 },
    { code: '3000', account: 'Capital', type: 'Equity', debit: 0, credit: 100000 },
    { code: '4000', account: 'Sales Revenue', type: 'Revenue', debit: 0, credit: 85000 },
    { code: '4100', account: 'Service Revenue', type: 'Revenue', debit: 0, credit: 25000 },
    { code: '5000', account: 'Cost of Goods Sold', type: 'Expense', debit: 45000, credit: 0 },
    { code: '5100', account: 'Salaries Expense', type: 'Expense', debit: 30000, credit: 0 },
    { code: '5200', account: 'Rent Expense', type: 'Expense', debit: 18000, credit: 0 },
    { code: '5300', account: 'Utilities Expense', type: 'Expense', debit: 12000, credit: 0 },
];



export const dummyProfitLossDetailed = {
    income: [
        { code: '4000', name: 'Sales Revenue', amount: 85000 },
        { code: '4100', name: 'Service Revenue', amount: 25000 },
        { code: '4200', name: 'Interest Income', amount: 5000 },
    ],
    expense: [
        { code: '5000', name: 'Cost of Goods Sold', amount: 45000 },
        { code: '5100', name: 'Salaries Expense', amount: 30000 },
        { code: '5200', name: 'Rent Expense', amount: 18000 },
        { code: '5300', name: 'Utilities Expense', amount: 12000 },
        { code: '5400', name: 'Marketing Expense', amount: 8000 },
        { code: '5500', name: 'Depreciation Expense', amount: 2000 },
    ],
    total_income: 115000,
    total_expense: 115000,
    net_profit: 0
};
