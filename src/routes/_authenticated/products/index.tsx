import { createFileRoute } from '@tanstack/react-router'
import ProductList from '@/features/products/components/ProductList'

export const Route = createFileRoute('/_authenticated/products/')({
    component: ProductList,
})
