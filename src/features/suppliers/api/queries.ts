import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Supplier {
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
    gallery_items?: string;
    is_active: boolean;
    total_purchase_amount?: number;
    total_paid_amount?: number;
    total_due_amount?: number;
    created_at?: string;
    updated_at?: string;
}

export const useGetAllSuppliersQuery = ({ page = 1, limit = 10, search = '' } = {}) => {
    return useQuery({
        queryKey: ['suppliers', { page, limit, search }],
        queryFn: async () => {
            const response = await window.electron.invoke('suppliers:getAll', { page, limit, search });
            return response;
        },
    });
};

export const useGetSupplierByIdQuery = (id: string | number) => {
    return useQuery({
        queryKey: ['supplier', id],
        queryFn: async () => {
            const response = await window.electron.invoke('suppliers:getById', Number(id));
            return { data: response };
        },
        enabled: !!id,
    });
};

export const useAddSupplierMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await window.electron.invoke('suppliers:create', data);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        },
    });
};

export const useUpdateSupplierMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, body }: { id: string | number; body: any }) => {
            const response = await window.electron.invoke('suppliers:update', { id: Number(id), data: body });
            return response;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            queryClient.invalidateQueries({ queryKey: ['supplier', variables.id] });
        },
    });
};

export const useDeleteSupplierMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string | number) => {
            const response = await window.electron.invoke('suppliers:delete', Number(id));
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        },
    });
};
