import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

let db: Database.Database | null = null;

function logDebug(message: string) {
    const logPath = path.join('d:\\pos-frontend', 'debug_db.log');
    try {
        fs.appendFileSync(logPath, `${new Date().toISOString()} - ${message}\n`);
    } catch (e) {
        console.error('Failed to write to debug log', e);
    }
}

export function initDatabase() {
    const dbPath = path.join(app.getPath('userData'), 'app.db');
    console.log('Database path:', dbPath);

    db = new Database(dbPath, { verbose: console.log });

    // Create users table if not exists with fields matching app requirements
    const createTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role_id INTEGER NOT NULL DEFAULT 1
    );
  `;

    db.exec(createTable);

    // Create categories table if not exists
    const createCategoriesTable = `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;

    db.exec(createCategoriesTable);

    // Create units table if not exists
    const createUnitsTable = `
    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;

    db.exec(createUnitsTable);

    // Create products table if not exists
    const createProductsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      category_id INTEGER,
      unit_id INTEGER,
      price REAL NOT NULL,
      cost REAL NOT NULL,
      initial_stock INTEGER DEFAULT 0,
      min_stock_level INTEGER DEFAULT 0,
      max_stock_level INTEGER DEFAULT 0,
      stock_quantity INTEGER DEFAULT 0,
      purchase_tax REAL DEFAULT 0,
      sales_tax REAL DEFAULT 0,
      weight REAL DEFAULT 0,
      width REAL DEFAULT 0,
      height REAL DEFAULT 0,
      length REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      thumb_url TEXT,
      gallery_items TEXT,
      attributes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (unit_id) REFERENCES units(id)
    );
  `;

    db.exec(createProductsTable);

    // Create accounts table
    const createAccountsTable = `
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE')),
      parent_id INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES accounts(id)
    );
  `;
    db.exec(createAccountsTable);

    // Create transactions table
    const createTransactionsTable = `
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_mode TEXT NOT NULL CHECK(payment_mode IN ('CASH', 'BANK', 'DUE')),
      reference_id INTEGER,
      description TEXT,
      date TEXT NOT NULL,
      category TEXT,
      person TEXT,
      supplier TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;
    db.exec(createTransactionsTable);

    // Create journals table
    const createJournalsTable = `
    CREATE TABLE IF NOT EXISTS journals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      reference_type TEXT,
      reference_id INTEGER,
      narration TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;
    db.exec(createJournalsTable);

    // Create journal_lines table
    const createJournalLinesTable = `
    CREATE TABLE IF NOT EXISTS journal_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      journal_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      debit REAL DEFAULT 0,
      credit REAL DEFAULT 0,
      FOREIGN KEY (journal_id) REFERENCES journals(id),
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    );
  `;
    db.exec(createJournalLinesTable);

    // Create suppliers table
    const createSuppliersTable = `
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      contact_person TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      postal_code TEXT,
      latitude REAL,
      longitude REAL,
      tax_id TEXT,
      website TEXT,
      payment_terms TEXT,
      notes TEXT,
      thumb_url TEXT,
      gallery_items TEXT,
      is_active INTEGER DEFAULT 1,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;
    db.exec(createSuppliersTable);

    // Create customers table
    const createCustomersTable = `
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      contact_person TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      postal_code TEXT,
      latitude REAL,
      longitude REAL,
      tax_id TEXT,
      website TEXT,
      payment_terms TEXT,
      notes TEXT,
      thumb_url TEXT,
      gallery_items TEXT,
      is_active INTEGER DEFAULT 1,
      customer_type TEXT DEFAULT 'individual',
      credit_limit REAL DEFAULT 0,
      outstanding_balance REAL DEFAULT 0,
      company TEXT,
      sales_route_id INTEGER,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;
    db.exec(createCustomersTable);

    // Migration for existing tables
    try {
        db.exec("ALTER TABLE customers ADD COLUMN customer_type TEXT DEFAULT 'individual'");
    } catch (e) { /* Column likely exists */ }
    try {
        db.exec("ALTER TABLE customers ADD COLUMN credit_limit REAL DEFAULT 0");
    } catch (e) { /* Column likely exists */ }
    try {
        db.exec("ALTER TABLE customers ADD COLUMN outstanding_balance REAL DEFAULT 0");
    } catch (e) { /* Column likely exists */ }
    try {
        db.exec("ALTER TABLE customers ADD COLUMN company TEXT");
    } catch (e) { /* Column likely exists */ }
    try {
        db.exec("ALTER TABLE customers ADD COLUMN sales_route_id INTEGER");
    } catch (e) { /* Column likely exists */ }

    // Create purchase_orders table
    const createPurchaseOrdersTable = `
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_number TEXT NOT NULL UNIQUE,
      supplier_id INTEGER NOT NULL,
      order_date TEXT DEFAULT CURRENT_TIMESTAMP,
      expected_delivery_date TEXT,
      status TEXT DEFAULT 'pending',
      total_amount REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      total_paid_amount REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'unpaid',
      notes TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );
  `;
    db.exec(createPurchaseOrdersTable);

    // Create purchase_order_items table
    const createPurchaseOrderItemsTable = `
    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_cost REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      line_total REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `;
    db.exec(createPurchaseOrderItemsTable);

    // Create purchase_payments table
    const createPurchasePaymentsTable = `
    CREATE TABLE IF NOT EXISTS purchase_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_order_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT DEFAULT CURRENT_TIMESTAMP,
      payment_method TEXT NOT NULL,
      reference_number TEXT,
      notes TEXT,
      status TEXT DEFAULT 'completed',
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id)
    );
  `;
    db.exec(createPurchasePaymentsTable);

    // Create purchase_invoices table
    const createPurchaseInvoicesTable = `
    CREATE TABLE IF NOT EXISTS purchase_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL UNIQUE,
      purchase_order_id INTEGER NOT NULL,
      total_payable_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      due_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      invoice_date TEXT DEFAULT CURRENT_TIMESTAMP,
      due_date TEXT,
      notes TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id)
    );
  `;
    db.exec(createPurchaseInvoicesTable);

    // Create purchase_invoice_items table (optional, but good for detailed invoices distinct from PO)
    // For now, simpler implementation linking to PO might suffice, but table is safer for partial invoices.
    // Let's stick to simple header-level invoice for now based on DUMMY_DATA which just links PO.
    // Actually DUMMY_DATA shows invoice items? "purchase_order.items" were mocked.
    // Let's keep it simple: Invoice links to PO.


    // Seed initial accounting data
    seedAccountingAccounts();

    // Seed admin user if empty
    const stmt = db.prepare('SELECT count(*) as count FROM users');
    const result = stmt.get() as { count: number };

    if (result.count === 0) {
        console.log('Seeding default admin user...');
        const insert = db.prepare('INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)');
        // Default admin: admin@example.com / admin123
        insert.run('Admin User', 'admin@example.com', 'admin123', 1);
    }
}

// ---------------------------------------------------------
// PURCHASE MODULE
// ---------------------------------------------------------

// Purchase Order Interfaces
export interface PurchaseOrder {
    id: number;
    po_number: string;
    supplier_id: number;
    order_date: string;
    expected_delivery_date?: string;
    status: string;
    total_amount: number;
    tax_amount: number;
    discount_amount: number;
    total_paid_amount: number;
    payment_status: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
    // Relations
    supplier?: any;
    items?: PurchaseOrderItem[];
    payments?: PurchasePayment[];
}

export interface PurchaseOrderItem {
    id: number;
    purchase_order_id: number;
    product_id: number;
    quantity: number;
    unit_cost: number;
    discount: number;
    tax_amount: number;
    line_total: number;
    // Relations
    product?: any;
}

export interface PurchasePayment {
    id: number;
    purchase_order_id: number;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference_number?: string;
    notes?: string;
    status: string;
    // Relations
    purchase_order?: PurchaseOrder;
}

// Purchase Order Logics
export function getAllPurchaseOrders({ page = 1, limit = 10, search = '' }: { page?: number; limit?: number; search?: string } = {}) {
    if (!db) throw new Error('Database not initialized');
    logDebug(`getAllPurchaseOrders called with: ${JSON.stringify({ page, limit, search })}`);

    let query = `
        SELECT
            po.*,
            s.name as supplier_name,
            s.code as supplier_code
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
    `;
    const params: any[] = [];

    if (search) {
        query += ' WHERE po.po_number LIKE ? OR s.name LIKE ?';
        params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY po.id DESC';

    // Count
    const countQuery = `
        SELECT COUNT(*) as total
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        ${search ? 'WHERE po.po_number LIKE ? OR s.name LIKE ?' : ''}
    `;
    const countStmt = db.prepare(countQuery);
    const countResult = countStmt.get(...params) as { total: number };
    logDebug(`getAllPurchaseOrders count: ${JSON.stringify(countResult)}`);

    // Limit
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];
    logDebug(`getAllPurchaseOrders rows: ${rows.length}`);

    // Hydrate relations if needed (simple version)
    const data = rows.map(row => ({
        ...row,
        total_payable_amount: (row.total_amount || 0) + (row.tax_amount || 0) - (row.discount_amount || 0),
        supplier: { id: row.supplier_id, name: row.supplier_name, code: row.supplier_code }
    }));

    return {
        data,
        pagination: {
            total: countResult.total,
            page,
            limit,
            totalPage: Math.ceil(countResult.total / limit),
        },
    };
}

export function getPurchaseOrderById(id: number) {
    if (!db) throw new Error('Database not initialized');

    // Get PO
    const poStmt = db.prepare(`
        SELECT po.*, s.name as supplier_name, s.code as supplier_code, s.email as supplier_email, s.phone as supplier_phone, s.address as supplier_address
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        WHERE po.id = ?
    `);
    const po = poStmt.get(id) as any;

    if (!po) return null;

    // Get Items
    const itemsStmt = db.prepare(`
        SELECT poi.*, p.name as product_name, p.sku as product_sku, u.name as unit_name, p.purchase_tax
        FROM purchase_order_items poi
        LEFT JOIN products p ON poi.product_id = p.id
        LEFT JOIN units u ON p.unit_id = u.id
        WHERE poi.purchase_order_id = ?
    `);
    const items = itemsStmt.all(id) as any[];

    // Get Payments
    const paymentsStmt = db.prepare(`SELECT * FROM purchase_payments WHERE purchase_order_id = ? ORDER BY id DESC`);
    const payments = paymentsStmt.all(id) as any[];

    return {
        ...po,
        total_payable_amount: (po.total_amount || 0) + (po.tax_amount || 0) - (po.discount_amount || 0),
        supplier: {
            id: po.supplier_id,
            name: po.supplier_name,
            code: po.supplier_code,
            email: po.supplier_email,
            phone: po.supplier_phone,
            address: po.supplier_address
        },
        items: items.map(item => ({
            ...item,
            product: { id: item.product_id, name: item.product_name, sku: item.product_sku, unit_name: item.unit_name }
        })),
        payments
    };
}

export function createPurchaseOrder(data: any) {
    if (!db) throw new Error('Database not initialized');
    logDebug(`createPurchaseOrder received: ${JSON.stringify(data)}`);

    return db.transaction(() => {
        // Auto-generate PO Number if missing
        if (!data.po_number) {
            let nextNum = 1;
            try {
                const result = db!.prepare("SELECT seq FROM sqlite_sequence WHERE name = 'purchase_orders'").get() as { seq: number } | undefined;
                if (result) {
                    nextNum = result.seq + 1;
                }
            } catch (e) {
                // If sqlite_sequence query fails (e.g. table empty or fresh DB), fallback to MAX(id)
                const max = db!.prepare('SELECT MAX(id) as m FROM purchase_orders').get() as { m: number };
                nextNum = (max.m || 0) + 1;
            }
            data.po_number = `PO-${new Date().getFullYear()}-${nextNum.toString().padStart(4, '0')}`;
            logDebug(`Auto-generated PO Number: ${data.po_number}`);
        }

        // Calculate totals if items present but total_amount missing
        if ((!data.total_amount || data.total_amount === 0) && data.items && Array.isArray(data.items)) {
            let total = 0;
            let totalTax = 0;
            let totalDiscount = 0;

            data.items.forEach((item: any) => {
                // Handle item fields allowing for snake_case or whatever the user sends if inconsistent, 
                // but safely assuming consistency with payload: product_id, quantity, unit_cost, discount, purchase_tax
                // User payload had 'purchase_tax'. My schema uses 'tax_amount'. Map it.
                if (item.purchase_tax && !item.tax_amount) item.tax_amount = item.purchase_tax;

                const qty = Number(item.quantity) || 0;
                const cost = Number(item.unit_cost) || 0;
                const disc = Number(item.discount) || 0;
                const tax = Number(item.tax_amount) || 0;

                const lineTotal = (qty * cost) - disc + tax;
                if (!item.line_total) item.line_total = lineTotal;

                total += (qty * cost); // Gross amount usually? Or Total is sum of line totals?
                // Standard: Total Amount = Sum of (Qty * Cost)
                // Tax Amount = Sum of Tax
                // Discount Amount = Sum of Discount
                // Payable = Total + Tax - Discount
                totalTax += tax;
                totalDiscount += disc;
            });
            // Update data object
            if (!data.total_amount) data.total_amount = total;
            if (!data.tax_amount) data.tax_amount = totalTax;
            if (!data.discount_amount) data.discount_amount = totalDiscount;
        }

        const stmt = db!.prepare(`
            INSERT INTO purchase_orders (
                po_number, supplier_id, order_date, expected_delivery_date, status,
                total_amount, tax_amount, discount_amount, total_paid_amount, payment_status, notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            data.po_number,
            data.supplier_id,
            data.order_date,
            data.expected_delivery_date || null,
            data.status || 'pending',
            data.total_amount || 0,
            data.tax_amount || 0,
            data.discount_amount || 0,
            0, // total_paid_amount
            'unpaid', // payment_status
            data.notes || null,
            data.created_by || null
        );

        const poId = result.lastInsertRowid;
        logDebug(`Inserted PO ID: ${poId}`);

        if (data.items && Array.isArray(data.items)) {
            const itemStmt = db!.prepare(`
                INSERT INTO purchase_order_items (
                    purchase_order_id, product_id, quantity, unit_cost, discount, tax_amount, line_total
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            for (const item of data.items) {
                // Ensure line_total matches what we calculated or passed
                const qty = Number(item.quantity) || 0;
                const cost = Number(item.unit_cost) || 0;
                const disc = Number(item.discount) || 0;
                const tax = Number(item.tax_amount) || 0;
                const lineTotal = item.line_total || ((qty * cost) - disc + tax);

                itemStmt.run(
                    poId,
                    item.product_id,
                    qty,
                    cost,
                    disc,
                    tax,
                    lineTotal
                );
            }
        }

        return getPurchaseOrderById(poId as number);
    })();
}

export function updatePurchaseOrder(id: number, data: any) {
    if (!db) throw new Error('Database not initialized');

    return db.transaction(() => {
        const updates: string[] = [];
        const params: any[] = [];

        const fields = [
            'supplier_id', 'order_date', 'expected_delivery_date', 'status',
            'total_amount', 'tax_amount', 'discount_amount', 'payment_status', 'notes'
        ];

        fields.forEach(field => {
            if (data[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(data[field]);
            }
        });

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const stmt = db!.prepare(`UPDATE purchase_orders SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...params);

        if (data.items && Array.isArray(data.items)) {
            db!.prepare('DELETE FROM purchase_order_items WHERE purchase_order_id = ?').run(id);

            const itemStmt = db!.prepare(`
                INSERT INTO purchase_order_items (
                    purchase_order_id, product_id, quantity, unit_cost, discount, tax_amount, line_total
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            for (const item of data.items) {
                itemStmt.run(
                    id,
                    item.product_id,
                    item.quantity,
                    item.unit_cost,
                    item.discount || 0,
                    item.tax_amount || 0,
                    item.line_total
                );
            }
        }

        return getPurchaseOrderById(id);
    })();
}

export function deletePurchaseOrder(id: number) {
    if (!db) throw new Error('Database not initialized');

    return db.transaction(() => {
        // Delete items
        db!.prepare('DELETE FROM purchase_order_items WHERE purchase_order_id = ?').run(id);
        // Delete payments
        db!.prepare('DELETE FROM purchase_payments WHERE purchase_order_id = ?').run(id);
        // Delete PO
        const result = db!.prepare('DELETE FROM purchase_orders WHERE id = ?').run(id);

        return { success: result.changes > 0 };
    })();
}

// Purchase Payment Logics
export function getAllPurchasePayments({ page = 1, limit = 10, search = '' }: { page?: number; limit?: number; search?: string } = {}) {
    if (!db) throw new Error('Database not initialized');

    let query = `
        SELECT 
            pp.*,
            po.po_number,
            s.name as supplier_name
        FROM purchase_payments pp
        LEFT JOIN purchase_orders po ON pp.purchase_order_id = po.id
        LEFT JOIN suppliers s ON po.supplier_id = s.id
    `;
    const params: any[] = [];

    if (search) {
        query += ' WHERE po.po_number LIKE ? OR s.name LIKE ? OR pp.reference_number LIKE ?';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY pp.id DESC';

    const countQuery = `
        SELECT COUNT(*) as total 
        FROM purchase_payments pp
        LEFT JOIN purchase_orders po ON pp.purchase_order_id = po.id
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        ${search ? 'WHERE po.po_number LIKE ? OR s.name LIKE ? OR pp.reference_number LIKE ?' : ''}
    `;
    const countStmt = db.prepare(countQuery);
    const countResult = countStmt.get(...params) as { total: number };

    // Limit
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];

    const data = rows.map(row => ({
        ...row,
        purchase_order: { id: row.purchase_order_id, po_number: row.po_number, supplier: { name: row.supplier_name } }
    }));

    return {
        data,
        pagination: {
            total: countResult.total,
            page,
            limit,
            totalPage: Math.ceil(countResult.total / limit),
        },
    };
}

export function createPurchasePayment(data: any) {
    if (!db) throw new Error('Database not initialized');

    const createTransaction = db.transaction((pymtData) => {
        // 1. Insert Payment
        const insertPymt = db!.prepare(`
            INSERT INTO purchase_payments (
                purchase_order_id, amount, payment_method, reference_number, notes, status
            ) VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = insertPymt.run(
            pymtData.purchase_order_id, pymtData.amount, pymtData.payment_method,
            pymtData.reference_number, pymtData.notes, 'completed'
        );
        const paymentId = result.lastInsertRowid;

        // 2. Update Purchase Order Paid Amount
        const po = db!.prepare('SELECT total_paid_amount, total_amount, tax_amount, discount_amount FROM purchase_orders WHERE id = ?').get(pymtData.purchase_order_id) as any;
        if (po) {
            const newPaidAmount = (po.total_paid_amount || 0) + pymtData.amount;
            const fullTotal = (po.total_amount || 0) + (po.tax_amount || 0) - (po.discount_amount || 0);

            let newStatus = 'partially_paid';
            if (newPaidAmount >= fullTotal) newStatus = 'paid';
            if (newPaidAmount === 0) newStatus = 'unpaid';

            db!.prepare('UPDATE purchase_orders SET total_paid_amount = ?, payment_status = ? WHERE id = ?').run(newPaidAmount, newStatus, pymtData.purchase_order_id);
        }

        return { id: paymentId, ...pymtData };
    });

    return createTransaction(data);
}

export function getPurchasePaymentById(id: number) {
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(`
        SELECT 
            pp.*,
            po.po_number as po_number,
            po.total_amount as po_total_amount,
            po.tax_amount as po_tax_amount,
            po.discount_amount as po_discount_amount,
            s.name as supplier_name,
            s.email as supplier_email,
            s.phone as supplier_phone,
            s.contact_person as supplier_contact
        FROM purchase_payments pp
        LEFT JOIN purchase_orders po ON pp.purchase_order_id = po.id
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        WHERE pp.id = ?
    `);

    const row = stmt.get(id) as any;

    if (!row) return null;

    return {
        ...row,
        purchase_order: {
            id: row.purchase_order_id,
            po_number: row.po_number,
            total_amount: row.po_total_amount,
            total_payable_amount: (row.po_total_amount || 0) + (row.po_tax_amount || 0) - (row.po_discount_amount || 0),
            supplier: {
                name: row.supplier_name,
                email: row.supplier_email,
                phone: row.supplier_phone,
                contact_person: row.supplier_contact
            }
        }
    };
}

export function verifyUser(email: string, password: string): { id: number; name: string; email: string; role_id: number } | null {
    if (!db) {
        console.error('Database not initialized during verifyUser call');
        throw new Error('Database not initialized');
    }

    console.log(`Checking credentials for: ${email} `);
    try {
        const stmt = db.prepare('SELECT id, name, email, role_id FROM users WHERE email = ? AND password = ?');
        const user = stmt.get(email, password) as { id: number; name: string; email: string; role_id: number } | undefined;

        if (user) {
            console.log('User found:', user.email);
            return user;
        } else {
            console.log('User not found or password incorrect');
            return null;
        }
    } catch (err) {
        console.error('Database query error:', err);
        throw err;
    }
}

// Category CRUD operations
export interface Category {
    id: number;
    name: string;
    description?: string;
    is_active: number;
    created_at?: string;
    updated_at?: string;
}

export function getAllCategories({ page = 1, limit = 1000, search = '' }: { page?: number; limit?: number; search?: string } = {}) {
    if (!db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM categories';
    const params: any[] = [];

    if (search) {
        query += ' WHERE name LIKE ? OR description LIKE ?';
        params.push(`% ${search}% `, ` % ${search}% `);
    }

    query += ' ORDER BY id DESC';

    const countQuery = search
        ? 'SELECT COUNT(*) as total FROM categories WHERE name LIKE ? OR description LIKE ?'
        : 'SELECT COUNT(*) as total FROM categories';

    const countStmt = db.prepare(countQuery);
    const countResult = countStmt.get(...(search ? [`% ${search}% `, ` % ${search}% `] : [])) as { total: number };

    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ? `;
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const categories = stmt.all(...params) as Category[];

    return {
        data: categories.map(cat => ({ ...cat, is_active: Boolean(cat.is_active) })),
        pagination: {
            total: countResult.total,
            page,
            limit,
            totalPage: Math.ceil(countResult.total / limit),
        },
    };
}

export function getCategoryById(id: number) {
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    const category = stmt.get(id) as Category | undefined;

    if (!category) return null;

    return { ...category, is_active: Boolean(category.is_active) };
}

export function createCategory(data: { name: string; description?: string; is_active?: boolean }) {
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(
        'INSERT INTO categories (name, description, is_active) VALUES (?, ?, ?)'
    );

    const result = stmt.run(
        data.name,
        data.description || null,
        data.is_active ? 1 : 0
    );

    return { id: result.lastInsertRowid, ...data };
}

export function updateCategory(id: number, data: { name?: string; description?: string; is_active?: boolean }) {
    if (!db) throw new Error('Database not initialized');

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
        updates.push('name = ?');
        params.push(data.name);
    }
    if (data.description !== undefined) {
        updates.push('description = ?');
        params.push(data.description);
    }
    if (data.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(data.is_active ? 1 : 0);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ? `);
    stmt.run(...params);

    return getCategoryById(id);
}

export function deleteCategory(id: number) {
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
    const result = stmt.run(id);

    return { success: result.changes > 0 };
}

// Unit CRUD operations
export interface Unit {
    id: number;
    name: string;
    is_active: number;
    created_at?: string;
    updated_at?: string;
}

export function getAllUnits({ page = 1, limit = 1000, search = '' }: { page?: number; limit?: number; search?: string } = {}) {
    if (!db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM units';
    const params: any[] = [];

    if (search) {
        query += ' WHERE name LIKE ?';
        params.push(`% ${search}% `);
    }

    query += ' ORDER BY id DESC';

    const countQuery = search
        ? 'SELECT COUNT(*) as total FROM units WHERE name LIKE ?'
        : 'SELECT COUNT(*) as total FROM units';

    const countStmt = db.prepare(countQuery);
    const countResult = countStmt.get(...(search ? [`% ${search}% `] : [])) as { total: number };

    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ? `;
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const units = stmt.all(...params) as Unit[];

    return {
        data: units.map(unit => ({ ...unit, is_active: Boolean(unit.is_active) })),
        pagination: {
            total: countResult.total,
            page,
            limit,
            totalPage: Math.ceil(countResult.total / limit),
        },
    };
}

export function getUnitById(id: number) {
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare('SELECT * FROM units WHERE id = ?');
    const unit = stmt.get(id) as Unit | undefined;

    if (!unit) return null;

    return { ...unit, is_active: Boolean(unit.is_active) };
}

export function createUnit(data: { name: string; is_active?: boolean }) {
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(
        'INSERT INTO units (name, is_active) VALUES (?, ?)'
    );

    const result = stmt.run(
        data.name,
        data.is_active ? 1 : 0
    );

    return { id: result.lastInsertRowid, ...data };
}

export function updateUnit(id: number, data: { name?: string; is_active?: boolean }) {
    if (!db) throw new Error('Database not initialized');

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
        updates.push('name = ?');
        params.push(data.name);
    }
    if (data.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(data.is_active ? 1 : 0);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = db.prepare(`UPDATE units SET ${updates.join(', ')} WHERE id = ? `);
    stmt.run(...params);

    return getUnitById(id);
}

export function deleteUnit(id: number) {
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare('DELETE FROM units WHERE id = ?');
    const result = stmt.run(id);

    return { success: result.changes > 0 };
}

// Product CRUD operations
export interface Product {
    id: number;
    sku: string;
    name: string;
    description?: string;
    category_id: number;
    unit_id: number;
    price: number;
    cost: number;
    initial_stock: number;
    min_stock_level: number;
    max_stock_level: number;
    stock_quantity: number;
    purchase_tax: number;
    sales_tax: number;
    weight: number;
    width: number;
    height: number;
    length: number;
    is_active: number;
    thumb_url?: string;
    gallery_items?: string;
    attributes?: string;
    created_at?: string;
    updated_at?: string;
}

export function getAllProducts({ page = 1, limit = 10, search = '' }: { page?: number; limit?: number; search?: string } = {}) {
    if (!db) throw new Error('Database not initialized');

    let query = `
        SELECT
    p.*,
        c.name as category_name,
        u.name as unit_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN units u ON p.unit_id = u.id
        `;
    const params: any[] = [];

    if (search) {
        query += ' WHERE p.name LIKE ? OR p.sku LIKE ?';
        params.push(`% ${search}% `, ` % ${search}% `);
    }

    query += ' ORDER BY p.id DESC';

    const countQuery = search
        ? 'SELECT COUNT(*) as total FROM products WHERE name LIKE ? OR sku LIKE ?'
        : 'SELECT COUNT(*) as total FROM products';

    const countStmt = db.prepare(countQuery);
    const countResult = countStmt.get(...(search ? [`% ${search}% `, ` % ${search}% `] : [])) as { total: number };

    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ? `;
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const products = stmt.all(...params) as any[];

    return {
        data: products.map(p => ({
            ...p,
            is_active: Boolean(p.is_active),
            gallery_items: p.gallery_items ? JSON.parse(p.gallery_items) : [],
            attributes: p.attributes ? JSON.parse(p.attributes) : [],
            category: p.category_name ? { id: p.category_id, name: p.category_name } : null,
            unit: p.unit_name ? { id: p.unit_id, name: p.unit_name } : null,
        })),
        pagination: {
            total: countResult.total,
            per_page: limit,
            current_page: page,
            last_page: Math.ceil(countResult.total / limit),
        },
    };
}

export function getProductById(id: number) {
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(`
        SELECT
    p.*,
        c.name as category_name,
        u.name as unit_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN units u ON p.unit_id = u.id
        WHERE p.id = ?
        `);
    const product = stmt.get(id) as any;

    if (!product) return null;

    return {
        ...product,
        is_active: Boolean(product.is_active),
        gallery_items: product.gallery_items ? JSON.parse(product.gallery_items) : [],
        attributes: product.attributes ? JSON.parse(product.attributes) : [],
        category: product.category_name ? { id: product.category_id, name: product.category_name } : null,
        unit: product.unit_name ? { id: product.unit_id, name: product.unit_name } : null,
    };
}

export function createProduct(data: any) {
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(`
        INSERT INTO products(
            sku, name, description, category_id, unit_id, price, cost,
            initial_stock, min_stock_level, max_stock_level, stock_quantity,
            purchase_tax, sales_tax, weight, width, height, length,
            is_active, thumb_url, gallery_items, attributes
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        data.sku,
        data.name,
        data.description || null,
        data.category_id || null,
        data.unit_id || null,
        data.price,
        data.cost,
        data.initial_stock || 0,
        data.min_stock_level || 0,
        data.max_stock_level || 0,
        data.stock_quantity || 0,
        data.purchase_tax || 0,
        data.sales_tax || 0,
        data.weight || 0,
        data.width || 0,
        data.height || 0,
        data.length || 0,
        data.is_active ? 1 : 0,
        data.thumb_url || null,
        data.gallery_items ? JSON.stringify(data.gallery_items) : null,
        data.attributes ? JSON.stringify(data.attributes) : null
    );

    return { id: result.lastInsertRowid, ...data };
}

export function updateProduct(id: number, data: any) {
    if (!db) throw new Error('Database not initialized');

    const updates: string[] = [];
    const params: any[] = [];

    const fields = [
        'sku', 'name', 'description', 'category_id', 'unit_id', 'price', 'cost',
        'initial_stock', 'min_stock_level', 'max_stock_level', 'stock_quantity',
        'purchase_tax', 'sales_tax', 'weight', 'width', 'height', 'length',
        'thumb_url'
    ];

    fields.forEach(field => {
        if (data[field] !== undefined) {
            updates.push(`${field} = ?`);
            params.push(data[field]);
        }
    });

    if (data.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(data.is_active ? 1 : 0);
    }

    if (data.gallery_items !== undefined) {
        updates.push('gallery_items = ?');
        params.push(JSON.stringify(data.gallery_items));
    }

    if (data.attributes !== undefined) {
        updates.push('attributes = ?');
        params.push(JSON.stringify(data.attributes));
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ? `);
    stmt.run(...params);

    return getProductById(id);
}

export function deleteProduct(id: number) {
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    const result = stmt.run(id);

    return { success: result.changes > 0 };
}

export function getProductStats() {
    if (!db) throw new Error('Database not initialized');

    const totalStmt = db.prepare('SELECT COUNT(*) as total FROM products');
    const totalResult = totalStmt.get() as { total: number };

    const lowStockStmt = db.prepare('SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock_level');
    const lowStockResult = lowStockStmt.get() as { count: number };

    const stockValueStmt = db.prepare('SELECT SUM(stock_quantity) as total FROM products');
    const stockValueResult = stockValueStmt.get() as { total: number };

    return {
        totalProducts: totalResult.total,
        lowStockCount: lowStockResult.count,
        totalStockCount: stockValueResult.total || 0,
    };
}

// Accounting CRUD operations
export interface Account {
    id: number;
    code: string;
    name: string;
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
    parent_id: number | null;
    is_active: number;
    level?: number;
}

export function getAllAccounts({ page = 1, limit = 1000, search = '' }: { page?: number; limit?: number; search?: string } = {}) {
    if (!db) throw new Error('Database not initialized');

    // Build hierarchical flat list in memory for simplicity
    const allAccountsStmt = db.prepare('SELECT * FROM accounts ORDER BY code ASC');
    const allAccounts = allAccountsStmt.all() as Account[];

    const accountMap = new Map<number, any>();
    allAccounts.forEach(acc => {
        accountMap.set(acc.id, { ...acc, children: [] });
    });

    const rootAccounts: any[] = [];
    accountMap.forEach(acc => {
        if (acc.parent_id && accountMap.has(acc.parent_id)) {
            accountMap.get(acc.parent_id).children.push(acc);
        } else {
            rootAccounts.push(acc);
        }
    });

    const flatList: any[] = [];
    const processNode = (nodes: any[], level: number) => {
        nodes.forEach(node => {
            node.level = level;
            const { children, ...rest } = node;
            flatList.push(rest);
            if (children.length > 0) {
                processNode(children, level + 1);
            }
        });
    };
    processNode(rootAccounts, 0);

    let filteredList = flatList;
    if (search) {
        const searchLower = search.toLowerCase();
        filteredList = flatList.filter(acc =>
            acc.name.toLowerCase().includes(searchLower) ||
            acc.code.toLowerCase().includes(searchLower)
        );
    }

    const total = filteredList.length;
    const offset = (page - 1) * limit;
    const paginatedRows = filteredList.slice(offset, offset + limit);

    return {
        data: paginatedRows,
        pagination: {
            total,
            page,
            limit,
            totalPage: Math.ceil(total / limit),
        },
    };
}

export function getIncomeHeads() {
    if (!db) throw new Error('Database not initialized');
    return db.prepare("SELECT * FROM accounts WHERE type IN ('INCOME', 'REVENUE') ORDER BY name ASC").all();
}

export function getExpenseHeads() {
    if (!db) throw new Error('Database not initialized');
    return db.prepare("SELECT * FROM accounts WHERE type IN ('EXPENSE', 'COST_OF_GOODS_SOLD') ORDER BY name ASC").all();
}

export function getAccountById(id: number) {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare('SELECT * FROM accounts WHERE id = ?');
    const account = stmt.get(id) as Account | undefined;
    if (!account) return null;

    // Calculate level
    let level = 0;
    let parentId = account.parent_id;
    while (parentId) {
        level++;
        const parent = db.prepare('SELECT parent_id FROM accounts WHERE id = ?').get(parentId) as any;
        if (!parent) break;
        parentId = parent.parent_id;
    }

    return { ...account, level };
}

export function createAccount(data: { code: string; name: string; type: string; parent_id?: number | null }) {
    if (!db) throw new Error('Database not initialized');

    // Check if code already exists
    const existing = db.prepare('SELECT id FROM accounts WHERE code = ?').get(data.code);
    if (existing) {
        throw new Error(`Account code '${data.code}' already exists.`);
    }

    let finalParentId = data.parent_id;

    // Automated parent assignment logic from backup
    if (!finalParentId) {
        if (data.type.toUpperCase() === 'INCOME' && data.code !== 'ROOT_INCOME') {
            const root = db.prepare('SELECT id FROM accounts WHERE name = ? OR code = ?').get('Income', 'ROOT_INCOME') as any;
            if (root) finalParentId = root.id;
        } else if (data.type.toUpperCase() === 'EXPENSE' && data.code !== 'ROOT_EXPENSE') {
            const root = db.prepare('SELECT id FROM accounts WHERE name = ? OR code = ?').get('Expenses', 'ROOT_EXPENSE') as any;
            if (root) finalParentId = root.id;
        }
    }

    const stmt = db.prepare(
        'INSERT INTO accounts (code, name, type, parent_id) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(data.code, data.name, data.type, finalParentId || null);
    return getAccountById(result.lastInsertRowid as number);
}

export function updateAccount(id: number, data: { name?: string; code?: string; parent_id?: number | null; type?: string }) {
    if (!db) throw new Error('Database not initialized');
    const updates: string[] = [];
    const params: any[] = [];

    if (data.code !== undefined) {
        // Check if new code already exists in another account
        const existing = db.prepare('SELECT id FROM accounts WHERE code = ? AND id != ?').get(data.code, id);
        if (existing) {
            throw new Error(`Account code '${data.code}' already exists.`);
        }
        updates.push('code = ?');
        params.push(data.code);
    }
    if (data.name !== undefined) {
        updates.push('name = ?');
        params.push(data.name);
    }
    if (data.parent_id !== undefined) {
        updates.push('parent_id = ?');
        params.push(data.parent_id);
    }
    if (data.type !== undefined) {
        updates.push('type = ?');
        params.push(data.type);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = db.prepare(`UPDATE accounts SET ${updates.join(', ')} WHERE id = ? `);
    stmt.run(...params);
    return getAccountById(id);
}

export function deleteAccount(id: number) {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare('DELETE FROM accounts WHERE id = ?');
    const result = stmt.run(id);
    return { success: result.changes > 0 };
}

// Transaction & Journal Operations
export function createJournalEntry(data: { date: string; narration?: string; entries: { account_id: number; debit: number; credit: number }[] }) {
    if (!db) throw new Error('Database not initialized');

    return db.transaction(() => {
        const journalStmt = db!.prepare(
            'INSERT INTO journals (date, narration) VALUES (?, ?)'
        );
        const journalResult = journalStmt.run(data.date, data.narration || null);
        const journalId = journalResult.lastInsertRowid;

        const lineStmt = db!.prepare(
            'INSERT INTO journal_lines (journal_id, account_id, debit, credit) VALUES (?, ?, ?, ?)'
        );

        for (const entry of data.entries) {
            lineStmt.run(journalId, entry.account_id, entry.debit, entry.credit);
        }

        return { id: journalId, ...data };
    })();
}

// Overview & Activity
export function getAccountingOverview() {
    if (!db) throw new Error('Database not initialized');

    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const now = new Date();
    const today = formatDate(now);

    const getTotalsForRange = (startDate: string, endDate: string) => {
        const query = `
            SELECT
    SUM(CASE WHEN a.type = 'INCOME' THEN(jl.credit - jl.debit) ELSE 0 END) as income,
        SUM(CASE WHEN a.type = 'EXPENSE' THEN(jl.debit - jl.credit) ELSE 0 END) as expense
            FROM journal_lines jl
            JOIN journals j ON jl.journal_id = j.id
            JOIN accounts a ON jl.account_id = a.id
            WHERE j.date BETWEEN ? AND ?
        `;
        const result = db!.prepare(query).get(startDate, endDate) as { income: number; expense: number };
        const income = result.income || 0;
        const expense = result.expense || 0;
        return { income, expense, net: income - expense };
    };

    // Calculate dates
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return {
        today: getTotalsForRange(today, today),
        this_week: getTotalsForRange(formatDate(startOfWeek), today),
        this_month: getTotalsForRange(formatDate(startOfMonth), today),
        this_year: getTotalsForRange(formatDate(startOfYear), today),
    };
}

export function getAccountingRecentActivity() {
    if (!db) throw new Error('Database not initialized');

    const query = `
        SELECT j.date, j.narration as title, SUM(jl.debit) as amount,
        (SELECT a.type FROM accounts a JOIN journal_lines jl2 ON a.id = jl2.account_id WHERE jl2.journal_id = j.id AND jl2.debit > 0 LIMIT 1) as type
        FROM journals j
        JOIN journal_lines jl ON j.id = jl.journal_id
        GROUP BY j.id
        ORDER BY j.date DESC, j.id DESC
        LIMIT 5
    `;

    const activities = db.prepare(query).all() as any[];

    return activities.map(act => {
        const isIncome = ['INCOME', 'SALES'].includes(act.type);
        return {
            title: act.title || 'Transaction',
            date: act.date,
            amount: `${isIncome ? '+' : '-'} $${act.amount.toLocaleString()} `
        };
    });
}

// Reports
export function getJournalReport({ from, to }: { from?: string; to?: string } = {}) {
    if (!db) throw new Error('Database not initialized');

    let query = `
        SELECT j.*, jl.id as line_id, jl.account_id, jl.debit, jl.credit, a.name as account_name, a.code as account_code
        FROM journals j
        JOIN journal_lines jl ON j.id = jl.journal_id
        JOIN accounts a ON jl.account_id = a.id
        `;
    const params: any[] = [];

    if (from && to) {
        query += ' WHERE j.date BETWEEN ? AND ?';
        params.push(from, to);
    }

    query += ' ORDER BY j.date DESC, j.id DESC';

    const rows = db.prepare(query).all(...params) as any[];

    // Group by journal
    const journalsMap = new Map<number, any>();
    rows.forEach(row => {
        if (!journalsMap.has(row.id)) {
            journalsMap.set(row.id, {
                id: row.id,
                date: row.date,
                narration: row.narration,
                entries: []
            });
        }
        journalsMap.get(row.id).entries.push({
            id: row.line_id,
            account: { code: row.account_code, name: row.account_name },
            debit: row.debit,
            credit: row.credit
        });
    });

    return Array.from(journalsMap.values());
}

export function getTrialBalance(date?: string) {
    if (!db) throw new Error('Database not initialized');

    const query = `
        SELECT a.code, a.name as account, a.type,
        SUM(jl.debit) as debit, SUM(jl.credit) as credit
        FROM accounts a
        LEFT JOIN journal_lines jl ON a.id = jl.account_id
        LEFT JOIN journals j ON jl.journal_id = j.id
        ${date ? 'WHERE j.date <= ?' : ''}
        GROUP BY a.id
        `;
    const rows = db.prepare(query).all(...(date ? [date] : [])) as any[];

    const totalDebit = rows.reduce((sum, row) => sum + (row.debit || 0), 0);
    const totalCredit = rows.reduce((sum, row) => sum + (row.credit || 0), 0);

    return {
        trial_balance: rows.map(r => ({ ...r, debit: r.debit || 0, credit: r.credit || 0 })),
        total_debit: totalDebit,
        total_credit: totalCredit,
        status: Math.abs(totalDebit - totalCredit) < 0.01 ? 'BALANCED' : 'UNBALANCED'
    };
}

export function getProfitAndLoss({ from, to }: { from?: string; to?: string } = {}) {
    if (!db) throw new Error('Database not initialized');

    const query = `
        SELECT a.code, a.name, a.type,
        SUM(jl.debit) as debit, SUM(jl.credit) as credit
        FROM accounts a
        JOIN journal_lines jl ON a.id = jl.account_id
        JOIN journals j ON jl.journal_id = j.id
        WHERE a.type IN('INCOME', 'EXPENSE')
        ${from && to ? 'AND j.date BETWEEN ? AND ?' : ''}
        GROUP BY a.id
    `;
    const rows = db.prepare(query).all(...(from && to ? [from, to] : [])) as any[];

    const report: any = {
        income: [],
        expense: [],
        total_income: 0,
        total_expense: 0,
        net_profit: 0
    };

    rows.forEach(row => {
        const debit = row.debit || 0;
        const credit = row.credit || 0;
        let amount = 0;

        if (row.type === 'INCOME') {
            amount = credit - debit;
            if (amount !== 0) {
                report.income.push({ code: row.code, name: row.name, amount });
                report.total_income += amount;
            }
        } else {
            amount = debit - credit;
            if (amount !== 0) {
                report.expense.push({ code: row.code, name: row.name, amount });
                report.total_expense += amount;
            }
        }
    });

    report.net_profit = report.total_income - report.total_expense;
    return report;
}
export function createHeadWiseTransaction(data: {
    type: 'INCOME' | 'EXPENSE';
    title: string;
    amount: number;
    date: string;
    head_id: number;
    payment_method: string | number; // Account Name or ID
    description?: string;
    reference_number?: string;
}) {
    if (!db) throw new Error('Database not initialized');

    // 1. Verify Head Account
    const headAccount = getAccountById(data.head_id);
    if (!headAccount) throw new Error(`${data.type} Head not found with ID: ${data.head_id} `);

    // 2. Verify Payment Account (Asset)
    let paymentAccount;
    if (typeof data.payment_method === 'number') {
        paymentAccount = getAccountById(data.payment_method);
    } else {
        const stmt = db.prepare('SELECT * FROM accounts WHERE name = ?');
        paymentAccount = stmt.get(data.payment_method) as Account | undefined;
    }

    if (!paymentAccount) {
        throw new Error(`Payment account '${data.payment_method}' not found.`);
    }

    return db.transaction(() => {
        // Create Transaction Record
        const txStmt = db!.prepare(
            'INSERT INTO transactions (type, amount, payment_mode, date, description) VALUES (?, ?, ?, ?, ?)'
        );
        const paymentMode = paymentAccount!.name.toLowerCase().includes('bank') ? 'BANK' : 'CASH';
        const txDescription = data.title + (data.description ? ` - ${data.description} ` : '');
        const txResult = txStmt.run(data.type, data.amount, paymentMode, data.date, txDescription);
        const txId = txResult.lastInsertRowid;

        // Create Journal Entry
        const journalStmt = db!.prepare(
            'INSERT INTO journals (date, narration, reference_type, reference_id) VALUES (?, ?, ?, ?)'
        );
        const narration = txDescription + (data.reference_number ? ` (Ref: ${data.reference_number})` : '');
        const journalResult = journalStmt.run(data.date, narration, 'TRANSACTION', txId);
        const journalId = journalResult.lastInsertRowid;

        const lineStmt = db!.prepare(
            'INSERT INTO journal_lines (journal_id, account_id, debit, credit) VALUES (?, ?, ?, ?)'
        );

        if (data.type === 'INCOME') {
            // Dr Asset (Bank/Cash), Cr Income
            lineStmt.run(journalId, paymentAccount!.id, data.amount, 0);
            lineStmt.run(journalId, headAccount.id, 0, data.amount);
        } else {
            // Dr Expense, Cr Asset (Bank/Cash)
            lineStmt.run(journalId, headAccount.id, data.amount, 0);
            lineStmt.run(journalId, paymentAccount!.id, 0, data.amount);
        }

        return { transaction_id: txId, journal_id: journalId };
    })();
}

export function seedAccountingAccounts() {
    if (!db) throw new Error('Database not initialized');

    const seeds = [
        { code: '1000', name: 'Cash', type: 'ASSET', parent_id: null },
        { code: '1100', name: 'Bank', type: 'ASSET', parent_id: null },
        { code: '1200', name: 'Accounts Receivable', type: 'ASSET', parent_id: null },
        { code: '1300', name: 'Inventory', type: 'ASSET', parent_id: null },
        { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', parent_id: null },
        { code: '3000', name: 'Owner Capital', type: 'EQUITY', parent_id: null },
        { code: 'ROOT_INCOME', name: 'Income', type: 'INCOME', parent_id: null },
        { code: 'ROOT_EXPENSE', name: 'Expenses', type: 'EXPENSE', parent_id: null },
        { code: '4000', name: 'Sales', type: 'INCOME', parent_id: null },
        { code: '4100', name: 'Other Income', type: 'INCOME', parent_id: null },
        { code: '5000', name: 'Purchase', type: 'EXPENSE', parent_id: null },
        { code: '5200', name: 'Office Expense', type: 'EXPENSE', parent_id: null },
    ];

    const insertStmt = db.prepare('INSERT INTO accounts (code, name, type, parent_id) VALUES (?, ?, ?, ?)');
    const checkStmt = db.prepare('SELECT id FROM accounts WHERE code = ?');

    db.transaction(() => {
        for (const seed of seeds) {
            const existing = checkStmt.get(seed.code);
            if (!existing) {
                insertStmt.run(seed.code, seed.name, seed.type, seed.parent_id);
            }
        }
    })();

    console.log('Accounting accounts seeded/verified successfully.');
}

export function getLedger({ account_id, from, to }: { account_id: number; from?: string; to?: string }) {
    if (!db) throw new Error('Database not initialized');

    // Get opening balance
    const openingQuery = `
        SELECT SUM(debit) - SUM(credit) as balance
        FROM journal_lines jl
        JOIN journals j ON jl.journal_id = j.id
        WHERE jl.account_id = ?
        ${from ? 'AND j.date < ?' : ''}
    `;
    const openingParams: any[] = [account_id];
    if (from) openingParams.push(from);
    const openingBalance = (db.prepare(openingQuery).get(...openingParams) as any)?.balance || 0;

    // Get transactions
    let query = `
        SELECT j.date, j.narration as description, jl.debit, jl.credit
        FROM journal_lines jl
        JOIN journals j ON jl.journal_id = j.id
        WHERE jl.account_id = ?
        `;
    const params: any[] = [account_id];

    if (from && to) {
        query += ' AND j.date BETWEEN ? AND ?';
        params.push(from, to);
    } else if (from) {
        query += ' AND j.date >= ?';
        params.push(from);
    } else if (to) {
        query += ' AND j.date <= ?';
        params.push(to);
    }

    query += ' ORDER BY j.date ASC, j.id ASC';

    const rows = db.prepare(query).all(...params) as any[];

    let currentBalance = openingBalance;
    const ledger = rows.map(row => {
        currentBalance += (row.debit - row.credit);
        return {
            ...row,
            balance: currentBalance
        };
    });

    return {
        opening_balance: openingBalance,
        transactions: ledger,
        closing_balance: currentBalance
    };
}

export function getAllTransactions({ from, to, type, search }: { from?: string; to?: string; type?: string; search?: string } = {}) {
    if (!db) throw new Error('Database not initialized');

    let query = `
        SELECT j.id, j.date, j.narration as description, j.reference_type as type,
        (SELECT a.name FROM journal_lines jl2 JOIN accounts a ON jl2.account_id = a.id WHERE jl2.journal_id = j.id AND jl2.debit > 0 LIMIT 1) as debit_account,
            (SELECT a.name FROM journal_lines jl2 JOIN accounts a ON jl2.account_id = a.id WHERE jl2.journal_id = j.id AND jl2.credit > 0 LIMIT 1) as credit_account,
                (SELECT SUM(debit) FROM journal_lines WHERE journal_id = j.id) as amount
        FROM journals j
        WHERE 1 = 1
        `;
    const params: any[] = [];

    if (from && to) {
        query += ' AND j.date BETWEEN ? AND ?';
        params.push(from, to);
    }
    if (type && type !== 'ALL') {
        query += ' AND j.reference_type = ?';
        params.push(type);
    }
    if (search) {
        query += ' AND (j.narration LIKE ? OR j.id LIKE ?)';
        params.push(`% ${search}% `, ` % ${search}% `);
    }

    query += ' ORDER BY j.date DESC, j.id DESC';

    return db.prepare(query).all(...params);
}

export function getMonthlyTrend() {
    if (!db) throw new Error('Database not initialized');

    const query = `
    SELECT
    strftime('%Y-%m', j.date) as month,
        SUM(CASE WHEN a.type = 'INCOME' THEN(jl.credit - jl.debit) ELSE 0 END) as income,
        SUM(CASE WHEN a.type = 'EXPENSE' THEN(jl.debit - jl.credit) ELSE 0 END) as expense
        FROM journals j
        JOIN journal_lines jl ON j.id = jl.journal_id
        JOIN accounts a ON jl.account_id = a.id
        WHERE a.type IN('INCOME', 'EXPENSE')
        GROUP BY month
        ORDER BY month ASC
        LIMIT 12
        `;

    return db.prepare(query).all();
}

// Supplier CRUD operations
export interface Supplier {
    id: number;
    name: string;
    code?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
    tax_id?: string;
    website?: string;
    payment_terms?: string;
    notes?: string;
    thumb_url?: string;
    gallery_items?: string;
    is_active: number;
    created_at?: string;
    updated_at?: string;
}

export function getAllSuppliers({ page = 1, limit = 10, search = '' }: { page?: number; limit?: number; search?: string } = {}) {
    if (!db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM suppliers';
    const params: any[] = [];

    if (search) {
        query += ' WHERE name LIKE ? OR code LIKE ? OR email LIKE ? OR contact_person LIKE ?';
        params.push(`% ${search}% `, ` % ${search}% `, ` % ${search}% `, ` % ${search}% `);
    }

    query += ' ORDER BY id DESC';

    const countQuery = search
        ? 'SELECT COUNT(*) as total FROM suppliers WHERE name LIKE ? OR code LIKE ? OR email LIKE ? OR contact_person LIKE ?'
        : 'SELECT COUNT(*) as total FROM suppliers';

    const countStmt = db.prepare(countQuery);
    const countResult = countStmt.get(...(search ? [`% ${search}% `, ` % ${search}% `, ` % ${search}% `, ` % ${search}% `] : [])) as { total: number };

    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ? `;
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const suppliers = stmt.all(...params) as any[];

    return {
        data: suppliers.map(s => ({
            ...s,
            is_active: Boolean(s.is_active),
            gallery_items: s.gallery_items ? JSON.parse(s.gallery_items) : [],
        })),
        pagination: {
            total: countResult.total,
            per_page: limit,
            current_page: page,
            last_page: Math.ceil(countResult.total / limit),
        },
    };
}

export function getSupplierById(id: number) {
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare('SELECT * FROM suppliers WHERE id = ?');
    const supplier = stmt.get(id) as any;

    if (!supplier) return null;

    return {
        ...supplier,
        is_active: Boolean(supplier.is_active),
        gallery_items: supplier.gallery_items ? JSON.parse(supplier.gallery_items) : [],
    };
}

export function createSupplier(data: any) {
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(`
        INSERT INTO suppliers(
            name, code, contact_person, email, phone, address, city, state, country, postal_code,
            latitude, longitude, tax_id, website, payment_terms, notes, thumb_url, gallery_items, is_active
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        data.name,
        data.code || null,
        data.contact_person || null,
        data.email || null,
        data.phone || null,
        data.address || null,
        data.city || null,
        data.state || null,
        data.country || null,
        data.postal_code || null,
        data.latitude || null,
        data.longitude || null,
        data.tax_id || null,
        data.website || null,
        data.payment_terms || null,
        data.notes || null,
        data.thumb_url || null,
        data.gallery_items ? JSON.stringify(data.gallery_items) : null,
        data.is_active ? 1 : 0
    );

    return { id: result.lastInsertRowid, ...data };
}

export function updateSupplier(id: number, data: any) {
    if (!db) throw new Error('Database not initialized');

    const updates: string[] = [];
    const params: any[] = [];

    const fields = [
        'name', 'code', 'contact_person', 'email', 'phone', 'address', 'city', 'state', 'country', 'postal_code',
        'latitude', 'longitude', 'tax_id', 'website', 'payment_terms', 'notes', 'thumb_url'
    ];

    fields.forEach(field => {
        if (data[field] !== undefined) {
            updates.push(`${field} = ?`);
            params.push(data[field]);
        }
    });

    if (data.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(data.is_active ? 1 : 0);
    }

    if (data.gallery_items !== undefined) {
        updates.push('gallery_items = ?');
        params.push(JSON.stringify(data.gallery_items));
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = db.prepare(`UPDATE suppliers SET ${updates.join(', ')} WHERE id = ? `);
    stmt.run(...params);

    return getSupplierById(id);
}

export function deleteSupplier(id: number) {
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare('DELETE FROM suppliers WHERE id = ?');
    const result = stmt.run(id);

    return { success: result.changes > 0 };
}

export interface Customer {
    id: number;
    name: string;
    code?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
    tax_id?: string;
    website?: string;
    payment_terms?: string;
    notes?: string;
    thumb_url?: string;
    gallery_items?: string[];
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export function getAllCustomers(params: { page?: number; limit?: number; search?: string } = {}) {
    if (!db) throw new Error('Database not initialized');

    const { page = 1, limit = 10, search = '' } = params;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM customers WHERE 1=1';
    const queryParams: any[] = [];

    if (search) {
        query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR code LIKE ?)';
        const searchParam = `% ${search}% `;
        queryParams.push(searchParam, searchParam, searchParam, searchParam);
    }

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM(${query})`);
    const totalResult = countStmt.get(...queryParams) as { total: number };
    const total = totalResult.total;

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const stmt = db.prepare(query);
    const customers = stmt.all(...queryParams) as any[];

    const mappedCustomers = customers.map(customer => ({
        ...customer,
        is_active: Boolean(customer.is_active),
        gallery_items: customer.gallery_items ? JSON.parse(customer.gallery_items) : [],
    }));

    return {
        data: mappedCustomers,
        pagination: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit)
        }
    };
}

export function getCustomerById(id: number) {
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare('SELECT * FROM customers WHERE id = ?');
    const customer = stmt.get(id) as any;

    if (!customer) return null;

    return {
        ...customer,
        is_active: Boolean(customer.is_active),
        gallery_items: customer.gallery_items ? JSON.parse(customer.gallery_items) : [],
    };
}

export function createCustomer(data: any) {
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(`
        INSERT INTO customers(
            name, code, contact_person, email, phone, address, city, state, country, postal_code,
            latitude, longitude, tax_id, website, payment_terms, notes, thumb_url, gallery_items, is_active,
            customer_type, credit_limit, outstanding_balance, company, sales_route_id
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        data.name,
        data.code || null,
        data.contact_person || null,
        data.email || null,
        data.phone || null,
        data.address || null,
        data.city || null,
        data.state || null,
        data.country || null,
        data.postal_code || null,
        data.latitude || null,
        data.longitude || null,
        data.tax_id || null,
        data.website || null,
        data.payment_terms || null,
        data.notes || null,
        data.thumb_url || null,
        data.gallery_items ? JSON.stringify(data.gallery_items) : null,
        data.is_active ? 1 : 0,
        data.customer_type || 'individual',
        data.credit_limit || 0,
        data.outstanding_balance || 0,
        data.company || null,
        data.sales_route_id || null
    );

    return { id: result.lastInsertRowid, ...data };
}

export function updateCustomer(id: number, data: any) {
    if (!db) throw new Error('Database not initialized');

    const updates: string[] = [];
    const params: any[] = [];

    const fields = [
        'name', 'code', 'contact_person', 'email', 'phone', 'address', 'city', 'state', 'country', 'postal_code',
        'latitude', 'longitude', 'tax_id', 'website', 'payment_terms', 'notes', 'thumb_url',
        'customer_type', 'credit_limit', 'outstanding_balance', 'company', 'sales_route_id'
    ];

    fields.forEach(field => {
        if (data[field] !== undefined) {
            updates.push(`${field} = ?`);
            params.push(data[field]);
        }
    });

    if (data.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(data.is_active ? 1 : 0);
    }

    if (data.gallery_items !== undefined) {
        updates.push('gallery_items = ?');
        params.push(JSON.stringify(data.gallery_items));
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = db.prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = ? `);
    stmt.run(...params);

    return getCustomerById(id);
}

export function deleteCustomer(id: number) {
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare('DELETE FROM customers WHERE id = ?');
    const result = stmt.run(id);

    return { success: result.changes > 0 };
}

// ---------------------------------------------------------
// PURCHASE INVOICE MODULE
// ---------------------------------------------------------

export function getAllPurchaseInvoices({ page = 1, limit = 10, search = '' }: { page?: number; limit?: number; search?: string } = {}) {
    if (!db) throw new Error('Database not initialized');
    logDebug(`getAllPurchaseInvoices called with: ${JSON.stringify({ page, limit, search })}`);

    let query = `
        SELECT
            pi.*,
            po.po_number,
            s.name as supplier_name
        FROM purchase_invoices pi
        LEFT JOIN purchase_orders po ON pi.purchase_order_id = po.id
        LEFT JOIN suppliers s ON po.supplier_id = s.id
    `;
    const params: any[] = [];

    if (search) {
        query += ' WHERE pi.invoice_number LIKE ? OR po.po_number LIKE ? OR s.name LIKE ?';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY pi.id DESC';

    // Count
    const countQuery = `
        SELECT COUNT(*) as total
        FROM purchase_invoices pi
        LEFT JOIN purchase_orders po ON pi.purchase_order_id = po.id
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        ${search ? 'WHERE pi.invoice_number LIKE ? OR po.po_number LIKE ? OR s.name LIKE ?' : ''}
    `;
    const countStmt = db.prepare(countQuery);
    const countResult = countStmt.get(...params) as { total: number };

    // Limit
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];

    // Transform to match frontend expected structure
    const data = rows.map(row => ({
        ...row,
        status: row.status, // draft, paid, partial, overdue
        purchase_order: {
            id: row.purchase_order_id,
            po_number: row.po_number,
            supplier: { name: row.supplier_name }
        }
    }));

    return {
        data,
        pagination: {
            total: countResult.total,
            page,
            limit,
            totalPage: Math.ceil(countResult.total / limit),
        },
    };
}

export function getPurchaseInvoiceById(id: number) {
    if (!db) throw new Error('Database not initialized');

    const query = `
        SELECT
            pi.*,
            po.po_number,
            po.total_amount as po_total_amount,
            po.tax_amount as po_tax_amount,
            po.discount_amount as po_discount_amount,
            s.id as supplier_id,
            s.name as supplier_name,
            s.email as supplier_email,
            s.phone as supplier_phone,
            s.address as supplier_address
        FROM purchase_invoices pi
        LEFT JOIN purchase_orders po ON pi.purchase_order_id = po.id
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        WHERE pi.id = ?
    `;

    const invoice = db.prepare(query).get(id) as any;
    if (!invoice) return null;

    // Get items from PO (since we don't have separate invoice items yet)
    const itemsStmt = db.prepare(`
        SELECT poi.*, p.name as product_name, p.sku as product_sku
        FROM purchase_order_items poi
        LEFT JOIN products p ON poi.product_id = p.id
        WHERE poi.purchase_order_id = ?
    `);
    const items = itemsStmt.all(invoice.purchase_order_id) as any[];

    // Get payments linked to this invoice's PO (or specifically this invoice if we link payments to invoices later)
    // For now assuming payments are on PO
    const paymentsStmt = db.prepare(`SELECT * FROM purchase_payments WHERE purchase_order_id = ?`);
    const payments = paymentsStmt.all(invoice.purchase_order_id);

    return {
        ...invoice,
        purchase_order: {
            id: invoice.purchase_order_id,
            po_number: invoice.po_number,
            total_amount: invoice.po_total_amount,
            tax_amount: invoice.po_tax_amount,
            discount_amount: invoice.po_discount_amount,
            supplier: {
                id: invoice.supplier_id,
                name: invoice.supplier_name,
                email: invoice.supplier_email,
                phone: invoice.supplier_phone,
                address: invoice.supplier_address
            },
            items: items.map(i => ({ ...i, product: { name: i.product_name, sku: i.product_sku } }))
        },
        payments: payments
    };
}

export function createPurchaseInvoice(data: any) {
    if (!db) throw new Error('Database not initialized');
    logDebug(`createPurchaseInvoice received: ${JSON.stringify(data)}`);

    return db.transaction(() => {
        // Validation: Check if PO exists
        const po = db!.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(data.purchase_order_id) as any;
        if (!po) throw new Error(`Purchase Order ID ${data.purchase_order_id} not found`);

        const stmt = db!.prepare(`
            INSERT INTO purchase_invoices (
                invoice_number, purchase_order_id, total_payable_amount, paid_amount, due_amount,
                status, invoice_date, due_date, notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // If no number provided, auto-generate
        if (!data.invoice_number) {
            const max = db!.prepare('SELECT MAX(id) as m FROM purchase_invoices').get() as { m: number };
            const nextNum = (max.m || 0) + 1;
            data.invoice_number = `INV-${new Date().getFullYear()}-${nextNum.toString().padStart(4, '0')}`;
        }

        const result = stmt.run(
            data.invoice_number,
            data.purchase_order_id,
            data.total_payable_amount || 0,
            data.paid_amount || 0,
            data.due_amount || (data.total_payable_amount || 0),
            data.status || 'draft',
            data.invoice_date || new Date().toISOString(),
            data.due_date || null,
            data.notes || null,
            data.created_by || null
        );

        return getPurchaseInvoiceById(result.lastInsertRowid as number);
    })();
}

export function updatePurchaseInvoice(id: number, data: any) {
    if (!db) throw new Error('Database not initialized');

    const updates: string[] = [];
    const params: any[] = [];
    const fields = ['invoice_number', 'total_payable_amount', 'paid_amount', 'due_amount', 'status', 'invoice_date', 'due_date', 'notes'];

    fields.forEach(field => {
        if (data[field] !== undefined) {
            updates.push(`${field} = ?`);
            params.push(data[field]);
        }
    });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = db.prepare(`UPDATE purchase_invoices SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    return getPurchaseInvoiceById(id);
}

export function deletePurchaseInvoice(id: number) {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare('DELETE FROM purchase_invoices WHERE id = ?');
    const result = stmt.run(id);
    return { success: result.changes > 0 };
}

