import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, PackageCheck } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrency } from '@/hooks/use-currency'
import { useCreateReceiptMutation, useUpdateReceiptMutation, useSuppliersQuery, useRequestsQuery } from '@/features/purchase/purchaseQueries'
import type { GoodsReceiptNote } from '@/types/purchase.types'

const schema = z.object({
  grn_no: z.string().min(1, 'Required'),
  supplier_id: z.string(),
  request_id: z.string(),
  received_date: z.string().optional(),
  invoice_no: z.string().optional(),
  total_amount: z.string().optional(),
  status: z.enum(['pending', 'partial', 'received']),
  received_by: z.string().optional(),
  notes: z.string().optional(),
})
type Values = z.infer<typeof schema>

const BACK = '/dashboard/purchase/goods-receipt'

export function GrnForm({ initial }: { initial?: GoodsReceiptNote }) {
  const navigate = useNavigate()
  const { currencySymbol } = useCurrency()
  const { data: suppliers } = useSuppliersQuery()
  const { data: requestsResult } = useRequestsQuery({ limit: 500 })
  const create = useCreateReceiptMutation()
  const update = useUpdateReceiptMutation()
  const editing = !!initial
  const saving = create.isPending || update.isPending
  const requests = requestsResult?.rows || []

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      grn_no: initial?.grn_no || '',
      supplier_id: initial?.supplier_id ? String(initial.supplier_id) : 'none',
      request_id: initial?.request_id ? String(initial.request_id) : 'none',
      received_date: initial?.received_date || '',
      invoice_no: initial?.invoice_no || '',
      total_amount: initial?.total_amount != null ? String(initial.total_amount) : '',
      status: initial?.status || 'received',
      received_by: initial?.received_by || '',
      notes: initial?.notes || '',
    },
  })

  const onSubmit = async (values: Values) => {
    const body = {
      grn_no: values.grn_no,
      supplier_id: values.supplier_id === 'none' ? null : Number(values.supplier_id),
      request_id: values.request_id === 'none' ? null : Number(values.request_id),
      received_date: values.received_date || null,
      invoice_no: values.invoice_no || null,
      total_amount: Number(values.total_amount) || 0,
      status: values.status,
      received_by: values.received_by || null,
      notes: values.notes || null,
    }
    try {
      if (editing) { await update.mutateAsync({ id: initial!.id, body }); toast.success('GRN updated') }
      else { await create.mutateAsync(body); toast.success('GRN created') }
      navigate({ to: BACK, search: { page: 1, limit: 10, search: '', status: '' } as any })
    } catch { toast.error('Something went wrong') }
  }

  const goBack = () => navigate({ to: BACK, search: { page: 1, limit: 10, search: '', status: '' } as any })

  return (
    <>
      <AppHeader fixed />
      <Main className="flex flex-1 flex-col gap-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 w-full max-w-[850px] mx-auto px-4">
            <div className="flex items-center gap-4 mb-2">
              <Button type="button" variant="ghost" size="icon" onClick={goBack}><ArrowLeft className="h-5 w-5" /></Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{editing ? 'Edit Goods Receipt' : 'Create Goods Receipt Note'}</h1>
                <p className="text-muted-foreground text-sm">Record goods received from a supplier</p>
              </div>
            </div>

            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><PackageCheck className="w-4 h-4 text-white" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold">Receipt Details</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Supplier, request, amount and status</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="grn_no" render={({ field }) => (
                    <FormItem><FormLabel>GRN No</FormLabel><FormControl><Input placeholder="e.g. GRN-0001" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="invoice_no" render={({ field }) => (
                    <FormItem><FormLabel>Invoice No</FormLabel><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="supplier_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select supplier" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {(suppliers || []).map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="request_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Against Request</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select request" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {requests.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.request_no} — {r.item_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="received_date" render={({ field }) => (
                    <FormItem><FormLabel>Received Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="total_amount" render={({ field }) => (
                    <FormItem><FormLabel>Total Amount ({currencySymbol})</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="received">Received</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="received_by" render={({ field }) => (
                    <FormItem><FormLabel>Received By</FormLabel><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="md:col-span-2">
                    <FormField control={form.control} name="notes" render={({ field }) => (
                      <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Optional" className="min-h-[70px]" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3 pb-10">
              <Button type="button" variant="outline" size="lg" onClick={goBack} disabled={saving}>Cancel</Button>
              <Button type="submit" size="lg" disabled={saving} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[180px]">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create GRN'}
              </Button>
            </div>
          </form>
        </Form>
      </Main>
    </>
  )
}
