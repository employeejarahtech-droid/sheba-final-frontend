import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from './userService';

export const USER_KEYS = {
    all: ['users'] as const,
    list: (params?: any) => [...USER_KEYS.all, 'list', params] as const,
    detail: (id: any) => [...USER_KEYS.all, 'detail', id] as const,
};

export const useGetUsersQuery = (params?: { page?: number; limit?: number; search?: string }) => {
    return useQuery({
        queryKey: USER_KEYS.list(params),
        queryFn: () => userService.getUsers(params),
    });
};

export const useAddUserMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: userService.addUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
        }
    });
};

export const useGetUserByIdQuery = (id: string | number, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: USER_KEYS.detail(id),
        queryFn: () => userService.getUserById(id),
        ...options
    });
};

export const useUpdateUserMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: userService.updateUser,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
            queryClient.invalidateQueries({ queryKey: USER_KEYS.detail(variables.userId) });
        }
    });
};
