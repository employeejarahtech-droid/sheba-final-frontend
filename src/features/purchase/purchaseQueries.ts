import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { purchaseService, type GrnListParams, type RequestListParams } from './purchaseService'

export const PURCHASE_KEYS = {
  all: ['purchase'] as const,
  dashboard: () => [...PURCHASE_KEYS.all, 'dashboard'] as const,
  statistics: () => [...PURCHASE_KEYS.all, 'statistics'] as const,
  performance: () => [...PURCHASE_KEYS.all, 'performance'] as const,
  suppliers: () => [...PURCHASE_KEYS.all, 'suppliers'] as const,
  requests: (p?: RequestListParams) => [...PURCHASE_KEYS.all, 'requests', p] as const,
  receipts: (p?: GrnListParams) => [...PURCHASE_KEYS.all, 'receipts', p] as const,
}

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => qc.invalidateQueries({ queryKey: PURCHASE_KEYS.all })

/* ── Dashboard / analytics ── */
export const usePurchaseDashboardQuery = () => useQuery({ queryKey: PURCHASE_KEYS.dashboard(), queryFn: purchaseService.getDashboard })
export const usePurchaseStatisticsQuery = () => useQuery({ queryKey: PURCHASE_KEYS.statistics(), queryFn: purchaseService.getStatistics })
export const useSupplierPerformanceQuery = () => useQuery({ queryKey: PURCHASE_KEYS.performance(), queryFn: purchaseService.getSupplierPerformance })

/* ── Suppliers ── */
export const useSuppliersQuery = () => useQuery({ queryKey: PURCHASE_KEYS.suppliers(), queryFn: purchaseService.listSuppliers })
export const useCreateSupplierMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: purchaseService.createSupplier, onSuccess: () => invalidateAll(qc) })
}
export const useUpdateSupplierMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, body }: { id: number | string; body: any }) => purchaseService.updateSupplier(id, body), onSuccess: () => invalidateAll(qc) })
}
export const useDeleteSupplierMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: purchaseService.removeSupplier, onSuccess: () => invalidateAll(qc) })
}

/* ── Requests ── */
export const useRequestsQuery = (params?: RequestListParams) => useQuery({ queryKey: PURCHASE_KEYS.requests(params), queryFn: () => purchaseService.listRequests(params) })
export const useCreateRequestMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: purchaseService.createRequest, onSuccess: () => invalidateAll(qc) })
}
export const useUpdateRequestMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, body }: { id: number | string; body: any }) => purchaseService.updateRequest(id, body), onSuccess: () => invalidateAll(qc) })
}
export const useDeleteRequestMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: purchaseService.removeRequest, onSuccess: () => invalidateAll(qc) })
}

/* ── Goods Receipt Notes ── */
export const useReceiptsQuery = (params?: GrnListParams) => useQuery({ queryKey: PURCHASE_KEYS.receipts(params), queryFn: () => purchaseService.listReceipts(params) })
export const useCreateReceiptMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: purchaseService.createReceipt, onSuccess: () => invalidateAll(qc) })
}
export const useUpdateReceiptMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, body }: { id: number | string; body: any }) => purchaseService.updateReceipt(id, body), onSuccess: () => invalidateAll(qc) })
}
export const useDeleteReceiptMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: purchaseService.removeReceipt, onSuccess: () => invalidateAll(qc) })
}
