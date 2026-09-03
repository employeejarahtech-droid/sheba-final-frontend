import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Printer } from 'lucide-react'
import { pharmacyService } from '@/features/pharmacy/pharmacyService'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { useCurrency } from '@/hooks/use-currency'
import { useDateFormat } from '@/hooks/use-date-format'
import { getCookie } from '@/lib/cookies'

const API_URL = import.meta.env.VITE_API_URL

type CompanySettings = {
  company_name?: string
  address1?: string | null
  address2?: string | null
  phone?: string | null
  email?: string | null
}

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/sales/$id/print')({
  component: SalePrintPage,
})

function SalePrintPage() {
  const { id } = Route.useParams()
  const { format, currencySymbol } = useCurrency()
  const { formatDateTime } = useDateFormat()
  const token = getCookie('accessToken')
  const { data: sale, isLoading } = useQuery({
    queryKey: ['pharmacy', 'sale', id],
    queryFn: () => pharmacyService.getSale(id),
  })
  // Shares the ['company-settings'] query key with CurrencyProvider (loaded
  // app-wide), so this is usually already cached — no extra round trip.
  const { data: company } = useQuery<CompanySettings>({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/company-settings`, { headers: { Authorization: `Bearer ${token}` } })
      const result = await res.json()
      return result.data
    },
    enabled: !!token,
  })

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>
  }
  if (!sale) {
    return <div className="min-h-screen flex items-center justify-center text-rose-500">Sale not found</div>
  }

  const items = sale.items || []
  const isCancelled = sale.status === 'cancelled'
  const hasReturns = items.some((it) => (it.allocations || []).some((a) => Number(a.quantity_returned || 0) > 0))
  const canEdit = !isCancelled && !hasReturns
  const due = sale.paid_amount != null ? Number(sale.total_amount) - Number(sale.paid_amount) : 0
  // Effective/blended rate for display only (a cart can mix differently-taxed
  // lines) — mirrors the same estimate shown live on the Sale create form.
  const taxBase = Math.max(0, Number(sale.subtotal || 0) - Number(sale.discount || 0))
  const taxPct = taxBase > 0 ? Math.round((Number(sale.tax_amount || 0) / taxBase) * 10000) / 100 : 0

  return (
    <>
      <AppHeader fixed className="print:hidden" />
      <Main className="flex flex-1 flex-col">
        <style>{`
          @media print {
            @page { size: 80mm auto; margin: 0; }
            html, body { background: #fff !important; }
          }
        `}</style>

        <div className="print:hidden flex items-center justify-between gap-4 max-w-md w-full mx-auto mt-6 mb-4 px-4">
          <Link to="/dashboard/pharmacy/sales">
            <Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
          </Link>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link to="/dashboard/pharmacy/sales/$id/edit" params={{ id: String(sale.id) }}>
                <Button variant="outline" size="sm"><Pencil className="mr-2 h-4 w-4" />Edit</Button>
              </Link>
            )}
            <Button size="sm" onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
              <Printer className="mr-2 h-4 w-4" />Print Receipt
            </Button>
          </div>
        </div>

        <div className="flex-1 print:bg-white flex justify-center py-6 print:py-0">
          <div
            className="bg-white text-black shadow-lg print:shadow-none"
            style={{ width: '80mm', padding: '3mm 4mm', fontFamily: "'Courier New', ui-monospace, monospace" }}
          >
            {/* Header */}
            <div className="text-center pb-1.5 mb-1.5 border-b border-dashed border-black">
              <p className="text-[13px] font-bold uppercase tracking-wide leading-tight">{company?.company_name || 'Pharmacy'}</p>
              {company?.address1 && <p className="text-[10px] leading-tight">{company.address1}</p>}
              {company?.address2 && <p className="text-[10px] leading-tight">{company.address2}</p>}
              {(company?.phone || company?.email) && (
                <p className="text-[10px] leading-tight">{[company?.phone, company?.email].filter(Boolean).join(' · ')}</p>
              )}
              <p className="text-[11px] font-semibold mt-1">SALE RECEIPT</p>
            </div>

            {isCancelled && (
              <p className="text-center text-[12px] font-bold border border-black py-0.5 mb-1.5">*** CANCELLED ***</p>
            )}

            {/* Meta */}
            <div className="text-[10.5px] leading-tight space-y-0.5 mb-1.5 pb-1.5 border-b border-dashed border-black">
              <div className="flex justify-between"><span>Receipt No:</span><span className="font-semibold">{sale.sale_no || `#${sale.id}`}</span></div>
              <div className="flex justify-between"><span>Date:</span><span>{formatDateTime(sale.sale_date)}</span></div>
              <div className="flex justify-between">
                <span>{sale.customer ? 'Customer:' : 'Patient:'}</span>
                <span className="font-semibold truncate ml-2">{sale.customer?.name || sale.patient_name || 'Walk-in'}</span>
              </div>
              {(sale.customer?.phone || sale.phone) && (
                <div className="flex justify-between"><span>Phone:</span><span>{sale.customer?.phone || sale.phone}</span></div>
              )}
            </div>

            {/* Items */}
            <div className="text-[10.5px] mb-1.5 pb-1.5 border-b border-dashed border-black">
              {items.map((it, idx) => {
                const netSubtotal = Number(it.subtotal ?? it.unit_price * it.quantity)
                const discountAmt = Number(it.discount_amount || 0)
                const discountPct = Number(it.discount_pct || 0)
                const grossUnitPrice = discountAmt > 0 ? (netSubtotal + discountAmt) / it.quantity : Number(it.unit_price)
                return (
                  <div key={idx} className={idx > 0 ? 'mt-1.5' : ''}>
                    <p className="font-semibold leading-tight break-words">{it.medicine?.name || `Medicine #${it.medicine_id}`}</p>
                    {(it.allocations || []).map((a) => (
                      <p key={a.id} className="text-[9px] text-gray-600 leading-tight">
                        Batch {a.batch?.batch_no || `#${a.batch_id}`} × {a.quantity}
                      </p>
                    ))}
                    {discountAmt > 0 ? (
                      <>
                        <div className="flex justify-between leading-tight">
                          <span>Price: {format(grossUnitPrice)} × {it.quantity}</span>
                          <span>{format(grossUnitPrice * it.quantity)}</span>
                        </div>
                        <div className="flex justify-between leading-tight">
                          <span>Discount ({discountPct}%)</span>
                          <span>-{format(discountAmt)}</span>
                        </div>
                        <div className="flex justify-between leading-tight font-semibold">
                          <span>Total</span>
                          <span>{format(netSubtotal)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between leading-tight">
                        <span>{it.quantity} × {format(grossUnitPrice)}</span>
                        <span className="font-semibold">{format(netSubtotal)}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Totals */}
            <div className="text-[10.5px] leading-tight space-y-0.5 mb-1.5 pb-1.5 border-b border-dashed border-black">
              <div className="flex justify-between"><span>Subtotal</span><span>{format(sale.subtotal)}</span></div>
              {Number(sale.discount || 0) > 0 && (
                <div className="flex justify-between"><span>Discount</span><span>-{format(sale.discount)}</span></div>
              )}
              {Number(sale.tax_amount || 0) > 0 && (
                <div className="flex justify-between"><span>VAT ({taxPct}%)</span><span>{format(sale.tax_amount)}</span></div>
              )}
            </div>
            <div className="text-[12px] font-bold flex justify-between mb-1.5 pb-1.5 border-b border-dashed border-black">
              <span>TOTAL ({currencySymbol})</span><span>{format(sale.total_amount)}</span>
            </div>
            {sale.paid_amount != null && (
              <div className="text-[10.5px] leading-tight space-y-0.5 mb-1.5 pb-1.5 border-b border-dashed border-black">
                <div className="flex justify-between"><span>Paid</span><span>{format(sale.paid_amount)}</span></div>
                <div className="flex justify-between font-bold"><span>Due</span><span>{format(due)}</span></div>
              </div>
            )}

            {/* Payment method */}
            <div className="text-[10.5px] flex justify-between mb-2">
              <span>Payment:</span>
              <span className="font-semibold">{sale.payment_method || '-'}</span>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] leading-tight pt-1.5 border-t border-dashed border-black">
              {isCancelled ? (
                <p>This sale has been cancelled.</p>
              ) : (
                <>
                  <p className="font-semibold">Thank you for your purchase!</p>
                  <p>Please keep this receipt for any returns.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}
