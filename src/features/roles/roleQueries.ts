import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roleService } from './roleService';

export const ROLE_KEYS = {
    all: ['roles'] as const,
    list: (params?: any) => [...ROLE_KEYS.all, 'list', params] as const,
    detail: (id: any) => [...ROLE_KEYS.all, 'detail', id] as const,
};

export const useGetRolesQuery = (params?: { page?: number; limit?: number; search?: string }) => {
    return useQuery({
        queryKey: ROLE_KEYS.list(params),
        queryFn: () => roleService.getRoles(params),
    });
};

export const useAddRoleMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: roleService.addRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ROLE_KEYS.all });
        }
    });
};

export const useGetRoleByIdQuery = (id: string | number, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ROLE_KEYS.detail(id),
        queryFn: () => roleService.getRoleById(id),
        ...options
    });
};

export const useUpdateRoleMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: roleService.updateRole,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ROLE_KEYS.all });
            queryClient.invalidateQueries({ queryKey: ROLE_KEYS.detail(variables.roleId) });
        }
    });
};
