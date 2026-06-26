import api from '@/lib/axios'
import type {
  ApiResponse, GoodsReceiptNote, ListResult, PurchaseDashboard, PurchaseRequest,
  PurchaseStatistics, PurchaseSupplier, SupplierPerformanceRow,
} from '@/types/purchase.types'

export interface RequestListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  priority?: string
}
export interface GrnListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export const purchaseService = {
  // Dashboard / analytics
  getDashboard: async () => (await api.get<ApiResponse<PurchaseDashboard>>('/purchase/stats')).data.data,
  getStatistics: async () => (await api.get<ApiResponse<PurchaseStatistics>>('/purchase/statistics')).data.data,
  getSupplierPerformance: async () => (await api.get<ApiResponse<SupplierPerformanceRow[]>>('/purchase/supplier-performance')).data.data,

  // Suppliers
  listSuppliers: async () => (await api.get<ApiResponse<PurchaseSupplier[]>>('/purchase/suppliers')).data.data,
  getSupplier: async (id: number | string) => (await api.get<ApiResponse<PurchaseSupplier>>(`/purchase/suppliers/${id}`)).data.data,
  createSupplier: async (body: Partial<PurchaseSupplier>) => (await api.post<ApiResponse<PurchaseSupplier>>('/purchase/suppliers', body)).data,
  updateSupplier: async (id: number | string, body: Partial<PurchaseSupplier>) => (await api.put<ApiResponse<PurchaseSupplier>>(`/purchase/suppliers/${id}`, body)).data,
  removeSupplier: async (id: number | string) => (await api.delete<ApiResponse<null>>(`/purchase/suppliers/${id}`)).data,

  // Requests
  listRequests: async (params?: RequestListParams) => (await api.get<ApiResponse<ListResult<PurchaseRequest>>>('/purchase/requests', { params })).data.data,
  getRequest: async (id: number | string) => (await api.get<ApiResponse<PurchaseRequest>>(`/purchase/requests/${id}`)).data.data,
  createRequest: async (body: Partial<PurchaseRequest>) => (await api.post<ApiResponse<PurchaseRequest>>('/purchase/requests', body)).data,
  updateRequest: async (id: number | string, body: Partial<PurchaseRequest>) => (await api.put<ApiResponse<PurchaseRequest>>(`/purchase/requests/${id}`, body)).data,
  removeRequest: async (id: number | string) => (await api.delete<ApiResponse<null>>(`/purchase/requests/${id}`)).data,

  // Goods Receipt Notes
  listReceipts: async (params?: GrnListParams) => (await api.get<ApiResponse<ListResult<GoodsReceiptNote>>>('/purchase/goods-receipt', { params })).data.data,
  getReceipt: async (id: number | string) => (await api.get<ApiResponse<GoodsReceiptNote>>(`/purchase/goods-receipt/${id}`)).data.data,
  createReceipt: async (body: Partial<GoodsReceiptNote>) => (await api.post<ApiResponse<GoodsReceiptNote>>('/purchase/goods-receipt', body)).data,
  updateReceipt: async (id: number | string, body: Partial<GoodsReceiptNote>) => (await api.put<ApiResponse<GoodsReceiptNote>>(`/purchase/goods-receipt/${id}`, body)).data,
  removeReceipt: async (id: number | string) => (await api.delete<ApiResponse<null>>(`/purchase/goods-receipt/${id}`)).data,
}
