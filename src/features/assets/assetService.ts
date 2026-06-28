import api from '@/lib/axios'
import type {
  ApiResponse,
  Asset,
  AssetCategory,
  AssetDashboard,
  AssetDepreciationRow,
  AssetListResult,
  AssetLocation,
  AssetMaintenance,
  AssetStatistics,
} from '@/types/asset.types'

export interface AssetListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  category_id?: number
}

export const assetService = {
  // Dashboard / analytics
  getDashboard: async () => (await api.get<ApiResponse<AssetDashboard>>('/assets/stats')).data.data,
  getStatistics: async () => (await api.get<ApiResponse<AssetStatistics>>('/assets/statistics')).data.data,
  getDepreciation: async () => (await api.get<ApiResponse<AssetDepreciationRow[]>>('/assets/depreciation')).data.data,
  getDepreciationRuns: async () => (await api.get<ApiResponse<any[]>>('/assets/depreciation/runs')).data.data,
  postDepreciation: async (period?: string) =>
    (await api.post<ApiResponse<any>>('/assets/depreciation/run', period ? { period } : {})).data,

  // Assets
  list: async (params?: AssetListParams) =>
    (await api.get<ApiResponse<AssetListResult>>('/assets', { params })).data.data,
  get: async (id: number | string) => (await api.get<ApiResponse<Asset>>(`/assets/${id}`)).data.data,
  create: async (body: Partial<Asset>) => (await api.post<ApiResponse<Asset>>('/assets', body)).data,
  update: async (id: number | string, body: Partial<Asset>) =>
    (await api.put<ApiResponse<Asset>>(`/assets/${id}`, body)).data,
  remove: async (id: number | string) => (await api.delete<ApiResponse<null>>(`/assets/${id}`)).data,

  // Categories
  listCategories: async () => (await api.get<ApiResponse<AssetCategory[]>>('/assets/categories')).data.data,
  createCategory: async (body: Partial<AssetCategory>) =>
    (await api.post<ApiResponse<AssetCategory>>('/assets/categories', body)).data,
  updateCategory: async (id: number | string, body: Partial<AssetCategory>) =>
    (await api.put<ApiResponse<AssetCategory>>(`/assets/categories/${id}`, body)).data,
  removeCategory: async (id: number | string) =>
    (await api.delete<ApiResponse<null>>(`/assets/categories/${id}`)).data,

  // Locations
  listLocations: async () => (await api.get<ApiResponse<AssetLocation[]>>('/assets/locations')).data.data,
  createLocation: async (body: Partial<AssetLocation>) =>
    (await api.post<ApiResponse<AssetLocation>>('/assets/locations', body)).data,
  updateLocation: async (id: number | string, body: Partial<AssetLocation>) =>
    (await api.put<ApiResponse<AssetLocation>>(`/assets/locations/${id}`, body)).data,
  removeLocation: async (id: number | string) =>
    (await api.delete<ApiResponse<null>>(`/assets/locations/${id}`)).data,

  // Maintenance
  listMaintenance: async (params?: { status?: string; asset_id?: number }) =>
    (await api.get<ApiResponse<AssetMaintenance[]>>('/assets/maintenance', { params })).data.data,
  createMaintenance: async (body: Partial<AssetMaintenance>) =>
    (await api.post<ApiResponse<AssetMaintenance>>('/assets/maintenance', body)).data,
  updateMaintenance: async (id: number | string, body: Partial<AssetMaintenance>) =>
    (await api.put<ApiResponse<AssetMaintenance>>(`/assets/maintenance/${id}`, body)).data,
  removeMaintenance: async (id: number | string) =>
    (await api.delete<ApiResponse<null>>(`/assets/maintenance/${id}`)).data,
}
