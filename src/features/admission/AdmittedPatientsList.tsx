import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, Activity, CheckCircle, AlertCircle, UserPlus } from 'lucide-react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Cookies from 'js-cookie'

const API_URL = import.meta.env.VITE_API_URL

export function AdmittedPatientsList() {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [page, setPage] = useState(1)
    const limit = 10

    const token = Cookies.get('accessToken')

    // Fetch statistics
    const { data: statsData } = useQuery({
        queryKey: ['admission-statistics'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/admission/statistics`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (!response.ok) throw new Error('Failed to fetch statistics')
            return response.json()
        },
    })

    // Fetch admissions list
    const { data: admissionsData, isLoading } = useQuery({
        queryKey: ['admissions', page, search, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(search && { search }),
                ...(statusFilter && { status: statusFilter }),
            })
            const response = await fetch(`${API_URL}/api/admission?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (!response.ok) throw new Error('Failed to fetch admissions')
            return response.json()
        },
    })

    const stats = statsData?.data || { total: 0, active: 0, discharged: 0, critical: 0 }
    const admissions = admissionsData?.data || []
    const pagination = admissionsData?.pagination || { total: 0, page: 1, totalPages: 1 }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            active: 'default',
            discharged: 'secondary',
            critical: 'destructive',
        }
        return (
            <Badge variant={variants[status] || 'default'}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        )
    }

    return (
        <>
            <Header>
                <Search />
                <div className='ms-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className="p-6 lg:p-10 w-full flex-1 bg-gray-50/50 dark:bg-black/20">
                <div className="space-y-6 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-wrap justify-between items-start gap-4">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Admitted Patients
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Manage and monitor all admitted patients
                            </p>
                        </div>
                        <Button
                            className="flex items-center gap-2 h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/40"
                            onClick={() => window.location.href = '/admission/new-admission'}
                        >
                            <UserPlus className="h-5 w-5" />
                            <span>New Admission</span>
                        </Button>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="border-2 hover:border-blue-200 transition-all">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Total Admitted
                                </CardTitle>
                                <Users className="h-5 w-5 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                                <p className="text-xs text-muted-foreground mt-1">All time admissions</p>
                            </CardContent>
                        </Card>

                        <Card className="border-2 hover:border-green-200 transition-all">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Active Patients
                                </CardTitle>
                                <Activity className="h-5 w-5 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-600">{stats.active}</div>
                                <p className="text-xs text-muted-foreground mt-1">Currently admitted</p>
                            </CardContent>
                        </Card>

                        <Card className="border-2 hover:border-gray-200 transition-all">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Discharged
                                </CardTitle>
                                <CheckCircle className="h-5 w-5 text-gray-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-600">{stats.discharged}</div>
                                <p className="text-xs text-muted-foreground mt-1">Successfully treated</p>
                            </CardContent>
                        </Card>

                        <Card className="border-2 hover:border-red-200 transition-all">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Critical Cases
                                </CardTitle>
                                <AlertCircle className="h-5 w-5 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
                                <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters and Search */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Patient List</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <Input
                                    placeholder="Search by name or phone..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="md:w-96"
                                />
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="md:w-48">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="discharged">Discharged</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Table */}
                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Patient Name</TableHead>
                                            <TableHead>Age/Sex</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Admission Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Bed/Cabin</TableHead>
                                            <TableHead>Doctor</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    Loading...
                                                </TableCell>
                                            </TableRow>
                                        ) : admissions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    No patients found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            admissions.map((admission: any) => (
                                                <TableRow key={admission.id}>
                                                    <TableCell className="font-medium">{admission.patient_name}</TableCell>
                                                    <TableCell>
                                                        {admission.age && admission.sex
                                                            ? `${admission.age}/${admission.sex.charAt(0).toUpperCase()}`
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell>{admission.phone || '-'}</TableCell>
                                                    <TableCell>{new Date(admission.admission_date).toLocaleDateString()}</TableCell>
                                                    <TableCell>{getStatusBadge(admission.status)}</TableCell>
                                                    <TableCell>
                                                        {admission.bedCabin
                                                            ? `${admission.bedCabin.code} (${admission.bedCabin.type})`
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell>{admission.doctor?.doctor_name || '-'}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} results
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                            disabled={page === pagination.totalPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </Main>
        </>
    )
}
