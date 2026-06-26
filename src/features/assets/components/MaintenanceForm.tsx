import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Wrench } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrency } from '@/hooks/use-currency'
import {
  useCreateMaintenanceMutation, useUpdateMaintenanceMutation, useAssetsQuery,
} from '@/features/assets/assetQueries'
import type { AssetMaintenance } from '@/types/asset.types'

const schema = z.object({
  asset_id: z.string().min(1, 'Required'),
  type: z.enum(['preventive', 'corrective', 'inspection']),
  scheduled_date: z.string().optional(),
  completed_date: z.string().optional(),
  cost: z.string().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  performed_by: z.string().optional(),
  notes: z.string().optional(),
})
type Values = z.infer<typeof schema>

const BACK = '/dashboard/assets/maintenance'

export function MaintenanceForm({ initial }: { initial?: AssetMaintenance }) {
  const navigate = useNavigate()
  const { currencySymbol } = useCurrency()
  const { data: assetsResult } = useAssetsQuery({ limit: 500 })
  const create = useCreateMaintenanceMutation()
  const update = useUpdateMaintenanceMutation()
  const editing = !!initial
  const saving = create.isPending || update.isPending
  const assets = assetsResult?.rows || []

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      asset_id: initial?.asset_id ? String(initial.asset_id) : '',
      type: initial?.type || 'preventive',
      scheduled_date: initial?.scheduled_date || '',
      completed_date: initial?.completed_date || '',
      cost: initial?.cost != null ? String(initial.cost) : '',
      status: initial?.status || 'scheduled',
      performed_by: initial?.performed_by || '',
      notes: initial?.notes || '',
    },
  })

  const onSubmit = async (values: Values) => {
    const body = {
      asset_id: Number(values.asset_id),
      type: values.type,
      scheduled_date: values.scheduled_date || null,
      completed_date: values.completed_date || null,
      cost: Number(values.cost) || 0,
      status: values.status,
      performed_by: values.performed_by || null,
      notes: values.notes || null,
    }
    try {
      if (editing) {
        await update.mutateAsync({ id: initial!.id, body })
        toast.success('Maintenance updated')
      } else {
        await create.mutateAsync(body)
        toast.success('Maintenance scheduled')
      }
      navigate({ to: BACK })
    } catch {
      toast.error('Something went wrong')
    }
  }

  return (
    <>
      <AppHeader fixed />
      <Main className="flex flex-1 flex-col gap-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 w-full max-w-[750px] mx-auto px-4">
            <div className="flex items-center gap-4 mb-2">
              <Button type="button" variant="ghost" size="icon" onClick={() => navigate({ to: BACK })}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {editing ? 'Edit Maintenance' : 'Schedule Maintenance'}
                </h1>
                <p className="text-muted-foreground text-sm">Plan and record asset servicing</p>
              </div>
            </div>

            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><Wrench className="w-4 h-4 text-white" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold">Maintenance Details</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Asset, type, schedule and cost</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <FormField control={form.control} name="asset_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select asset" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {assets.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.asset_code} — {a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="preventive">Preventive</SelectItem>
                          <SelectItem value="corrective">Corrective</SelectItem>
                          <SelectItem value="inspection">Inspection</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="scheduled_date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="completed_date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Completed Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="cost" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost ({currencySymbol})</FormLabel>
                      <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="performed_by" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Performed By</FormLabel>
                      <FormControl><Input placeholder="Optional" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl><Textarea placeholder="Optional" className="min-h-[80px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3 pb-10">
              <Button type="button" variant="outline" size="lg" onClick={() => navigate({ to: BACK })} disabled={saving}>Cancel</Button>
              <Button type="submit" size="lg" disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[180px]">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Schedule'}
              </Button>
            </div>
          </form>
        </Form>
      </Main>
    </>
  )
}
