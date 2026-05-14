import api from '@/lib/axios';

export interface Notification {
    id: number;
    notification_title: string;
    action_type: 'add' | 'update' | 'delete';
    module: string | null;
    record_id: number | null;
    record_data: any;
    is_read: boolean;
    created_by: number | null;
    created_at: string;
}

export const notificationService = {
    getNotifications: async (params?: { page?: number; limit?: number }) => {
        const response = await api.get<{ status: boolean; data: Notification[]; pagination: any }>(
            '/notifications',
            { params }
        );
        return response.data;
    },

    getUnreadCount: async () => {
        const response = await api.get<{ status: boolean; data: { count: number } }>(
            '/notifications/unread-count'
        );
        return response.data;
    },

    markAllRead: async () => {
        const response = await api.put('/notifications/mark-read');
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get<{ status: boolean; data: Notification }>(`/notifications/${id}`);
        return response.data;
    },
};
