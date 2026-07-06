/**
 * Registration Page — New tenant signup form
 *
 * Full-page registration with blue brand gradient header, 2-column layout
 * with plan selector on the left and registration form on the right.
 * Includes real-time subdomain availability check.
 *
 * After successful registration, redirects to the tenant's subdomain
 * dashboard via cross-subdomain auth-callback (same as hms-frontend).
 */

import { useState, useEffect } from 'react'
import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  CreditCard,
  Wallet,
  ArrowRight,
  Check,
  ChevronsUpDown,
} from 'lucide-react'
import { getBaseDomain, getSubdomain } from '@/lib/subdomain'
import { LandingPageWrapper } from '@/components/layout/landing-layout'
import { useAuthStore } from '@/stores/auth-store'
import api from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { COUNTRIES, CURRENCIES, getCurrencyByCode } from '@/lib/currencies'

// Registration form contract (mirrors the ronju-erp reference register.tsx schema,
// extended with Sheba's country/currency fields). Used as the form type source;
// field-level validation stays on the inline react-hook-form rules below.
const registerSchema = z
  .object({
    company_name: z.string().min(2, 'Company name is required'),
    subdomain: z
      .string()
      .min(3, 'Subdomain must be at least 3 characters')
      .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().optional(),
    address: z.string().min(5, 'Business address is required'),
    country: z.string().optional(),
    currency: z.string().optional(),
    admin_password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string(),
    plan_id: z.string().optional(),
  })
  .refine((data) => data.admin_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type FormValues = z.infer<typeof registerSchema>

export const Route = createFileRoute('/(platform)/register')({
  beforeLoad: () => {
    const host = window.location.hostname
    const BASE_DOMAIN = getBaseDomain()
    // If on a tenant subdomain, redirect to the base domain register page
    if (host !== BASE_DOMAIN && host !== `www.${BASE_DOMAIN}` && host !== 'localhost' && host !== '127.0.0.1' && host.endsWith(`.${BASE_DOMAIN}`)) {
      const port = window.location.port ? `:${window.location.port}` : ''
      const search = window.location.search || ''
      window.location.replace(`${window.location.protocol}//${BASE_DOMAIN}${port}/register${search}`)
      return
    }
  },
  component: RegisterPage,
  validateSearch: (search: Record<string, string>) => ({
    plan: search.plan || '',
    cycle: search.cycle || 'monthly',
    status: search.status || '',
    reason: search.reason || '',
  }),
})

function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const search = useSearch({ from: '/(platform)/register' })

  const [subdomainStatus, setSubdomainStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [plans, setPlans] = useState<any[]>([])
  const [paymentGateway, setPaymentGateway] = useState<string>('stripe')
  const [enabledGateways, setEnabledGateways] = useState<string[]>([])
  const [openCountry, setOpenCountry] = useState(false)
  const [openCurrency, setOpenCurrency] = useState(false)

  const baseDomain = getBaseDomain()

  const updateUrl = (plan: string, cycle: 'monthly' | 'yearly') => {
    const planSlug = plan
      ? plans.find((p: any) => String(p.id) === plan)?.slug || search.plan
      : search.plan
    navigate({ to: '/register', search: { plan: planSlug, cycle } })
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      company_name: '',
      subdomain: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      country: '',
      currency: '',
      admin_password: '',
      confirm_password: '',
      plan_id: '',
    },
  })

  const subdomainValue = watch('subdomain')
  const selectedCurrency = watch('currency') ? getCurrencyByCode(watch('currency')) : undefined

  // Fetch plans + enabled payment gateways
  useEffect(() => {
    fetchPlans()
  }, [])

  // Surface payment cancel/fail redirects coming back from a gateway callback
  useEffect(() => {
    if (search.status === 'cancel') {
      toast.error('Payment cancelled.')
    } else if (search.status === 'payment_failed') {
      toast.error(search.reason ? `Payment failed: ${search.reason}` : 'Payment failed.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.status])

  const fetchPlans = async () => {
    try {
      const res = await api.get('/public/landing')
      const fetchedPlans = res.data.data?.plans || res.data.data || []
      setPlans(fetchedPlans)

      // Extract enabled payment gateways
      const gateways = res.data.data?.enabled_payment_gateways || []
      setEnabledGateways(gateways)
      if (gateways.length > 0 && !gateways.includes(paymentGateway)) {
        setPaymentGateway(gateways[0])
      }

      if (search.plan) {
        const match = fetchedPlans.find(
          (p: any) => p.slug === search.plan || p.name === search.plan
        )
        if (match) {
          setSelectedPlan(String(match.id))
          setValue('plan_id', String(match.id))
        }
      }
      if (search.cycle === 'yearly') {
        setBillingCycle('yearly')
      }
    } catch {
      // Plans are optional
    }
  }

  // Check subdomain availability with debounce
  const checkSubdomainAvailability = async (value: string) => {
    if (!value || value.length < 3) {
      setSubdomainStatus('idle')
      return
    }
    setSubdomainStatus('checking')
    try {
      const res = await api.get(`/public/check-subdomain/${value}`)
      setSubdomainStatus(res.data.available === true ? 'available' : 'taken')
    } catch {
      setSubdomainStatus('idle')
    }
  }

  const onSubmit = async (data: FormValues) => {
    if (subdomainStatus === 'taken') {
      toast.error('Subdomain is not available')
      return
    }
    setLoading(true)
    try {
      const payload = {
        company_name: data.company_name,
        subdomain: data.subdomain,
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        password: data.admin_password,
        plan_id: selectedPlan ? Number(selectedPlan) : undefined,
        cycle: billingCycle,
        address: data.address,
        country: data.country || undefined,
        currency: data.currency || undefined,
        payment_gateway: paymentGateway,
      }

      const res = await api.post('/auth/register', payload)
      const result = res.data?.data || res.data

      if (result?.checkoutUrl) {
        // Payment gateway configured — redirect to checkout
        const gatewayLabel =
          paymentGateway === 'sslcommerz'
            ? 'SSLCommerz'
            : paymentGateway === 'paypal'
              ? 'PayPal'
              : 'secure checkout'
        toast.success(`Redirecting to ${gatewayLabel}...`)
        window.location.href = result.checkoutUrl
      } else if (result?.token && result?.user) {
        // No payment gateway — direct provisioning
        const company = result.company || {
          id: result.user.companyId,
          name: data.company_name,
          subdomain: data.subdomain,
          dbType: 'shared',
        }
        setAuth(result.user, result.token, company)

        // Cross-subdomain redirect — keep current scheme/port (no hardcoded
        // http:// or :5173, which break on https://*.hmsap.com in production).
        const protocol = window.location.protocol
        const portSuffix = window.location.port ? `:${window.location.port}` : ''
        const currentHost = window.location.hostname
        const targetHost = `${data.subdomain}.${baseDomain}`

        if (currentHost === targetHost || getSubdomain() === data.subdomain) {
          navigate({ to: '/dashboard' })
        } else {
          window.location.href = `${protocol}//${targetHost}${portSuffix}/auth-callback?token=${encodeURIComponent(result.token)}&user=${encodeURIComponent(JSON.stringify(result.user))}&company=${encodeURIComponent(JSON.stringify(company))}`
        }
      } else {
        toast.error('Registration could not be completed. Please try again.')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LandingPageWrapper>
    <div className="bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Blue brand gradient header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-sky-700 px-6 py-8 text-white">
        <div className="max-w-5xl mx-auto">
          <Link to="/" className="flex items-center gap-2 mb-2 w-fit">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-blue-600 font-bold text-sm shadow-sm">
              H
            </div>
            <span className="text-xl font-bold">HMS</span>
          </Link>
          <h1 className="text-2xl font-bold">Register Your Hospital</h1>
          <p className="text-blue-100 text-sm mt-1">
            Create your hospital account and start managing patients today
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 -mt-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — Plan selector */}
          <div className="lg:col-span-1">
            {plans.length > 0 && (
              <Card className="shadow-lg border-0 sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    Select a Plan
                  </CardTitle>
                  <CardDescription>
                    Choose the plan that fits your needs
                  </CardDescription>
                  {/* Monthly/Yearly toggle */}
                  <div className="flex gap-1 mt-2 bg-muted rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => { setBillingCycle('monthly'); updateUrl(selectedPlan, 'monthly') }}
                      className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                        billingCycle === 'monthly'
                          ? 'bg-white shadow text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBillingCycle('yearly'); updateUrl(selectedPlan, 'yearly') }}
                      className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                        billingCycle === 'yearly'
                          ? 'bg-white shadow text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plans.map((p: any) => {
                    const price =
                      typeof p.price === 'object'
                        ? p.price
                        : typeof p.price === 'string'
                          ? JSON.parse(p.price || '{}')
                          : {}
                    const displayPrice =
                      billingCycle === 'yearly'
                        ? price.yearly || 0
                        : price.monthly || 0
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setSelectedPlan(String(p.id)); updateUrl(String(p.id), billingCycle) }}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                          selectedPlan === String(p.id)
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-sm">{p.name}</p>
                          {p.status === 'active' && (
                            <Badge
                              className="bg-green-100 text-green-700 text-[10px]"
                              variant="secondary"
                            >
                              Popular
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {displayPrice === 0
                            ? 'Free'
                            : `$${displayPrice.toFixed(0)}/${billingCycle === 'yearly' ? 'yr' : 'mo'}`}
                        </p>
                      </button>
                    )
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column — Registration form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Create Your Account</CardTitle>
                <CardDescription>
                  Fill in the details below. You&apos;ll be redirected to a
                  secure payment page after submitting.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  {/* Company Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company_name">Company Name</Label>
                        <Input
                          id="company_name"
                          placeholder="City General Hospital"
                          {...register('company_name', {
                            required: 'Company name is required',
                            minLength: {
                              value: 2,
                              message: 'Min 2 characters',
                            },
                          })}
                        />
                        {errors.company_name && (
                          <p className="text-xs text-destructive">
                            {errors.company_name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subdomain">Subdomain</Label>
                        <div className="flex items-center gap-1">
                          <Input
                            id="subdomain"
                            placeholder="my-hospital"
                            className="flex-1"
                            {...register('subdomain', {
                              required: 'Subdomain is required',
                              minLength: {
                                value: 3,
                                message: 'Min 3 characters',
                              },
                              pattern: {
                                value: /^[a-z0-9-]+$/,
                                message:
                                  'Only lowercase letters, numbers, and hyphens',
                              },
                              onChange: (e) => {
                                const v = e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9-]/g, '')
                                setValue('subdomain', v)
                                setSubdomainStatus('idle')
                              },
                              onBlur: () => checkSubdomainAvailability(subdomainValue),
                            })}
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            .{baseDomain}
                          </span>
                        </div>
                        {subdomainStatus === 'checking' && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />{' '}
                            Checking...
                          </p>
                        )}
                        {subdomainStatus === 'available' && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Available!
                          </p>
                        )}
                        {subdomainStatus === 'taken' && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Not available
                          </p>
                        )}
                        {errors.subdomain && (
                          <p className="text-xs text-destructive">
                            {errors.subdomain.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="address">Business Address</Label>
                      <Textarea
                        id="address"
                        placeholder="123 Hospital Road, City, State, ZIP"
                        rows={3}
                        {...register('address', {
                          required: 'Business address is required',
                          minLength: {
                            value: 5,
                            message: 'Min 5 characters',
                          },
                        })}
                      />
                      {errors.address && (
                        <p className="text-xs text-destructive">
                          {errors.address.message}
                        </p>
                      )}
                    </div>

                    {/* Country & Currency */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* Country */}
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Popover open={openCountry} onOpenChange={setOpenCountry}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              aria-expanded={openCountry}
                              className="w-full justify-between font-normal"
                            >
                              {watch('country') || 'Select country'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search country..." />
                              <CommandList>
                                <CommandEmpty>No country found.</CommandEmpty>
                                <CommandGroup>
                                  {COUNTRIES.map((country) => (
                                    <CommandItem
                                      key={country}
                                      value={country.toLowerCase()}
                                      onSelect={() => {
                                        setValue('country', country, { shouldValidate: true })
                                        setOpenCountry(false)
                                        const currencyInfo = CURRENCIES.find((c) => c.country === country)
                                        if (currencyInfo) {
                                          setValue('currency', currencyInfo.code, { shouldValidate: true })
                                        }
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${watch('country') === country ? 'opacity-100' : 'opacity-0'}`}
                                      />
                                      {country}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Currency */}
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Popover open={openCurrency} onOpenChange={setOpenCurrency}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              aria-expanded={openCurrency}
                              className="w-full justify-between font-normal"
                            >
                              {selectedCurrency ? `${selectedCurrency.code} — ${selectedCurrency.name}` : 'Select currency'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search currency or country..." />
                              <CommandList>
                                <CommandEmpty>No currency found.</CommandEmpty>
                                <CommandGroup>
                                  {CURRENCIES.map((c) => (
                                    <CommandItem
                                      key={`${c.country}-${c.code}`}
                                      value={`${c.country} ${c.code} ${c.name}`.toLowerCase()}
                                      onSelect={() => {
                                        setValue('currency', c.code, { shouldValidate: true })
                                        setOpenCurrency(false)
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${watch('currency') === c.code ? 'opacity-100' : 'opacity-0'}`}
                                      />
                                      <span className="flex-1">{c.country} — {c.name}</span>
                                      <span className="ml-2 text-xs text-muted-foreground">{c.code}</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  {/* Account Details */}
                  <div>
                    <h3 className="text-sm font-semibold text-blue-700 mb-3">
                      Account Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          placeholder="Dr. John Smith"
                          {...register('name', {
                            required: 'Name is required',
                            minLength: {
                              value: 2,
                              message: 'Min 2 characters',
                            },
                          })}
                        />
                        {errors.name && (
                          <p className="text-xs text-destructive">
                            {errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="admin@hospital.com"
                          {...register('email', {
                            required: 'Email is required',
                            pattern: {
                              value: /^\S+@\S+$/i,
                              message: 'Invalid email',
                            },
                          })}
                        />
                        {errors.email && (
                          <p className="text-xs text-destructive">
                            {errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input
                          id="phone"
                          placeholder="+880 1XXX-XXXXXX"
                          {...register('phone')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  {enabledGateways.length > 1 && (
                    <div>
                      <h3 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Payment Method
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {enabledGateways.includes('sslcommerz') && (
                          <button
                            type="button"
                            onClick={() => setPaymentGateway('sslcommerz')}
                            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors text-left ${
                              paymentGateway === 'sslcommerz'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-slate-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                              <Wallet className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">SSLCommerz</p>
                              <p className="text-xs text-muted-foreground">
                                bKash, Nagad, Rocket, Cards
                              </p>
                            </div>
                          </button>
                        )}
                        {enabledGateways.includes('paypal') && (
                          <button
                            type="button"
                            onClick={() => setPaymentGateway('paypal')}
                            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors text-left ${
                              paymentGateway === 'paypal'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-slate-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex-shrink-0 p-2 bg-indigo-100 rounded-lg">
                              <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-sm">PayPal</p>
                              <p className="text-xs text-muted-foreground">
                                PayPal account, Debit/Credit
                              </p>
                            </div>
                          </button>
                        )}
                        {enabledGateways.includes('stripe') && (
                          <button
                            type="button"
                            onClick={() => setPaymentGateway('stripe')}
                            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors text-left ${
                              paymentGateway === 'stripe'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-slate-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                              <CreditCard className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Stripe</p>
                              <p className="text-xs text-muted-foreground">
                                International cards, Apple Pay
                              </p>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Security */}
                  <div>
                    <h3 className="text-sm font-semibold text-blue-700 mb-3">
                      Security
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin_password">Password</Label>
                        <div className="relative">
                          <Input
                            id="admin_password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Min 6 characters"
                            {...register('admin_password', {
                              required: 'Password is required',
                              minLength: {
                                value: 6,
                                message: 'Min 6 characters',
                              },
                            })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {errors.admin_password && (
                          <p className="text-xs text-destructive">
                            {errors.admin_password.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm_password">
                          Confirm Password
                        </Label>
                        <Input
                          id="confirm_password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Re-enter password"
                          {...register('confirm_password', {
                            required: 'Please confirm password',
                            validate: (value) =>
                              value === watch('admin_password') ||
                              'Passwords do not match',
                          })}
                        />
                        {errors.confirm_password && (
                          <p className="text-xs text-destructive">
                            {errors.confirm_password.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={loading || subdomainStatus === 'taken'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                        Processing...
                      </>
                    ) : (
                      <>
                        {paymentGateway === 'sslcommerz' ? (
                          <Wallet className="mr-2 h-4 w-4" />
                        ) : (
                          <CreditCard className="mr-2 h-4 w-4" />
                        )}
                        Continue to Payment
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </LandingPageWrapper>
  )
}
