
//   group/module based permission


// --- Dashboard ---

export const SuperAdminPermission = {
  ACCESS_ALL: "*" as const,
};

export const DashboardPermission = {
  VIEW: "dashboard.view" as const,
  STATS: "dashboard.stats" as const,
  GRAPH: "dashboard.graph" as const,
  // LIST: "dashboard.list" as const,
  RECENT_SALES_LIST: "dashboard.recent_sales.list" as const,
  RECENT_CUSTOMERS_LIST: "dashboard.recent_customers.list" as const,
};

// --- Products ---
export const ProductPermission = {
  VIEW: "products.view" as const,
  LIST: "products.list" as const,
  DETAILS: "products.details" as const,
  CREATE: "products.create" as const,
  EDIT: "products.edit" as const,
  // Categories
  VIEW_CATEGORIES: "products.categories.view" as const,
  CREATE_CATEGORIES: "products.categories.create" as const,
  Edit_CATEGORIES: "products.categories.edit" as const,
  DELETE_CATEGORIES: "products.categories.delete" as const,
  // Units
  VIEW_UNITS: "products.units.view" as const,
  CREATE_UNITS: "products.units.create" as const,
  EDIT_UNITS: "products.units.edit" as const,
  DELETE_UNITS: "products.units.delete" as const,

  // Stock Management
  VIEW_STOCK: "products.stock.view" as const,
  CREATE_STOCK: "products.stock.create" as const,
  EDIT_STOCK: "products.stock.edit" as const,
  DELETE_STOCK: "products.stock.delete" as const,
  MANAGE_STOCK: "products.stock.manage" as const,
};

// --- Customers ---
export const CustomerPermission = {
  VIEW: "customers.view" as const,
  LIST: "customers.list" as const,
  LIST_INACTIVE: "customers.list.inactive" as const,
  DETAILS: "customers.details" as const,
  CREATE: "customers.create" as const,
  CUSTOMER_ACTIVE_PERMISSION: "customers.active.permission" as const,
  CREATE_BY_STAFF: "customers.create.by.staff" as const,
  EDIT_BY_STAFF: "customers.edit.by.staff" as const,
  EDIT: "customers.edit" as const,
  VIEW_ROUTE_DETAILS: "customers.routes.details.view" as const,
  ASSIGN_ROUTE: "customers.routes.assign" as const,
  VIEW_MAP: "customers.map.view" as const,
  DELETE: "customers.delete" as const,
};

// --- Suppliers ---
export const SupplierPermission = {
  VIEW: "suppliers.view" as const,
  LIST: "suppliers.list" as const,
  CREATE: "suppliers.create" as const,
  EDIT: "suppliers.edit" as const,
  VIEW_PURCHASE_ORDERS: "suppliers.purchase_orders.view" as const,
  VIEW_PURCHASE_ORDER_DETAILS: "suppliers.purchase_orders.details.view" as const,
  CREATE_PURCHASE_ORDER: "suppliers.purchase_orders.create" as const,
  EDIT_PURCHASE_ORDER: "suppliers.purchase_orders.edit" as const,
  VIEW_PURCHASE_INVOICES: "suppliers.invoices.view" as const,
  VIEW_PURCHASE_INVOICE_DETAILS: "suppliers.invoices.details.view" as const,
  PREVIEW_PURCHASE_INVOICE: "suppliers.invoices.preview" as const,
  CREATE_PURCHASE_PAYMENT: "suppliers.payments.create" as const,
  VIEW_PURCHASE_PAYMENTS: "suppliers.payments.view" as const,
  VIEW_PURCHASE_PAYMENT_DETAILS: "suppliers.payments.details.view" as const,
  VIEW_PURCHASE_ORDERS_MAP: "suppliers.purchase_orders.map.view" as const,
};

// --- Staffs ---
export const StaffPermission = {
  VIEW: "staffs.view" as const,
  LIST: "staffs.list" as const,
  DETAILS: "staffs.details.view" as const,
  CREATE: "staffs.create" as const,
  EDIT: "staffs.edit" as const,
  VIEW_DEPARTMENTS: "departments.view" as const,
  CREATE_DEPARTMENTS: "departments.create" as const,
  EDIT_DEPARTMENTS: "departments.edit" as const,
  DELETE_DEPARTMENTS: "departments.delete" as const,
  VIEW_ATTENDANCE: "attendance.view" as const,
  MANAGE_LEAVES: "leaves.manage" as const,
  VIEW_STAFF_MAP: "staffs.map.view" as const,
  CHECK_IN: "staffs.check_in" as const,
  VIEW_CHECK_IN_LIST: "staffs.view_check_in_list" as const,
};

// --- Sales & Orders ---
export const SalesPermission = {
  VIEW: "sales.view" as const,
  ORDERS: "sales.orders.view" as const,
  PENDING_ORDERS: "sales.orders.pending.view" as const,
  CONFIRMED_ORDERS: "sales.orders.confirmed.view" as const,
  DELIVERED_ORDERS: "sales.orders.delivered.view" as const,
  INTRANSIT_ORDERS: "sales.orders.intransit.view" as const,
  ORDER_DETAILS: "sales.orders.details.view" as const,
  CREATE_ORDER: "sales.orders.create" as const,
  EDIT_ORDER: "sales.orders.edit" as const,
  INVOICES: "sales.invoices.view" as const,
  INVOICE_DETAILS: "sales.invoices.details.view" as const,
  INVOICE_PREVIEW: "sales.invoices.preview" as const,
  PAYMENTS: "sales.payments.view" as const,
  PAYMENT_DETAILS: "sales.payments.details.view" as const,
  CREATE_PAYMENT: "sales.payments.create" as const,
  DELIVERY: "sales.delivery.view" as const,
  UPDATE_DELIVERY: "sales.delivery.update" as const,
  SALES_ROUTES: "sales.routes.view" as const,
  DETAILS_SALES_ROUTES: "sales.routes.details" as const,
  CREATE_ROUTE: "sales.routes.create" as const,
  EDIT_ROUTE: "sales.routes.edit" as const,
  ASSIGN_ROUTE: "sales.routes.assign" as const,
  MARK_AS_PAID: "sales.invoices.mark_as_paid" as const,
  POS_ORDER: "sales.pos_order.view" as const,
};

// --- Accounting ---
export const AccountingPermission = {
  VIEW: "accounting.view" as const,
  OVERVIEW: "accounting.overview.view" as const,
  INCOMES: "accounting.incomes.view" as const,
  EXPENSES: "accounting.expenses.view" as const,
  CREATE_INCOME: "accounting.incomes.create" as const,
  CREATE_EXPENSE: "accounting.expenses.create" as const,

  // Credit Heads
  VIEW_CREDIT_HEADS: "accounting.credit_heads.view" as const,
  CREATE_CREDIT_HEADS: "accounting.credit_heads.create" as const,
  EDIT_CREDIT_HEADS: "accounting.credit_heads.edit" as const,
  DELETE_CREDIT_HEADS: "accounting.credit_heads.delete" as const,

  // Debit Heads
  VIEW_DEBIT_HEADS: "accounting.debit_heads.view" as const,
  CREATE_DEBIT_HEADS: "accounting.debit_heads.create" as const,
  EDIT_DEBIT_HEADS: "accounting.debit_heads.edit" as const,
  DELETE_DEBIT_HEADS: "accounting.debit_heads.delete" as const,

  // New Items
  TRANSACTIONS: "accounting.transactions.view" as const,
  CHART_OF_ACCOUNTS: "accounting.chart_of_accounts.view" as const,
  JOURNAL_REPORT: "accounting.reports.journal.view" as const,
  LEDGER_REPORT: "accounting.reports.ledger.view" as const,
  TRIAL_BALANCE: "accounting.reports.trial_balance.view" as const,
  PROFIT_AND_LOSS: "accounting.reports.profit_and_loss.view" as const,
};

// --- Users ---
export const UserPermission = {
  VIEW: "users.view" as const,
  LIST: "users.list" as const,
  CREATE: "users.create" as const,
  EDIT: "users.edit" as const,
  DETAILS: "users.details.view" as const,
};

// --- Roles & Permissions ---
export const RolePermission = {
  CREATE_ROLES: "roles.create" as const,
  DELETE_ROLES: "roles.delete" as const,
  VIEW_ROLES: "roles.view" as const,
  VIEW_PERMISSIONS: "permissions.view" as const,
  VIEW_ROLES_PERMISSIONS: "roles_permissions.view" as const,
  EDIT_ROLES_PERMISSIONS: "roles_permissions.edit" as const,

};

// --- Settings ---
export const SettingsPermission = {
  VIEW: "settings.view" as const,
  PROFILE: "settings.profile.view" as const,
  ACCOUNT: "settings.account.view" as const,
};

// --- Reports ---
export const ReportPermission = {
  VIEW: "reports.view" as const,
  SALES: "reports.sales.view" as const,
  INVENTORY: "reports.inventory.view" as const,
  CUSTOMERS: "reports.customers.view" as const,
  STAFFS: "reports.staffs.view" as const,
};

// --- Raw Materials ---
export const RawMaterialPermission = {
  VIEW: "raw_materials.view" as const,
  LIST: "raw_materials.list" as const,
  CREATE: "raw_materials.create" as const,
  EDIT: "raw_materials.edit" as const,
  DELETE: "raw_materials.delete" as const,
};

// --- Production ---
export const ProductionPermission = {
  VIEW: "production.view" as const,
  LIST: "production.list" as const,
  CREATE: "production.create" as const,
  EDIT: "production.edit" as const,
  DETAILS: "production.details" as const,
};




// --- Route Operations ---
export const RouteOperationPermission = {
  VIEW: "route_operations.view" as const,
  ROUTE_WISE_ORDER: "route_operations.route_wise_order.view" as const,
  ORDER_MANAGE: "route_operations.order_manage.view" as const,
  STAFF_WISE_ROUTE: "route_operations.staff_wise_route.view" as const,
};

// --- Help ---
export const HelpPermission = {
  VIEW: "help.view" as const,

};

//   for sidebar
export const PERMISSION_GROUPS = {

  Dashboard: DashboardPermission,
  Products: ProductPermission,
  Customers: CustomerPermission,
  Suppliers: SupplierPermission,
  Staffs: StaffPermission,
  Sales: SalesPermission,
  Accounting: AccountingPermission,
  Users: UserPermission,
  Roles: RolePermission,
  Settings: SettingsPermission,
  Reports: ReportPermission,
  RawMaterials: RawMaterialPermission,
  Production: ProductionPermission,
  RouteOperations: RouteOperationPermission,
  Help: HelpPermission,
} as const;



// --- Helper type ---
export type PermissionType =
  | typeof DashboardPermission[keyof typeof DashboardPermission]
  | typeof ProductPermission[keyof typeof ProductPermission]
  | typeof CustomerPermission[keyof typeof CustomerPermission]
  | typeof SupplierPermission[keyof typeof SupplierPermission]
  | typeof StaffPermission[keyof typeof StaffPermission]
  | typeof SalesPermission[keyof typeof SalesPermission]
  | typeof AccountingPermission[keyof typeof AccountingPermission]
  | typeof UserPermission[keyof typeof UserPermission]
  | typeof RolePermission[keyof typeof RolePermission]
  | typeof SettingsPermission[keyof typeof SettingsPermission]
  | typeof SettingsPermission[keyof typeof SettingsPermission]
  | typeof ReportPermission[keyof typeof ReportPermission]
  | typeof RawMaterialPermission[keyof typeof RawMaterialPermission]
  | typeof ProductionPermission[keyof typeof ProductionPermission]
  | typeof RouteOperationPermission[keyof typeof RouteOperationPermission]
  | typeof HelpPermission[keyof typeof HelpPermission];
