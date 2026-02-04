import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface PurchaseOrder {
    id: number;
    po_number: string;
    order_date: string | Date;
    expected_delivery_date: string | Date;
    status: "pending" | "approved" | "rejected" | "received" | "delivered";
    total_amount: number;
    discount_amount: number;
    tax_amount: number;
    total_payable_amount: number;
    supplier_id?: number;
    supplier?: {
        id: number;
        name: string;
        email?: string;
        phone?: string;
    };
    notes?: string;
    items?: any[];
}

export interface Supplier {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    contact_person?: string;
}

// --- DUMMY DATA ---

export interface PurchasePayment {
    id: number;
    payment_date: string;
    reference_number: string;
    payment_method: string;
    amount: number;
    creator?: {
        name: string;
    };
}

export interface PurchaseInvoice {
    id: number;
    invoice_number: string;
    purchase_order_id: number;
    purchase_order: {
        po_number: string;
        total_amount: number;
        tax_amount: number;
        discount_amount: number;
        supplier?: Supplier;
    };
    total_payable_amount: number;
    paid_amount: number;
    due_amount: number;
    status: "paid" | "partial" | "unpaid" | "overdue" | "draft";
    invoice_date: string;
    due_date?: string;
    payments?: PurchasePayment[];
    creator?: {
        name: string;
    };
}

const DUMMY_INVOICES: PurchaseInvoice[] = [
    {
        id: 1,
        invoice_number: "INV-2024-001",
        purchase_order_id: 1,
        purchase_order: {
            po_number: "PO-2024-001",
            total_amount: 1500,
            tax_amount: 150,
            discount_amount: 50,
            supplier: { id: 101, name: "Global Supplies Ltd", email: "info@global.com", phone: "123456789", contact_person: "John Doe", address: "123 Global Way" }
        },
        total_payable_amount: 1600,
        paid_amount: 1600,
        due_amount: 0,
        status: "paid",
        invoice_date: "2024-01-20",
        due_date: "2024-02-20",
        creator: { name: "Admin User" },
        payments: [
            { id: 101, payment_date: "2024-01-21", reference_number: "REF-101", payment_method: "Bank Transfer", amount: 1600, creator: { name: "Admin" } }
        ]
    },
    {
        id: 2,
        invoice_number: "INV-2024-002",
        purchase_order_id: 2,
        purchase_order: {
            po_number: "PO-2024-002",
            total_amount: 2500,
            tax_amount: 250,
            discount_amount: 100,
            supplier: { id: 102, name: "Tech Parts Inc", address: "456 Tech Blvd" }
        },
        total_payable_amount: 2650,
        paid_amount: 1000,
        due_amount: 1650,
        status: "partial",
        invoice_date: "2024-01-22"
    },
    {
        id: 3,
        invoice_number: "INV-2024-003",
        purchase_order_id: 3,
        purchase_order: {
            po_number: "PO-2024-003",
            total_amount: 3200,
            tax_amount: 320,
            discount_amount: 150,
            supplier: { id: 103, name: "Quality Fabrics", address: "789 Fabric Ln" }
        },
        total_payable_amount: 3370,
        paid_amount: 0,
        due_amount: 3370,
        status: "unpaid",
        invoice_date: "2024-01-25"
    }
];

const DUMMY_PURCHASES: PurchaseOrder[] = [
    {
        id: 1,
        po_number: "PO-2024-001",
        order_date: "2024-01-15",
        expected_delivery_date: "2024-01-20",
        status: "pending",
        total_amount: 1500,
        discount_amount: 50,
        tax_amount: 150,
        total_payable_amount: 1600,
        supplier: { id: 101, name: "Global Supplies Ltd" }
    },
    {
        id: 2,
        po_number: "PO-2024-002",
        order_date: "2024-01-16",
        expected_delivery_date: "2024-01-22",
        status: "approved",
        total_amount: 2500,
        discount_amount: 100,
        tax_amount: 250,
        total_payable_amount: 2650,
        supplier: { id: 102, name: "Tech Parts Inc" }
    },
    {
        id: 3,
        po_number: "PO-2024-003",
        order_date: "2024-01-17",
        expected_delivery_date: "2024-01-25",
        status: "received",
        total_amount: 3200,
        discount_amount: 150,
        tax_amount: 320,
        total_payable_amount: 3370,
        supplier: { id: 103, name: "Quality Fabrics" }
    }
];

const DUMMY_SUPPLIERS: Supplier[] = [
    { id: 101, name: "Global Supplies Ltd", email: "info@globalsupplies.com", phone: "123-456-7890", address: "123 Global Way" },
    { id: 102, name: "Tech Parts Inc", email: "sales@techparts.com", phone: "098-765-4321", address: "456 Tech Blvd" },
    { id: 103, name: "Quality Fabrics", email: "orders@qualityfabrics.com", phone: "555-555-5555", address: "789 Fabric Ln" },
    { id: 104, name: "Lumber Mill Co", email: "lumber@wood.com", phone: "444-333-2222", address: "101 Wood St" },
];

// --- QUERIES ---

export const useGetAllPurchases = ({ page = 1, limit = 10, search = '' } = {}) => {
    return useQuery({
        queryKey: ['purchases', { page, limit, search }],
        queryFn: async () => {
            // Return dummy data
            await new Promise(resolve => setTimeout(resolve, 500));
            let filteredData = [...DUMMY_PURCHASES];
            if (search) {
                filteredData = filteredData.filter(po =>
                    po.po_number.toLowerCase().includes(search.toLowerCase()) ||
                    po.supplier?.name.toLowerCase().includes(search.toLowerCase())
                );
            }
            return {
                data: filteredData,
                pagination: {
                    total: filteredData.length,
                    page,
                    limit,
                    totalPage: Math.ceil(filteredData.length / limit)
                }
            };
        }
    });
};

export const useSuppliers = ({ page = 1, limit = 20, search = '' } = {}) => {
    return useQuery({
        queryKey: ['suppliers', { page, limit, search }],
        queryFn: async () => {
            await new Promise(resolve => setTimeout(resolve, 400));
            let filtered = [...DUMMY_SUPPLIERS];
            if (search) {
                filtered = filtered.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
            }
            return {
                data: filtered,
                pagination: {
                    total: filtered.length,
                    page,
                    limit,
                    totalPage: Math.ceil(filtered.length / limit)
                }
            };
        }
    });
};

export const usePurchaseOrder = (id: number) => {
    return useQuery({
        queryKey: ['purchases', id],
        queryFn: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            const purchase = DUMMY_PURCHASES.find(p => p.id === id);
            return {
                status: true,
                data: purchase ? {
                    ...purchase,
                    items: [
                        { product_id: 1, quantity: 5, unit_cost: 100, discount: 10, purchase_tax: 5 },
                        { product_id: 2, quantity: 2, unit_cost: 500, discount: 20, purchase_tax: 10 }
                    ]
                } : null
            };
        },
        enabled: !!id
    });
};

export const useSupplier = (id: number) => {
    return useQuery({
        queryKey: ['suppliers', id],
        queryFn: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            return {
                status: true,
                data: DUMMY_SUPPLIERS.find(s => s.id === id)
            };
        },
        enabled: !!id
    });
};

// --- MUTATIONS ---

export const useUpdatePurchaseOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, body }: { id: number; body: any }) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log(`Updating PO ${id} with`, body);
            return { status: true, message: 'Updated successfully' };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
        }
    });
};

export const useDeletePurchaseOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log(`Deleting PO ${id}`);
            return { status: true, message: 'Deleted successfully' };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
        }
    });
};

export const useCreatePurchaseOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            await new Promise(resolve => setTimeout(resolve, 600));
            console.log('Creating PO with payload:', payload);
            return { status: true, message: 'Created successfully', data: { id: Math.floor(Math.random() * 1000) } };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
        }
    });
};

export const useGetAllPurchaseInvoicesQuery = ({ page = 1, limit = 10, search = '' } = {}) => {
    return useQuery({
        queryKey: ['purchase-invoices', { page, limit, search }],
        queryFn: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            // @ts-ignore
            let filtered = [...DUMMY_INVOICES];
            if (search) {
                filtered = filtered.filter(inv =>
                    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
                    inv.purchase_order.po_number.toLowerCase().includes(search.toLowerCase()) ||
                    inv.purchase_order.supplier?.name.toLowerCase().includes(search.toLowerCase())
                );
            }
            return {
                data: filtered,
                pagination: {
                    total: filtered.length,
                    page,
                    limit,
                    totalPage: Math.ceil(filtered.length / limit)
                }
            };
        }
    });
};

export interface Settings {
    company_name: string;
    address: string;
    email: string;
    phone: string;
    logo_url?: string;
}

export interface POItem {
    id: number;
    product: {
        name: string;
        sku: string;
        image_url?: string;
    };
    unit_cost: number;
    quantity: number;
    total_price: number; // calculated as unit_cost * quantity
    discount: number;
    line_total: number; // calculated as total_price - discount
}

// ... existing mocks ...

export const useGetPurchaseInvoiceByIdQuery = (id: string) => {
    return useQuery({
        queryKey: ['purchase-invoices', id],
        queryFn: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            const invoice = DUMMY_INVOICES.find(inv => inv.id === Number(id));
            if (invoice) {
                // @ts-ignore
                invoice.purchase_order.items = [
                    {
                        id: 1,
                        unit_cost: 100,
                        quantity: 5,
                        total_price: 500,
                        discount: 0,
                        line_total: 500,
                        product: { name: "Widget A", sku: "WID-001", image_url: "" }
                    },
                    {
                        id: 2,
                        unit_cost: 200,
                        quantity: 2,
                        total_price: 400,
                        discount: 50,
                        line_total: 350,
                        product: { name: "Gadget B", sku: "GAD-002", image_url: "" }
                    }
                ];
                // @ts-ignore
                invoice.purchase_order.net_amount = invoice.purchase_order.total_amount - invoice.purchase_order.discount_amount;
            }
            return {
                data: invoice
            };
        },
        enabled: !!id
    });
};

export const useUpdatePurchaseInvoiceMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ invoiceId, data }: { invoiceId: string; data: any }) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log(`Updating Invoice ${invoiceId} with`, data);
            return { status: true, message: 'Invoice updated successfully' };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] });
        }
    });
};

export const useGetSettingsInfoQuery = () => {
    return useQuery({
        queryKey: ['settings-info'],
        queryFn: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            return {
                data: {
                    company_name: "Acme Corp",
                    address: "123 Business Rd, Tech City",
                    email: "info@acmecorp.com",
                    phone: "+1 234 567 890",
                    logo_url: "https://via.placeholder.com/150"
                }
            };
        }
    });
};
