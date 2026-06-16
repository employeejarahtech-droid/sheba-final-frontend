import { createFileRoute, Link } from '@tanstack/react-router';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, FileJson } from 'lucide-react';
import { Main } from '@/components/layout/main';
import { useGetNotificationByIdQuery } from '@/features/notifications/notificationQueries';

export const Route = createFileRoute('/_authenticated/dashboard/notifications/$id')({
    component: NotificationDetailPage,
});

const ACTION_CONFIG: Record<string, { icon: typeof Plus; iconBg: string; headerBg: string; label: string }> = {
    add: {
        icon: Plus,
        iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
        headerBg: 'bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-950/20',
        label: 'Created',
    },
    update: {
        icon: Pencil,
        iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-500',
        headerBg: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
        label: 'Updated',
    },
    delete: {
        icon: Trash2,
        iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
        headerBg: 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30',
        label: 'Deleted',
    },
};

function formatFullDate(dateStr: string) {
    return new Date(dateStr).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function isUpdatePayload(data: any): data is { previous: Record<string, any>; current: Record<string, any> } {
    return data && typeof data === 'object' && 'previous' in data && 'current' in data;
}

function DiffRow({ field, oldVal, newVal }: { field: string; oldVal: any; newVal: any }) {
    const parsedOld = parseJson(oldVal);
    const parsedNew = parseJson(newVal);
    const changed = JSON.stringify(parsedOld) !== JSON.stringify(parsedNew);
    return (
        <div className={`grid grid-cols-[1fr_2fr_2fr] gap-2 px-4 py-2.5 text-sm border-b last:border-0 ${changed ? `bg-amber-50/50 dark:bg-amber-950/20` : ``}`}>
            <span className="font-mono text-xs text-muted-foreground self-center">{field}</span>
            <span className={`font-mono text-xs break-all ${changed ? `line-through text-red-500/70` : `text-muted-foreground`}`}>
                {formatVal(parsedOld)}
            </span>
            <span className={`font-mono text-xs break-all font-medium ${changed ? `text-emerald-600` : `text-muted-foreground`}`}>
                {formatVal(parsedNew)}
            </span>
        </div>
    );
}

function parseJson(val: any): any {
    if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val; }
    }
    return val;
}

function formatVal(v: any): string {
    if (v === null || v === undefined) return '—';
    const parsed = parseJson(v);
    if (typeof parsed === 'object') return JSON.stringify(parsed, null, 2);
    if (typeof parsed === 'boolean') return parsed ? 'Yes' : 'No';
    return String(parsed);
}

function DataPanel({ title, data, variant }: { title: string; data: Record<string, any>; variant: 'old' | 'new' }) {
    const borderColor = variant === 'old' ? 'border-red-200 dark:border-red-900' : 'border-emerald-200 dark:border-emerald-900';
    const headerBg = variant === 'old' ? 'bg-red-50 dark:bg-red-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30';
    const parsed = parseJson(data);

    return (
        <Card className={`border ${borderColor} overflow-hidden`}>
            <div className={`px-4 py-2.5 ${headerBg} border-b ${borderColor}`}>
                <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
            </div>
            <CardContent className="p-0">
                {typeof parsed === 'object' && parsed !== null ? (
                    <pre className="px-4 py-3 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                        {JSON.stringify(parsed, null, 2)}
                    </pre>
                ) : (
                    <div className="px-4 py-3 text-sm">{String(parsed)}</div>
                )}
            </CardContent>
        </Card>
    );
}

function UpdateDiff({ previous, current }: { previous: Record<string, any>; current: Record<string, any> }) {
    const allKeys = Array.from(new Set([...Object.keys(previous || {}), ...Object.keys(current || {})])).sort();

    return (
        <div className="space-y-4">
            {/* Diff Table */}
            <div className="rounded-xl border overflow-hidden">
                <div className="grid grid-cols-[1fr_2fr_2fr] gap-2 px-4 py-2 bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Field</span>
                    <span>Before</span>
                    <span>After</span>
                </div>
                {allKeys.map((key) => (
                    <DiffRow key={key} field={key} oldVal={previous?.[key]} newVal={current?.[key]} />
                ))}
            </div>

            {/* Full Data Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DataPanel title="Full Previous Data" data={previous || {}} variant="old" />
                <DataPanel title="Full Current Data" data={current || {}} variant="new" />
            </div>
        </div>
    );
}

function NotificationDetailPage() {
    const { id } = Route.useParams();
    const { data, isLoading } = useGetNotificationByIdQuery(id);
    const n = data?.data;

    if (isLoading) {
        return (
            <>
                <AppHeader fixed />
                <Main>
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </Main>
            </>
        );
    }

    if (!n) {
        return (
            <>
                <AppHeader fixed />
                <Main>
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <p className="text-sm">Notification not found</p>
                        <Link to="/dashboard/notifications">
                            <Button variant="link" size="sm" className="mt-2">Back to notifications</Button>
                        </Link>
                    </div>
                </Main>
            </>
        );
    }

    const config = ACTION_CONFIG[n.action_type] || ACTION_CONFIG.update;
    const Icon = config.icon;
    const isUpdate = isUpdatePayload(n.record_data);

    return (
        <>
            <AppHeader fixed />
            <Main className="flex flex-1 flex-col gap-6">
                <div className="space-y-6 w-full max-w-4xl mx-auto px-4">
                    {/* Page Header */}
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard/notifications">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Notification Details
                            </h1>
                            <p className="text-muted-foreground text-sm">Audit record #{n.id}</p>
                        </div>
                    </div>

                    {/* Overview Card */}
                    <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                        <CardHeader className={`${config.headerBg} border-b py-1.5 px-4 gap-0`}>
                            <div className="flex items-center gap-2.5">
                                <div className={`p-2 ${config.iconBg} rounded-lg shadow-lg`}>
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">Overview</CardTitle>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{n.notification_title}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 flex-wrap mb-4">
                                <Badge variant="outline">{config.label}</Badge>
                                {n.module && (
                                    <Badge variant="secondary" className="uppercase text-xs tracking-wider">
                                        {n.module}
                                    </Badge>
                                )}
                                {n.is_read ? (
                                    <Badge variant="secondary">Read</Badge>
                                ) : (
                                    <Badge>Unread</Badge>
                                )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Action', value: config.label },
                                    { label: 'Module', value: n.module || '—' },
                                    { label: 'Record ID', value: n.record_id ? `#${n.record_id}` : '—' },
                                    { label: 'Created By', value: n.creator?.name || (n.created_by ? `User #${n.created_by}` : '—') },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-lg bg-muted/40 px-3 py-2.5">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{item.label}</p>
                                        <p className="text-sm font-medium">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">{formatFullDate(n.created_at)}</p>
                        </CardContent>
                    </Card>

                    {/* Record Data Card */}
                    {n.record_data && (
                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                        <FileJson className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">{isUpdate ? 'Changes' : 'Record Data'}</CardTitle>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            {isUpdate ? 'Before and after comparison' : 'Captured payload'}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                {isUpdate ? (
                                    <UpdateDiff previous={parseJson(n.record_data.previous)} current={parseJson(n.record_data.current)} />
                                ) : (
                                    <pre className="rounded-xl bg-zinc-950 dark:bg-zinc-900 text-emerald-400 text-sm p-4 overflow-x-auto leading-relaxed">
                                        {JSON.stringify(parseJson(n.record_data), null, 2)}
                                    </pre>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </Main>
        </>
    );
}
