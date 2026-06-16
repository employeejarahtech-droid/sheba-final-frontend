import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import {
  Building2,
  Shield,
  Copy,
  ExternalLink,
  CheckCircle2,
  Globe,
  Fingerprint,
  UserCircle,
  ArrowUpRight,
  ListChecks,
  MessageSquare,
  Lock,
  Users,
} from 'lucide-react'
import { getSubdomainInfo, buildTenantUrl } from '@/lib/subdomain'
import { toast } from 'sonner'
import { Main } from '@/components/layout/main'

export const Route = createFileRoute('/_authenticated/dashboard/company-account/')({
  component: CompanyAccount,
})

function CompanyAccount() {
  const user = useAuthStore((s) => s.user)
  const company = useAuthStore((s) => s.company)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const subdomainInfo = getSubdomainInfo()
  const subdomain = subdomainInfo.subdomain || company?.subdomain || 'demo'
  const tenantBaseUrl = buildTenantUrl(subdomain)
  const loginUrl = `${tenantBaseUrl}/login`
  const dashboardUrl = `${tenantBaseUrl}/dashboard`

  const workspaceId = company?.id || '—'

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleOpen = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleCopyEmailTemplate = () => {
    const template = `Hi Team,

I've set up our workspace on ${company?.name || 'our platform'}. You can access it using the link below:

Login URL: ${loginUrl}

Steps:
1. Click the link above to go to the login page
2. Sign up with your work email address
3. You'll automatically join our workspace
4. Start exploring the dashboard!

If you have any questions, feel free to reach out.

Best regards,
${user?.name || 'Administrator'}`

    handleCopy(template, 'email-template')
  }

  const accessLevelLabel =
    user?.userType === 'company_admin'
      ? 'Company Administrator'
      : user?.userType === 'platform_admin'
        ? 'Platform Administrator'
        : user?.userType === 'staff'
          ? 'Staff Member'
          : 'Administrator'

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : 'U'

  return (
    <Main className="flex flex-1 flex-col gap-3">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Company Account
            </h1>
            <p className="text-muted-foreground text-sm">Manage your workspace information and team login details</p>
          </div>
        </div>
        <Badge className="bg-blue-600 text-white hover:bg-blue-700 gap-1.5 px-3 py-1.5 text-xs font-medium">
          <Shield className="h-3.5 w-3.5" />
          SECURE WORKSPACE
        </Badge>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Workspace Details */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Workspace Details</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Your company workspace information</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Company Name</span>
                <span className="text-sm font-semibold">{company?.name || '—'}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Fingerprint className="h-3.5 w-3.5" />
                  Workspace ID
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-mono cursor-pointer hover:text-primary transition-colors">
                      #{workspaceId}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Unique workspace identifier</TooltipContent>
                </Tooltip>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  Company Domain
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-mono">
                    {subdomain}.{getSubdomainInfo().baseDomain}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleCopy(`${subdomain}.${getSubdomainInfo().baseDomain}`, 'domain')}
                  >
                    {copiedField === 'domain' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share with Your Team */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Share with Your Team</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Links for your team to access the workspace</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-xs">
                  ACTIVE LINKS
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-5">
              {/* Team Login Portal */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Team Login Portal
                </span>
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                  <span className="text-sm font-mono truncate max-w-[60%]">{loginUrl}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => handleCopy(loginUrl, 'login-url')}
                    >
                      {copiedField === 'login-url' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleOpen(loginUrl)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Main Dashboard Access */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Main Dashboard Access
                </span>
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                  <span className="text-sm font-mono truncate max-w-[60%]">{dashboardUrl}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => handleCopy(dashboardUrl, 'dashboard-url')}
                    >
                      {copiedField === 'dashboard-url' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleOpen(dashboardUrl)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Isolation */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-lg">
                  <Lock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Security & Isolation</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Your workspace security features</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-4">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Isolated Database</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                    Your data is stored in a separate, encrypted database — fully isolated from other workspaces.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-4">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Role-Based Access Control</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    Granular permissions ensure team members only access what they need.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/30 p-4">
                <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Secure Authentication</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                    JWT-based authentication with automatic token refresh and session management.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Your Profile */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg shadow-lg">
                  <UserCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Your Profile</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Your account information</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-12 w-12 bg-blue-600">
                  <AvatarFallback className="bg-blue-600 text-white font-semibold text-lg">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-base">{user?.name || '—'}</p>
                  <p className="text-sm text-muted-foreground">{user?.email || '—'}</p>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Access Level</span>
                  <span className="text-sm font-medium">{accessLevelLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Verified
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg shadow-lg">
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Common workspace tasks</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-11"
                onClick={() => handleOpen(loginUrl)}
              >
                <ArrowUpRight className="h-4 w-4 text-blue-600" />
                Visit Team Portal
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-11"
                onClick={handleCopyEmailTemplate}
              >
                <MessageSquare className="h-4 w-4 text-purple-600" />
                {copiedField === 'email-template' ? 'Copied!' : 'Copy Email Template'}
              </Button>
            </CardContent>
          </Card>

          {/* Team Setup Guide */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <ListChecks className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-white">Team Setup Guide</CardTitle>
                  <p className="text-xs text-blue-100">Get your team onboarded quickly</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <ol className="space-y-3">
                {[
                  'Share the Team Login URL with your staff.',
                  'Staff sign up with their work email.',
                  'They automatically join this workspace.',
                  "Set roles in the 'Users' module.",
                ].map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-950/40 text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </Main>
  )
}
