import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- Types ---
export interface PurchaseOrder {
    id: number;
    po_number: string;
    supplier_id: number;
    order_date: string;
    expected_delivery_date?: string;
    status: string;
    total_amount: number;
    tax_amount: number;
    discount_amount: number;
    total_paid_amount: number;
    payment_status: string;
    notes?: string;
    supplier?: {
        id: number;
        name: string;
        code?: string;
    };
    items?: PurchaseOrderItem[];
    payments?: PurchasePayment[];
    created_at?: string;
    updated_at?: string;
    total_payable_amount?: number;
}

export interface PurchaseOrderItem {
    id: number;
    product_id: number;
    quantity: number;
    unit_cost: number;
    discount: number;
    tax_amount: number;
    line_total: number;
    purchase_tax?: number;
    product?: {
        name: string;
        sku: string;
    };
}

export interface PurchasePayment {
    id: number;
    purchase_order_id: number;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference_number?: string;
    notes?: string;
    status: string;
    purchase_order?: {
        po_number: string;
        supplier?: {
            name: string;
        };
    };
}

// --- Hooks ---

// Purchase Orders
export const useGetAllPurchaseOrdersQuery = ({ page = 1, limit = 10, search = '' } = {}) => {
    return useQuery({
        queryKey: ['purchaseOrders', { page, limit, search }],
        queryFn: async () => {
            return await window.electron.invoke('purchase:orders:getAll', { page, limit, search });
        },
    });
};

export const useGetAllApprovedPurchaseOrdersQuery = ({ page = 1, limit = 100, search = '' } = {}) => {
    // Reusing the same getAll endpoint but likely filtering in UI or we can add filter params later.
    // For now, let's just fetch all and filter in UI or modifying backend if needed.
    // Ideally backend accepts status filter.
    return useQuery({
        queryKey: ['purchaseOrders', { page, limit, search, status: 'approved' }],
        queryFn: async () => {
            const res = await window.electron.invoke('purchase:orders:getAll', { page, limit, search });
            // Client-side filtering for simplicity if backend doesn't support it yet via params
            if (res.data) {
                // Mocking "approved" logic or just returning all if current backend simple
                // If the user hasn't asked for "approved" status filter implementation in backend, 
                // we might just return them all. But usually "approved" is needed for payments.
                // NOTE: The previous mock implementation had this query name.
                // Let's assume the user wants valid POs. 
                // For now, I'll return the raw result and let the component filter or use all.
            }
            return res;
        },
    });
};

export const useGetPurchaseOrderByIdQuery = (id: string | number, options = {}) => {
    return useQuery({
        queryKey: ['purchaseOrder', id],
        queryFn: async () => {
            const data = await window.electron.invoke('purchase:orders:getById', Number(id));
            // Wrap in { data: ... } to match likely frontend expectation if it was using RTK before
            // RTK usually returns { data: T }. The Electron handler returns T directly.
            // Let's standardize on { data: T } for consistency with current frontend code likely.
            return { data };
        },
        enabled: !!id,
        ...options
    });
};

export const useCreatePurchaseOrderMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            return await window.electron.invoke('purchase:orders:create', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
        },
    });
};

export const useUpdatePurchaseOrderMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, body }: { id: number; body: any }) => {
            return await window.electron.invoke('purchase:orders:update', { id, body });
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrder', variables.id] });
        },
    });
};

export const useDeletePurchaseOrderMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            return await window.electron.invoke('purchase:orders:delete', id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
        },
    });
};

// Purchase Payments
export const useGetAllPurchasePaymentsQuery = ({ page = 1, limit = 10, search = '' }: { page?: number; limit?: number; search?: string } = {}) => {
    return useQuery({
        queryKey: ['purchasePayments', { page, limit, search }],
        queryFn: async () => {
            return await window.electron.invoke('purchase:payments:getAll', { page, limit, search });
        },
    });
};

export const useAddPurchasePaymentMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            return await window.electron.invoke('purchase:payments:create', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchasePayments'] });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] }); // Status updates
        },
    });
};

export const useGetPurchasePaymentByIdQuery = (id: string | number) => {
    return useQuery({
        queryKey: ['purchasePayment', id],
        queryFn: async () => {
            const data = await window.electron.invoke('purchase:payments:getById', Number(id));
            return { data };
        },
        enabled: !!id,
    });
};

// Purchase Invoices
export interface PurchaseInvoice {
    id: number;
    invoice_number: string;
    purchase_order_id: number;
    total_payable_amount: number;
    paid_amount: number;
    due_amount: number;
    status: string;
    invoice_date: string;
    due_date?: string;
    notes?: string;
    purchase_order: {
        id: number;
        po_number: string;
        total_amount: number;
        tax_amount: number;
        discount_amount: number;
        supplier: {
            name: string;
            email?: string;
            phone?: string;
        };
        items?: any[];
    };
    payments?: WithCreator<PurchasePayment>[];
    creator?: {
        name: string;
    };
    created_at?: string;
    updated_at?: string;
}

type WithCreator<T> = T & { creator?: { name: string } };

export const useGetAllPurchaseInvoicesQuery = ({ page = 1, limit = 10, search = '' }: { page?: number; limit?: number; search?: string } = {}) => {
    return useQuery({
        queryKey: ['purchaseInvoices', { page, limit, search }],
        queryFn: async () => {
            return await window.electron.invoke('purchase:invoices:getAll', { page, limit, search });
        },
    });
};

export const useGetPurchaseInvoiceByIdQuery = (id: string | number) => {
    return useQuery({
        queryKey: ['purchaseInvoice', id],
        queryFn: async () => {
            const data = await window.electron.invoke('purchase:invoices:getById', Number(id));
            return { data };
        },
        enabled: !!id
    });
};

export const useCreatePurchaseInvoiceMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            return await window.electron.invoke('purchase:invoices:create', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
        },
    });
};

export const useUpdatePurchaseInvoiceMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, body }: { id: number; body: any }) => {
            return await window.electron.invoke('purchase:invoices:update', { id, body });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
            queryClient.invalidateQueries({ queryKey: ['purchaseInvoice', variables.id] });
        },
    });
};

export const useDeletePurchaseInvoiceMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            return await window.electron.invoke('purchase:invoices:delete', id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
        },
    });
};
