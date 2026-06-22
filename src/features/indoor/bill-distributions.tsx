import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  FileText,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Wallet,
  AlertCircle,
  Search,
} from 'lucide-react'

import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getCookie } from '@/lib/cookies'
import { useCurrency } from '@/hooks/use-currency'

const API_URL = import.meta.env.VITE_API_URL

type BillDistribution = {
  id: number
  admission_id: number
  final_bill_id: number
  service_provided_by: 'Surgeon' | 'Anesthetist' | 'Assistant' | 'Consultant' | 'Clinical Service' | 'Other' | 'Operation'
  provider_id?: number
  doctor?: {
    id: number
    doctor_name: string
  }
  bill_amount: number
  less_amount: number
  final_bill: number
  pay_now: number
  due_amount: number
  payment_status: 'pending' | 'partial' | 'paid'
  notes?: string
  created_at: string
  admission?: {
    patient_name: string
    phone?: string
    admission_date: string
  }
}

type DistributionSummary = {
  total_bill_amount: number
  total_less_amount: number
  total_payable: number
  total_paid: number
  total_due: number
  by_provider: Record<string, {
    count: number
    bill_amount: number
    less_amount: number
    payable: number
    paid: number
    due: number
  }>
  payment_status_count: {
    pending: number
    partial: number
    paid: number
  }
}

type ApiResponse<T> = {
  status: boolean
  data: T
  message?: string
}

export function BillDistributionsPage() {
  const queryClient = useQueryClient()
  const searchParams: any = useSearch({ strict: false })
  const { currencySymbol } = useCurrency()

  const [admissionFilter, setAdmissionFilter] = useState(searchParams?.admissionId || '')

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedDistribution, setSelectedDistribution] = useState<BillDistribution | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    admission_id: '',
    final_bill_id: '',
    service_provided_by: '',
    provider_id: '',
    bill_amount: '',
    less_amount: '',
    pay_now: '',
    notes: '',
  })

  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const token = getCookie('accessToken')

  // Fetch distributions
  const { data: distributions } = useQuery({
    queryKey: ['bill-distributions', admissionFilter],
    queryFn: async () => {
      if (!admissionFilter) return []
      const response = await fetch(
        `${API_URL}/api/bill-distribution/admission/${admissionFilter}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (!response.ok) throw new Error('Failed to fetch distributions')
      const result: ApiResponse<BillDistribution[]> = await response.json()
      return result.data || []
    },
    enabled: !!admissionFilter && !!token,
  })

  // Fetch summary
  const { data: summary } = useQuery({
    queryKey: ['bill-distribution-summary', admissionFilter],
    queryFn: async () => {
      if (!admissionFilter) return null
      const response = await fetch(
        `${API_URL}/api/bill-distribution/admission/${admissionFilter}/summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (!response.ok) throw new Error('Failed to fetch summary')
      const result: ApiResponse<DistributionSummary> = await response.json()
      return result.data
    },
    enabled: !!admissionFilter && !!token,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`${API_URL}/api/bill-distribution/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          admission_id: Number(data.admission_id),
          final_bill_id: Number(data.final_bill_id),
          bill_amount: Number(data.bill_amount),
          less_amount: Number(data.less_amount),
          pay_now: Number(data.pay_now),
          provider_id: data.provider_id ? Number(data.provider_id) : null,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create distribution')
      }
      return response.json()
    },
    onSuccess: () => {
      toast.success('Distribution created successfully')
      setCreateModalOpen(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['bill-distributions'] })
      queryClient.invalidateQueries({ queryKey: ['bill-distribution-summary'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(
        `${API_URL}/api/bill-distribution/${selectedDistribution?.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...data,
            bill_amount: Number(data.bill_amount),
            less_amount: Number(data.less_amount),
            pay_now: Number(data.pay_now),
          }),
        }
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update distribution')
      }
      return response.json()
    },
    onSuccess: () => {
      toast.success('Distribution updated successfully')
      setEditModalOpen(false)
      setSelectedDistribution(null)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['bill-distributions'] })
      queryClient.invalidateQueries({ queryKey: ['bill-distribution-summary'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${API_URL}/api/bill-distribution/${selectedDistribution?.id}/payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: Number(paymentAmount),
            payment_method: paymentMethod,
          }),
        }
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to process payment')
      }
      return response.json()
    },
    onSuccess: () => {
      toast.success('Payment processed successfully')
      setPaymentModalOpen(false)
      setPaymentAmount('')
      setSelectedDistribution(null)
      queryClient.invalidateQueries({ queryKey: ['bill-distributions'] })
      queryClient.invalidateQueries({ queryKey: ['bill-distribution-summary'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${API_URL}/api/bill-distribution/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to delete distribution')
      return response.json()
    },
    onSuccess: () => {
      toast.success('Distribution deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['bill-distributions'] })
      queryClient.invalidateQueries({ queryKey: ['bill-distribution-summary'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const resetForm = () => {
    setFormData({
      admission_id: '',
      final_bill_id: '',
      service_provided_by: '',
      provider_id: '',
      bill_amount: '',
      less_amount: '',
      pay_now: '',
      notes: '',
    })
  }

  const handleCreate = () => {
    if (!formData.admission_id || !formData.final_bill_id || !formData.service_provided_by || !formData.bill_amount) {
      toast.error('Please fill in all required fields')
      return
    }
    createMutation.mutate(formData)
  }

  const handleUpdate = () => {
    if (!formData.bill_amount) {
      toast.error('Bill amount is required')
      return
    }
    updateMutation.mutate(formData)
  }

  const handlePayment = () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    paymentMutation.mutate()
  }

  const openEditModal = (distribution: BillDistribution) => {
    setSelectedDistribution(distribution)
    setFormData({
      admission_id: String(distribution.admission_id),
      final_bill_id: String(distribution.final_bill_id),
      service_provided_by: distribution.service_provided_by,
      provider_id: String(distribution.provider_id || ''),
      bill_amount: String(distribution.bill_amount),
      less_amount: String(distribution.less_amount),
      pay_now: String(distribution.pay_now),
      notes: distribution.notes || '',
    })
    setEditModalOpen(true)
  }

  const openPaymentModal = (distribution: BillDistribution) => {
    setSelectedDistribution(distribution)
    setPaymentAmount('')
    setPaymentMethod('cash')
    setPaymentModalOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Pending' },
      partial: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Partial' },
      paid: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Paid' },
    }
    const variant = variants[status] || variants.pending
    return <Badge className={variant.color}>{variant.label}</Badge>
  }

  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      Surgeon: '👨‍⚕️',
      Anesthetist: '💉',
      Assistant: '🤝',
      Consultant: '🩺',
      'Clinical Service': '🏥',
      Operation: '🔧',
      Other: '📋',
    }
    return icons[provider] || '📋'
  }

  return (
    <>
      <AppHeader fixed />
      <Main className="p-6 lg:p-10 w-full flex-1 dark:bg-black/20">
        <div className="max-w-7xl mx-auto space-y-6">
          <PageHeader
            title="Bill Distribution Management"
            subtitle="Manage payments to service providers (Surgeons, Anesthetists, Assistants, etc.)"
            actions={
              <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Distribution
              </Button>
            }
          />

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label>Admission ID</Label>
                  <Input
                    placeholder="Enter admission ID"
                    value={admissionFilter}
                    onChange={(e) => setAdmissionFilter(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => {
                    if (admissionFilter) {
                      // Just trigger the query by ensuring filter is set
                      // The useQuery will automatically refetch when admissionFilter changes
                    }
                  }}
                  disabled={!admissionFilter}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Load Distributions
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          {summary && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currencySymbol}{summary.total_bill_amount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Patient billing amount</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Payable</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {currencySymbol}{summary.total_payable.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currencySymbol}{summary.total_less_amount.toLocaleString()} deduction
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {currencySymbol}{summary.total_paid.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currencySymbol}{summary.total_due.toLocaleString()} remaining
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {summary.payment_status_count.pending + summary.payment_status_count.partial}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {summary.payment_status_count.paid} completed
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Distributions Table */}
          {distributions && distributions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Distribution Records</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Bill Amount</TableHead>
                      <TableHead>Less Amount</TableHead>
                      <TableHead>Payable</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributions.map((distribution) => (
                      <TableRow key={distribution.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getProviderIcon(distribution.service_provided_by)}</span>
                            <div>
                              <div className="font-medium">{distribution.service_provided_by}</div>
                              {distribution.provider_id ? (
                                <div className="text-xs text-muted-foreground">
                                  {distribution.doctor?.doctor_name || `ID: ${distribution.provider_id}`}
                                </div>
                              ) : (
                                (distribution.service_provided_by === 'Clinical Service' || distribution.service_provided_by === 'Other') && (
                                  <div className="text-xs text-muted-foreground">Hospital</div>
                                )
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{currencySymbol}{Number(distribution.bill_amount).toLocaleString()}</TableCell>
                        <TableCell className="text-red-600">
                          -{currencySymbol}{Number(distribution.less_amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {currencySymbol}{Number(distribution.final_bill).toLocaleString()}
                        </TableCell>
                        <TableCell>{currencySymbol}{Number(distribution.pay_now).toLocaleString()}</TableCell>
                        <TableCell className="text-orange-600">
                          {currencySymbol}{Number(distribution.due_amount).toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(distribution.payment_status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPaymentModal(distribution)}
                              disabled={distribution.payment_status === 'paid'}
                            >
                              <DollarSign className="h-3 w-3 mr-1" />
                              Pay
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditModal(distribution)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm('Delete this distribution?')) {
                                  deleteMutation.mutate(distribution.id)
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : admissionFilter ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No distributions found for this admission</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Enter an admission ID to view distributions</p>
              </CardContent>
            </Card>
          )}
        </div>
      </Main>

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Bill Distribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Admission ID *</Label>
                <Input
                  value={formData.admission_id}
                  onChange={(e) => setFormData({ ...formData, admission_id: e.target.value })}
                  placeholder="Enter admission ID"
                />
              </div>
              <div>
                <Label>Bill ID *</Label>
                <Input
                  value={formData.final_bill_id}
                  onChange={(e) => setFormData({ ...formData, final_bill_id: e.target.value })}
                  placeholder="Enter bill ID"
                />
              </div>
            </div>

            <div>
              <Label>Service Provider Type *</Label>
              <Select
                value={formData.service_provided_by}
                onValueChange={(value) => setFormData({ ...formData, service_provided_by: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Surgeon">👨‍⚕️ Surgeon</SelectItem>
                  <SelectItem value="Anesthetist">💉 Anesthetist</SelectItem>
                  <SelectItem value="Assistant">🤝 Assistant</SelectItem>
                  <SelectItem value="Consultant">🩺 Consultant</SelectItem>
                  <SelectItem value="Clinical Service">🏥 Clinical Service</SelectItem>
                  <SelectItem value="Operation">🔧 Operation</SelectItem>
                  <SelectItem value="Other">📋 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Provider ID (Optional)</Label>
              <Input
                value={formData.provider_id}
                onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })}
                placeholder="Doctor/Service Provider ID"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bill Amount * ({currencySymbol})</Label>
                <Input
                  type="number"
                  value={formData.bill_amount}
                  onChange={(e) => setFormData({ ...formData, bill_amount: e.target.value })}
                  placeholder="Billed to patient"
                />
              </div>
              <div>
                <Label>Less Amount/Deduction * ({currencySymbol})</Label>
                <Input
                  type="number"
                  value={formData.less_amount}
                  onChange={(e) => setFormData({ ...formData, less_amount: e.target.value })}
                  placeholder="Company profit"
                />
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Billed Amount:</span>
                <span>{currencySymbol}{Number(formData.bill_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Less Amount:</span>
                <span>-{currencySymbol}{Number(formData.less_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-green-600">
                <span>Payable Amount:</span>
                <span>{currencySymbol}{(Number(formData.bill_amount || 0) - Number(formData.less_amount || 0)).toLocaleString()}</span>
              </div>
            </div>

            <div>
              <Label>Pay Now ({currencySymbol})</Label>
              <Input
                type="number"
                value={formData.pay_now}
                onChange={(e) => setFormData({ ...formData, pay_now: e.target.value })}
                placeholder="Amount to pay immediately"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Distribution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bill Distribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bill Amount * ({currencySymbol})</Label>
                <Input
                  type="number"
                  value={formData.bill_amount}
                  onChange={(e) => setFormData({ ...formData, bill_amount: e.target.value })}
                />
              </div>
              <div>
                <Label>Less Amount/Deduction * ({currencySymbol})</Label>
                <Input
                  type="number"
                  value={formData.less_amount}
                  onChange={(e) => setFormData({ ...formData, less_amount: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Pay Now ({currencySymbol})</Label>
              <Input
                type="number"
                value={formData.pay_now}
                onChange={(e) => setFormData({ ...formData, pay_now: e.target.value })}
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update Distribution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          {selectedDistribution && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Provider:</span>
                  <span className="font-medium">{selectedDistribution.service_provided_by}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Payable Amount:</span>
                  <span className="font-semibold text-green-600">
                    {currencySymbol}{Number(selectedDistribution.final_bill).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Already Paid:</span>
                  <span>{currencySymbol}{Number(selectedDistribution.pay_now).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-orange-600">
                  <span>Remaining Due:</span>
                  <span>{currencySymbol}{Number(selectedDistribution.due_amount).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <Label>Payment Amount *</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  max={Number(selectedDistribution.due_amount)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum payable: {currencySymbol}{Number(selectedDistribution.due_amount).toLocaleString()}
                </p>
              </div>

              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={paymentMutation.isPending}>
              {paymentMutation.isPending ? 'Processing...' : 'Process Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
