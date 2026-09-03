import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Pill } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateMedicineMutation, useUpdateMedicineMutation, usePharmacyCategoriesQuery } from '@/features/pharmacy/pharmacyQueries'
import type { Medicine } from '@/types/pharmacy.types'

const UNITS = ['Tablet', 'Capsule', 'Bottle', 'Strip', 'Box', 'Vial', 'Syrup', 'Ampoule']

const schema = z.object({
  name: z.string().min(1, 'Required'),
  generic_name: z.string().optional(),
  category_id: z.string().optional(),
  manufacturer: z.string().optional(),
  unit: z.string().optional(),
  unit_price: z.string().min(1, 'Required'),
  reorder_level: z.string().optional(),
  barcode: z.string().optional(),
  tax_rate: z.string().optional(),
  status: z.enum(['active', 'inactive']),
})
type Values = z.infer<typeof schema>

const BACK = '/dashboard/pharmacy/medicines'

export function MedicineForm({ initial }: { initial?: Medicine }) {
  const navigate = useNavigate()
  const create = useCreateMedicineMutation()
  const update = useUpdateMedicineMutation()
  const { data: categories } = usePharmacyCategoriesQuery()
  const editing = !!initial
  const saving = create.isPending || update.isPending

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name || '',
      generic_name: initial?.generic_name || '',
      category_id: initial?.category_id != null ? String(initial.category_id) : '',
      manufacturer: initial?.manufacturer || '',
      unit: initial?.unit || 'Tablet',
      unit_price: initial?.unit_price != null ? String(initial.unit_price) : '',
      reorder_level: initial?.reorder_level != null ? String(initial.reorder_level) : '10',
      barcode: initial?.barcode || '',
      tax_rate: initial?.tax_rate != null ? String(initial.tax_rate) : '0',
      status: initial?.status || 'active',
    },
  })

  const onSubmit = async (values: Values) => {
    const body = {
      ...values,
      category_id: values.category_id ? Number(values.category_id) : null,
      unit_price: Number(values.unit_price) || 0,
      reorder_level: Number(values.reorder_level) || 10,
      barcode: values.barcode?.trim() || null,
      tax_rate: Number(values.tax_rate) || 0,
    }
    try {
      if (editing) { await update.mutateAsync({ id: initial!.id, body }); toast.success('Medicine updated') }
      else { await create.mutateAsync(body); toast.success('Medicine created') }
      navigate({ to: BACK })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Something went wrong')
    }
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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{editing ? 'Edit Medicine' : 'Create Medicine'}</h1>
                <p className="text-muted-foreground text-sm">Catalog details and pricing</p>
              </div>
            </div>

            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><Pill className="w-4 h-4 text-white" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold">Medicine Details</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Name, category, unit and pricing</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g. Paracetamol 500mg" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="generic_name" render={({ field }) => (
                    <FormItem><FormLabel>Generic Name</FormLabel><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="category_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {(categories || []).map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="manufacturer" render={({ field }) => (
                    <FormItem><FormLabel>Manufacturer</FormLabel><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="unit" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="unit_price" render={({ field }) => (
                    <FormItem><FormLabel>Selling Price</FormLabel><FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="reorder_level" render={({ field }) => (
                    <FormItem><FormLabel>Reorder Level</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="barcode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode</FormLabel>
                      <FormControl><Input placeholder="Scan or type — unique" className="font-mono" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="tax_rate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>VAT Rate (%)</FormLabel>
                      <FormControl><Input type="number" step="0.01" min="0" max="100" placeholder="0" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
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
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3 pb-10">
              <Button type="button" variant="outline" size="lg" onClick={() => navigate({ to: BACK })} disabled={saving}>Cancel</Button>
              <Button type="submit" size="lg" disabled={saving} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[180px]">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Medicine'}
              </Button>
            </div>
          </form>
        </Form>
      </Main>
    </>
  )
}
