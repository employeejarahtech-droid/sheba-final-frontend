Below is a complete dummy accounting backend design based on proper accounting theory, ready to be implemented in Laravel / Node / any backend.

I’ll give you:

1️⃣ Database tables (Accounting-correct)
2️⃣ Dummy API input formats (Single Entry → Auto Journal)
3️⃣ Journal Report API
4️⃣ Ledger Report API
5️⃣ Trial Balance API
6️⃣ Accounting logic rules (important)

🟦 1️⃣ DATABASE DESIGN (ACCOUNTING STANDARD)
1. Chart of Accounts (accounts)
CREATE TABLE accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) UNIQUE,
  name VARCHAR(100),
  type ENUM('ASSET','LIABILITY','EQUITY','INCOME','EXPENSE'),
  parent_id INT NULL,
  created_at TIMESTAMP
);

Dummy Accounts Data
INSERT INTO accounts (code,name,type) VALUES
('1000','Cash','ASSET'),
('1100','Bank','ASSET'),
('1200','Accounts Receivable','ASSET'),
('1300','Inventory','ASSET'),

('2000','Accounts Payable','LIABILITY'),
('2100','Payable - Surgeon','LIABILITY'),
('2200','Payable - Doctor','LIABILITY'),
('2300','Payable - Anaesthetist','LIABILITY'),
('2400','Payable - Assistant','LIABILITY'),

('3000','Owner Capital','EQUITY'),

('4000','Sales','INCOME'),
('4100','Other Income','INCOME'),

('5000','Purchase','EXPENSE'),
('5100','Sales Return','EXPENSE'),
('5200','Other Expense','EXPENSE'),
('5300','Surgeon Fee','EXPENSE'),
('5400','Doctor Fee','EXPENSE'),
('5500','Anaesthetist Fee','EXPENSE'),
('5600','Assistant Fee','EXPENSE');

2️⃣ Transactions Table (Single Entry UI)
CREATE TABLE transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(50),
  amount DECIMAL(12,2),
  payment_mode ENUM('CASH','BANK','DUE'),
  reference_id INT NULL,
  description TEXT,
  date DATE
);


⚠️ User only touches this table

3️⃣ Journal Tables (Double Entry Core)
Journal Master
CREATE TABLE journals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  date DATE,
  reference_type VARCHAR(50),
  reference_id INT,
  narration TEXT
);

Journal Details
CREATE TABLE journal_lines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  journal_id INT,
  account_id INT,
  debit DECIMAL(12,2) DEFAULT 0,
  credit DECIMAL(12,2) DEFAULT 0
);

🟦 2️⃣ SINGLE ENTRY → AUTO JOURNAL LOGIC (Comprehensive Rules)

This section maps User Actions (Simple Forms) to Backend Accounting (Double Entry).

1. SALES (REVENUE)
--------------------------------------
User Input (Cash Sale):
POST /api/transactions/sales
{ "amount": 10000, "payment_mode": "CASH", "date": "2026-01-14" }

Auto Journal:
Dr Cash                     10,000
    Cr Sales                     10,000

Scenario B (Credit Sale/Due):
{ "amount": 15000, "payment_mode": "DUE" }

Auto Journal:
Dr Accounts Receivable      15,000
    Cr Sales                     15,000

2. PURCHASE (EXPENSE/ASSET)
--------------------------------------
User Input (Bank Purchase):
POST /api/transactions/purchase
{ "amount": 5000, "payment_mode": "BANK", "supplier": "CleanSupplies" }

Auto Journal:
Dr Purchase                 5,000
    Cr Bank                      5,000

Scenario B (Purchase on Due):
{ "amount": 5000, "payment_mode": "DUE" }

Auto Journal:
Dr Purchase                 5,000
    Cr Accounts Payable          5,000

3. SALES RETURN (INWARD)
--------------------------------------
User Input:
POST /api/transactions/sales-return
{ "amount": 1000, "payment_mode": "CASH" }

Auto Journal:
Dr Sales Return             1,000
    Cr Cash                      1,000

4. PURCHASE RETURN (OUTWARD)
--------------------------------------
User Input:
POST /api/transactions/purchase-return
{ "amount": 500, "payment_mode": "CASH" }

Auto Journal:
Dr Cash                     500
    Cr Purchase Return           500

5. DAILY EXPENSE (OPS)
--------------------------------------
User Input:
POST /api/transactions/expense
{ "amount": 50, "category": "Refreshments", "payment_mode": "CASH" }

Auto Journal:
Dr Office Expense           50
    Cr Cash                      50

6. DAILY INCOME (MISC)
--------------------------------------
User Input:
POST /api/transactions/income
{ "amount": 200, "category": "Scrap Sale", "payment_mode": "CASH" }

Auto Journal:
Dr Cash                     200
    Cr Other Income              200

7. BANK DEPOSIT (CONTRA)
--------------------------------------
User Input:
POST /api/transactions/bank-deposit
{ "amount": 5000, "description": "Cash Deposit to Bank" }

Auto Journal:
Dr Bank                     5,000
    Cr Cash                      5,000

8. PROFESSIONAL FEES (SPECIFIC LIABILITY)
--------------------------------------
User Input (Book Surgeon Fee - Due):
POST /api/transactions/fee-due
{ "amount": 4000, "person": "SURGEON" }

Auto Journal:
Dr Surgeon Fee              4,000
    Cr Payable - Surgeon         4,000

User Input (Pay Liability - Cash):
POST /api/transactions/pay-liability
{ "amount": 4000, "person": "SURGEON", "payment_mode": "CASH" }

Auto Journal:
Dr Payable - Surgeon        4,000
    Cr Cash                      4,000

🟦 3️⃣ JOURNAL REPORT API
GET /api/reports/journal?from=2026-01-01&to=2026-01-31
Output
[
  {
    "date": "2026-01-14",
    "journal_id": 12,
    "narration": "Sales Invoice",
    "entries": [
      { "account": "Cash", "debit": 10000, "credit": 0 },
      { "account": "Sales", "debit": 0, "credit": 10000 }
    ]
  }
]

🟦 4️⃣ LEDGER REPORT API (Account-wise)
GET /api/reports/ledger/{account_id}

Example: Cash Ledger

{
  "account": "Cash",
  "opening_balance": 0,
  "transactions": [
    {
      "date": "2026-01-14",
      "description": "Sales",
      "debit": 10000,
      "credit": 0,
      "balance": 10000
    },
    {
      "date": "2026-01-15",
      "description": "Expense",
      "debit": 0,
      "credit": 300,
      "balance": 9700
    }
  ]
}

🟦 5️⃣ TRIAL BALANCE API (CORE ACCOUNTING CHECK)
GET /api/reports/trial-balance?date=2026-01-31
Logic
SUM(debit) - SUM(credit)

Output
{
  "trial_balance": [
    { "account": "Cash", "debit": 9700, "credit": 0 },
    { "account": "Sales", "debit": 0, "credit": 25000 },
    { "account": "Purchase", "debit": 8000, "credit": 0 },
    { "account": "Other Expense", "debit": 300, "credit": 0 }
  ],
  "total_debit": 18000,
  "total_credit": 18000,
  "status": "BALANCED"
}