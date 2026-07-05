import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Loader2, Globe, Lock, RefreshCw, AlertTriangle, Server, Mail, Shield, ExternalLink, Copy, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const API_URL = import.meta.env.VITE_API_URL

interface DomainSettings {
    id: number
    domain: string
    status: string
    nameservers?: string[]
    ipAddress?: string
    sslProvider?: 'letsencrypt' | 'custom' | 'none'
    sslAutoRenew?: boolean
    forwardTo?: string
    forwardType?: '301' | '302' | 'none'
    wwwPreference?: 'www' | 'non-www' | 'both'
    enforceHttps?: boolean
    enableHSTS?: boolean
    emailProvider?: string
    spfRecord?: string
    dmarcRecord?: string
    cdnEnabled?: boolean
    cdnProvider?: string
    monitoringEnabled?: boolean
}

interface DNSConfig {
    domain: string
    dnsToken: string
    nameservers: string[]
    ipAddress?: string
    wwwPreference: string
    recommendedRecords: Array<{
        type: string
        host: string
        value: string
        ttl: number
        description: string
    }>
}

interface DomainSettingsPanelProps {
    domainId: number
    onClose: () => void
}

export function DomainSettingsPanel({ domainId, onClose }: DomainSettingsPanelProps) {
    const { accessToken: token } = useAuthStore()
    const [activeTab, setActiveTab] = useState<'overview' | 'dns' | 'ssl' | 'security' | 'email' | 'cdn'>('overview')
    const [copied, setCopied] = useState<Record<string, boolean>>({})

    // Fetch domain settings
    const { data: settings, isLoading, error: settingsError, refetch } = useQuery({
        queryKey: ['domain-settings', domainId],
        queryFn: async () => {
            console.log('🔍 Fetching domain settings for ID:', domainId)
            console.log('🔑 Token exists:', !!token)
            console.log('🔑 Token length:', token?.length || 0)
            console.log('🌐 API URL:', `${API_URL}/api/domains/${domainId}`)

            const res = await fetch(`${API_URL}/api/domains/${domainId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            console.log('📡 Response status:', res.status)
            console.log('📡 Response ok:', res.ok)

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                console.error('❌ Error response:', errorData)
                console.error('❌ Error message:', errorData.message)
                console.error('❌ Status code:', res.status)

                // Provide detailed error information
                const errorMessage = errorData.message || `Failed to fetch domain settings`
                const statusInfo = res.status === 401
                    ? '(401 Unauthorized - Check your authentication)'
                    : res.status === 403
                    ? '(403 Forbidden - Insufficient permissions)'
                    : res.status === 404
                    ? '(404 Not Found - Domain or endpoint not found)'
                    : `(${res.status} - ${res.statusText})`

                throw new Error(`${errorMessage} ${statusInfo}`)
            }

            const json = await res.json()
            console.log('✅ Domain settings received:', json)
            return json.data as DomainSettings
        },
        enabled: !!token,
        retry: 1,
    })

    // Fetch DNS configuration
    const { data: dnsConfig, error: dnsError } = useQuery({
        queryKey: ['dns-config', domainId],
        queryFn: async () => {
            console.log('🔍 Fetching DNS config for ID:', domainId)
            const res = await fetch(`${API_URL}/api/domains/${domainId}/dns-config`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            console.log('📡 DNS config response status:', res.status)

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                console.error('❌ DNS config error:', errorData)
                throw new Error(errorData.message || `Failed to fetch DNS configuration (${res.status})`)
            }

            const json = await res.json()
            console.log('✅ DNS config received:', json)
            return json.data as DNSConfig
        },
        enabled: !!token && !!settings,
        retry: 1,
    })

    // Update settings mutation
    const updateSettingsMutation = useMutation({
        mutationFn: async (newSettings: Partial<DomainSettings>) => {
            const res = await fetch(`${API_URL}/api/domains/${domainId}/settings`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newSettings),
            })
            if (!res.ok) {
                const json = await res.json()
                throw new Error(json.message || 'Failed to update settings')
            }
            return res.json()
        },
        onSuccess: () => {
            refetch()
            toast.success('Domain settings updated successfully')
        },
        onError: (err) => {
            toast.error(err.message || 'Failed to update settings')
        },
    })

    const handleSettingChange = (key: keyof DomainSettings, value: any) => {
        updateSettingsMutation.mutate({ [key]: value })
    }

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text)
        setCopied({ ...copied, [key]: true })
        setTimeout(() => setCopied({ ...copied, [key]: false }), 2000)
        toast.success('Copied to clipboard')
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (settingsError || !settings) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    <div className="space-y-2">
                        <p className="font-semibold">Failed to load domain settings</p>
                        <p className="text-sm">{settingsError?.message || 'Unknown error occurred'}</p>

                        {/* Additional debugging information */}
                        <div className="bg-black/10 p-2 rounded mt-2 text-xs space-y-1">
                            <p><strong>Debugging Info:</strong></p>
                            <p>• Domain ID: {domainId}</p>
                            <p>• Token exists: {token ? '✅' : '❌'}</p>
                            <p>• Token length: {token?.length || 0} characters</p>
                            <p>• API URL: {API_URL}/api/domains/{domainId}</p>
                        </div>

                        <div className="text-xs space-y-1 mt-2">
                            <p className="font-semibold">Troubleshooting Steps:</p>
                            <p>• Check browser console (F12) for detailed error logs</p>
                            <p>• Verify you're logged in with valid session</p>
                            <p>• Make sure the API server is running on port 5001</p>
                            <p>• Try logging out and logging back in</p>
                            <p>• Clear browser cache and cookies</p>
                        </div>

                        <div className="flex gap-2 mt-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                                className="flex-1"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Retry
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.reload()}
                                className="flex-1"
                            >
                                Reload Page
                            </Button>
                        </div>
                    </div>
                </AlertDescription>
            </Alert>
        )
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Globe },
        { id: 'dns', label: 'DNS', icon: Server },
        { id: 'ssl', label: 'SSL', icon: Lock },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'email', label: 'Email', icon: Mail },
        { id: 'cdn', label: 'CDN', icon: ExternalLink },
    ] as const

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold">{settings.domain}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Manage your domain configuration and settings
                    </p>
                </div>
                <Button onClick={onClose} variant="outline" size="sm">
                    Close
                </Button>
            </div>

            {/* Tabs */}
            <div className="border-b">
                <div className="flex gap-2">
                    {tabs.map(tab => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 border-b-2 transition-colors",
                                    activeTab === tab.id
                                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                        : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Domain Overview</CardTitle>
                                <CardDescription>Basic domain information and status</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-gray-500">Domain</Label>
                                        <div className="font-mono text-sm">{settings.domain}</div>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-500">Status</Label>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={settings.status === 'live' ? 'default' : 'secondary'}>
                                                {settings.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {settings.nameservers && settings.nameservers.length > 0 && (
                                    <div>
                                        <Label className="text-xs text-gray-500">Nameservers</Label>
                                        <div className="space-y-1 mt-1">
                                            {settings.nameservers.map((ns, i) => (
                                                <div key={i} className="font-mono text-xs">{ns}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                                <CardDescription>Common domain management tasks</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button variant="outline" className="w-full justify-start">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Check DNS Propagation
                                </Button>
                                <Button variant="outline" className="w-full justify-start">
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy DNS Records
                                </Button>
                                <Button variant="outline" className="w-full justify-start">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Open in Browser
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'dns' && (dnsError || !dnsConfig) ? (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-2">
                                <p className="font-semibold">Failed to load DNS configuration</p>
                                <p className="text-sm">{dnsError?.message || 'Unknown error occurred'}</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => refetch()}
                                    className="mt-2"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Retry
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                ) : activeTab === 'dns' && dnsConfig && (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>DNS Configuration</CardTitle>
                                <CardDescription>Recommended DNS records for your domain</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Nameservers */}
                                {dnsConfig.nameservers && dnsConfig.nameservers.length > 0 && (
                                    <div>
                                        <Label className="text-sm font-semibold">Nameservers</Label>
                                        <div className="mt-2 space-y-1">
                                            {dnsConfig.nameservers.map((ns, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                                                    <code className="text-sm">{ns}</code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(ns, `ns-${i}`)}
                                                    >
                                                        {copied[`ns-${i}`] ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* DNS Records */}
                                <div>
                                    <Label className="text-sm font-semibold">DNS Records</Label>
                                    <div className="mt-2 space-y-2">
                                        {dnsConfig.recommendedRecords.map((record, i) => (
                                            <div key={i} className="border rounded-lg p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Badge variant="outline">{record.type}</Badge>
                                                    <span className="text-xs text-gray-500">{record.description}</span>
                                                </div>
                                                <div className="grid grid-cols-4 gap-2 text-xs">
                                                    <div>
                                                        <span className="text-gray-500">Host:</span>
                                                        <div className="font-mono">{record.host}</div>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="text-gray-500">Value:</span>
                                                        <div className="font-mono break-all">{record.value}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">TTL:</span>
                                                        <div className="font-mono">{record.ttl}</div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => copyToClipboard(`${record.type} ${record.host} ${record.value}`, `record-${i}`)}
                                                >
                                                    {copied[`record-${i}`] ? (
                                                        <>
                                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                                            Copied!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="mr-2 h-4 w-4" />
                                                            Copy Record
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* IP Address Configuration */}
                                <div>
                                    <Label className="text-sm font-semibold">Server IP Address</Label>
                                    <div className="flex gap-2 mt-2">
                                        <Input
                                            value={settings.ipAddress || ''}
                                            onChange={(e) => handleSettingChange('ipAddress', e.target.value)}
                                            placeholder="192.168.1.1"
                                            disabled={updateSettingsMutation.isPending}
                                        />
                                        <Button
                                            onClick={() => handleSettingChange('ipAddress', settings.ipAddress)}
                                            disabled={updateSettingsMutation.isPending}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* WWW Preference */}
                        <Card>
                            <CardHeader>
                                <CardTitle>WWW Preference</CardTitle>
                                <CardDescription>Choose how www subdomain should work</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {(['www', 'non-www', 'both'] as const).map(pref => (
                                        <label key={pref} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="wwwPreference"
                                                value={pref}
                                                checked={settings.wwwPreference === pref}
                                                onChange={() => handleSettingChange('wwwPreference', pref)}
                                                disabled={updateSettingsMutation.isPending}
                                                className="form-radio"
                                            />
                                            <span className="text-sm">{pref === 'both' ? 'Both www and non-www' : pref}</span>
                                        </label>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'ssl' && (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>SSL Certificate</CardTitle>
                                <CardDescription>Secure your domain with HTTPS</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <Label className="text-sm font-semibold">SSL Provider</Label>
                                        <div className="text-xs text-gray-500">Certificate authority</div>
                                    </div>
                                    <select
                                        value={settings.sslProvider || 'letsencrypt'}
                                        onChange={(e) => handleSettingChange('sslProvider', e.target.value)}
                                        disabled={updateSettingsMutation.isPending}
                                        className="border rounded px-3 py-2 text-sm"
                                    >
                                        <option value="letsencrypt">Let's Encrypt (Free)</option>
                                        <option value="custom">Custom Certificate</option>
                                        <option value="none">No SSL</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <Label className="text-sm font-semibold">Auto-Renew SSL</Label>
                                        <div className="text-xs text-gray-500">Automatically renew before expiry</div>
                                    </div>
                                    <Switch
                                        checked={settings.sslAutoRenew ?? true}
                                        onCheckedChange={(checked) => handleSettingChange('sslAutoRenew', checked)}
                                        disabled={updateSettingsMutation.isPending}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Security Settings</CardTitle>
                                <CardDescription>HTTPS and security configurations</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <Label className="text-sm font-semibold">Enforce HTTPS</Label>
                                        <div className="text-xs text-gray-500">Redirect all HTTP traffic to HTTPS</div>
                                    </div>
                                    <Switch
                                        checked={settings.enforceHttps ?? true}
                                        onCheckedChange={(checked) => handleSettingChange('enforceHttps', checked)}
                                        disabled={updateSettingsMutation.isPending}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <Label className="text-sm font-semibold">HSTS Enabled</Label>
                                        <div className="text-xs text-gray-500">HTTP Strict Transport Security</div>
                                    </div>
                                    <Switch
                                        checked={settings.enableHSTS ?? false}
                                        onCheckedChange={(checked) => handleSettingChange('enableHSTS', checked)}
                                        disabled={updateSettingsMutation.isPending}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'email' && (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Email Configuration</CardTitle>
                                <CardDescription>Set up email for your domain</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-sm font-semibold">Email Provider</Label>
                                    <Input
                                        value={settings.emailProvider || ''}
                                        onChange={(e) => handleSettingChange('emailProvider', e.target.value)}
                                        placeholder="Google Workspace, Microsoft 365, etc."
                                        disabled={updateSettingsMutation.isPending}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <Label className="text-sm font-semibold">SPF Record</Label>
                                    <Input
                                        value={settings.spfRecord || ''}
                                        onChange={(e) => handleSettingChange('spfRecord', e.target.value)}
                                        placeholder="v=spf1 include:_spf.google.com ~all"
                                        disabled={updateSettingsMutation.isPending}
                                        className="mt-2"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Prevents email spoofing
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-sm font-semibold">DMARC Record</Label>
                                    <Input
                                        value={settings.dmarcRecord || ''}
                                        onChange={(e) => handleSettingChange('dmarcRecord', e.target.value)}
                                        placeholder="v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
                                        disabled={updateSettingsMutation.isPending}
                                        className="mt-2"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Email authentication policy
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'cdn' && (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Content Delivery Network</CardTitle>
                                <CardDescription>Accelerate content delivery with CDN</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <Label className="text-sm font-semibold">Enable CDN</Label>
                                        <div className="text-xs text-gray-500">Distribute content globally</div>
                                    </div>
                                    <Switch
                                        checked={settings.cdnEnabled ?? false}
                                        onCheckedChange={(checked) => handleSettingChange('cdnEnabled', checked)}
                                        disabled={updateSettingsMutation.isPending}
                                    />
                                </div>

                                <div>
                                    <Label className="text-sm font-semibold">CDN Provider</Label>
                                    <Input
                                        value={settings.cdnProvider || ''}
                                        onChange={(e) => handleSettingChange('cdnProvider', e.target.value)}
                                        placeholder="Cloudflare, AWS CloudFront, etc."
                                        disabled={updateSettingsMutation.isPending}
                                        className="mt-2"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <Label className="text-sm font-semibold">Monitoring</Label>
                                        <div className="text-xs text-gray-500">Track uptime and performance</div>
                                    </div>
                                    <Switch
                                        checked={settings.monitoringEnabled ?? true}
                                        onCheckedChange={(checked) => handleSettingChange('monitoringEnabled', checked)}
                                        disabled={updateSettingsMutation.isPending}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Save Indicator */}
            {updateSettingsMutation.isPending && (
                <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm">Saving settings...</span>
                </div>
            )}
        </div>
    )
}
