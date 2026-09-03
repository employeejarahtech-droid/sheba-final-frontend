import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Pencil, Printer } from 'lucide-react'
import { usePrescriptionQuery } from '@/features/prescriptions/prescriptionsQueries'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { useDateFormat } from '@/hooks/use-date-format'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated/dashboard/prescriptions/$id/print')({
  component: PrescriptionPrintPage,
})

function ageFromDob(dob?: string | null): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age < 0 ? null : age
}

const doctorLabel = (name?: string | null) => {
  if (!name) return 'Doctor'
  return /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`
}

/** Full dosage-form names (as stored on the rx_medicines master) to the
 *  short form written on a prescription pad. */
const FORM_ABBREVIATIONS: Record<string, string> = {
  Tablet: 'Tab', Capsule: 'Cap', Suspension: 'Sus', Syrup: 'Syr',
  Injection: 'Inj', Ointment: 'Oint', Drops: 'Drop', Cream: 'Cream',
  Sachet: 'Sachet', Inhaler: 'Inhaler', Gel: 'Gel', Lotion: 'Lotion',
}
const abbreviateForm = (form?: string | null) => (form ? FORM_ABBREVIATIONS[form] || form : '')

/** One clinical field in the left (35%) column: label above, content below —
 *  mirrors a pre-printed pad's "Chief Complaints / On Examination /
 *  Investigation" left-hand labels, stacked for a narrow column. */
function ClinicalRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 text-sm">
      <div className="text-xs font-semibold text-blue-900 dark:text-blue-300">{label}</div>
      <div className="whitespace-pre-wrap mt-0.5">{children}</div>
    </div>
  )
}

function PrescriptionPrintPage() {
  const { id } = Route.useParams()
  const { formatDate } = useDateFormat()
  const { data: rx, isLoading } = usePrescriptionQuery(id)
  const currentUser = useAuthStore((state) => state.user)

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>
  }
  if (!rx) {
    return <div className="min-h-screen flex items-center justify-center text-rose-500">Prescription not found</div>
  }

  const items = rx.items || []
  const tests = rx.tests || []
  const vitals = rx.vitals || {}
  const hasVitals = vitals.bp || vitals.pulse || vitals.temperature || vitals.weight
  const patient = rx.patient
  const age = rx.patient_age ?? ageFromDob(patient?.dob)
  // age_text carries the more precise "Xy Ym" / "Ym" form (set whenever the
  // prescription has a months component) — prefer it over the bare years
  // figure so a partial-year age isn't rounded away on the printout.
  const ageLabel = rx.age_text || (age != null ? `${age} yrs` : '')
  const allergies = patient?.allergies ?? []

  const clinicalRows: { label: string; content: React.ReactNode }[] = []
  if (rx.chief_complaints) clinicalRows.push({ label: 'Chief Complaints', content: rx.chief_complaints })
  if (rx.on_examination) clinicalRows.push({ label: 'On Examination (O/E)', content: rx.on_examination })
  if (rx.history_notes) clinicalRows.push({ label: 'History', content: rx.history_notes })
  if (tests.length > 0) {
    clinicalRows.push({
      label: 'Investigations Advised',
      content: (
        <ol className="list-decimal list-inside space-y-0.5">
          {tests.map((t, idx) => (
            <li key={idx}>
              {t.test_name}
              {t.note && <span className="text-muted-foreground text-xs"> — {t.note}</span>}
            </li>
          ))}
        </ol>
      ),
    })
  }
  if (rx.diagnosis) {
    clinicalRows.push({
      label: 'Diagnosis',
      content: (
        <>
          {rx.diagnosis}
          {rx.icd_code && (
            <span className="ml-2 font-mono text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
              ICD-10: {rx.icd_code}{rx.icd_description ? ` — ${rx.icd_description}` : ''}
            </span>
          )}
        </>
      ),
    })
  }

  return (
    <>
      <AppHeader fixed className="print:hidden" />
      <Main>
        <div className="max-w-3xl w-full mx-auto bg-background pb-10 px-5 mt-6 print:mt-0 print:pb-0">
          <style>{`
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print { display: none !important; }
              .letterhead-space { border: none !important; }
            }
            @page { margin: 12mm; size: A4 portrait; }
          `}</style>

          <div className="print:hidden flex items-center justify-between gap-4 mb-6">
            <Link to="/dashboard/prescriptions">
              <Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
            </Link>
            <div className="flex items-center gap-2">
              {rx.status !== 'cancelled' && (
                <Link to="/dashboard/prescriptions/edit/$id" params={{ id: String(rx.id) }}>
                  <Button variant="outline" size="sm"><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                </Link>
              )}
              <Button size="sm" onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                <Printer className="mr-2 h-4 w-4" />Print
              </Button>
            </div>
          </div>

          <div>
            {/* ── Letterhead space — intentionally blank ──────────────────
                Meant to be printed on the clinic's own pre-printed letterhead
                stationery (logo, doctor name/credentials, chamber details are
                already on the paper); the app only reserves the space so the
                content below lines up under it. */}
            <div className="letterhead-space h-[120px] border-b-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center print:h-[120px]">
              <span className="no-print text-xs text-muted-foreground italic">Letterhead space — printed on pre-printed clinic stationery</span>
            </div>

            {/* ── Per-document strip: patient / date / Rx no ──────────── */}
            <div className="flex flex-wrap items-center justify-between gap-y-1 px-5 py-2.5 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-300 dark:border-gray-700 text-sm">
              <span><span className="text-muted-foreground">Patient Name:</span> <span className="font-medium">{rx.patient_name}</span></span>
              <span><span className="text-muted-foreground">Age / Sex:</span> <span className="font-medium">{ageLabel || '-'}{rx.patient_sex ? ` / ${rx.patient_sex}` : ''}</span></span>
              <span><span className="text-muted-foreground">Date:</span> <span className="font-medium">{formatDate(new Date(rx.created_at || Date.now()))}</span></span>
            </div>

            <div className="p-6">
              <div className="flex gap-5">
                {/* ── Left column (35%): visit info + clinical notes ── */}
                <div className="w-[35%] shrink-0 border-r border-gray-300 dark:border-gray-700 pr-5">
                  <p className="text-sm mb-3"><span className="text-muted-foreground">Rx No:</span> <span className="font-mono font-semibold">{rx.prescription_no || `#${rx.id}`}</span></p>

                  {allergies.length > 0 && (
                    <p className="font-semibold text-red-600 dark:text-red-400 text-sm mb-3">
                      ⚠ Allergies: {allergies.join(', ')}
                    </p>
                  )}

                  {hasVitals && (
                    <div className="flex flex-col gap-0.5 text-sm mb-4 pb-3 border-b border-dashed">
                      {vitals.bp && <span><span className="text-muted-foreground">BP:</span> {vitals.bp}</span>}
                      {vitals.pulse && <span><span className="text-muted-foreground">Pulse:</span> {vitals.pulse}</span>}
                      {vitals.temperature && <span><span className="text-muted-foreground">Temp:</span> {vitals.temperature}</span>}
                      {vitals.weight && <span><span className="text-muted-foreground">Weight:</span> {vitals.weight}</span>}
                    </div>
                  )}

                  {clinicalRows.map((row) => (
                    <ClinicalRow key={row.label} label={row.label}>{row.content}</ClinicalRow>
                  ))}
                </div>

                {/* ── Right column (65%): Rx, advice, follow-up, signature ── */}
                <div className="w-[65%]">
                  <div className="flex gap-4 mb-5">
                    <div className="text-5xl font-serif italic leading-none text-blue-800 dark:text-blue-400 select-none">℞</div>
                    <div className="flex-1 border-l-2 border-gray-300 dark:border-gray-600 pl-4 pt-1 space-y-3.5">
                      {items.length === 0 && <p className="text-sm text-muted-foreground">No medicines prescribed.</p>}
                      {items.map((it, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="font-semibold">
                            {idx + 1}. {it.form && `${abbreviateForm(it.form)}. `}{it.medicine_name}
                            {it.generic_name && <span className="font-normal italic text-muted-foreground text-xs"> ({it.generic_name})</span>}
                          </div>
                          <div className="text-muted-foreground pl-4">
                            {[it.dosage, it.frequency, it.duration, it.route].filter(Boolean).join('  —  ') || '—'}
                          </div>
                          {(it.instructions || it.instructions_local) && (
                            <div className="text-xs italic pl-4 mt-0.5">
                              {[it.instructions, it.instructions_local].filter(Boolean).join(' · ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {rx.advice && (
                    <div className="mb-3 text-sm">
                      <span className="text-muted-foreground font-semibold">Advice:</span>
                      <div className="whitespace-pre-wrap mt-0.5">{rx.advice}</div>
                    </div>
                  )}
                  {rx.follow_up_date && (
                    <div className="mb-4">
                      <span className="inline-block border border-gray-400 dark:border-gray-600 rounded px-3 py-1.5 text-sm">
                        <span className="text-muted-foreground">Next Visit:</span>{' '}
                        <span className="font-semibold">{formatDate(new Date(rx.follow_up_date))}</span>
                      </span>
                    </div>
                  )}

                  <div className="flex justify-end mt-12">
                    <div className="text-center">
                      <div className="border-t border-gray-500 pt-1 px-10 text-sm font-medium">
                        {doctorLabel(currentUser?.name || rx.doctor?.name)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Signature</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}
