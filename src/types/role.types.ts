export interface Role {
    id: number;
    name?: string;
    role: string;
    display_name: string;
    status: 'active' | 'inactive';
    description?: string;
    permissions?: string[];
    settings?: {
        menu?: string[];
        dashboard?: string[];
        custom?: Record<string, any>;
    };
}

export interface AddRoleRequest {
    role: string;
    display_name: string;
    description: string;
    status: string;
    permissions: string[];
}

export interface RoleByIdResponse {
    status: boolean;
    message: string;
    data: Role;
}

export interface AddRoleResponse {
    status: boolean;
    message: string;
    data?: Role;
}

export interface UpdateRoleRequest {
    roleId: string | number;
    body: {
        display_name: string;
        permissions: string[];
        dashboard: string[];
    };
}

export interface Pagination {
    total: number;
    page: string | number;
    limit: string | number;
    totalPage: number;
}

export interface RoleListResponse {
    success: boolean;
    message: string;
    pagination: Pagination;
    data: Role[];
}
