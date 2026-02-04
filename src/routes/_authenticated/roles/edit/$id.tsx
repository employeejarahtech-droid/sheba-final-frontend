import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/roles/edit/$id')({
    component: EditRoleComponent,
})

function EditRoleComponent() {
    const { id } = Route.useParams()
    return (
        <div className='p-6'>
            <h1 className='text-2xl font-bold'>Edit Role: {id}</h1>
            <p className='text-muted-foreground'>This is a placeholder for the Edit Role page.</p>
        </div>
    )
}
