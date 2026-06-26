export interface ApiResponse<T> {
  status: boolean
  message: string
  data: T
}

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'ordered' | 'received'
export type Priority = 'low' | 'medium' | 'high'
export type GrnStatus = 'pending' | 'partial' | 'received'

export interface PurchaseSupplier {
  id: number
  name: string
  contact_person?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  category?: string | null
  rating: number
  status: 'active' | 'inactive'
  created_at?: string
}

export interface PurchaseRequest {
  id: number
  request_no: string
  item_name: string
  description?: string | null
  quantity: number
  unit?: string | null
  estimated_cost: number
  department?: string | null
  priority: Priority
  required_date?: string | null
  requested_by?: string | null
  supplier_id?: number | null
  status: RequestStatus
  notes?: string | null
  supplier?: { id: number; name: string } | null
  created_at?: string
}

export interface GoodsReceiptNote {
  id: number
  grn_no: string
  supplier_id?: number | null
  request_id?: number | null
  received_date?: string | null
  invoice_no?: string | null
  total_amount: number
  status: GrnStatus
  received_by?: string | null
  notes?: string | null
  supplier?: { id: number; name: string } | null
  request?: { id: number; request_no: string; item_name: string } | null
  created_at?: string
}

export interface ListResult<T> {
  rows: T[]
  total: number
  page?: number
  limit?: number
}

export interface PurchaseDashboard {
  total_requests: number
  pending_requests: number
  approved_requests: number
  active_suppliers: number
  total_received_value: number
  by_status: { status: string; count: number; value: number }[]
  recent_requests: PurchaseRequest[]
  pending_list: PurchaseRequest[]
}

export interface PurchaseStatistics {
  total_received_value: number
  by_status: { status: string; count: number; value: number }[]
  by_department: { name: string; count: number; value: number }[]
}

export interface SupplierPerformanceRow {
  id: number
  name: string
  category?: string | null
  rating: number
  status: string
  orders: number
  total_value: number
  fulfilment_rate: number
}
