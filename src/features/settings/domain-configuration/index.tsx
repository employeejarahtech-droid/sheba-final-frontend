import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    Globe,
    AlertCircle,
    CheckCircle2,
    Clock,
    Loader2,
    Lock,
    CircleX,
    Trash2,
} from 'lucide-react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getCookie } from '@/lib/cookies'
import api from '@/lib/axios'
import { ContentSection } from '../components/content-section'

type DomainStatus =
    | 'pending'
    | 'verifying'
    | 'verified'
    | 'ssl_generating'
    | 'ssl_installed'
    | 'live'
    | 'error'

interface Domain {
    id: number
    domain: string
    status: DomainStatus
    error?: string | null
    sslExpiry?: string | null
    dnsToken?: string | null
    ipAddress?: string | null
}

const STATUS_META: Record<DomainStatus, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    verifying: { label: 'Verifying DNS', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    verified: { label: 'DNS Verified', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    ssl_generating: { label: 'Generating SSL', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    ssl_installed: { label: 'SSL Installed', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    live: { label: 'Live', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    error: { label: 'Error', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

function statusIcon(status: DomainStatus) {
    switch (status) {
        case 'pending':
            return <Clock className='h-4 w-4 text-yellow-500' />
        case 'verifying':
        case 'ssl_generating':
            return <Loader2 className='h-4 w-4 text-blue-500 animate-spin' />
        case 'verified':
            return <CheckCircle2 className='h-4 w-4 text-green-500' />
        case 'ssl_installed':
            return <Lock className='h-4 w-4 text-green-500' />
        case 'live':
            return <Globe className='h-4 w-4 text-green-500' />
        case 'error':
            return <CircleX className='h-4 w-4 text-red-500' />
    }
}

function StatusBadge({ status }: { status: DomainStatus }) {
    const meta = STATUS_META[status]
    return (
        <Badge className={cn('gap-1.5 font-medium', meta.color)}>
            {statusIcon(status)}
            {meta.label}
        </Badge>
    )
}

function DomainConfigurationPanel() {
    const token = getCookie('accessToken')
    const queryClient = useQueryClient()
    const [newDomain, setNewDomain] = useState('')

    const { data: domains = [], isLoading, error } = useQuery({
        queryKey: ['domains'],
        queryFn: async () => {
            const res = await api.get('/domains')
            return (res.data?.data || []) as Domain[]
        },
        enabled: !!token,
    })

    const addDomain = useMutation({
        mutationFn: async (domain: string) => {
            const res = await api.post('/domains', { domain })
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['domains'] })
            toast.success('Domain added successfully')
            setNewDomain('')
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to add domain')
        },
    })

    const deleteDomain = useMutation({
        mutationFn: async (id: number) => {
            const res = await api.delete(`/domains/${id}`)
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['domains'] })
            toast.success('Domain deleted successfully')
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to delete domain')
        },
    })

    const handleAdd = () => {
        if (newDomain.trim()) addDomain.mutate(newDomain.trim())
    }

    const handleDelete = (id: number, status: DomainStatus) => {
        if (status === 'live') {
            toast.error('Cannot delete a live domain. Please contact support to deactivate it first.')
            return
        }
        if (confirm('Are you sure you want to delete this domain? This action cannot be undone.')) {
            deleteDomain.mutate(id)
        }
    }

    if (isLoading) {
        return (
            <div className='space-y-4'>
                <div className='animate-pulse h-24 bg-gray-200 dark:bg-gray-800 rounded-xl' />
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>Failed to load domains. Please refresh the page to try again.</AlertDescription>
            </Alert>
        )
    }

    return (
        <div className='space-y-6'>
            {domains.length === 0 && (
                <Card className='overflow-hidden gap-0 shadow-sm p-0'>
                    <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-3 px-4'>
                        <div className='flex items-center gap-3'>
                            <div className='p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg'>
                                <Globe className='w-4 h-4 text-white' />
                            </div>
                            <div>
                                <CardTitle className='text-lg font-bold'>Add Custom Domain</CardTitle>
                                <CardDescription className='text-xs text-gray-600 dark:text-gray-400'>
                                    Configure a custom domain for your hospital
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className='p-4'>
                        <div className='flex gap-3'>
                            <div className='flex-1'>
                                <Input
                                    placeholder='e.g., hospital.yourdomain.com'
                                    value={newDomain}
                                    onChange={(e) => setNewDomain(e.target.value)}
                                    disabled={addDomain.isPending}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                    className='h-10'
                                />
                            </div>
                            <Button
                                onClick={handleAdd}
                                disabled={addDomain.isPending || !newDomain.trim()}
                                className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                            >
                                {addDomain.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                                Add Domain
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {domains.length > 0 && (
                <Alert className='bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'>
                    <AlertCircle className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                    <AlertDescription className='text-blue-900 dark:text-blue-100'>
                        <strong>Single Custom Domain Per Tenant:</strong>
                        <p className='text-sm mt-2'>
                            Your tenant can configure <strong>one custom domain</strong>. To use a different domain,
                            please delete your existing domain first.
                        </p>
                    </AlertDescription>
                </Alert>
            )}

            <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-bold'>Your Domain</h3>
                    <Badge variant='outline' className='text-sm'>
                        {domains.length} Domain{domains.length !== 1 ? 's' : ''}
                    </Badge>
                </div>

                {domains.length === 0 ? (
                    <Card className='border-dashed'>
                        <CardContent className='flex flex-col items-center justify-center py-12'>
                            <div className='p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4'>
                                <Globe className='h-8 w-8 text-gray-400' />
                            </div>
                            <h4 className='text-lg font-semibold mb-2'>No custom domain configured yet</h4>
                            <p className='text-sm text-gray-500 dark:text-gray-400 text-center max-w-md'>
                                You can add <strong>one custom domain</strong> for your tenant above.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className='space-y-4'>
                        {domains.map((d) => (
                            <Card key={d.id} className='overflow-hidden gap-0 shadow-sm p-0'>
                                <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-3 px-4'>
                                    <div className='flex items-start justify-between'>
                                        <div className='flex items-center gap-3'>
                                            <div
                                                className={cn(
                                                    'p-2 rounded-lg shadow-md',
                                                    d.status === 'live' && 'bg-gradient-to-br from-green-500 to-emerald-500',
                                                    d.status === 'error' && 'bg-gradient-to-br from-red-500 to-rose-500',
                                                    (d.status === 'verified' || d.status === 'ssl_installed') &&
                                                        'bg-gradient-to-br from-blue-500 to-indigo-500',
                                                    (d.status === 'pending' || d.status === 'verifying' || d.status === 'ssl_generating') &&
                                                        'bg-gradient-to-br from-yellow-500 to-orange-500'
                                                )}
                                            >
                                                <Globe className='w-4 h-4 text-white' />
                                            </div>
                                            <div>
                                                <CardTitle className='text-base font-bold'>{d.domain}</CardTitle>
                                                {d.status === 'live' && d.sslExpiry && (
                                                    <CardDescription className='text-xs flex items-center gap-1'>
                                                        <Lock className='h-3 w-3' />
                                                        SSL expires: {d.sslExpiry}
                                                    </CardDescription>
                                                )}
                                            </div>
                                        </div>
                                        <StatusBadge status={d.status} />
                                    </div>
                                </CardHeader>
                                <CardContent className='p-4 space-y-4'>
                                    {d.error && (
                                        <Alert variant='destructive'>
                                            <AlertCircle className='h-4 w-4' />
                                            <AlertDescription>{d.error}</AlertDescription>
                                        </Alert>
                                    )}

                                    {d.status !== 'live' && (
                                        <Alert className='bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'>
                                            <AlertCircle className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                                            <AlertDescription className='text-blue-900 dark:text-blue-100'>
                                                <strong>📋 DNS Configuration Required:</strong>
                                                <div className='mt-3'>
                                                    <p className='text-sm mb-3'>
                                                        Add the following records to your domain's DNS configuration —
                                                        the <strong>A record</strong> points your domain at our server,
                                                        and the <strong>TXT record</strong> proves you own the domain:
                                                    </p>
                                                    <div className='bg-white dark:bg-gray-900 rounded-lg border-2 border-blue-200 dark:border-blue-800 overflow-hidden'>
                                                        <table className='w-full text-sm'>
                                                            <thead className='bg-blue-100 dark:bg-blue-900/30'>
                                                                <tr>
                                                                    <th className='px-4 py-2 text-left font-semibold text-blue-900 dark:text-blue-100 border-b border-blue-200 dark:border-blue-800'>
                                                                        Type
                                                                    </th>
                                                                    <th className='px-4 py-2 text-left font-semibold text-blue-900 dark:text-blue-100 border-b border-blue-200 dark:border-blue-800'>
                                                                        Host
                                                                    </th>
                                                                    <th className='px-4 py-2 text-left font-semibold text-blue-900 dark:text-blue-100 border-b border-blue-200 dark:border-blue-800'>
                                                                        Value
                                                                    </th>
                                                                    <th className='px-4 py-2 text-left font-semibold text-blue-900 dark:text-blue-100 border-b border-blue-200 dark:border-blue-800'>
                                                                        TTL
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td className='px-4 py-3 font-mono text-blue-800 dark:text-blue-200 border-b border-blue-100 dark:border-blue-900'>
                                                                        A
                                                                    </td>
                                                                    <td className='px-4 py-3 font-mono text-blue-800 dark:text-blue-200 border-b border-blue-100 dark:border-blue-900'>
                                                                        @
                                                                    </td>
                                                                    <td className='px-4 py-3 font-mono text-xs text-blue-800 dark:text-blue-200 border-b border-blue-100 dark:border-blue-900 break-all'>
                                                                        {d.ipAddress || 'pending'}
                                                                    </td>
                                                                    <td className='px-4 py-3 font-mono text-blue-800 dark:text-blue-200 border-b border-blue-100 dark:border-blue-900'>
                                                                        3600
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td className='px-4 py-3 font-mono text-blue-800 dark:text-blue-200 border-b border-blue-100 dark:border-blue-900'>
                                                                        TXT
                                                                    </td>
                                                                    <td className='px-4 py-3 font-mono text-blue-800 dark:text-blue-200 border-b border-blue-100 dark:border-blue-900'>
                                                                        @
                                                                    </td>
                                                                    <td className='px-4 py-3 font-mono text-xs text-blue-800 dark:text-blue-200 border-b border-blue-100 dark:border-blue-900 break-all'>
                                                                        {d.dnsToken || 'verification-token'}
                                                                    </td>
                                                                    <td className='px-4 py-3 font-mono text-blue-800 dark:text-blue-200 border-b border-blue-100 dark:border-blue-900'>
                                                                        3600
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div className='mt-3 text-xs space-y-1 text-blue-800 dark:text-blue-200'>
                                                        <p>
                                                            💡 <strong>Where to add:</strong> Your domain provider's DNS settings
                                                            (e.g., GoDaddy, Namecheap, Cloudflare)
                                                        </p>
                                                        <p>
                                                            ⏱️ <strong>Propagation time:</strong> DNS changes may take 10-30
                                                            minutes to take effect
                                                        </p>
                                                        <p>
                                                            ✅ <strong>After adding:</strong> Our team will verify your DNS and
                                                            finish setting up your domain
                                                        </p>
                                                    </div>
                                                </div>
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <div className='flex justify-end'>
                                        <Button
                                            onClick={() => handleDelete(d.id, d.status)}
                                            disabled={deleteDomain.isPending}
                                            variant='destructive'
                                            size='sm'
                                        >
                                            {deleteDomain.isPending ? (
                                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                            ) : (
                                                <Trash2 className='mr-2 h-4 w-4' />
                                            )}
                                            Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export function SettingsDomainConfiguration() {
    return (
        <ContentSection
            title='Domain Configuration'
            desc='Add and manage custom domains for your hospital. Configure DNS, SSL certificates, and domain verification.'
        >
            <DomainConfigurationPanel />
        </ContentSection>
    )
}
