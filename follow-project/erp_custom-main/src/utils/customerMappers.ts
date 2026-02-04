import type { Customer } from "@/store/features/customers/types";

// Map API customer type to UI display label
export function getCustomerTypeLabel(type: "individual" | "business" | "retail"): string {
    if (type === "business") return "Business";
    if (type === "retail") return "Retail";
    return "Individual";
}

// Map UI group value to API customer_type
export function groupToCustomerType(group: string): "individual" | "business" | "retail" {
    if (group === "retail") return "retail";
    if (group === "individual") return "individual";
    return "business"; // wholesale, key_account -> business
}

// Map API customer_type to UI group value
export function customerTypeToGroup(type: "individual" | "business" | "retail"): string {
    if (type === "individual") return "individual";
    if (type === "retail") return "retail";
    return "wholesale";
}

// Convert full address parts to single address string
export function buildAddress(
    address?: string,
    city?: string,
    state?: string,
    postalCode?: string,
    country?: string
): string {
    const parts = [address, city, state, postalCode, country].filter(Boolean);
    return parts.join(", ");
}

// Convert API customer to form data structure
export function apiToFormData(customer: Customer) {
    return {
        code: customer.id.toString(),
        name: customer.name,
        group: customerTypeToGroup(customer.customer_type),
        taxId: customer.tax_id || "",
        email: customer.email || "",
        phone: customer.phone || "",
        billingAddress: buildAddress(
            customer.address,
            customer.city,
            customer.state,
            customer.postal_code,
            customer.country
        ),
        shippingAddress: "",
        creditLimit: customer.credit_limit || 0,
        creditDays: 0, // Not in API, default value
        risk: "low", // Not in API, default value
        status: customer.is_active ? "Active" : "Inactive",
    };
}

// Convert form data to API request format
export function formToApiData(formData: {
    name: string;
    group?: string;
    taxId?: string;
    email?: string;
    phone?: string;
    billingAddress?: string;
    creditLimit?: number;
    status?: string;
    company?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
}) {
    return {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        address: formData.billingAddress,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: formData.country,
        latitude: formData.latitude,
        longitude: formData.longitude,
        tax_id: formData.taxId,
        credit_limit: formData.creditLimit,
        customer_type: formData.group ? groupToCustomerType(formData.group) : "individual",
        notes: formData.notes,
        is_active: formData.status === "Active",
    };
}
