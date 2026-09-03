import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { patientsService, type PatientListParams } from './patientsService'
import { PRESCRIPTIONS_KEYS } from './prescriptionsQueries'

export const PATIENTS_KEYS = {
  all: ['prescriptions', 'patients'] as const,
  list: (p?: PatientListParams) => [...PATIENTS_KEYS.all, 'list', p] as const,
  detail: (id: number | string) => [...PATIENTS_KEYS.all, 'detail', id] as const,
  history: (id: number | string) => [...PATIENTS_KEYS.all, 'history', id] as const,
}

const invalidatePatients = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: PATIENTS_KEYS.all })

export const usePatientsQuery = (params?: PatientListParams) =>
  useQuery({ queryKey: PATIENTS_KEYS.list(params), queryFn: () => patientsService.list(params) })

export const usePatientQuery = (id: number | string | undefined) =>
  useQuery({
    queryKey: PATIENTS_KEYS.detail(id ?? ''),
    queryFn: () => patientsService.get(id as number | string),
    enabled: !!id,
  })

export const usePatientHistoryQuery = (id: number | string | undefined) =>
  useQuery({
    queryKey: PATIENTS_KEYS.history(id ?? ''),
    queryFn: () => patientsService.history(id as number | string, { limit: 50 }),
    enabled: !!id,
  })

/** Debounced picker search — caller debounces the query key via the term itself.
 *  An empty query is valid: the backend returns the most recent active patients,
 *  so the picker has a browsable default list before the user types anything. */
export const usePatientSearchQuery = (q: string) =>
  useQuery({
    queryKey: [...PATIENTS_KEYS.all, 'search', q],
    queryFn: () => patientsService.search(q),
    staleTime: 30_000,
  })

export const useCreatePatientMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: patientsService.create, onSuccess: () => invalidatePatients(qc) })
}

export const useUpdatePatientMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number | string; body: Parameters<typeof patientsService.update>[1] }) =>
      patientsService.update(id, body),
    onSuccess: () => invalidatePatients(qc),
  })
}

export const useDeletePatientMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number | string) => patientsService.remove(id),
    onSuccess: () => {
      invalidatePatients(qc)
      qc.invalidateQueries({ queryKey: PRESCRIPTIONS_KEYS.all })
    },
  })
}
