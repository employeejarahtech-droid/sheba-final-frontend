import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- QUERIES ---

export interface Product {
    id: number;
    sku: string;
    name: string;
    description?: string;
    category_id: number;
    unit_id: number;
    price: number;
    cost: number;
    initial_stock: number;
    min_stock_level: number;
    max_stock_level: number;
    stock_quantity: number;
    purchase_tax: number;
    sales_tax: number;
    weight: number;
    width: number;
    height: number;
    length: number;
    is_active: number;
    thumb_url?: string;
    gallery_items?: any[];
    attributes?: any[];
    created_at?: string;
    updated_at?: string;
    // relations
    category?: { id: number; name: string };
    unit?: { id: number; name: string };
}

export const useProducts = ({ page = 1, limit = 10, search = '' } = {}) => {
    return useQuery({
        queryKey: ['products', { page, limit, search }],
        queryFn: async () => {
            const result = await window.electron.invoke('products:getAll', { page, limit, search });
            return result;
        },
    });
};

export const useProduct = (id: number) => {
    return useQuery({
        queryKey: ['products', id],
        queryFn: async () => {
            const result = await window.electron.invoke('products:getById', id);
            return result;
        },
        enabled: !!id,
    });
};

export const useProductStats = () => {
    return useQuery({
        queryKey: ['product-stats'],
        queryFn: async () => {
            const result = await window.electron.invoke('products:stats');
            return result;
        }
    })
}

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const result = await window.electron.invoke('categories:getAll', { limit: 1000 });
            return result;
        },
    });
};

export const useUnits = () => {
    return useQuery({
        queryKey: ['units'],
        queryFn: async () => {
            const result = await window.electron.invoke('units:getAll', { limit: 1000 });
            return result;
        },
    });
};

export const useStockMovements = ({ page = 1, limit = 10 } = {}) => {
    return useQuery({
        queryKey: ['stock-movements', { page, limit }],
        queryFn: async () => {
            // TODO: Implement stock movements IPC handler
            await new Promise((resolve) => setTimeout(resolve, 400));
            return {
                data: [],
                pagination: { total: 0, per_page: limit, current_page: page, last_page: 0 }
            };
        },
    });
};

// --- MUTATIONS ---

export const useAddProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newProduct: any) => {
            const result = await window.electron.invoke('products:create', newProduct);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product-stats'] });
        },
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, body }: { id: number; body: any }) => {
            const result = await window.electron.invoke('products:update', { id, body });
            return result;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['products', id] });
            queryClient.invalidateQueries({ queryKey: ['product-stats'] });
        },
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const result = await window.electron.invoke('products:delete', id);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product-stats'] });
        },
    });
};
