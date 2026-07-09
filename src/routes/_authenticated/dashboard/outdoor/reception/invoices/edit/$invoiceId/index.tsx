import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/page-header'
import { Main } from '@/components/layout/main'
import { AppHeader } from '@/components/layout/app-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Check, ChevronDown, FlaskConical, Loader2, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCookie } from '@/lib/cookies'
import { useDebounce } from '@/hooks/useDebounce'

export const Route = createFileRoute(
  '/_authenticated/dashboard/outdoor/reception/invoices/edit/$invoiceId/',
)({
  component: EditInvoicePatientInfoPage,
})

const formSchema = z.object({
  patient_name: z.string().min(1, 'Patient name is required'),
  sex: z.string().min(1, 'Sex is required'),
  ageYears: z.string().optional(),
  ageMonths: z.string().optional(),
  phone: z.string().optional(),
  ref_doctor: z.string().optional(),
  sample_collection_rooms: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof formSchema>

type DoctorItem = {
  id: number
  doctor_name: string
  title?: string
  qualification?: string
  speciality?: string
}

type RoomItem = {
  id: number
  name: string
  location: string
  notes?: string
  status: 'active' | 'inactive'
}

// Reverses the "<years>Y <months>M" text the create form writes into age_text,
// so editing an existing invoice doesn't clobber whichever part wasn't set.
function splitAgeText(ageText: string | null | undefined, fallbackAge: string | number | null | undefined) {
  if (ageText) {
    const match = ageText.match(/(\d+)\s*Y\s*(\d+)\s*M/i)
    if (match) {
      return { years: match[1] === '0' ? '' : match[1], months: match[2] === '0' ? '' : match[2] }
    }
  }
  return { years: fallbackAge ? String(fallbackAge) : '', months: '' }
}

// Invoices span years of data entry, so `sex` isn't guaranteed to already be
// one of the exact 'male'/'female'/'other' values the Select expects (older
// rows may hold 'M'/'F', 'Male', etc.). Normalize so the Select still shows
// the saved value instead of falling back to the empty placeholder.
function normalizeSex(raw: string | null | undefined): string {
  const v = (raw || '').trim().toLowerCase()
  if (!v) return ''
  if (v === 'm' || v === 'male') return 'male'
  if (v === 'f' || v === 'female') return 'female'
  return 'other'
}

function EditInvoicePatientInfoPage() {
  const { invoiceId } = Route.useParams()
  const navigate = useNavigate()
  const token = getCookie('accessToken')
  const queryClient = useQueryClient()

  const [doctorOpen, setDoctorOpen] = useState(false)
  const [doctorSearch, setDoctorSearch] = useState('')
  const debouncedDoctorSearch = useDebounce(doctorSearch, 400)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patient_name: '',
      sex: '',
      ageYears: '',
      ageMonths: '',
      phone: '',
      ref_doctor: '',
      sample_collection_rooms: [],
    },
  })
  const { watch, setValue, handleSubmit, control, reset } = form
  const selectedRooms = watch('sample_collection_rooms') || []
  // Tracks whether reset() has already populated the form from the fetched
  // invoice. Radix's Select can fail to reflect a value applied via reset()
  // after it has already mounted with an empty value, so the form is kept
  // hidden until hydration is done — it then mounts once, already correct,
  // instead of mounting empty and updating a beat later.
  const [hydrated, setHydrated] = useState(false)

  const { data: invoiceData, isLoading: isLoadingInvoice } = useQuery({
    queryKey: ['outdoor-invoice', invoiceId],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to fetch invoice')
      return response.json()
    },
    enabled: !!token && !!invoiceId,
  })

  useEffect(() => {
    const invoice = invoiceData?.data
    if (!invoice) return
    const { years, months } = splitAgeText(invoice.age_text, invoice.age)
    reset({
      patient_name: invoice.patient_name || '',
      sex: normalizeSex(invoice.sex),
      ageYears: years,
      ageMonths: months,
      phone: invoice.phone || '',
      ref_doctor: invoice.doctor_id ? String(invoice.doctor_id) : '',
      sample_collection_rooms: (invoice.sample_collection_rooms || []).map((r: any) => String(r.room_id)),
    })
    setHydrated(true)
  }, [invoiceData, reset])

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors', debouncedDoctorSearch],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/doctor?limit=100&is_active=true&search=${encodeURIComponent(debouncedDoctorSearch)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) throw new Error('Failed to fetch doctors')
      return res.json()
    },
    enabled: !!token,
  })
  // The active-doctors search list won't include a doctor who's since been
  // deactivated, which would make an already-assigned reference doctor look
  // unset. GET /:id already returns the full nested doctor regardless of
  // active status, so merge it in as a fallback option.
  const assignedDoctor = invoiceData?.data?.doctor as DoctorItem | undefined
  const doctors: DoctorItem[] = useMemo(() => {
    const list: DoctorItem[] = doctorsData?.data?.items || []
    if (assignedDoctor && !list.some((d) => d.id === assignedDoctor.id)) {
      return [assignedDoctor, ...list]
    }
    return list
  }, [doctorsData, assignedDoctor])

  const { data: roomsData, isLoading: isLoadingRooms } = useQuery({
    queryKey: ['sample-collection-rooms'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sample-collection-rooms?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch sample collection rooms')
      const result = await res.json()
      return result.data || { items: [] }
    },
    enabled: !!token,
  })
  // Same issue as doctors: a room already assigned to this invoice may have
  // since been marked inactive and wouldn't appear in the general rooms list,
  // making an existing assignment look empty. Merge it in from invoice data.
  const assignedRooms: RoomItem[] = useMemo(
    () => (invoiceData?.data?.sample_collection_rooms || []).map((r: any) => r.room).filter(Boolean),
    [invoiceData],
  )
  const rooms: RoomItem[] = useMemo(() => {
    const list: RoomItem[] = roomsData?.items || []
    const missing = assignedRooms.filter((r) => !list.some((x) => x.id === r.id))
    return [...list, ...missing]
  }, [roomsData, assignedRooms])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        patient_name: values.patient_name,
        sex: values.sex,
        age: Number(values.ageYears) || Number(values.ageMonths) || null,
        age_text: values.ageYears || values.ageMonths ? `${values.ageYears || 0}Y ${values.ageMonths || 0}M` : null,
        phone: values.phone || null,
        doctor_id: values.ref_doctor ? Number(values.ref_doctor) : null,
        sample_collection_rooms: values.sample_collection_rooms || [],
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${invoiceId}/patient-info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('Failed to update invoice')
      return response.json()
    },
    onSuccess: () => {
      toast.success('Patient information updated successfully')
      queryClient.invalidateQueries({ queryKey: ['outdoor-invoice', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
      navigate({ to: '/dashboard/outdoor/reception/invoices/$invoiceId/', params: { invoiceId } })
    },
    onError: () => {
      toast.error('Failed to update patient information')
    },
  })

  const onSubmit = (values: FormValues) => mutation.mutate(values)

  return (
    <>
      <AppHeader fixed />
      <Main>
       

        {isLoadingInvoice || !hydrated ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading invoice...
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">

               <div className="mb-6">
                <PageHeader
                  title="Edit Invoice"
                  description="Update patient information and sample collection rooms for this invoice"
                />
              </div>


              {/* Patient Information */}
              <Card className="overflow-hidden gap-0 shadow-sm p-0">
                <CardHeader className="border-b py-3 px-4 gap-0" style={{ backgroundColor: '#3B82F6' }}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-lg">
                      <User className="w-4 h-4" style={{ color: '#3B82F6' }} />
                    </div>
                    <CardTitle className="text-base font-semibold text-white">Patient Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                    <FormField
                      control={control}
                      name="patient_name"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-sm font-semibold">Patient Name</FormLabel>
                          <FormControl>
                            <Input className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="sex"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-sm font-semibold">Sex</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="w-full" style={{ height: '40px' }}>
                                <SelectValue placeholder="Select sex..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormItem className="flex flex-col gap-2">
                      <FormLabel className="text-sm font-semibold">Age</FormLabel>
                      <div className="flex gap-2 items-center">
                        <FormField
                          control={control}
                          name="ageYears"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" min="0" placeholder="0" className="h-10 w-20" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <span className="text-xs text-muted-foreground">Yr</span>
                        <FormField
                          control={control}
                          name="ageMonths"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" min="0" max="11" placeholder="0" className="h-10 w-20" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <span className="text-xs text-muted-foreground">Mo</span>
                      </div>
                    </FormItem>

                    <FormField
                      control={control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-sm font-semibold">Phone</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="01xxxxxxxxx" className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="ref_doctor"
                      render={({ field }) => {
                        const selectedDoctor = doctors.find((doc) => String(doc.id) === String(field.value))
                        return (
                          <FormItem className="flex flex-col gap-2 md:col-span-2">
                            <FormLabel className="text-sm font-semibold">Ref. Doctor</FormLabel>
                            <Popover open={doctorOpen} onOpenChange={setDoctorOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      'w-full justify-between h-10 font-normal',
                                      !field.value && 'text-muted-foreground',
                                    )}
                                  >
                                    {selectedDoctor ? (
                                      <div className="flex flex-col items-start">
                                        <span className="font-medium">
                                          Dr. {selectedDoctor.doctor_name}
                                          {(selectedDoctor.qualification || selectedDoctor.title) &&
                                            ` (${selectedDoctor.qualification || selectedDoctor.title})`}
                                        </span>
                                        {selectedDoctor.speciality && (
                                          <span className="text-xs text-muted-foreground">{selectedDoctor.speciality}</span>
                                        )}
                                      </div>
                                    ) : (
                                      'Select doctor...'
                                    )}
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command
                                  filter={(value, search) => {
                                    if (!search) return 1
                                    return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                                  }}
                                >
                                  <CommandInput
                                    placeholder="Search doctor by name, qualification, or specialty..."
                                    className="h-10"
                                    value={doctorSearch}
                                    onValueChange={setDoctorSearch}
                                  />
                                  <CommandList className="max-h-[300px]">
                                    <CommandEmpty>No doctor found.</CommandEmpty>
                                    <CommandGroup>
                                      {doctors.map((doctor) => {
                                        const displayName = `Dr. ${doctor.doctor_name}`
                                        const subtitle = [doctor.qualification || doctor.title, doctor.speciality]
                                          .filter(Boolean)
                                          .join(' - ')
                                        return (
                                          <CommandItem
                                            key={doctor.id}
                                            value={`${doctor.doctor_name} ${doctor.qualification || doctor.title || ''} ${doctor.speciality || ''} ${doctor.id}`}
                                            className="py-2.5 px-4 cursor-pointer"
                                            onSelect={() => {
                                              field.onChange(String(doctor.id))
                                              setDoctorOpen(false)
                                            }}
                                          >
                                            <div className="flex items-center gap-2 w-full">
                                              <Check
                                                className={cn(
                                                  'h-4 w-4 shrink-0',
                                                  String(doctor.id) === String(field.value) ? 'opacity-100' : 'opacity-0',
                                                )}
                                              />
                                              <div className="flex flex-col">
                                                <span className="font-medium">{displayName}</span>
                                                {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
                                              </div>
                                            </div>
                                          </CommandItem>
                                        )
                                      })}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sample Collection Rooms */}
              <Card className="overflow-hidden gap-0 shadow-sm p-0">
                <CardHeader className="border-b py-3 px-4 gap-0" style={{ backgroundColor: '#14B8A6' }}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-lg">
                      <FlaskConical className="w-4 h-4" style={{ color: '#14B8A6' }} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-white">Sample Collection Rooms</CardTitle>
                      <p className="text-xs text-white/80">Select rooms for sample collection</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  {isLoadingRooms ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mb-2" />
                      <p className="text-sm">Loading sample collection rooms...</p>
                    </div>
                  ) : rooms.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rooms
                          .filter((room) => room.status === 'active' || selectedRooms.includes(String(room.id)))
                          .map((room) => {
                            const roomId = String(room.id)
                            const isSelected = selectedRooms.includes(roomId)
                            return (
                              <div
                                key={room.id}
                                className={cn(
                                  'relative flex items-start gap-3 p-4 rounded-lg border transition-colors',
                                  isSelected ? 'bg-accent border-primary' : 'bg-background hover:border-muted-foreground/40',
                                )}
                              >
                                <Checkbox
                                  id={`room-${room.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    if (typeof checked === 'boolean') {
                                      const updated = checked
                                        ? [...selectedRooms, roomId]
                                        : selectedRooms.filter((r) => r !== roomId)
                                      setValue('sample_collection_rooms', updated, { shouldValidate: true })
                                    }
                                  }}
                                  className="mt-0.5"
                                />
                                <label htmlFor={`room-${room.id}`} className="flex-1 cursor-pointer">
                                  <div className="flex items-center justify-between gap-2">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{room.name}</h4>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {room.status !== 'active' && (
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">
                                          Inactive
                                        </span>
                                      )}
                                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">{room.location}</p>
                                  {room.notes && <p className="text-xs text-muted-foreground mt-1 italic">{room.notes}</p>}
                                </label>
                              </div>
                            )
                          })}
                      </div>
                      {selectedRooms.length > 0 && (
                        <div className="mt-4 p-3 bg-muted/40 rounded-lg border">
                          <p className="text-sm font-medium text-foreground">
                            {selectedRooms.length} room{selectedRooms.length > 1 ? 's' : ''} selected for sample collection
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No sample collection rooms available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </Main>
    </>
  )
}
