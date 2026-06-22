/**
 * Plans Admin Edit Page — Edit an existing subscription plan
 *
 * Route: /(platform)/admin/plans/edit/$planId
 * Loads plan via usePlan(id), prefills form, and on success navigates to /admin/plans.
 * Mirrors the contacts.tsx purple-gradient visual pattern.
 */

import { useState, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  CreditCard,
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
import { usePlan, useUpdatePlan } from '@/hooks/usePlatformAdmin'

export const Route = createFileRoute('/(platform)/admin/plans/edit/$planId')({
  component: EditPlanPage,
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

// ── Component ───────────────────────────────────────────────────────────

function EditPlanPage() {
  const { planId } = Route.useParams()
  const id = Number(planId)
  const navigate = useNavigate()

  const { data: plan, isLoading } = usePlan(id)
  const updatePlan = useUpdatePlan()

  const [form, setForm] = useState<FormState | null>(null)
  const [features, setFeatures] = useState<FeatureRow[]>([])
  const [limits, setLimits] = useState<LimitRow[]>([])

  // Prefill form when plan loads
  useEffect(() => {
    if (!plan) return

    const price = plan.price ?? { monthly: 0, yearly: 0 }
    const next: FormState = {
      name: plan.name ?? '',
      slug: plan.slug ?? '',
      description: plan.description ?? '',
      priceMonthly: price.monthly != null ? String(price.monthly) : '0',
      priceQuarterly:
        price.quarterly != null ? String(price.quarterly) : '',
      priceBiannual:
        price.biannual != null ? String(price.biannual) : '',
      priceYearly: price.yearly != null ? String(price.yearly) : '0',
      maxUsers: plan.max_users != null ? String(plan.max_users) : '',
      displayOrder: plan.display_order != null ? String(plan.display_order) : '0',
      status: plan.status ?? 'active',
    }
    setForm(next)

    // Prefill features (handle string[] or {name,included}[])
    if (Array.isArray(plan.features)) {
      setFeatures(
        plan.features.map((f) =>
          typeof f === 'string'
            ? { name: f, included: true }
            : { name: f.name ?? '', included: f.included !== false }
        )
      )
    } else {
      setFeatures([])
    }

    // Prefill limits (key/value object)
    if (plan.limits && typeof plan.limits === 'object') {
      setLimits(
        Object.entries(plan.limits).map(([key, value]) => ({
          key,
          value: String(value),
        }))
      )
    } else {
      setLimits([])
    }
  }, [plan])

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev))
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
    if (!form) return
    if (!form.name.trim() || !form.slug.trim()) return

    // Build price object (omit empty optional cycles)
    const price: Record<string, number> = {
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

    updatePlan.mutate(
      {
        id,
        data: {
          name: form.name.trim(),
          slug: form.slug.trim().toLowerCase(),
          description: form.description.trim() || null,
          price,
          limits: Object.keys(limitsObj).length > 0 ? limitsObj : null,
          features: featuresArr.length > 0 ? featuresArr : null,
          max_users:
            form.maxUsers.trim() === '' ? null : Number(form.maxUsers) || null,
          display_order: Number(form.displayOrder) || 0,
          status: form.status,
        },
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

  // Loading state
  if (isLoading || !form) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-purple-400 p-6 shadow-lg shadow-purple-500/30">
          <h1 className="text-2xl font-bold text-white">Edit Subscription Plan</h1>
          <p className="text-sm text-white/80">Loading plan details...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header — Purple Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-purple-400 p-6 shadow-lg shadow-purple-500/30">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Edit Subscription Plan</h1>
            <p className="text-sm text-white/80">
              {plan?.name ? `Updating “${plan.name}”` : 'Update plan details'}
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
              <span className="mr-1">+</span> Add Feature
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
              <span className="mr-1">+</span> Add Limit
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
            disabled={updatePlan.isPending}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updatePlan.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {updatePlan.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
