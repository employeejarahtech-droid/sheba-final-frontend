import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, HeartPulse, UserRound } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TagInput } from '@/components/ui/tag-input'
import { DateField } from '@/components/date-field'
import {
  useCreatePatientMutation,
  useUpdatePatientMutation,
} from '@/features/prescriptions/patientsQueries'
import type { Patient } from '@/types/prescriptions.types'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  dob: z.string().optional(),
  age_years: z.string().optional(),
  age_text: z.string().optional(),
  sex: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  blood_group: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  chronic_conditions: z.array(z.string()).optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive']),
})
type Values = z.infer<typeof schema>

const BACK = '/dashboard/prescriptions/patients'
const SEX_OPTIONS = ['Male', 'Female', 'Other']
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export function PatientForm({ initial }: { initial?: Patient }) {
  const navigate = useNavigate()
  const create = useCreatePatientMutation()
  const update = useUpdatePatientMutation()
  const editing = !!initial
  const saving = create.isPending || update.isPending

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name || '',
      dob: initial?.dob || '',
      age_years: initial?.age_years != null ? String(initial.age_years) : '',
      age_text: initial?.age_text || '',
      sex: initial?.sex || '',
      phone: initial?.phone || '',
      email: initial?.email || '',
      address: initial?.address || '',
      blood_group: initial?.blood_group || '',
      allergies: initial?.allergies ?? [],
      chronic_conditions: initial?.chronic_conditions ?? [],
      emergency_contact_name: initial?.emergency_contact_name || '',
      emergency_contact_phone: initial?.emergency_contact_phone || '',
      notes: initial?.notes || '',
      status: initial?.status || 'active',
    },
  })

  const onSubmit = async (values: Values) => {
    const body = {
      ...values,
      dob: values.dob || null,
      age_years: values.age_years && !isNaN(Number(values.age_years)) ? Number(values.age_years) : null,
      age_text: values.age_text || null,
      sex: values.sex || null,
      phone: values.phone || null,
      email: values.email || null,
      address: values.address || null,
      blood_group: values.blood_group || null,
      emergency_contact_name: values.emergency_contact_name || null,
      emergency_contact_phone: values.emergency_contact_phone || null,
      notes: values.notes || null,
    }
    try {
      if (editing) { await update.mutateAsync({ id: initial!.id, body: body as any }); toast.success('Patient updated') }
      else { await create.mutateAsync(body as any); toast.success('Patient created') }
      navigate({ to: BACK })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save patient')
    }
  }

  return (
    <>
      <AppHeader fixed />
      <Main className="flex flex-1 flex-col gap-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 w-full max-w-[900px] mx-auto px-4">
            <div className="flex items-center gap-4 mb-2">
              <Button type="button" variant="ghost" size="icon" onClick={() => navigate({ to: BACK })}><ArrowLeft className="h-5 w-5" /></Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {editing ? (initial!.patient_no ? `Edit ${initial!.patient_no}` : 'Edit Patient') : 'Register Patient'}
                </h1>
                <p className="text-muted-foreground text-sm">Demographics, allergies and chronic conditions (allergies drive prescription warnings)</p>
              </div>
            </div>

            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><UserRound className="w-4 h-4 text-white" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold">Patient Details</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Name, age, sex and contact</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 space-y-1.5">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Name *</FormLabel><FormControl><Input placeholder="Full name" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="space-y-1.5">
                    <FormField control={form.control} name="dob" render={({ field }) => (
                      <FormItem><FormLabel>Date of birth</FormLabel><DateField value={field.value ?? ''} onChange={field.onChange} placeholder="Optional" /></FormItem>
                    )} />
                  </div>
                  <div className="space-y-1.5">
                    <FormField control={form.control} name="age_years" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age (years)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="Used when DOB unknown" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="space-y-1.5">
                    <FormField control={form.control} name="age_text" render={({ field }) => (
                      <FormItem><FormLabel>Age text</FormLabel><FormControl><Input placeholder="e.g. 8 months (infants)" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="space-y-1.5">
                    <FormField control={form.control} name="sex" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sex</FormLabel>
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                          <SelectContent>{SEX_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="space-y-1.5">
                    <FormField control={form.control} name="blood_group" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood group</FormLabel>
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                          <SelectContent>{BLOOD_GROUPS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="space-y-1.5">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="Shared family phones allowed" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="space-y-1.5">
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="md:col-span-3 space-y-1.5">
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border-red-200 dark:border-red-900/50">
              <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg shadow-lg"><HeartPulse className="w-4 h-4 text-white" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold">Clinical Safety</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Allergies are checked against every prescribed medicine</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <FormField control={form.control} name="allergies" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Known allergies</FormLabel>
                    <FormControl>
                      <TagInput
                        placeholder="Type an allergen and press Enter (e.g. Penicillin)…"
                        value={field.value ?? []}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="chronic_conditions" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chronic conditions</FormLabel>
                    <FormControl>
                      <TagInput
                        placeholder="e.g. Diabetes, Hypertension — press Enter to add…"
                        value={field.value ?? []}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="emergency_contact_name" render={({ field }) => (
                    <FormItem><FormLabel>Emergency contact name</FormLabel><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="emergency_contact_phone" render={({ field }) => (
                    <FormItem><FormLabel>Emergency contact phone</FormLabel><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Optional remarks" className="min-h-[70px]" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem className="max-w-[220px]">
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3 pb-10">
              <Button type="button" variant="outline" size="lg" onClick={() => navigate({ to: BACK })} disabled={saving}>Cancel</Button>
              <Button type="submit" size="lg" disabled={saving} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[180px]">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Patient'}
              </Button>
            </div>
          </form>
        </Form>
      </Main>
    </>
  )
}
