export interface User {
    id: number;
    name: string;
    email: string;
    role_id?: number;
    role?: {
        id: number;
        name: string;
        display_name: string;
    };
    created_at: string;
    updated_at?: string;
}

export interface AddUserRequest {
    name: string;
    email: string;
    password: string;
    role_id?: number;
}

export interface UpdateUserRequest {
    userId: string | number;
    body: {
        name?: string;
        email?: string;
        password?: string;
        role_id?: number;
    };
}

export interface AddUserResponse {
    status: boolean;
    message: string;
    data?: User;
    code: number;
}

export interface UserByIdResponse {
    status: boolean;
    message: string;
    data: User;
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
}

export interface UserListResponse {
    status: boolean;
    message: string;
    data: {
        items: User[];
        meta: Pagination;
    };
}
