import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { UserAuthForm } from './components/user-auth-form'
import { getSubdomainInfo } from '@/lib/subdomain'
import { Building2 } from 'lucide-react'
import { TenantNotFoundView } from '@/features/tenant/tenant-not-found'

interface LoginSettings {
  logo?: string
  bgImage?: string
  informationText?: string
  company_name?: string
  company_details?: string
}

export function Login() {
  const [companyName, setCompanyName] = useState<string>('HMS')
  const [companyDetails, setCompanyDetails] = useState<string>('')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [bgImage, setBgImage] = useState<string | null>(null)
  const [informationText, setInformationText] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [tenantNotFound, setTenantNotFound] = useState(false)

  // Fetch tenant login settings (public endpoint - no auth required)
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true)
      setTenantNotFound(false)
      try {
        const { isCompanyPortal, subdomain } = getSubdomainInfo()

        // Only fetch settings for tenant subdomains
        if (!isCompanyPortal || !subdomain) {
          console.log('Platform domain detected - should use PlatformLogin component')
          setIsLoading(false)
          return
        }

        // Try to fetch tenant-specific login settings
        let settingsFetched = false
        let loginStatus = 0
        let fallbackStatus = 0

        try {
          const url = `${import.meta.env.VITE_API_URL || ''}/api/public/app-settings/login-settings/${subdomain}`
          const res = await fetch(url)
          loginStatus = res.status

          if (res.ok) {
            const response = await res.json()
            const settings: LoginSettings = response.data || {}

            // Logo
            let logoUrl = settings.logo || null
            if (logoUrl && !logoUrl.startsWith('http') && !logoUrl.startsWith('data:')) {
              logoUrl = `${import.meta.env.VITE_API_URL || ''}${logoUrl}`
            }
            setProfileImage(logoUrl)

            // Background image
            let bgImageUrl = settings.bgImage || null
            if (bgImageUrl && !bgImageUrl.startsWith('http') && !bgImageUrl.startsWith('data:')) {
              bgImageUrl = `${import.meta.env.VITE_API_URL || ''}${bgImageUrl}`
            }
            setBgImage(bgImageUrl)

            // Information text
            setInformationText(settings.informationText || '')

            // Company info
            if (settings.company_name) {
              setCompanyName(settings.company_name)
            }
            if (settings.company_details) {
              setCompanyDetails(settings.company_details)
            }

            // Update favicon dynamically
            if (logoUrl) {
              updateFavicon(logoUrl)
            }

            settingsFetched = true
          }
        } catch (err) {
          console.log('Login settings endpoint not available, using defaults')
        }

        // If login settings failed, try tenant settings as fallback for company name/logo
        if (!settingsFetched) {
          try {
            const fallbackUrl = `${import.meta.env.VITE_API_URL || ''}/api/public/tenant-settings/${subdomain}`
            const fallbackRes = await fetch(fallbackUrl)
            fallbackStatus = fallbackRes.status

            if (fallbackRes.ok) {
              const response = await fallbackRes.json()
              if (response.data?.company_name) {
                setCompanyName(response.data.company_name)
              }
              let logoUrl = response.data?.company_logo || null
              if (logoUrl && !logoUrl.startsWith('http') && !logoUrl.startsWith('data:')) {
                logoUrl = `${import.meta.env.VITE_API_URL || ''}${logoUrl}`
              }
              setProfileImage(logoUrl)

              if (logoUrl) {
                updateFavicon(logoUrl)
              }
            }
          } catch (err) {
            console.log('Tenant settings endpoint not available, using defaults')
          }
        }

        // Both public endpoints return HTTP 404 when the subdomain has no
        // registered tenant — surface that to the user with a Register link.
        if (loginStatus === 404 || fallbackStatus === 404) {
          setTenantNotFound(true)
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Function to update favicon
  const updateFavicon = (imageUrl: string) => {
    try {
      // Remove existing favicons
      const existingLinks = document.querySelectorAll("link[rel*='icon']")
      existingLinks.forEach(link => link.remove())

      // Create new favicon link
      const link = document.createElement('link')
      link.rel = 'icon'
      link.type = 'image/png'
      link.href = imageUrl
      document.head.appendChild(link)

      // Also update apple-touch-icon
      const appleLink = document.createElement('link')
      appleLink.rel = 'apple-touch-icon'
      appleLink.href = imageUrl
      document.head.appendChild(appleLink)

      console.log('Login page favicon updated:', imageUrl)
    } catch (error) {
      console.error('Failed to update favicon:', error)
    }
  }

  // Get first letter for fallback
  const firstLetter = companyName.charAt(0).toUpperCase()

  // Show loading state
  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-white'>
        <div className='text-center space-y-4'>
          <div className='h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-sky-600 flex items-center justify-center mx-auto shadow-lg animate-pulse'>
            <Building2 className='h-6 w-6 text-white' />
          </div>
          <p className='text-sm text-gray-600'>Loading...</p>
        </div>
      </div>
    )
  }

  // Subdomain has no registered tenant — reuse the shared not-found view
  // (same UI as the tenant home page at /).
  if (tenantNotFound) {
    const { subdomain } = getSubdomainInfo()
    return <TenantNotFoundView subdomain={subdomain} />
  }

  return (
    <div className='relative container grid h-svh flex-col items-center justify-center bg-white lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='lg:p-8'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:w-[480px] sm:p-8'>
          <div className='mb-8 flex flex-col items-center justify-center gap-2'>
            {profileImage ? (
              <img
                src={profileImage}
                alt={`${companyName} Logo`}
                className='h-20 w-20 object-contain rounded-2xl border-2 border-gray-200 shadow-lg bg-white'
              />
            ) : (
              <div className='h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-600 flex items-center justify-center shadow-lg shadow-blue-900/20'>
                <span className='text-white font-bold text-3xl'>{firstLetter}</span>
              </div>
            )}
            <div className='text-center'>
              <h1 className='text-3xl font-bold text-gray-900'>{companyName}</h1>
              <p className='text-sm text-gray-500 whitespace-pre-wrap mt-1'>
                {companyDetails || 'Hospital Management System'}
              </p>
            </div>
          </div>
        </div>

        {/* Information Text Section */}
        {informationText && (
          <div className='mx-auto w-full max-w-sm mb-6'>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <p className='text-sm text-blue-800'>{informationText}</p>
            </div>
          </div>
        )}

        <div className='mx-auto flex w-full max-w-sm flex-col justify-center space-y-6'>
          <div className='flex flex-col space-y-2 text-start'>
            <h2 className='text-2xl font-bold tracking-tight'>Sign in to your account</h2>
            <p className='text-muted-foreground text-sm'>
              Enter your credentials to access the dashboard
            </p>
          </div>
          <UserAuthForm />
        </div>
      </div>

      <div
        className={cn(
          'bg-muted relative h-full overflow-hidden max-lg:hidden',
          '[&>img]:absolute [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>img]:object-top [&>img]:select-none'
        )}
      >
        {bgImage ? (
          <img
            src={bgImage}
            className='dark:hidden'
            width={1920}
            height={1080}
            alt={`${companyName} Facility`}
          />
        ) : (
          <img
            src='https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1920&auto=format&fit=crop'
            className='dark:hidden'
            width={1920}
            height={1080}
            alt='Medical Facility'
          />
        )}
        {bgImage && (
          <img
            src={bgImage}
            className='hidden dark:block'
            width={1920}
            height={1080}
            alt={`${companyName} Facility`}
          />
        )}
        {!bgImage && (
          <img
            src='https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1920&auto=format&fit=crop'
            className='hidden dark:block'
            width={1920}
            height={1080}
            alt='Medical Facility'
          />
        )}
      </div>
    </div>
  )
}
