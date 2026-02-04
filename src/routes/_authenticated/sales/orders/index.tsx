import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/sales/orders/')({
    component: SalesOrders,
})

function SalesOrders() {
    return <div>Hello "/_authenticated/sales/orders/"!</div>
}
