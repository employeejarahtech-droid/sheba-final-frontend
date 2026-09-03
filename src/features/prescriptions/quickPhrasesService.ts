import api from '@/lib/axios'
import type { ApiResponse, QuickPhraseCategory, QuickPhrasesGrouped, RxQuickPhrase } from '@/types/prescriptions.types'

export interface QuickPhraseListParams {
  category?: QuickPhraseCategory
  status?: string
}

export const quickPhrasesService = {
  categories: async () =>
    (await api.get<ApiResponse<QuickPhraseCategory[]>>('/prescriptions/quick-phrases/categories')).data.data,

  /** Active phrases grouped by category — one call feeds every QuickPhrasePicker on the form. */
  grouped: async () =>
    (await api.get<ApiResponse<QuickPhrasesGrouped>>('/prescriptions/quick-phrases/grouped')).data.data,

  list: async (params?: QuickPhraseListParams) =>
    (await api.get<ApiResponse<RxQuickPhrase[]>>('/prescriptions/quick-phrases', { params })).data.data,

  create: async (body: { category: QuickPhraseCategory; phrase: string }) =>
    (await api.post<ApiResponse<RxQuickPhrase>>('/prescriptions/quick-phrases', body)).data,

  update: async (id: number | string, body: Partial<Pick<RxQuickPhrase, 'phrase' | 'status' | 'sort_order'>>) =>
    (await api.put<ApiResponse<RxQuickPhrase>>(`/prescriptions/quick-phrases/${id}`, body)).data,

  remove: async (id: number | string) =>
    (await api.delete<ApiResponse<RxQuickPhrase>>(`/prescriptions/quick-phrases/${id}`)).data,
}
