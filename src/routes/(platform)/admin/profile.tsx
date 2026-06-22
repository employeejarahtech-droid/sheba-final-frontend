/**
 * Admin Profile Page — Manage account settings and password
 *
 * Route: /(platform)/admin/profile
 * Features: gradient header, admin identity card, Tabs UI (Profile / Change Password),
 * permissions display (lenient — handles JSON string or object), role-aware styling.
 *
 * Hooks (from @/hooks/usePlatformAdmin):
 *   useAdminProfile()         -> unwrapped PlatformAdminUser
 *   useUpdateAdminProfile()   -> mutate({ name, email })
 *   useChangeAdminPassword()  -> mutate({ oldPassword, newPassword })
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  UserCog,
  Save,
  Loader2,
  Shield,
  ShieldCheck,
  Eye,
  KeyRound,
  Mail,
  Lock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminProfile, useUpdateAdminProfile, useChangeAdminPassword } from '@/hooks/usePlatformAdmin'

export const Route = createFileRoute('/(platform)/admin/profile')({
  component: ProfilePage,
})

// ── Types ───────────────────────────────────────────────────────────────

interface AdminProfile {
  id: number
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'viewer'
  permissions: Record<string, boolean> | string
  is_active: boolean | number
  profile_image?: string | null
  thumb_url?: string | null
  last_login_at?: string | null
  created_at?: string
  updated_at?: string
}

// ── Role styling ────────────────────────────────────────────────────────

const roleConfig: Record<
  string,
  { label: string; badge: string; gradient: string }
> = {
  super_admin: {
    label: 'Super Admin',
    badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    gradient: 'from-purple-600 to-purple-400',
  },
  admin: {
    label: 'Admin',
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    gradient: 'from-blue-600 to-blue-400',
  },
  viewer: {
    label: 'Viewer',
    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700',
    gradient: 'from-slate-600 to-slate-400',
  },
}

// ── Helpers ─────────────────────────────────────────────────────────────

/** Parse permissions that may arrive as a JSON string, an object, or nullish. */
function parsePermissions(raw: unknown): Record<string, boolean> {
  if (!raw) return {}
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return {}
    // Special-case wildcard shorthand
    if (trimmed === '["*"]' || trimmed === '["*"]' || trimmed === '*') {
      return { all_permissions: true }
    }
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        // e.g. ["users.read","users.write"] -> { users.read: true }
        return parsed.reduce<Record<string, boolean>>((acc, key) => {
          if (typeof key === 'string') acc[key] = true
          return acc
        }, {})
      }
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, boolean>
      }
    } catch {
      return { [trimmed]: true }
    }
  }
  if (typeof raw === 'object') {
    return raw as Record<string, boolean>
  }
  return {}
}

function isActive(value: boolean | number | undefined): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  return true
}

// ── Component ───────────────────────────────────────────────────────────

function ProfilePage() {
  const { data: profile, isLoading } = useAdminProfile()
  const updateProfile = useUpdateAdminProfile()
  const changePassword = useChangeAdminPassword()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [initialized, setInitialized] = useState(false)

  // Seed form fields once the profile arrives
  if (profile && !initialized) {
    setName(profile.name || '')
    setEmail(profile.email || '')
    setInitialized(true)
  }

  const admin: AdminProfile | undefined = profile as AdminProfile | undefined
  const role = admin?.role ?? 'viewer'
  const roleCfg = roleConfig[role] ?? roleConfig.viewer
  const permissions = useMemo(
    () => parsePermissions(admin?.permissions),
    [admin?.permissions]
  )
  const permissionEntries = Object.entries(permissions)
  const active = isActive(admin?.is_active)

  const passwordMismatch =
    newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile.mutate({ name, email })
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordMismatch || newPassword.length < 6) return
    changePassword.mutate(
      { oldPassword, newPassword },
      {
        onSuccess: () => {
          setOldPassword('')
          setNewPassword('')
          setConfirmPassword('')
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header — Purple Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-purple-400 p-6 shadow-lg shadow-purple-500/30">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
            <UserCog className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <p className="text-sm text-white/80">
              Manage your account settings, password, and permissions
            </p>
          </div>
        </div>
      </div>

      {isLoading || !admin ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Identity Card */}
          <Card className="lg:col-span-1 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Account</CardTitle>
              <CardDescription>Your admin identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                {admin.thumb_url || admin.profile_image ? (
                  <img
                    src={admin.thumb_url || admin.profile_image || ''}
                    alt={admin.name}
                    className="h-16 w-16 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div
                    className={cn(
                      'flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-xl font-semibold text-white',
                      roleCfg.gradient
                    )}
                  >
                    {(admin.name || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg leading-tight">
                    {admin.name || 'Admin'}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {admin.email}
                  </p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2.5">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-500" />
                  Role
                </span>
                <Badge variant="outline" className={cn('border', roleCfg.badge)}>
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  {roleCfg.label}
                </Badge>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2.5">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  {active ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-500" />
                  )}
                  Status
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                  )}
                >
                  {active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Last login */}
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2.5">
                <span className="text-sm text-muted-foreground">Last login</span>
                <span className="text-sm font-medium">
                  {admin.last_login_at
                    ? new Date(admin.last_login_at).toLocaleString()
                    : 'Never'}
                </span>
              </div>

              {/* Member since */}
              {admin.created_at && (
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2.5">
                  <span className="text-sm text-muted-foreground">Member since</span>
                  <span className="text-sm font-medium">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs: Profile / Password */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm">
              <Tabs defaultValue="profile">
                <CardHeader className="pb-0">
                  <CardTitle className="text-base">Settings</CardTitle>
                  <CardDescription>
                    Update your profile or change your password
                  </CardDescription>
                  <TabsList className="mt-2 w-full bg-transparent p-0 h-auto gap-1">
                    <TabsTrigger
                      value="profile"
                      className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-md px-6 py-2 flex-1"
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      Update Profile
                    </TabsTrigger>
                    <TabsTrigger
                      value="password"
                      className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-md px-6 py-2 flex-1"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="pt-4">
                  {/* ── Profile tab ── */}
                  <TabsContent value="profile">
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="profile-name">Name</Label>
                        <Input
                          id="profile-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profile-email">Email</Label>
                        <Input
                          id="profile-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profile-role">Role</Label>
                        <Input
                          id="profile-role"
                          value={roleCfg.label}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Your role is assigned by a super admin and cannot be
                          changed here.
                        </p>
                      </div>
                      <Button
                        type="submit"
                        disabled={updateProfile.isPending}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {updateProfile.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Profile
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* ── Password tab ── */}
                  <TabsContent value="password">
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          required
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="Enter your current password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter the new password"
                          className={cn(
                            passwordMismatch &&
                              'border-rose-400 focus-visible:ring-rose-400'
                          )}
                        />
                        {passwordMismatch && (
                          <p className="text-xs text-rose-600">
                            Passwords do not match.
                          </p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        disabled={
                          changePassword.isPending ||
                          passwordMismatch ||
                          newPassword.length < 6
                        }
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {changePassword.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Changing...
                          </>
                        ) : (
                          <>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Change Password
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

            {/* Permissions card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-purple-500" />
                  Permissions
                </CardTitle>
                <CardDescription>
                  Capabilities granted to your account for the assigned role
                </CardDescription>
              </CardHeader>
              <CardContent>
                {permissionEntries.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {permissionEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                      >
                        <span className="text-sm font-medium capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            value
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'
                          )}
                        >
                          {value ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Granted
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Denied
                            </>
                          )}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    No specific permissions configured. You inherit the default
                    permissions for your role.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
