import api from '@/lib/axios'
import type {
  ApiResponse,
  InteractionCheckResult,
  ListResult,
  Prescription,
  PrescriptionDashboard,
} from '@/types/prescriptions.types'

export interface PrescriptionListParams {
  page?: number
  limit?: number
  search?: string
  doctor_id?: number
  patient_id?: number
  status?: string
  start_date?: string
  end_date?: string
}

export interface ReportParams {
  start_date?: string
  end_date?: string
  doctor_id?: number
  patient_id?: number
  group_id?: number
}

export interface DoctorWiseRow {
  doctor_id: number
  doctor_name: string
  total_prescriptions: number
  total_items: number
}

export interface MedicineWiseRow {
  medicine_name: string
  generic_name: string | null
  times_prescribed: number
}

export interface PatientWiseRow {
  patient_id: number | null
  patient_name: string
  total_prescriptions: number
  last_visit: string | null
}

export const prescriptionsService = {
  getDashboard: async () => (await api.get<ApiResponse<PrescriptionDashboard>>('/prescriptions/stats')).data.data,

  list: async (params?: PrescriptionListParams) =>
    (await api.get<ApiResponse<ListResult<Prescription>>>('/prescriptions', { params })).data.data,

  myPrescriptions: async (params?: Omit<PrescriptionListParams, 'doctor_id'>) =>
    (await api.get<ApiResponse<ListResult<Prescription>>>('/prescriptions/my-prescriptions', { params })).data.data,

  get: async (id: number | string) =>
    (await api.get<ApiResponse<Prescription>>(`/prescriptions/${id}`)).data.data,

  create: async (body: Record<string, unknown>) =>
    (await api.post<ApiResponse<Prescription>>('/prescriptions', body)).data,

  update: async (id: number | string, body: Record<string, unknown>) =>
    (await api.put<ApiResponse<Prescription>>(`/prescriptions/${id}`, body)).data,

  cancel: async (id: number | string, reason?: string) =>
    (await api.put<ApiResponse<Prescription>>(`/prescriptions/${id}/cancel`, { reason })).data,

  /** Live interaction/allergy check for the prescribing form. */
  interactionCheck: async (generics: string[], patient_id?: number | null) =>
    (await api.get<ApiResponse<InteractionCheckResult>>('/prescriptions/interaction-check', {
      params: { generics: generics.join(','), patient_id: patient_id || undefined },
    })).data.data,

  /* ── Reports ── */
  reportDoctorWise: async (params?: ReportParams) =>
    (await api.get<ApiResponse<DoctorWiseRow[]>>('/prescriptions/reports/doctor-wise', { params })).data.data,

  reportMedicineWise: async (params?: ReportParams) =>
    (await api.get<ApiResponse<MedicineWiseRow[]>>('/prescriptions/reports/medicine-wise', { params })).data.data,

  reportPatientWise: async (params?: ReportParams) =>
    (await api.get<ApiResponse<PatientWiseRow[]>>('/prescriptions/reports/patient-wise', { params })).data.data,
}
