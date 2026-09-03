import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useFieldArray, useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { ArrowLeft, Receipt, Plus, Trash2, ScanLine, PauseCircle, PlayCircle, Check, ChevronsUpDown } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DateField } from '@/components/date-field'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import {
  useAdmittedPatientsQuery, useCreateHeldBillMutation, useCreateSaleMutation, useDeleteHeldBillMutation,
  useHeldBillsQuery, useMedicinesQuery, usePharmacyCustomersQuery, usePharmacyTaxModeQuery,
  useResolveCustomerFromAdmissionMutation, useShiftsQuery, useUpdateSaleMutation,
} from '@/features/pharmacy/pharmacyQueries'
import { pharmacyService } from '@/features/pharmacy/pharmacyService'
import { useCurrency } from '@/hooks/use-currency'
import { useLiveUser } from '@/hooks/use-live-user'
import type { AdmittedPatient, Medicine } from '@/types/pharmacy.types'

type ItemValues = {
  medicine_id: string
  quantity: string
  unit_price: string
  discount: string
}
type Values = {
  customer_id: string
  patient_name: string
  phone: string
  sale_date: string
  payment_method: string
  discount: string
  tax_override: string
  paid_now: string
  items: ItemValues[]
}

const BACK = '/dashboard/pharmacy/sales'
const today = () => new Date().toISOString().slice(0, 10)
const emptyItem: ItemValues = { medicine_id: '', quantity: '1', unit_price: '', discount: '0' }
const PAYMENT_METHODS = ['Cash', 'Credit']

/** Line-level discount is a PERCENTAGE (0–100) of that line's gross total,
 *  folded into an effective per-unit price on submit — the backend has no
 *  separate item-discount column, and treats a reduced unit_price as the
 *  discount (mirrors how a cashier would otherwise just type a lower unit
 *  price). */
const lineGross = (it: ItemValues) => (Number(it.quantity) || 0) * (Number(it.unit_price) || 0)
const lineDiscountPct = (it: ItemValues) => Math.min(Math.max(Number(it.discount) || 0, 0), 100)
const lineDiscountAmt = (it: ItemValues) => Math.round(lineGross(it) * (lineDiscountPct(it) / 100) * 100) / 100
const lineNet = (it: ItemValues) => Math.max(0, lineGross(it) - lineDiscountAmt(it))
const lineNetUnitPrice = (it: ItemValues) => {
  const qty = Number(it.quantity) || 0
  if (qty <= 0) return Number(it.unit_price) || 0
  return Math.round((lineNet(it) / qty) * 100) / 100
}

export function SaleForm({ saleId }: { saleId?: string | number } = {}) {
  const navigate = useNavigate()
  const { currencySymbol } = useCurrency()
  const create = useCreateSaleMutation()
  const updateSale = useUpdateSaleMutation()
  const isSaving = create.isPending || updateSale.isPending
  const { data: existingSale, isLoading: isLoadingSale } = useQuery({
    queryKey: ['pharmacy', 'sale', saleId],
    queryFn: () => pharmacyService.getSale(saleId!),
    enabled: !!saleId,
  })
  const { data: medicinesResult } = useMedicinesQuery({ limit: 500, status: 'active' })
  const { data: customers } = usePharmacyCustomersQuery({ search: undefined })
  const { data: admittedPatients } = useAdmittedPatientsQuery('')
  const resolveFromAdmission = useResolveCustomerFromAdmissionMutation()
  const { data: taxModeData } = usePharmacyTaxModeQuery()
  const { data: heldBills } = useHeldBillsQuery()
  const holdMut = useCreateHeldBillMutation()
  const deleteHoldMut = useDeleteHeldBillMutation()
  const { user } = useLiveUser()
  const { data: openShifts } = useShiftsQuery({ status: 'open' })

  const medicines = medicinesResult?.rows || []
  const medicineById = useMemo(() => new Map(medicines.map((m) => [String(m.id), m])), [medicines])
  const customerById = useMemo(() => new Map((customers || []).map((c) => [String(c.id), c])), [customers || []])

  const myId = user?.id != null ? Number(user.id) : null
  const myShift = useMemo(
    () => (openShifts || []).find((s) => myId != null && Number(s.user_id) === myId) || null,
    [openShifts, myId]
  )

  const [barcode, setBarcode] = useState('')
  const [custOpen, setCustOpen] = useState(false)
  const [admittedOpen, setAdmittedOpen] = useState(false)
  const [selectedAdmission, setSelectedAdmission] = useState<AdmittedPatient | null>(null)
  const [openMedIdx, setOpenMedIdx] = useState<number | null>(null)

  const { control, handleSubmit, watch, setValue, reset } = useForm<Values>({
    defaultValues: {
      customer_id: 'walkin',
      patient_name: '',
      phone: '',
      sale_date: today(),
      payment_method: 'Cash',
      discount: '0',
      tax_override: '',
      paid_now: '',
      items: [{ ...emptyItem }],
    },
  })

  // Edit mode: repopulate once the existing sale loads. unit_price/discount
  // here are the form's GROSS price + percentage inputs — inverted from the
  // stored NET unit_price/discount_amount so re-submitting unchanged
  // reproduces the same stored values (mirrors lineNetUnitPrice/lineDiscountAmt).
  useEffect(() => {
    if (!existingSale) return
    const lines: ItemValues[] = (existingSale.items || []).map((it) => {
      const discountPct = Number(it.discount_pct || 0)
      const discountAmt = Number(it.discount_amount || 0)
      const netSubtotal = Number(it.subtotal ?? Number(it.unit_price) * it.quantity)
      const grossUnitPrice = discountAmt > 0 ? (netSubtotal + discountAmt) / it.quantity : Number(it.unit_price)
      return {
        medicine_id: String(it.medicine_id),
        quantity: String(it.quantity),
        unit_price: String(grossUnitPrice),
        discount: String(discountPct),
      }
    })
    reset({
      customer_id: existingSale.customer_id != null ? String(existingSale.customer_id) : 'walkin',
      patient_name: existingSale.patient_name || '',
      phone: existingSale.phone || '',
      sale_date: existingSale.sale_date || today(),
      payment_method: existingSale.payment_method || 'Cash',
      discount: String(existingSale.discount ?? 0),
      tax_override: '',
      paid_now: existingSale.paid_amount != null ? String(existingSale.paid_amount) : '',
      items: lines.length > 0 ? lines : [{ ...emptyItem }],
    })
  }, [existingSale, reset])
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')
  const discount = watch('discount')
  const taxOverride = watch('tax_override')
  const paymentMethod = watch('payment_method')
  const customerId = watch('customer_id')

  const subtotal = items.reduce((sum, it) => sum + lineGross(it), 0)
  const lineDiscountsTotal = items.reduce((sum, it) => sum + lineDiscountAmt(it), 0)
  const afterLineDiscounts = Math.max(0, subtotal - lineDiscountsTotal)
  const discountAmt = Math.min(Math.max(Number(discount) || 0, 0), afterLineDiscounts)
  const finalAmount = Math.round((afterLineDiscounts - discountAmt) * 100) / 100

  // Mirror the server's tax math (per line, net of that line's own discount,
  // mode-aware) so the live total matches what createSale actually charges —
  // the server taxes whatever unit_price it receives, which is already net
  // (see lineNetUnitPrice above).
  const taxMode = taxModeData?.tax_mode ?? 'exclusive'
  const computedTax = useMemo(() => {
    let t = 0
    for (const it of items) {
      const rate = Number(medicineById.get(it.medicine_id)?.tax_rate || 0)
      if (!rate) continue
      const line = lineNet(it)
      t += taxMode === 'inclusive' ? (line * rate) / (100 + rate) : (line * rate) / 100
    }
    return Math.round(t * 100) / 100
  }, [items, medicineById, taxMode])
  // The computed VAT expressed as a blended rate on the post-discount base —
  // purely for display/override purposes (the per-line calc above is what
  // actually runs; a real cart can mix differently-taxed lines, so this is
  // an effective average, not a single medicine's rate).
  const computedTaxPct = afterLineDiscounts > 0 ? Math.round((computedTax / afterLineDiscounts) * 10000) / 100 : 0
  // A manually entered tax RATE (%) replaces the computed VAT — same amount
  // override the server accepts on createSale, just entered as a percentage
  // of the post-discount subtotal rather than a currency figure.
  const hasTaxOverride = taxOverride.trim() !== ''
  const taxOverridePct = Math.min(Math.max(Number(taxOverride) || 0, 0), 100)
  const tax = hasTaxOverride ? Math.round(afterLineDiscounts * (taxOverridePct / 100) * 100) / 100 : computedTax
  const total = taxMode === 'inclusive'
    ? Math.round((subtotal - lineDiscountsTotal - discountAmt) * 100) / 100
    : Math.round((subtotal - lineDiscountsTotal - discountAmt + tax) * 100) / 100
  const isCredit = paymentMethod === 'Credit'
  const paidNow = isCredit ? (Number(watch('paid_now')) || 0) : total
  const due = Math.max(0, Math.round((total - paidNow) * 100) / 100)

  /** Scanner (or manual entry): look the code up, then add a line or bump the
   *  quantity when the medicine is already in the cart. */
  const handleBarcode = async (code: string) => {
    const trimmed = code.trim()
    if (!trimmed) return
    setBarcode('')
    let med: Medicine | undefined
    try {
      med = await pharmacyService.getMedicineByBarcode(trimmed)
    } catch {
      toast.error(`No medicine with barcode "${trimmed}"`)
      return
    }
    if (!med) { toast.error(`No medicine with barcode "${trimmed}"`); return }
    if (med.status !== 'active') { toast.error(`${med.name} is inactive`); return }

    const existing = items.findIndex((it) => it.medicine_id === String(med!.id))
    if (existing >= 0) {
      setValue(`items.${existing}.quantity`, String((Number(items[existing].quantity) || 0) + 1))
      toast.success(`${med.name} × ${Number(items[existing].quantity) + 1}`)
    } else {
      const emptyIdx = items.findIndex((it) => !it.medicine_id)
      const line = { medicine_id: String(med.id), quantity: '1', unit_price: String(med.unit_price), discount: '0' }
      if (emptyIdx >= 0) {
        setValue(`items.${emptyIdx}.medicine_id`, line.medicine_id)
        setValue(`items.${emptyIdx}.quantity`, line.quantity)
        setValue(`items.${emptyIdx}.unit_price`, line.unit_price)
        setValue(`items.${emptyIdx}.discount`, line.discount)
      } else {
        append(line)
      }
      toast.success(`${med.name} added`)
    }
  }

  /** Credit is only extended against a currently-admitted patient — picking
   *  one here finds-or-creates the pharmacy_customers row that actually backs
   *  the sale/due tracking (Pharmacy keeps its own ledger; nothing here
   *  touches hospital billing). */
  const selectAdmittedPatient = async (admission: AdmittedPatient) => {
    setAdmittedOpen(false)
    setSelectedAdmission(admission)
    try {
      const cust = await resolveFromAdmission.mutateAsync(admission.id)
      setValue('customer_id', String(cust.id))
      setValue('patient_name', cust.name || admission.patient_name)
      setValue('phone', cust.phone || admission.phone || '')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to link admitted patient')
      setSelectedAdmission(null)
    }
  }

  const resetCart = () => {
    setSelectedAdmission(null)
    reset({
      customer_id: 'walkin', patient_name: '', phone: '', sale_date: today(),
      payment_method: 'Cash', discount: '0', tax_override: '', paid_now: '', items: [{ ...emptyItem }],
    })
  }

  const holdBill = async () => {
    const lineItems = items.filter((it) => it.medicine_id && Number(it.quantity) > 0)
    if (lineItems.length === 0) { toast.error('Nothing to hold — add items first'); return }
    const cust = customerId !== 'walkin' ? customerById.get(customerId)?.name : null
    try {
      await holdMut.mutateAsync({
        label: cust || watch('patient_name') || `Held ${new Date().toLocaleTimeString()}`,
        items: lineItems.map((it) => ({
          medicine_id: Number(it.medicine_id),
          quantity: Number(it.quantity),
          unit_price: lineNetUnitPrice(it),
        })),
      })
      toast.success('Bill held — resume it from the held list')
      resetCart()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to hold bill')
    }
  }

  const resumeBill = async (heldId: number, heldItems: { medicine_id: number; quantity: number; unit_price?: number }[]) => {
    const lines = heldItems
      .filter((it) => medicineById.has(String(it.medicine_id)))
      .map((it) => ({
        medicine_id: String(it.medicine_id),
        quantity: String(it.quantity),
        unit_price: it.unit_price != null ? String(it.unit_price) : String(medicineById.get(String(it.medicine_id))?.unit_price ?? 0),
        discount: '0',
      }))
    if (lines.length === 0) { toast.error('This held bill has no currently-available medicines'); return }
    setSelectedAdmission(null)
    reset({ customer_id: 'walkin', patient_name: '', phone: '', sale_date: today(), payment_method: 'Cash', discount: '0', tax_override: '', paid_now: '', items: lines })
    try { await deleteHoldMut.mutateAsync(heldId) } catch { /* bill stays; harmless */ }
    toast.success('Held bill resumed')
  }

  const onSubmit = async (values: Values) => {
    const lineItems = values.items
      .filter((it) => it.medicine_id && Number(it.quantity) > 0)
      .map((it) => ({
        medicine_id: Number(it.medicine_id),
        quantity: Number(it.quantity),
        unit_price: lineNetUnitPrice(it),
        discount_pct: lineDiscountPct(it),
        discount_amount: lineDiscountAmt(it),
      }))
    if (lineItems.length === 0) { toast.error('Add at least one item'); return }
    if (values.payment_method === 'Credit' && values.customer_id === 'walkin') {
      toast.error('Credit sales need an admitted patient (select one above)')
      return
    }

    const payload = {
      customer_id: values.customer_id !== 'walkin' ? Number(values.customer_id) : null,
      patient_name: values.patient_name || null,
      phone: values.phone || null,
      sale_date: values.sale_date || null,
      payment_method: values.payment_method,
      discount: Number(values.discount) || 0,
      ...(hasTaxOverride ? { tax_amount: tax } : {}),
      paid_amount: values.payment_method === 'Credit' ? Number(values.paid_now) || 0 : null,
      items: lineItems,
    }

    try {
      if (saleId) {
        const res = await updateSale.mutateAsync({ id: saleId, body: payload as any })
        const sale = (res as any)?.data ?? res
        toast.success(`Sale ${sale?.sale_no || ''} updated`)
        navigate({ to: '/dashboard/pharmacy/sales/$id/print', params: { id: String(sale?.id ?? saleId) } })
      } else {
        const res = await create.mutateAsync({ ...payload, shift_id: myShift?.id ?? null } as any)
        const sale = (res as any)?.data ?? res
        toast.success(`Sale ${sale?.sale_no || ''} recorded`)
        navigate({ to: '/dashboard/pharmacy/sales/$id/print', params: { id: String(sale?.id ?? '') } })
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (saleId ? 'Failed to update sale' : 'Failed to record sale'))
    }
  }

  if (saleId && isLoadingSale) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading…</div>
  }

  return (
    <>
      <AppHeader fixed />
      <Main className="flex flex-1 flex-col gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 w-full max-w-[1000px] mx-auto px-4">
          <div className="flex items-center gap-4 mb-2">
            <Button type="button" variant="ghost" size="icon" onClick={() => navigate({ to: BACK })}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {saleId ? `Edit Sale ${existingSale?.sale_no || ''}` : 'New Sale'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {saleId ? 'Corrects the recorded items/payment — stock is re-allocated accordingly' : 'Dispense at the counter'}
                {!saleId && myShift && <> · shift <Badge variant="secondary" className="mx-1">#{myShift.id} open</Badge></>}
              </p>
            </div>
          </div>

          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><Receipt className="w-4 h-4 text-white" /></div>
                <div>
                  <CardTitle className="text-lg font-bold">Sale Details</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Customer (optional) and payment</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{isCredit ? 'Admitted Patient' : 'Customer Account'}</label>
                  {isCredit ? (() => {
                    // Editing a Credit sale: the original admission record
                    // isn't refetched, so fall back to the already-resolved
                    // customer for display (setValue/reset already put the
                    // right customer_id in the form either way).
                    const linkedCustomer = customerId !== 'walkin' ? customerById.get(customerId) : null
                    const displayLabel = selectedAdmission
                      ? `${selectedAdmission.patient_name}${selectedAdmission.phone ? ` · ${selectedAdmission.phone}` : ''}`
                      : linkedCustomer
                        ? `${linkedCustomer.name}${linkedCustomer.phone ? ` · ${linkedCustomer.phone}` : ''}`
                        : null
                    return (
                    <Popover open={admittedOpen} onOpenChange={setAdmittedOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={admittedOpen}
                          className={cn('w-full justify-between font-normal', !displayLabel && 'text-muted-foreground')}
                        >
                          <span className="truncate">{displayLabel || 'Select admitted patient…'}</span>
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[320px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search by name or phone…" />
                          <CommandList>
                            <CommandEmpty>No admitted (not yet discharged) patient found.</CommandEmpty>
                            <CommandGroup>
                              {(admittedPatients || []).map((a) => (
                                <CommandItem
                                  key={a.id}
                                  value={`${a.patient_name} ${a.phone || ''} ${a.admission_prefix || ''}`}
                                  onSelect={() => selectAdmittedPatient(a)}
                                >
                                  <Check className={cn('mr-2 h-4 w-4', selectedAdmission?.id === a.id ? 'opacity-100' : 'opacity-0')} />
                                  <span className="truncate">
                                    {a.patient_name}{a.phone ? ` · ${a.phone}` : ''}
                                    {a.admission_prefix ? ` · ${a.admission_prefix}` : ''}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    )
                  })() : (
                    <Controller control={control} name="customer_id" render={({ field }) => {
                      const selected = field.value !== 'walkin' ? customerById.get(field.value) : null
                      const selectCustomer = (id: string) => {
                        field.onChange(id)
                        const cust = customerById.get(id)
                        setValue('patient_name', cust?.name || '')
                        setValue('phone', cust?.phone || '')
                        setCustOpen(false)
                      }
                      return (
                        <Popover open={custOpen} onOpenChange={setCustOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              aria-expanded={custOpen}
                              className={cn('w-full justify-between font-normal', !selected && 'text-muted-foreground')}
                            >
                              <span className="truncate">
                                {selected ? `${selected.name}${selected.phone ? ` · ${selected.phone}` : ''}` : 'Walk-in (no account)'}
                              </span>
                              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[320px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search customer by name or phone…" />
                              <CommandList>
                                <CommandEmpty>No customer found.</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem value="walkin" onSelect={() => selectCustomer('walkin')}>
                                    <Check className={cn('mr-2 h-4 w-4', field.value === 'walkin' ? 'opacity-100' : 'opacity-0')} />
                                    Walk-in (no account)
                                  </CommandItem>
                                  {(customers || []).filter((c) => c.status === 'active').map((c) => (
                                    <CommandItem
                                      key={c.id}
                                      value={`${c.name} ${c.phone || ''}`}
                                      onSelect={() => selectCustomer(String(c.id))}
                                    >
                                      <Check className={cn('mr-2 h-4 w-4', field.value === String(c.id) ? 'opacity-100' : 'opacity-0')} />
                                      <span className="truncate">{c.name}{c.phone ? ` · ${c.phone}` : ''}</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )
                    }} />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Patient / Buyer Name</label>
                  <Controller control={control} name="patient_name" render={({ field }) => (
                    <Input placeholder="Optional (walk-in)" {...field} />
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Controller control={control} name="phone" render={({ field }) => (
                    <Input placeholder="Optional" {...field} />
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Date</label>
                  <Controller control={control} name="sale_date" render={({ field }) => (
                    <DateField value={field.value} onChange={field.onChange} placeholder="Sale date" className="w-full" />
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Method</label>
                  <Controller control={control} name="payment_method" render={({ field }) => (
                    <Select value={field.value} onValueChange={(val) => {
                      field.onChange(val)
                      if (val !== 'Credit') setValue('paid_now', '')
                      setValue('customer_id', 'walkin')
                      setSelectedAdmission(null)
                    }}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                {isCredit && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Paid Now</label>
                    <Controller control={control} name="paid_now" render={({ field }) => (
                      <Input type="number" step="0.01" min="0" max={total} placeholder="0.00" {...field} />
                    )} />
                    <p className="text-xs text-muted-foreground">Remainder {currencySymbol} {due.toFixed(2)} goes to the customer's due</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg"><ScanLine className="w-4 h-4 text-white" /></div>
                <div>
                  <CardTitle className="text-lg font-bold">Scan</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Scan a barcode and press Enter to add</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <Input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBarcode(barcode) } }}
                placeholder="Scan barcode / type code + Enter"
                className="font-mono h-11 text-lg"
                autoFocus
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg"><Plus className="w-4 h-4 text-white" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold">Items</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Medicine, quantity and price{computedTax > 0 ? ` · prices ${taxMode === 'inclusive' ? 'include' : 'exclude'} VAT` : ''}</p>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyItem })}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {fields.map((f, idx) => {
                return (
                  <div key={f.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 items-end border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="space-y-1">
                      {idx === 0 && <label className="block text-xs text-muted-foreground">Medicine</label>}
                      <Controller control={control} name={`items.${idx}.medicine_id`} render={({ field }) => {
                        const med = medicineById.get(field.value)
                        const isOpen = openMedIdx === idx
                        const selectMedicine = (id: string) => {
                          field.onChange(id)
                          const m = medicineById.get(id)
                          if (m) setValue(`items.${idx}.unit_price`, String(m.unit_price))
                          setOpenMedIdx(null)
                        }
                        return (
                          <Popover open={isOpen} onOpenChange={(o) => setOpenMedIdx(o ? idx : null)}>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                aria-expanded={isOpen}
                                className={cn('w-full justify-between font-normal', !med && 'text-muted-foreground')}
                              >
                                <span className="truncate">
                                  {med ? `${med.name} · stock: ${med.stock_quantity}` : 'Select medicine'}
                                </span>
                                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[360px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search medicine by name…" />
                                <CommandList>
                                  <CommandEmpty>No in-stock medicine found.</CommandEmpty>
                                  <CommandGroup>
                                    {medicines.filter((m) => Number(m.stock_quantity) > 0 || String(m.id) === field.value).map((m) => (
                                      <CommandItem
                                        key={m.id}
                                        value={`${m.name} ${m.generic_name || ''}`}
                                        onSelect={() => selectMedicine(String(m.id))}
                                      >
                                        <Check className={cn('mr-2 h-4 w-4', field.value === String(m.id) ? 'opacity-100' : 'opacity-0')} />
                                        <span className="truncate">{m.name} · stock: {m.stock_quantity}</span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        )
                      }} />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <label className="text-xs text-muted-foreground">Quantity</label>}
                      <Controller control={control} name={`items.${idx}.quantity`} render={({ field }) => (
                        <Input type="number" min="1" placeholder="1" className="text-right" {...field} />
                      )} />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <label className="block text-xs text-muted-foreground">Unit Price</label>}
                      <Controller control={control} name={`items.${idx}.unit_price`} render={({ field }) => (
                        <Input type="number" step="0.01" min="0" placeholder="0.00" className="text-right" {...field} />
                      )} />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <label className="block text-xs text-muted-foreground">Discount (%)</label>}
                      <Controller control={control} name={`items.${idx}.discount`} render={({ field }) => (
                        <Input type="number" step="0.01" min="0" max="100" placeholder="0" className="text-right" {...field} />
                      )} />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <label className="block text-xs text-muted-foreground">Total</label>}
                      <p className="flex h-9 items-center justify-end text-sm font-semibold">
                        {currencySymbol} {lineNet(items[idx] || emptyItem).toFixed(2)}
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)} disabled={fields.length === 1}>
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                )
              })}

              <div className="pt-3">
                <table className="w-full max-w-[380px] ml-auto text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1 text-muted-foreground">Subtotal</td>
                      <td className="py-1 text-right font-medium">{currencySymbol} {subtotal.toFixed(2)}</td>
                    </tr>
                    {lineDiscountsTotal > 0 && (
                      <tr>
                        <td className="py-1 text-muted-foreground">Discount</td>
                        <td className="py-1 text-right font-medium text-rose-600">- {currencySymbol} {lineDiscountsTotal.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="border-t">
                      <td className="py-1.5 font-semibold">Total</td>
                      <td className="py-1.5 text-right font-semibold">{currencySymbol} {afterLineDiscounts.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-muted-foreground">
                        Extra Discount <span className="text-[10px]">(if any)</span>
                      </td>
                      <td className="py-1 text-right">
                        <Controller control={control} name="discount" render={({ field }) => (
                          <Input type="number" step="0.01" min="0" max={afterLineDiscounts} className="w-28 h-8 ml-auto text-right" {...field} />
                        )} />
                      </td>
                    </tr>
                    <tr className="border-t">
                      <td className="py-1.5 font-semibold">Final Amount</td>
                      <td className="py-1.5 text-right font-semibold">{currencySymbol} {finalAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-muted-foreground">
                        Tax %{taxMode === 'inclusive' ? ' (included)' : ''}{' '}
                        <span className="text-[10px]">(auto: {computedTaxPct.toFixed(2)}%)</span>
                      </td>
                      <td className="py-1 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Controller control={control} name="tax_override" render={({ field }) => (
                            <Input type="number" step="0.01" min="0" max="100" placeholder={computedTaxPct.toFixed(2)} className="w-20 h-8 text-right" {...field} />
                          )} />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">= {currencySymbol} {tax.toFixed(2)}</p>
                      </td>
                    </tr>
                    <tr className="border-t-2 border-emerald-500/40">
                      <td className="py-2 text-base font-bold">Total with Tax</td>
                      <td className="py-2 text-right text-lg font-bold text-emerald-600">{currencySymbol} {total.toFixed(2)}</td>
                    </tr>
                    {isCredit && (
                      <tr>
                        <td className="py-1 font-semibold text-rose-600">Due (credit)</td>
                        <td className="py-1 text-right font-semibold text-rose-600">{currencySymbol} {due.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {!saleId && (heldBills || []).length > 0 && (
            <Card className="gap-0 shadow-none p-0">
              <CardHeader className="border-b py-3 px-4">
                <CardTitle className="text-base font-bold">Held Bills ({heldBills!.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {heldBills!.map((hb) => (
                  <div key={hb.id} className="flex items-center justify-between gap-3 border-b pb-2 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{hb.label || `Held #${hb.id}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {hb.items.length} item(s){hb.user?.name ? ` · ${hb.user.name}` : ''} · {new Date(hb.created_at || '').toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button type="button" variant="outline" size="sm" onClick={() => resumeBill(hb.id, hb.items)}>
                        <PlayCircle className="h-4 w-4 mr-1" /> Resume
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => deleteHoldMut.mutate(hb.id)}>
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-end gap-3 pb-10">
            <Button type="button" variant="outline" size="lg" onClick={() => navigate({ to: BACK })} disabled={isSaving}>Cancel</Button>
            {!saleId && (
              <Button type="button" variant="outline" size="lg" onClick={holdBill} disabled={holdMut.isPending || isSaving}>
                <PauseCircle className="h-4 w-4 mr-2" /> Hold
              </Button>
            )}
            <Button type="submit" size="lg" disabled={isSaving} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[180px]">
              {isSaving ? 'Saving…' : (saleId ? 'Save Changes' : 'Complete Sale')}
            </Button>
          </div>
        </form>
      </Main>
    </>
  )
}
