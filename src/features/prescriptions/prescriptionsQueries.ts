import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { prescriptionsService, type PrescriptionListParams, type ReportParams } from './prescriptionsService'

export const PRESCRIPTIONS_KEYS = {
  all: ['prescriptions'] as const,
  dashboard: () => [...PRESCRIPTIONS_KEYS.all, 'dashboard'] as const,
  list: (p?: PrescriptionListParams) => [...PRESCRIPTIONS_KEYS.all, 'list', p] as const,
  mine: (p?: Omit<PrescriptionListParams, 'doctor_id'>) => [...PRESCRIPTIONS_KEYS.all, 'mine', p] as const,
  detail: (id: number | string) => [...PRESCRIPTIONS_KEYS.all, 'detail', id] as const,
  interaction: (sig: string) => [...PRESCRIPTIONS_KEYS.all, 'interaction', sig] as const,
  reports: (kind: 'doctor' | 'medicine' | 'patient', p?: ReportParams) =>
    [...PRESCRIPTIONS_KEYS.all, 'reports', kind, p] as const,
}

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => qc.invalidateQueries({ queryKey: PRESCRIPTIONS_KEYS.all })

export const usePrescriptionsDashboardQuery = () =>
  useQuery({ queryKey: PRESCRIPTIONS_KEYS.dashboard(), queryFn: prescriptionsService.getDashboard })

export const usePrescriptionsQuery = (params?: PrescriptionListParams) =>
  useQuery({ queryKey: PRESCRIPTIONS_KEYS.list(params), queryFn: () => prescriptionsService.list(params) })

export const useMyPrescriptionsQuery = (params?: Omit<PrescriptionListParams, 'doctor_id'>) =>
  useQuery({ queryKey: PRESCRIPTIONS_KEYS.mine(params), queryFn: () => prescriptionsService.myPrescriptions(params) })

export const usePrescriptionQuery = (id: number | string | undefined) =>
  useQuery({
    queryKey: PRESCRIPTIONS_KEYS.detail(id ?? ''),
    queryFn: () => prescriptionsService.get(id as number | string),
    enabled: !!id,
  })

/**
 * Live interaction/allergy warnings while prescribing.
 * `sig` should be a stable serialized key (joined generics + patient id) the
 * caller debounces — the query refires only when it changes.
 */
export const useInteractionCheckQuery = (generics: string[], patientId?: number | null, enabled = true) => {
  const clean = generics.map((g) => g.trim()).filter(Boolean)
  const sig = [...new Set(clean)].sort().join(',') + '|' + (patientId ?? '')
  return useQuery({
    queryKey: PRESCRIPTIONS_KEYS.interaction(sig),
    queryFn: () => prescriptionsService.interactionCheck(clean, patientId),
    enabled: enabled && clean.length >= 2 || (enabled && !!patientId && clean.length >= 1),
    staleTime: 60_000,
  })
}

export const useDoctorWiseReportQuery = (params?: ReportParams) =>
  useQuery({ queryKey: PRESCRIPTIONS_KEYS.reports('doctor', params), queryFn: () => prescriptionsService.reportDoctorWise(params) })

export const useMedicineWiseReportQuery = (params?: ReportParams) =>
  useQuery({ queryKey: PRESCRIPTIONS_KEYS.reports('medicine', params), queryFn: () => prescriptionsService.reportMedicineWise(params) })

export const usePatientWiseReportQuery = (params?: ReportParams) =>
  useQuery({ queryKey: PRESCRIPTIONS_KEYS.reports('patient', params), queryFn: () => prescriptionsService.reportPatientWise(params) })

export const useCreatePrescriptionMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: prescriptionsService.create, onSuccess: () => invalidateAll(qc) })
}

export const useUpdatePrescriptionMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number | string; body: Record<string, unknown> }) => prescriptionsService.update(id, body),
    onSuccess: () => invalidateAll(qc),
  })
}

export const useCancelPrescriptionMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number | string; reason?: string }) => prescriptionsService.cancel(id, reason),
    onSuccess: () => invalidateAll(qc),
  })
}
