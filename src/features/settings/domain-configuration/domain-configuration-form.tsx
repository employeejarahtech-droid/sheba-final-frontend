import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, XCircle, Globe, Lock, RefreshCw, AlertTriangle, Clock, Plus, Trash2, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DomainSettingsPanel } from './domain-settings-panel'

const API_URL = import.meta.env.VITE_API_URL

interface DomainStatus {
  id: number
  domain: string
  status: 'pending' | 'verifying' | 'verified' | 'ssl_generating' | 'ssl_installed' | 'live' | 'error'
  error?: string
  sslExpiry?: string
  dnsToken?: string
  createdAt?: string
  updatedAt?: string
}

export function DomainConfigurationForm() {
  const { accessToken: token } = useAuthStore()
  const queryClient = useQueryClient()
  const [newDomain, setNewDomain] = useState('')
  const [dnsChecks, setDnsChecks] = useState<Record<number, { expected: string; actual: string[]; match: boolean }>>({})
  const [selectedDomainId, setSelectedDomainId] = useState<number | null>(null)

  // Check DNS records for all domains on load
  useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/domains`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch domains')
      const json = await res.json()
      const domains = json.data || []

      // Check DNS records for each domain
      const checks: typeof dnsChecks = {}
      for (const domain of domains) {
        try {
          const res = await fetch(`${API_URL}/api/domains/check-dns?domain=${domain.domain}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const data = await res.json()
            checks[domain.id] = {
              expected: domain.dnsToken || '',
              actual: data.data.records || [],
              match: data.data.records.includes(domain.dnsToken || '')
            }
          }
        } catch (error) {
          checks[domain.id] = {
            expected: domain.dnsToken || '',
            actual: [],
            match: false
          }
        }
      }
      setDnsChecks(checks)
      return domains
    },
    enabled: !!token,
  })

  // Fetch domains from API
  const { data: domains = [], isLoading, error } = useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/domains`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch domains')
      const json = await res.json()
      return json.data || []
    },
    enabled: !!token,
  })

  // Add domain mutation
  const addDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      const res = await fetch(`${API_URL}/api/domains`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.message || 'Failed to add domain')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      toast.success('Domain added successfully')
      setNewDomain('')
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to add domain')
    },
  })

  // Verify DNS mutation
  const verifyDNSMutation = useMutation({
    mutationFn: async (domainId: number) => {
      const res = await fetch(`${API_URL}/api/domains/${domainId}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to verify DNS')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to verify DNS')
    },
  })

  // Generate SSL mutation
  const generateSSLMutation = useMutation({
    mutationFn: async (domainId: number) => {
      const res = await fetch(`${API_URL}/api/domains/${domainId}/ssl`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.message || 'Failed to generate SSL')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      toast.success('SSL certificate generated successfully')
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to generate SSL certificate')
    },
  })

  // Go live mutation
  const goLiveMutation = useMutation({
    mutationFn: async (domainId: number) => {
      const res = await fetch(`${API_URL}/api/domains/${domainId}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.message || 'Failed to activate domain')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      toast.success('Domain is now live!')
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to activate domain')
    },
  })

  // Deactivate domain mutation
  const deactivateDomainMutation = useMutation({
    mutationFn: async (domainId: number) => {
      const res = await fetch(`${API_URL}/api/domains/${domainId}/deactivate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to deactivate domain')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      toast.success('Domain deactivated successfully')
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to deactivate domain')
    },
  })

  // Delete domain mutation
  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: number) => {
      console.log('Deleting domain:', domainId)
      const res = await fetch(`${API_URL}/api/domains/${domainId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      console.log('Delete response status:', res.status)
      const json = await res.json()
      console.log('Delete response:', json)
      if (!res.ok) {
        throw new Error(json.message || 'Failed to delete domain')
      }
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      toast.success('Domain deleted successfully')
    },
    onError: (err) => {
      console.error('Delete error:', err)
      toast.error(err.message || 'Failed to delete domain')
    },
  })

  // Regenerate DNS token mutation
  const regenerateTokenMutation = useMutation({
    mutationFn: async (domainId: number) => {
      const res = await fetch(`${API_URL}/api/domains/${domainId}/regenerate-token`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.message || 'Failed to regenerate token')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      toast.success('DNS token regenerated! Please update your DNS TXT record with the new token.')
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to regenerate token')
    },
  })

  const getStatusIcon = (status: DomainStatus['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'verifying':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'verified':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'ssl_generating':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'ssl_installed':
        return <Lock className="h-4 w-4 text-green-500" />
      case 'live':
        return <Globe className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const checkDNSRecords = async (domain: string) => {
    try {
      // Call our backend DNS check endpoint
      const res = await fetch(`${API_URL}/api/domains/check-dns?domain=${domain}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        return data.records || []
      }
      return []
    } catch (error) {
      console.error('DNS check failed:', error)
      return []
    }
  }

  const getStatusBadge = (status: DomainStatus['status']) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      verifying: { label: 'Verifying DNS', variant: 'default' as const, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      verified: { label: 'DNS Verified', variant: 'default' as const, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      ssl_generating: { label: 'Generating SSL', variant: 'default' as const, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      ssl_installed: { label: 'SSL Installed', variant: 'default' as const, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
      live: { label: 'Live', variant: 'default' as const, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      error: { label: 'Error', variant: 'destructive' as const, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
    }

    const config = statusConfig[status]
    return (
      <Badge className={cn("gap-1.5 font-medium", config.color)}>
        {getStatusIcon(status)}
        {config.label}
      </Badge>
    )
  }

  const handleAddDomain = () => {
    if (!newDomain.trim()) return
    addDomainMutation.mutate(newDomain)
  }

  const handleVerifyDNS = (domainEntry: DomainStatus) => {
    verifyDNSMutation.mutate(domainEntry.id)
  }

  const handleGenerateSSL = (domainEntry: DomainStatus) => {
    generateSSLMutation.mutate(domainEntry.id)
  }

  const handleGoLive = (domainEntry: DomainStatus) => {
    goLiveMutation.mutate(domainEntry.id)
  }

  const handleDelete = (domainId: number, domainStatus?: string) => {
    if (domainStatus === 'live') {
      toast.error('Cannot delete live domain. Please deactivate it first.')
      return
    }
    if (confirm('Are you sure you want to delete this domain? This action cannot be undone.')) {
      deleteDomainMutation.mutate(domainId)
    }
  }

  const handleDeactivate = (domainId: number) => {
    if (confirm('Are you sure you want to deactivate this domain? This will stop routing traffic to this domain.')) {
      deactivateDomainMutation.mutate(domainId)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load domains. Please refresh the page to try again.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Settings Panel Modal */}
      {selectedDomainId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <DomainSettingsPanel
              domainId={selectedDomainId}
              onClose={() => setSelectedDomainId(null)}
            />
          </div>
        </div>
      )}

      {/* Add New Domain Form - Modern Card Design - Only show if no domains exist */}
      {domains.length === 0 && (
        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-sm p-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Add Custom Domain</CardTitle>
                <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                  Configure a custom domain for your hospital
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="e.g., hospital.yourdomain.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  disabled={addDomainMutation.isPending}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                  className="h-10"
                />
              </div>
              <Button
                onClick={handleAddDomain}
                disabled={addDomainMutation.isPending || !newDomain.trim()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {addDomainMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Domain
            </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single Domain Limit Notice - Show when domain exists */}
      {domains.length > 0 && (
        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            <strong className="text-blue-900 dark:text-blue-100">Single Custom Domain Per Tenant:</strong>
            <p className="text-sm mt-2">
              Your tenant can configure <strong>one custom domain</strong>. To use a different domain, please delete your existing domain first.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Domain List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Configured Domains</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your custom domains and SSL certificates
            </p>
          </div>
          <Badge variant="outline" className="text-sm">{domains.length} Domain{domains.length !== 1 ? 's' : ''}</Badge>
        </div>

        {domains.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <Globe className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold mb-2">No custom domain configured yet</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
                You can add <strong>one custom domain</strong> for your tenant above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {domains.map((domainEntry: DomainStatus) => (
              <Card key={domainEntry.id} className="overflow-hidden transition-all duration-300 gap-0 shadow-sm hover:shadow-md p-0">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-3 px-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg shadow-md",
                        domainEntry.status === 'live' && "bg-gradient-to-br from-green-500 to-emerald-500",
                        domainEntry.status === 'error' && "bg-gradient-to-br from-red-500 to-rose-500",
                        (domainEntry.status === 'verified' || domainEntry.status === 'ssl_installed') && "bg-gradient-to-br from-blue-500 to-indigo-500",
                        (domainEntry.status === 'pending' || domainEntry.status === 'verifying' || domainEntry.status === 'ssl_generating') && "bg-gradient-to-br from-yellow-500 to-orange-500"
                      )}>
                        <Globe className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold">{domainEntry.domain}</CardTitle>
                        <CardDescription className="text-xs">
                          {domainEntry.status === 'live' && domainEntry.sslExpiry && (
                            <span className="flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              SSL expires: {domainEntry.sslExpiry}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(domainEntry.status)}
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {domainEntry.error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{domainEntry.error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Progress Steps */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Configuration Progress</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {(() => {
                          const steps = ['pending', 'verifying', 'verified', 'ssl_generating', 'ssl_installed', 'live']
                          const currentIndex = steps.indexOf(domainEntry.status)
                          return `${currentIndex + 1}/${steps.length} Steps`
                        })()}
                      </span>
                    </div>

                    <div className="grid grid-cols-6 gap-2">
                      {['Add', 'DNS', 'Verified', 'SSL', 'Installed', 'Live'].map((step, index) => {
                        const steps = ['pending', 'verifying', 'verified', 'ssl_generating', 'ssl_installed', 'live']
                        const stepStatus = steps[index]
                        const currentIndex = steps.indexOf(domainEntry.status)
                        const isComplete = index < currentIndex
                        const isCurrent = stepStatus === domainEntry.status
                        const isPending = index > currentIndex

                        return (
                          <div key={step} className="text-center">
                            <div
                              className={cn(
                                "mx-auto h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                                isComplete
                                  ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-md"
                                  : isCurrent
                                    ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md ring-2 ring-blue-300 dark:ring-blue-700"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                              )}
                            >
                              {isComplete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                            </div>
                            <div className="text-xs mt-1.5 font-medium text-gray-600 dark:text-gray-400">{step}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 items-center">
                    <Button
                      onClick={() => setSelectedDomainId(domainEntry.id)}
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                    {domainEntry.status === 'pending' && (
                      <Button
                        onClick={() => handleVerifyDNS(domainEntry)}
                        disabled={verifyDNSMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        size="sm"
                      >
                        {verifyDNSMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Verify DNS
                      </Button>
                    )}

                    {domainEntry.status === 'verified' && (
                      <Button
                        onClick={() => handleGenerateSSL(domainEntry)}
                        disabled={generateSSLMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        size="sm"
                      >
                        {generateSSLMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Lock className="mr-2 h-4 w-4" />
                        )}
                        Generate SSL
                      </Button>
                    )}

                    {domainEntry.status === 'ssl_installed' && (
                      <Button
                        onClick={() => handleGoLive(domainEntry)}
                        disabled={goLiveMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        size="sm"
                      >
                        {goLiveMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Globe className="mr-2 h-4 w-4" />
                        )}
                        Go Live
                      </Button>
                    )}

                    {domainEntry.status === 'error' && (
                      <Button
                        onClick={() => handleVerifyDNS(domainEntry)}
                        disabled={verifyDNSMutation.isPending}
                        variant="outline"
                        className="flex-1"
                        size="sm"
                      >
                        {verifyDNSMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Retry
                      </Button>
                    )}

                    {domainEntry.status === 'live' ? (
                      <Button
                        onClick={() => handleDeactivate(domainEntry.id)}
                        disabled={deactivateDomainMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                      >
                        {deactivateDomainMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Globe className="mr-2 h-4 w-4" />
                        )}
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleDelete(domainEntry.id, domainEntry.status)}
                        disabled={deleteDomainMutation.isPending}
                        variant="destructive"
                        size="sm"
                        className="ml-auto"
                      >
                        {deleteDomainMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    )}
                  </div>

                  {/* DNS Instructions for pending/verifying states */}
                  {(domainEntry.status === 'pending' || domainEntry.status === 'verifying' || domainEntry.status === 'error') && (
                    <>
                      <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                        <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertDescription className="text-blue-900 dark:text-blue-100">
                          <strong className="text-blue-900 dark:text-blue-100">📋 DNS Configuration Required:</strong>
                          <div className="mt-3">
                            <p className="text-sm mb-3">Add the following TXT record to your domain's DNS configuration:</p>
                            <div className="bg-white dark:bg-gray-900 rounded-lg border-2 border-blue-200 dark:border-blue-800 overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-blue-100 dark:bg-blue-900/30">
                                  <tr>
                                    <th className="px-4 py-2 text-left font-semibold text-blue-900 dark:text-blue-100 border-b border-blue-200 dark:border-blue-800">Type</th>
                                    <th className="px-4 py-2 text-left font-semibold text-blue-900 dark:text-blue-100 border-b border-blue-200 dark:border-blue-800">Host</th>
                                    <th className="px-4 py-2 text-left font-semibold text-blue-900 dark:text-blue-100 border-b border-blue-200 dark:border-blue-800">Value</th>
                                    <th className="px-4 py-2 text-left font-semibold text-blue-900 dark:text-blue-100 border-b border-blue-200 dark:border-blue-800">TTL</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="px-4 py-3 font-mono text-blue-800 dark:text-blue-200 border-b border-blue-100 dark:border-blue-900">TXT</td>
                                    <td className="px-4 py-3 font-mono text-blue-800 dark:text-blue-200 border-b border-blue-100 dark:border-blue-900">@</td>
                                    <td className="px-4 py-3 font-mono text-xs text-blue-800 dark:text-blue-200 border-b border-blue-100 dark:border-blue-900 break-all">{domainEntry.dnsToken || 'verification-token'}</td>
                                    <td className="px-4 py-3 font-mono text-blue-800 dark:text-blue-200 border-b border-blue-100 dark:border-blue-900">3600</td>
                                  </tr>
                                </tbody>
                              </table>
                              <div className="bg-blue-50 dark:bg-blue-950/30 px-4 py-2 text-xs text-blue-700 dark:text-blue-300">
                                <strong>Domain:</strong> {domainEntry.domain} | <strong>Record:</strong> @{domainEntry.domain}
                              </div>
                            </div>
                            <div className="mt-3 text-xs space-y-1 text-blue-800 dark:text-blue-200">
                              <p>💡 <strong>Where to add:</strong> Your domain provider's DNS settings (e.g., GoDaddy, Namecheap, Cloudflare)</p>
                              <p>⏱️ <strong>Propagation time:</strong> DNS changes may take 10-30 minutes to take effect</p>
                              <p>🔍 <strong>After adding:</strong> Click the "Verify DNS" button below to check your DNS records</p>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>

                      {/* DNS Record Comparison */}
                      {dnsChecks[domainEntry.id] && (
                        <Alert className={cn(
                          "mt-4 border-2",
                          dnsChecks[domainEntry.id]?.match
                            ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                            : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                        )}>
                          {dnsChecks[domainEntry.id]?.match ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                          <AlertDescription className={cn(
                            "text-sm",
                            dnsChecks[domainEntry.id]?.match
                              ? "text-green-900 dark:text-green-100"
                              : "text-red-900 dark:text-red-100"
                          )}>
                            <strong className={dnsChecks[domainEntry.id]?.match ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100"}>
                              {dnsChecks[domainEntry.id]?.match ? "✅ DNS Records Match!" : "❌ DNS Records Mismatch!"}
                            </strong>
                            <div className="mt-2 text-xs space-y-1">
                              <div>
                                <span className="font-semibold">Expected (from database):</span>
                                <code className="ml-2 p-1 bg-white dark:bg-gray-900 rounded text-xs">
                                  {dnsChecks[domainEntry.id]?.expected || 'N/A'}
                                </code>
                              </div>
                              <div>
                                <span className="font-semibold">Found in DNS:</span>
                                <code className="ml-2 p-1 bg-white dark:bg-gray-900 rounded text-xs">
                                  {dnsChecks[domainEntry.id]?.actual?.length > 0
                                    ? dnsChecks[domainEntry.id]?.actual.join(', ')
                                    : 'No TXT records found'
                                  }
                                </code>
                              </div>
                              {!dnsChecks[domainEntry.id]?.match && dnsChecks[domainEntry.id]?.actual?.length > 0 && (
                                <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded text-xs">
                                  <strong>How to fix:</strong> Update your TXT record to match the expected value above, or regenerate a new token to match your DNS.
                                  <div className="mt-2">
                                    <Button
                                      onClick={() => regenerateTokenMutation.mutate(domainEntry.id)}
                                      disabled={regenerateTokenMutation.isPending}
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                    >
                                      {regenerateTokenMutation.isPending ? (
                                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                      ) : (
                                        <RefreshCw className="mr-1 h-3 w-3" />
                                      )}
                                      Regenerate Token
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
