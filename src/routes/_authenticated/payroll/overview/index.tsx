import HrPayrollOverview from '@/components/payroll/Overview'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/payroll/overview/')({
    component: HrPayrollOverview,
})

