import Invoices from '@/features/invoices'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const patientsByReferrerSearchSchema = z.object({
    page: z.coerce.number().catch(1),
    limit: z.coerce.number().catch(10),
    search: z.string().catch(''),
    status: z.string().catch('all'),
    from: z.string().catch(''),
    to: z.string().catch(''),
    doctor_id: z.string().catch(''),
})

export const Route = createFileRoute(
    '/_authenticated/dashboard/outdoor/reception/patients-by-referrer/',
)({
    validateSearch: (search) => patientsByReferrerSearchSchema.parse(search),
    component: PatientsByReferrerPage,
})

function PatientsByReferrerPage() {
    const searchParams: any = Route.useSearch();
    const navigate = Route.useNavigate();

    const page = Number(searchParams?.page) || 1;
    const limit = Number(searchParams?.limit) || 10;
    const search = searchParams?.search || "";
    const statusFilter = searchParams?.status || "all";
    const from = searchParams?.from || "";
    const to = searchParams?.to || "";
    const doctorId = searchParams?.doctor_id || "";

    const setPage = (newPage: number) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
    };
    const setLimit = (newLimit: number) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
    };
    const setSearch = (newSearch: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, search: newSearch, page: 1 }) });
    };
    const setStatusFilter = (newStatus: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, status: newStatus, page: 1 }) });
    };
    const setFrom = (newFrom: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, from: newFrom, page: 1 }) });
    };
    const setTo = (newTo: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, to: newTo, page: 1 }) });
    };
    const setDoctorId = (newDoctorId: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, doctor_id: newDoctorId, page: 1 }) });
    };

    return (
        <Invoices
            page={page}
            limit={limit}
            search={search}
            statusFilter={statusFilter}
            from={from}
            to={to}
            setPage={setPage}
            setLimit={setLimit}
            setSearch={setSearch}
            setStatusFilter={setStatusFilter}
            setFrom={setFrom}
            setTo={setTo}
            doctorId={doctorId}
            setDoctorId={setDoctorId}
            showReferrerFilter
            tableTitle="Patients by Referrer"
        />
    )
}
