import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Wallet, PackageCheck, Undo2 } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'
import { LedgerTable } from '@/features/pharmacy/components/LedgerTable'
import { PaymentDialog } from '@/features/pharmacy/components/PaymentDialog'
import { useSupplierLedgerQuery } from '@/features/pharmacy/pharmacyQueries'
import { useCurrency } from '@/hooks/use-currency'

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/supplier-dues/$id/')({
  component: SupplierLedgerPage,
})

function SupplierLedgerPage() {
  const { id } = Route.useParams()
  const { format } = useCurrency()
  const { data, isLoading } = useSupplierLedgerQuery(id)
  const [payOpen, setPayOpen] = useState(false)

  if (isLoading) {
    return <div className="p-10 text-center text-muted-foreground">Loading…</div>
  }
  if (!data) {
    return <div className="p-10 text-center text-rose-500">Supplier not found</div>
  }

  const entries = data.entries || []
  const purchased = entries.filter((e) => e.type === 'stock_in').reduce((s, e) => s + e.debit, 0)
  const returned = entries.filter((e) => e.type === 'purchase_return').reduce((s, e) => s + e.credit, 0)
  const paid = entries.filter((e) => e.type === 'payment').reduce((s, e) => s + e.credit, 0)

  const cards = [
    { label: 'Current Payable', value: format(data.balance), icon: Wallet, gradientClass: data.balance > 0 ? 'from-rose-500 to-red-500 shadow-rose-500/20' : 'from-emerald-500 to-teal-500 shadow-emerald-500/20' },
    { label: 'Total Purchased', value: format(purchased), icon: PackageCheck, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Returned', value: format(returned), icon: Undo2, gradientClass: 'from-amber-500 to-orange-500 shadow-amber-500/20' },
    { label: 'Paid', value: format(paid), icon: Wallet, gradientClass: 'from-violet-500 to-purple-500 shadow-violet-500/20' },
  ]

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <Link to="/dashboard/pharmacy/supplier-dues">
              <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{data.supplier.name}</h1>
              <p className="text-sm text-muted-foreground">
                Payable ledger {data.supplier.phone ? `· ${data.supplier.phone}` : ''}
              </p>
            </div>
          </div>
          <Button onClick={() => setPayOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">Record Payment</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map((c) => <SummaryCard key={c.label} title={c.label} value={c.value} icon={c.icon} gradientClass={c.gradientClass} />)}
        </div>

        <LedgerTable entries={entries} />

        <PaymentDialog
          open={payOpen}
          onOpenChange={setPayOpen}
          mode="supplier"
          targetId={data.supplier.id}
          targetName={data.supplier.name}
          currentDue={data.balance}
        />
      </Main>
    </>
  )
}
