import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ConfigDrawer } from '@/components/config-drawer';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from '@/components/DataTable';
import { Plus } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/cookies';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const Route = createFileRoute('/_authenticated/indoor/master/services/')({
  component: ListOfServices,
})

type ClinicService = {
  id: number;
  name: string;
  price: number;
  description: string | null;
  status: 'Active' | 'Inactive';
  created_at: string;
};

function ListOfServices() {
  const navigate = useNavigate();
  const token = getCookie('accessToken');

  // Fetch services from API
  const { data: servicesData, isLoading, error } = useQuery({
    queryKey: ['clinic-services'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clinic-services`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Failed to fetch services');
      }

      return response.json();
    },
  });

  const services = servicesData?.data?.items || [];

  const columns: ColumnDef<ClinicService>[] = [
    {
      accessorKey: "name",
      header: "Service Name",
    },
    {
      accessorKey: "price",
      header: "Price (৳)",
      cell: ({ row }) => {
        const price = row.getValue("price") as number;
        return <span className="font-semibold">৳{price.toFixed(2)}</span>;
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string | null;
        return <span className="text-muted-foreground text-sm">{description || '-'}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge className={status === 'Active' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}>
            {status}
          </Badge>
        );
      },
    },
    // Actions Column
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;

        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate({ to: `/indoor/master/services/${item.id}` })}>
              View
            </Button>
            <Button size="sm" variant="default" onClick={() => navigate({ to: `/indoor/master/services/edit/${item.id}` })}>
              Edit
            </Button>
          </div>
        );
      },
    },
  ];

  return <>
    <Header fixed>
      <Search />
      <div className='ms-auto flex items-center space-x-4'>
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </div>
    </Header>

    <Main>
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">List of Services</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {(error as Error).message || 'Failed to load services. Please try again later.'}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading services...</div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={services}
          toolbarActions={
            <Button onClick={() => navigate({ to: '/indoor/master/services/create' })}>
              <Plus className="h-4 w-4" />
              Add New Service
            </Button>
          }
        />
      )}
    </Main>
  </>
}
