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
import { GallerySelector } from '@/components/gallery-selector'
import { getCookie } from '@/lib/cookies'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, User, Award, Phone, Stethoscope, Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { authenticatedFetch, handleFetchError } from '@/lib/authenticated-fetch'

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
  show_in_home_page: z.boolean().default(false),
  is_active: z.boolean().default(true),
})

type DoctorValues = z.infer<typeof doctorSchema>

const doctorTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

type DoctorTypeValues = z.infer<typeof doctorTypeSchema>

export default function CreateDoctorPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const token = getCookie('accessToken')

  const [typeModalOpen, setTypeModalOpen] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const { data: doctorTypes = [], isLoading: isLoadingDoctorTypes } = useQuery({
    queryKey: ['doctor-types'],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/doctor-type?limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Failed to fetch doctor types')
      const result = await res.json()
      const items = result.data?.items || result.data || []
      return Array.isArray(items) ? items : []
    },
    enabled: !!token,
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
      show_in_home_page: false,
      is_active: true,
    },
  })

  const doctorTypeForm = useForm<DoctorTypeValues>({
    resolver: zodResolver(doctorTypeSchema),
    defaultValues: { name: '', description: '' },
  })

  const createTypeMutation = useMutation({
    mutationFn: async (data: DoctorTypeValues) => {
      const res = await fetch(`${API_URL}/api/doctor-type`, {
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

  const createMutation = useMutation({
    mutationFn: async (data: DoctorValues) => {
      const apiData = {
        ...data,
        qualification: data.qualification.join(', '),
        speciality: data.speciality.join(', '),
        image: imagePreview || undefined,
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/doctor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(apiData),
        }
      )
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to create doctor')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Doctor created successfully')
      queryClient.invalidateQueries({ queryKey: ['doctor'] })
      navigate({ to: '/dashboard/outdoor/master/doctors' })
    },
    onError: (error: Error) => {
      if (error.message !== 'Unauthorized') {
        toast.error(error.message || 'Failed to create doctor')
      }
    },
  })

  const onSubmit = (data: DoctorValues) => {
    createMutation.mutate(data)
  }

  return (
    <>
      <AppHeader fixed />

      <Main className="flex flex-1 flex-col gap-6">
        <Form {...form}>
          <form
            id="create-doctor-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 w-full min-w-[650px] max-w-[750px] mx-auto px-4"
          >
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate({ to: '/dashboard/outdoor/master/doctors' })}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Register New Doctor
                  </h1>
                  <p className="text-muted-foreground text-sm">Create a new profile for a medical professional</p>
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
                  <FormField
                    control={form.control}
                    name="show_in_home_page"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm mt-4 md:col-span-2">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Show in Home Page
                          </FormLabel>
                          <FormDescription>
                            Display this doctor on the tenant home page
                          </FormDescription>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm mt-4 md:col-span-2 border-l-4 border-l-blue-500">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-semibold">
                            Active Status
                          </FormLabel>
                          <FormDescription>
                            If inactive, the doctor won't appear in admission or invoice selections
                          </FormDescription>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Display Settings */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg shadow-lg">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Profile Image</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Upload a professional photo</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold mb-2">Select from Gallery</div>
                      <div className="flex">
                        <GallerySelector
                          onImageSelect={(url) => setImagePreview(url)}
                          currentImage={imagePreview || undefined}
                          triggerLabel="Choose Profile Image"
                          triggerClassName="gap-2"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          maxSize={5 * 1024 * 1024}
                          aspectRatio="square"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Recommended size: 400x400px.
                      </p>
                    </div>
                  </div>
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
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={createMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[200px]"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-5 w-5" />
                    Register Doctor
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
