/**
 * Settings Admin Page — Platform configuration grouped by category
 *
 * Route: /(platform)/admin/settings
 * Features: gradient header, tabbed categories (general/stripe/email/features
 * + generic fallback), per-tab editable key/value form, Save per category.
 *
 * IMPORTANT: backend returns each setting's `settings` field as a JSON STRING.
 * We JSON.parse it for editing and JSON.stringify on save.
 * useAllSettings() returns an unwrapped PlatformSetting[].
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Save,
  Settings as SettingsIcon,
  Globe,
  CreditCard,
  Mail,
  Puzzle,
  ToggleLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useAllSettings,
  useUpdateSettings,
} from '@/hooks/usePlatformAdmin'

export const Route = createFileRoute('/(platform)/admin/settings')({
  component: SettingsPage,
})

// ── Types ───────────────────────────────────────────────────────────────

interface PlatformSetting {
  id: number
  category: string
  settings: Record<string, unknown> | string
  updated_at?: string
}

type FieldType = 'text' | 'password' | 'number' | 'switch' | 'select'

interface FieldMeta {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  options?: { value: string; label: string }[]
  description?: string
  colSpan?: number
}

interface CategoryMeta {
  label: string
  description: string
  icon: React.ReactNode
  gradient: string
  iconGradient: string
  fields: FieldMeta[]
}

// ── Category metadata (field schemas) ───────────────────────────────────

const categoryMeta: Record<string, CategoryMeta> = {
  general: {
    label: 'General',
    description: 'Platform name, URL and registration settings',
    icon: <Globe className="w-4 h-4 text-white" />,
    gradient: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
    iconGradient: 'from-purple-500 to-pink-500',
    fields: [
      { key: 'platform_name', label: 'Platform Name', type: 'text', placeholder: 'My Platform', colSpan: 1 },
      { key: 'platform_url', label: 'Platform URL', type: 'text', placeholder: 'https://example.com', colSpan: 1 },
      { key: 'default_timezone', label: 'Default Timezone', type: 'text', placeholder: 'UTC', colSpan: 1 },
      { key: 'default_currency', label: 'Default Currency', type: 'text', placeholder: 'USD', colSpan: 1 },
      { key: 'default_language', label: 'Default Language', type: 'text', placeholder: 'en', colSpan: 1 },
      { key: 'trial_days', label: 'Trial Days', type: 'number', placeholder: '14', colSpan: 1 },
      { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'switch', description: 'Disable access for non-admin users', colSpan: 1 },
      { key: 'registration_enabled', label: 'Registration Enabled', type: 'switch', description: 'Allow new company registrations', colSpan: 1 },
    ],
  },
  stripe: {
    label: 'Stripe',
    description: 'Payment gateway configuration and API keys',
    icon: <CreditCard className="w-4 h-4 text-white" />,
    gradient: 'from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30',
    iconGradient: 'from-indigo-500 to-violet-500',
    fields: [
      { key: 'stripe_public_key', label: 'Public Key', type: 'text', placeholder: 'pk_live_...', colSpan: 2 },
      { key: 'stripe_secret_key', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...', colSpan: 2 },
      { key: 'stripe_webhook_secret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_...', colSpan: 2 },
      { key: 'stripe_mode', label: 'Mode', type: 'select', options: [{ value: 'test', label: 'Test' }, { value: 'live', label: 'Live' }], colSpan: 1 },
      { key: 'stripe_currency', label: 'Currency', type: 'text', placeholder: 'usd', colSpan: 1 },
    ],
  },
  email: {
    label: 'Email',
    description: 'SMTP configuration for sending emails',
    icon: <Mail className="w-4 h-4 text-white" />,
    gradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
    iconGradient: 'from-blue-500 to-cyan-500',
    fields: [
      { key: 'smtp_host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.gmail.com', colSpan: 1 },
      { key: 'smtp_port', label: 'SMTP Port', type: 'text', placeholder: '587', colSpan: 1 },
      { key: 'smtp_user', label: 'SMTP Username', type: 'text', placeholder: 'user@example.com', colSpan: 1 },
      { key: 'smtp_pass', label: 'SMTP Password', type: 'password', placeholder: '••••••••', colSpan: 1 },
      { key: 'smtp_from_name', label: 'From Name', type: 'text', placeholder: 'Platform', colSpan: 1 },
      { key: 'smtp_from_email', label: 'From Email', type: 'text', placeholder: 'noreply@example.com', colSpan: 1 },
      { key: 'smtp_secure', label: 'Use TLS', type: 'switch', description: 'Enable secure connection', colSpan: 1 },
    ],
  },
  features: {
    label: 'Features',
    description: 'Enable or disable platform features and modules',
    icon: <Puzzle className="w-4 h-4 text-white" />,
    gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
    iconGradient: 'from-emerald-500 to-teal-500',
    fields: [
      { key: 'enable_multi_warehouse', label: 'Multi Warehouse', type: 'switch', description: 'Allow multiple warehouse management', colSpan: 1 },
      { key: 'enable_multi_currency', label: 'Multi Currency', type: 'switch', description: 'Support multiple currencies', colSpan: 1 },
      { key: 'enable_batch_tracking', label: 'Batch Tracking', type: 'switch', description: 'Track product batches and expiry', colSpan: 1 },
      { key: 'enable_pos', label: 'POS System', type: 'switch', description: 'Point of Sale interface', colSpan: 1 },
      { key: 'enable_ecommerce', label: 'E-Commerce', type: 'switch', description: 'Online store front', colSpan: 1 },
      { key: 'enable_api_access', label: 'API Access', type: 'switch', description: 'Allow third-party API access', colSpan: 1 },
      { key: 'enable_custom_domains', label: 'Custom Domains', type: 'switch', description: 'Allow companies to use custom domains', colSpan: 1 },
      { key: 'enable_email_notifications', label: 'Email Notifications', type: 'switch', description: 'Send email notifications to users', colSpan: 1 },
    ],
  },
}

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Parse a setting's `settings` field which may arrive as a JSON string
 * or already as an object. Always returns a Record.
 */
function parseSettings(raw: PlatformSetting['settings']): Record<string, unknown> {
  if (raw == null) return {}
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {}
    } catch {
      return {}
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return {}
}

/** Convert a raw stored value to a form-friendly string. */
function valueToString(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return ''
    }
  }
  return String(value)
}

// ── Component ───────────────────────────────────────────────────────────

function SettingsPage() {
  const { data: rawSettings, isLoading } = useAllSettings()
  const updateSettings = useUpdateSettings()

  const [activeTab, setActiveTab] = useState('')
  const [editData, setEditData] = useState<Record<string, unknown>>({})

  // useAllSettings returns PlatformSetting[]. Group settings by category and
  // parse each `settings` JSON string into an editable object.
  const settingsList: PlatformSetting[] = Array.isArray(rawSettings)
    ? (rawSettings as PlatformSetting[])
    : []

  const categories = useMemo(() => {
    const map = new Map<
      string,
      { settings: Record<string, unknown>; updated_at?: string }
    >()
    for (const item of settingsList) {
      map.set(item.category, {
        settings: parseSettings(item.settings),
        updated_at: item.updated_at,
      })
    }
    return map
  }, [settingsList])

  const categoryKeys = useMemo(
    () => Array.from(categories.keys()),
    [categories]
  )

  // Pick the initial active tab once data loads
  useEffect(() => {
    if (!activeTab && categoryKeys.length > 0) {
      setActiveTab(categoryKeys[0])
    }
  }, [categoryKeys, activeTab])

  // Reset edits when switching tabs
  useEffect(() => {
    setEditData({})
  }, [activeTab])

  const getFieldValue = (category: string, key: string): unknown => {
    if (editData[key] !== undefined) return editData[key]
    const cat = categories.get(category)
    return cat?.settings[key] ?? ''
  }

  const setFieldValue = (key: string, value: unknown) => {
    setEditData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = (category: string) => {
    const cat = categories.get(category)
    const original = cat?.settings ?? {}

    // Merge edits over original parsed settings; send full object back
    const merged: Record<string, unknown> = { ...original }
    for (const [key, value] of Object.entries(editData)) {
      merged[key] = value
    }

    // Determine if anything actually changed
    const hasChanges = Object.entries(editData).some(([key, value]) => {
      return JSON.stringify(value) !== JSON.stringify(original[key] ?? '')
    })

    if (!hasChanges) {
      return
    }

    updateSettings.mutate(
      { category, settings: merged },
      {
        onSuccess: () => {
          setEditData({})
        },
      }
    )
  }

  // ── Loading / Empty ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  if (categoryKeys.length === 0) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-purple-400 p-6 shadow-lg shadow-purple-500/30">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
              <p className="text-sm text-white/80">
                Configure platform-wide settings and integrations
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <SettingsIcon className="mx-auto h-10 w-10 text-purple-300" />
          <p className="mt-2 text-sm text-muted-foreground">
            No settings found.
          </p>
        </div>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header — Purple Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-purple-400 p-6 shadow-lg shadow-purple-500/30">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
            <SettingsIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
            <p className="text-sm text-white/80">
              Configure platform-wide settings and integrations
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {categoryKeys.map((cat) => {
          const meta = categoryMeta[cat]
          const isActive = activeTab === cat
          return (
            <Button
              key={cat}
              variant={isActive ? 'default' : 'outline'}
              onClick={() => setActiveTab(cat)}
              className={cn(
                'gap-2',
                isActive && 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600'
              )}
            >
              {meta?.icon}
              {meta?.label || cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          )
        })}
      </div>

      {/* Active Category Section */}
      {activeTab &&
        categories.has(activeTab) &&
        (categoryMeta[activeTab] ? (
          <CategorySection
            category={activeTab}
            meta={categoryMeta[activeTab]}
            categoryData={categories.get(activeTab)!}
            getFieldValue={getFieldValue}
            setFieldValue={setFieldValue}
            onSave={() => handleSave(activeTab)}
            isSaving={updateSettings.isPending}
          />
        ) : (
          <GenericCategorySection
            category={activeTab}
            categoryData={categories.get(activeTab)!}
            getFieldValue={getFieldValue}
            setFieldValue={setFieldValue}
            onSave={() => handleSave(activeTab)}
            isSaving={updateSettings.isPending}
          />
        ))}
    </div>
  )
}

// ── Category Section (known schema) ──────────────────────────────────────

function CategorySection({
  category,
  meta,
  categoryData,
  getFieldValue,
  setFieldValue,
  onSave,
  isSaving,
}: {
  category: string
  meta: CategoryMeta
  categoryData: { settings: Record<string, unknown>; updated_at?: string }
  getFieldValue: (category: string, key: string) => unknown
  setFieldValue: (key: string, value: unknown) => void
  onSave: () => void
  isSaving: boolean
}) {
  const updatedAt = categoryData.updated_at
    ? new Date(categoryData.updated_at).toLocaleString()
    : null

  const switchFields = meta.fields.filter((f) => f.type === 'switch')
  const inputFields = meta.fields.filter((f) => f.type !== 'switch')

  return (
    <div className="space-y-5">
      {/* Input Fields Card */}
      {inputFields.length > 0 && (
        <Card className="overflow-hidden transition-all duration-300 shadow-none p-0 gap-0">
          <CardHeader
            className={cn(
              'bg-gradient-to-r border-b py-1.5 px-4 gap-0',
              meta.gradient
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'p-2 bg-gradient-to-br rounded-lg shadow-lg',
                    meta.iconGradient
                  )}
                >
                  {meta.icon}
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">
                    {meta.label} Configuration
                  </CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {meta.description}
                  </p>
                </div>
              </div>
              {updatedAt && (
                <span className="text-xs text-muted-foreground">
                  Last updated: {updatedAt}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inputFields.map((field) => {
                const rawValue = getFieldValue(category, field.key)
                const strValue = valueToString(rawValue)
                return (
                  <div
                    key={field.key}
                    className={field.colSpan === 2 ? 'md:col-span-2' : ''}
                  >
                    <Label className="text-sm font-medium">{field.label}</Label>
                    {field.type === 'select' ? (
                      <Select
                        value={strValue}
                        onValueChange={(val) => setFieldValue(field.key, val)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        className="mt-1.5"
                        type={
                          field.type === 'password'
                            ? 'password'
                            : field.type === 'number'
                            ? 'number'
                            : 'text'
                        }
                        placeholder={field.placeholder}
                        value={strValue}
                        onChange={(e) =>
                          setFieldValue(
                            field.key,
                            field.type === 'number'
                              ? e.target.value === ''
                                ? ''
                                : Number(e.target.value)
                              : e.target.value
                          )
                        }
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Toggles Card */}
      {switchFields.length > 0 && (
        <Card className="overflow-hidden transition-all duration-300 shadow-none p-0 gap-0">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b py-1.5 px-4 gap-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-lg">
                <ToggleLeft className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">
                  {category === 'features' ? 'Feature Flags' : 'Toggles'}
                </CardTitle>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Enable or disable{' '}
                  {category === 'features' ? 'platform features' : 'options'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {switchFields.map((field) => {
                const checked = !!getFieldValue(category, field.key)
                return (
                  <div
                    key={field.key}
                    className="flex items-center justify-between rounded-lg border p-3 gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <Label className="text-sm font-medium">
                        {field.label}
                      </Label>
                      {field.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {field.description}
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={checked}
                      onCheckedChange={(val) => setFieldValue(field.key, val)}
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end pb-6">
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white min-w-[200px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save {meta.label} Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// ── Generic Category Section (fallback for unknown categories) ───────────

function GenericCategorySection({
  category,
  categoryData,
  getFieldValue,
  setFieldValue,
  onSave,
  isSaving,
}: {
  category: string
  categoryData: { settings: Record<string, unknown>; updated_at?: string }
  getFieldValue: (category: string, key: string) => unknown
  setFieldValue: (key: string, value: unknown) => void
  onSave: () => void
  isSaving: boolean
}) {
  const settings = categoryData.settings
  const updatedAt = categoryData.updated_at
    ? new Date(categoryData.updated_at).toLocaleString()
    : null

  const entries = Object.entries(settings)

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden transition-all duration-300 shadow-none p-0 gap-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30 border-b py-1.5 px-4 gap-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-gray-500 to-slate-500 rounded-lg shadow-lg">
                <SettingsIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </CardTitle>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Configuration settings
                </p>
              </div>
            </div>
            {updatedAt && (
              <span className="text-xs text-muted-foreground">
                Last updated: {updatedAt}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No settings in this category.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entries.map(([key, value]) => {
                const isBoolean = typeof value === 'boolean'
                const prettyKey = key
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase())
                if (isBoolean) {
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-lg border p-3 gap-3"
                    >
                      <Label className="text-sm font-medium">{prettyKey}</Label>
                      <Switch
                        checked={!!getFieldValue(category, key)}
                        onCheckedChange={(val) => setFieldValue(key, val)}
                      />
                    </div>
                  )
                }
                return (
                  <div key={key}>
                    <Label className="text-sm font-medium">{prettyKey}</Label>
                    <Input
                      className="mt-1.5"
                      value={valueToString(getFieldValue(category, key))}
                      onChange={(e) => setFieldValue(key, e.target.value)}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end pb-6">
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white min-w-[200px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
