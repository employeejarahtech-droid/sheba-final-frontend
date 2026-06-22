/**
 * Plans Admin Add Page — Create a subscription plan
 *
 * Route: /(platform)/admin/plans/add
 * Form fields: name, slug, description, price{monthly,quarterly,biannual,yearly},
 * limits, features, status, max_users, display_order.
 * On success navigates to /admin/plans.
 * Mirrors the contacts.tsx purple-gradient visual pattern.
 */

import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  CreditCard,
  Plus,
  Loader2,
  ArrowLeft,
  Save,
  X,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useCreatePlan } from '@/hooks/usePlatformAdmin'

export const Route = createFileRoute('/(platform)/admin/plans/add')({
  component: AddPlanPage,
})

// ── Types ───────────────────────────────────────────────────────────────

interface FeatureRow {
  name: string
  included: boolean
}

interface LimitRow {
  key: string
  value: string
}

interface FormState {
  name: string
  slug: string
  description: string
  priceMonthly: string
  priceQuarterly: string
  priceBiannual: string
  priceYearly: string
  maxUsers: string
  displayOrder: string
  status: string
}

const initialForm: FormState = {
  name: '',
  slug: '',
  description: '',
  priceMonthly: '0',
  priceQuarterly: '',
  priceBiannual: '',
  priceYearly: '0',
  maxUsers: '',
  displayOrder: '0',
  status: 'active',
}

// ── Component ───────────────────────────────────────────────────────────

function AddPlanPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(initialForm)
  const [features, setFeatures] = useState<FeatureRow[]>([])
  const [limits, setLimits] = useState<LimitRow[]>([])
  const createPlan = useCreatePlan()

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Feature handlers
  const addFeature = () =>
    setFeatures((prev) => [...prev, { name: '', included: true }])
  const updateFeature = (idx: number, patch: Partial<FeatureRow>) =>
    setFeatures((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, ...patch } : f))
    )
  const removeFeature = (idx: number) =>
    setFeatures((prev) => prev.filter((_, i) => i !== idx))

  // Limit handlers
  const addLimit = () => setLimits((prev) => [...prev, { key: '', value: '' }])
  const updateLimit = (idx: number, patch: Partial<LimitRow>) =>
    setLimits((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l))
    )
  const removeLimit = (idx: number) =>
    setLimits((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim() || !form.slug.trim()) return

    // Build price object (omit empty optional cycles)
    const price: { monthly: number; quarterly?: number; biannual?: number; yearly: number } = {
      monthly: Number(form.priceMonthly) || 0,
      yearly: Number(form.priceYearly) || 0,
    }
    if (form.priceQuarterly !== '') {
      price.quarterly = Number(form.priceQuarterly) || 0
    }
    if (form.priceBiannual !== '') {
      price.biannual = Number(form.priceBiannual) || 0
    }

    // Build limits object from key/value rows
    const limitsObj: Record<string, number> = {}
    limits.forEach((l) => {
      const key = l.key.trim()
      if (key) limitsObj[key] = Number(l.value) || 0
    })

    // Build features array
    const featuresArr = features
      .filter((f) => f.name.trim() !== '')
      .map((f) => ({
        name: f.name.trim(),
        included: f.included,
      }))

    createPlan.mutate(
      {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        description: form.description.trim() || null,
        price,
        limits: Object.keys(limitsObj).length > 0 ? limitsObj : null,
        features: featuresArr.length > 0 ? featuresArr : null,
        max_users:
          form.maxUsers.trim() === '' ? null : Number(form.maxUsers) || null,
        display_order: Number(form.displayOrder) || 0,
        status: form.status as 'active' | 'inactive' | 'archived',
      },
      {
        onSuccess: () => {
          navigate({ to: '/admin/plans' })
        },
      }
    )
  }

  const handleCancel = () => {
    navigate({ to: '/admin/plans' })
  }

  return (
    <div className="space-y-6">
      {/* Page Header — Purple Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-purple-400 p-6 shadow-lg shadow-purple-500/30">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Add Subscription Plan</h1>
            <p className="text-sm text-white/80">
              Create a new plan that tenants can subscribe to
            </p>
          </div>
        </div>
      </div>

      {/* Back link */}
      <Button asChild variant="outline" size="sm">
        <Link to="/admin/plans">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Plans
        </Link>
      </Button>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border bg-card p-6 shadow-sm"
      >
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CreditCard className="h-5 w-5 text-purple-500" />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="plan-slug">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="plan-slug"
                placeholder="e.g. starter"
                value={form.slug}
                onChange={(e) =>
                  updateField(
                    'slug',
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  )
                }
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-description">Description</Label>
            <Textarea
              id="plan-description"
              placeholder="Describe what this plan offers..."
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Pricing</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price-monthly">Monthly ($)</Label>
              <Input
                id="price-monthly"
                type="number"
                min="0"
                step="0.01"
                value={form.priceMonthly}
                onChange={(e) => updateField('priceMonthly', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-quarterly">Quarterly ($)</Label>
              <Input
                id="price-quarterly"
                type="number"
                min="0"
                step="0.01"
                placeholder="optional"
                value={form.priceQuarterly}
                onChange={(e) => updateField('priceQuarterly', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-biannual">Biannual ($)</Label>
              <Input
                id="price-biannual"
                type="number"
                min="0"
                step="0.01"
                placeholder="optional"
                value={form.priceBiannual}
                onChange={(e) => updateField('priceBiannual', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-yearly">Yearly ($)</Label>
              <Input
                id="price-yearly"
                type="number"
                min="0"
                step="0.01"
                value={form.priceYearly}
                onChange={(e) => updateField('priceYearly', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Plan Config */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Plan Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan-max-users">Max Users</Label>
              <Input
                id="plan-max-users"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={form.maxUsers}
                onChange={(e) => updateField('maxUsers', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-display-order">Display Order</Label>
              <Input
                id="plan-display-order"
                type="number"
                min="0"
                value={form.displayOrder}
                onChange={(e) => updateField('displayOrder', e.target.value)}
              />
            </div>
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
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Features</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFeature}
              className="border-purple-300 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </div>
          {features.length === 0 ? (
            <p className="text-sm text-muted-foreground">No features added yet.</p>
          ) : (
            <div className="space-y-2">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder="Feature name"
                    value={feature.name}
                    onChange={(e) => updateFeature(idx, { name: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant={feature.included ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      updateFeature(idx, { included: !feature.included })
                    }
                    className={cn(
                      'min-w-[90px]',
                      feature.included &&
                        'bg-emerald-600 hover:bg-emerald-700 text-white'
                    )}
                  >
                    {feature.included ? 'Included' : 'Excluded'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeFeature(idx)}
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Limits */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Resource Limits</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLimit}
              className="border-purple-300 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Limit
            </Button>
          </div>
          {limits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No limits added yet.</p>
          ) : (
            <div className="space-y-2">
              {limits.map((limit, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder="Key (e.g. storage_mb)"
                    value={limit.key}
                    onChange={(e) => updateLimit(idx, { key: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Value"
                    value={limit.value}
                    onChange={(e) => updateLimit(idx, { value: e.target.value })}
                    className="w-32"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeLimit(idx)}
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={createPlan.isPending}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createPlan.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {createPlan.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Plan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
