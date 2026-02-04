import api from '@/lib/axios';
import { AddUserRequest, AddUserResponse, UserByIdResponse, UserListResponse, UpdateUserRequest } from '@/types/user.types';

export const userService = {
    getUsers: async (params?: { page?: number; limit?: number; search?: string }) => {
        const response = await api.get<UserListResponse>('/users/list', { params });
        return response.data;
    },
    addUser: async (body: AddUserRequest) => {
        const response = await api.post<AddUserResponse>('/users/add', body);
        return response.data;
    },
    getUserById: async (id: string | number) => {
        const response = await api.get<UserByIdResponse>(`/users/get/${id}`);
        return response.data;
    },
    updateUser: async ({ userId, body }: UpdateUserRequest) => {
        const response = await api.put<AddUserResponse>(`/users/update/${userId}`, body);
        return response.data;
    }
};
