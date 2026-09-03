import { createFileRoute } from '@tanstack/react-router'
import { TransactionVoucherPrint } from '@/components/accounting/TransactionVoucherPrint'

export const Route = createFileRoute(
    '/_authenticated/dashboard/accounting/income/$incomeId/print',
)({
    component: IncomeVoucherPrintPage,
})

function IncomeVoucherPrintPage() {
    const { incomeId } = Route.useParams()
    return (
        <TransactionVoucherPrint
            type="income"
            id={incomeId}
            backTo="/dashboard/accounting/income"
        />
    )
}
