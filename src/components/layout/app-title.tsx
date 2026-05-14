import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Button } from '../ui/button'

export function AppTitle() {
  const { setOpenMobile } = useSidebar()
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>('HMS')

  // Fetch company settings data
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/company-settings/public`)

        if (res.ok) {
          const response = await res.json()
          if (response.data?.company_name) {
            setCompanyName(response.data.company_name)
          }
          let logoUrl = response.data?.company_logo || null
          if (logoUrl && !logoUrl.startsWith('http') && !logoUrl.startsWith('data:')) {
            logoUrl = `${import.meta.env.VITE_API_URL}${logoUrl}`
          }
          setProfileImage(logoUrl)

          if (logoUrl) {
            updateFavicon(logoUrl)
          }
        }
      } catch (error) {
        console.error('Failed to fetch company settings:', error)
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

      console.log('Favicon updated:', imageUrl)
    } catch (error) {
      console.error('Failed to update favicon:', error)
    }
  }

  // Get first letter for fallback
  const firstLetter = companyName.charAt(0).toUpperCase()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='gap-0 py-0 hover:bg-transparent active:bg-transparent'
          asChild
        >
          <div>
            <Link
              to='/'
              onClick={() => setOpenMobile(false)}
              className='flex items-center gap-3 flex-1 text-sm leading-tight'
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt='Company Logo'
                  className='h-8 w-8 object-cover rounded-full border border-gray-200'
                />
              ) : (
                <div className='h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center'>
                  <span className='text-white font-bold text-sm'>{firstLetter}</span>
                </div>
              )}
              <div className='grid flex-1 text-start'>
                <span className='truncate font-bold'>{companyName}</span>
                <span className='truncate text-xs'></span>
              </div>
            </Link>
            <ToggleSidebar />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function ToggleSidebar({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar='trigger'
      data-slot='sidebar-trigger'
      variant='ghost'
      size='icon'
      className={cn('aspect-square size-8 max-md:scale-125', className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <X className='md:hidden' />
      <Menu className='max-md:hidden' />
      <span className='sr-only'>Toggle Sidebar</span>
    </Button>
  )
}
