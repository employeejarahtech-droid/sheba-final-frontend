import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import HospitalInvoiceForm from '@/features/invoices/HospitalInvoiceForm';

import { ArrowLeft, CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_authenticated/outdoor/reception/invoices/create/')({
  component: CreateInvoice,
})

const topNav = [
  {
    title: 'Overview',
    href: 'dashboard/overview',
    isActive: true,
    disabled: false,
  },
]

function CreateInvoice() {
  const navigate = useNavigate();

  return (
    <>
      <Header fixed>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="p-6 lg:p-10 w-full flex-1">
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Create Outdoor Invoice
              </h1>
              <p className="text-muted-foreground mt-2">Generate a new medical invoice for outpatient services</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="flex items-center gap-2 h-10 px-4 rounded-xl border-gray-200 dark:border-gray-800 transition-all hover:bg-gray-50 bg-white"
                onClick={() => navigate({ to: "/outdoor/reception/invoices/list" })}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to List</span>
              </Button>
              <Button
                type="submit"
                form="hospital-invoice-form"
                className="flex items-center gap-2 h-10 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/40 active:translate-y-0"
              >
                <CircleCheck className="h-5 w-5" />
                <span>Create Invoice</span>
              </Button>
            </div>
          </div>

          <HospitalInvoiceForm />
        </div>
      </Main>
    </>
  )
}
