import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Customer {
    id: number;
    name: string;
    code?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
    tax_id?: string;
    website?: string;
    payment_terms?: string;
    notes?: string;
    thumb_url?: string;
    gallery_items?: string[];
    is_active: boolean;
    customer_type?: 'business' | 'individual'; // New field
    credit_limit?: number; // New field
    outstanding_balance?: number; // New field
    company?: string;
    sales_route_id?: number;
    created_at?: string;
    updated_at?: string;
}

export const useGetAllCustomersQuery = ({ page = 1, limit = 10, search = '' } = {}) => {
    return useQuery({
        queryKey: ['customers', { page, limit, search }],
        queryFn: async () => {
            const response = await window.electron.invoke('customers:getAll', { page, limit, search });
            return response;
        },
    });
};

export const useGetCustomerByIdQuery = (id: string | number) => {
    return useQuery({
        queryKey: ['customer', id],
        queryFn: async () => {
            const response = await window.electron.invoke('customers:getById', Number(id));
            return { data: response };
        },
        enabled: !!id,
    });
};

export const useAddCustomerMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await window.electron.invoke('customers:create', data);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
};

export const useUpdateCustomerMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, body }: { id: string | number; body: any }) => {
            const response = await window.electron.invoke('customers:update', { id: Number(id), data: body });
            return response;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customer', variables.id] });
        },
    });
};

export const useDeleteCustomerMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string | number) => {
            const response = await window.electron.invoke('customers:delete', Number(id));
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
};
