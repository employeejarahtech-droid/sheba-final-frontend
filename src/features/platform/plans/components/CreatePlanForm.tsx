/**
 * CreatePlanForm — Dialog-based form for creating a subscription plan
 *
 * Fields: slug, name, description, monthly_price, yearly_price,
 *         max_users, status, display_order.
 * Uses useCreatePlan() hook from usePlatformAdmin.
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { useCreatePlan } from '@/hooks/usePlatformAdmin'

interface CreatePlanFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormState {
  slug: string
  name: string
  description: string
  monthly_price: string
  yearly_price: string
  max_users: string
  status: string
  display_order: string
}

const initialForm: FormState = {
  slug: '',
  name: '',
  description: '',
  monthly_price: '',
  yearly_price: '',
  max_users: '',
  status: 'active',
  display_order: '0',
}

export function CreatePlanForm({ open, onOpenChange }: CreatePlanFormProps) {
  const [form, setForm] = useState<FormState>(initialForm)
  const createPlan = useCreatePlan()

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.slug.trim() || !form.name.trim()) {
      return
    }

    createPlan.mutate(
      {
        slug: form.slug.trim().toLowerCase(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: {
          monthly: Number(form.monthly_price) || 0,
          yearly: Number(form.yearly_price) || 0,
        },
        max_users: Number(form.max_users) || null,
        status: form.status,
        display_order: Number(form.display_order) || 0,
      },
      {
        onSuccess: () => {
          setForm(initialForm)
          onOpenChange(false)
        },
      }
    )
  }

  const handleCancel = () => {
    setForm(initialForm)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Subscription Plan</DialogTitle>
          <DialogDescription>
            Add a new plan that tenants can subscribe to.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="plan-slug">
              Slug <span className="text-destructive">*</span>
            </Label>
            <Input
              id="plan-slug"
              placeholder="e.g. starter"
              value={form.slug}
              onChange={(e) =>
                updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
              }
              required
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="plan-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="plan-name"
              placeholder="e.g. Starter Plan"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="plan-description">Description</Label>
            <Textarea
              id="plan-description"
              placeholder="Plan description..."
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Monthly & Yearly Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan-monthly">Monthly Price</Label>
              <Input
                id="plan-monthly"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.monthly_price}
                onChange={(e) => updateField('monthly_price', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-yearly">Yearly Price</Label>
              <Input
                id="plan-yearly"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.yearly_price}
                onChange={(e) => updateField('yearly_price', e.target.value)}
              />
            </div>
          </div>

          {/* Max Users & Display Order */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan-max-users">Max Users</Label>
              <Input
                id="plan-max-users"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={form.max_users}
                onChange={(e) => updateField('max_users', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-order">Display Order</Label>
              <Input
                id="plan-order"
                type="number"
                min="0"
                placeholder="0"
                value={form.display_order}
                onChange={(e) => updateField('display_order', e.target.value)}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => updateField('status', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={createPlan.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createPlan.isPending}>
              {createPlan.isPending ? 'Creating...' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
