
import ListOfTests from '@/components/ListOfTests'
import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/_authenticated/outdoor/master/tests/')({
    component: ListOfTests,
})


