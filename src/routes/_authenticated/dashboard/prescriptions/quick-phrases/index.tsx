import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Check, ListChecks, Pencil, Plus, Trash2, X } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useQuickPhrasesListQuery, useCreateQuickPhraseMutation, useUpdateQuickPhraseMutation, useDeleteQuickPhraseMutation,
  QUICK_PHRASE_CATEGORY_LABELS,
} from '@/features/prescriptions/quickPhrasesQueries'
import type { QuickPhraseCategory } from '@/types/prescriptions.types'
import { useCan } from '@/hooks/use-can'

const CATEGORIES = Object.keys(QUICK_PHRASE_CATEGORY_LABELS) as QuickPhraseCategory[]

export const Route = createFileRoute('/_authenticated/dashboard/prescriptions/quick-phrases/')({
  component: QuickPhrasesPage,
})

function QuickPhrasesPage() {
  const can = useCan()
  const canEdit = can('prescriptions.edit')
  const [category, setCategory] = useState<QuickPhraseCategory>('chief_complaints')
  const [newPhrase, setNewPhrase] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')

  const { data: rows, isFetching } = useQuickPhrasesListQuery({ category })
  const create = useCreateQuickPhraseMutation()
  const update = useUpdateQuickPhraseMutation()
  const remove = useDeleteQuickPhraseMutation()

  const activeRows = (rows || []).filter((r) => r.status === 'active')

  const addPhrase = async () => {
    if (!newPhrase.trim()) return
    try {
      await create.mutateAsync({ category, phrase: newPhrase.trim() })
      setNewPhrase('')
      toast.success('Phrase added')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add phrase')
    }
  }

  const startEdit = (id: number, phrase: string) => { setEditingId(id); setEditingText(phrase) }
  const cancelEdit = () => setEditingId(null)
  const saveEdit = async () => {
    if (!editingText.trim() || editingId == null) return
    try {
      await update.mutateAsync({ id: editingId, body: { phrase: editingText.trim() } })
      setEditingId(null)
      toast.success('Phrase updated')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update phrase')
    }
  }

  const deletePhrase = async (id: number) => {
    if (!window.confirm('Delete this phrase?')) return
    try { await remove.mutateAsync(id); toast.success('Phrase deleted') }
    catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to delete phrase') }
  }

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ListChecks className="h-6 w-6 text-blue-600" />Quick Phrases
            </h1>
            <p className="text-sm text-muted-foreground">
              Ready-made text options shown in the prescription form's "+ Quick pick" dropdowns
            </p>
          </div>
        </div>

        <Card className="overflow-hidden shadow-none gap-0 p-0">
          <CardHeader className="border-b py-3 px-4 gap-0">
            <div className="flex items-center gap-3">
              <CardTitle className="text-sm font-semibold whitespace-nowrap text-muted-foreground">Category</CardTitle>
              <Select value={category} onValueChange={(v) => setCategory(v as QuickPhraseCategory)}>
                <SelectTrigger className="w-[280px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{QUICK_PHRASE_CATEGORY_LABELS[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {isFetching && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!isFetching && activeRows.length === 0 && (
              <p className="text-sm text-muted-foreground">No phrases yet for this category.</p>
            )}
            {activeRows.map((row) => (
              <div key={row.id} className="flex items-center gap-2 border-b pb-2 last:border-b-0 last:pb-0">
                {editingId === row.id ? (
                  <>
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="flex-1"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                    />
                    <Button type="button" size="icon" variant="ghost" onClick={saveEdit} disabled={update.isPending}>
                      <Check className="h-4 w-4 text-emerald-600" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={cancelEdit}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{row.phrase}</span>
                    {canEdit && (
                      <>
                        <Button type="button" size="icon" variant="ghost" onClick={() => startEdit(row.id, row.phrase)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" onClick={() => deletePhrase(row.id)} disabled={remove.isPending}>
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}

            {canEdit && (
              <div className="flex items-center gap-2 pt-3">
                <Input
                  placeholder={`Add a new "${QUICK_PHRASE_CATEGORY_LABELS[category]}" phrase`}
                  value={newPhrase}
                  onChange={(e) => setNewPhrase(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addPhrase() }}
                  className="flex-1"
                />
                <Button type="button" onClick={addPhrase} disabled={create.isPending || !newPhrase.trim()}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
