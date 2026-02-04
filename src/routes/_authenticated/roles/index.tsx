import { ConfigDrawer } from '@/components/config-drawer'
import { DataTable } from '@/components/DataTable'
import { Header } from '@/components/layout/header'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { topNav } from '@/data/data'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ColumnDef } from '@tanstack/react-table'
import { Users, ShieldCheck, XCircle } from 'lucide-react'
import { useState, useMemo } from 'react'
import AddNewRoleForm from '@/features/roles/AddNewRoleForm'

export const Route = createFileRoute('/_authenticated/roles/')({
  component: ListOfRoles,
})

import { useGetRolesQuery } from '@/features/roles/roleQueries'
import { Role } from '@/types/role.types'

function ListOfRoles() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const limit = 10

  const { data: rolesData } = useGetRolesQuery({
    page,
    limit,
    search,
  })

  const roles = rolesData?.data || []
  const pagination = rolesData?.pagination

  const stats = useMemo(() => {
    const total = pagination?.total || 0
    // Note: API sample doesn't seem to return counts for active/inactive roles directly.
    // We'll calculate it from current page data for now, or just show total if preferred.
    // However, if the user wants real stats, the API might need to provide them.
    // For now, let's keep it consistent with the UI.
    const active = roles.filter((r) => r.status === 'active').length
    const inactive = roles.filter((r) => r.status === 'inactive').length

    return [
      {
        label: 'Total Roles',
        value: total,
        gradient: 'from-blue-600 to-blue-400',
        shadow: 'shadow-blue-500/30',
        icon: <Users className="w-6 h-6 text-white" />,
      },
      {
        label: 'Active Roles',
        value: active,
        gradient: 'from-emerald-600 to-emerald-400',
        shadow: 'shadow-emerald-500/30',
        icon: <ShieldCheck className="w-6 h-6 text-white" />,
      },
      {
        label: 'Inactive Roles',
        value: inactive,
        gradient: 'from-rose-600 to-rose-400',
        shadow: 'shadow-rose-500/30',
        icon: <XCircle className="w-6 h-6 text-white" />,
      },
    ]
  }, [roles, pagination])

  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <span className="font-medium">{row.getValue('role')}</span>,
    },
    {
      accessorKey: 'display_name',
      header: 'Display Name',
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const isActive = status.toLowerCase() === 'active'
        return (
          <Badge className={isActive ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent' : 'bg-rose-500 hover:bg-rose-600 text-white border-transparent'}>
            {status.toUpperCase()}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const role = row.original
        return (
          <div className="flex gap-2">
            <Link to={'/roles/permissions/$id/edit' as any} params={{ id: role.id } as any}>
              <Button size="sm" variant="outline">
                Edit
              </Button>
            </Link>
          </div>
        )
      },
    },
  ]

  return (
    <>
      <Header fixed>
        <TopNav links={topNav} />
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <main className="p-6 lg:p-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Roles</h1>
            <p className="text-muted-foreground">Manage user roles and their associated permissions.</p>
          </div>
          <AddNewRoleForm open={open} setOpen={setOpen} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((item, idx) => (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} p-6 shadow-lg ${item.shadow} transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px]`}
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />

              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">{item.label}</p>
                  <h3 className="mt-2 text-3xl font-bold text-white">{item.value}</h3>
                </div>
                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">{item.icon}</div>
              </div>

              <div className="mt-4 h-1 w-full rounded-full bg-black/10">
                <div className="h-full w-2/3 rounded-full bg-white/40" />
              </div>
            </div>
          ))}
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-muted/50 border-b">
            <CardTitle>Available Roles</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <DataTable
              columns={columns}
              data={roles}
              meta={{
                page: Number(pagination?.page) || page,
                limit: Number(pagination?.limit) || limit,
                total: pagination?.total || 0,
              }}
              onPageChange={setPage}
              search={search}
              onSearchChange={setSearch}
            //isFetching={isFetching}
            />
          </CardContent>
        </Card>
      </main>
    </>
  )
}
