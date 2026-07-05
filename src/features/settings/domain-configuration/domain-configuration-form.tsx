import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, XCircle, Globe, Lock, Clock, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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

// Tenant-facing page is intentionally simple: request a domain, see its
// status. No DNS/SSL steps are shown to the tenant — everything (DNS
// verification, SSL install, going live, and deactivation) is handled by
// an admin from the platform admin panel (hmsap.com/admin/companies/:id)
// — see $companyId.tsx.
export function DomainConfigurationForm() {
  const { accessToken: token } = useAuthStore()
  const queryClient = useQueryClient()
  const [newDomain, setNewDomain] = useState('')

  // Renders straight from the DB's stored status — no live DNS/SSL checks here.
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
      toast.success('Domain requested successfully')
      setNewDomain('')
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to request domain')
    },
  })

  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: number) => {
      const res = await fetch(`${API_URL}/api/domains/${domainId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
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
      toast.error(err.message || 'Failed to delete domain')
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

  const getStatusBadge = (status: DomainStatus['status']) => {
    const statusConfig = {
      pending: { label: 'Requested', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      verifying: { label: 'Under Review', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      verified: { label: 'Being Set Up', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      ssl_generating: { label: 'Being Set Up', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      ssl_installed: { label: 'Almost Ready', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
      live: { label: 'Live', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      error: { label: 'Needs Attention', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
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

  const handleDelete = (domainId: number, domainStatus?: string) => {
    if (domainStatus === 'live') {
      toast.error('Cannot delete a live domain. Please contact support to deactivate it first.')
      return
    }
    if (confirm('Are you sure you want to delete this domain? This action cannot be undone.')) {
      deleteDomainMutation.mutate(domainId)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />
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
      {/* Add New Domain Form — only show if no domain exists yet */}
      {domains.length === 0 && (
        <Card className="overflow-hidden gap-0 shadow-sm p-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Request a Custom Domain</CardTitle>
                <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                  Enter the domain you'd like to use — our team will set up DNS and SSL for you
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
                Request Domain
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {domains.length > 0 && (
        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            <strong>Single Custom Domain Per Tenant:</strong>
            <p className="text-sm mt-2">
              Your tenant can request <strong>one custom domain</strong>. To use a different domain, please cancel your existing request first.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Domain List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Your Domain</h3>
          <Badge variant="outline" className="text-sm">{domains.length} Domain{domains.length !== 1 ? 's' : ''}</Badge>
        </div>

        {domains.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <Globe className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold mb-2">No custom domain requested yet</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
                You can request <strong>one custom domain</strong> for your tenant above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {domains.map((domainEntry: DomainStatus) => (
              <Card key={domainEntry.id} className="overflow-hidden gap-0 shadow-sm p-0">
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
                        {domainEntry.status === 'live' && domainEntry.sslExpiry && (
                          <CardDescription className="text-xs flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            SSL expires: {domainEntry.sslExpiry}
                          </CardDescription>
                        )}
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

                  {/* No DNS/SSL steps for the tenant — our team handles setup end-to-end */}
                  {domainEntry.status !== 'live' && !domainEntry.error && (
                    <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertDescription className="text-blue-900 dark:text-blue-100">
                        <strong>Request received.</strong>
                        <p className="text-sm mt-1">
                          Our team is setting up DNS and SSL for this domain. You don't need to do anything else —
                          we'll notify you once it's live.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleDelete(domainEntry.id, domainEntry.status)}
                      disabled={deleteDomainMutation.isPending}
                      variant="destructive"
                      size="sm"
                    >
                      {deleteDomainMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
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
