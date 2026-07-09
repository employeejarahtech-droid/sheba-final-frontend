import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, FileText, Layers, PanelRight, Search, ListTree } from 'lucide-react'
import { cn } from '@/lib/utils'
import inventory from '@/data/app-inventory.json'

type ItemType = 'page' | 'modal' | 'drawer'
type Item = { type: ItemType; group: string; name: string; path?: string; file: string; description: string }
type GroupBucket = { pages: Item[]; modals: Item[]; drawers: Item[] }
type Inventory = {
    generatedAt: string
    counts: { pages: number; modals: number; drawers: number }
    groups: Record<string, GroupBucket>
}

const data = inventory as Inventory

const TYPE_META: Record<ItemType, { label: string; icon: typeof FileText; className: string }> = {
    page: { label: 'Page', icon: FileText, className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900' },
    modal: { label: 'Modal', icon: Layers, className: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900' },
    drawer: { label: 'Drawer', icon: PanelRight, className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900' },
}

const titleCaseGroup = (group: string) =>
    group
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')

export function AppInventoryPage() {
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<'all' | ItemType>('all')
    const [expanded, setExpanded] = useState<Set<string>>(new Set())

    const toggleGroup = (name: string) => {
        setExpanded((prev) => {
            const next = new Set(prev)
            if (next.has(name)) next.delete(name)
            else next.add(name)
            return next
        })
    }

    const q = search.trim().toLowerCase()

    const filteredGroups = useMemo(() => {
        const matchesItem = (it: Item) => {
            if (typeFilter !== 'all' && it.type !== typeFilter) return false
            if (!q) return true
            return (
                it.name.toLowerCase().includes(q) ||
                (it.path || '').toLowerCase().includes(q) ||
                it.file.toLowerCase().includes(q) ||
                it.description.toLowerCase().includes(q)
            )
        }

        const result: [string, GroupBucket][] = []
        for (const [name, bucket] of Object.entries(data.groups).sort(([a], [b]) => a.localeCompare(b))) {
            const filtered: GroupBucket = {
                pages: bucket.pages.filter(matchesItem),
                modals: bucket.modals.filter(matchesItem),
                drawers: bucket.drawers.filter(matchesItem),
            }
            if (filtered.pages.length + filtered.modals.length + filtered.drawers.length > 0) {
                result.push([name, filtered])
            }
        }
        return result
    }, [q, typeFilter])

    const isSearching = q.length > 0 || typeFilter !== 'all'

    const stats = [
        { label: 'Pages', value: data.counts.pages, icon: FileText, grad: 'from-blue-500 to-indigo-500' },
        { label: 'Modals', value: data.counts.modals, icon: Layers, grad: 'from-purple-500 to-violet-500' },
        { label: 'Drawers', value: data.counts.drawers, icon: PanelRight, grad: 'from-amber-500 to-orange-500' },
        { label: 'Groups', value: Object.keys(data.groups).length, icon: ListTree, grad: 'from-emerald-500 to-teal-500' },
    ]

    return (
        <div className="p-4 space-y-4">
            <div>
                <h1 className="text-xl font-bold">Pages & Modals & Drawers (List)</h1>
                <p className="text-sm text-muted-foreground">
                    Auto-generated inventory of every route, modal, and drawer in the app, grouped by module.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((card) => {
                    const Icon = card.icon
                    return (
                        <Card key={card.label} className="overflow-hidden shadow-none p-0 border gap-0">
                            <CardHeader className={cn('py-2 px-4 gap-0 bg-gradient-to-r', card.grad)}>
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-white/90 rounded-lg shadow">
                                        <Icon className="w-4 h-4 text-slate-700" />
                                    </div>
                                    <CardTitle className="text-sm font-semibold text-white/90">{card.label}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <h3 className="text-2xl font-bold">{card.value}</h3>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <Card className="shadow-none border">
                <CardContent className="p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, path, or file..."
                                className="pl-8"
                            />
                        </div>
                        <div className="flex gap-1.5">
                            {(['all', 'page', 'modal', 'drawer'] as const).map((t) => (
                                <Button
                                    key={t}
                                    type="button"
                                    size="sm"
                                    variant={typeFilter === t ? 'default' : 'outline'}
                                    onClick={() => setTypeFilter(t)}
                                >
                                    {t === 'all' ? 'All' : TYPE_META[t].label + 's'}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="divide-y rounded-lg border">
                        {filteredGroups.length === 0 && (
                            <div className="p-6 text-sm text-muted-foreground text-center">No matches found.</div>
                        )}
                        {filteredGroups.map(([name, bucket]) => {
                            const total = bucket.pages.length + bucket.modals.length + bucket.drawers.length
                            const isOpen = isSearching || expanded.has(name)
                            return (
                                <div key={name}>
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(name)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            {isOpen ? (
                                                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                            )}
                                            <span className="font-semibold text-sm">{titleCaseGroup(name)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {bucket.pages.length > 0 && (
                                                <Badge variant="outline" className={TYPE_META.page.className}>{bucket.pages.length} pages</Badge>
                                            )}
                                            {bucket.modals.length > 0 && (
                                                <Badge variant="outline" className={TYPE_META.modal.className}>{bucket.modals.length} modals</Badge>
                                            )}
                                            {bucket.drawers.length > 0 && (
                                                <Badge variant="outline" className={TYPE_META.drawer.className}>{bucket.drawers.length} drawers</Badge>
                                            )}
                                            <span className="text-xs text-muted-foreground w-8 text-right">{total}</span>
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div className="px-4 pb-4 bg-gray-50/50 dark:bg-gray-900/20">
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                                {([...bucket.pages, ...bucket.modals, ...bucket.drawers]).map((item, idx) => {
                                                    const meta = TYPE_META[item.type]
                                                    const Icon = meta.icon
                                                    return (
                                                        <Card
                                                            key={`${item.type}-${idx}-${item.file}`}
                                                            className="shadow-none p-0 gap-0"
                                                        >
                                                            <CardContent className="p-3 space-y-1.5">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Badge variant="outline" className={cn('gap-1', meta.className)}>
                                                                        <Icon className="h-3 w-3" />
                                                                        {meta.label}
                                                                    </Badge>
                                                                    <span className="font-medium text-sm truncate">{item.name}</span>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground font-mono truncate">
                                                                    {item.path || item.file}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {item.description}
                                                                </p>
                                                            </CardContent>
                                                        </Card>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
