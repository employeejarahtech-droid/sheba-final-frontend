import api from '@/lib/axios'
import type {
  ApiResponse,
  ListResult,
  PharmacyImportResult,
  RxMedicine,
  RxMedicineGroup,
} from '@/types/prescriptions.types'

export interface RxMedicineListParams {
  page?: number
  limit?: number
  search?: string
  group_id?: number
  status?: string
}

export const rxMedicinesService = {
  /* ── Groups ── */
  listGroups: async (params?: { search?: string; status?: string; limit?: number }) =>
    (await api.get<ApiResponse<ListResult<RxMedicineGroup>>>('/prescriptions/medicine-groups', { params })).data.data,

  getGroup: async (id: number | string) =>
    (await api.get<ApiResponse<RxMedicineGroup>>(`/prescriptions/medicine-groups/${id}`)).data.data,

  createGroup: async (body: Partial<RxMedicineGroup>) =>
    (await api.post<ApiResponse<RxMedicineGroup>>('/prescriptions/medicine-groups', body)).data,

  updateGroup: async (id: number | string, body: Partial<RxMedicineGroup>) =>
    (await api.put<ApiResponse<RxMedicineGroup>>(`/prescriptions/medicine-groups/${id}`, body)).data,

  removeGroup: async (id: number | string) =>
    (await api.delete<ApiResponse<null>>(`/prescriptions/medicine-groups/${id}`)).data,

  /* ── Medicines ── */
  list: async (params?: RxMedicineListParams) =>
    (await api.get<ApiResponse<ListResult<RxMedicine>>>('/prescriptions/medicines', { params })).data.data,

  search: async (q: string, group_id?: number) =>
    (await api.get<ApiResponse<RxMedicine[]>>('/prescriptions/medicines/search', { params: { q, group_id } })).data.data ?? [],

  get: async (id: number | string) =>
    (await api.get<ApiResponse<RxMedicine>>(`/prescriptions/medicines/${id}`)).data.data,

  create: async (body: Partial<RxMedicine>) =>
    (await api.post<ApiResponse<RxMedicine>>('/prescriptions/medicines', body)).data,

  update: async (id: number | string, body: Partial<RxMedicine>) =>
    (await api.put<ApiResponse<RxMedicine>>(`/prescriptions/medicines/${id}`, body)).data,

  remove: async (id: number | string) =>
    (await api.delete<ApiResponse<{ deactivated: boolean }>>(`/prescriptions/medicines/${id}`)).data,

  importFromPharmacy: async () =>
    (await api.post<ApiResponse<PharmacyImportResult>>('/prescriptions/medicines/import-from-pharmacy', {})).data,
}
