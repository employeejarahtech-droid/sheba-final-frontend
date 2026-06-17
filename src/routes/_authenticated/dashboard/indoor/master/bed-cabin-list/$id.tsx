import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Main } from '@/components/layout/main';
import { AppHeader } from '@/components/layout/app-header';
import { Checkbox } from '@/components/ui/checkbox';
;
;
;
;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Bed, Save, Check, ChevronDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'

export const Route = createFileRoute('/_authenticated/dashboard/indoor/master/bed-cabin-list/$id')({
    component: EditBedCabin,
})

const bedCabinSchema = z.object({
    code: z.string().min(1, "Code is required"),
    type: z.string().min(1, "Bed/Cabin type is required"),
    ward: z.string().min(1, "Ward/Department is required"),
    price: z.coerce.number().min(0, "Price must be zero or positive"),
    status: z.enum(["Available", "Occupied", "Maintenance"]),
    show_in_admission: z.boolean().default(true),
})

type BedCabinValues = z.infer<typeof bedCabinSchema>

function EditBedCabin() {
    const { id } = Route.useParams()
    const navigate = useNavigate()
    const token = getCookie('accessToken');
    const [typeOpen, setTypeOpen] = useState(false);
    const [wardOpen, setWardOpen] = useState(false);

    const { data: bedCabinTypesData } = useQuery({
        queryKey: ['bed-cabin-types-list'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bed-cabin-type?limit=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to fetch bed & cabin types');
            const result = await res.json();
            return result.data?.items || [];
        },
        enabled: !!token,
    });

    const { data: wardsData } = useQuery({
        queryKey: ['bed-wards-list'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bed-ward?limit=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to fetch wards');
            const result = await res.json();
            return result.data?.items || [];
        },
        enabled: !!token,
    });

    const defaultOptions = [
        { name: "Bed", value: "Bed" },
        { name: "Cabin", value: "Cabin" },
        { name: "Special (ICU/CCU)", value: "Special" }
    ];

    const options = bedCabinTypesData && bedCabinTypesData.length > 0
        ? bedCabinTypesData.map((t: any) => ({ name: t.name, value: t.name }))
        : defaultOptions;

    const wardOptions = wardsData && wardsData.length > 0
        ? wardsData.map((w: any) => ({ name: w.name, value: w.name }))
        : [];

    const form = useForm<BedCabinValues>({
        resolver: zodResolver(bedCabinSchema) as any,
        defaultValues: {
            code: "",
            type: "Bed",
            ward: "",
            price: 0,
            status: "Available",
            show_in_admission: true,
        },
    })

    // Fetch existing data
    const { data: bedCabinData, isLoading, error, isError } = useQuery({
        queryKey: ['bed-cabin', id],
        queryFn: async () => {
            console.log('Fetching bed/cabin details for ID:', id);
            console.log('API URL:', `${import.meta.env.VITE_API_URL}/api/bed-cabin/${id}`);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bed-cabin/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Response status:', res.status);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('API Error:', res.status, errorText);
                throw new Error(`Failed to fetch bed/cabin details: ${res.status}`);
            }

            const result = await res.json();
            console.log('API Response:', result);
            return result.data;
        },
        enabled: !!token && !!id,
    })

    // Populate form when data is loaded
    useEffect(() => {
        if (bedCabinData) {
            console.log('Populating form with data:', bedCabinData);
            // Use setValue for each field to ensure proper reactivity
            form.setValue('code', bedCabinData.code);
            form.setValue('type', bedCabinData.type);
            form.setValue('ward', bedCabinData.ward);
            form.setValue('price', parseFloat(bedCabinData.price));
            form.setValue('status', bedCabinData.status);
            form.setValue('show_in_admission', bedCabinData.show_in_admission ?? true);

            // Log form values after setting
            setTimeout(() => {
                console.log('Form values after setting:', form.getValues());
            }, 100);
        }
    }, [bedCabinData, form])

    // Log query state for debugging
    console.log('Query state:', { isLoading, isError, error, data: bedCabinData });

    const updateMutation = useMutation({
        mutationFn: async (data: BedCabinValues) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bed-cabin/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update Bed/Cabin');
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Room/Bed updated successfully");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    })

    const onSubmit = (data: BedCabinValues) => {
        updateMutation.mutate(data);
    }

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-background">
                <AppHeader fixed />
                <Main className="p-6 lg:p-10 w-full flex-1">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center text-muted-foreground animate-pulse">
                            Loading bed/cabin details...
                        </div>
                    </div>
                </Main>
            </div>
        )
    }

    if (isError || !bedCabinData) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-background">
                <AppHeader fixed />
                <Main className="p-6 lg:p-10 w-full flex-1">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="text-red-500 font-semibold mb-2">Error loading data</div>
                            <div className="text-sm text-muted-foreground">
                                {error instanceof Error ? error.message : 'Failed to load bed/cabin details'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                                ID: {id} | Check browser console for details
                            </div>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => navigate({ to: '..' })}
                            >
                                Back to List
                            </Button>
                        </div>
                    </div>
                </Main>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen ">
            <AppHeader fixed />

            <Main className="flex flex-1 flex-col gap-6">
                <Form {...form}>
                    <form
                        id="edit-bed-cabin-form"
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-5 w-full min-w-[650px] max-w-[750px] mx-auto px-4"
                    >
                        {/* Header */}
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                            <div className="flex items-center gap-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate({ to: '..' })}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                        Edit Room/Bed
                                    </h1>
                                    <p className="text-muted-foreground text-sm">Update bed or cabin configuration and pricing</p>
                                </div>
                            </div>
                        </div>

                        {/* Physical Configuration */}
                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                        <Bed className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Edit Configuration</CardTitle>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Update the details for this room or bed</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Code */}
                                        <FormField<BedCabinValues>
                                            control={form.control}
                                            name="code"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Bed/Cabin Code</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. C-101, B-205"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-xs">
                                                        Unique identification code for this resource.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Type */}
                                        <FormField
                                            control={form.control}
                                            name="type"
                                            render={({ field }) => {
                                                const selectedOption = options.find(opt => opt.value === field.value);
                                                return (
                                                    <FormItem>
                                                        <FormLabel>Bed/Cabin Type</FormLabel>
                                                        <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <button
                                                                        type="button"
                                                                        className={cn(
                                                                            "w-full flex justify-between items-center px-3 py-1 border rounded-md h-9 text-sm bg-transparent border-gray-200 dark:border-gray-800",
                                                                            !field.value && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {selectedOption?.name || "Select type"}
                                                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                                                    </button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                                <Command>
                                                                    <CommandInput placeholder="Search type..." />
                                                                    <CommandList>
                                                                        <CommandEmpty>No bed & cabin type found.</CommandEmpty>
                                                                        <CommandGroup>
                                                                            {options.map((opt) => (
                                                                                <CommandItem
                                                                                    key={opt.value}
                                                                                    value={opt.value}
                                                                                    onSelect={() => {
                                                                                        field.onChange(opt.value);
                                                                                        setTypeOpen(false);
                                                                                    }}
                                                                                >
                                                                                    {opt.name}
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "h-4 w-4 ml-auto",
                                                                                            opt.value === field.value ? "opacity-100" : "opacity-0"
                                                                                        )}
                                                                                    />
                                                                                </CommandItem>
                                                                            ))}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormDescription className="text-xs">
                                                            Classification of the resource.
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Ward */}
                                        <FormField
                                            control={form.control}
                                            name="ward"
                                            render={({ field }) => {
                                                const selectedOption = wardOptions.find(opt => opt.value === field.value);
                                                return (
                                                    <FormItem>
                                                        <FormLabel>Ward / Department</FormLabel>
                                                        <Popover open={wardOpen} onOpenChange={setWardOpen}>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <button
                                                                        type="button"
                                                                        className={cn(
                                                                            "w-full flex justify-between items-center px-3 py-1 border rounded-md h-9 text-sm bg-transparent border-gray-200 dark:border-gray-800",
                                                                            !field.value && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {selectedOption?.name || field.value || "Select Ward / Department"}
                                                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                                                    </button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                                <Command>
                                                                    <CommandInput placeholder="Search ward..." />
                                                                    <CommandList>
                                                                        <CommandEmpty>No ward found. Please create one first.</CommandEmpty>
                                                                        <CommandGroup>
                                                                            {wardOptions.map((opt) => (
                                                                                <CommandItem
                                                                                    key={opt.value}
                                                                                    value={opt.value}
                                                                                    onSelect={() => {
                                                                                        field.onChange(opt.value);
                                                                                        setWardOpen(false);
                                                                                    }}
                                                                                >
                                                                                    {opt.name}
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "h-4 w-4 ml-auto",
                                                                                            opt.value === field.value ? "opacity-100" : "opacity-0"
                                                                                        )}
                                                                                    />
                                                                                </CommandItem>
                                                                            ))}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormDescription className="text-xs">
                                                            The location within the hospital.
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />

                                        {/* Price */}
                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Daily Charge (৳)</FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-600 transition-colors font-semibold">৳</span>
                                                            <Input
                                                                type="number"
                                                                placeholder="0.00"
                                                                className="pl-8"
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription className="text-xs">
                                                        The base daily billing amount.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Status */}
                                        <FormField
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Current Status</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select status" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                                            <SelectItem value="Available">Available</SelectItem>
                                                            <SelectItem value="Occupied">Occupied</SelectItem>
                                                            <SelectItem value="Maintenance">Under Maintenance</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription className="text-xs">
                                                        Current availability status.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Show in Admission Checkbox */}
                                        <FormField
                                            control={form.control}
                                            name="show_in_admission"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-6">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel className="cursor-pointer">
                                                            To See into Admission form
                                                        </FormLabel>
                                                        <FormDescription className="text-xs">
                                                            If checked, this Bed/Cabin will be visible and selectable in the new patient admission form allocation.
                                                        </FormDescription>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pb-10">
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                onClick={() => navigate({ to: '..' })}
                                disabled={updateMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="lg"
                                disabled={updateMutation.isPending}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[200px]"
                            >
                                {updateMutation.isPending ? (
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                                ) : (
                                    <Save className="h-5 w-5 mr-2" />
                                )}
                                {updateMutation.isPending ? "Updating..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </Main>
        </div>
    )
}
