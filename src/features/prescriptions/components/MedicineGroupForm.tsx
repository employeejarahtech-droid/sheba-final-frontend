import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Boxes } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useCreateMedicineGroupMutation,
  useUpdateMedicineGroupMutation,
} from '@/features/prescriptions/rxMedicinesQueries'
import type { RxMedicineGroup } from '@/types/prescriptions.types'

const schema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
  sort_order: z.string().optional(),
  status: z.enum(['active', 'inactive']),
})
type Values = z.infer<typeof schema>

const BACK = '/dashboard/prescriptions/medicine-groups'

export function MedicineGroupForm({ initial }: { initial?: RxMedicineGroup }) {
  const navigate = useNavigate()
  const create = useCreateMedicineGroupMutation()
  const update = useUpdateMedicineGroupMutation()
  const editing = !!initial
  const saving = create.isPending || update.isPending

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name || '',
      description: initial?.description || '',
      sort_order: initial?.sort_order != null ? String(initial.sort_order) : '0',
      status: initial?.status || 'active',
    },
  })

  const onSubmit = async (values: Values) => {
    const body = {
      ...values,
      description: values.description || null,
      sort_order: values.sort_order === '' || values.sort_order == null ? 0 : Number(values.sort_order) || 0,
    }
    try {
      if (editing) { await update.mutateAsync({ id: initial!.id, body: body as any }); toast.success('Medicine group updated') }
      else { await create.mutateAsync(body as any); toast.success('Medicine group created') }
      navigate({ to: BACK })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save medicine group')
    }
  }

  return (
    <>
      <AppHeader fixed />
      <Main className="flex flex-1 flex-col gap-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 w-full max-w-[700px] mx-auto px-4">
            <div className="flex items-center gap-4 mb-2">
              <Button type="button" variant="ghost" size="icon" onClick={() => navigate({ to: BACK })}><ArrowLeft className="h-5 w-5" /></Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {editing ? 'Edit Medicine Group' : 'Create Medicine Group'}
                </h1>
                <p className="text-muted-foreground text-sm">Therapeutic group used to organise the Rx medicine list</p>
              </div>
            </div>

            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><Boxes className="w-4 h-4 text-white" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold">Group Details</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">e.g. Antibiotics, Analgesics, Cardiovascular</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name *</FormLabel><FormControl><Input placeholder="e.g. Antibiotics" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Optional" className="min-h-[70px]" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="sort_order" render={({ field }) => (
                      <FormItem><FormLabel>Sort order</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="status" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3 pb-10">
              <Button type="button" variant="outline" size="lg" onClick={() => navigate({ to: BACK })} disabled={saving}>Cancel</Button>
              <Button type="submit" size="lg" disabled={saving} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[180px]">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Group'}
              </Button>
            </div>
          </form>
        </Form>
      </Main>
    </>
  )
}
