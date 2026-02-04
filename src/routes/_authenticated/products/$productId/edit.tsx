import { createFileRoute } from '@tanstack/react-router'
import EditProductForm from '@/features/products/components/EditProductForm'

export const Route = createFileRoute('/_authenticated/products/$productId/edit')({
    component: EditProductPage,
})

function EditProductPage() {
    const { productId } = Route.useParams()
    return <EditProductForm productId={Number(productId)} />
}
