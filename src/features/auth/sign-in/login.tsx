import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import dashboardDark from './assets/Sheba-Background.jpg'
import dashboardLight from './assets/Sheba-Background.jpg'
import { UserAuthForm } from './components/user-auth-form'

export function Login() {
  const [companyName, setCompanyName] = useState<string>('HMS')
  const [profileImage, setProfileImage] = useState<string | null>(null)

  // Fetch company settings (public endpoint - no auth required)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/company-settings/public`)

        if (res.ok) {
          const response = await res.json()
          if (response.data?.company_name) {
            setCompanyName(response.data.company_name)
          }
          let logoUrl = response.data?.company_logo || null
          if (logoUrl && !logoUrl.startsWith('http') && !logoUrl.startsWith('data:')) {
            logoUrl = `${import.meta.env.VITE_API_URL || ''}${logoUrl}`
          }
          setProfileImage(logoUrl)

          // Update favicon dynamically
          if (logoUrl) {
            updateFavicon(logoUrl)
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
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

  return (
    <div className='relative container grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='lg:p-8'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:w-[480px] sm:p-8'>
          <div className='mb-8 flex flex-col items-center justify-center gap-2'>
            {profileImage ? (
              <img
                src={profileImage}
                alt='Company Logo'
                className='h-16 w-16 object-cover rounded-full border-2 border-gray-200 shadow-lg'
              />
            ) : (
              <div className='h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg'>
                <span className='text-white font-bold text-2xl'>{firstLetter}</span>
              </div>
            )}
            <div className='text-center'>
              <h1 className='text-3xl font-bold text-gray-900'>{companyName}</h1>
              <p className='text-sm text-gray-500'>Hospital Management System</p>
            </div>
          </div>
        </div>
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
          '[&>img]:absolute [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>img]:object-top-left [&>img]:select-none'
        )}
      >
        <img
          src={dashboardLight}
          className='dark:hidden'
          width={1024}
          height={1151}
          alt='Shadcn-Admin'
        />
        <img
          src={dashboardDark}
          className='hidden dark:block'
          width={1024}
          height={1138}
          alt='Shadcn-Admin'
        />
      </div>
    </div>
  )
}
