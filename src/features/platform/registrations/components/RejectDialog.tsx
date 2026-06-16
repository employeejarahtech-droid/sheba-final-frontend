/**
 * RejectDialog — AlertDialog for rejecting a registration with a reason
 *
 * Props: open, onOpenChange, registrationId, onRejected callback.
 * Shows a textarea for the rejection reason and calls useRejectRegistration().
 */

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useRejectRegistration } from '@/hooks/usePlatformAdmin'

interface RejectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registrationId: number | null
  onRejected?: () => void
}

export function RejectDialog({
  open,
  onOpenChange,
  registrationId,
  onRejected,
}: RejectDialogProps) {
  const [reason, setReason] = useState('')
  const rejectRegistration = useRejectRegistration()

  const handleReject = () => {
    if (!registrationId) return

    rejectRegistration.mutate(
      { id: registrationId, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          setReason('')
          onOpenChange(false)
          onRejected?.()
        },
      }
    )
  }

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setReason('')
    }
    onOpenChange(value)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject Registration</AlertDialogTitle>
          <AlertDialogDescription>
            Please provide a reason for rejecting this registration. The applicant
            may be notified of the reason.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="rejection-reason">Rejection Reason</Label>
          <Textarea
            id="rejection-reason"
            placeholder="Enter reason for rejection..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={rejectRegistration.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReject}
            disabled={rejectRegistration.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {rejectRegistration.isPending ? 'Rejecting...' : 'Confirm Rejection'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
