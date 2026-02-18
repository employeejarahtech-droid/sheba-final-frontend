import ListOfTests from '@/components/ListOfTests'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const testsSearchSchema = z.object({
    page: z.coerce.number().catch(1),
    limit: z.coerce.number().catch(10),
    search: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/outdoor/master/tests/')({
    validateSearch: (search) => testsSearchSchema.parse(search),
    component: ListOfTests,
})


