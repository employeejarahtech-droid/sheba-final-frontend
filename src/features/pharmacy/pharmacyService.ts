import api from '@/lib/axios'
import type {
  AdmittedPatient, ApiResponse, CustomerDueRow, CustomerLedger, CustomerPayment, ExpiringBatch, HeldBill,
  ListResult, Medicine, PharmacyBatch, PharmacyCategory, PharmacyCustomer, PharmacyDashboard,
  PharmacyPurchaseReturn, PharmacySale, PharmacySaleReturn, PharmacyShift,
  PharmacyStockAdjustment, PharmacyStockIn, PharmacySupplier, PurchaseOrder,
  ReorderSuggestion, StockLedger, StockReconciliationRow, StockReport,
  SupplierDueRow, SupplierLedger, SupplierPayment,
} from '@/types/pharmacy.types'

export interface MedicineListParams {
  page?: number
  limit?: number
  search?: string
  category_id?: number
  status?: string
}
export interface StockInListParams {
  page?: number
  limit?: number
  search?: string
  start_date?: string
  end_date?: string
}
export interface SaleListParams extends StockInListParams {
  status?: string
}
export interface SimpleListParams {
  page?: number
  limit?: number
  search?: string
}
export interface PurchaseOrderListParams {
  status?: string
  search?: string
}

export const pharmacyService = {
  // Dashboard
  getDashboard: async (params?: { from?: string; to?: string }) => (await api.get<ApiResponse<PharmacyDashboard>>('/pharmacy/stats', { params })).data.data,
  getTaxMode: async () => (await api.get<ApiResponse<{ tax_mode: 'exclusive' | 'inclusive' }>>('/pharmacy/tax-mode')).data.data,

  // Categories
  listCategories: async () => (await api.get<ApiResponse<PharmacyCategory[]>>('/pharmacy/categories')).data.data,
  getCategory: async (id: number | string) => (await api.get<ApiResponse<PharmacyCategory>>(`/pharmacy/categories/${id}`)).data.data,
  createCategory: async (body: Partial<PharmacyCategory>) => (await api.post<ApiResponse<PharmacyCategory>>('/pharmacy/categories', body)).data,
  updateCategory: async (id: number | string, body: Partial<PharmacyCategory>) => (await api.put<ApiResponse<PharmacyCategory>>(`/pharmacy/categories/${id}`, body)).data,
  removeCategory: async (id: number | string) => (await api.delete<ApiResponse<null>>(`/pharmacy/categories/${id}`)).data,

  // Suppliers
  listSuppliers: async () => (await api.get<ApiResponse<PharmacySupplier[]>>('/pharmacy/suppliers')).data.data,
  getSupplier: async (id: number | string) => (await api.get<ApiResponse<PharmacySupplier>>(`/pharmacy/suppliers/${id}`)).data.data,
  createSupplier: async (body: Partial<PharmacySupplier>) => (await api.post<ApiResponse<PharmacySupplier>>('/pharmacy/suppliers', body)).data,
  updateSupplier: async (id: number | string, body: Partial<PharmacySupplier>) => (await api.put<ApiResponse<PharmacySupplier>>(`/pharmacy/suppliers/${id}`, body)).data,
  removeSupplier: async (id: number | string) => (await api.delete<ApiResponse<null>>(`/pharmacy/suppliers/${id}`)).data,
  supplierDues: async () => (await api.get<ApiResponse<SupplierDueRow[]>>('/pharmacy/suppliers/dues')).data.data,
  getSupplierLedger: async (id: number | string) => (await api.get<ApiResponse<SupplierLedger>>(`/pharmacy/suppliers/${id}/ledger`)).data.data,
  listSupplierPayments: async (id: number | string) => (await api.get<ApiResponse<SupplierPayment[]>>(`/pharmacy/suppliers/${id}/payments`)).data.data,
  createSupplierPayment: async (supplier_id: number | string, body: Partial<SupplierPayment>) =>
    (await api.post<ApiResponse<SupplierPayment>>(`/pharmacy/suppliers/${supplier_id}/payments`, body)).data,

  // Medicines
  listMedicines: async (params?: MedicineListParams) => (await api.get<ApiResponse<ListResult<Medicine>>>('/pharmacy/medicines', { params })).data.data,
  getLowStockMedicines: async () => (await api.get<ApiResponse<Medicine[]>>('/pharmacy/medicines/low-stock')).data.data,
  getMedicine: async (id: number | string) => (await api.get<ApiResponse<Medicine>>(`/pharmacy/medicines/${id}`)).data.data,
  getMedicineByBarcode: async (code: string) => (await api.get<ApiResponse<Medicine>>(`/pharmacy/medicines/barcode/${encodeURIComponent(code)}`)).data.data,
  getMedicineBatches: async (id: number | string) => (await api.get<ApiResponse<PharmacyBatch[]>>(`/pharmacy/medicines/${id}/batches`)).data.data,
  createMedicine: async (body: Partial<Medicine>) => (await api.post<ApiResponse<Medicine>>('/pharmacy/medicines', body)).data,
  updateMedicine: async (id: number | string, body: Partial<Medicine>) => (await api.put<ApiResponse<Medicine>>(`/pharmacy/medicines/${id}`, body)).data,
  removeMedicine: async (id: number | string) => (await api.delete<ApiResponse<null>>(`/pharmacy/medicines/${id}`)).data,

  // Customers (credit accounts + dues)
  listCustomers: async (params?: SimpleListParams) => (await api.get<ApiResponse<PharmacyCustomer[]>>('/pharmacy/customers', { params })).data.data,
  customerDues: async () => (await api.get<ApiResponse<CustomerDueRow[]>>('/pharmacy/customers/dues')).data.data,
  getCustomer: async (id: number | string) => (await api.get<ApiResponse<PharmacyCustomer>>(`/pharmacy/customers/${id}`)).data.data,
  createCustomer: async (body: Partial<PharmacyCustomer>) => (await api.post<ApiResponse<PharmacyCustomer>>('/pharmacy/customers', body)).data,
  updateCustomer: async (id: number | string, body: Partial<PharmacyCustomer>) => (await api.put<ApiResponse<PharmacyCustomer>>(`/pharmacy/customers/${id}`, body)).data,
  removeCustomer: async (id: number | string) => (await api.delete<ApiResponse<null>>(`/pharmacy/customers/${id}`)).data,
  getCustomerLedger: async (id: number | string) => (await api.get<ApiResponse<CustomerLedger>>(`/pharmacy/customers/${id}/ledger`)).data.data,
  listCustomerPayments: async (id: number | string) => (await api.get<ApiResponse<CustomerPayment[]>>(`/pharmacy/customers/${id}/payments`)).data.data,
  createCustomerPayment: async (customer_id: number | string, body: Partial<CustomerPayment>) =>
    (await api.post<ApiResponse<CustomerPayment>>(`/pharmacy/customers/${customer_id}/payments`, body)).data,
  searchAdmittedPatients: async (search?: string) =>
    (await api.get<ApiResponse<AdmittedPatient[]>>('/pharmacy/customers/admitted-patients', { params: { search } })).data.data,
  resolveCustomerFromAdmission: async (admission_id: number) =>
    (await api.post<ApiResponse<PharmacyCustomer>>('/pharmacy/customers/from-admission', { admission_id })).data.data,

  // Batch engine reports
  getStockReport: async (category_id?: number) => (await api.get<ApiResponse<StockReport>>('/pharmacy/stock-report', { params: { category_id } })).data.data,
  getStockLedger: async (params?: { medicine_id?: number | string; from?: string; to?: string }) => (await api.get<ApiResponse<StockLedger>>('/pharmacy/stock-ledger', { params })).data.data,
  getStockReconciliation: async () => (await api.get<ApiResponse<StockReconciliationRow[]>>('/pharmacy/stock-reconciliation')).data.data,

  // Stock-In
  listStockIns: async (params?: StockInListParams) => (await api.get<ApiResponse<ListResult<PharmacyStockIn>>>('/pharmacy/stock-in', { params })).data.data,
  getStockIn: async (id: number | string) => (await api.get<ApiResponse<PharmacyStockIn>>(`/pharmacy/stock-in/${id}`)).data.data,
  createStockIn: async (body: Partial<PharmacyStockIn>) => (await api.post<ApiResponse<PharmacyStockIn>>('/pharmacy/stock-in', body)).data,

  // Sales
  listSales: async (params?: SaleListParams) => (await api.get<ApiResponse<ListResult<PharmacySale>>>('/pharmacy/sales', { params })).data.data,
  getSale: async (id: number | string) => (await api.get<ApiResponse<PharmacySale>>(`/pharmacy/sales/${id}`)).data.data,
  createSale: async (body: Partial<PharmacySale>) => (await api.post<ApiResponse<PharmacySale>>('/pharmacy/sales', body)).data,
  updateSale: async (id: number | string, body: Partial<PharmacySale>) => (await api.put<ApiResponse<PharmacySale>>(`/pharmacy/sales/${id}`, body)).data,
  cancelSale: async (id: number | string) => (await api.put<ApiResponse<PharmacySale>>(`/pharmacy/sales/${id}/cancel`, {})).data,

  // Expiry Report
  getExpiryReport: async (within_days?: number) => (await api.get<ApiResponse<ExpiringBatch[]>>('/pharmacy/expiry-report', { params: { within_days } })).data.data,

  // Stock Adjustments
  listStockAdjustments: async (params?: SimpleListParams) => (await api.get<ApiResponse<ListResult<PharmacyStockAdjustment>>>('/pharmacy/stock-adjustments', { params })).data.data,
  createStockAdjustment: async (body: Partial<PharmacyStockAdjustment>) => (await api.post<ApiResponse<PharmacyStockAdjustment>>('/pharmacy/stock-adjustments', body)).data,

  // Sales Returns
  listSaleReturns: async (params?: SimpleListParams) => (await api.get<ApiResponse<ListResult<PharmacySaleReturn>>>('/pharmacy/sale-returns', { params })).data.data,
  getSaleReturn: async (id: number | string) => (await api.get<ApiResponse<PharmacySaleReturn>>(`/pharmacy/sale-returns/${id}`)).data.data,
  createSaleReturn: async (body: Partial<PharmacySaleReturn> & { items: any[] }) => (await api.post<ApiResponse<PharmacySaleReturn>>('/pharmacy/sale-returns', body)).data,
  createStandaloneSaleReturn: async (body: Partial<PharmacySaleReturn> & { items: any[] }) => (await api.post<ApiResponse<PharmacySaleReturn>>('/pharmacy/sale-returns/standalone', body)).data,

  // Purchase Returns
  listPurchaseReturns: async (params?: SimpleListParams) => (await api.get<ApiResponse<ListResult<PharmacyPurchaseReturn>>>('/pharmacy/purchase-returns', { params })).data.data,
  getPurchaseReturn: async (id: number | string) => (await api.get<ApiResponse<PharmacyPurchaseReturn>>(`/pharmacy/purchase-returns/${id}`)).data.data,
  createPurchaseReturn: async (body: Partial<PharmacyPurchaseReturn> & { items: any[] }) => (await api.post<ApiResponse<PharmacyPurchaseReturn>>('/pharmacy/purchase-returns', body)).data,

  // Held bills (POS)
  listHeldBills: async () => (await api.get<ApiResponse<HeldBill[]>>('/pharmacy/held-bills')).data.data,
  createHeldBill: async (body: { label?: string; note?: string; items: { medicine_id: number; quantity: number; unit_price?: number }[] }) =>
    (await api.post<ApiResponse<HeldBill>>('/pharmacy/held-bills', body)).data,
  deleteHeldBill: async (id: number | string) => (await api.delete<ApiResponse<null>>(`/pharmacy/held-bills/${id}`)).data,

  // Shifts (POS cash reconciliation)
  listShifts: async (params?: { status?: string }) => (await api.get<ApiResponse<PharmacyShift[]>>('/pharmacy/shifts', { params })).data.data,
  getShift: async (id: number | string) => (await api.get<ApiResponse<PharmacyShift>>(`/pharmacy/shifts/${id}`)).data.data,
  openShift: async (body: { opening_cash: number; notes?: string }) => (await api.post<ApiResponse<PharmacyShift>>('/pharmacy/shifts', body)).data,
  closeShift: async (id: number | string, body: { closing_cash: number; notes?: string }) =>
    (await api.put<ApiResponse<PharmacyShift>>(`/pharmacy/shifts/${id}/close`, body)).data,

  // Purchase orders
  listPurchaseOrders: async (params?: PurchaseOrderListParams) => (await api.get<ApiResponse<ListResult<PurchaseOrder>>>('/pharmacy/purchase-orders', { params })).data.data,
  getPurchaseOrder: async (id: number | string) => (await api.get<ApiResponse<PurchaseOrder>>(`/pharmacy/purchase-orders/${id}`)).data.data,
  createPurchaseOrder: async (body: Partial<PurchaseOrder> & { items: any[] }) => (await api.post<ApiResponse<PurchaseOrder>>('/pharmacy/purchase-orders', body)).data,
  cancelPurchaseOrder: async (id: number | string) => (await api.put<ApiResponse<PurchaseOrder>>(`/pharmacy/purchase-orders/${id}/cancel`, {})).data,
  receivePurchaseOrder: async (id: number | string, body: { stock_in_date?: string; invoice_no?: string; paid_amount?: number | null; notes?: string; items: any[] }) =>
    (await api.post<ApiResponse<PurchaseOrder>>(`/pharmacy/purchase-orders/${id}/receive`, body)).data,

  // Auto-reorder
  reorderSuggestions: async () => (await api.get<ApiResponse<ReorderSuggestion[]>>('/pharmacy/reorder-suggestions')).data.data,
}
