import { createFileRoute } from '@tanstack/react-router'
import ProductDetails from '@/features/products/components/ProductDetails'

export const Route = createFileRoute('/_authenticated/products/$productId/')({
    component: ProductDetails,
})
