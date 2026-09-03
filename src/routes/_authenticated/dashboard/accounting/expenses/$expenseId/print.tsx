import { createFileRoute } from '@tanstack/react-router'
import { TransactionVoucherPrint } from '@/components/accounting/TransactionVoucherPrint'

export const Route = createFileRoute(
    '/_authenticated/dashboard/accounting/expenses/$expenseId/print',
)({
    component: ExpenseVoucherPrintPage,
})

function ExpenseVoucherPrintPage() {
    const { expenseId } = Route.useParams()
    return (
        <TransactionVoucherPrint
            type="expense"
            id={expenseId}
            backTo="/dashboard/accounting/expenses"
        />
    )
}
