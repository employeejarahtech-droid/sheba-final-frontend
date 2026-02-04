// Customer API Types

export interface Customer {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
    image?: string | string[];
    images?: string[];
    tax_id?: string;
    credit_limit?: number;
    outstanding_balance?: number;
    total_sales?: number;
    customer_type: "individual" | "business" | "retail";
    sales_route_id?: number;
    notes?: string;
    is_active: boolean;
    thumb_url?: string;
    gallery_items?: string[];
    created_at: string;
    updated_at?: string;
}

export interface CreateCustomerRequest {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
    thumb_url?: string;
    gallery_items?: string[];
    tax_id?: string;
    credit_limit?: number;
    outstanding_balance?: number;
    customer_type?: "individual" | "business" | "retail";
    sales_route_id?: number;
    notes?: string;
    is_active?: boolean;
}

export interface UpdateCustomerRequest {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
    image?: string | string[];
    images?: string[];
    tax_id?: string;
    credit_limit?: number;
    outstanding_balance?: number;
    customer_type?: "individual" | "business" | "retail";
    sales_route_id?: number;
    notes?: string;
    is_active?: boolean;

}

export interface GetCustomersParams {
    page?: number;
    limit?: number;
    customer_type?: "individual" | "business" | "retail";
    is_active?: boolean;
    search?: string;
}

export interface Pagination {
    total: number;
    page: string;
    limit: string;
    totalPage: number;
}

export interface GetCustomersResponse {
    success: boolean;
    message: string;
    pagination: Pagination;
    data: Customer[];
}

export interface CustomerResponse {
    status: boolean;
    message?: string;
    data: Customer;
}

export interface DeleteCustomerResponse {
    status: boolean;
    message: string;
}

export interface CustomerMapLocation {
    id: number;
    name: string;
    company?: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    coordinates: {
        lat: number;
        lng: number;
    };
}

export interface GetCustomerMapsResponse {
    status: boolean;
    data: {
        total: number;
        locations: CustomerMapLocation[];
    };
}
