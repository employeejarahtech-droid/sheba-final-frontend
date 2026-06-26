import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Truck } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateSupplierMutation, useUpdateSupplierMutation } from '@/features/purchase/purchaseQueries'
import type { PurchaseSupplier } from '@/types/purchase.types'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  contact_person: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  category: z.string().optional(),
  rating: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive']),
})
type Values = z.infer<typeof schema>

const BACK = '/dashboard/purchase/suppliers'

export function SupplierForm({ initial }: { initial?: PurchaseSupplier }) {
  const navigate = useNavigate()
  const create = useCreateSupplierMutation()
  const update = useUpdateSupplierMutation()
  const editing = !!initial
  const saving = create.isPending || update.isPending

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name || '',
      contact_person: initial?.contact_person || '',
      email: initial?.email || '',
      phone: initial?.phone || '',
      category: initial?.category || '',
      rating: initial?.rating != null ? String(initial.rating) : '0',
      address: initial?.address || '',
      status: initial?.status || 'active',
    },
  })

  const onSubmit = async (values: Values) => {
    const body = { ...values, rating: Number(values.rating) || 0 }
    try {
      if (editing) { await update.mutateAsync({ id: initial!.id, body }); toast.success('Supplier updated') }
      else { await create.mutateAsync(body); toast.success('Supplier created') }
      navigate({ to: BACK })
    } catch { toast.error('Something went wrong') }
  }

  return (
    <>
      <AppHeader fixed />
      <Main className="flex flex-1 flex-col gap-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 w-full max-w-[850px] mx-auto px-4">
            <div className="flex items-center gap-4 mb-2">
              <Button type="button" variant="ghost" size="icon" onClick={() => navigate({ to: BACK })}><ArrowLeft className="h-5 w-5" /></Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{editing ? 'Edit Supplier' : 'Create Supplier'}</h1>
                <p className="text-muted-foreground text-sm">Vendor contact and category</p>
              </div>
            </div>

            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><Truck className="w-4 h-4 text-white" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold">Supplier Details</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Contact, category, rating and status</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g. MediPharma Distributors" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="contact_person" render={({ field }) => (
                    <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g. Pharmaceuticals" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="rating" render={({ field }) => (
                    <FormItem><FormLabel>Rating (0–5)</FormLabel><FormControl><Input type="number" step="0.1" min="0" max="5" {...field} /></FormControl><FormMessage /></FormItem>
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
                  <div className="md:col-span-2">
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="Optional" className="min-h-[70px]" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3 pb-10">
              <Button type="button" variant="outline" size="lg" onClick={() => navigate({ to: BACK })} disabled={saving}>Cancel</Button>
              <Button type="submit" size="lg" disabled={saving} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[180px]">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Supplier'}
              </Button>
            </div>
          </form>
        </Form>
      </Main>
    </>
  )
}
