import { AppHeader } from '@/components/layout/app-header'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable } from '@/components/DataTable'
import { useState, useMemo, useEffect } from 'react'
import { getCookie } from '@/lib/cookies'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, HardDrive, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function BackupsList() {
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const token = getCookie('accessToken')
    const queryClient = useQueryClient()

    const { data: backupsData, isLoading } = useQuery({
        queryKey: ['db-backups', page, limit, search],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/database/backups?page=${page}&limit=${limit}&search=${search}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) throw new Error('Failed to fetch backups')
            return res.json()
        },
        enabled: !!token,
        refetchOnMount: 'always',
    })

    const backups = backupsData?.data?.items || []
    const meta = backupsData?.data?.meta || { total: 0, page: 1, limit: 10 }

    const handleDownload = async (filename: string) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/database/backups/${filename}/download`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) throw new Error('Download failed')
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
        } catch {
            toast.error('Download failed')
        }
    }

    const handleDelete = async (filename: string) => {
        if (!confirm(`Delete backup "${filename}"?`)) return
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/database/backups/${filename}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
            const json = await res.json()
            if (json.status) {
                toast.success(json.message || 'Backup deleted')
                queryClient.invalidateQueries({ queryKey: ['db-backups'] })
            } else {
                toast.error(json.message || 'Delete failed')
            }
        } catch {
            toast.error('Something went wrong')
        }
    }

    const columns = useMemo(() => [
        {
            data: 'filename',
            title: 'Filename',
            className: 'font-medium',
        },
        {
            data: 'size',
            title: 'Size',
            render: (data: any) => {
                if (!data) return '-'
                const size = Number(data)
                if (size < 1024) return `${size} B`
                if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
                return `${(size / (1024 * 1024)).toFixed(2)} MB`
            },
        },
        {
            data: 'created_at',
            title: 'Created At',
            render: (data: any) => {
                if (!data) return '-'
                const date = new Date(data)
                return `<span class="text-sm text-muted-foreground">${date.toLocaleString()}</span>`
            },
        },
        {
            data: null,
            title: 'Actions',
            orderable: false,
            render: (_data: any, _type: string, row: any) => {
                return `<div class="flex gap-2">
                    <button class="download-backup-btn inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3" data-filename="${row.filename}" title="Download">
                        ⬇ Download
                    </button>
                    <button class="delete-backup-btn inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors border border-destructive/50 bg-background hover:bg-destructive hover:text-white h-8 px-3" data-filename="${row.filename}" title="Delete">
                        🗑 Delete
                    </button>
                </div>`
            },
        },
    ], [])

    useEffect(() => {
        const handleClick = (e: Event) => {
            const target = e.target as HTMLElement

            const downloadBtn = target.closest('.download-backup-btn')
            if (downloadBtn) {
                const filename = (downloadBtn as HTMLElement).getAttribute('data-filename')
                if (filename) handleDownload(filename)
                return
            }

            const deleteBtn = target.closest('.delete-backup-btn')
            if (deleteBtn) {
                const filename = (deleteBtn as HTMLElement).getAttribute('data-filename')
                if (filename) handleDelete(filename)
            }
        }

        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
    }, [token])

    return (
        <>
            <AppHeader fixed />

            <main className="p-4">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <HardDrive className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Database Backups</h1>
                        <p className="text-muted-foreground">View and manage database backup files</p>
                    </div>
                </div>

                <div className="pt-2">
                    {isLoading ? (
                        <div className="flex justify-center p-10">
                            <Loader2 className="animate-spin" />
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={backups}
                            meta={meta}
                            onPageChange={setPage}
                            onLimitChange={(newLimit) => {
                                setLimit(newLimit)
                                setPage(1)
                            }}
                            search={search}
                            onSearchChange={(value) => {
                                setSearch(value)
                                setPage(1)
                            }}
                        />
                    )}
                </div>
            </main>
        </>
    )
}
