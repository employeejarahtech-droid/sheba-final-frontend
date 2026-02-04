import { ConfigDrawer } from '@/components/config-drawer'
import { DataTable } from '@/components/DataTable'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider, useUsers } from './components/users-provider'
import { useGetUsersQuery } from './userQueries'
import { useGetRolesQuery } from '@/features/roles/roleQueries'
import { Users as UsersIcon, UserCheck, UserX, Mail, Loader2 } from 'lucide-react'
import { type User as ApiUser } from '@/types/user.types'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useMemo } from 'react'

function UsersContent() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10
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

  // Define columns based on API data structure
  const columns: ColumnDef<ApiUser>[] = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('id')}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <span className="text-sm">{row.getValue('email')}</span>,
    },
    {
      accessorKey: 'role_id',
      header: 'Role',
      cell: ({ row }) => {
        const roleId = row.getValue('role_id') as number
        const role = roleMap[roleId] || { display_name: 'Unknown', color: 'bg-gray-500' }
        return (
          <Badge className={`${role.color} text-white border-transparent`}>
            {role.display_name}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'))
        return <span className="text-sm text-muted-foreground">{date.toLocaleDateString()}</span>
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Transform API user to form format for editing
                const nameParts = user.name.split(' ')
                const firstName = nameParts[0] || ''
                const lastName = nameParts.slice(1).join(' ') || ''


                setCurrentRow({
                  id: user.id.toString(),
                  firstName,
                  lastName,
                  username: user.email.split('@')[0],
                  email: user.email,
                  phoneNumber: '',
                  status: 'active' as any,
                  role: (user.role_id?.toString() || '2') as any, // Pass role_id as string
                  createdAt: new Date(user.created_at),
                  updatedAt: user.updated_at ? new Date(user.updated_at) : new Date(user.created_at),
                })
                setOpen('edit')
              }}
            >
              Edit
            </Button>
          </div>
        )
      },
    },
  ], [setOpen, setCurrentRow, roleMap])

  if (isError) {
    return (
      <>
        <Header fixed>
          <Search />
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>

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
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <main className='flex flex-1 flex-col gap-4 sm:gap-6 p-6 lg:p-10'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>User List</h2>
            <p className='text-muted-foreground'>
              Manage your users and their roles here.
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>

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
        <Card className="border overflow-hidden pt-0 pb-2">
          <CardHeader className="bg-muted/50 border-b-1 py-4 gap-0">
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
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
                search={search}
                onSearchChange={(value) => {
                  setSearch(value);
                  setPage(1); // reset page when searching
                }}
              />
            )}
          </CardContent>
        </Card>
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
