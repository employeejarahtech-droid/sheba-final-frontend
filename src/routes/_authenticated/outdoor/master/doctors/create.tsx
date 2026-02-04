import CreateDoctorPage from '@/features/doctors/CreateDoctorPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/outdoor/master/doctors/create')({
    component: CreateDoctorPage,
})
