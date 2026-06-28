import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, CheckCircle, Info } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { NestedAccountSelect } from '@/components/accounting/NestedAccountSelect'

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
    return <div className="p-6 text-slate-500">Loading…</div>
  }

  return (
    <div className="max-w-3xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Inventory Accounts</h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose the ledger accounts used to automatically post asset purchases,
          goods receipts and depreciation. Set these once — postings then happen
          automatically in the background.
        </p>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-blue-600" />
        <p className="text-sm leading-relaxed text-slate-700">
          Sensible defaults from your Chart of Accounts are pre-filled, so this
          already works without changes. Adjust only if you want different
          accounts.
        </p>
      </div>

      <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-sm font-medium text-slate-800">{f.label}</label>
            <p className="mb-2 text-xs text-slate-500">{f.hint}</p>
            <NestedAccountSelect
              value={mappings[f.key] || null}
              onChange={(id: number | null) => update(f.key, id)}
              placeholder={`Select ${f.label.toLowerCase()}`}
            />
          </div>
        ))}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => saveMutation.mutate(mappings)}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="size-4" />
            {saveMutation.isPending ? 'Saving…' : 'Save'}
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
              <CheckCircle className="size-4" /> Saved
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
