import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/components/layout/page-header'
import { Main } from '@/components/layout/main'
import { AppHeader } from '@/components/layout/app-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getCookie } from '@/lib/cookies'

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
      <Main>
        <div className='mb-6 flex items-center justify-between'>
          <PageHeader
            title='Add Note'
            description='Add or update a note for this invoice'
          />
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                <div className='space-y-4'>
                  <div>
                    <p className='text-sm text-gray-500'>Patient Name</p>
                    <p className='font-medium'>{invoiceData?.data?.patient_name}</p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Invoice ID</p>
                    <p className='font-medium'>{invoiceData?.data?.invoice_prefix || invoiceData?.data?.id}</p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Phone</p>
                    <p className='font-medium'>{invoiceData?.data?.phone || '-'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Note</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  mutation.mutate()
                }}
              >
                <div className='mb-4'>
                  <Textarea
                    placeholder='Type your note here...'
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={8}
                    className='w-full'
                  />
                </div>
                <div className='flex justify-end gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => window.history.back()}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' disabled={mutation.isPending}>
                    {mutation.isPending ? 'Saving...' : 'Save Note'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
