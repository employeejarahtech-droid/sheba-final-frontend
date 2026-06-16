import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TagInput } from '@/components/ui/tag-input'
import { getCookie } from '@/lib/cookies'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, User, Award, Phone, Stethoscope, Loader2, Plus, CircleCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

export const Route = createFileRoute('/_authenticated/dashboard/outdoor/master/doctors/$doctorId/edit')({
    component: EditDoctorPage,
});

const doctorSchema = z.object({
  doctor_name: z.string().min(1, { message: 'Required' }),
  title: z.string().min(1, { message: 'Required' }),
  doctor_type_ids: z.array(z.number()).min(1, { message: 'Select at least one type' }),
  qualification: z.array(z.string()).min(1, { message: 'At least one qualification required' }),
  speciality: z.array(z.string()).min(1, { message: 'At least one speciality required' }),
  country: z.string().min(1, { message: 'Required' }),
  city: z.string().min(1, { message: 'Required' }),
  phone: z.string().min(1, { message: 'Required' }),
  mobile: z.string().optional(),
  email: z.string().email({ message: 'Invalid email' }).optional().or(z.literal('')),
  experience: z.number().min(0, { message: 'Experience must be at least 0' }),
  score: z.number().min(0, { message: 'Score must be at least 0' }),
})

type DoctorValues = z.infer<typeof doctorSchema>

const doctorTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

type DoctorTypeValues = z.infer<typeof doctorTypeSchema>

function EditDoctorPage() {
  const { doctorId } = Route.useParams()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const token = getCookie('accessToken')

  const [typeModalOpen, setTypeModalOpen] = useState(false)

  // Fetch doctor types
  const { data: doctorTypes = [], isLoading: isLoadingDoctorTypes } = useQuery({
    queryKey: ['doctor-types'],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/doctor-type?limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Failed to fetch doctor types')
      const result = await res.json()
      return result.data?.items || result.data || []
    },
    enabled: !!token,
  })

  // Fetch existing doctor data
  const { data: doctorData, isLoading, error } = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/doctor/${doctorId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (!res.ok) throw new Error("Failed to fetch doctor")
      const result = await res.json()
      return result.data
    },
    enabled: !!token && !!doctorId,
  })

  const form = useForm<DoctorValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      doctor_name: '',
      title: '',
      doctor_type_ids: [],
      qualification: [],
      speciality: [],
      country: '',
      city: '',
      phone: '',
      mobile: '',
      email: '',
      experience: 0,
      score: 0,
    },
  })

  const doctorTypeForm = useForm<DoctorTypeValues>({
    resolver: zodResolver(doctorTypeSchema),
    defaultValues: { name: '', description: '' },
  })

  // Populate form when doctor data is loaded
  useEffect(() => {
    if (!doctorData) return

    let doctorTypeIds: number[] = []
    if (doctorData.doctor_type_ids) {
      doctorTypeIds = doctorData.doctor_type_ids
        .split(',')
        .map((id: string) => parseInt(id.trim()))
        .filter((id: number) => !isNaN(id))
    } else if (doctorData.doctor_type_id) {
      doctorTypeIds = [doctorData.doctor_type_id]
    }

    form.reset({
      doctor_name: doctorData.doctor_name || "",
      title: doctorData.title || "",
      doctor_type_ids: doctorTypeIds,
      qualification: doctorData.qualification ? doctorData.qualification.split(',').map((s: string) => s.trim()) : [],
      speciality: doctorData.speciality ? doctorData.speciality.split(',').map((s: string) => s.trim()) : [],
      country: doctorData.country || "",
      city: doctorData.city || "",
      phone: doctorData.phone || "",
      mobile: doctorData.mobile || "",
      email: doctorData.email || "",
      experience: Number(doctorData.experience) || 0,
      score: Number(doctorData.score) || 0,
    })
  }, [doctorData, form])

  const createTypeMutation = useMutation({
    mutationFn: async (data: DoctorTypeValues) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/doctor-type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to create doctor type')
      }
      return res.json()
    },
    onSuccess: (result) => {
      toast.success('Doctor type created')
      const newId = result.data?.id
      if (newId) {
        const current = form.getValues('doctor_type_ids') || []
        form.setValue('doctor_type_ids', [...current, newId])
      }
      queryClient.invalidateQueries({ queryKey: ['doctor-types'] })
      doctorTypeForm.reset()
      setTypeModalOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create doctor type')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: DoctorValues) => {
      const apiData = {
        ...data,
        qualification: data.qualification.join(', '),
        speciality: data.speciality.join(', '),
      }
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/doctor/${doctorId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(apiData),
        }
      )
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error?.message || "Failed to update doctor")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Doctor updated successfully')
      queryClient.invalidateQueries({ queryKey: ['doctor'] })
      queryClient.invalidateQueries({ queryKey: ['doctor', doctorId] })
      navigate({ to: '/dashboard/outdoor/master/doctors' })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update doctor')
    },
  })

  const onSubmit = (data: DoctorValues) => {
    updateMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-black/20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg font-medium text-blue-600">Loading doctor data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-4">
        <div className="rounded-full bg-red-100 p-6 mb-6 shadow-lg shadow-red-100/50">
          <Stethoscope className="h-12 w-12 text-red-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Error loading data</h3>
        <Button
          variant="outline"
          className="mt-6 h-12 px-6 rounded-xl border-2 hover:bg-gray-50"
          onClick={() => navigate({ to: '/dashboard/outdoor/master/doctors' })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
      </div>
    )
  }

  return (
    <>
      <AppHeader fixed />

      <Main className="flex flex-1 flex-col gap-6">
        <Form {...form}>
          <form
            id="edit-doctor-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 w-full min-w-[650px] max-w-[750px] mx-auto px-4"
          >
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate({ to: '/dashboard/outdoor/master/doctors' })}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Edit Doctor Profile
                  </h1>
                  <p className="text-muted-foreground text-sm">Update information for {doctorData?.doctor_name}</p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Personal Information</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Name, title, experience, and score</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="doctor_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doctor's Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Dr. John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Senior Consultant" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g. 10"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Performance Score</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0-100"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Doctor Type */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg">
                      <Stethoscope className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">Doctor Type</CardTitle>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Select all applicable categories</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1 text-violet-600 border-violet-200 hover:bg-violet-50 dark:text-violet-400 dark:border-violet-800 dark:hover:bg-violet-950/30"
                    onClick={() => setTypeModalOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Doctor Type
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <FormField
                  control={form.control}
                  name="doctor_type_ids"
                  render={({ field }) => (
                    <FormItem>
                      {isLoadingDoctorTypes ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading doctor types...
                        </div>
                      ) : doctorTypes.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground py-8">
                          <p>No doctor types available.</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => setTypeModalOpen(true)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Create your first doctor type
                          </Button>
                        </div>
                      ) : (
                        <FormControl>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {doctorTypes.map((type: { id: number; name: string }) => {
                              const isSelected = field.value?.includes(type.id)
                              return (
                                <label
                                  key={type.id}
                                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all text-sm ${
                                    isSelected
                                      ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-700'
                                      : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const checked = e.target.checked
                                      const currentValues = field.value || []
                                      field.onChange(
                                        checked
                                          ? [...currentValues, type.id]
                                          : currentValues.filter((v) => v !== type.id)
                                      )
                                    }}
                                    className="h-4 w-4 rounded border-input accent-violet-600"
                                  />
                                  <span className="font-medium">{type.name}</span>
                                </label>
                              )
                            })}
                          </div>
                        </FormControl>
                      )}
                      {field.value && field.value.length > 0 && (
                        <FormDescription className="text-xs mt-3">
                          {field.value.length} type(s) selected
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Expertise & Qualifications */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg shadow-lg">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Expertise & Qualifications</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Degrees and medical specializations</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="qualification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qualifications</FormLabel>
                        <FormControl>
                          <TagInput
                            placeholder="Type and press Enter..."
                            value={field.value}
                            onChange={field.onChange}
                            className="min-h-[40px]"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Add degrees like MBBS, FCPS, MD, etc.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="speciality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialities</FormLabel>
                        <FormControl>
                          <TagInput
                            placeholder="Type and press Enter..."
                            value={field.value}
                            onChange={field.onChange}
                            className="min-h-[40px]"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Cardiology, Neurology, etc.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact & Location */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-lg">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Contact & Location</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Communication and address details</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="doctor@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+880..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile</FormLabel>
                        <FormControl>
                          <Input placeholder="+880..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Bangladesh" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Dhaka" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pb-10">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate({ to: '/dashboard/outdoor/master/doctors' })}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={updateMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[200px]"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CircleCheck className="mr-2 h-5 w-5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Main>

      {/* Add Doctor Type Modal */}
      <Dialog open={typeModalOpen} onOpenChange={setTypeModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Doctor Type</DialogTitle>
            <DialogDescription>Create a new doctor category</DialogDescription>
          </DialogHeader>
          <Form {...doctorTypeForm}>
            <form
              onSubmit={doctorTypeForm.handleSubmit((data) => createTypeMutation.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={doctorTypeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Consultant, Surgeon" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={doctorTypeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional description..." className="min-h-[70px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setTypeModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTypeMutation.isPending}>
                  {createTypeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default EditDoctorPage;
