

// -------------------- OVERVIEW --------------------
export type Overview = {
  today: {
    income: number;
    expense: number;
    net: number;
  };
  this_week: {
    income: number;
    expense: number;
    net: number;
  };
  this_month: {
    income: number;
    expense: number;
    net: number;
  };
  this_year: {
    income: number;
    expense: number;
    net: number;
  };
};



// -------------------- INCOME / EXPENSE --------------------
export type IncomeExpense = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  status: any;
  id: number;
  title: string;
  credit_head_id?: number;
  debit_head_id?: number;
  amount: number;
  income_date?: string;   // for income
  expense_date?: string;  // for expense
  description?: string;
  payment_method?: string;
  reference_number?: string;
};

export type Income = {
  id: number;
  date: string;
  description: string;
  credit_head_id: number;
  creditHead: {
    id: number;
    name: string;
    code: string;
  };
  amount: number;
  receivedVia: string | null;
  reference: string | null;
  status: string;
  income_date?: string;
  payment_method?: string;
  reference_number?: string;
};

export type Expense = {
  id: number;
  date: string;
  description: string;
  debit_head_id: number;
  debitHead: {
    id: number;
    name: string;
    code: string;
  };
  category: string;
  amount: number;
  paidVia: string;
  reference: string;
  status: string;
  expense_date?: string;
  payment_method?: string;
  reference_number?: string;
};


// -------------------- PAYROLL --------------------
export type Payroll = {
  id: number;
  staff_id: number;
  salary_month: string; // e.g., "2025-01"
  net_salary: number;
  status: string;
};

// -------------------- Credit Head --------------------
export type CreditHead = {
  id: number;
  name: string;
  code: string;
  type: string;
  parent_id: number | null;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

// -------------------- Debit Head --------------------
export type DebitHead = {
  id: number;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
};

// -------------------- TRANSACTIONS --------------------
export type Transaction = {
  id: number;
  date: string;
  type: string;
  amount: number;
  mode: string;
  description: string;
};

export type CreateTransactionInput = {
  type: string;
  amount: number;
  payment_mode: string;
  date: string;
  description: string;
};

// -------------------- RECENT ACTIVITY --------------------
export type RecentActivity = {
  title: string;
  date: string;
  amount: string;
};

// -------------------- EXPENSE BREAKDOWN --------------------
export type ExpenseBreakdown = {
  name: string;
  value: number;
};

