import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'

const prefixFormSchema = z.object({
    // Sales Documents
    invoicePrefix: z.string().min(1, { message: 'Invoice format is required.' }),
    invoiceSequence: z.coerce.number().min(0, { message: 'Sequence must be at least 0' }),

    // Medical Documents
    patientPrefix: z.string().min(1, { message: 'Patient format is required.' }),
    patientSequence: z.coerce.number().min(0, { message: 'Sequence must be at least 0' }),

    appointmentPrefix: z.string().min(1, { message: 'Appointment format is required.' }),
    appointmentSequence: z.coerce.number().min(0, { message: 'Sequence must be at least 0' }),

    prescriptionPrefix: z.string().min(1, { message: 'Prescription format is required.' }),
    prescriptionSequence: z.coerce.number().min(0, { message: 'Sequence must be at least 0' }),

    // Lab & Tests
    labTestPrefix: z.string().min(1, { message: 'Lab Test format is required.' }),
    labTestSequence: z.coerce.number().min(0, { message: 'Sequence must be at least 0' }),

    // Admission
    admissionPrefix: z.string().min(1, { message: 'Admission format is required.' }),
    admissionSequence: z.coerce.number().min(0, { message: 'Sequence must be at least 0' }),

    // Doctor
    doctorPrefix: z.string().min(1, { message: 'Doctor format is required.' }),
    doctorSequence: z.coerce.number().min(0, { message: 'Sequence must be at least 0' }),
})

type PrefixFormValues = z.infer<typeof prefixFormSchema>

// Default values with formats and sequences
const defaultValues: Partial<PrefixFormValues> = {
    invoicePrefix: 'INV-{0000}',
    invoiceSequence: 1,

    patientPrefix: 'PAT-{0000}',
    patientSequence: 1,

    appointmentPrefix: 'APT-{0000}',
    appointmentSequence: 1,

    prescriptionPrefix: 'RX-{0000}',
    prescriptionSequence: 1,

    labTestPrefix: 'LAB-{0000}',
    labTestSequence: 1,

    admissionPrefix: 'ADM-{0000}',
    admissionSequence: 1,

    doctorPrefix: 'DOC-{0000}',
    doctorSequence: 1,
}

export function PrefixForm() {
    const { accessToken: token } = useAuthStore();
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
        queryKey: ['app-settings'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/app-settings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch settings');
            const json = await res.json();
            return json.data || {};
        },
        enabled: !!token,
    });

    const form = useForm<PrefixFormValues>({
        resolver: zodResolver(prefixFormSchema) as any,
        defaultValues,
    });

    // Update form values when settings are loaded, merging with defaults
    React.useEffect(() => {
        if (settings) {
            // Convert string sequences to numbers and merge with defaults
            const processedSettings = {
                ...defaultValues,
                ...settings,
                // Ensure all sequence fields are numbers
                invoiceSequence: typeof settings.invoiceSequence === 'number' ? settings.invoiceSequence : Number(settings.invoiceSequence || 1),
                patientSequence: typeof settings.patientSequence === 'number' ? settings.patientSequence : Number(settings.patientSequence || 1),
                appointmentSequence: typeof settings.appointmentSequence === 'number' ? settings.appointmentSequence : Number(settings.appointmentSequence || 1),
                prescriptionSequence: typeof settings.prescriptionSequence === 'number' ? settings.prescriptionSequence : Number(settings.prescriptionSequence || 1),
                labTestSequence: typeof settings.labTestSequence === 'number' ? settings.labTestSequence : Number(settings.labTestSequence || 1),
                admissionSequence: typeof settings.admissionSequence === 'number' ? settings.admissionSequence : Number(settings.admissionSequence || 1),
                doctorSequence: typeof settings.doctorSequence === 'number' ? settings.doctorSequence : Number(settings.doctorSequence || 1),
            };
            form.reset(processedSettings);
        }
    }, [settings, form]);

    const mutation = useMutation({
        mutationFn: async (data: PrefixFormValues) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/app-settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to save settings');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Settings saved successfully');
            queryClient.invalidateQueries({ queryKey: ['app-settings'] });
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to save settings');
        },
    });

    if (isLoading) {
        return <div>Loading settings...</div>;
    }

    const onSubmit = (data: PrefixFormValues) => {
        mutation.mutate(data);
    };

    return (
        <div className="space-y-6">
            {/* Dynamic Format Guide */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                <CardHeader>
                    <CardTitle className="text-sm">Dynamic Format Guide</CardTitle>
                    <CardDescription className="text-xs">
                        Use these variables in your formats:
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        <Badge variant="secondary" className="font-mono">{'{0000}'}</Badge>
                        <span className="text-muted-foreground text-xs">Sequence (4 digits)</span>

                        <Badge variant="secondary" className="font-mono">{'{0}'}</Badge>
                        <span className="text-muted-foreground text-xs">Sequence (no padding)</span>

                        <Badge variant="secondary" className="font-mono">{'{year}'}</Badge>
                        <span className="text-muted-foreground text-xs">Full year (2026)</span>

                        <Badge variant="secondary" className="font-mono">{'{YY}'}</Badge>
                        <span className="text-muted-foreground text-xs">Short year (26)</span>

                        <Badge variant="secondary" className="font-mono">{'{month}'}</Badge>
                        <span className="text-muted-foreground text-xs">Month (01-12)</span>

                        <Badge variant="secondary" className="font-mono">{'{MM}'}</Badge>
                        <span className="text-muted-foreground text-xs">Month (01-12)</span>

                        <Badge variant="secondary" className="font-mono">{'{day}'}</Badge>
                        <span className="text-muted-foreground text-xs">Day (01-31)</span>

                        <Badge variant="secondary" className="font-mono">{'{DD}'}</Badge>
                        <span className="text-muted-foreground text-xs">Day (01-31)</span>

                        <Badge variant="secondary" className="font-mono">{'{ID}'}</Badge>
                        <span className="text-muted-foreground text-xs">Invoice ID (36)</span>
                    </div>
                    <div className="mt-3 p-3 bg-white dark:bg-zinc-900 rounded-md border text-xs">
                        <strong className="text-muted-foreground">Example:</strong> <code className="text-blue-600 dark:text-blue-400">INV-{'{year}{MM}{DD}'}-{'{ID}'}</code> → <span className="text-green-600 dark:text-green-400">INV-20260228-36</span>
                    </div>
                </CardContent>
            </Card>

            <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => onSubmit(data)) as any} className="space-y-8">

                    {/* Outdoor Invoice */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Outdoor Invoice</CardTitle>
                            <CardDescription>Outdoor invoice and billing document formats</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name='invoicePrefix'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Invoice Format</FormLabel>
                                            <FormControl>
                                                <Input placeholder="INV-{0000}" className="font-mono" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Pattern for invoice numbers
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name='invoiceSequence'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Starting Number</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="1"
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Current sequence number
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Medical Documents */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Medical Documents</CardTitle>
                            <CardDescription>Patient, appointment, and prescription formats</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Patient */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name='patientPrefix'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Patient ID Format</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="PAT-{0000}" className="font-mono" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name='patientSequence'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Starting Number</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="1"
                                                        {...field}
                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Appointment */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name='appointmentPrefix'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Appointment Format</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="APT-{0000}" className="font-mono" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name='appointmentSequence'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Starting Number</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="1"
                                                        {...field}
                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Prescription */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name='prescriptionPrefix'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Prescription Format</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="RX-{0000}" className="font-mono" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name='prescriptionSequence'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Starting Number</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="1"
                                                        {...field}
                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Lab & Tests */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Lab & Tests</CardTitle>
                            <CardDescription>Laboratory and test report formats</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name='labTestPrefix'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Lab Test Format</FormLabel>
                                            <FormControl>
                                                <Input placeholder="LAB-{0000}" className="font-mono" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Format for laboratory tests
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name='labTestSequence'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Starting Number</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="1"
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Admission */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Admission</CardTitle>
                            <CardDescription>Patient admission record formats</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name='admissionPrefix'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Admission Format</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ADM-{0000}" className="font-mono" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Format for admissions
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name='admissionSequence'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Starting Number</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="1"
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Doctor */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Master Data</CardTitle>
                            <CardDescription>Doctor and staff identifier formats</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name='doctorPrefix'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Doctor Format</FormLabel>
                                            <FormControl>
                                                <Input placeholder="DOC-{0000}" className="font-mono" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Format for doctor IDs
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name='doctorSequence'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Starting Number</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="1"
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type='submit' disabled={mutation.isPending} size="lg">
                            {mutation.isPending ? 'Saving...' : 'Save All Settings'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
