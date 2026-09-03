import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useCreateCustomerPaymentMutation, useCreateSupplierPaymentMutation,
} from '@/features/pharmacy/pharmacyQueries'
import { useCurrency } from '@/hooks/use-currency'

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Card', 'Mobile Banking', 'Cheque']
const today = () => new Date().toISOString().slice(0, 10)

/** Money-in / money-out recording dialog shared by customer dues and
 *  supplier dues (mode picks the mutation + endpoint). */
export function PaymentDialog({
  open, onOpenChange, mode, targetId, targetName, currentDue,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  mode: 'customer' | 'supplier'
  targetId: number | string
  targetName: string
  currentDue?: number
}) {
  const { currencySymbol } = useCurrency()
  const customerMut = useCreateCustomerPaymentMutation()
  const supplierMut = useCreateSupplierPaymentMutation()
  const pending = customerMut.isPending || supplierMut.isPending

  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('Cash')
  const [date, setDate] = useState(today())
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setAmount(currentDue != null && currentDue > 0 ? String(currentDue) : '')
      setMethod('Cash')
      setDate(today())
      setNotes('')
    }
  }, [open, currentDue])

  const submit = async () => {
    const amt = Number(amount)
    if (!amt || amt <= 0) { toast.error('Enter a payment amount'); return }
    try {
      if (mode === 'customer') await customerMut.mutateAsync({ id: targetId, body: { amount: amt, payment_method: method, payment_date: date || null, notes: notes || null } })
      else await supplierMut.mutateAsync({ id: targetId, body: { amount: amt, payment_method: method, payment_date: date || null, notes: notes || null } })
      toast.success(`${mode === 'customer' ? 'Customer' : 'Supplier'} payment recorded`)
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record payment')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Record {mode === 'customer' ? 'Receipt' : 'Payment'}</DialogTitle>
          <DialogDescription>
            {targetName}
            {currentDue != null && (
              <> · current due <span className={currentDue > 0 ? 'font-semibold text-rose-600' : 'font-semibold text-emerald-600'}>{currencySymbol} {currentDue.toFixed(2)}</span></>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Method</label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Date</label>
              <DateField value={date} onChange={setDate} placeholder="Payment date" className="w-full" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea placeholder="Optional (cheque no, reference…)" className="min-h-[60px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>{pending ? 'Saving…' : 'Record Payment'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
