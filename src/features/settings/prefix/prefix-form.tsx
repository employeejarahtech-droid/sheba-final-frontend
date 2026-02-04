import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    invoicePrefix: z.string().min(1, { message: 'Invoice prefix is required.' }),
    patientPrefix: z.string().min(1, { message: 'Patient prefix is required.' }),
    appointmentPrefix: z.string().min(1, { message: 'Appointment prefix is required.' }),
    labTestPrefix: z.string().min(1, { message: 'Lab Test prefix is required.' }),
    admissionPrefix: z.string().min(1, { message: 'Admission prefix is required.' }),
    prescriptionPrefix: z.string().min(1, { message: 'Prescription prefix is required.' }),
})

type PrefixFormValues = z.infer<typeof prefixFormSchema>

// This can come from your database or API.
const defaultValues: Partial<PrefixFormValues> = {
    invoicePrefix: 'INV-',
    patientPrefix: 'PAT-',
    appointmentPrefix: 'APT-',
    labTestPrefix: 'LAB-',
    admissionPrefix: 'ADM-',
    prescriptionPrefix: 'RX-',
}

export function PrefixForm() {
    const token = getCookie('accessToken');
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
        resolver: zodResolver(prefixFormSchema),
        defaultValues,
        values: settings, // Populate form when settings are fetched
    });

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

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
                className='space-y-8'
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name='invoicePrefix'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Invoice Prefix</FormLabel>
                                <FormControl>
                                    <Input placeholder="INV-" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Prefix for generating invoice numbers.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name='patientPrefix'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Patient ID Prefix</FormLabel>
                                <FormControl>
                                    <Input placeholder="PAT-" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Prefix for unique patient identifiers.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name='appointmentPrefix'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Appointment Prefix</FormLabel>
                                <FormControl>
                                    <Input placeholder="APT-" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Prefix for appointment reference numbers.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name='labTestPrefix'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Lab Test Prefix</FormLabel>
                                <FormControl>
                                    <Input placeholder="LAB-" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Prefix for laboratory test IDs.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name='admissionPrefix'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Admission Prefix</FormLabel>
                                <FormControl>
                                    <Input placeholder="ADM-" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Prefix for patient admission records.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name='prescriptionPrefix'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Prescription Prefix</FormLabel>
                                <FormControl>
                                    <Input placeholder="RX-" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Prefix for doctor prescriptions.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button type='submit' disabled={mutation.isPending}>
                    {mutation.isPending ? 'Saving...' : 'Update prefix settings'}
                </Button>
            </form>
        </Form>
    )
}
