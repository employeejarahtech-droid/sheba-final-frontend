import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  UserPlus,
  Stethoscope,
  Calendar,
  Phone,
  DollarSign,
  TrendingUp,
  Activity,
  Search,
  Filter,
} from 'lucide-react'

import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getCookie } from '@/lib/cookies'
import { useCurrency } from '@/hooks/use-currency'

const API_URL = import.meta.env.VITE_API_URL

type DoctorReferred = {
  id: number
  admission_prefix: string | null
  patient_name: string
  age: number | null
  age_text: string | null
  sex: string | null
  phone: string | null
  admission_date: string
  discharge_date: string | null
  status: 'active' | 'discharged' | 'critical'
  diagnosis: string | null
  doctor: {
    id: number
    doctor_name: string
    speciality: string
  } | null
  bedCabin?: {
    id: number
    code: string
    type: string
    ward: string
  }
  finalBill?: {
    id: number
    total_amount: number
    bill_date: string | null
  }
}

type DoctorSummary = {
  doctor_id: number
  doctor_name: string
  speciality: string
  total_patients: number
  active_patients: number
  discharged_patients: number
  total_bill_amount: number
  average_bill_amount: number
  admissions: DoctorReferred[]
}

type ApiResponse<T> = {
  status: boolean
  data: T
  message?: string
}

export function DoctorReferredPage() {
  const { currencySymbol } = useCurrency()
  const token = getCookie('accessToken')

  const [selectedDoctor, setSelectedDoctor] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch all admissions with doctor information
  const { data: admissionsData, isLoading, isError } = useQuery({
    queryKey: ['admissions-with-doctors'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/admission/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to fetch admissions')
      const result: ApiResponse<DoctorReferred[]> = await response.json()
      return result.data || []
    },
    enabled: !!token,
  })

  // Ensure admissions is always an array
  const admissions = Array.isArray(admissionsData) ? admissionsData : []

  // Process data to group by doctor
  const doctorSumaries = useMemo(() => {
    if (!Array.isArray(admissions) || admissions.length === 0) return []

    const doctorMap = new Map<number, DoctorSummary>()

    admissions
      .filter((admission) => admission.doctor !== null)
      .forEach((admission) => {
        const doctorId = admission.doctor!.id
        const doctorName = admission.doctor!.doctor_name
        const speciality = admission.doctor!.speciality || 'General'

        if (!doctorMap.has(doctorId)) {
          doctorMap.set(doctorId, {
            doctor_id: doctorId,
            doctor_name: doctorName,
            speciality: speciality,
            total_patients: 0,
            active_patients: 0,
            discharged_patients: 0,
            total_bill_amount: 0,
            average_bill_amount: 0,
            admissions: [],
          })
        }

        const summary = doctorMap.get(doctorId)!
        summary.total_patients += 1
        summary.admissions.push(admission)

        if (admission.status === 'active') {
          summary.active_patients += 1
        } else if (admission.status === 'discharged') {
          summary.discharged_patients += 1
        }

        if (admission.finalBill) {
          summary.total_bill_amount += Number(admission.finalBill.total_amount)
        }
      })

    // Calculate averages
    doctorMap.forEach((summary) => {
      if (summary.total_patients > 0) {
        summary.average_bill_amount =
          summary.total_bill_amount / summary.total_patients
      }
    })

    return Array.from(doctorMap.values()).sort(
      (a, b) => b.total_patients - a.total_patients
    )
  }, [admissions])

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    let filtered = [...doctorSumaries]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((d) =>
        d.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.speciality.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }, [doctorSumaries, searchQuery])

  // Get selected doctor's admissions
  const selectedDoctorAdmissions = useMemo(() => {
    if (selectedDoctor === 'all') return []
    const doctor = doctorSumaries.find((d) => d.doctor_id === Number(selectedDoctor))
    if (!doctor) return []

    let admissions = [...doctor.admissions]

    // Filter by status
    if (statusFilter !== 'all') {
      admissions = admissions.filter((a) => a.status === statusFilter)
    }

    // Filter by search
    if (searchQuery) {
      admissions = admissions.filter(
        (a) =>
          a.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.phone?.includes(searchQuery)
      )
    }

    return admissions
  }, [doctorSumaries, selectedDoctor, statusFilter, searchQuery])

  const totalPatients = doctorSumaries.reduce((sum, d) => sum + d.total_patients, 0)
  const totalActive = doctorSumaries.reduce((sum, d) => sum + d.active_patients, 0)
  const totalDischarged = doctorSumaries.reduce((sum, d) => sum + d.discharged_patients, 0)
  const totalRevenue = doctorSumaries.reduce((sum, d) => sum + d.total_bill_amount, 0)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      active: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Active' },
      discharged: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', label: 'Discharged' },
      critical: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Critical' },
    }
    const variant = variants[status] || variants.active
    return <Badge className={variant.color}>{variant.label}</Badge>
  }

  return (
    <>
      <AppHeader fixed />
      <Main className="p-6 lg:p-10 w-full flex-1 dark:bg-black/20">
        <div className="max-w-7xl mx-auto space-y-6">
          <PageHeader
            title="Doctor Referred Patients"
            subtitle="View patients referred by different doctors and track admission statistics"
          />

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPatients}</div>
                <p className="text-xs text-muted-foreground">
                  {doctorSumaries.length} referring doctors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{totalActive}</div>
                <p className="text-xs text-muted-foreground">
                  {totalDischarged} discharged
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {currencySymbol}{totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {totalPatients} admissions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. per Patient</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {currencySymbol}{(totalPatients > 0 ? totalRevenue / totalPatients : 0).toFixed(0)}
                </div>
                <p className="text-xs text-muted-foreground">Average bill amount</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Doctor name, patient, or diagnosis..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div>
                  <Label>Filter by Doctor</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Doctors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Doctors</SelectItem>
                      {doctorSumaries.map((doctor) => (
                        <SelectItem key={doctor.doctor_id} value={String(doctor.doctor_id)}>
                          {doctor.doctor_name} ({doctor.speciality})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Filter by Status</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    disabled={selectedDoctor === 'all'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="discharged">Discharged</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50 animate-pulse" />
                <p className="text-muted-foreground">Loading doctor referrals...</p>
              </CardContent>
            </Card>
          ) : isError ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-destructive text-lg font-semibold mb-2">Error loading data</p>
                <p className="text-muted-foreground">Please try again later</p>
              </CardContent>
            </Card>
          ) : selectedDoctor === 'all' ? (
            <>
              {/* Doctor Summary Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Doctor Referral Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Speciality</TableHead>
                        <TableHead className="text-right">Total Patients</TableHead>
                        <TableHead className="text-right">Active</TableHead>
                        <TableHead className="text-right">Discharged</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                        <TableHead className="text-right">Avg. Bill</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((doctor) => (
                        <TableRow
                          key={doctor.doctor_id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedDoctor(String(doctor.doctor_id))}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Stethoscope className="h-4 w-4 text-muted-foreground" />
                              {doctor.doctor_name}
                            </div>
                          </TableCell>
                          <TableCell>{doctor.speciality}</TableCell>
                          <TableCell className="text-right">{doctor.total_patients}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {doctor.active_patients}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                              {doctor.discharged_patients}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {currencySymbol}{doctor.total_bill_amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {currencySymbol}{doctor.average_bill_amount.toFixed(0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Individual Doctor's Patients */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Patient Details</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Showing patients referred by{' '}
                        {doctorSumaries.find((d) => d.doctor_id === Number(selectedDoctor))?.doctor_name}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedDoctor('all')}>
                      ← Back to All Doctors
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Age/Sex</TableHead>
                        <TableHead>Admission Date</TableHead>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead>Bed</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Bill Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDoctorAdmissions.length > 0 ? (
                        selectedDoctorAdmissions.map((admission) => (
                          <TableRow key={admission.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{admission.patient_name}</div>
                                {admission.phone && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {admission.phone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {admission.age_text || `${admission.age} years`}
                                {admission.sex && ` / ${admission.sex}`}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {new Date(admission.admission_date).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="text-sm truncate" title={admission.diagnosis || 'N/A'}>
                                {admission.diagnosis || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {admission.bedCabin ? (
                                <Badge variant="outline">{admission.bedCabin.code}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(admission.status)}</TableCell>
                            <TableCell className="text-right">
                              {admission.finalBill ? (
                                <span className="font-semibold">
                                  {currencySymbol}
                                  {Number(admission.finalBill.total_amount).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                            No patients found for the selected filters
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </Main>
    </>
  )
}
