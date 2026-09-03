import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useInteractionCheckQuery } from '@/features/prescriptions/prescriptionsQueries'
import type { InteractionCheckResult, InteractionWarning } from '@/types/prescriptions.types'

const SEVERITY_STYLES: Record<string, string> = {
  contraindicated: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  severe: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  moderate: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  mild: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

const severityLabel = (s: string) =>
  s === 'contraindicated' ? 'Contraindicated' : s.charAt(0).toUpperCase() + s.slice(1)

/** True when the policy hard-blocks: contraindicated pair or any allergy hit. */
export const isBlocking = (result?: InteractionCheckResult | null) =>
  !!result && (
    result.interactions.some((i) => i.severity === 'contraindicated') || result.allergies.length > 0
  )

const hasAnyWarning = (result?: InteractionCheckResult | null) =>
  !!result && (result.interactions.length > 0 || result.allergies.length > 0)

interface InteractionWarningsProps {
  generics: string[]
  patientId?: number | null
  /** Notifies the parent whenever the blocking state flips. */
  onBlockingChange?: (blocking: boolean) => void
}

/** Live DDI + allergy banner shown above the save button while prescribing. */
export function InteractionWarnings({ generics, patientId, onBlockingChange }: InteractionWarningsProps) {
  const clean = useMemo(
    () => [...new Set(generics.map((g) => g?.trim()).filter(Boolean))],
    [generics]
  )
  const { data: result, isFetching } = useInteractionCheckQuery(clean, patientId)
  const blocking = isBlocking(result)

  useEffect(() => { onBlockingChange?.(blocking) }, [blocking, onBlockingChange])

  if (!hasAnyWarning(result)) {
    return clean.length >= 2 ? (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        {isFetching ? 'Checking interactions…' : 'No known interactions in the bundled dataset for this combination.'}
      </div>
    ) : null
  }

  return (
    <Alert
      variant="destructive"
      className={cn(
        'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40',
        !blocking && 'border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40'
      )}
    >
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle>
        {blocking
          ? 'Contraindicated combination or allergy conflict — acknowledgement required to save'
          : 'Interaction warnings for this prescription'}
      </AlertTitle>
      <AlertDescription className="space-y-1.5">
        {result!.allergies.map((w, i) => (
          <WarningRow
            key={`al-${i}`}
            title={`Allergy: ${w.generic ?? ''} conflicts with recorded allergy “${w.allergen}”`}
            warning={w}
          />
        ))}
        {result!.interactions.map((w, i) => (
          <WarningRow key={`ddi-${i}`} title={`${w.generic_a} + ${w.generic_b}`} warning={w} />
        ))}
      </AlertDescription>
    </Alert>
  )
}

function WarningRow({ title, warning }: { title: string; warning: InteractionWarning }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Badge className={cn('shrink-0 text-[10px]', SEVERITY_STYLES[warning.severity] ?? SEVERITY_STYLES.mild)}>
        {severityLabel(warning.severity)}
      </Badge>
      <span className="font-medium">{title}</span>
      {warning.description && <span className="text-muted-foreground">— {warning.description}</span>}
    </div>
  )
}

interface AcknowledgeDialogProps {
  open: boolean
  warnings: InteractionCheckResult | null
  onAcknowledge: () => void
  onCancel: () => void
  pending?: boolean
}

/** Modal shown when the API gates the save with 422: lists the warnings and
 *  requires an explicit acknowledgement before resubmitting. */
export function AcknowledgeWarningsDialog({ open, warnings, onAcknowledge, onCancel, pending }: AcknowledgeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" /> Review before saving
          </DialogTitle>
          <DialogDescription>
            This prescription contains contraindicated interactions or allergy conflicts.
            Review the warnings, then acknowledge to save with an audit trail.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[320px] space-y-2 overflow-y-auto py-1">
          {warnings?.allergies?.map((w, i) => (
            <WarningRow key={`al-${i}`} title={`Allergy: ${w.generic ?? ''} ↔ “${w.allergen}”`} warning={w} />
          ))}
          {warnings?.interactions?.map((w, i) => (
            <WarningRow key={`ddi-${i}`} title={`${w.generic_a} + ${w.generic_b}`} warning={w} />
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>Go back</Button>
          <Button type="button" variant="destructive" onClick={onAcknowledge} disabled={pending}>
            {pending ? 'Saving…' : 'Acknowledge & save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Convenience hook for the 422 retry flow used by the create form. */
export function useAcknowledgeWarningsFlow() {
  const [pendingWarnings, setPendingWarnings] = useState<InteractionCheckResult | null>(null)

  /** Returns true when the error was a 422 warnings gate (dialog now open). */
  const handleError = (err: any): boolean => {
    const data = err?.response?.data
    if (err?.response?.status === 422 && data?.data?.interactions) {
      setPendingWarnings(data.data as InteractionCheckResult)
      return true
    }
    return false
  }

  return {
    pendingWarnings,
    isGateOpen: pendingWarnings !== null,
    openGate: setPendingWarnings,
    closeGate: () => setPendingWarnings(null),
    handleError,
  }
}
