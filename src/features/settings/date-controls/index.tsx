import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Building2, BedDouble, Save, Loader2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL
const KEY = 'date_controls'

type Key =
    | 'outdoor_invoice_date_changeable'
    | 'outdoor_due_collection_date_changeable'
    | 'indoor_admission_date_changeable'
    | 'indoor_advance_payment_date_changeable'
    | 'indoor_payment_date_changeable'

type DateControls = Record<Key, boolean>

const DEFAULTS: DateControls = {
    outdoor_invoice_date_changeable: false,
    outdoor_due_collection_date_changeable: false,
    indoor_admission_date_changeable: false,
    indoor_advance_payment_date_changeable: false,
    indoor_payment_date_changeable: false,
}

const GROUPS: { title: string; icon: any; headerClass: string; rows: { key: Key; label: string; desc: string }[] }[] = [
    {
        title: 'Outdoor',
        icon: Building2,
        headerClass: 'bg-gradient-to-r from-blue-600 to-indigo-600',
        rows: [
            { key: 'outdoor_invoice_date_changeable', label: 'Invoice Date changeable', desc: 'Let staff edit the invoice date on the outdoor invoice form (off = locked to today).' },
            { key: 'outdoor_due_collection_date_changeable', label: 'Due Collection Date changeable', desc: 'Let staff edit the payment date on due collection (off = locked to today).' },
        ],
    },
    {
        title: 'Indoor',
        icon: BedDouble,
        headerClass: 'bg-gradient-to-r from-purple-600 to-violet-600',
        rows: [
            { key: 'indoor_admission_date_changeable', label: 'Patient Admission Date changeable', desc: 'Let staff edit admission date/time (off = locked to now).' },
            { key: 'indoor_advance_payment_date_changeable', label: 'Advance Payment Date changeable', desc: 'Let staff edit the advance payment date (off = locked to today).' },
            { key: 'indoor_payment_date_changeable', label: 'Payment Date changeable', desc: 'Let staff edit the final-bill payment date (off = locked to today).' },
        ],
    },
]

export function SettingsDateControls() {
    const { accessToken: token } = useAuthStore()
    const queryClient = useQueryClient()
    const [values, setValues] = useState<DateControls>(DEFAULTS)

    const { data } = useQuery({
        queryKey: ['app-settings'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/app-settings`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch settings')
            const json = await res.json()
            return json.data || {}
        },
        enabled: !!token,
        // The ['app-settings'] cache is shared app-wide and the global default is
        // refetchOnMount: false, so opening this page would otherwise show stale
        // cached values without a request. Always refetch so the toggles reflect
        // whatever is currently persisted in the DB.
        staleTime: 0,
        refetchOnMount: 'always',
    })

    useEffect(() => {
        if (data && data[KEY]) {
            try {
                const parsed = typeof data[KEY] === 'string' ? JSON.parse(data[KEY]) : data[KEY]
                setValues({ ...DEFAULTS, ...(parsed || {}) })
            } catch {
                /* keep defaults on parse error */
            }
        }
    }, [data])

    const saveMutation = useMutation({
        mutationFn: async () => {
            console.log('=== Save Changes Clicked ===');
            console.log('Current values:', values);
            const payload = { [KEY]: JSON.stringify(values) };
            console.log('API Payload:', payload);

            const res = await fetch(`${API_URL}/api/app-settings`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            console.log('API Response Status:', res.status, res.statusText);
            const json: { message?: string; error?: string } = await res.json().catch(() => ({}))
            console.log('API Response JSON:', json);

            if (!res.ok) {
                const msg = json?.message || json?.error || `Save failed (HTTP ${res.status})`
                console.error('Save failed:', msg);
                throw new Error(msg)
            }
            console.log('Save successful!');
            return json
        },
        onSuccess: (data) => {
            console.log('=== Save Success ===', data);
            toast.success('Date controls saved successfully')
            queryClient.invalidateQueries({ queryKey: ['app-settings'] })
        },
        onError: (err) => {
            console.error('=== Save Error ===', err);
            toast.error(err instanceof Error ? err.message : 'Failed to save date controls')
        },
    })

    const toggle = (k: Key, v: boolean) => setValues((prev) => ({ ...prev, [k]: v }))

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Date Controls
                </h1>
                <p className="text-muted-foreground mt-1">
                    Choose which date fields staff may edit on each form. When a toggle is off, that date is locked to today (or now) and cannot be changed.
                </p>
            </div>

            {GROUPS.map((group) => {
                const Icon = group.icon
                return (
                    <Card key={group.title} className="overflow-hidden shadow-sm p-0 border border-slate-200 dark:border-slate-800">
                        <CardHeader className={`${group.headerClass} border-b py-2 px-4 gap-0`}>
                            <div className="flex items-center gap-2">
                                <Icon className="w-5 h-5 text-white" />
                                <CardTitle className="text-sm font-semibold text-white">{group.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-2 md:p-3 divide-y divide-gray-100 dark:divide-gray-800">
                            {group.rows.map((row) => (
                                <div key={row.key} className="flex items-center justify-between gap-4 px-2 py-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{row.label}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{row.desc}</p>
                                    </div>
                                    <Select
                                        value={values[row.key] ? 'yes' : 'no'}
                                        onValueChange={(v) => toggle(row.key, v === 'yes')}
                                    >
                                        <SelectTrigger className="w-20 h-9 rounded-md border-gray-200 dark:border-gray-700 bg-transparent text-sm font-medium">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="yes">Yes</SelectItem>
                                            <SelectItem value="no">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )
            })}

            <div className="flex justify-end">
                <Button
                    onClick={() => {
                        console.log('=== Save Changes Button Clicked ===');
                        console.log('Current state:', values);
                        console.log('Token exists:', !!token);
                        console.log('Mutation pending:', saveMutation.isPending);
                        saveMutation.mutate();
                    }}
                    disabled={saveMutation.isPending}
                >
                    {saveMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Save Changes
                </Button>
            </div>
        </div>
    )
}
