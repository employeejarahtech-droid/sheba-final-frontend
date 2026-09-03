import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useFieldArray, useForm, Controller, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  ArrowLeft, ChevronDown, ChevronUp, Plus, Printer, Trash2, Stethoscope, FlaskConical,
  Activity, ClipboardList, MessageSquareText, Pill,
} from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DateField } from '@/components/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreatePrescriptionMutation, useUpdatePrescriptionMutation, usePrescriptionQuery } from '@/features/prescriptions/prescriptionsQueries'
import { useQuickPhrasesGroupedQuery } from '@/features/prescriptions/quickPhrasesQueries'
import { useLiveUser } from '@/hooks/use-live-user'
import { PatientPicker } from './PatientPicker'
import { MedicinePicker } from './MedicinePicker'
import { TestPicker } from './TestPicker'
import { QuickPhrasePicker, appendPhrase } from './QuickPhrasePicker'
import {
  InteractionWarnings, AcknowledgeWarningsDialog, useAcknowledgeWarningsFlow,
} from './InteractionWarnings'
import type { Patient, RxMedicine } from '@/types/prescriptions.types'

type ItemValues = {
  medicine_master_id: number | null
  medicine_name: string
  generic_name: string
  form: string
  dosage: string
  frequency: string
  duration: string
  route: string
  instructions: string
  instructions_local: string
}
type TestValues = {
  test_id: number | null
  test_name: string
  note: string
}
type Values = {
  doctor_id: string
  patient_name: string
  patient_age: string
  patient_age_months: string
  patient_sex: string
  patient_phone: string
  follow_up_date: string
  chief_complaints: string
  on_examination: string
  history_notes: string
  diagnosis: string
  icd_code: string
  icd_description: string
  advice: string
  vital_bp: string
  vital_pulse: string
  vital_temperature: string
  vital_weight: string
  items: ItemValues[]
  tests: TestValues[]
}

const BACK = '/dashboard/prescriptions'
const emptyItem: ItemValues = {
  medicine_master_id: null, medicine_name: '', generic_name: '', form: '',
  dosage: '', frequency: '', duration: '', route: '', instructions: '', instructions_local: '',
}

/** Full dosage-form names (as stored on the rx_medicines master) to the
 *  short form written on a prescription pad. */
const FORM_ABBREVIATIONS: Record<string, string> = {
  Tablet: 'Tab', Capsule: 'Cap', Suspension: 'Sus', Syrup: 'Syr',
  Injection: 'Inj', Ointment: 'Oint', Drops: 'Drop', Cream: 'Cream',
  Sachet: 'Sachet', Inhaler: 'Inhaler', Gel: 'Gel', Lotion: 'Lotion',
}
const abbreviateForm = (form?: string | null) => (form ? FORM_ABBREVIATIONS[form] || form : '')
const emptyTest: TestValues = { test_id: null, test_name: '', note: '' }
const SEX_OPTIONS = ['Male', 'Female', 'Other']

/** Combine Years/Months age inputs into the display string stored in
 *  age_text (e.g. "10y 4m" or "5m" for an infant), or null when the age is
 *  a whole number of years with no months remainder — patient_age alone
 *  already renders that case fine. */
function buildAgeText(years: number | null, months: number): string | null {
  if (!months) return null
  return years ? `${years}y ${months}m` : `${months}m`
}

/** Best-effort reverse of buildAgeText, for prefilling the Months input when
 *  editing a prescription whose age_text matches the format above. Older
 *  free-text values (entered before this field existed) won't match and are
 *  left as 0 — the Years input still carries the original patient_age. */
function parseAgeTextMonths(ageText?: string | null): string {
  if (!ageText) return ''
  const match = /^(?:\d+y\s*)?(\d+)m$/.exec(ageText.trim())
  return match ? match[1] : ''
}

interface PrescriptionFormProps {
  /** When provided, the form loads and edits that existing prescription
   *  instead of creating a new one. */
  prescriptionId?: string | number
}

export function PrescriptionForm({ prescriptionId }: PrescriptionFormProps = {}) {
  const isEdit = prescriptionId != null
  const navigate = useNavigate()
  const { user } = useLiveUser()
  const create = useCreatePrescriptionMutation()
  const update = useUpdatePrescriptionMutation()
  const { data: phrases } = useQuickPhrasesGroupedQuery()
  const phrasesFor = (category: string) => phrases?.[category as keyof typeof phrases] || []

  const { data: existingRx, isLoading: loadingRx } = usePrescriptionQuery(prescriptionId)

  const [patient, setPatient] = useState<Patient | null>(null)
  // Medicine rows collapse to a compact summary line — keyed by the
  // field-array's stable id (not index) so it survives rows being removed.
  const [collapsedMedicineIds, setCollapsedMedicineIds] = useState<Set<string>>(new Set())
  const toggleMedicineCollapsed = (id: string) =>
    setCollapsedMedicineIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  const gate = useAcknowledgeWarningsFlow()

  const { control, handleSubmit, setValue, reset } = useForm<Values>({
    defaultValues: {
      doctor_id: '',
      patient_name: '', patient_age: '', patient_age_months: '', patient_sex: '', patient_phone: '',
      follow_up_date: '',
      chief_complaints: '', on_examination: '', history_notes: '',
      diagnosis: '', icd_code: '', icd_description: '', advice: '',
      vital_bp: '', vital_pulse: '', vital_temperature: '', vital_weight: '',
      items: [{ ...emptyItem }],
      tests: [],
    },
  })
  const itemArray = useFieldArray({ control, name: 'items' })
  const testArray = useFieldArray({ control, name: 'tests' })

  // Default the prescribing doctor to the logged-in user once their id is
  // known — only for a NEW prescription; an edit must keep the original
  // prescriber, restored below once the existing record loads.
  useEffect(() => {
    if (!isEdit && user?.id) setValue('doctor_id', String(user.id))
  }, [isEdit, user?.id, setValue])

  // Populate the form once the existing prescription loads (edit mode).
  useEffect(() => {
    if (!isEdit || !existingRx) return
    setPatient(existingRx.patient ?? null)
    reset({
      doctor_id: String(existingRx.doctor_id),
      patient_name: existingRx.patient_name || '',
      patient_age: existingRx.patient_age != null ? String(existingRx.patient_age) : '',
      patient_age_months: parseAgeTextMonths(existingRx.age_text),
      patient_sex: existingRx.patient_sex || '',
      patient_phone: existingRx.patient_phone || '',
      follow_up_date: existingRx.follow_up_date || '',
      chief_complaints: existingRx.chief_complaints || '',
      on_examination: existingRx.on_examination || '',
      history_notes: existingRx.history_notes || '',
      diagnosis: existingRx.diagnosis || '',
      icd_code: existingRx.icd_code || '',
      icd_description: existingRx.icd_description || '',
      advice: existingRx.advice || '',
      vital_bp: existingRx.vitals?.bp || '',
      vital_pulse: existingRx.vitals?.pulse || '',
      vital_temperature: existingRx.vitals?.temperature || '',
      vital_weight: existingRx.vitals?.weight || '',
      items: existingRx.items?.length
        ? existingRx.items.map((it) => ({
            medicine_master_id: it.medicine_master_id ?? null,
            medicine_name: it.medicine_name || '',
            generic_name: it.generic_name || '',
            form: it.form || '',
            dosage: it.dosage || '',
            frequency: it.frequency || '',
            duration: it.duration || '',
            route: it.route || '',
            instructions: it.instructions || '',
            instructions_local: it.instructions_local || '',
          }))
        : [{ ...emptyItem }],
      tests: (existingRx.tests || []).map((t) => ({
        test_id: t.test_id ?? null,
        test_name: t.test_name || '',
        note: t.note || '',
      })),
    })
  }, [isEdit, existingRx, reset])

  const watchedItems = useWatch({ control, name: 'items' })
  const generics = useMemo(
    () => (watchedItems ?? []).map((it) => it?.generic_name || '').filter(Boolean),
    [watchedItems]
  )

  const onPickPatient = (p: Patient | null) => {
    setPatient(p)
    if (p) {
      setValue('patient_name', p.name)
      setValue('patient_age', p.age_years != null ? String(p.age_years) : '')
      setValue('patient_age_months', parseAgeTextMonths(p.age_text))
      setValue('patient_sex', p.sex || '')
      setValue('patient_phone', p.phone || '')
    }
    // clearing keeps whatever is typed — walk-in entry
  }

  const onPickMedicine = (idx: number, med: RxMedicine | null) => {
    if (!med) return
    setValue(`items.${idx}.medicine_master_id`, med.id)
    setValue(`items.${idx}.medicine_name`, med.strength ? `${med.name} ${med.strength}` : med.name)
    if (med.generic_name) setValue(`items.${idx}.generic_name`, med.generic_name)
    setValue(`items.${idx}.form`, med.form || '')
    if (med.default_route) setValue(`items.${idx}.route`, med.default_route)
    if (med.default_dosage) setValue(`items.${idx}.dosage`, med.default_dosage)
    if (med.default_frequency) setValue(`items.${idx}.frequency`, med.default_frequency)
    if (med.default_duration) setValue(`items.${idx}.duration`, med.default_duration)
    if (med.caution_note) toast.info(`${med.name}: ${med.caution_note}`)
  }

  const buildPayload = (values: Values, acknowledge: boolean) => {
    const lineItems = values.items
      .filter((it) => it.medicine_name.trim())
      .map((it) => ({
        medicine_master_id: it.medicine_master_id || null,
        medicine_name: it.medicine_name.trim(),
        generic_name: it.generic_name || null,
        form: it.form || null,
        dosage: it.dosage || null,
        frequency: it.frequency || null,
        duration: it.duration || null,
        route: it.route || null,
        instructions: it.instructions || null,
        instructions_local: it.instructions_local || null,
      }))
    const lineTests = values.tests
      .filter((t) => t.test_name.trim())
      .map((t) => ({ test_id: t.test_id || null, test_name: t.test_name.trim(), note: t.note || null }))
    const hasVitals = values.vital_bp || values.vital_pulse || values.vital_temperature || values.vital_weight
    const ageYears = values.patient_age ? Number(values.patient_age) : null
    const ageMonths = values.patient_age_months ? Number(values.patient_age_months) : 0
    return {
      doctor_id: Number(values.doctor_id),
      patient_id: patient?.id ?? null,
      patient_name: values.patient_name.trim(),
      patient_age: ageYears,
      // undefined (not null) when there's no months component, so a blank
      // Months input doesn't wipe out a registered patient's own age_text
      // snapshot — the backend only overrides the snapshot for keys it
      // actually receives.
      age_text: buildAgeText(ageYears, ageMonths) ?? undefined,
      patient_sex: values.patient_sex || null,
      patient_phone: values.patient_phone || null,
      follow_up_date: values.follow_up_date || null,
      chief_complaints: values.chief_complaints || null,
      on_examination: values.on_examination || null,
      history_notes: values.history_notes || null,
      diagnosis: values.diagnosis || null,
      icd_code: values.icd_code || null,
      icd_description: values.icd_description || null,
      advice: values.advice || null,
      vitals: hasVitals
        ? {
            bp: values.vital_bp || undefined,
            pulse: values.vital_pulse || undefined,
            temperature: values.vital_temperature || undefined,
            weight: values.vital_weight || undefined,
          }
        : null,
      tests: lineTests,
      items: lineItems,
      ...(acknowledge ? { acknowledge_warnings: true } : {}),
    }
  }

  const submit = async (values: Values, acknowledge = false) => {
    if (!values.doctor_id) { toast.error('Could not identify the logged-in doctor — please re-login and try again'); return }
    if (!values.patient_name.trim()) { toast.error('Patient name is required'); return }
    if (!values.items.some((it) => it.medicine_name.trim())) { toast.error('Add at least one medicine'); return }
    try {
      if (isEdit) {
        await update.mutateAsync({ id: prescriptionId!, body: buildPayload(values, acknowledge) as any })
        toast.success('Prescription updated')
      } else {
        await create.mutateAsync(buildPayload(values, acknowledge) as any)
        toast.success('Prescription created')
      }
      navigate({ to: BACK })
    } catch (err: any) {
      if (gate.handleError(err)) return // 422 gate — dialog now open
      toast.error(err?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} prescription`)
    }
  }

  const retryWithAck = async () => {
    // Re-run the last submit with acknowledge_warnings — values are read
    // straight from the form via handleSubmit.
    await handleSubmit((values) => submit(values, true))()
  }

  const isSaving = isEdit ? update.isPending : create.isPending

  if (isEdit && loadingRx) {
    return (
      <>
        <AppHeader fixed />
        <Main className="flex flex-1 items-center justify-center text-muted-foreground">Loading prescription…</Main>
      </>
    )
  }

  return (
    <>
      <AppHeader fixed />
      <Main className="flex flex-1 flex-col gap-6">
        <form onSubmit={handleSubmit((v) => submit(v))} className="space-y-5 w-full max-w-[1200px] mx-auto px-4">
          <div className="flex items-center gap-4 mb-2">
            <Button type="button" variant="ghost" size="icon" onClick={() => navigate({ to: BACK })}><ArrowLeft className="h-5 w-5" /></Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {isEdit ? `Edit Prescription${existingRx?.prescription_no ? ` — ${existingRx.prescription_no}` : ''}` : 'New Prescription'}
              </h1>
              <p className="text-muted-foreground text-sm">Full clinical record — patient, examination, diagnosis, tests and medicines</p>
            </div>
            {isEdit && (
              <Link to="/dashboard/prescriptions/$id/print" params={{ id: String(prescriptionId) }}>
                <Button type="button" variant="outline"><Printer className="h-4 w-4 mr-2" />Print</Button>
              </Link>
            )}
          </div>

          {/* ── Patient ─────────────────────────────────────────────── */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><Stethoscope className="w-4 h-4 text-white" /></div>
                <div>
                  <CardTitle className="text-lg font-bold">Doctor & Patient</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Pick a registered patient (allergies checked) or enter a walk-in</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Registered patient</label>
                  <PatientPicker patient={patient} onSelect={onPickPatient} />
                  {patient?.allergies && patient.allergies.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-xs text-red-600 font-medium">Allergies:</span>
                      {patient.allergies.map((a) => <Badge key={a} variant="destructive" className="text-[10px]">{a}</Badge>)}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Patient Name</label>
                  <Controller control={control} name="patient_name" render={({ field }) => (
                    <Input placeholder="Full name" {...field} />
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Age</label>
                  <div className="flex gap-2">
                    <Controller control={control} name="patient_age" render={({ field }) => (
                      <Input type="number" min="0" placeholder="Years" {...field} />
                    )} />
                    <Controller control={control} name="patient_age_months" render={({ field }) => (
                      <Input type="number" min="0" max="11" placeholder="Months" {...field} />
                    )} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sex</label>
                  <Controller control={control} name="patient_sex" render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {SEX_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Controller control={control} name="patient_phone" render={({ field }) => (
                    <Input placeholder="Optional" {...field} />
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Clinical record ─────────────────────────────────────── */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg"><ClipboardList className="w-4 h-4 text-white" /></div>
                <div>
                  <CardTitle className="text-lg font-bold">Clinical Record</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Complaints, examination, history, diagnosis and advice</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Chief Complaints</label>
                    <Controller control={control} name="chief_complaints" render={({ field }) => (
                      <QuickPhrasePicker options={phrasesFor('chief_complaints')} onPick={(p) => field.onChange(appendPhrase(field.value, p))} />
                    )} />
                  </div>
                  <Controller control={control} name="chief_complaints" render={({ field }) => (
                    <Textarea placeholder="e.g. Fever, cough for 3 days" {...field} />
                  )} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">On Examination (O/E)</label>
                    <Controller control={control} name="on_examination" render={({ field }) => (
                      <QuickPhrasePicker options={phrasesFor('on_examination')} onPick={(p) => field.onChange(appendPhrase(field.value, p))} />
                    )} />
                  </div>
                  <Controller control={control} name="on_examination" render={({ field }) => (
                    <Textarea placeholder="Findings on examination" {...field} />
                  )} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">History</label>
                    <Controller control={control} name="history_notes" render={({ field }) => (
                      <QuickPhrasePicker options={phrasesFor('history')} onPick={(p) => field.onChange(appendPhrase(field.value, p))} />
                    )} />
                  </div>
                  <Controller control={control} name="history_notes" render={({ field }) => (
                    <Textarea placeholder="Presenting / past history" {...field} />
                  )} />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide pt-3 border-t border-dashed">
                <Activity className="h-3.5 w-3.5" /> Vitals
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">BP</label>
                  <Controller control={control} name="vital_bp" render={({ field }) => (
                    <Input placeholder="120/80" {...field} />
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pulse</label>
                  <Controller control={control} name="vital_pulse" render={({ field }) => (
                    <Input placeholder="78/min" {...field} />
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Temperature</label>
                  <Controller control={control} name="vital_temperature" render={({ field }) => (
                    <Input placeholder="98.6°F" {...field} />
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Weight</label>
                  <Controller control={control} name="vital_weight" render={({ field }) => (
                    <Input placeholder="70kg" {...field} />
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Follow-up Date</label>
                  <Controller control={control} name="follow_up_date" render={({ field }) => (
                    <DateField value={field.value} onChange={field.onChange} placeholder="Next visit" className="w-full" />
                  )} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-dashed">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Diagnosis</label>
                    <Controller control={control} name="diagnosis" render={({ field }) => (
                      <QuickPhrasePicker options={phrasesFor('diagnosis')} onPick={(p) => field.onChange(appendPhrase(field.value, p))} />
                    )} />
                  </div>
                  <Controller control={control} name="diagnosis" render={({ field }) => (
                    <Textarea placeholder="Clinical diagnosis" {...field} />
                  )} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">ICD-10 Code</label>
                  <Controller control={control} name="icd_code" render={({ field }) => (
                    <Input placeholder="e.g. J06.9" {...field} />
                  )} />
                  <Controller control={control} name="icd_description" render={({ field }) => (
                    <Input placeholder="ICD description (optional)" className="mt-2" {...field} />
                  )} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Advice</label>
                    <Controller control={control} name="advice" render={({ field }) => (
                      <QuickPhrasePicker options={phrasesFor('advice')} onPick={(p) => field.onChange(appendPhrase(field.value, p))} />
                    )} />
                  </div>
                  <Controller control={control} name="advice" render={({ field }) => (
                    <Textarea placeholder="Advice / instructions to patient" {...field} />
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Advised tests ───────────────────────────────────────── */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-sky-500 rounded-lg shadow-lg"><FlaskConical className="w-4 h-4 text-white" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold">Advised Tests</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Investigations to perform — pick from the lab list or type freely</p>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => testArray.append({ ...emptyTest })}>
                  <Plus className="h-4 w-4 mr-1" /> Add Test
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {testArray.fields.length === 0 && (
                <p className="text-sm text-muted-foreground">No tests advised.</p>
              )}
              {testArray.fields.map((f, idx) => (
                <div key={f.id} className="grid grid-cols-1 md:grid-cols-[220px_1fr_2fr_auto] gap-2 items-center border-b pb-3 last:border-b-0 last:pb-0">
                  <Controller control={control} name={`tests.${idx}.test_id`} render={({ field }) => (
                    <TestPicker
                      value={field.value ? { id: field.value, name: '' } : null}
                      onSelect={(t) => {
                        field.onChange(t?.id ?? null)
                        if (t) setValue(`tests.${idx}.test_name`, t.name)
                      }}
                    />
                  )} />
                  <Controller control={control} name={`tests.${idx}.test_name`} render={({ field }) => (
                    <Input placeholder="Test name" {...field} />
                  )} />
                  <Controller control={control} name={`tests.${idx}.note`} render={({ field }) => (
                    <Input placeholder="Note (e.g. fasting, urgent)" {...field} />
                  )} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => testArray.remove(idx)}>
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── Medicines ───────────────────────────────────────────── */}
          <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 shrink-0 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg">
                    <span className="text-white font-serif italic text-xl leading-none select-none">℞</span>
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Medicines (Rx)</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Pick from the medicine list — generics enable interaction warnings</p>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => itemArray.append({ ...emptyItem })}>
                  <Plus className="h-4 w-4 mr-1" /> Add Medicine
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {itemArray.fields.map((f, idx) => {
                const collapsed = collapsedMedicineIds.has(f.id)
                const rowValues = watchedItems?.[idx]
                const summaryBits = [rowValues?.dosage, rowValues?.frequency, rowValues?.duration, rowValues?.route].filter(Boolean)
                return (
                  <div key={f.id} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/40">
                      <div className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                        {idx + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleMedicineCollapsed(f.id)}
                        className="flex-1 min-w-0 flex items-baseline gap-2 text-left"
                      >
                        {rowValues?.form && (
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                            {abbreviateForm(rowValues.form)}
                          </span>
                        )}
                        <span className="font-medium text-sm truncate">{rowValues?.medicine_name || 'New medicine'}</span>
                        {collapsed && summaryBits.length > 0 && (
                          <span className="text-xs text-muted-foreground truncate">— {summaryBits.join(' · ')}</span>
                        )}
                        {collapsed && rowValues?.generic_name && (
                          <span className="text-xs italic text-muted-foreground shrink-0">({rowValues.generic_name})</span>
                        )}
                      </button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => toggleMedicineCollapsed(f.id)}>
                        {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </Button>
                      <Button
                        type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                        onClick={() => itemArray.remove(idx)} disabled={itemArray.fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </div>

                    {!collapsed && (
                      <div className="p-3 space-y-3 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-[minmax(200px,280px)_1fr_110px] gap-3 items-end">
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">From list</label>
                            <Controller control={control} name={`items.${idx}.medicine_master_id`} render={() => (
                              <MedicinePicker
                                value={null}
                                onSelect={(med) => onPickMedicine(idx, med)}
                              />
                            )} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Medicine (editable)</label>
                            <Controller control={control} name={`items.${idx}.medicine_name`} render={({ field }) => (
                              <Input placeholder="Medicine name & strength" {...field} />
                            )} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Form</label>
                            <Controller control={control} name={`items.${idx}.form`} render={({ field }) => (
                              <Input placeholder="Tab / Cap / Sus…" {...field} />
                            )} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-muted-foreground">Dosage</label>
                              <Controller control={control} name={`items.${idx}.dosage`} render={({ field }) => (
                                <QuickPhrasePicker options={phrasesFor('dosage')} onPick={(p) => field.onChange(p)} />
                              )} />
                            </div>
                            <Controller control={control} name={`items.${idx}.dosage`} render={({ field }) => (
                              <Input placeholder="1+0+1" {...field} />
                            )} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-muted-foreground">Frequency</label>
                              <Controller control={control} name={`items.${idx}.frequency`} render={({ field }) => (
                                <QuickPhrasePicker options={phrasesFor('frequency')} onPick={(p) => field.onChange(p)} />
                              )} />
                            </div>
                            <Controller control={control} name={`items.${idx}.frequency`} render={({ field }) => (
                              <Input placeholder="TDS" {...field} />
                            )} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-muted-foreground">Duration</label>
                              <Controller control={control} name={`items.${idx}.duration`} render={({ field }) => (
                                <QuickPhrasePicker options={phrasesFor('duration')} onPick={(p) => field.onChange(p)} />
                              )} />
                            </div>
                            <Controller control={control} name={`items.${idx}.duration`} render={({ field }) => (
                              <Input placeholder="7 days" {...field} />
                            )} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-muted-foreground">Route</label>
                              <Controller control={control} name={`items.${idx}.route`} render={({ field }) => (
                                <QuickPhrasePicker options={phrasesFor('route')} onPick={(p) => field.onChange(p)} />
                              )} />
                            </div>
                            <Controller control={control} name={`items.${idx}.route`} render={({ field }) => (
                              <Input placeholder="Oral" {...field} />
                            )} />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between h-6">
                              <label className="text-xs text-muted-foreground">Generic</label>
                            </div>
                            <Controller control={control} name={`items.${idx}.generic_name`} render={({ field }) => (
                              <Input placeholder="e.g. Paracetamol (enables warnings)" {...field} />
                            )} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between h-6">
                              <label className="text-xs text-muted-foreground">Instructions</label>
                              <Controller control={control} name={`items.${idx}.instructions`} render={({ field }) => (
                                <QuickPhrasePicker options={phrasesFor('instructions')} onPick={(p) => field.onChange(p)} />
                              )} />
                            </div>
                            <Controller control={control} name={`items.${idx}.instructions`} render={({ field }) => (
                              <Input placeholder="After meal" {...field} />
                            )} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between h-6">
                              <label className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquareText className="h-3 w-3" /> Local language</label>
                              <Controller control={control} name={`items.${idx}.instructions_local`} render={({ field }) => (
                                <QuickPhrasePicker options={phrasesFor('instructions_local')} onPick={(p) => field.onChange(p)} />
                              )} />
                            </div>
                            <Controller control={control} name={`items.${idx}.instructions_local`} render={({ field }) => (
                              <Input placeholder="খাবারের পরে খাবেন" {...field} />
                            )} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* ── Warnings + save ─────────────────────────────────────── */}
          <InteractionWarnings generics={generics} patientId={patient?.id ?? null} />

          <div className="flex items-center justify-end gap-3 pb-10">
            <Button type="button" variant="outline" size="lg" onClick={() => navigate({ to: BACK })} disabled={isSaving}>Cancel</Button>
            <Button type="submit" size="lg" disabled={isSaving} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[200px]">
              {isSaving ? 'Saving…' : isEdit ? 'Update Prescription' : 'Save Prescription'}
            </Button>
          </div>
        </form>
      </Main>

      <AcknowledgeWarningsDialog
        open={gate.isGateOpen}
        warnings={gate.pendingWarnings}
        pending={isSaving}
        onAcknowledge={retryWithAck}
        onCancel={gate.closeGate}
      />
    </>
  )
}
