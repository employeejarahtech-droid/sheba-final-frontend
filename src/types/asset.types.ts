export type AssetStatus = 'active' | 'in_repair' | 'retired' | 'disposed'
export type AssetCondition = 'new' | 'good' | 'fair' | 'poor'
export type DepreciationMethod = 'none' | 'straight_line'

export interface ApiResponse<T> {
  status: boolean
  message: string
  data: T
}

export interface AssetCategory {
  id: number
  name: string
  description?: string | null
  status: 'active' | 'inactive'
  created_at?: string
}

export interface AssetLocation {
  id: number
  name: string
  building?: string | null
  floor?: string | null
  description?: string | null
  status: 'active' | 'inactive'
  created_at?: string
}

export interface Asset {
  id: number
  asset_code: string
  name: string
  category_id?: number | null
  location_id?: number | null
  supplier?: string | null
  purchase_date?: string | null
  purchase_cost: number
  salvage_value: number
  useful_life_years: number
  depreciation_method: DepreciationMethod
  condition: AssetCondition
  status: AssetStatus
  description?: string | null
  category?: { id: number; name: string } | null
  location?: { id: number; name: string } | null
  created_at?: string
}

export interface AssetListResult {
  rows: Asset[]
  total: number
  page?: number
  limit?: number
}

export interface AssetMaintenance {
  id: number
  asset_id: number
  type: 'preventive' | 'corrective' | 'inspection'
  scheduled_date?: string | null
  completed_date?: string | null
  cost: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  performed_by?: string | null
  notes?: string | null
  asset?: { id: number; asset_code: string; name: string } | null
}

export interface AssetDashboard {
  total_assets: number
  total_value: number
  active: number
  in_repair: number
  retired: number
  disposed: number
  by_status: { status: string; count: number; value: number }[]
  by_category: { name: string; count: number; value: number }[]
  upcoming_maintenance: AssetMaintenance[]
  recent_assets: Asset[]
}

export interface AssetStatistics {
  total_value: number
  by_status: { status: string; count: number; value: number }[]
  by_category: { name: string; count: number; value: number }[]
  by_location: { name: string; count: number }[]
}

export interface AssetDepreciationRow {
  id: number
  asset_code: string
  name: string
  category?: string | null
  purchase_date?: string | null
  purchase_cost: number
  salvage_value: number
  useful_life_years: number
  depreciation_method: DepreciationMethod
  annual_depreciation: number
  years_elapsed: number
  accumulated_depreciation: number
  book_value: number
}
