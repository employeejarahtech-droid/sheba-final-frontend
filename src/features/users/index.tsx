import { DataTable } from '@/components/DataTable'
import { AppHeader } from '@/components/layout/app-header'
import { PageHeader } from '@/components/layout/page-header'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider, useUsers } from './components/users-provider'
import { useGetUsersQuery } from './userQueries'
import { useGetRolesQuery } from '@/features/roles/roleQueries'
import { Users as UsersIcon, UserCheck, UserX, Mail, Loader2 } from 'lucide-react'
import { type User as ApiUser } from '@/types/user.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useMemo, useEffect } from 'react'

function UsersContent() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const { setOpen, setCurrentRow } = useUsers() // Now inside provider context

  // Fetch users from API
  const { data, isLoading, isError, error } = useGetUsersQuery({
    page,
    limit,
    search,
  })

  // Fetch roles from API for dynamic role mapping
  const { data: rolesData } = useGetRolesQuery({ page: 1, limit: 100 })
  const roles = rolesData?.data || []

  // Create role lookup map
  const roleMap = useMemo(() => {
    const map: Record<number, { name: string; display_name: string; color: string }> = {}
    roles.forEach((role: any) => {
      const colors: Record<string, string> = {
        'Admin': 'bg-purple-500 hover:bg-purple-600',
        'Superadmin': 'bg-red-500 hover:bg-red-600',
        'Manager': 'bg-green-500 hover:bg-green-600',
        'User': 'bg-blue-500 hover:bg-blue-600',
        'Cashier': 'bg-orange-500 hover:bg-orange-600',
      }
      map[role.id] = {
        name: role.role,
        display_name: role.display_name,
        color: colors[role.role] || 'bg-gray-500 hover:bg-gray-600'
      }
    })
    return map
  }, [roles])

  // Extract users from API response
  const users = data?.data?.items || []
  const pagination = data?.data?.meta

  const totalUsers = pagination?.total || 0

  const stats = useMemo(() => [
    {
      label: "Total Users",
      value: totalUsers,
      gradient: "from-blue-600 to-blue-400",
      shadow: "shadow-blue-500/30",
      icon: <UsersIcon className="w-6 h-6 text-white" />,
    },
    {
      label: "Active Users",
      value: 0, // API doesn't provide status
      gradient: "from-emerald-600 to-emerald-400",
      shadow: "shadow-emerald-500/30",
      icon: <UserCheck className="w-6 h-6 text-white" />,
    },
    {
      label: "Inactive/Suspended",
      value: 0, // API doesn't provide status
      gradient: "from-rose-600 to-rose-400",
      shadow: "shadow-rose-500/30",
      icon: <UserX className="w-6 h-6 text-white" />,
    },
    {
      label: "Invited",
      value: 0, // API doesn't provide status
      gradient: "from-amber-600 to-amber-400",
      shadow: "shadow-amber-500/30",
      icon: <Mail className="w-6 h-6 text-white" />,
    },
  ], [totalUsers])

  // Define columns for DataTable format
  const columns = useMemo(() => [
    {
      data: 'avatar',
      title: 'Avatar',
      className: 'text-sm',
      responsivePriority: 2,
      orderable: false,
      render: (data: any) => {
        if (!data) return `<span class="text-sm text-muted-foreground">-</span>`
        const url = data.startsWith('http') ? data : `${import.meta.env.VITE_API_URL}${data}`
        return `<img src="${url}" alt="Avatar" class="h-8 w-8 rounded-full object-cover border" />`
      },
    },
    {
      data: 'name',
      title: 'Name',
      className: 'font-medium',
      responsivePriority: 3,
    },
    {
      data: 'email',
      title: 'Email',
      className: 'text-sm',
      responsivePriority: 4,
    },
    {
      data: 'role_id',
      title: 'Role',
      responsivePriority: 5,
      render: (data: any) => {
        const roleId = data as number
        const role = roleMap[roleId] || { display_name: 'Unknown', color: 'bg-gray-500' }
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role.color} text-white border-transparent">${role.display_name}</span>`
      },
    },
    {
      data: 'address1',
      title: 'Address',
      responsivePriority: 8,
      render: (_data: any, _type: string, row: ApiUser) => {
        const parts = [row.address1, row.address2].filter(Boolean).join(', ')
        return `<span class="text-sm">${parts || '-'}</span>`
      },
    },
    {
      data: 'bio',
      title: 'Bio',
      responsivePriority: 9,
      render: (data: any) => `<span class="text-sm">${data || '-'}</span>`,
    },
    {
      data: 'created_by',
      title: 'Created By',
      responsivePriority: 10,
      render: (data: any) => `<span class="text-sm text-muted-foreground">${data || '-'}</span>`,
    },
    {
      data: 'created_at',
      title: 'Created At',
      responsivePriority: 5,
      render: (data: any) => {
        const date = new Date(data)
        return `<span class="text-sm text-muted-foreground">${date.toLocaleDateString()}</span>`
      },
    },
    {
      data: null,
      title: 'Actions',
      orderable: false,
      responsivePriority: 1,
      render: (_data: any, _type: string, row: ApiUser) => {
        const userData = JSON.stringify(row).replace(/"/g, '&quot;')
        return `<button class="edit-user-btn inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3" data-user='${userData}'>Edit</button>`
      },
    },
  ], [roleMap])

  // Set up edit button handlers after DataTable renders
  useEffect(() => {
    const handleEditClick = (e: Event) => {
      const target = e.target as HTMLElement
      const button = target.closest('.edit-user-btn')
      if (button) {
        const userData = (button as HTMLElement).getAttribute('data-user')
        if (userData) {
          const user: ApiUser = JSON.parse(userData)

          setCurrentRow({
            id: user.id.toString(),
            firstName: user.name,
            lastName: '',
            username: user.email.split('@')[0],
            email: user.email,
            phoneNumber: '',
            status: 'active' as any,
            role: (user.role_id?.toString() || '2') as any,
            createdAt: new Date(user.created_at),
            updatedAt: user.updated_at ? new Date(user.updated_at) : new Date(user.created_at),
            address1: user.address1 || '',
            address2: user.address2 || '',
          })
          setOpen('edit')
        }
      }
    }

    // Use event delegation for dynamically created buttons
    document.addEventListener('click', handleEditClick)

    return () => {
      document.removeEventListener('click', handleEditClick)
    }
  }, [setOpen, setCurrentRow])

  if (isError) {
    return (
      <>
        <AppHeader fixed />

        <main className='flex flex-1 flex-col gap-4 sm:gap-6 p-6 lg:p-10'>
          <div className='flex flex-col items-center justify-center h-64 gap-4'>
            <p className='text-destructive text-lg font-semibold'>Error loading users</p>
            <p className='text-muted-foreground'>{error?.message || 'Something went wrong'}</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <AppHeader fixed />

      <main className='flex flex-1 flex-col gap-4 sm:gap-6 p-4'>
        <PageHeader
          title="User List"
          description="Manage your users and their roles here."
          actions={<UsersPrimaryButtons />}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((item, idx) => (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} p-6 shadow-lg ${item.shadow} transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]`}
            >
              {/* Background Pattern */}
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />

              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">{item.label}</p>
                  <h3 className="mt-2 text-3xl font-bold text-white">
                    {isLoading ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                      item.value || 0
                    )}
                  </h3>
                </div>
                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                  {item.icon}
                </div>
              </div>

              {/* Progress/Indicator line */}
              <div className="mt-4 h-1 w-full rounded-full bg-black/10">
                <div className="h-full w-2/3 rounded-full bg-white/40" />
              </div>
            </div>
          ))}
        </div>

        {/* Users Table */}
          
          <div className="pt-2">
            {isLoading ? (
              <div className='flex items-center justify-center h-64'>
                <Loader2 className='h-8 w-8 animate-spin text-primary' />
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={users}
                meta={data?.data?.meta}
                onPageChange={(newPage) => setPage(newPage)}
                onLimitChange={(newLimit) => {
                  setLimit(newLimit);
                  setPage(1); // reset page when changing limit
                }}
                search={search}
                onSearchChange={(value) => {
                  setSearch(value);
                  setPage(1); // reset page when searching
                }}
              />
            )}
          </div>
      </main>

      <UsersDialogs />
    </>
  )
}

// Wrapper component that provides context
export function Users() {
  return (
    <UsersProvider>
      <UsersContent />
    </UsersProvider>
  )
}
