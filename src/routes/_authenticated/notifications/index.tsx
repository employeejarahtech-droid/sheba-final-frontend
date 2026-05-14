import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Bell, Plus, Pencil, Trash2, Loader2, ChevronRight } from 'lucide-react';
import { Main } from '@/components/layout/main';
import {
    useGetNotificationsQuery,
    useGetUnreadCountQuery,
    useMarkAllReadMutation,
} from '@/features/notifications/notificationQueries';
import type { Notification } from '@/features/notifications/notificationService';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/notifications/')({
    component: NotificationsPage,
});

const ACTION_CONFIG: Record<string, { icon: typeof Plus; color: string; bg: string; label: string }> = {
    add: { icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950', label: 'Created' },
    update: { icon: Pencil, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950', label: 'Updated' },
    delete: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950', label: 'Deleted' },
};

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

function NotificationCard({ n, onClick }: { n: Notification; onClick: () => void }) {
    const config = ACTION_CONFIG[n.action_type] || ACTION_CONFIG.update;
    const Icon = config.icon;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left flex items-start gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/30 ${!n.is_read ? 'border-primary/20 bg-primary/5' : ''}`}
        >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{n.notification_title}</p>
                    {!n.is_read && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        {config.label}
                    </Badge>
                    {n.module && (
                        <span className="uppercase tracking-wider">{n.module}</span>
                    )}
                    {n.record_id && (
                        <span>#{n.record_id}</span>
                    )}
                    <span className="ml-auto">{timeAgo(n.created_at)}</span>
                </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/50 self-center" />
        </button>
    );
}

function NotificationsPage() {
    const [page, setPage] = useState(1);
    const [tab, setTab] = useState('all');
    const limit = 20;
    const navigate = useNavigate();

    const { data: unreadData } = useGetUnreadCountQuery();
    const { data, isLoading, isFetching } = useGetNotificationsQuery({ page, limit });
    const markAllRead = useMarkAllReadMutation();

    const notifications = data?.data ?? [];
    const pagination = data?.pagination;
    const unreadCount = unreadData?.data?.count ?? 0;

    const filtered = tab === 'unread'
        ? notifications.filter((n) => !n.is_read)
        : notifications;

    const handleMarkAllRead = async () => {
        try {
            await markAllRead.mutateAsync();
            toast.success('All notifications marked as read');
        } catch {
            toast.error('Failed to mark as read');
        }
    };

    return (
        <>
            <AppHeader fixed />
            <Main>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                            <p className="text-muted-foreground">
                                Activity log for all create, update, and delete actions
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {unreadCount > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMarkAllRead}
                                    disabled={markAllRead.isPending}
                                >
                                    <Check className="mr-2 h-4 w-4" />
                                    Mark all read
                                </Button>
                            )}
                            <Badge variant="secondary" className="text-sm px-3 py-1">
                                <Bell className="mr-1.5 h-3.5 w-3.5" />
                                {unreadCount} unread
                            </Badge>
                        </div>
                    </div>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Activity Feed</CardTitle>
                                {isFetching && !isLoading && (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                            </div>
                            <Tabs value={tab} onValueChange={setTab}>
                                <TabsList>
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="unread">
                                        Unread {unreadCount > 0 && `(${unreadCount})`}
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Bell className="h-10 w-10 mb-3 opacity-30" />
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filtered.map((n) => (
                                        <NotificationCard
                                            key={n.id}
                                            n={n}
                                            onClick={() => navigate({ to: '/notifications/$id', params: { id: String(n.id) } })}
                                        />
                                    ))}
                                </div>
                            )}

                            {pagination && pagination.totalPage > 1 && (
                                <div className="flex items-center justify-between pt-4 mt-4 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, pagination.total)} of {pagination.total}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page <= 1}
                                            onClick={() => setPage(page - 1)}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page >= pagination.totalPage}
                                            onClick={() => setPage(page + 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </Main>
        </>
    );
}
