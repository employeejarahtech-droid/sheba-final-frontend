import { useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, Database, ShieldCheck } from 'lucide-react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import api from '@/lib/axios'

interface ResetCategories {
    patientAdmissions: boolean
    indoorBilling: boolean
    outdoorBilling: boolean
    labResults: boolean
    accounting: boolean
    staffHr: boolean
    assetsPurchase: boolean
    auditLogs: boolean
    doctors: boolean
}

const CATEGORY_FIELDS: Array<{
    key: keyof ResetCategories
    label: string
    hint: string
}> = [
    { key: 'patientAdmissions', label: 'Patient & Admissions (2 tables)', hint: 'admissions, bed history' },
    { key: 'indoorBilling', label: 'Indoor Billing (10 tables)', hint: 'final bills, payments, distributions' },
    { key: 'outdoorBilling', label: 'Outdoor Billing (7 tables)', hint: 'invoices, collections, discounts' },
    { key: 'labResults', label: 'Lab Results (35+ tables)', hint: 'CBC, biochemical, immunology, etc.' },
    { key: 'accounting', label: 'Accounting (5 tables)', hint: 'transactions, journals, incomes, expenses' },
    { key: 'staffHr', label: 'Staff & HR (4 tables)', hint: 'staff, attendance, leaves, payrolls' },
    { key: 'assetsPurchase', label: 'Assets & Purchase (5 tables)', hint: 'assets, maintenance, requests, GRN' },
    { key: 'auditLogs', label: 'Audit & Logs (4 tables)', hint: 'notifications, messages, logs' },
    { key: 'doctors', label: 'Doctors (1 table)', hint: 'doctors' },
]

function ResetDatabaseCard() {
    const [confirmation, setConfirmation] = useState('')
    const [acknowledged, setAcknowledged] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [done, setDone] = useState(false)
    const [categories, setCategories] = useState<ResetCategories>({
        patientAdmissions: true,
        indoorBilling: true,
        outdoorBilling: true,
        labResults: true,
        accounting: true,
        staffHr: true,
        assetsPurchase: true,
        auditLogs: true,
        doctors: false,
    })

    const handleReset = async () => {
        if (confirmation !== 'RESET DATABASE' || !acknowledged) {
            toast.error('Please confirm by typing "RESET DATABASE" and acknowledging the warning')
            return
        }

        setIsResetting(true)
        try {
            const { data } = await api.post('/database-reset/reset-database', {
                confirmation: 'RESET DATABASE',
                acknowledged: true,
                categories,
            })
            if (data.status) {
                setDone(true)
                toast.success('Database reset successfully!', {
                    description: 'All transactional data has been cleared. Master data preserved.',
                })
            } else {
                throw new Error(data.message || 'Reset failed')
            }
        } catch (err: any) {
            toast.error('Database reset failed', {
                description: err?.response?.data?.message || err.message || 'Unknown error occurred',
            })
        } finally {
            setIsResetting(false)
        }
    }

    if (done) {
        return (
            <Card className='border-green-500 bg-green-50 dark:bg-green-950'>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-green-700 dark:text-green-400'>
                        <CheckCircle2 className='h-6 w-6' />
                        Database Reset Complete
                    </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <p className='text-sm text-muted-foreground'>
                        Your database has been successfully reset. All transactional data has been cleared while
                        preserving master configuration data.
                    </p>
                    <div className='space-y-2 text-sm'>
                        <h4 className='font-semibold text-green-700 dark:text-green-400'>What was cleared:</h4>
                        <ul className='list-disc list-inside space-y-1 text-muted-foreground'>
                            <li>Patient admissions and billing records</li>
                            <li>Lab test results and reports</li>
                            <li>Financial transactions</li>
                            <li>Staff records and payroll</li>
                            <li>Asset registry and maintenance logs</li>
                        </ul>
                    </div>
                    <div className='space-y-2 text-sm'>
                        <h4 className='font-semibold text-green-700 dark:text-green-400'>What was preserved:</h4>
                        <ul className='list-disc list-inside space-y-1 text-muted-foreground'>
                            <li>User accounts and roles</li>
                            <li>Chart of accounts</li>
                            <li>Test definitions and categories</li>
                            <li>Service configurations</li>
                            <li>Department and ward settings</li>
                        </ul>
                    </div>
                    <Button onClick={() => window.location.reload()} className='w-full bg-green-600 hover:bg-green-700'>
                        Continue to Application
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className='space-y-6'>
            <Alert variant='destructive' className='border-red-500 bg-red-50 dark:bg-red-950'>
                <AlertTriangle className='h-5 w-5' />
                <AlertTitle className='text-red-700 dark:text-red-400'>Critical Warning</AlertTitle>
                <AlertDescription className='text-red-600 dark:text-red-500'>
                    You are about to permanently delete ALL transactional data from your database. This action
                    cannot be undone.
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Database className='h-5 w-5 text-red-600' />
                        Transactional Data to be Cleared
                    </CardTitle>
                    <CardDescription>The following data will be permanently deleted (~82 tables)</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='grid gap-4 md:grid-cols-2'>
                        {CATEGORY_FIELDS.map((field) => (
                            <div key={field.key} className='flex items-start space-x-3'>
                                <Checkbox
                                    id={`cat-${field.key}`}
                                    checked={categories[field.key]}
                                    onCheckedChange={(checked) =>
                                        setCategories({ ...categories, [field.key]: !!checked })
                                    }
                                />
                                <div className='space-y-1 leading-none'>
                                    <Label htmlFor={`cat-${field.key}`}>{field.label}</Label>
                                    <p className='text-xs text-muted-foreground'>{field.hint}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className='border-green-500 bg-green-50 dark:bg-green-950'>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-green-700 dark:text-green-400'>
                        <ShieldCheck className='h-5 w-5' />
                        Master Data to be Preserved
                    </CardTitle>
                    <CardDescription>The following configuration data will be kept intact (~22 tables)</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='grid gap-4 md:grid-cols-2'>
                        <div className='space-y-2'>
                            <h4 className='font-semibold text-sm text-green-700 dark:text-green-400'>User Management</h4>
                            <p className='text-xs text-muted-foreground'>users, roles, permissions</p>
                        </div>
                        <div className='space-y-2'>
                            <h4 className='font-semibold text-sm text-green-700 dark:text-green-400'>System Settings</h4>
                            <p className='text-xs text-muted-foreground'>company settings, payment methods</p>
                        </div>
                        <div className='space-y-2'>
                            <h4 className='font-semibold text-sm text-green-700 dark:text-green-400'>Medical Reference</h4>
                            <p className='text-xs text-muted-foreground'>patient types, doctor types, bed types</p>
                        </div>
                        <div className='space-y-2'>
                            <h4 className='font-semibold text-sm text-green-700 dark:text-green-400'>Chart of Accounts</h4>
                            <p className='text-xs text-muted-foreground'>236 accounts (CRITICAL - never cleared)</p>
                        </div>
                        <div className='space-y-2'>
                            <h4 className='font-semibold text-sm text-green-700 dark:text-green-400'>Lab Master</h4>
                            <p className='text-xs text-muted-foreground'>186 tests, categories, machines</p>
                        </div>
                        <div className='space-y-2'>
                            <h4 className='font-semibold text-sm text-green-700 dark:text-green-400'>Services</h4>
                            <p className='text-xs text-muted-foreground'>service categories, clinic services</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className='border-red-500'>
                <CardHeader>
                    <CardTitle className='text-red-700 dark:text-red-400'>Final Confirmation</CardTitle>
                    <CardDescription>To proceed, you must confirm this action</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='space-y-2'>
                        <Label htmlFor='confirmation'>Type "RESET DATABASE" to confirm</Label>
                        <Input
                            id='confirmation'
                            type='text'
                            placeholder='RESET DATABASE'
                            value={confirmation}
                            onChange={(e) => setConfirmation(e.target.value)}
                            className='border-red-500 focus-visible:ring-red-500'
                        />
                    </div>
                    <div className='flex items-center space-x-2'>
                        <Checkbox
                            id='acknowledge'
                            checked={acknowledged}
                            onCheckedChange={(checked) => setAcknowledged(!!checked)}
                        />
                        <Label htmlFor='acknowledge' className='text-sm font-medium leading-none'>
                            I understand this will permanently delete all transactional data and cannot be undone
                        </Label>
                    </div>
                    <div className='flex gap-4'>
                        <Button
                            onClick={handleReset}
                            disabled={confirmation !== 'RESET DATABASE' || !acknowledged || isResetting}
                            variant='destructive'
                            className='flex-1'
                        >
                            {isResetting ? 'Resetting Database...' : 'Reset Database'}
                        </Button>
                        <Button
                            onClick={() => {
                                setConfirmation('')
                                setAcknowledged(false)
                            }}
                            variant='outline'
                            disabled={isResetting}
                        >
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Alert>
                <AlertTitle>Recommendation</AlertTitle>
                <AlertDescription>
                    Before performing a database reset, ensure you have a recent backup. You can create backups from
                    the <span className='font-semibold'>Backups</span> menu in the Administration section.
                </AlertDescription>
            </Alert>
        </div>
    )
}

export default function ResetDatabase() {
    return (
        <div className='space-y-6'>
            <div className='space-y-2'>
                <h1 className='text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent'>
                    Reset Database
                </h1>
                <p className='text-muted-foreground'>
                    Clear all transactional data while keeping master configuration data
                </p>
            </div>
            <ResetDatabaseCard />
        </div>
    )
}
