export interface ApiResponse<T> {
  status: boolean
  message: string
  data: T
}

export interface ListResult<T> {
  rows: T[]
  total: number
  page?: number
  limit?: number
}

export interface PharmacyCategory {
  id: number
  name: string
  description?: string | null
  status: 'active' | 'inactive'
  created_at?: string
}

export interface PharmacySupplier {
  id: number
  name: string
  contact_person?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  status: 'active' | 'inactive'
  created_at?: string
}

export interface Medicine {
  id: number
  name: string
  generic_name?: string | null
  category_id?: number | null
  manufacturer?: string | null
  unit?: string | null
  unit_price: number
  stock_quantity: number
  reorder_level: number
  tax_rate?: number
  barcode?: string | null
  status: 'active' | 'inactive'
  category?: { id: number; name: string } | null
  created_at?: string
}

export interface PharmacyStockInItem {
  id?: number
  medicine_id: number
  batch_no?: string | null
  quantity: number
  purchase_price: number
  expiry_date?: string | null
  medicine?: { id: number; name: string; unit?: string | null } | null
}

export interface PharmacyStockIn {
  id: number
  stock_in_no?: string | null
  supplier_id?: number | null
  invoice_no?: string | null
  stock_in_date?: string | null
  total_amount: number
  paid_amount?: number | null
  purchase_order_id?: number | null
  notes?: string | null
  supplier?: { id: number; name: string } | null
  items?: PharmacyStockInItem[]
  batches?: PharmacyBatch[]
  created_at?: string
}

export interface PharmacySaleItem {
  id?: number
  medicine_id: number
  quantity: number
  unit_price: number
  subtotal?: number
  discount_pct?: number
  discount_amount?: number
  medicine?: { id: number; name: string; unit?: string | null } | null
  allocations?: PharmacySaleAllocation[]
}

export type PharmacySaleStatus = 'completed' | 'cancelled'

export interface PharmacySale {
  id: number
  sale_no?: string | null
  patient_name?: string | null
  phone?: string | null
  sale_date?: string | null
  subtotal: number
  discount: number
  tax_amount?: number
  total_amount: number
  paid_amount?: number | null
  customer_id?: number | null
  shift_id?: number | null
  payment_method?: string | null
  status: PharmacySaleStatus
  customer?: { id: number; name: string; phone?: string | null } | null
  items?: PharmacySaleItem[]
  created_at?: string
}

export interface PharmacyDashboard {
  total_medicines: number
  low_stock_count: number
  active_suppliers: number
  active_categories: number
  range_sales_total: number
  range_sales_count: number
  total_stock_in_value: number
  current_stock_value?: number
  customer_due_total?: number
  supplier_due_total?: number
  expiring_soon_count: number
  recent_sales: PharmacySale[]
  trend: { date: string; count: number; amount: number }[]
}

/* ── Batch engine v2 ── */

export type PharmacyBatchSource = 'stock_in' | 'opening' | 'adjustment' | 'legacy'

export interface PharmacyBatch {
  id: number
  medicine_id: number
  batch_no?: string | null
  expiry_date?: string | null
  purchase_price: number
  quantity_received: number
  quantity_remaining: number
  source: PharmacyBatchSource
  stock_in_item_id?: number | null
  created_at?: string
  medicine?: { id: number; name: string; unit?: string | null } | null
  stockInItem?: { id: number; stock_in_id: number; stockIn?: { id: number; stock_in_no?: string | null; stock_in_date?: string | null } | null } | null
}

export interface PharmacySaleAllocation {
  id: number
  sale_item_id: number
  sale_id: number
  batch_id: number
  quantity: number
  cost_price: number
  quantity_returned: number
  batch?: { id: number; batch_no?: string | null; expiry_date?: string | null } | null
}

export interface ExpiringBatch {
  id: number
  medicine_id: number
  batch_no?: string | null
  expiry_date: string | null
  purchase_price: number
  quantity_received: number
  quantity_remaining: number
  source: PharmacyBatchSource
  is_expired: boolean
  value_at_risk: number
  medicine?: { id: number; name: string; unit?: string | null; stock_quantity: number; status: string } | null
  stockInItem?: { id: number; stock_in_id: number; stockIn?: { id: number; stock_in_no?: string | null; stock_in_date?: string | null } | null } | null
}

export interface StockReportRow {
  id: number
  name: string
  unit?: string | null
  category?: { id: number; name: string } | null
  stock_quantity: number
  batch_qty: number
  stock_value: number
  weighted_avg_cost: number
  unit_price: number
  potential_value: number
  low_stock: boolean
  batch_drift: boolean
}

export interface StockReport {
  rows: StockReportRow[]
  totals: { qty: number; stock_value: number; potential_value: number }
}

export type StockMovementType =
  | 'opening' | 'stock_in' | 'sale' | 'sale_cancel' | 'sale_return'
  | 'purchase_return' | 'adjustment_increase' | 'adjustment_decrease'

export interface StockMovement {
  id: number
  medicine_id: number
  batch_id: number
  movement_type: StockMovementType
  direction: 'in' | 'out'
  quantity: number
  balance_after?: number | null
  medicine_balance_after?: number | null
  ref_table?: string | null
  ref_id?: number | null
  reference_no?: string | null
  unit_cost?: number | null
  created_at?: string
  batch?: { id: number; batch_no?: string | null; expiry_date?: string | null } | null
}

export interface StockLedger {
  medicine?: { id: number; name: string; unit?: string | null; stock_quantity: number } | null
  opening_balance: number | null
  rows: StockMovement[]
}

export interface StockReconciliationRow {
  id: number
  name: string
  unit?: string | null
  stock_quantity: number
  batch_remaining: number
  difference: number
}

export type StockAdjustmentType = 'increase' | 'decrease'
export type StockAdjustmentReason = 'Damage' | 'Expired' | 'Loss/Theft' | 'Recount' | 'Other'

export interface PharmacyStockAdjustment {
  id: number
  medicine_id: number
  adjustment_type: StockAdjustmentType
  quantity: number
  reason: StockAdjustmentReason
  notes?: string | null
  medicine?: { id: number; name: string; unit?: string | null } | null
  created_at?: string
}

export interface PharmacySaleReturnItem {
  id?: number
  sale_item_id: number | null
  medicine_id: number
  quantity: number
  unit_price: number
  subtotal?: number
  medicine?: { id: number; name: string; unit?: string | null } | null
}

export interface PharmacySaleReturn {
  id: number
  sale_id: number | null
  patient_name?: string | null
  phone?: string | null
  return_no?: string | null
  return_date?: string | null
  total_amount: number
  tax_amount?: number
  reason?: string | null
  notes?: string | null
  sale?: { id: number; sale_no?: string | null; patient_name?: string | null } | null
  items?: PharmacySaleReturnItem[]
  created_at?: string
}

export interface PharmacyPurchaseReturnItem {
  id?: number
  medicine_id: number
  batch_id?: number | null
  quantity: number
  unit_price: number
  subtotal?: number
  medicine?: { id: number; name: string; unit?: string | null } | null
  batch?: { id: number; batch_no?: string | null; expiry_date?: string | null; purchase_price: number } | null
}

export interface PharmacyPurchaseReturn {
  id: number
  supplier_id?: number | null
  stock_in_id?: number | null
  return_no?: string | null
  return_date?: string | null
  total_amount: number
  reason?: string | null
  notes?: string | null
  supplier?: { id: number; name: string } | null
  items?: PharmacyPurchaseReturnItem[]
  created_at?: string
}

/* ── Global pharmacy phases 2–5: customers, dues, POS, purchase orders ── */

export interface PharmacyCustomer {
  id: number
  name: string
  phone?: string | null
  address?: string | null
  status: 'active' | 'inactive'
  admission_id?: number | null
  created_at?: string
}

export interface AdmittedPatient {
  id: number
  admission_prefix?: string | null
  patient_name: string
  phone?: string | null
  admission_date?: string | null
  status: 'active' | 'discharged' | 'critical'
}

export interface CustomerDueRow {
  id: number
  name: string
  phone?: string | null
  status: 'active' | 'inactive'
  admission_id?: number | null
  customer_type: 'Walk In' | 'Admitted'
  due: number
  sales_total: number
  sales_count: number
  returns_total: number
  payments_total: number
}

export interface SupplierDueRow {
  id: number
  name: string
  phone?: string | null
  status: 'active' | 'inactive'
  due: number
  purchased: number
  purchases_count: number
  paid_at_purchase: number
  returns_total: number
  payments_total: number
}

export type LedgerEntryType = 'sale' | 'sale_return' | 'payment' | 'stock_in' | 'purchase_return'

export interface LedgerEntry {
  date: string
  type: LedgerEntryType
  ref?: string | null
  debit: number
  credit: number
  payment_method?: string | null
  sale_id?: number
  sale_return_id?: number
  payment_id?: number
  stock_in_id?: number
  purchase_return_id?: number
}

export interface CustomerLedger {
  customer: PharmacyCustomer
  entries: LedgerEntry[]
  balance: number
}

export interface SupplierLedger {
  supplier: PharmacySupplier
  entries: LedgerEntry[]
  balance: number
}

export interface CustomerPayment {
  id: number
  payment_no?: string | null
  customer_id: number
  amount: number
  payment_method?: string | null
  payment_date?: string | null
  notes?: string | null
  created_at?: string
}

export interface SupplierPayment {
  id: number
  payment_no?: string | null
  supplier_id: number
  amount: number
  payment_method?: string | null
  payment_date?: string | null
  notes?: string | null
  created_at?: string
}

/** Held POS bill: `items` is the server-parsed JSON cart snapshot. */
export interface HeldBill {
  id: number
  label?: string | null
  note?: string | null
  items: { medicine_id: number; quantity: number; unit_price?: number }[]
  user?: { id: number; name: string } | null
  created_at?: string
}

export interface ShiftAggregates {
  sales_count: number
  sales_total: number
  cash_sales: number
  refunds_total: number
}

export interface PharmacyShift {
  id: number
  user_id: number
  opened_at: string
  closed_at?: string | null
  opening_cash: number
  closing_cash?: number | null
  expected_cash?: number | null
  variance?: number | null
  sales_total?: number | null
  sales_count?: number | null
  refunds_total?: number | null
  status: 'open' | 'closed'
  notes?: string | null
  user?: { id: number; name: string } | null
  aggregates?: ShiftAggregates
}

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled'

export interface PurchaseOrderItem {
  id: number
  purchase_order_id: number
  medicine_id: number
  quantity: number
  unit_price: number
  received_quantity: number
  medicine?: { id: number; name: string; unit?: string | null; unit_price: number } | null
}

export interface PurchaseOrder {
  id: number
  po_no?: string | null
  supplier_id?: number | null
  order_date?: string | null
  expected_date?: string | null
  status: PurchaseOrderStatus
  total_amount: number
  notes?: string | null
  supplier?: { id: number; name: string } | null
  items?: PurchaseOrderItem[]
  stockIns?: { id: number; stock_in_no?: string | null; stock_in_date?: string | null; total_amount: number; purchase_order_id?: number | null }[]
  created_at?: string
}

export interface ReorderSuggestion {
  id: number
  name: string
  unit?: string | null
  stock_quantity: number
  reorder_level: number
  sold_30d: number
  avg_daily: number
  suggested_qty: number
  supplier_id?: number | null
  supplier_name?: string | null
}
