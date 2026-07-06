/**
 * Platform Types — TypeScript interfaces for SAAS platform API data
 *
 * Derived from backend models in:
 *   sheba-api/src/modules/platform/admin/adminUser.model.js
 *   sheba-api/src/modules/platform/company/company.model.js
 *   sheba-api/src/modules/platform/subscription/subscriptionPlan.model.js
 *   sheba-api/src/modules/platform/registration/registration.model.js
 *   sheba-api/src/modules/platform/module/module.model.js
 *   sheba-api/src/modules/platform/billing/billing.service.js
 *   sheba-api/src/modules/platform/settings/adminSettings.model.js
 */

// ── Admin User ──────────────────────────────────────────────────────────
export interface PlatformAdminUser {
  id: number
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'viewer'
  permissions: Record<string, boolean> | string
  is_active: boolean
  profile_image?: string | null
  thumb_url?: string | null
  last_login_at?: string | null
  created_at?: string
  updated_at?: string
}

// ── Company (Tenant) ────────────────────────────────────────────────────
export interface PlatformCompany {
  id: number
  name: string
  email: string | null
  domain: string | null
  subdomain: string
  db_name: string
  db_type: 'shared' | 'dedicated'
  plan_id: number | null
  plan_name?: string
  plan_slug?: string
  subscription_status: string
  subscription_expires_at: string | null
  is_active: number
  hide_subscription_info?: number
  billing?: Record<string, unknown> | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  payment_gateway?: string | null
  created_at: string
  updated_at: string
}

// ── Company Custom Domain (tenant-owned "domains" table row) ───────────
export interface PlatformCompanyDomain {
  id: number
  domain: string
  status: 'pending' | 'verifying' | 'verified' | 'ssl_generating' | 'ssl_installed' | 'live' | 'error'
  error: string | null
  sslExpiry: string | null
  dnsToken: string | null
  ipAddress: string | null
  dnsVerifiedAt: string | null
  sslGeneratedAt: string | null
  activatedAt: string | null
  createdAt: string
  updatedAt: string
  realSSL: { valid: boolean; message: string; [key: string]: unknown } | null
}

// ── Nginx Server Block (diagnostic view — read from disk on the API host) ──
export interface PlatformNginxDomain {
  file: string
  serverNames: string[]
  enabled: boolean
  configType: 'static' | 'proxy' | 'unknown'
  target: string | null
  hasSSL: boolean
  matchedCompany: { id: number; name: string; subdomain: string; isActive: boolean } | null
}

export interface PlatformNginxDomainsResult {
  availableDir: string
  enabledDir: string
  domains: PlatformNginxDomain[]
}

// ── Subscription Plan ───────────────────────────────────────────────────
export interface PlatformSubscriptionPlan {
  id: number
  slug: string
  name: string
  description: string | null
  price: {
    monthly: number
    quarterly?: number
    biannual?: number
    yearly: number
  } | null
  limits: Record<string, number> | null
  module_limits: Record<string, number> | null
  features: Array<{ name: string; included: boolean; limit?: number }> | null
  db_tier: string | null
  status: 'active' | 'inactive' | 'archived'
  stripe_product_id?: string | null
  stripe_price_id?: Record<string, string> | null
  display_order: number
  max_users: number | null
  created_at?: string
  updated_at?: string
}

// ── Registration ────────────────────────────────────────────────────────
export interface PlatformRegistration {
  id: number
  email: string
  name: string
  company_name: string
  subdomain: string
  admin_password?: string
  phone: string | null
  plan_id: number | null
  plan_name?: string
  plan_slug?: string
  cycle: 'monthly' | 'quarterly' | 'biannual' | 'yearly'
  status: 'pending' | 'approved' | 'rejected'
  verification_token: string | null
  verification_expires?: string | null
  stripe_session_id?: string | null
  stripe_customer_id?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
  updated_at?: string
}

// ── Module (Landing Page Content) ───────────────────────────────────────
export interface PlatformModule {
  id: number
  slug: string
  name: string
  category: string | null
  description: string | null
  hero?: Record<string, unknown> | null
  features?: Array<Record<string, unknown>> | null
  benefits?: Array<Record<string, unknown>> | null
  capabilities?: Array<Record<string, unknown>> | null
  status: 'active' | 'inactive'
  sort_order: number
  available_in_plans?: string[] | null
  seo?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

// ── Settings ────────────────────────────────────────────────────────────
export interface PlatformSetting {
  id: number
  category: string
  settings: Record<string, unknown>
  updated_at: string
}

// ── Billing ─────────────────────────────────────────────────────────────
export interface PlatformBillingOverview {
  totalRevenue: string
  activeSubscriptions: number
  pendingInvoices: number
  monthlyRevenue: string
  totalCompanies: number
  recentTransactions: PlatformTransaction[]
}

export interface PlatformTransaction {
  id: number
  company_id: number
  company_name?: string
  company_subdomain?: string
  amount: number
  currency?: string
  status: string
  stripe_payment_intent_id?: string
  description?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface PlatformRevenueStat {
  period: string
  revenue: number
  successful_count: number
  failed_count: number
  total_count: number
}

// ── Contact (Landing Page Submission) ───────────────────────────────────
export interface PlatformContact {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string | null
  company: string | null
  subject: string | null
  message: string
  status: 'new' | 'in_progress' | 'resolved' | 'closed'
  notes: string | null
  assigned_to: number | null
  assigned_to_name?: string | null
  assigned_to_email?: string | null
  created_at: string
  updated_at?: string
}

// ── Subscription (derived from company) ─────────────────────────────────
export interface PlatformSubscription {
  id: number
  name: string
  email?: string | null
  subdomain: string
  plan_id: number | null
  plan_name?: string
  plan_slug?: string
  subscription_status: string
  subscription_expires_at: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  is_active?: number
  created_at?: string
}

// ── Invoice ─────────────────────────────────────────────────────────────
export interface PlatformInvoice {
  id: number
  company_id: number
  company_name?: string
  company_subdomain?: string
  plan_id: number | null
  plan_name?: string
  stripe_invoice_id: string | null
  amount: string | number
  tax: string | number
  total: string | number
  currency: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  invoice_pdf: string | null
  period_start: string | null
  period_end: string | null
  payment_gateway: string | null
  created_at: string
}

// ── Stripe ──────────────────────────────────────────────────────────────
export interface PlatformStripeOverview {
  customers: number
  subscriptions: number
  revenue: string | number
}

export interface PlatformStripeCustomer {
  id: number
  name: string
  email?: string | null
  subdomain: string
  stripe_customer_id: string
  subscription_status: string
}

// ── Dashboard ───────────────────────────────────────────────────────────
export interface PlatformDashboardStats {
  companies: {
    total: number
    active: number
    inactive: number
    byStatus: Record<string, number>
    byDbType: Record<string, number>
  }
  activePlans: number
  registrations: {
    total: number | string
    pending: number | string
    approved: number | string
    rejected: number | string
  }
  billing: {
    totalRevenue: string
    monthlyRevenue: string
    activeSubscriptions: number
    pendingInvoices: number
    totalCompanies: number
  }
  platform: {
    name: string
    version: string
    tenantLabel: string
  }
}

// ── Landing Page Data ───────────────────────────────────────────────────
export interface PlatformLandingData {
  platformName: string
  plans: PlatformSubscriptionPlan[]
  modules: PlatformModule[]
  configuredGateways: string[]
}

// ── Pagination ──────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ── API Response Wrappers ───────────────────────────────────────────────
export interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  message: string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
