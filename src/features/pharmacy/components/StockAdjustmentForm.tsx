import { useNavigate } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { ArrowLeft, ClipboardEdit } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateStockAdjustmentMutation, useMedicinesQuery } from '@/features/pharmacy/pharmacyQueries'

const REASONS = ['Damage', 'Expired', 'Loss/Theft', 'Recount', 'Other']

type Values = {
  medicine_id: string
  adjustment_type: 'increase' | 'decrease'
  quantity: string
  reason: string
  notes: string
}

const BACK = '/dashboard/pharmacy/stock-adjustments'

export function StockAdjustmentForm() {
  const navigate = useNavigate()
  const create = useCreateStockAdjustmentMutation()
  const { data: medicinesResult } = useMedicinesQuery({ limit: 500 })
  const medicines = medicinesResult?.rows || []
  const medicineById = new Map(medicines.map((m) => [String(m.id), m]))

  const { control, handleSubmit, watch } = useForm<Values>({
    defaultValues: {
      medicine_id: '',
      adjustment_type: 'decrease',
      quantity: '',
      reason: '',
      notes: '',
    },
  })
  const medicineId = watch('medicine_id')
  const selected = medicineById.get(medicineId)

  const onSubmit = async (values: Values) => {
    if (!values.medicine_id) { toast.error('Select a medicine'); return }
    if (!values.reason) { toast.error('Select a reason'); return }
    const qty = Number(values.quantity)
    if (!qty || qty <= 0) { toast.error('Enter a positive quantity'); return }

    try {
      await create.mutateAsync({
        medicine_id: Number(values.medicine_id),
        adjustment_type: values.adjustment_type,
        quantity: qty,
        reason: values.reason as any,
        notes: values.notes || null,
      })
      toast.success('Stock adjustment recorded')
      navigate({ to: BACK })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record adjustment')
    }
  }

  return (
    <>
      <AppHeader fixed />
      <Main className="flex flex-1 flex-col gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 w-full max-w-[700px] mx-auto px-4">
          <div className="flex items-center gap-4 mb-2">
            <Button type="button" variant="ghost" size="icon" onClick={() => navigate({ to: BACK })}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Stock Adjustment</h1>
              <p className="text-muted-foreground text-sm">Correct stock for damage, loss, or a physical recount</p>
            </div>
          </div>

          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-lg"><ClipboardEdit className="w-4 h-4 text-white" /></div>
                <div>
                  <CardTitle className="text-lg font-bold">Adjustment Details</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Medicine, direction, quantity and reason</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Medicine</label>
                  <Controller control={control} name="medicine_id" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select medicine" /></SelectTrigger>
                      <SelectContent>
                        {medicines.map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.name} · stock: {m.stock_quantity}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                  {selected && <p className="text-xs text-muted-foreground">Current stock: {selected.stock_quantity} {selected.unit || ''}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Direction</label>
                  <Controller control={control} name="adjustment_type" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="increase">Increase (+)</SelectItem>
                        <SelectItem value="decrease">Decrease (−)</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Controller control={control} name="quantity" render={({ field }) => (
                    <Input type="number" min="1" placeholder="0" {...field} />
                  )} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Reason</label>
                  <Controller control={control} name="reason" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select reason" /></SelectTrigger>
                      <SelectContent>
                        {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Controller control={control} name="notes" render={({ field }) => (
                    <Textarea placeholder="Optional detail" className="min-h-[70px]" {...field} />
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3 pb-10">
            <Button type="button" variant="outline" size="lg" onClick={() => navigate({ to: BACK })} disabled={create.isPending}>Cancel</Button>
            <Button type="submit" size="lg" disabled={create.isPending} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[180px]">
              {create.isPending ? 'Saving…' : 'Record Adjustment'}
            </Button>
          </div>
        </form>
      </Main>
    </>
  )
}
