import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, CheckCircle, Info, Loader2, Landmark } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { NestedAccountSelect } from '@/components/accounting/NestedAccountSelect'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const API_URL = import.meta.env.VITE_API_URL

type InventoryMappings = {
  fixed_asset_account_id?: number | null
  inventory_account_id?: number | null
  depreciation_expense_account_id?: number | null
  accumulated_depreciation_account_id?: number | null
  cash_bank_account_id?: number | null
}

const FIELDS: { key: keyof InventoryMappings; label: string; hint: string }[] = [
  {
    key: 'fixed_asset_account_id',
    label: 'Fixed Asset account',
    hint: 'Debited when an asset is purchased (e.g. Fixed Assets / Medical Equipment).',
  },
  {
    key: 'cash_bank_account_id',
    label: 'Default Cash / Bank account',
    hint: 'Credited when assets or goods are paid for (e.g. Cash in Hand).',
  },
  {
    key: 'inventory_account_id',
    label: 'Inventory / Purchase account',
    hint: 'Debited when goods are received against a GRN (e.g. Inventory / Stores).',
  },
  {
    key: 'depreciation_expense_account_id',
    label: 'Depreciation Expense account',
    hint: 'Debited each month when depreciation is posted.',
  },
  {
    key: 'accumulated_depreciation_account_id',
    label: 'Accumulated Depreciation account',
    hint: 'Credited each month when depreciation is posted (contra-asset).',
  },
]

export function InventoryAccountSettings() {
  const { accessToken: token } = useAuthStore()
  const queryClient = useQueryClient()
  const [mappings, setMappings] = useState<InventoryMappings>({})
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-mappings'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/app-settings/inventory-mappings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch inventory mappings')
      const json = await res.json()
      return (json.data || {}) as InventoryMappings
    },
    enabled: !!token,
  })

  useEffect(() => {
    if (data) setMappings(data)
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async (body: InventoryMappings) => {
      const res = await fetch(`${API_URL}/api/app-settings/inventory-mappings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to save inventory mappings')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-mappings'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
    onError: () => alert('Failed to save inventory accounts'),
  })

  const update = (key: keyof InventoryMappings, id: number | null) =>
    setMappings((m) => ({ ...m, [key]: id }))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Inventory Accounts
        </h1>
        <p className="text-muted-foreground mt-1">
          Choose the ledger accounts used to automatically post asset purchases,
          goods receipts and depreciation. Set these once — postings then happen
          automatically in the background.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
        <Info className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Sensible defaults from your Chart of Accounts are pre-filled, so this
          already works without changes. Adjust only if you want different
          accounts.
        </p>
      </div>

      <Card className="overflow-hidden shadow-none p-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-3 px-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow">
              <Landmark className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Account Mappings</CardTitle>
              <p className="text-xs text-muted-foreground">Ledger accounts used for automatic postings</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 md:p-3 divide-y divide-gray-100 dark:divide-gray-800">
          {FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-2 px-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{f.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.hint}</p>
              </div>
              <div className="w-full sm:w-72 shrink-0">
                <NestedAccountSelect
                  value={mappings[f.key] || null}
                  onChange={(id: number | null) => update(f.key, id)}
                  placeholder={`Select ${f.label.toLowerCase()}`}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          onClick={() => saveMutation.mutate(mappings)}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
            <CheckCircle className="size-4" /> Saved
          </span>
        )}
      </div>
    </div>
  )
}
