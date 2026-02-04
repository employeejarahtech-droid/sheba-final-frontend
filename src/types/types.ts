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
    is_active: boolean;
    thumb_url?: string;
    gallery_items?: string[];
    attributes?: Attribute[];
    category?: Category;
    unit?: Unit;
}

export interface Attribute {
    name: string;
    values: string[];
}

export interface Category {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
}

export interface Unit {
    id: number;
    name: string;
    is_active?: boolean;
}

export interface StockMovement {
    id: number;
    date: string;
    movement_type: string;
    quantity: number;
    reference_type: string;
    notes: string;
}
