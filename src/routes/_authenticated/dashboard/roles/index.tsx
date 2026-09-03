
import { DataTable } from '@/components/DataTable'
import { AppHeader } from '@/components/layout/app-header'
import { PageHeader } from '@/components/layout/page-header'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createFileRoute } from '@tanstack/react-router'
import { Users, ShieldCheck, XCircle } from 'lucide-react'
import { useState, useMemo } from 'react'
import AddNewRoleForm from '@/features/roles/AddNewRoleForm'
import { useCan } from '@/hooks/use-can'

export const Route = createFileRoute('/_authenticated/dashboard/roles/')({
  component: ListOfRoles,
})

import { useGetRolesQuery } from '@/features/roles/roleQueries'
import { Role } from '@/types/role.types'

function ListOfRoles() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const limit = 10

  const can = useCan()
  const canEditRole = can('roles.edit')

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
    const active = roles.filter((r) => r.status && r.status.toLowerCase() === 'active').length
    const inactive = roles.filter((r) => !r.status || r.status.toLowerCase() === 'inactive').length

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

  const columns = [
    {
      data: 'role',
      title: 'Role',
      className: 'font-medium',
    },
    {
      data: 'display_name',
      title: 'Display Name',
    },
    {
      data: 'description',
      title: 'Description',
      className: 'text-sm text-muted-foreground',
    },
    {
      data: 'created_by',
      title: 'Created By',
      render: (data: any) => {
        return `<span class="text-sm text-muted-foreground">${data || '-'}</span>`
      },
    },
    {
      data: 'created_by_type',
      title: 'Create Type',
      orderable: false,
      render: (data: any) => {
        if (!data) return `<span class="text-sm text-muted-foreground">-</span>`
        const isAdmin = data === 'company_admin'
        const label = isAdmin ? 'Admin' : 'Staff'
        const classes = isAdmin
          ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400'
          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
        return `<span class="${classes} px-2 py-0.5 rounded text-xs font-semibold">${label}</span>`
      },
    },
    {
      data: 'status',
      title: 'Status',
      render: (data: any) => {
        const status = data as string | null
        const statusValue = status || 'inactive'
        const isActive = statusValue.toLowerCase() === 'active'
        const colorClass = isActive
          ? 'bg-emerald-500 hover:bg-emerald-600'
          : 'bg-rose-500 hover:bg-rose-600'
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} text-white border-transparent">${statusValue.toUpperCase()}</span>`
      },
    },
    {
      data: null,
      title: 'Actions',
      orderable: false,
      render: (_data: any, _type: string, row: Role) => {
        if (!canEditRole) return `<span class="text-xs text-muted-foreground">—</span>`
        return `<a href="/dashboard/roles/permissions/${row.id}/edit" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3">Edit</a>`
      },
    },
  ]

  return (
    <>
      <AppHeader fixed />

      <main className=" space-y-3">
        <PageHeader
          title="System Roles"
          description="Manage user roles and their associated permissions."
          actions={can('roles.create') ? <AddNewRoleForm open={open} setOpen={setOpen} /> : undefined}
        />

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

          
          <div className="pt-3">
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
          </div>
      </main>
    </>
  )
}
