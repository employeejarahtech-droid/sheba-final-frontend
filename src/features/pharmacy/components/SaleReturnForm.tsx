import { useNavigate } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Undo2, Loader2, Receipt } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateSaleReturnMutation } from '@/features/pharmacy/pharmacyQueries'
import { pharmacyService } from '@/features/pharmacy/pharmacyService'
import { useCurrency } from '@/hooks/use-currency'
import { useDateFormat } from '@/hooks/use-date-format'

const REASONS = ['Wrong Item', 'Patient Changed Mind', 'Adverse Reaction', 'Damaged/Defective', 'Other']
const today = () => new Date().toISOString().slice(0, 10)

export function SaleReturnForm({ saleId }: { saleId: string }) {
  const navigate = useNavigate()
  const { currencySymbol, format } = useCurrency()
  const { formatDateTime } = useDateFormat()
  const create = useCreateSaleReturnMutation()
  const { data: sale, isLoading } = useQuery({
    queryKey: ['pharmacy', 'sale', saleId],
    queryFn: () => pharmacyService.getSale(saleId),
  })

  const { control, handleSubmit, watch } = useForm<{
    return_date: string
    reason: string
    notes: string
    quantities: Record<number, string>
  }>({
    defaultValues: { return_date: today(), reason: '', notes: '', quantities: {} },
  })
  const quantities = watch('quantities') || {}

  const BACK = '/dashboard/pharmacy/sales'

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>
  }
  if (!sale) {
    return <div className="p-6 text-center text-rose-500">Sale not found.</div>
  }
  if (sale.status === 'cancelled') {
    return <div className="p-6 text-center text-rose-500">This sale is cancelled — it cannot be returned against.</div>
  }

  const items = sale.items || []
  const alreadyReturned = (it: (typeof items)[number]) =>
    (it.allocations || []).reduce((s, a) => s + Number(a.quantity_returned || 0), 0)
  const remaining = (it: (typeof items)[number]) => it.quantity - alreadyReturned(it)
  const total = items.reduce((sum, it) => sum + (Number(quantities[it.id!]) || 0) * Number(it.unit_price), 0)
  const due = sale.paid_amount != null ? Number(sale.total_amount) - Number(sale.paid_amount) : 0

  const onSubmit = async (values: any) => {
    const returnItems = items
      .map((it) => ({ sale_item_id: it.id, quantity: Number(values.quantities?.[it.id!] || 0) }))
      .filter((it) => it.quantity > 0)
    if (returnItems.length === 0) { toast.error('Enter a return quantity for at least one item'); return }
    for (const it of returnItems) {
      const original = items.find((o) => o.id === it.sale_item_id)!
      if (it.quantity > remaining(original)) { toast.error(`Return quantity for ${original.medicine?.name} exceeds what's left to return`); return }
    }

    try {
      await create.mutateAsync({
        sale_id: Number(saleId),
        return_date: values.return_date || null,
        reason: values.reason || null,
        notes: values.notes || null,
        items: returnItems,
      } as any)
      toast.success('Sale return recorded')
      navigate({ to: BACK })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record return')
    }
  }

  return (
    <>
      <AppHeader fixed />
      <Main className="flex flex-1 flex-col gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 w-full max-w-[900px] mx-auto px-4">
          <div className="flex items-center gap-4 mb-2">
            <Button type="button" variant="ghost" size="icon" onClick={() => navigate({ to: BACK })}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Return Items</h1>
              <p className="text-muted-foreground text-sm">Sale {sale.sale_no || `#${sale.id}`} — {sale.patient_name || 'Walk-in'}</p>
            </div>
          </div>

          {/* ── Part 1: Old Invoice (read-only) ─────────────────────────── */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><Receipt className="w-4 h-4 text-white" /></div>
                <div>
                  <CardTitle className="text-lg font-bold">Part 1 — Old Invoice</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">What was originally charged on this sale</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Receipt No</p><p className="font-mono font-semibold">{sale.sale_no || `#${sale.id}`}</p></div>
                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{formatDateTime(sale.sale_date)}</p></div>
                <div><p className="text-xs text-muted-foreground">{sale.customer ? 'Customer' : 'Patient'}</p><p className="font-medium truncate">{sale.customer?.name || sale.patient_name || 'Walk-in'}</p></div>
                <div><p className="text-xs text-muted-foreground">Payment Method</p><p className="font-medium">{sale.payment_method || '-'}</p></div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-semibold">Medicine</th>
                      <th className="text-right py-2 font-semibold">Qty</th>
                      <th className="text-right py-2 font-semibold">Price</th>
                      <th className="text-right py-2 font-semibold">Discount</th>
                      <th className="text-right py-2 font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => {
                      const netSubtotal = Number(it.subtotal ?? it.unit_price * it.quantity)
                      const discountAmt = Number(it.discount_amount || 0)
                      const discountPct = Number(it.discount_pct || 0)
                      const grossUnitPrice = discountAmt > 0 ? (netSubtotal + discountAmt) / it.quantity : Number(it.unit_price)
                      return (
                        <tr key={it.id} className="border-b border-dashed last:border-b-0">
                          <td className="py-2">{it.medicine?.name || `Medicine #${it.medicine_id}`}</td>
                          <td className="py-2 text-right">{it.quantity}</td>
                          <td className="py-2 text-right">{format(grossUnitPrice)}</td>
                          <td className="py-2 text-right">{discountAmt > 0 ? `-${format(discountAmt)} (${discountPct}%)` : '-'}</td>
                          <td className="py-2 text-right font-medium">{format(netSubtotal)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="pt-2 text-right text-muted-foreground">Subtotal</td>
                      <td className="pt-2 text-right">{format(sale.subtotal)}</td>
                    </tr>
                    {Number(sale.discount || 0) > 0 && (
                      <tr>
                        <td colSpan={4} className="text-right text-muted-foreground">Discount</td>
                        <td className="text-right">-{format(sale.discount)}</td>
                      </tr>
                    )}
                    {Number(sale.tax_amount || 0) > 0 && (
                      <tr>
                        <td colSpan={4} className="text-right text-muted-foreground">VAT</td>
                        <td className="text-right">{format(sale.tax_amount)}</td>
                      </tr>
                    )}
                    <tr className="border-t">
                      <td colSpan={4} className="pt-2 text-right font-bold">Total</td>
                      <td className="pt-2 text-right font-bold">{format(sale.total_amount)}</td>
                    </tr>
                    {sale.paid_amount != null && (
                      <>
                        <tr>
                          <td colSpan={4} className="text-right text-muted-foreground">Paid</td>
                          <td className="text-right">{format(sale.paid_amount)}</td>
                        </tr>
                        <tr>
                          <td colSpan={4} className="text-right font-semibold text-rose-600">Due</td>
                          <td className="text-right font-semibold text-rose-600">{format(due)}</td>
                        </tr>
                      </>
                    )}
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ── Part 2: Return items ─────────────────────────────────────── */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-rose-500 to-red-500 rounded-lg shadow-lg"><Undo2 className="w-4 h-4 text-white" /></div>
                <div>
                  <CardTitle className="text-lg font-bold">Part 2 — Return Items</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Quantity per item, up to what's left to return</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Return Date</label>
                  <Controller control={control} name="return_date" render={({ field }) => (
                    <DateField value={field.value} onChange={field.onChange} placeholder="Return date" className="w-full" />
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
              </div>

              <div className="space-y-3">
                {items.map((it) => {
                  const left = remaining(it)
                  const returnedSoFar = alreadyReturned(it)
                  return (
                    <div key={it.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-2 items-center border-b pb-3 last:border-b-0 last:pb-0">
                      <div>
                        <p className="font-medium">{it.medicine?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Sold: {it.quantity} @ {currencySymbol} {Number(it.unit_price).toFixed(2)}
                          {returnedSoFar > 0 && <span className="text-amber-600"> · Already returned: {returnedSoFar}</span>}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Return Qty {left <= 0 && '(fully returned)'}</label>
                        <Controller control={control} name={`quantities.${it.id}` as any} render={({ field }) => (
                          <Input type="number" min="0" max={left} placeholder="0" disabled={left <= 0} {...field} />
                        )} />
                      </div>
                      <div className="text-sm text-right text-muted-foreground">
                        Refund: {currencySymbol} {((Number(quantities[it.id!]) || 0) * Number(it.unit_price)).toFixed(2)}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Controller control={control} name="notes" render={({ field }) => (
                  <Textarea placeholder="Optional" className="min-h-[60px]" {...field} />
                )} />
              </div>

              <div className="flex justify-end">
                <div className="text-sm font-semibold">
                  Total Refund: <span className="text-lg text-rose-600">{currencySymbol} {total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3 pb-10">
            <Button type="button" variant="outline" size="lg" onClick={() => navigate({ to: BACK })} disabled={create.isPending}>Cancel</Button>
            <Button type="submit" size="lg" disabled={create.isPending} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[180px]">
              {create.isPending ? 'Saving…' : 'Record Return'}
            </Button>
          </div>
        </form>
      </Main>
    </>
  )
}
