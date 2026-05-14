import { createFileRoute, Link } from '@tanstack/react-router';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, ArrowRight, Minus } from 'lucide-react';
import { Main } from '@/components/layout/main';
import { useGetNotificationByIdQuery } from '@/features/notifications/notificationQueries';

export const Route = createFileRoute('/_authenticated/notifications/$id')({
    component: NotificationDetailPage,
});

const ACTION_CONFIG: Record<string, { icon: typeof Plus; color: string; bg: string; label: string }> = {
    add: { icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950', label: 'Created' },
    update: { icon: Pencil, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950', label: 'Updated' },
    delete: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950', label: 'Deleted' },
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
        <div className={`grid grid-cols-[1fr_2fr_2fr] gap-2 px-4 py-2.5 text-sm border-b last:border-0 ${changed ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
            <span className="font-mono text-xs text-muted-foreground self-center">{field}</span>
            <span className={`font-mono text-xs break-all ${changed ? 'line-through text-red-500/70' : 'text-muted-foreground'}`}>
                {formatVal(parsedOld)}
            </span>
            <span className={`font-mono text-xs break-all font-medium ${changed ? 'text-emerald-600' : 'text-muted-foreground'}`}>
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
                        <Link to="/notifications">
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
            <Main>
                <div className="space-y-6 max-w-4xl">
                    <div className="flex items-center gap-4">
                        <Link to="/notifications">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Notification Details</h1>
                            <p className="text-muted-foreground text-sm">#{n.id}</p>
                        </div>
                    </div>

                    {/* Header Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-start gap-4">
                                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${config.bg}`}>
                                    <Icon className={`h-7 w-7 ${config.color}`} />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <CardTitle className="text-xl">{n.notification_title}</CardTitle>
                                    <div className="flex items-center gap-2 flex-wrap">
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
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
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
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    {isUpdate ? (
                                        <>
                                            <Minus className="h-4 w-4 text-red-500" />
                                            Changes
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            <Plus className="h-4 w-4 text-emerald-500" />
                                        </>
                                    ) : (
                                        'Record Data'
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
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
