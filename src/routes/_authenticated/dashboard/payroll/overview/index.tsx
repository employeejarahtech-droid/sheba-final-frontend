import HrPayrollOverview from '@/components/payroll/Overview'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard/payroll/overview/')({
    component: HrPayrollOverview,
})

