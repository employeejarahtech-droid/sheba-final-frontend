import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

export function AppTitle() {
  const { setOpenMobile } = useSidebar()
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>('HMS')
  const [tagline, setTagline] = useState<string>('Hospital Management')

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/company-settings/public`)
        if (res.ok) {
          const response = await res.json()
          if (response.data?.company_name) {
            setCompanyName(response.data.company_name)
          }
          if (response.data?.tagline) {
            setTagline(response.data.tagline)
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

  const updateFavicon = (imageUrl: string) => {
    try {
      const existingLinks = document.querySelectorAll("link[rel*='icon']")
      existingLinks.forEach(link => link.remove())
      const link = document.createElement('link')
      link.rel = 'icon'
      link.type = 'image/png'
      link.href = imageUrl
      document.head.appendChild(link)
    } catch (error) {
      console.error('Failed to update favicon:', error)
    }
  }

  const initials = (companyName || 'HMS')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent active:bg-transparent data-[active=true]:bg-transparent"
          asChild
        >
          <Link to="/" onClick={() => setOpenMobile(false)}>
            <div className="flex aspect-square justify-center rounded-lg text-sidebar-primary-foreground items-center size-8 shrink-0 group-data-[collapsible=icon]:size-8">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={companyName}
                  className="size-8 object-contain rounded-lg group-data-[collapsible=icon]:size-8"
                />
              ) : (
                <span className="text-sm font-bold">{initials}</span>
              )}
            </div>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-semibold">{companyName || 'HMS'}</span>
              <span className="truncate text-xs text-muted-foreground">
                {tagline}
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
