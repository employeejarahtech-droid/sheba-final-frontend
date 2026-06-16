import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { NestedAccountSelect } from '@/components/accounting/NestedAccountSelect'
import { Save, CheckCircle, ArrowDownRight, ArrowUpRight, Plus, Trash2 } from 'lucide-react'
import type { ChartOfAccount } from '@/types/accounting.types'

const API_URL = import.meta.env.VITE_API_URL

type MethodEntry = { name: string; account_id: number | null }
type ScenarioConfig = {
    label?: string
    narration_template?: string
    debit_account_id?: number | null
    credit_account_id?: number | null
    methods?: MethodEntry[]
    [key: string]: any
}
type PaymentMappings = Record<string, ScenarioConfig>

const SCENARIO_META: Record<string, { color: string; description: string; isMoneyIn: boolean; accountTypes?: string[] }> = {
    outdoor_test_payment: {
        color: 'from-blue-600 to-cyan-500',
        description: 'When an outdoor patient pays for tests/services',
        isMoneyIn: true,
        // Credit = Income; Debit (methods) = Asset (cash/bank)
        accountTypes: undefined, // selectors default to leaf-only (no control accounts)
    },
    indoor_advance_payment: {
        color: 'from-green-600 to-emerald-500',
        description: 'When an indoor patient makes an advance payment before billing',
        isMoneyIn: true,
    },
    indoor_final_bill_payment: {
        color: 'from-purple-600 to-violet-500',
        description: 'When an indoor patient pays against the final bill',
        isMoneyIn: true,
    },
    provider_payment_surgeon: {
        color: 'from-orange-600 to-amber-500',
        description: 'When paying a Surgeon through bill distribution',
        isMoneyIn: false,
    },
    provider_payment_consultant: {
        color: 'from-orange-500 to-yellow-500',
        description: 'When paying a Consultant / Duty Doctor through bill distribution',
        isMoneyIn: false,
    },
    provider_payment_anesthesiologist: {
        color: 'from-amber-600 to-orange-400',
        description: 'When paying an Anesthesiologist through bill distribution',
        isMoneyIn: false,
    },
    provider_payment_assistant: {
        color: 'from-yellow-600 to-lime-500',
        description: 'When paying an Assistant through bill distribution',
        isMoneyIn: false,
    },
    provider_payment_referring_doctor: {
        color: 'from-teal-600 to-cyan-500',
        description: 'When paying a Referring / PC Doctor',
        isMoneyIn: false,
    },
    provider_payment_staff: {
        color: 'from-slate-600 to-gray-500',
        description: 'When paying Staff salary / overtime / bonus',
        isMoneyIn: false,
    },
    outdoor_refund: {
        color: 'from-red-600 to-rose-500',
        description: 'When refunding an outdoor patient (overpaid or returned)',
        isMoneyIn: false,
    },
    indoor_refund: {
        color: 'from-red-600 to-pink-500',
        description: 'When refunding an indoor patient (overpaid or returned)',
        isMoneyIn: false,
    },
    general_income: {
        color: 'from-emerald-600 to-green-500',
        description: 'When General Income Happen',
        isMoneyIn: true,
    },
    general_expense: {
        color: 'from-indigo-600 to-blue-500',
        description: 'When General Expense Happen',
        isMoneyIn: false,
    },
}

export function PaymentAccountSettings() {
    const { accessToken: token } = useAuthStore()
    const queryClient = useQueryClient()

    const { data: mappingsData, isLoading } = useQuery({
        queryKey: ['payment-mappings'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/app-settings/payment-mappings`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch payment mappings')
            const json = await res.json()
            return json.data || {}
        },
        enabled: !!token,
    })

    const [mappings, setMappings] = useState<PaymentMappings>({})
    const [saved, setSaved] = useState<string | null>(null)

    useEffect(() => {
        if (mappingsData) setMappings(mappingsData)
    }, [mappingsData])

    const saveMutation = useMutation({
        mutationFn: async (data: PaymentMappings) => {
            const res = await fetch(`${API_URL}/api/app-settings/payment-mappings`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to save payment mappings')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-mappings'] })
        },
    })

    const handleSave = (key: string) => {
        saveMutation.mutate(mappings, {
            onSuccess: () => { setSaved(key); setTimeout(() => setSaved(null), 2000) },
            onError: () => { setSaved(null); alert('Failed to save payment mappings') },
        })
    }

    const handleSaveAll = () => {
        saveMutation.mutate(mappings, {
            onSuccess: () => { setSaved('all'); setTimeout(() => setSaved(null), 2000) },
        })
    }

    const updateMapping = (key: string, field: string, value: any) => {
        setMappings(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
    }

    // Get methods list for a scenario
    const getMethods = (key: string): MethodEntry[] => {
        return mappings[key]?.methods || []
    }

    // Add a new empty method row
    const addMethod = (scenarioKey: string) => {
        setMappings(prev => {
            const scenario = prev[scenarioKey] || {}
            const methods = [...(scenario.methods || []), { name: '', account_id: null }]
            return { ...prev, [scenarioKey]: { ...scenario, methods } }
        })
    }

    // Update a specific method row
    const updateMethod = (scenarioKey: string, index: number, field: keyof MethodEntry, value: any) => {
        setMappings(prev => {
            const scenario = prev[scenarioKey] || {}
            const methods = [...(scenario.methods || [])]
            methods[index] = { ...methods[index], [field]: value }
            return { ...prev, [scenarioKey]: { ...scenario, methods } }
        })
    }

    // Remove a method row
    const removeMethod = (scenarioKey: string, index: number) => {
        setMappings(prev => {
            const scenario = prev[scenarioKey] || {}
            const methods = [...(scenario.methods || [])]
            methods.splice(index, 1)
            return { ...prev, [scenarioKey]: { ...scenario, methods } }
        })
    }

    const isScenarioConfigured = (key: string) => {
        const m = mappings[key]
        if (!m) return false
        if (m.methods && m.methods.length > 0 && m.methods.some(ma => ma.account_id && ma.name)) return true
        if (m.debit_account_id || m.credit_account_id) return true
        return false
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (<div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Payment Account Mapping
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Configure double-entry accounts for each payment scenario. Add custom payment methods with their own account mapping.
                    </p>
                </div>
                <button
                    onClick={handleSaveAll}
                    disabled={saveMutation.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow transition-colors disabled:opacity-50"
                >
                    {saveMutation.isPending ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Save All
                </button>
            </div>

            <div className="grid gap-5">
                {Object.entries(SCENARIO_META).map(([key, meta]) => {
                    const mapping = mappings[key] || {}
                    const methods = getMethods(key)
                    const IconComp = meta.isMoneyIn ? ArrowDownRight : ArrowUpRight

                    return (
                        <div key={key} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                            <div className={`bg-gradient-to-r ${meta.color} px-5 py-3 flex items-center gap-3`}>
                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <IconComp className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="text-sm font-semibold text-white">{meta.description}</h3>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Narration */}
                                <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">Narration Template</label>
                                    <input
                                        type="text"
                                        value={mapping.narration_template || ''}
                                        onChange={(e) => updateMapping(key, 'narration_template', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 text-sm"
                                        placeholder="e.g. Payment received for admission #{admission_id}"
                                    />
                                </div>

                                {/* Fixed counter account */}
                                {meta.isMoneyIn ? (
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                                            Credit Account (Revenue / Receivable) — pick a leaf account
                                        </label>
                                        <NestedAccountSelect
                                            value={mapping.credit_account_id || null}
                                            onChange={(id: number | null) => updateMapping(key, 'credit_account_id', id)}
                                            placeholder="Select credit account"
                                            leafOnly
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                                            Debit Account (Payable / Revenue Reverse) — pick a leaf account
                                        </label>
                                        <NestedAccountSelect
                                            value={mapping.debit_account_id || null}
                                            onChange={(id: number | null) => updateMapping(key, 'debit_account_id', id)}
                                            placeholder="Select debit account"
                                            leafOnly
                                        />
                                    </div>
                                )}

                                {/* Payment Methods List */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                                            {meta.isMoneyIn ? 'Debit Account (Payment Methods)' : 'Credit Account (Payment Methods)'}
                                        </label>
                                        <button
                                            onClick={() => addMethod(key)}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Add Method
                                        </button>
                                    </div>

                                    {methods.length > 0 && (
                                        <div className="space-y-2">
                                            {/* Header */}
                                            <div className="grid grid-cols-[1fr_1fr_32px] gap-2 px-2">
                                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Method Name</span>
                                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Account</span>
                                                <span></span>
                                            </div>
                                            {methods.map((method, idx) => (
                                                <div key={idx} className="grid grid-cols-[1fr_1fr_32px] gap-2 items-center">
                                                    <input
                                                        type="text"
                                                        value={method.name}
                                                        onChange={(e) => updateMethod(key, idx, 'name', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 text-sm h-10"
                                                        placeholder="e.g. Cash, Bkash, Nagad..."
                                                    />
                                                    <NestedAccountSelect
                                                        value={method.account_id || null}
                                                        onChange={(id: number | null) => updateMethod(key, idx, 'account_id', id)}
                                                        placeholder="Select account"
                                                        leafOnly
                                                    />
                                                    <button
                                                        onClick={() => removeMethod(key, idx)}
                                                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {methods.length === 0 && (
                                        <div className="text-center py-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                                            <p className="text-xs text-gray-400 dark:text-gray-500">No payment methods added yet</p>
                                            <button
                                                onClick={() => addMethod(key)}
                                                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                <Plus className="w-3 h-3" /> Add first method
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Status & Save */}
                                <div className="flex items-center justify-between pt-1">
                                    <div>
                                        {isScenarioConfigured(key) ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                                                <CheckCircle className="w-3.5 h-3.5" /> Configured
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                Not configured
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleSave(key)}
                                        disabled={saveMutation.isPending}
                                        title="Saves all scenarios"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                    >
                                        {saved === key ? (<><CheckCircle className="w-3.5 h-3.5" /> Saved</>) : (<><Save className="w-3.5 h-3.5" /> Save all</>)}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
