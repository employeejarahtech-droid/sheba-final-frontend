import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Bell, Plus, Pencil, Trash2, Loader2, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Main } from '@/components/layout/main';
import { getPageNumbers } from '@/lib/utils';
import {
    useGetNotificationsQuery,
    useGetUnreadCountQuery,
    useMarkAllReadMutation,
} from '@/features/notifications/notificationQueries';
import type { Notification } from '@/features/notifications/notificationService';
import { toast } from 'sonner';
import { z } from 'zod';

const notificationsSearchSchema = z.object({
    page: z.coerce.number().catch(1),
    limit: z.coerce.number().catch(20),
    tab: z.string().catch('all'),
});

export const Route = createFileRoute('/_authenticated/dashboard/notifications/')({
    validateSearch: (search) => notificationsSearchSchema.parse(search),
    component: NotificationsPage,
});

const ACTION_CONFIG: Record<string, { icon: typeof Plus; iconBg: string; label: string }> = {
    add: { icon: Plus, iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', label: 'Created' },
    update: { icon: Pencil, iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-500', label: 'Updated' },
    delete: { icon: Trash2, iconBg: 'bg-gradient-to-br from-red-500 to-rose-600', label: 'Deleted' },
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
            className={`w-full text-left flex items-start gap-4 rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-px ${!n.is_read ? `border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20` : `border-border bg-card hover:bg-muted/30`}`}
        >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm ${config.iconBg}`}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{n.notification_title}</p>
                    {!n.is_read && (
                        <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
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
    const searchParams: any = Route.useSearch();
    const navigate = Route.useNavigate();

    const page = Number(searchParams?.page) || 1;
    const limit = Number(searchParams?.limit) || 20;
    const tab = searchParams?.tab || 'all';

    const setPage = (newPage: number) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, page: newPage }) });
    };
    const setLimit = (newLimit: number) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, limit: newLimit, page: 1 }) });
    };
    const setTab = (newTab: string) => {
        navigate({ to: '.', search: (prev: any) => ({ ...prev, tab: newTab, page: 1 }) });
    };

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
            <Main className="flex flex-1 flex-col gap-6">
                <div className="space-y-6 w-full max-w-4xl mx-auto px-4">
                    {/* Page Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    Notifications
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    Activity log for all create, update, and delete actions
                                </p>
                            </div>
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

                    {/* Activity Feed Card */}
                    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                    <Bell className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-lg font-bold">Activity Feed</CardTitle>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Latest system events</p>
                                </div>
                                {isFetching && !isLoading && (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <Tabs value={tab} onValueChange={setTab}>
                                <TabsList>
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="unread">
                                        Unread {unreadCount > 0 && `(${unreadCount})`}
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

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
                                            onClick={() => navigate({ to: '/dashboard/notifications/$id', params: { id: String(n.id) } })}
                                        />
                                    ))}
                                </div>
                            )}

                            {pagination && (
                                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 mt-4 border-t">
                                    <div className="flex items-center gap-4">
                                        <p className="text-sm text-muted-foreground">
                                            {pagination.total
                                                ? `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, pagination.total)} of ${pagination.total}`
                                                : 'No results'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">Rows per page</span>
                                            <Select
                                                value={String(limit)}
                                                onValueChange={(v) => setLimit(Number(v))}
                                            >
                                                <SelectTrigger size="sm" className="h-8 w-[70px]">
                                                    <SelectValue placeholder={String(limit)} />
                                                </SelectTrigger>
                                                <SelectContent side="top">
                                                    {[10, 20, 50, 100].map((v) => (
                                                        <SelectItem key={v} value={String(v)}>
                                                            {v}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="hidden lg:flex h-8 w-8 p-0"
                                            onClick={() => setPage(1)}
                                            disabled={page <= 1}
                                        >
                                            <ChevronsLeft className="h-4 w-4" />
                                            <span className="sr-only">First Page</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page - 1)}
                                            disabled={page <= 1}
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                            Previous
                                        </Button>
                                        <div className="hidden md:flex items-center space-x-1">
                                            {getPageNumbers(page, pagination.totalPage || 1).map((p, idx) => (
                                                <div key={idx}>
                                                    {p === '...' ? (
                                                        <span className="px-2">...</span>
                                                    ) : (
                                                        <Button
                                                            variant={page === p ? 'default' : 'outline'}
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => setPage(Number(p))}
                                                        >
                                                            {p}
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page + 1)}
                                            disabled={page >= (pagination.totalPage || 1)}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="hidden lg:flex h-8 w-8 p-0"
                                            onClick={() => setPage(pagination.totalPage || 1)}
                                            disabled={page >= (pagination.totalPage || 1)}
                                        >
                                            <ChevronsRight className="h-4 w-4" />
                                            <span className="sr-only">Last Page</span>
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
