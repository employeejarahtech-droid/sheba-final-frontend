import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ArrowLeft, ClipboardList, PackageCheck, Trash2 } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DateField } from '@/components/date-field'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  useCancelPurchaseOrderMutation, usePurchaseOrderQuery, useReceivePurchaseOrderMutation,
} from '@/features/pharmacy/pharmacyQueries'
import { useCurrency } from '@/hooks/use-currency'
import { useDateFormat } from '@/hooks/use-date-format'

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/purchase-orders/$id/')({
  component: PurchaseOrderDetailPage,
})

type ReceiveLine = { medicine_id: number; name: string; outstanding: number; quantity: string; batch_no: string; expiry_date: string; purchase_price: string }

function PurchaseOrderDetailPage() {
  const { id } = Route.useParams()
  const { format } = useCurrency()
  const { formatDate } = useDateFormat()
  // formatDate() needs a Date — DATEONLY strings arrive as 'YYYY-MM-DD'
  const fmtDate = (v?: string | null) => (v ? formatDate(new Date(v)) : '—')
  const { data: po, isLoading } = usePurchaseOrderQuery(id)
  const cancelMut = useCancelPurchaseOrderMutation()
  const receiveMut = useReceivePurchaseOrderMutation()

  const [receiveOpen, setReceiveOpen] = useState(false)
  const [lines, setLines] = useState<ReceiveLine[]>([])
  const [invoiceNo, setInvoiceNo] = useState('')
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().slice(0, 10))
  const [paidNow, setPaidNow] = useState('')

  const openReceive = () => {
    setInvoiceNo('')
    setReceiveDate(new Date().toISOString().slice(0, 10))
    setPaidNow('')
    setLines((po?.items || [])
      .filter((it) => Number(it.quantity) - Number(it.received_quantity) > 0)
      .map((it) => ({
        medicine_id: it.medicine_id,
        name: it.medicine?.name || `#${it.medicine_id}`,
        outstanding: Number(it.quantity) - Number(it.received_quantity),
        quantity: String(Number(it.quantity) - Number(it.received_quantity)),
        batch_no: '',
        expiry_date: '',
        purchase_price: String(it.unit_price),
      })))
    setReceiveOpen(true)
  }

  const receiveTotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.purchase_price) || 0), 0)

  const submitReceive = async () => {
    const items = lines
      .filter((l) => Number(l.quantity) > 0)
      .map((l) => ({
        medicine_id: l.medicine_id,
        quantity: Number(l.quantity),
        batch_no: l.batch_no || null,
        expiry_date: l.expiry_date || null,
        purchase_price: l.purchase_price !== '' ? Number(l.purchase_price) : undefined,
      }))
    if (items.length === 0) { toast.error('Enter a quantity on at least one line'); return }
    for (const l of lines) {
      if (Number(l.quantity) > l.outstanding) {
        toast.error(`${l.name}: only ${l.outstanding} still outstanding on this PO`)
        return
      }
    }
    try {
      await receiveMut.mutateAsync({
        id,
        body: {
          stock_in_date: receiveDate || null,
          invoice_no: invoiceNo || null,
          paid_amount: paidNow === '' ? null : Number(paidNow),
          items,
        },
      })
      toast.success('Goods received into batch stock')
      setReceiveOpen(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to receive')
    }
  }

  const doCancel = async () => {
    if (!window.confirm('Cancel this purchase order? Only possible when nothing was received yet.')) return
    try {
      await cancelMut.mutateAsync(id)
      toast.success('Purchase order cancelled')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel')
    }
  }

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>
  if (!po) return <div className="p-10 text-center text-rose-500">Purchase order not found</div>

  const canReceive = po.status === 'ordered' || po.status === 'partially_received'
  const canCancel = po.status === 'draft' || po.status === 'ordered'
  const outstandingUnits = (po.items || []).reduce((s, it) => s + (Number(it.quantity) - Number(it.received_quantity)), 0)

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="w-full max-w-[1000px] mx-auto px-4 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to="/dashboard/pharmacy/purchase-orders">
                <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{po.po_no || `PO #${po.id}`}</h1>
                <p className="text-sm text-muted-foreground">
                  {po.supplier?.name || 'No supplier'} · ordered {fmtDate(po.order_date)}
                  {po.expected_date ? ` · expected ${fmtDate(po.expected_date)}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={po.status === 'cancelled' ? 'destructive' : 'secondary'} className="capitalize">
                {po.status.replace('_', ' ')}
              </Badge>
              {canReceive && <Button onClick={openReceive} className="bg-emerald-600 hover:bg-emerald-700 text-white"><PackageCheck className="mr-2 h-4 w-4" /> Receive</Button>}
              {canCancel && <Button variant="outline" onClick={doCancel} disabled={cancelMut.isPending}><Trash2 className="mr-2 h-4 w-4" /> Cancel PO</Button>}
            </div>
          </div>

          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><ClipboardList className="w-4 h-4 text-white" /></div>
                <div>
                  <CardTitle className="text-lg font-bold">Ordered Items</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {outstandingUnits > 0 ? `${outstandingUnits} units still outstanding` : 'fully received'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="px-4 py-2 font-medium">Medicine</th>
                    <th className="px-4 py-2 font-medium text-right">Ordered</th>
                    <th className="px-4 py-2 font-medium text-right">Received</th>
                    <th className="px-4 py-2 font-medium text-right">Outstanding</th>
                    <th className="px-4 py-2 font-medium text-right">Cost / Unit</th>
                    <th className="px-4 py-2 font-medium text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(po.items || []).map((it) => {
                    const out = Number(it.quantity) - Number(it.received_quantity)
                    return (
                      <tr key={it.id} className="border-b last:border-0">
                        <td className="px-4 py-2">{it.medicine?.name || `#${it.medicine_id}`}</td>
                        <td className="px-4 py-2 text-right">{it.quantity}</td>
                        <td className="px-4 py-2 text-right">{it.received_quantity}</td>
                        <td className={`px-4 py-2 text-right font-medium ${out > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{out}</td>
                        <td className="px-4 py-2 text-right">{format(Number(it.unit_price))}</td>
                        <td className="px-4 py-2 text-right">{format(Number(it.quantity) * Number(it.unit_price))}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/30">
                    <td colSpan={5} className="px-4 py-2 text-right font-semibold">Total</td>
                    <td className="px-4 py-2 text-right font-bold">{format(Number(po.total_amount))}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {(po.stockIns || []).length > 0 && (
            <Card className="gap-0 shadow-none p-0">
              <CardHeader className="border-b py-3 px-4">
                <CardTitle className="text-base font-bold">Goods Receipts Against This PO</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {po.stockIns.map((si) => (
                  <div key={si.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 text-sm">
                    <span className="font-mono">{si.stock_in_no || `#${si.id}`}</span>
                    <span className="text-muted-foreground">{si.stock_in_date ? formatDate(new Date(si.stock_in_date)) : ''}</span>
                    <span className="font-medium">{format(Number(si.total_amount))}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {po.notes && <p className="text-sm text-muted-foreground">Notes: {po.notes}</p>}
        </div>
      </Main>

      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="sm:max-w-[820px]">
          <DialogHeader>
            <DialogTitle>Receive Goods — {po.po_no || `PO #${po.id}`}</DialogTitle>
            <DialogDescription>
              Quantities default to the outstanding amounts. Batch and expiry create real batch stock (FEFO).
              Leave cost blank to use the PO price.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Invoice No.</label>
              <Input placeholder="Supplier's invoice" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">Receive Date</label>
              <DateField value={receiveDate} onChange={setReceiveDate} placeholder="Today" className="w-full" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Paid Now</label>
              <Input type="number" step="0.01" min="0" placeholder="Blank = fully paid" value={paidNow} onChange={(e) => setPaidNow(e.target.value)} />
            </div>
          </div>
          <div className="max-h-[46vh] overflow-y-auto space-y-3 pr-1">
            {lines.map((l, idx) => (
              <div key={l.medicine_id} className="grid grid-cols-1 md:grid-cols-[2fr_0.8fr_1fr_1fr_0.9fr] gap-2 items-end border-b pb-2">
                <div>
                  <p className="text-sm font-medium truncate">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{l.outstanding} outstanding</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Qty</label>
                  <Input type="number" min="0" max={l.outstanding} value={l.quantity}
                    onChange={(e) => setLines(lines.map((x, i) => i === idx ? { ...x, quantity: e.target.value } : x))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Batch No.</label>
                  <Input placeholder="Optional" value={l.batch_no}
                    onChange={(e) => setLines(lines.map((x, i) => i === idx ? { ...x, batch_no: e.target.value } : x))} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs text-muted-foreground">Expiry</label>
                  <DateField value={l.expiry_date} onChange={(v) => setLines(lines.map((x, i) => i === idx ? { ...x, expiry_date: v } : x))} placeholder="Optional" className="w-full" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Cost / Unit</label>
                  <Input type="number" step="0.01" min="0" value={l.purchase_price}
                    onChange={(e) => setLines(lines.map((x, i) => i === idx ? { ...x, purchase_price: e.target.value } : x))} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">Set qty 0 to skip a line</span>
            <span className="text-sm font-semibold">Receiving total: {format(receiveTotal)}</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveOpen(false)} disabled={receiveMut.isPending}>Cancel</Button>
            <Button onClick={submitReceive} disabled={receiveMut.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {receiveMut.isPending ? 'Receiving…' : 'Receive Into Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
