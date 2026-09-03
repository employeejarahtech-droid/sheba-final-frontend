import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Pill, ShieldAlert } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useCreateRxMedicineMutation,
  useUpdateRxMedicineMutation,
  useMedicineGroupsQuery,
} from '@/features/prescriptions/rxMedicinesQueries'
import type { RxMedicine } from '@/types/prescriptions.types'

const DOSAGE_FORMS = [
  'Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'IV Infusion',
  'Drops', 'Cream', 'Ointment', 'Gel', 'Inhaler', 'Spray', 'Suppository',
  'Sachet', 'Powder', 'Lotion', 'Other',
]
const ROUTES = ['Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhalation', 'Nasal', 'Ophthalmic', 'Otic', 'Rectal', 'Sublingual']

const schema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  generic_name: z.string().min(1, 'Generic name is required — it powers interaction warnings'),
  group_id: z.string().optional(),
  form: z.string().optional(),
  strength: z.string().optional(),
  default_dosage: z.string().optional(),
  default_frequency: z.string().optional(),
  default_duration: z.string().optional(),
  default_route: z.string().optional(),
  is_controlled: z.boolean().optional(),
  caution_note: z.string().optional(),
  status: z.enum(['active', 'inactive']),
})
type Values = z.infer<typeof schema>

const BACK = '/dashboard/prescriptions/medicines'

export function RxMedicineForm({ initial }: { initial?: RxMedicine }) {
  const navigate = useNavigate()
  const create = useCreateRxMedicineMutation()
  const update = useUpdateRxMedicineMutation()
  const { data: groupsResult } = useMedicineGroupsQuery({ status: 'active', limit: 500 })
  const groups = groupsResult?.rows ?? []
  const editing = !!initial
  const saving = create.isPending || update.isPending

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name || '',
      generic_name: initial?.generic_name || '',
      group_id: initial?.group_id ? String(initial.group_id) : '',
      form: initial?.form || '',
      strength: initial?.strength || '',
      default_dosage: initial?.default_dosage || '',
      default_frequency: initial?.default_frequency || '',
      default_duration: initial?.default_duration || '',
      default_route: initial?.default_route || '',
      is_controlled: !!initial?.is_controlled,
      caution_note: initial?.caution_note || '',
      status: initial?.status || 'active',
    },
  })

  const onSubmit = async (values: Values) => {
    const body = {
      name: values.name.trim(),
      generic_name: values.generic_name.trim(),
      group_id: values.group_id ? Number(values.group_id) : null,
      form: values.form || null,
      strength: values.strength || null,
      default_dosage: values.default_dosage || null,
      default_frequency: values.default_frequency || null,
      default_duration: values.default_duration || null,
      default_route: values.default_route || null,
      is_controlled: values.is_controlled ?? false,
      caution_note: values.caution_note || null,
      status: values.status,
    }
    try {
      if (editing) { await update.mutateAsync({ id: initial!.id, body: body as any }); toast.success('Medicine updated') }
      else { await create.mutateAsync(body as any); toast.success('Medicine added to Rx list') }
      navigate({ to: BACK })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save medicine')
    }
  }

  return (
    <>
      <AppHeader fixed />
      <Main className="flex flex-1 flex-col gap-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 w-full max-w-[900px] mx-auto px-4">
            <div className="flex items-center gap-4 mb-2">
              <Button type="button" variant="ghost" size="icon" onClick={() => navigate({ to: BACK })}><ArrowLeft className="h-5 w-5" /></Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {editing ? 'Edit Rx Medicine' : 'Add Rx Medicine'}
                </h1>
                <p className="text-muted-foreground text-sm">Clinical master entry — brand, generic and prescribing presets</p>
              </div>
            </div>

            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><Pill className="w-4 h-4 text-white" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold">Medicine</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Brand name, generic, group, form and strength</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Brand / medicine name *</FormLabel><FormControl><Input placeholder="e.g. Napa" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="space-y-1.5">
                    <FormField control={form.control} name="strength" render={({ field }) => (
                      <FormItem><FormLabel>Strength</FormLabel><FormControl><Input placeholder="e.g. 500mg" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <FormField control={form.control} name="generic_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Generic name *</FormLabel>
                        <FormControl><Input placeholder="e.g. Paracetamol" {...field} /></FormControl>
                        <FormMessage />
                        <p className="text-[11px] text-muted-foreground">Used for drug-interaction and allergy checks.</p>
                      </FormItem>
                    )} />
                  </div>
                  <div className="space-y-1.5">
                    <FormField control={form.control} name="group_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group</FormLabel>
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select group" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {(groups || []).map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="space-y-1.5">
                    <FormField control={form.control} name="form" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dosage form</FormLabel>
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select form" /></SelectTrigger></FormControl>
                          <SelectContent>{DOSAGE_FORMS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg"><Pill className="w-4 h-4 text-white" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold">Prescribing Presets</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Auto-filled when this medicine is picked in a prescription</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField control={form.control} name="default_dosage" render={({ field }) => (
                    <FormItem><FormLabel>Dosage</FormLabel><FormControl><Input placeholder="1+0+1" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="default_frequency" render={({ field }) => (
                    <FormItem><FormLabel>Frequency</FormLabel><FormControl><Input placeholder="BDT / TDS" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="default_duration" render={({ field }) => (
                    <FormItem><FormLabel>Duration</FormLabel><FormControl><Input placeholder="7 days" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="default_route" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Route</FormLabel>
                      <Select value={field.value || undefined} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>{ROUTES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border-amber-200 dark:border-amber-900/50">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-lg"><ShieldAlert className="w-4 h-4 text-white" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold">Safety</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Controlled-drug flag and caution note</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <FormField control={form.control} name="is_controlled" render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={!!field.value} onCheckedChange={(v) => field.onChange(!!v)} />
                    </FormControl>
                    <FormLabel className="font-normal">Controlled drug (flagged in picker and on print)</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="caution_note" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caution note</FormLabel>
                    <FormControl><Textarea placeholder="e.g. Avoid in pregnancy — shown next to the medicine in the picker" className="min-h-[60px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem className="max-w-[220px]">
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3 pb-10">
              <Button type="button" variant="outline" size="lg" onClick={() => navigate({ to: BACK })} disabled={saving}>Cancel</Button>
              <Button type="submit" size="lg" disabled={saving} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[180px]">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Medicine'}
              </Button>
            </div>
          </form>
        </Form>
      </Main>
    </>
  )
}
