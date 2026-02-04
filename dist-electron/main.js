import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase, verifyUser, getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory, getAllUnits, getUnitById, createUnit, updateUnit, deleteUnit, getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getProductStats, getAllAccounts, getIncomeHeads, getExpenseHeads, getAccountById, createAccount, updateAccount, deleteAccount, getAccountingOverview, getAccountingRecentActivity, getJournalReport, getTrialBalance, getProfitAndLoss, getLedger, getAllTransactions, getMonthlyTrend, createJournalEntry, createHeadWiseTransaction, getAllSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier, getAllCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer, getAllPurchaseOrders, getPurchaseOrderById, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, getAllPurchasePayments, getPurchasePaymentById, createPurchasePayment, getAllPurchaseInvoices, getPurchaseInvoiceById, createPurchaseInvoice, updatePurchaseInvoice, deletePurchaseInvoice } from './database.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');
let win;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
function createWindow() {
    const publicDir = process.env.VITE_PUBLIC || '';
    win = new BrowserWindow({
        icon: path.join(publicDir, 'electron-vite.svg'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    // Open the DevTools.
    win.webContents.openDevTools();
    // Init DB
    try {
        initDatabase();
    }
    catch (err) {
        console.error('Failed to init database:', err);
    }
}
function registerIpcHandlers() {
    ipcMain.handle('login', (_event, { email, password }) => {
        try {
            console.log('Login attempt:', email);
            const user = verifyUser(email, password);
            if (user) {
                return { success: true, user };
            }
            return { success: false, error: 'Invalid credentials' };
        }
        catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Internal server error' };
        }
    });
    // Category IPC handlers
    ipcMain.handle('categories:getAll', (_event, params) => {
        try {
            return getAllCategories(params);
        }
        catch (error) {
            console.error('Error getting categories:', error);
            throw error;
        }
    });
    ipcMain.handle('categories:getById', (_event, id) => {
        try {
            const category = getCategoryById(id);
            if (!category) {
                throw new Error('Category not found');
            }
            return { data: category };
        }
        catch (error) {
            console.error('Error getting category:', error);
            throw error;
        }
    });
    ipcMain.handle('categories:create', (_event, data) => {
        try {
            const category = createCategory(data);
            return { status: true, message: 'Category created successfully', data: category };
        }
        catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    });
    ipcMain.handle('categories:update', (_event, { id, data }) => {
        try {
            const category = updateCategory(id, data);
            return { status: true, message: 'Category updated successfully', data: category };
        }
        catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    });
    ipcMain.handle('categories:delete', (_event, id) => {
        try {
            const result = deleteCategory(id);
            return { status: result.success, message: result.success ? 'Category deleted successfully' : 'Category not found' };
        }
        catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    });
    // Unit IPC handlers
    ipcMain.handle('units:getAll', (_event, params) => {
        try {
            return getAllUnits(params);
        }
        catch (error) {
            console.error('Error getting units:', error);
            throw error;
        }
    });
    ipcMain.handle('units:getById', (_event, id) => {
        try {
            const unit = getUnitById(id);
            if (!unit) {
                throw new Error('Unit not found');
            }
            return { data: unit };
        }
        catch (error) {
            console.error('Error getting unit:', error);
            throw error;
        }
    });
    ipcMain.handle('units:create', (_event, data) => {
        try {
            const unit = createUnit(data);
            return { status: true, message: 'Unit created successfully', data: unit };
        }
        catch (error) {
            console.error('Error creating unit:', error);
            throw error;
        }
    });
    ipcMain.handle('units:update', (_event, { id, data }) => {
        try {
            const unit = updateUnit(id, data);
            return { status: true, message: 'Unit updated successfully', data: unit };
        }
        catch (error) {
            console.error('Error updating unit:', error);
            throw error;
        }
    });
    ipcMain.handle('units:delete', (_event, id) => {
        try {
            const result = deleteUnit(id);
            return { status: result.success, message: result.success ? 'Unit deleted successfully' : 'Unit not found' };
        }
        catch (error) {
            console.error('Error deleting unit:', error);
            throw error;
        }
    });
    // Product IPC handlers
    ipcMain.handle('products:getAll', (_event, params) => {
        try {
            return getAllProducts(params);
        }
        catch (error) {
            console.error('Error getting products:', error);
            throw error;
        }
    });
    ipcMain.handle('products:getById', (_event, id) => {
        try {
            const product = getProductById(id);
            if (!product) {
                throw new Error('Product not found');
            }
            return { data: product };
        }
        catch (error) {
            console.error('Error getting product:', error);
            throw error;
        }
    });
    ipcMain.handle('products:create', (_event, data) => {
        try {
            const product = createProduct(data);
            return { status: true, message: 'Product created successfully', data: product };
        }
        catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    });
    ipcMain.handle('products:update', (_event, { id, body }) => {
        try {
            const product = updateProduct(id, body);
            return { status: true, message: 'Product updated successfully', data: product };
        }
        catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    });
    ipcMain.handle('products:delete', (_event, id) => {
        try {
            const result = deleteProduct(id);
            return { status: result.success, message: result.success ? 'Product deleted successfully' : 'Product not found' };
        }
        catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    });
    ipcMain.handle('products:stats', (_event) => {
        try {
            return getProductStats();
        }
        catch (error) {
            console.error('Error getting product stats:', error);
            throw error;
        }
    });
    // Image IPC handlers
    ipcMain.handle('images:save', async (_event, { base64Data, filename }) => {
        try {
            const imagesDir = path.join(app.getPath('userData'), 'images', 'products');
            // Create directory if it doesn't exist
            if (!fs.existsSync(imagesDir)) {
                fs.mkdirSync(imagesDir, { recursive: true });
            }
            // Generate unique filename
            const timestamp = Date.now();
            const ext = path.extname(filename);
            const uniqueFilename = `${timestamp}_${filename}`;
            const filePath = path.join(imagesDir, uniqueFilename);
            // Remove base64 prefix if present
            const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Image, 'base64');
            // Save file
            fs.writeFileSync(filePath, buffer);
            // Return relative path for database storage and base64 for display
            const relativePath = path.join('images', 'products', uniqueFilename);
            return {
                success: true,
                path: relativePath,
                base64: base64Data // Return original base64 for immediate display
            };
        }
        catch (error) {
            console.error('Error saving image:', error);
            throw error;
        }
    });
    ipcMain.handle('images:delete', async (_event, relativePath) => {
        try {
            const fullPath = path.join(app.getPath('userData'), relativePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                return { success: true };
            }
            return { success: false, error: 'File not found' };
        }
        catch (error) {
            console.error('Error deleting image:', error);
            throw error;
        }
    });
    ipcMain.handle('images:getAll', async (_event, { page = 1, limit = 12 }) => {
        try {
            const imagesDir = path.join(app.getPath('userData'), 'images', 'products');
            // Create directory if it doesn't exist
            if (!fs.existsSync(imagesDir)) {
                fs.mkdirSync(imagesDir, { recursive: true });
                return { data: [], pagination: { page: 1, totalPage: 1, total: 0 } };
            }
            // Get all image files
            const files = fs.readdirSync(imagesDir)
                .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
                .map(file => {
                const filePath = path.join(imagesDir, file);
                const stats = fs.statSync(filePath);
                // Read file and convert to base64
                const fileBuffer = fs.readFileSync(filePath);
                const base64 = fileBuffer.toString('base64');
                const ext = path.extname(file).toLowerCase();
                const mimeType = ext === '.png' ? 'image/png' :
                    ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                        ext === '.gif' ? 'image/gif' :
                            ext === '.webp' ? 'image/webp' : 'image/jpeg';
                return {
                    id: file,
                    filename: file,
                    path: path.join('images', 'products', file),
                    base64: `data:${mimeType};base64,${base64}`,
                    createdAt: stats.mtime
                };
            })
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            // Pagination
            const total = files.length;
            const totalPages = Math.ceil(total / limit);
            const start = (page - 1) * limit;
            const end = start + limit;
            const paginatedFiles = files.slice(start, end);
            return {
                data: paginatedFiles,
                pagination: {
                    page,
                    totalPage: totalPages,
                    total
                }
            };
        }
        catch (error) {
            console.error('Error getting images:', error);
            throw error;
        }
    });
    ipcMain.handle('images:getUrl', async (_event, relativePath) => {
        try {
            const fullPath = path.join(app.getPath('userData'), relativePath);
            if (!fs.existsSync(fullPath)) {
                throw new Error('Image file not found');
            }
            // Read file and convert to base64
            const fileBuffer = fs.readFileSync(fullPath);
            const base64 = fileBuffer.toString('base64');
            const ext = path.extname(fullPath).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' :
                ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                    ext === '.gif' ? 'image/gif' :
                        ext === '.webp' ? 'image/webp' : 'image/jpeg';
            return `data:${mimeType};base64,${base64}`;
        }
        catch (error) {
            console.error('Error getting image URL:', error);
            throw error;
        }
    });
    // Accounting IPC handlers
    ipcMain.handle('accounting:getAllAccounts', (_event, params) => {
        try {
            return getAllAccounts(params);
        }
        catch (error) {
            console.error('Error getting accounts:', error);
            throw error;
        }
    });
    ipcMain.handle('accounting:getIncomeHeads', (_event) => {
        try {
            return getIncomeHeads();
        }
        catch (error) {
            console.error('Error getting income heads:', error);
            throw error;
        }
    });
    ipcMain.handle('accounting:getExpenseHeads', (_event) => {
        try {
            return getExpenseHeads();
        }
        catch (error) {
            console.error('Error getting expense heads:', error);
            throw error;
        }
    });
    ipcMain.handle('accounting:getAccountById', (_event, id) => {
        try {
            return getAccountById(id);
        }
        catch (error) {
            console.error('Error getting account:', error);
            throw error;
        }
    });
    ipcMain.handle('accounting:createAccount', (_event, data) => {
        try {
            const account = createAccount(data);
            return { status: true, message: 'Account created successfully', data: account };
        }
        catch (error) {
            console.error('Error creating account:', error);
            throw error;
        }
    });
    ipcMain.handle('accounting:updateAccount', (_event, { id, data }) => {
        try {
            const account = updateAccount(id, data);
            return { status: true, message: 'Account updated successfully', data: account };
        }
        catch (error) {
            console.error('Error updating account:', error);
            throw error;
        }
    });
    ipcMain.handle('accounting:deleteAccount', (_event, id) => {
        try {
            const result = deleteAccount(id);
            return { status: result.success, message: result.success ? 'Account deleted successfully' : 'Account not found' };
        }
        catch (error) {
            console.error('Error deleting account:', error);
            throw error;
        }
    });
    ipcMain.handle('accounting:getOverview', (_event) => {
        try {
            return getAccountingOverview();
        }
        catch (error) {
            console.error('Error getting accounting overview:', error);
            throw error;
        }
    });
    ipcMain.handle('accounting:getRecentActivity', (_event) => {
        try {
            return getAccountingRecentActivity();
        }
        catch (error) {
            console.error('Error getting recent activity:', error);
            throw error;
        }
    });
    ipcMain.handle('accounting:getJournalReport', (_event, filters) => {
        try {
            return getJournalReport(filters);
        }
        catch (error) {
            console.error('Error getting journal report:', error);
            throw error;
        }
    });
    ipcMain.handle('accounting:getTrialBalance', (_event, date) => {
        try {
            return getTrialBalance(date);
        }
        catch (error) {
            console.error('Error getting trial balance:', error);
            throw error;
        }
    });
    ipcMain.handle('accounting:getProfitAndLoss', (_event, filters) => {
        try {
            return getProfitAndLoss(filters);
        }
        catch (error) {
            console.error('Error getting profit and loss:', error);
            throw error;
        }
    });
    ipcMain.handle('accounting:getLedger', (_event, params) => {
        try {
            return getLedger(params);
        }
        catch (error) {
            console.error('Error getting ledger:', error);
            throw error;
        }
    });
    ipcMain.handle('accounting:getAllTransactions', (_event, params) => {
        try {
            return getAllTransactions(params);
        }
        catch (error) {
            console.error('Error getting all transactions:', error);
            throw error;
        }
    });
    ipcMain.handle('accounting:getMonthlyTrend', (_event) => {
        try {
            return getMonthlyTrend();
        }
        catch (error) {
            console.error('Error getting monthly trend:', error);
            throw error;
        }
    });
    ipcMain.handle('accounting:createJournalEntry', (_event, data) => {
        try {
            const journal = createJournalEntry(data);
            return { status: true, message: 'Journal entry created successfully', data: journal };
        }
        catch (error) {
            console.error('Error creating journal entry:', error);
            throw error;
        }
    });
    ipcMain.handle('accounting:createHeadWiseTransaction', (_event, data) => {
        try {
            const result = createHeadWiseTransaction(data);
            return { status: true, message: 'Transaction recorded successfully', data: result };
        }
        catch (error) {
            console.error('Error creating head-wise transaction:', error);
            throw error;
        }
    });
    // Supplier IPC handlers
    ipcMain.handle('suppliers:getAll', (_event, params) => {
        try {
            return getAllSuppliers(params);
        }
        catch (error) {
            console.error('Error getting suppliers:', error);
            throw error;
        }
    });
    ipcMain.handle('suppliers:getById', (_event, id) => {
        try {
            return getSupplierById(id);
        }
        catch (error) {
            console.error('Error getting supplier:', error);
            throw error;
        }
    });
    ipcMain.handle('suppliers:create', (_event, data) => {
        try {
            const supplier = createSupplier(data);
            return { status: true, message: 'Supplier created successfully', data: supplier };
        }
        catch (error) {
            console.error('Error creating supplier:', error);
            throw error;
        }
    });
    ipcMain.handle('suppliers:update', (_event, { id, data }) => {
        try {
            const supplier = updateSupplier(id, data);
            return { status: true, message: 'Supplier updated successfully', data: supplier };
        }
        catch (error) {
            console.error('Error updating supplier:', error);
            throw error;
        }
    });
    ipcMain.handle('suppliers:delete', (_event, id) => {
        try {
            const result = deleteSupplier(id);
            return { status: result.success, message: result.success ? 'Supplier deleted successfully' : 'Supplier not found' };
        }
        catch (error) {
            console.error('Error deleting supplier:', error);
            throw error;
        }
    });
    // Customer IPC handlers
    ipcMain.handle('customers:getAll', (_event, params) => {
        try {
            return getAllCustomers(params);
        }
        catch (error) {
            console.error('Error getting customers:', error);
            throw error;
        }
    });
    ipcMain.handle('customers:getById', (_event, id) => {
        try {
            return getCustomerById(id);
        }
        catch (error) {
            console.error('Error getting customer:', error);
            throw error;
        }
    });
    ipcMain.handle('customers:create', (_event, data) => {
        try {
            const customer = createCustomer(data);
            return { status: true, message: 'Customer created successfully', data: customer };
        }
        catch (error) {
            console.error('Error creating customer:', error);
            throw error;
        }
    });
    ipcMain.handle('customers:update', (_event, { id, data }) => {
        try {
            const customer = updateCustomer(id, data);
            return { status: true, message: 'Customer updated successfully', data: customer };
        }
        catch (error) {
            console.error('Error updating customer:', error);
            throw error;
        }
    });
    ipcMain.handle('customers:delete', (_event, id) => {
        try {
            const result = deleteCustomer(id);
            return { status: result.success, message: result.success ? 'Customer deleted successfully' : 'Customer not found' };
        }
        catch (error) {
            console.error('Error deleting customer:', error);
            throw error;
        }
    });
    // Purchase IPC handlers
    ipcMain.handle('purchase:orders:getAll', (_event, params) => {
        try {
            return getAllPurchaseOrders(params);
        }
        catch (error) {
            console.error('Error getting purchase orders:', error);
            throw error;
        }
    });
    ipcMain.handle('purchase:orders:getById', (_event, id) => {
        try {
            return getPurchaseOrderById(id);
        }
        catch (error) {
            console.error('Error getting purchase order:', error);
            throw error;
        }
    });
    ipcMain.handle('purchase:orders:create', (_event, data) => {
        try {
            const po = createPurchaseOrder(data);
            return { status: true, message: 'Purchase Order created successfully', data: po };
        }
        catch (error) {
            console.error('Error creating purchase order:', error);
            throw error;
        }
    });
    ipcMain.handle('purchase:orders:update', (_event, { id, body }) => {
        try {
            const po = updatePurchaseOrder(id, body);
            return { status: true, message: 'Purchase Order updated successfully', data: po };
        }
        catch (error) {
            console.error('Error updating purchase order:', error);
            throw error;
        }
    });
    ipcMain.handle('purchase:orders:delete', (_event, id) => {
        try {
            const result = deletePurchaseOrder(id);
            return { status: result.success, message: result.success ? 'Purchase Order deleted successfully' : 'PO not found' };
        }
        catch (error) {
            console.error('Error deleting purchase order:', error);
            throw error;
        }
    });
    ipcMain.handle('purchase:payments:getAll', (_event, params) => {
        try {
            return getAllPurchasePayments(params);
        }
        catch (error) {
            console.error('Error getting purchase payments:', error);
            throw error;
        }
    });
    ipcMain.handle('purchase:payments:getById', (_event, id) => {
        try {
            return getPurchasePaymentById(id);
        }
        catch (error) {
            console.error('Error getting purchase payment:', error);
            throw error;
        }
    });
    ipcMain.handle('purchase:payments:create', (_event, data) => {
        try {
            const payment = createPurchasePayment(data);
            return { status: true, message: 'Payment recorded successfully', data: payment };
        }
        catch (error) {
            console.error('Error creating purchase payment:', error);
            throw error;
        }
    });
    ipcMain.handle('purchase:invoices:getAll', (_event, params) => {
        try {
            return getAllPurchaseInvoices(params);
        }
        catch (error) {
            console.error('Error getting purchase invoices:', error);
            throw error;
        }
    });
    ipcMain.handle('purchase:invoices:getById', (_event, id) => {
        try {
            return getPurchaseInvoiceById(id);
        }
        catch (error) {
            console.error('Error getting purchase invoice:', error);
            throw error;
        }
    });
    ipcMain.handle('purchase:invoices:create', (_event, data) => {
        try {
            const invoice = createPurchaseInvoice(data);
            return { status: true, message: 'Purchase Invoice created successfully', data: invoice };
        }
        catch (error) {
            console.error('Error creating purchase invoice:', error);
            throw error;
        }
    });
    ipcMain.handle('purchase:invoices:update', (_event, { id, body }) => {
        try {
            const invoice = updatePurchaseInvoice(id, body);
            return { status: true, message: 'Purchase Invoice updated successfully', data: invoice };
        }
        catch (error) {
            console.error('Error updating purchase invoice:', error);
            throw error;
        }
    });
    ipcMain.handle('purchase:invoices:delete', (_event, id) => {
        try {
            const result = deletePurchaseInvoice(id);
            return { status: result.success, message: result.success ? 'Purchase Invoice deleted successfully' : 'Invoice not found' };
        }
        catch (error) {
            console.error('Error deleting purchase invoice:', error);
            throw error;
        }
    });
}
function startApp() {
    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
    }
    else {
        const distDir = process.env.DIST || path.join(__dirname, '../dist');
        win.loadFile(path.join(distDir, 'index.html'));
    }
}
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
        startApp();
    }
});
app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();
    startApp();
});
