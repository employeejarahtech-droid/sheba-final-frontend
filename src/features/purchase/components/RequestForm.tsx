import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, FileText } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrency } from '@/hooks/use-currency'
import { useCreateRequestMutation, useUpdateRequestMutation, useSuppliersQuery } from '@/features/purchase/purchaseQueries'
import type { PurchaseRequest } from '@/types/purchase.types'

const schema = z.object({
  request_no: z.string().min(1, 'Required'),
  item_name: z.string().min(1, 'Required'),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  estimated_cost: z.string().optional(),
  department: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  required_date: z.string().optional(),
  requested_by: z.string().optional(),
  supplier_id: z.string(),
  status: z.enum(['pending', 'approved', 'rejected', 'ordered', 'received']),
  description: z.string().optional(),
})
type Values = z.infer<typeof schema>

const BACK = '/dashboard/purchase/requests'

export function RequestForm({ initial }: { initial?: PurchaseRequest }) {
  const navigate = useNavigate()
  const { currencySymbol } = useCurrency()
  const { data: suppliers } = useSuppliersQuery()
  const create = useCreateRequestMutation()
  const update = useUpdateRequestMutation()
  const editing = !!initial
  const saving = create.isPending || update.isPending

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      request_no: initial?.request_no || '',
      item_name: initial?.item_name || '',
      quantity: initial?.quantity != null ? String(initial.quantity) : '1',
      unit: initial?.unit || '',
      estimated_cost: initial?.estimated_cost != null ? String(initial.estimated_cost) : '',
      department: initial?.department || '',
      priority: initial?.priority || 'medium',
      required_date: initial?.required_date || '',
      requested_by: initial?.requested_by || '',
      supplier_id: initial?.supplier_id ? String(initial.supplier_id) : 'none',
      status: initial?.status || 'pending',
      description: initial?.description || '',
    },
  })

  const onSubmit = async (values: Values) => {
    const body = {
      request_no: values.request_no,
      item_name: values.item_name,
      quantity: Number(values.quantity) || 1,
      unit: values.unit || null,
      estimated_cost: Number(values.estimated_cost) || 0,
      department: values.department || null,
      priority: values.priority,
      required_date: values.required_date || null,
      requested_by: values.requested_by || null,
      supplier_id: values.supplier_id === 'none' ? null : Number(values.supplier_id),
      status: values.status,
      description: values.description || null,
    }
    try {
      if (editing) { await update.mutateAsync({ id: initial!.id, body }); toast.success('Request updated') }
      else { await create.mutateAsync(body); toast.success('Request created') }
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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{editing ? 'Edit Purchase Request' : 'Create Purchase Request'}</h1>
                <p className="text-muted-foreground text-sm">Raise a requisition for approval</p>
              </div>
            </div>

            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><FileText className="w-4 h-4 text-white" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold">Request Details</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Item, quantity, cost and approval</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="request_no" render={({ field }) => (
                    <FormItem><FormLabel>Request No</FormLabel><FormControl><Input placeholder="e.g. PR-0001" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="item_name" render={({ field }) => (
                    <FormItem><FormLabel>Item</FormLabel><FormControl><Input placeholder="e.g. Surgical Gloves" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="quantity" render={({ field }) => (
                    <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="unit" render={({ field }) => (
                    <FormItem><FormLabel>Unit</FormLabel><FormControl><Input placeholder="e.g. box, pcs" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="estimated_cost" render={({ field }) => (
                    <FormItem><FormLabel>Estimated Cost ({currencySymbol})</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="department" render={({ field }) => (
                    <FormItem><FormLabel>Department</FormLabel><FormControl><Input placeholder="e.g. Pharmacy" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="priority" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="required_date" render={({ field }) => (
                    <FormItem><FormLabel>Required Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="requested_by" render={({ field }) => (
                    <FormItem><FormLabel>Requested By</FormLabel><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="supplier_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Supplier</FormLabel>
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
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="ordered">Ordered</SelectItem>
                          <SelectItem value="received">Received</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="md:col-span-2">
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel>Description / Notes</FormLabel><FormControl><Textarea placeholder="Optional" className="min-h-[70px]" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3 pb-10">
              <Button type="button" variant="outline" size="lg" onClick={goBack} disabled={saving}>Cancel</Button>
              <Button type="submit" size="lg" disabled={saving} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[180px]">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Request'}
              </Button>
            </div>
          </form>
        </Form>
      </Main>
    </>
  )
}
