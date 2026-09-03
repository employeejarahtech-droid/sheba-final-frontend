import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { quickPhrasesService, type QuickPhraseListParams } from './quickPhrasesService'
import type { QuickPhraseCategory, RxQuickPhrase } from '@/types/prescriptions.types'

export const QUICK_PHRASES_KEYS = {
  all: ['prescriptions', 'quick-phrases'] as const,
  categories: () => [...QUICK_PHRASES_KEYS.all, 'categories'] as const,
  grouped: () => [...QUICK_PHRASES_KEYS.all, 'grouped'] as const,
  list: (p?: QuickPhraseListParams) => [...QUICK_PHRASES_KEYS.all, 'list', p] as const,
}

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => qc.invalidateQueries({ queryKey: QUICK_PHRASES_KEYS.all })

export const useQuickPhraseCategoriesQuery = () =>
  useQuery({ queryKey: QUICK_PHRASES_KEYS.categories(), queryFn: quickPhrasesService.categories, staleTime: Infinity })

/** Active phrases grouped by category — the create/edit prescription form
 *  fetches this once and slices it per QuickPhrasePicker instance. */
export const useQuickPhrasesGroupedQuery = () =>
  useQuery({ queryKey: QUICK_PHRASES_KEYS.grouped(), queryFn: quickPhrasesService.grouped, staleTime: 60_000 })

export const useQuickPhrasesListQuery = (params?: QuickPhraseListParams) =>
  useQuery({ queryKey: QUICK_PHRASES_KEYS.list(params), queryFn: () => quickPhrasesService.list(params) })

export const useCreateQuickPhraseMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: quickPhrasesService.create, onSuccess: () => invalidateAll(qc) })
}

export const useUpdateQuickPhraseMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number | string; body: Partial<Pick<RxQuickPhrase, 'phrase' | 'status' | 'sort_order'>> }) =>
      quickPhrasesService.update(id, body),
    onSuccess: () => invalidateAll(qc),
  })
}

export const useDeleteQuickPhraseMutation = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: number | string) => quickPhrasesService.remove(id), onSuccess: () => invalidateAll(qc) })
}

export const QUICK_PHRASE_CATEGORY_LABELS: Record<QuickPhraseCategory, string> = {
  chief_complaints: 'Chief Complaints',
  on_examination: 'On Examination (O/E)',
  history: 'History',
  diagnosis: 'Diagnosis',
  advice: 'Advice',
  dosage: 'Dosage',
  frequency: 'Frequency',
  duration: 'Duration',
  route: 'Route',
  instructions: 'Instructions',
  instructions_local: 'Local Language Instructions',
}
