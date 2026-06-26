import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { AppHeader } from "@/components/layout/app-header";
import { Main } from "@/components/layout/main";
import HospitalInvoiceForm from '@/features/invoices/HospitalInvoiceForm';

import { ArrowLeft, CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_authenticated/dashboard/outdoor/reception/invoices/create/')({
  component: CreateInvoice,
})

function CreateInvoice() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  return (
    <>
      <AppHeader fixed />

      <Main className="flex flex-1 flex-col gap-6">
        <div className="space-y-5 w-full min-w-[650px] max-w-[950px] mx-auto px-4">
          {/* Header Section */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4 pb-4 border-b">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => navigate({ to: '/dashboard/outdoor/reception/invoices/list' })}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  Create Outdoor Invoice
                </h1>
                <p className="text-muted-foreground text-sm">Generate a new medical invoice for outpatient services</p>
              </div>
            </div>
            <Button
              type="submit"
              form="hospital-invoice-form"
              disabled={submitting}
              className="min-w-[180px]"
            >
              <CircleCheck className="size-4" />
              {submitting ? "Creating..." : "Create Invoice"}
            </Button>
          </div>

          <HospitalInvoiceForm onSubmittingChange={setSubmitting} />
        </div>
      </Main>
    </>
  )
}
