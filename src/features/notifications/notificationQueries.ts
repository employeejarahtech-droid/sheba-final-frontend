import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from './notificationService';

const NOTIFICATION_KEYS = {
    all: ['notifications'] as const,
    list: (params?: any) => ['notifications', 'list', params] as const,
    unreadCount: () => ['notifications', 'unreadCount'] as const,
};

export const useGetNotificationsQuery = (params?: { page?: number; limit?: number }) => {
    return useQuery({
        queryKey: NOTIFICATION_KEYS.list(params),
        queryFn: () => notificationService.getNotifications(params),
    });
};

export const useGetUnreadCountQuery = () => {
    return useQuery({
        queryKey: NOTIFICATION_KEYS.unreadCount(),
        queryFn: notificationService.getUnreadCount,
    });
};

export const useMarkAllReadMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: notificationService.markAllRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
        },
    });
};

export const useGetNotificationByIdQuery = (id: string) => {
    return useQuery({
        queryKey: ['notifications', 'detail', id],
        queryFn: () => notificationService.getById(Number(id)),
        enabled: !!id,
    });
};
