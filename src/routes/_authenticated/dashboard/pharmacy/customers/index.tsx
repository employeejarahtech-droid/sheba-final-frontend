import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Users, Wallet, AlertTriangle, Plus } from 'lucide-react'
import { z } from 'zod'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/DataTable'
import { SummaryCard } from '@/features/pharmacy/components/SummaryCard'
import { PaymentDialog } from '@/features/pharmacy/components/PaymentDialog'
import {
  useCustomerDuesQuery, useCreatePharmacyCustomerMutation, useDeletePharmacyCustomerMutation,
  useUpdatePharmacyCustomerMutation,
} from '@/features/pharmacy/pharmacyQueries'
import { useCurrency } from '@/hooks/use-currency'
import { useCan } from '@/hooks/use-can'
import type { CustomerDueRow } from '@/types/pharmacy.types'

const searchSchema = z.object({
  page: z.coerce.number().catch(1),
  limit: z.coerce.number().catch(10),
  search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/dashboard/pharmacy/customers/')({
  validateSearch: (search) => searchSchema.parse(search),
  component: PharmacyCustomersPage,
})

function PharmacyCustomersPage() {
  const can = useCan()
  const canEdit = can('pharmacy.customers.edit')
  const { format } = useCurrency()
  const searchParams = Route.useSearch()
  const navigate = Route.useNavigate()

  const page = searchParams.page
  const limit = searchParams.limit
  const search = searchParams.search

  const setPage = (newPage: number) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) })
  const setLimit = (newLimit: number) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) })
  const setSearch = (newSearch: string) =>
    navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) })

  const { data: dues, isFetching } = useCustomerDuesQuery()
  const create = useCreatePharmacyCustomerMutation()
  const update = useUpdatePharmacyCustomerMutation()
  const del = useDeletePharmacyCustomerMutation()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CustomerDueRow | null>(null)
  const [payTarget, setPayTarget] = useState<CustomerDueRow | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'Walk In' | 'Admitted'>('all')

  // Add/Edit dialog fields (kept simple — plain state, not a form library)
  const [fName, setFName] = useState('')
  const [fPhone, setFPhone] = useState('')
  const [fAddress, setFAddress] = useState('')
  const [fStatus, setFStatus] = useState('active')

  const openForm = (row: CustomerDueRow | null) => {
    setEditing(row)
    setFName(row?.name || '')
    setFPhone(row?.phone || '')
    setFAddress('')
    setFStatus(row?.status || 'active')
    setFormOpen(true)
  }

  const submitForm = async () => {
    if (!fName.trim()) { toast.error('Name is required'); return }
    const body = { name: fName.trim(), phone: fPhone || null, address: fAddress || null, status: fStatus }
    try {
      if (editing) { await update.mutateAsync({ id: editing.id, body }); toast.success('Customer updated') }
      else { await create.mutateAsync(body as any); toast.success('Customer added') }
      setFormOpen(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save customer')
    }
  }

  const delRef = useRef(del)
  delRef.current = del
  useEffect(() => {
    const handler = async (e: Event) => {
      const btn = (e.target as HTMLElement).closest('.js-ph-cust-del') as HTMLElement | null
      if (!btn) return
      const id = btn.dataset.id
      if (!id) return
      if (!window.confirm('Delete this customer? Customers with sales history cannot be deleted — deactivate instead.')) return
      try { await delRef.current.mutateAsync(id); toast.success('Customer deleted') }
      catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to delete') }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const all = dues || []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return all
      .filter((c) => typeFilter === 'all' || c.customer_type === typeFilter)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q))
  }, [all, search, typeFilter])

  const start = (page - 1) * limit
  const pageItems = filtered.slice(start, start + limit)

  const totalDue = all.reduce((s, c) => s + c.due, 0)
  const cards = useMemo(() => ([
    { label: 'Customers', value: all.length, icon: Users, gradientClass: 'from-blue-500 to-indigo-500 shadow-blue-500/20' },
    { label: 'Total Due', value: format(totalDue), icon: Wallet, gradientClass: 'from-rose-500 to-red-500 shadow-rose-500/20' },
    { label: 'With Due', value: all.filter((c) => c.due > 0.004).length, icon: AlertTriangle, gradientClass: 'from-amber-500 to-orange-500 shadow-amber-500/20' },
  ]), [all, totalDue, format])

  const columns = useMemo(() => [
    { data: 'name', title: 'Customer', orderable: true, render: (d: any) => `<span class="font-medium">${d}</span>` },
    { data: 'phone', title: 'Phone', orderable: false, render: (d: any) => d || '<span class="text-muted-foreground">—</span>' },
    {
      data: 'customer_type', title: 'Customer Type', orderable: true,
      render: (d: any, _t: string, row: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full ${d === 'Admitted' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}">${d === 'Admitted' ? `Admitted - #${row.admission_id}` : d}</span>`,
    },
    { data: 'sales_count', title: 'Sales', orderable: true },
    { data: 'sales_total', title: 'Sales Value', orderable: true, render: (d: any) => format(Number(d || 0)) },
    { data: 'payments_total', title: 'Payments', orderable: true, render: (d: any) => format(Number(d || 0)) },
    {
      data: 'due', title: 'Due', orderable: true,
      render: (d: any) => {
        const v = Number(d)
        const cls = v > 0.004 ? 'font-semibold text-rose-600' : v < -0.004 ? 'font-semibold text-emerald-600' : 'text-muted-foreground'
        return `<span class="${cls}">${format(v)}</span>`
      },
    },
    {
      data: 'status', title: 'Status', orderable: true,
      render: (d: any) => `<span class="px-2 py-1 text-xs font-semibold rounded-full capitalize ${d === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}">${d}</span>`,
    },
    {
      data: null, title: 'Actions', orderable: false,
      render: (_d: any, _t: string, row: any) => `
        <div class="flex gap-2">
          <a href="/dashboard/pharmacy/customers/${row.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3">Ledger</a>
          <button type="button" class="js-ph-cust-pay inline-flex items-center justify-center rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 h-8 px-3" data-id="${row.id}">Payment</button>
          ${canEdit ? `<button type="button" class="js-ph-cust-edit inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3" data-id="${row.id}">Edit</button>` : ''}
          ${canEdit ? `<button type="button" class="js-ph-cust-del inline-flex items-center justify-center rounded-md text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 h-8 px-3" data-id="${row.id}">Delete</button>` : ''}
        </div>`,
    },
  ], [format, canEdit])

  useEffect(() => {
    const handler = (e: Event) => {
      const payBtn = (e.target as HTMLElement).closest('.js-ph-cust-pay') as HTMLElement | null
      if (payBtn) {
        const row = all.find((c) => String(c.id) === payBtn.dataset.id)
        if (row) setPayTarget(row)
        return
      }
      const editBtn = (e.target as HTMLElement).closest('.js-ph-cust-edit') as HTMLElement | null
      if (editBtn) {
        const row = all.find((c) => String(c.id) === editBtn.dataset.id)
        if (row) openForm(row)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [all])

  return (
    <>
      <AppHeader fixed />
      <Main>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pharmacy Customers</h1>
            <p className="text-sm text-muted-foreground">Credit accounts, dues and payments</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as typeof typeFilter); setPage(1) }}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Walk In">Walk In</SelectItem>
                <SelectItem value="Admitted">Admitted</SelectItem>
              </SelectContent>
            </Select>
            {canEdit && (
              <Button onClick={() => openForm(null)}><Plus className="mr-2 h-4 w-4" /> Add Customer</Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {cards.map((c) => <SummaryCard key={c.label} title={c.label} value={c.value} icon={c.icon} gradientClass={c.gradientClass} />)}
        </div>

        <DataTable
          columns={columns}
          data={pageItems}
          meta={{ page, limit, total: filtered.length }}
          search={search}
          onSearchChange={setSearch}
          onPageChange={setPage}
          onLimitChange={setLimit}
          isLoading={isFetching}
          hideExport
        />

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
              <DialogDescription>Credit account for pharmacy sales</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Customer / company name" autoFocus />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input value={fPhone} onChange={(e) => setFPhone(e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Textarea value={fAddress} onChange={(e) => setFAddress(e.target.value)} placeholder="Optional" className="min-h-[60px]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={fStatus} onValueChange={setFStatus}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={create.isPending || update.isPending}>Cancel</Button>
              <Button onClick={submitForm} disabled={create.isPending || update.isPending}>
                {(create.isPending || update.isPending) ? 'Saving…' : editing ? 'Save Changes' : 'Add Customer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {payTarget && (
          <PaymentDialog
            open={!!payTarget}
            onOpenChange={(v) => !v && setPayTarget(null)}
            mode="customer"
            targetId={payTarget.id}
            targetName={payTarget.name}
            currentDue={payTarget.due}
          />
        )}
      </Main>
    </>
  )
}
