import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { NestedAccountSelect } from '@/components/accounting/NestedAccountSelect'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Save, CheckCircle, ArrowDownRight, ArrowUpRight, Plus, Trash2, HelpCircle, Info } from 'lucide-react'
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

const SCENARIO_META: Record<string, { color: string; description: string; isMoneyIn: boolean; accountTypes?: string[]; helpTitle: string; helpContent: string[] }> = {
    outdoor_test_payment: {
        color: 'from-blue-600 to-cyan-500',
        description: 'When an outdoor patient pays for tests/services',
        isMoneyIn: true,
        // Credit = Income; Debit (methods) = Asset (cash/bank)
        accountTypes: undefined,
        helpTitle: 'Outdoor Patient Payment',
        helpContent: [
            '• <strong>Credit Account (INCOME):</strong> Select 4110 (Laboratory/Pathology) or similar diagnostic income account',
            '• <strong>Payment Methods (ASSET):</strong> Map each payment type to an asset account:',
            '  - Cash → 1110 (Cash in Hand)',
            '  - Bank → 1210 (Bank — Operating Account)',
            '  - bKash → 1220 (Bank — Mobile Banking)',
            '• <strong>Example:</strong> Patient pays 500 TK via Cash → Debit Cash in Hand (1110) 500, Credit Laboratory/Pathology (4110) 500',
        ],
    },
    indoor_advance_payment: {
        color: 'from-green-600 to-emerald-500',
        description: 'When an indoor patient makes an advance payment before billing',
        isMoneyIn: true,
        helpTitle: 'Indoor Patient Advance Payment',
        helpContent: [
            '• <strong>Credit Account (LIABILITY):</strong> Select 2310 (IPD Admission Deposit/Advance)',
            '• <strong>Payment Methods (ASSET):</strong> Map to asset accounts where advances are received:',
            '  - Cash → 1110 (Cash in Hand)',
            '  - Bank → 1210 (Bank — Operating Account)',
            '• <strong>Example:</strong> Patient pays 10,000 TK advance → Debit Cash in Hand (1110) 10,000, Credit IPD Deposit (2310) 10,000',
            '• This advance is later adjusted against final bills',
        ],
    },
    indoor_final_bill_payment: {
        color: 'from-purple-600 to-violet-500',
        description: 'When an indoor patient pays against the final bill',
        isMoneyIn: true,
        helpTitle: 'Indoor Patient Final Bill Payment',
        helpContent: [
            '• <strong>Credit Account (INCOME):</strong> Select 4300 (Inpatient/IPD Income) or specific service accounts like 4310 (Bed/Cabin Charges)',
            '• <strong>Payment Methods (ASSET):</strong> Cash → 1110, Bank → 1210, Card → 1220',
            '• If advance exists, it will be auto-adjusted before recording final payment',
            '• <strong>Example:</strong> Final bill 15,000, Advance 10,000, Due 5,000 → Debit Cash (1110) 5,000, Credit IPD Income (4300) 15,000',
        ],
    },
    provider_payment_surgeon: {
        color: 'from-orange-600 to-amber-500',
        description: 'When paying a Surgeon through bill distribution',
        isMoneyIn: false,
        helpTitle: 'Surgeon Payment',
        helpContent: [
            '• <strong>Debit Account (LIABILITY):</strong> Select 2210 (Payable — Surgeon)',
            '• <strong>Payment Methods (ASSET):</strong> Bank Transfer → 1210, Cash → 1110',
            '• Used when distributing indoor bills to surgeons',
            '• <strong>Example:</strong> Pay Surgeon 5,000 TK → Debit Surgeon Payable (2210) 5,000, Credit Bank (1210) 5,000',
        ],
    },
    provider_payment_consultant: {
        color: 'from-orange-500 to-yellow-500',
        description: 'When paying a Consultant / Duty Doctor through bill distribution',
        isMoneyIn: false,
        helpTitle: 'Consultant / Duty Doctor Payment',
        helpContent: [
            '• <strong>Debit Account (LIABILITY):</strong> Select 2220 (Payable — Consultant)',
            '• <strong>Payment Methods (ASSET):</strong> Cash → 1110, Bank → 1210',
            '• For duty doctors and consultants providing indoor services',
            '• <strong>Example:</strong> Pay Consultant 3,000 TK → Debit Consultant Payable (2220) 3,000, Credit Cash (1110) 3,000',
        ],
    },
    provider_payment_anesthesiologist: {
        color: 'from-amber-600 to-orange-400',
        description: 'When paying an Anesthesiologist through bill distribution',
        isMoneyIn: false,
        helpTitle: 'Anesthesiologist Payment',
        helpContent: [
            '• <strong>Debit Account (LIABILITY):</strong> Select 2230 (Payable — Anaesthetist)',
            '• <strong>Payment Methods (ASSET):</strong> Bank Transfer → 1210',
            '• For anesthesia services provided during surgery',
            '• <strong>Example:</strong> Pay Anesthesiologist 2,500 TK → Debit Anesthesiologist Payable (2230) 2,500, Credit Bank (1210) 2,500',
        ],
    },
    provider_payment_assistant: {
        color: 'from-yellow-600 to-lime-500',
        description: 'When paying an Assistant through bill distribution',
        isMoneyIn: false,
        helpTitle: 'Assistant Payment',
        helpContent: [
            '• <strong>Debit Account (LIABILITY):</strong> Select 2240 (Payable — Assistant)',
            '• <strong>Payment Methods (ASSET):</strong> Cash → 1110',
            '• For assistants who help during surgeries/procedures',
            '• <strong>Example:</strong> Pay Assistant 1,500 TK → Debit Assistant Payable (2240) 1,500, Credit Cash (1110) 1,500',
        ],
    },
    provider_payment_referring_doctor: {
        color: 'from-teal-600 to-cyan-500',
        description: 'When paying a Referring / PC Doctor',
        isMoneyIn: false,
        helpTitle: 'Referring Doctor Payment',
        helpContent: [
            '• <strong>Debit Account (LIABILITY):</strong> Select 2250 (Payable — Visiting/External Doctor)',
            '• <strong>Payment Methods (ASSET):</strong> Cash → 1110',
            '• For doctors who refer patients to your facility',
            '• <strong>Example:</strong> Pay PC Doctor 2,000 TK commission → Debit External Dr Payable (2250) 2,000, Credit Cash (1110) 2,000',
        ],
    },
    provider_payment_staff: {
        color: 'from-slate-600 to-gray-500',
        description: 'When paying Staff salary / overtime / bonus',
        isMoneyIn: false,
        helpTitle: 'Staff Salary Payment',
        helpContent: [
            '• <strong>Debit Account (LIABILITY):</strong> Select 2510 (Salary/Wages Payable)',
            '• <strong>Payment Methods (ASSET):</strong> Bank Transfer → 1210, Cash → 1110',
            '• Used for monthly salary, overtime, bonus payments',
            '• <strong>Example:</strong> Pay Staff 50,000 TK salary → Debit Salary Payable (2510) 50,000, Credit Bank (1210) 50,000',
        ],
    },
    outdoor_refund: {
        color: 'from-red-600 to-rose-500',
        description: 'When refunding an outdoor patient (overpaid or returned)',
        isMoneyIn: false,
        helpTitle: 'Outdoor Patient Refund',
        helpContent: [
            '• <strong>Debit Account (INCOME):</strong> Select the same income account used originally (e.g., 4110 Laboratory/Pathology)',
            '• <strong>Payment Methods (ASSET):</strong> Cash → 1110, Bank → 1210',
            '• Used when tests are cancelled or overpayment is refunded',
            '• <strong>Example:</strong> Refund 500 TK → Debit Laboratory/Pathology (4110) 500, Credit Cash (1110) 500',
        ],
    },
    indoor_refund: {
        color: 'from-red-600 to-pink-500',
        description: 'When refunding an indoor patient (overpaid or returned)',
        isMoneyIn: false,
        helpTitle: 'Indoor Patient Refund',
        helpContent: [
            '• <strong>Debit Account (INCOME):</strong> Select 4300 (Inpatient/IPD Income) or specific service account',
            '• <strong>Payment Methods (ASSET):</strong> Cash → 1110, Bank → 1210',
            '• When indoor services are cancelled or excess is refunded',
            '• <strong>Example:</strong> Refund 2,000 TK → Debit IPD Income (4300) 2,000, Credit Cash (1110) 2,000',
        ],
    },
    general_income: {
        color: 'from-emerald-600 to-green-500',
        description: 'When General Income Happen',
        isMoneyIn: true,
        helpTitle: 'General Income',
        helpContent: [
            '• <strong>Recommended Default:</strong> Use account 4900 (Other/Non-operating Income)',
            '• <strong>Credit Account (INCOME):</strong> Select 4900 or specific accounts like:',
            '  - 4910 (Interest/Bank Income)',
            '  - 4920 (Donation/Grant Received)',
            '  - 4940 (Rent/Concession Income)',
            '• <strong>Payment Methods (ASSET):</strong> Cash → 1110, Bank → 1210',
            '• <strong>Example:</strong> Receive 10,000 TK rent → Debit Cash (1110) 10,000, Credit General Income (4900) 10,000',
        ],
    },
    general_expense: {
        color: 'from-indigo-600 to-blue-500',
        description: 'When General Expense Happen',
        isMoneyIn: false,
        helpTitle: 'General Expense',
        helpContent: [
            '• <strong>Recommended Default:</strong> Use account 6000 (Administrative Expense)',
            '• <strong>Debit Account (EXPENSE):</strong> Select 6000 or specific accounts like:',
            '  - 6010 (Rent Expense)',
            '  - 6020 (Utilities Expense)',
            '  - 6030 (Office Supplies Expense)',
            '• <strong>Payment Methods (ASSET):</strong> Bank → 1210, Cash → 1110',
            '• <strong>Example:</strong> Pay electricity bill 5,000 TK → Debit Admin Expense (6000) 5,000, Credit Bank (1210) 5,000',
        ],
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

    // Fetch chart of accounts to get account names
    const { data: accountsData } = useQuery({
        queryKey: ['chart-of-accounts'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/accounting/accounts`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch accounts')
            const json = await res.json()
            return json.data || []
        },
        enabled: !!token,
    })

    const [mappings, setMappings] = useState<PaymentMappings>({})
    const [saved, setSaved] = useState<string | null>(null)
    const [helpOpen, setHelpOpen] = useState(false)
    const [helpScenario, setHelpScenario] = useState<string | null>(null)

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

    // Get account name by ID
    const getAccountName = (accountId: number | null): string => {
        if (!accountId || !accountsData) return 'Unknown Account'
        const account = accountsData.find((acc: any) => acc.id === accountId)
        return account ? account.name : `Account ${accountId} (Not Found)`
    }

    // Get account type by ID
    const getAccountType = (accountId: number | null): string => {
        if (!accountId || !accountsData) return 'UNKNOWN'
        const account = accountsData.find((acc: any) => acc.id === accountId)
        return account ? account.type : 'UNKNOWN'
    }

    // Check if account type matches expected category
    const isAccountTypeCorrect = (accountType: string, expectedCategory: string): boolean => {
        if (!accountType || accountType === 'UNKNOWN') return false
        const normalizedType = accountType.toUpperCase().trim()
        const normalizedExpected = expectedCategory.toUpperCase().trim()

        // Match the category (ASSET, INCOME, EXPENSE, LIABILITY, EQUITY)
        return normalizedType.includes(normalizedExpected) ||
               normalizedType.startsWith(normalizedExpected.substring(0, 2)) ||
               (normalizedExpected === 'ASSET' && (normalizedType === 'ASSET' || normalizedType === 'ASSETS'))
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
                            <div className={`bg-gradient-to-r ${meta.color} px-5 py-3 flex items-center justify-between gap-3`}>
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <IconComp className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-white">{meta.description}</h3>
                                </div>
                                <button
                                    onClick={() => {
                                        setHelpScenario(key)
                                        setHelpOpen(true)
                                    }}
                                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group"
                                    title="View help for this transaction type"
                                >
                                    <HelpCircle className="w-4 h-4 text-white/80 hover:text-white" />
                                </button>
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
                                            Credit Account (Revenue / Receivable)
                                        </label>
                                        <NestedAccountSelect
                                            value={mapping.credit_account_id || null}
                                            onChange={(id: number | null) => updateMapping(key, 'credit_account_id', id)}
                                            placeholder="Select credit account"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                                            Debit Account (Payable / Revenue Reverse)
                                        </label>
                                        <NestedAccountSelect
                                            value={mapping.debit_account_id || null}
                                            onChange={(id: number | null) => updateMapping(key, 'debit_account_id', id)}
                                            placeholder="Select debit account"
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

            {/* Help Sheet/Drawer */}
            <Sheet open={helpOpen} onOpenChange={setHelpOpen}>
                <SheetContent
                    side="right"
                    className="max-w-[400px] sm:max-w-[450px] w-full overflow-y-auto"
                >
                    {helpScenario && SCENARIO_META[helpScenario] && (
                        <>
                            {/* Header */}
                            <SheetHeader className={`bg-gradient-to-r ${SCENARIO_META[helpScenario].color} border-b py-4 px-6 gap-0`}>
                                <div className="flex items-center gap-3 pr-8">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <Info className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <SheetTitle className="text-lg font-bold text-white">
                                            {SCENARIO_META[helpScenario].helpTitle}
                                        </SheetTitle>
                                        <p className="text-xs text-white/80 mt-0.5">
                                            Understanding this transaction type
                                        </p>
                                    </div>
                                </div>
                            </SheetHeader>

                            {/* Content */}
                            <div className="p-6">
                                {/* General Help Content */}
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                    Understanding this transaction:
                                </h4>
                                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                                    {SCENARIO_META[helpScenario].helpContent && SCENARIO_META[helpScenario].helpContent.length > 0 ? (
                                        SCENARIO_META[helpScenario].helpContent.map((item, idx) => (
                                            <li key={idx} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: item }} />
                                        ))
                                    ) : (
                                        <li className="text-gray-400 italic">Help content not available for this scenario.</li>
                                    )}
                                </ul>
                                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <h5 className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                        {SCENARIO_META[helpScenario].isMoneyIn ? '💰' : '💸'}
                                        <span>{SCENARIO_META[helpScenario].isMoneyIn ? 'Money IN Transaction' : 'Money OUT Transaction'}</span>
                                    </h5>
                                    <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                                        {SCENARIO_META[helpScenario].isMoneyIn
                                            ? 'Your asset account (cash/bank) increases with debit, and income account increases with credit.'
                                            : 'Your expense/payable account increases with debit, and asset account decreases with credit.'}
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setHelpOpen(false)}
                                    className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Got it, thanks!
                                </button>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
