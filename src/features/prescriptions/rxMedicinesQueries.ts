import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { rxMedicinesService, type RxMedicineListParams } from './rxMedicinesService'
import { PRESCRIPTIONS_KEYS } from './prescriptionsQueries'

export const RX_MEDICINES_KEYS = {
  all: ['prescriptions', 'rx-medicines'] as const,
  groups: () => [...RX_MEDICINES_KEYS.all, 'groups'] as const,
  group: (id: number | string) => [...RX_MEDICINES_KEYS.all, 'groups', 'detail', id] as const,
  list: (p?: RxMedicineListParams) => [...RX_MEDICINES_KEYS.all, 'list', p] as const,
  detail: (id: number | string) => [...RX_MEDICINES_KEYS.all, 'detail', id] as const,
}

const invalidateMedicines = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: RX_MEDICINES_KEYS.all })

export const useMedicineGroupsQuery = (params?: { search?: string; status?: string; limit?: number }) =>
  useQuery({ queryKey: [...RX_MEDICINES_KEYS.groups(), params], queryFn: () => rxMedicinesService.listGroups(params) })

export const useMedicineGroupQuery = (id: number | string | undefined) =>
  useQuery({
    queryKey: RX_MEDICINES_KEYS.group(id ?? ''),
    queryFn: () => rxMedicinesService.getGroup(id as number | string),
    enabled: !!id,
  })

export const useRxMedicinesQuery = (params?: RxMedicineListParams) =>
  useQuery({ queryKey: RX_MEDICINES_KEYS.list(params), queryFn: () => rxMedicinesService.list(params) })

export const useRxMedicineQuery = (id: number | string | undefined) =>
  useQuery({
    queryKey: RX_MEDICINES_KEYS.detail(id ?? ''),
    queryFn: () => rxMedicinesService.get(id as number | string),
    enabled: !!id,
  })

/** Backend returns up to 50 active medicines even with a blank `q` — so the
 *  picker can show a browsable default list immediately on open instead of
 *  staying empty until the user types. */
export const useRxMedicineSearchQuery = (q: string, group_id?: number) =>
  useQuery({
    queryKey: [...RX_MEDICINES_KEYS.all, 'search', q, group_id ?? null],
    queryFn: () => rxMedicinesService.search(q, group_id),
    staleTime: 30_000,
  })

export const useCreateMedicineGroupMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: rxMedicinesService.createGroup, onSuccess: () => invalidateMedicines(qc) })
}

export const useUpdateMedicineGroupMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number | string; body: Parameters<typeof rxMedicinesService.updateGroup>[1] }) =>
      rxMedicinesService.updateGroup(id, body),
    onSuccess: () => invalidateMedicines(qc),
  })
}

export const useDeleteMedicineGroupMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: rxMedicinesService.removeGroup, onSuccess: () => invalidateMedicines(qc) })
}

export const useCreateRxMedicineMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: rxMedicinesService.create, onSuccess: () => invalidateMedicines(qc) })
}

export const useUpdateRxMedicineMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number | string; body: Parameters<typeof rxMedicinesService.update>[1] }) =>
      rxMedicinesService.update(id, body),
    onSuccess: () => invalidateMedicines(qc),
  })
}

export const useDeleteRxMedicineMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: rxMedicinesService.remove,
    onSuccess: () => {
      invalidateMedicines(qc)
      qc.invalidateQueries({ queryKey: PRESCRIPTIONS_KEYS.all })
    },
  })
}

export const useImportFromPharmacyMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: rxMedicinesService.importFromPharmacy, onSuccess: () => invalidateMedicines(qc) })
}
