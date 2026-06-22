import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCookie } from '@/lib/cookies'
import api from '@/lib/axios'

const DEFAULT_ITEMS = ['Checked by', 'Medical Technologist Lab.']

export default function ReportSettings() {
    const token = getCookie('accessToken')
    const queryClient = useQueryClient()
    const [items, setItems] = useState<string[]>(DEFAULT_ITEMS)

    const { data, isLoading } = useQuery({
        queryKey: ['company-settings'],
        queryFn: async () => {
            const res = await api.get('/company-settings')
            return res.data.data
        },
        enabled: !!token,
    })

    useEffect(() => {
        if (data?.report_footer_items) {
            try {
                const parsed = JSON.parse(data.report_footer_items)
                if (Array.isArray(parsed) && parsed.length > 0) setItems(parsed)
            } catch { /* keep defaults */ }
        }
    }, [data])

    const saveMutation = useMutation({
        mutationFn: async (itemsToSave: string[]) => {
            const formData = new FormData()
            formData.append('report_footer_items', JSON.stringify(itemsToSave))
            const res = await api.put('/company-settings', formData)
            return res.data
        },
        onSuccess: () => {
            toast.success('Report footer items saved')
            queryClient.invalidateQueries({ queryKey: ['company-settings'] })
        },
        onError: () => toast.error('Failed to save'),
    })

    const addItem = () => setItems([...items, ''])
    const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))
    const updateItem = (idx: number, val: string) => setItems(items.map((it, i) => i === idx ? val : it))

    return (
        <>
            <AppHeader fixed />
            <Main>
                <div className="p-6 max-w-2xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold tracking-tight">Report Settings</h1>
                        <p className="text-sm text-muted-foreground mt-1">Configure report footer items shown on pathology reports</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Report Footer
                                <Button size="sm" variant="outline" onClick={addItem} disabled={saveMutation.isPending}>
                                    <Plus className="h-4 w-4 mr-1" /> Add Item
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <>
                                    {items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground w-6">{idx + 1}.</span>
                                            <Input
                                                value={item}
                                                onChange={(e) => updateItem(idx, e.target.value)}
                                                placeholder="Enter footer item text"
                                                className="flex-1"
                                                disabled={saveMutation.isPending}
                                            />
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => removeItem(idx)}
                                                disabled={saveMutation.isPending || items.length <= 1}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                    <div className="pt-4 border-t">
                                        <Button
                                            onClick={() => saveMutation.mutate(items)}
                                            disabled={saveMutation.isPending}
                                            className="w-full"
                                        >
                                            {saveMutation.isPending ? (
                                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                                            ) : (
                                                <><Save className="h-4 w-4 mr-2" /> Save Changes</>
                                            )}
                                        </Button>
                                    </div>
                                </>
                        </CardContent>
                    </Card>
                </div>
            </Main>
        </>
    )
}
