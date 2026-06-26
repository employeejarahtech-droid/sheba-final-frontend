import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assetService, type AssetListParams } from './assetService'

export const ASSET_KEYS = {
  all: ['assets'] as const,
  dashboard: () => [...ASSET_KEYS.all, 'dashboard'] as const,
  statistics: () => [...ASSET_KEYS.all, 'statistics'] as const,
  depreciation: () => [...ASSET_KEYS.all, 'depreciation'] as const,
  list: (params?: AssetListParams) => [...ASSET_KEYS.all, 'list', params] as const,
  categories: () => [...ASSET_KEYS.all, 'categories'] as const,
  locations: () => [...ASSET_KEYS.all, 'locations'] as const,
  maintenance: (params?: any) => [...ASSET_KEYS.all, 'maintenance', params] as const,
}

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: ASSET_KEYS.all })

/* ── Dashboard / analytics ── */
export const useAssetDashboardQuery = () =>
  useQuery({ queryKey: ASSET_KEYS.dashboard(), queryFn: assetService.getDashboard })

export const useAssetStatisticsQuery = () =>
  useQuery({ queryKey: ASSET_KEYS.statistics(), queryFn: assetService.getStatistics })

export const useAssetDepreciationQuery = () =>
  useQuery({ queryKey: ASSET_KEYS.depreciation(), queryFn: assetService.getDepreciation })

/* ── Assets ── */
export const useAssetsQuery = (params?: AssetListParams) =>
  useQuery({ queryKey: ASSET_KEYS.list(params), queryFn: () => assetService.list(params) })

export const useCreateAssetMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: assetService.create, onSuccess: () => invalidateAll(qc) })
}
export const useUpdateAssetMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number | string; body: any }) => assetService.update(id, body),
    onSuccess: () => invalidateAll(qc),
  })
}
export const useDeleteAssetMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: assetService.remove, onSuccess: () => invalidateAll(qc) })
}

/* ── Categories ── */
export const useAssetCategoriesQuery = () =>
  useQuery({ queryKey: ASSET_KEYS.categories(), queryFn: assetService.listCategories })

export const useCreateCategoryMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: assetService.createCategory, onSuccess: () => invalidateAll(qc) })
}
export const useUpdateCategoryMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number | string; body: any }) => assetService.updateCategory(id, body),
    onSuccess: () => invalidateAll(qc),
  })
}
export const useDeleteCategoryMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: assetService.removeCategory, onSuccess: () => invalidateAll(qc) })
}

/* ── Locations ── */
export const useAssetLocationsQuery = () =>
  useQuery({ queryKey: ASSET_KEYS.locations(), queryFn: assetService.listLocations })

export const useCreateLocationMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: assetService.createLocation, onSuccess: () => invalidateAll(qc) })
}
export const useUpdateLocationMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number | string; body: any }) => assetService.updateLocation(id, body),
    onSuccess: () => invalidateAll(qc),
  })
}
export const useDeleteLocationMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: assetService.removeLocation, onSuccess: () => invalidateAll(qc) })
}

/* ── Maintenance ── */
export const useAssetMaintenanceQuery = (params?: { status?: string; asset_id?: number }) =>
  useQuery({ queryKey: ASSET_KEYS.maintenance(params), queryFn: () => assetService.listMaintenance(params) })

export const useCreateMaintenanceMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: assetService.createMaintenance, onSuccess: () => invalidateAll(qc) })
}
export const useUpdateMaintenanceMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number | string; body: any }) => assetService.updateMaintenance(id, body),
    onSuccess: () => invalidateAll(qc),
  })
}
export const useDeleteMaintenanceMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: assetService.removeMaintenance, onSuccess: () => invalidateAll(qc) })
}
