import { createFileRoute, Link } from '@tanstack/react-router'
import { Loader2, ShieldAlert, Eye, FileText } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePatientQuery, usePatientHistoryQuery } from '@/features/prescriptions/patientsQueries'

export const Route = createFileRoute('/_authenticated/dashboard/prescriptions/patients/$id/')({
  component: PatientProfilePage,
})

function PatientProfilePage() {
  const { id } = Route.useParams()
  const { data: patient, isLoading } = usePatientQuery(id)
  const { data: history, isFetching: historyLoading } = usePatientHistoryQuery(id)

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    )
  }
  if (!patient) return <div className="p-6 text-center text-rose-500">Patient not found.</div>

  const rows: [string, string | undefined | null][] = [
    ['Patient No', patient.patient_no || '—'],
    ['Age', patient.age_years != null ? `${patient.age_years} years` : patient.age_text || '—'],
    ['Sex', patient.sex || '—'],
    ['Date of birth', patient.dob || '—'],
    ['Blood group', patient.blood_group || '—'],
    ['Phone', patient.phone || '—'],
    ['Email', patient.email || '—'],
    ['Address', patient.address || '—'],
    ['Emergency contact', [patient.emergency_contact_name, patient.emergency_contact_phone].filter(Boolean).join(' · ') || '—'],
    ['Registered', patient.created_at ? new Date(patient.created_at).toLocaleString() : '—'],
  ]

  return (
    <>
      <AppHeader fixed />
      <Main className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{patient.name}</h1>
            <p className="text-sm text-muted-foreground">
              {patient.patient_no ? `${patient.patient_no} · ` : ''}
              {patient.age_years != null ? `${patient.age_years}y` : patient.age_text || ''}
              {patient.sex ? ` · ${patient.sex}` : ''}
              {patient.phone ? ` · ${patient.phone}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard/prescriptions/patients/edit/$id" params={{ id }}>
              <Button variant="outline">Edit Patient</Button>
            </Link>
            <Link to="/dashboard/prescriptions/create">
              <Button>New Prescription</Button>
            </Link>
          </div>
        </div>

        {(patient.allergies ?? []).length > 0 && (
          <Card className="border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40">
            <CardContent className="flex flex-wrap items-center gap-2 p-4">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <span className="text-sm font-semibold text-red-700 dark:text-red-300">Known allergies:</span>
              {patient.allergies!.map((a) => (
                <Badge key={a} variant="destructive">{a}</Badge>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-1 h-fit">
            <CardHeader className="border-b py-3"><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <tbody>
                  {rows.map(([k, v]) => (
                    <tr key={k} className="border-b last:border-b-0">
                      <td className="px-4 py-2 text-muted-foreground w-[45%]">{k}</td>
                      <td className="px-4 py-2 font-medium break-words">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(patient.chronic_conditions ?? []).length > 0 && (
                <div className="border-t px-4 py-3 space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Chronic conditions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {patient.chronic_conditions!.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
                  </div>
                </div>
              )}
              {patient.notes && (
                <div className="border-t px-4 py-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{patient.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="border-b py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" /> Prescription History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {historyLoading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : (history?.rows ?? []).length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No prescriptions recorded yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                      <th className="px-4 py-2">Rx No</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Doctor</th>
                      <th className="px-4 py-2">Diagnosis</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(history?.rows ?? []).map((rx) => (
                      <tr key={rx.id} className="border-b last:border-b-0 hover:bg-muted/30">
                        <td className="px-4 py-2 font-mono text-xs">{rx.prescription_no ?? `#${rx.id}`}</td>
                        <td className="px-4 py-2">{rx.created_at ? new Date(rx.created_at).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-2">{rx.doctor?.name ?? '—'}</td>
                        <td className="px-4 py-2 max-w-[220px] truncate">{rx.diagnosis || '—'}</td>
                        <td className="px-4 py-2">
                          <Badge variant={rx.status === 'active' ? 'default' : 'secondary'} className="capitalize">{rx.status}</Badge>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Link
                            to="/dashboard/prescriptions/$id/print"
                            params={{ id: String(rx.id) }}
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
