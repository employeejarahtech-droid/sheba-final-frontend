import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { AppHeader } from '@/components/layout/app-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getCookie } from '@/lib/cookies'
import { ArrowLeft, Receipt, StickyNote } from 'lucide-react'

export const Route = createFileRoute(
  '/_authenticated/dashboard/outdoor/reception/invoices/$invoiceId/note',
)({
  component: AddNotePage,
})

function AddNotePage() {
  const { invoiceId } = Route.useParams()
  const navigate = useNavigate()
  const token = getCookie('accessToken')
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')

  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ['outdoor-invoice', invoiceId],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to fetch invoice')
      return response.json()
    },
  })

  useEffect(() => {
    if (invoiceData?.data?.note) {
      setNote(invoiceData.data.note)
    }
  }, [invoiceData])

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/outdoor-invoice/${invoiceId}/note`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note }),
      })
      if (!response.ok) throw new Error('Failed to update note')
      return response.json()
    },
    onSuccess: () => {
      toast.success('Note updated successfully')
      queryClient.invalidateQueries({ queryKey: ['outdoor-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['outdoor-invoice', invoiceId] })
      navigate({ to: '/dashboard/outdoor/reception/patients-by-referrer' })
    },
    onError: () => {
      toast.error('Failed to update note')
    },
  })

  return (
    <>
      <AppHeader fixed />
      <Main className="flex flex-1 flex-col gap-6">
        <div className="w-full max-w-4xl mx-auto px-4 space-y-5">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Add Note
                </h1>
                <p className="text-muted-foreground text-sm">
                  Add or update a note for this invoice
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Invoice Details */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                    <Receipt className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Invoice Details</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Patient and invoice reference</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Patient Name</p>
                      <p className="font-medium">{invoiceData?.data?.patient_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Invoice ID</p>
                      <p className="font-medium">{invoiceData?.data?.invoice_prefix || invoiceData?.data?.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{invoiceData?.data?.phone || '-'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Note */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                    <StickyNote className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Note</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Visible to staff reviewing this invoice</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    mutation.mutate()
                  }}
                >
                  <div className="mb-4">
                    <Textarea
                      placeholder="Type your note here..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={8}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => window.history.back()}
                      disabled={mutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={mutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[150px]"
                    >
                      {mutation.isPending ? 'Saving...' : 'Save Note'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}
