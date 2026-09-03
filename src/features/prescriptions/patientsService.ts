import api from '@/lib/axios'
import type { ApiResponse, ListResult, Patient, Prescription } from '@/types/prescriptions.types'

export interface PatientListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export const patientsService = {
  list: async (params?: PatientListParams) =>
    (await api.get<ApiResponse<ListResult<Patient>>>('/prescriptions/patients', { params })).data.data,

  search: async (q: string) =>
    (await api.get<ApiResponse<Patient[]>>('/prescriptions/patients/search', { params: { q } })).data.data ?? [],

  get: async (id: number | string) =>
    (await api.get<ApiResponse<Patient>>(`/prescriptions/patients/${id}`)).data.data,

  create: async (body: Partial<Patient>) =>
    (await api.post<ApiResponse<Patient>>('/prescriptions/patients', body)).data,

  update: async (id: number | string, body: Partial<Patient>) =>
    (await api.put<ApiResponse<Patient>>(`/prescriptions/patients/${id}`, body)).data,

  remove: async (id: number | string) =>
    (await api.delete<ApiResponse<{ deactivated: boolean }>>(`/prescriptions/patients/${id}`)).data,

  history: async (id: number | string, params?: { page?: number; limit?: number }) =>
    (await api.get<ApiResponse<ListResult<Prescription>>>(`/prescriptions/patients/${id}/prescriptions`, { params })).data.data,
}
