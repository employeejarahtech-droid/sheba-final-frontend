import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pharmacyService, type MedicineListParams, type PurchaseOrderListParams, type SaleListParams, type SimpleListParams, type StockInListParams } from './pharmacyService'
import type { PharmacySale } from '@/types/pharmacy.types'

export const PHARMACY_KEYS = {
  all: ['pharmacy'] as const,
  dashboard: () => [...PHARMACY_KEYS.all, 'dashboard'] as const,
  taxMode: () => [...PHARMACY_KEYS.all, 'tax-mode'] as const,
  categories: () => [...PHARMACY_KEYS.all, 'categories'] as const,
  suppliers: () => [...PHARMACY_KEYS.all, 'suppliers'] as const,
  supplierDues: () => [...PHARMACY_KEYS.all, 'supplier-dues'] as const,
  supplierLedger: (id: number | string) => [...PHARMACY_KEYS.all, 'supplier-ledger', String(id)] as const,
  customers: (p?: SimpleListParams) => [...PHARMACY_KEYS.all, 'customers', p] as const,
  admittedPatients: (search?: string) => [...PHARMACY_KEYS.all, 'admitted-patients', search] as const,
  customerDues: () => [...PHARMACY_KEYS.all, 'customer-dues'] as const,
  customerLedger: (id: number | string) => [...PHARMACY_KEYS.all, 'customer-ledger', String(id)] as const,
  medicines: (p?: MedicineListParams) => [...PHARMACY_KEYS.all, 'medicines', p] as const,
  medicineBatches: (id: number | string) => [...PHARMACY_KEYS.all, 'medicine-batches', String(id)] as const,
  lowStock: () => [...PHARMACY_KEYS.all, 'low-stock'] as const,
  stockIns: (p?: StockInListParams) => [...PHARMACY_KEYS.all, 'stock-ins', p] as const,
  stockInBatches: (id: number | string) => [...PHARMACY_KEYS.all, 'stock-in-batches', String(id)] as const,
  sales: (p?: SaleListParams) => [...PHARMACY_KEYS.all, 'sales', p] as const,
  sale: (id: number | string) => [...PHARMACY_KEYS.all, 'sale', String(id)] as const,
  expiryReport: (d?: number) => [...PHARMACY_KEYS.all, 'expiry-report', d] as const,
  stockReport: (categoryId?: number) => [...PHARMACY_KEYS.all, 'stock-report', categoryId] as const,
  stockLedger: (p?: { medicine_id?: string; from?: string; to?: string }) => [...PHARMACY_KEYS.all, 'stock-ledger', p] as const,
  stockReconciliation: () => [...PHARMACY_KEYS.all, 'stock-reconciliation'] as const,
  stockAdjustments: (p?: SimpleListParams) => [...PHARMACY_KEYS.all, 'stock-adjustments', p] as const,
  saleReturns: (p?: SimpleListParams) => [...PHARMACY_KEYS.all, 'sale-returns', p] as const,
  purchaseReturns: (p?: SimpleListParams) => [...PHARMACY_KEYS.all, 'purchase-returns', p] as const,
  heldBills: () => [...PHARMACY_KEYS.all, 'held-bills'] as const,
  shifts: (p?: { status?: string }) => [...PHARMACY_KEYS.all, 'shifts', p] as const,
  shift: (id: number | string) => [...PHARMACY_KEYS.all, 'shift', String(id)] as const,
  purchaseOrders: (p?: PurchaseOrderListParams) => [...PHARMACY_KEYS.all, 'purchase-orders', p] as const,
  purchaseOrder: (id: number | string) => [...PHARMACY_KEYS.all, 'purchase-order', String(id)] as const,
  reorderSuggestions: () => [...PHARMACY_KEYS.all, 'reorder-suggestions'] as const,
}

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => qc.invalidateQueries({ queryKey: PHARMACY_KEYS.all })

/* ── Dashboard ── */
export const usePharmacyDashboardQuery = (params?: { from?: string; to?: string }) => useQuery({
  queryKey: [...PHARMACY_KEYS.dashboard(), params?.from, params?.to],
  queryFn: () => pharmacyService.getDashboard(params),
  enabled: !!(params?.from && params?.to),
})
export const usePharmacyTaxModeQuery = () => useQuery({ queryKey: PHARMACY_KEYS.taxMode(), queryFn: pharmacyService.getTaxMode, staleTime: 5 * 60_000 })

/* ── Categories ── */
export const usePharmacyCategoriesQuery = () => useQuery({ queryKey: PHARMACY_KEYS.categories(), queryFn: pharmacyService.listCategories })
export const useCreatePharmacyCategoryMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.createCategory, onSuccess: () => invalidateAll(qc) })
}
export const useUpdatePharmacyCategoryMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, body }: { id: number | string; body: any }) => pharmacyService.updateCategory(id, body), onSuccess: () => invalidateAll(qc) })
}
export const useDeletePharmacyCategoryMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.removeCategory, onSuccess: () => invalidateAll(qc) })
}

/* ── Suppliers ── */
export const usePharmacySuppliersQuery = () => useQuery({ queryKey: PHARMACY_KEYS.suppliers(), queryFn: pharmacyService.listSuppliers })
export const useSupplierDuesQuery = () => useQuery({ queryKey: PHARMACY_KEYS.supplierDues(), queryFn: pharmacyService.supplierDues })
export const useSupplierLedgerQuery = (id: number | string) =>
  useQuery({ queryKey: PHARMACY_KEYS.supplierLedger(id), queryFn: () => pharmacyService.getSupplierLedger(id), enabled: Boolean(id) })
export const useCreateSupplierPaymentMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number | string; body: any }) => pharmacyService.createSupplierPayment(id, body),
    onSuccess: () => invalidateAll(qc),
  })
}
export const useCreatePharmacySupplierMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.createSupplier, onSuccess: () => invalidateAll(qc) })
}
export const useUpdatePharmacySupplierMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, body }: { id: number | string; body: any }) => pharmacyService.updateSupplier(id, body), onSuccess: () => invalidateAll(qc) })
}
export const useDeletePharmacySupplierMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.removeSupplier, onSuccess: () => invalidateAll(qc) })
}

/* ── Medicines ── */
export const useMedicinesQuery = (params?: MedicineListParams) => useQuery({ queryKey: PHARMACY_KEYS.medicines(params), queryFn: () => pharmacyService.listMedicines(params) })
export const useLowStockMedicinesQuery = () => useQuery({ queryKey: PHARMACY_KEYS.lowStock(), queryFn: pharmacyService.getLowStockMedicines })
export const useMedicineBatchesQuery = (id: number | string) => useQuery({ queryKey: PHARMACY_KEYS.medicineBatches(id), queryFn: () => pharmacyService.getMedicineBatches(id), enabled: Boolean(id) })
export const useCreateMedicineMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.createMedicine, onSuccess: () => invalidateAll(qc) })
}
export const useUpdateMedicineMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, body }: { id: number | string; body: any }) => pharmacyService.updateMedicine(id, body), onSuccess: () => invalidateAll(qc) })
}
export const useDeleteMedicineMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.removeMedicine, onSuccess: () => invalidateAll(qc) })
}

/* ── Customers (credit accounts + dues) ── */
export const usePharmacyCustomersQuery = (params?: SimpleListParams) =>
  useQuery({ queryKey: PHARMACY_KEYS.customers(params), queryFn: () => pharmacyService.listCustomers(params) })
export const useCustomerDuesQuery = () => useQuery({ queryKey: PHARMACY_KEYS.customerDues(), queryFn: pharmacyService.customerDues })
export const useCustomerLedgerQuery = (id: number | string) =>
  useQuery({ queryKey: PHARMACY_KEYS.customerLedger(id), queryFn: () => pharmacyService.getCustomerLedger(id), enabled: Boolean(id) })
export const useCreatePharmacyCustomerMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.createCustomer, onSuccess: () => invalidateAll(qc) })
}
export const useUpdatePharmacyCustomerMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, body }: { id: number | string; body: any }) => pharmacyService.updateCustomer(id, body), onSuccess: () => invalidateAll(qc) })
}
export const useDeletePharmacyCustomerMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.removeCustomer, onSuccess: () => invalidateAll(qc) })
}
export const useAdmittedPatientsQuery = (search?: string) =>
  useQuery({ queryKey: PHARMACY_KEYS.admittedPatients(search), queryFn: () => pharmacyService.searchAdmittedPatients(search) })
export const useResolveCustomerFromAdmissionMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.resolveCustomerFromAdmission, onSuccess: () => invalidateAll(qc) })
}
export const useCreateCustomerPaymentMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number | string; body: any }) => pharmacyService.createCustomerPayment(id, body),
    onSuccess: () => invalidateAll(qc),
  })
}

/* ── Batch engine reports ── */
export const useStockReportQuery = (categoryId?: number) => useQuery({ queryKey: PHARMACY_KEYS.stockReport(categoryId), queryFn: () => pharmacyService.getStockReport(categoryId) })
export const useStockLedgerQuery = (params?: { medicine_id?: string; from?: string; to?: string }) =>
  useQuery({ queryKey: PHARMACY_KEYS.stockLedger(params), queryFn: () => pharmacyService.getStockLedger(params), enabled: Boolean(params?.medicine_id) })
export const useStockReconciliationQuery = () => useQuery({ queryKey: PHARMACY_KEYS.stockReconciliation(), queryFn: pharmacyService.getStockReconciliation })

/* ── Stock-In ── */
export const useStockInsQuery = (params?: StockInListParams) => useQuery({ queryKey: PHARMACY_KEYS.stockIns(params), queryFn: () => pharmacyService.listStockIns(params) })
export const useStockInBatchesQuery = (id?: number | string) => useQuery({
  queryKey: PHARMACY_KEYS.stockInBatches(id ?? ''),
  queryFn: () => pharmacyService.getStockIn(id as number | string),
  enabled: id != null && id !== '',
})
export const useCreateStockInMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.createStockIn, onSuccess: () => invalidateAll(qc) })
}

/* ── Sales ── */
export const useSalesQuery = (params?: SaleListParams) => useQuery({ queryKey: PHARMACY_KEYS.sales(params), queryFn: () => pharmacyService.listSales(params) })
export const useCreateSaleMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.createSale, onSuccess: () => invalidateAll(qc) })
}
export const useUpdateSaleMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, body }: { id: number | string; body: Partial<PharmacySale> }) => pharmacyService.updateSale(id, body), onSuccess: () => invalidateAll(qc) })
}
export const useCancelSaleMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.cancelSale, onSuccess: () => invalidateAll(qc) })
}

/* ── Expiry Report ── */
export const useExpiryReportQuery = (withinDays?: number) => useQuery({ queryKey: PHARMACY_KEYS.expiryReport(withinDays), queryFn: () => pharmacyService.getExpiryReport(withinDays) })

/* ── Stock Adjustments ── */
export const useStockAdjustmentsQuery = (params?: SimpleListParams) => useQuery({ queryKey: PHARMACY_KEYS.stockAdjustments(params), queryFn: () => pharmacyService.listStockAdjustments(params) })
export const useCreateStockAdjustmentMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.createStockAdjustment, onSuccess: () => invalidateAll(qc) })
}

/* ── Sales Returns ── */
export const useSaleReturnsQuery = (params?: SimpleListParams) => useQuery({ queryKey: PHARMACY_KEYS.saleReturns(params), queryFn: () => pharmacyService.listSaleReturns(params) })
export const useCreateSaleReturnMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.createSaleReturn, onSuccess: () => invalidateAll(qc) })
}
export const useCreateStandaloneSaleReturnMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.createStandaloneSaleReturn, onSuccess: () => invalidateAll(qc) })
}

/* ── Purchase Returns ── */
export const usePurchaseReturnsQuery = (params?: SimpleListParams) => useQuery({ queryKey: PHARMACY_KEYS.purchaseReturns(params), queryFn: () => pharmacyService.listPurchaseReturns(params) })
export const useCreatePurchaseReturnMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.createPurchaseReturn, onSuccess: () => invalidateAll(qc) })
}

/* ── Held bills (POS) ── */
export const useHeldBillsQuery = () => useQuery({ queryKey: PHARMACY_KEYS.heldBills(), queryFn: pharmacyService.listHeldBills })
export const useCreateHeldBillMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.createHeldBill, onSuccess: () => invalidateAll(qc) })
}
export const useDeleteHeldBillMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.deleteHeldBill, onSuccess: () => invalidateAll(qc) })
}

/* ── Shifts (POS cash reconciliation) ── */
export const useShiftsQuery = (params?: { status?: string }) => useQuery({ queryKey: PHARMACY_KEYS.shifts(params), queryFn: () => pharmacyService.listShifts(params) })
export const useShiftQuery = (id: number | string) => useQuery({ queryKey: PHARMACY_KEYS.shift(id), queryFn: () => pharmacyService.getShift(id), enabled: Boolean(id) })
export const useOpenShiftMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.openShift, onSuccess: () => invalidateAll(qc) })
}
export const useCloseShiftMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, body }: { id: number | string; body: any }) => pharmacyService.closeShift(id, body), onSuccess: () => invalidateAll(qc) })
}

/* ── Purchase orders ── */
export const usePurchaseOrdersQuery = (params?: PurchaseOrderListParams) =>
  useQuery({ queryKey: PHARMACY_KEYS.purchaseOrders(params), queryFn: () => pharmacyService.listPurchaseOrders(params) })
export const usePurchaseOrderQuery = (id: number | string) =>
  useQuery({ queryKey: PHARMACY_KEYS.purchaseOrder(id), queryFn: () => pharmacyService.getPurchaseOrder(id), enabled: Boolean(id) })
export const useCreatePurchaseOrderMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.createPurchaseOrder, onSuccess: () => invalidateAll(qc) })
}
export const useCancelPurchaseOrderMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: pharmacyService.cancelPurchaseOrder, onSuccess: () => invalidateAll(qc) })
}
export const useReceivePurchaseOrderMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number | string; body: any }) => pharmacyService.receivePurchaseOrder(id, body),
    onSuccess: () => invalidateAll(qc),
  })
}

/* ── Auto-reorder ── */
export const useReorderSuggestionsQuery = () => useQuery({ queryKey: PHARMACY_KEYS.reorderSuggestions(), queryFn: pharmacyService.reorderSuggestions })
