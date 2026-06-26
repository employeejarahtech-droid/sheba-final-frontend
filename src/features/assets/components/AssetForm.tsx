import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Package } from 'lucide-react'
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
  useCreateAssetMutation, useUpdateAssetMutation,
  useAssetCategoriesQuery, useAssetLocationsQuery,
} from '@/features/assets/assetQueries'
import type { Asset } from '@/types/asset.types'

const schema = z.object({
  asset_code: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  category_id: z.string(),
  location_id: z.string(),
  supplier: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_cost: z.string().optional(),
  salvage_value: z.string().optional(),
  useful_life_years: z.string().optional(),
  depreciation_method: z.enum(['none', 'straight_line']),
  condition: z.enum(['new', 'good', 'fair', 'poor']),
  status: z.enum(['active', 'in_repair', 'retired', 'disposed']),
  description: z.string().optional(),
})
type Values = z.infer<typeof schema>

const BACK = '/dashboard/assets/list'

export function AssetForm({ initial }: { initial?: Asset }) {
  const navigate = useNavigate()
  const { currencySymbol } = useCurrency()
  const { data: categories } = useAssetCategoriesQuery()
  const { data: locations } = useAssetLocationsQuery()
  const create = useCreateAssetMutation()
  const update = useUpdateAssetMutation()
  const editing = !!initial
  const saving = create.isPending || update.isPending

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      asset_code: initial?.asset_code || '',
      name: initial?.name || '',
      category_id: initial?.category_id ? String(initial.category_id) : 'none',
      location_id: initial?.location_id ? String(initial.location_id) : 'none',
      supplier: initial?.supplier || '',
      purchase_date: initial?.purchase_date || '',
      purchase_cost: initial?.purchase_cost != null ? String(initial.purchase_cost) : '',
      salvage_value: initial?.salvage_value != null ? String(initial.salvage_value) : '',
      useful_life_years: initial?.useful_life_years != null ? String(initial.useful_life_years) : '',
      depreciation_method: initial?.depreciation_method || 'straight_line',
      condition: initial?.condition || 'good',
      status: initial?.status || 'active',
      description: initial?.description || '',
    },
  })

  const onSubmit = async (values: Values) => {
    const body = {
      asset_code: values.asset_code,
      name: values.name,
      category_id: values.category_id === 'none' ? null : Number(values.category_id),
      location_id: values.location_id === 'none' ? null : Number(values.location_id),
      supplier: values.supplier || null,
      purchase_date: values.purchase_date || null,
      purchase_cost: Number(values.purchase_cost) || 0,
      salvage_value: Number(values.salvage_value) || 0,
      useful_life_years: Number(values.useful_life_years) || 0,
      depreciation_method: values.depreciation_method,
      condition: values.condition,
      status: values.status,
      description: values.description || null,
    }
    try {
      if (editing) {
        await update.mutateAsync({ id: initial!.id, body })
        toast.success('Asset updated')
      } else {
        await create.mutateAsync(body)
        toast.success('Asset created')
      }
      navigate({ to: BACK, search: { page: 1, limit: 10, search: '' } as any })
    } catch {
      toast.error('Something went wrong')
    }
  }

  return (
    <>
      <AppHeader fixed />
      <Main className="flex flex-1 flex-col gap-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 w-full max-w-[850px] mx-auto px-4">
            <div className="flex items-center gap-4 mb-2">
              <Button type="button" variant="ghost" size="icon" onClick={() => navigate({ to: BACK, search: { page: 1, limit: 10, search: '' } as any })}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {editing ? 'Edit Asset' : 'Create New Asset'}
                </h1>
                <p className="text-muted-foreground text-sm">Add an asset to the register</p>
              </div>
            </div>

            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><Package className="w-4 h-4 text-white" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold">Asset Information</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Identity, classification, purchase & depreciation</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="asset_code" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Code</FormLabel>
                      <FormControl><Input placeholder="e.g. AST-0001" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl><Input placeholder="e.g. ECG Machine" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="category_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="none">Uncategorized</SelectItem>
                          {(categories || []).map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="location_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select location" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {(locations || []).map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="supplier" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <FormControl><Input placeholder="Optional" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="purchase_date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="purchase_cost" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Cost ({currencySymbol})</FormLabel>
                      <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="salvage_value" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salvage Value ({currencySymbol})</FormLabel>
                      <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="useful_life_years" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Useful Life (years)</FormLabel>
                      <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="depreciation_method" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Depreciation Method</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="straight_line">Straight Line</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="condition" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
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
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="in_repair">In Repair</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                          <SelectItem value="disposed">Disposed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="md:col-span-2">
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl><Textarea placeholder="Optional" className="min-h-[80px]" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3 pb-10">
              <Button type="button" variant="outline" size="lg" onClick={() => navigate({ to: BACK, search: { page: 1, limit: 10, search: '' } as any })} disabled={saving}>Cancel</Button>
              <Button type="submit" size="lg" disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[200px]">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Asset'}
              </Button>
            </div>
          </form>
        </Form>
      </Main>
    </>
  )
}
