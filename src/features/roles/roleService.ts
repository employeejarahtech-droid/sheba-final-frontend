import api from '@/lib/axios';
import { AddRoleRequest, AddRoleResponse, RoleByIdResponse, RoleListResponse, UpdateRoleRequest } from '@/types/role.types';

export const roleService = {
    getRoles: async (params?: { page?: number; limit?: number; search?: string }) => {
        const response = await api.get<RoleListResponse>('/roles/list', { params });
        return response.data;
    },
    addRole: async (body: AddRoleRequest) => {
        const response = await api.post<AddRoleResponse>('/roles/add', body);
        return response.data;
    },
    getRoleById: async (id: string | number) => {
        const response = await api.get<RoleByIdResponse>(`/roles/get/${id}`);
        return response.data;
    },
    updateRole: async ({ roleId, body }: UpdateRoleRequest) => {
        const response = await api.put<AddRoleResponse>(`/roles/update/${roleId}`, body);
        return response.data;
    }
};
