import { AppHeader } from '@/components/layout/app-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getCookie } from '@/lib/cookies'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Settings, Loader2, Play, Clock, HardDrive, Database } from 'lucide-react'

const settingsSchema = z.object({
    frequency: z.string().min(1, 'Required'),
    max_backups: z.coerce.number().min(1, 'Must be at least 1').max(365, 'Max 365'),
    enabled: z.string().min(1, 'Required'),
})

const frequencyOptions = [
    { value: '0 0 * * *', label: 'Daily at Midnight' },
    { value: '0 */6 * * *', label: 'Every 6 Hours' },
    { value: '0 */12 * * *', label: 'Every 12 Hours' },
    { value: '0 0 * * 0', label: 'Weekly (Sunday Midnight)' },
]

export default function BackupSettings() {
    const token = getCookie('accessToken')
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['backup-settings'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/database/backup-settings`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error('Failed to fetch settings')
            return res.json()
        },
        enabled: !!token,
    })

    const settings = data?.data || { frequency: '0 0 * * *', max_backups: 30, enabled: 'true' }

    const form = useForm({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            frequency: settings.frequency,
            max_backups: settings.max_backups,
            enabled: settings.enabled,
        },
        values: {
            frequency: settings.frequency,
            max_backups: settings.max_backups,
            enabled: settings.enabled,
        },
    })

    const handleSave = async (values: z.infer<typeof settingsSchema>) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/database/backup-settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(values),
            })
            const json = await res.json()
            if (json.status) {
                toast.success(json.message || 'Settings saved')
                queryClient.invalidateQueries({ queryKey: ['backup-settings'] })
            } else {
                toast.error(json.message || 'Failed to save')
            }
        } catch {
            toast.error('Something went wrong')
        }
    }

    const [isBackingUp, setIsBackingUp] = useState(false)

    const handleManualBackup = async () => {
        setIsBackingUp(true)
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/database/backup-now`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            })
            const json = await res.json()
            if (json.status) {
                toast.success(json.message || 'Backup created')
            } else {
                toast.error(json.message || 'Backup failed')
            }
        } catch {
            toast.error('Something went wrong')
        } finally {
            setIsBackingUp(false)
        }
    }

    if (isLoading) {
        return (
            <>
                <AppHeader fixed />
                <main className="flex items-center justify-center h-64 p-4">
                    <Loader2 className="animate-spin" />
                </main>
            </>
        )
    }

    return (
        <>
            <AppHeader fixed />

            <main className="p-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Settings className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Backup Settings</h1>
                            <p className="text-muted-foreground">Configure automatic database backups</p>
                        </div>
                    </div>
                    <Button onClick={handleManualBackup} disabled={isBackingUp}>
                        {isBackingUp ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Database className="mr-2 h-4 w-4" />
                        )}
                        Backup Now
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 border-b py-2 px-4 gap-0">
                            <div className="flex items-center gap-2">
                                <Settings className="w-5 h-5 text-white" />
                                <CardTitle className="text-sm font-semibold text-white">Auto-Backup Configuration</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <p className="text-sm text-muted-foreground mb-6">
                                Schedule automatic database backups and manage retention.
                            </p>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleSave)} className="space-y-5">
                                    <FormField
                                        control={form.control}
                                        name="enabled"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Auto-Backup</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="true">Enabled</SelectItem>
                                                        <SelectItem value="false">Disabled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="frequency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Frequency</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {frequencyOptions.map((opt) => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="max_backups"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Max Backups to Keep</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min={1} max={365} {...field} />
                                                </FormControl>
                                                <p className="text-xs text-muted-foreground">
                                                    Older backups will be automatically deleted
                                                </p>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Save Settings
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                            <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 border-b py-2 px-4 gap-0">
                                <div className="flex items-center gap-2">
                                    <Database className="w-5 h-5 text-white" />
                                    <CardTitle className="text-sm font-semibold text-white">Manual Backup</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <p className="text-sm text-muted-foreground mb-4">
                                    Trigger an immediate database backup.
                                </p>
                                <Button onClick={handleManualBackup} variant="outline">
                                    <Play className="mr-2 h-4 w-4" />
                                    Backup Now
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                            <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-600 border-b py-2 px-4 gap-0">
                                <div className="flex items-center gap-2">
                                    <HardDrive className="w-5 h-5 text-white" />
                                    <CardTitle className="text-sm font-semibold text-white">Current Settings</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Schedule:</span>
                                        <span className="text-sm font-medium">
                                            {frequencyOptions.find((f) => f.value === settings.frequency)?.label || settings.frequency}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Retention:</span>
                                        <span className="text-sm font-medium">{settings.max_backups} backups</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`h-2.5 w-2.5 rounded-full ${settings.enabled === 'true' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                                        <span className="text-sm text-muted-foreground">Status:</span>
                                        <span className={`text-sm font-medium ${settings.enabled === 'true' ? 'text-emerald-600' : ''}`}>
                                            {settings.enabled === 'true' ? 'Active' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </>
    )
}
