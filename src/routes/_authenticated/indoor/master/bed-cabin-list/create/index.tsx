import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Main } from '@/components/layout/main';
import { AppHeader } from '@/components/layout/app-header';
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
import { ArrowLeft, CircleCheck, Bed } from 'lucide-react'; import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import { useMutation } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'

export const Route = createFileRoute('/_authenticated/indoor/master/bed-cabin-list/create/')({
    component: CreateBedCabin,
})

const bedCabinSchema = z.object({
    code: z.string().min(1, "Code is required"),
    type: z.enum(["Cabin", "Bed", "Special"]),
    ward: z.string().min(1, "Ward/Department is required"),
    price: z.coerce.number().min(0, "Price must be zero or positive"),
})

type BedCabinValues = z.infer<typeof bedCabinSchema>

function CreateBedCabin() {
    const navigate = useNavigate()
    const token = getCookie('accessToken');

    const form = useForm<BedCabinValues>({
        resolver: zodResolver(bedCabinSchema) as any,
        defaultValues: {
            code: "",
            type: "Bed",
            ward: "",
            price: 0,
        },
    })

    const createMutation = useMutation({
        mutationFn: async (data: BedCabinValues) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bed-cabin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to register Bed/Cabin');
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Room/Bed registered successfully");
            navigate({ to: '..' });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });

    const onSubmit = (data: BedCabinValues) => {
        createMutation.mutate(data);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-background">
            <AppHeader fixed />

            <Main className="p-6 lg:p-10 w-full flex-1">
                <div className="space-y-6 max-w-5xl mx-auto">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-1 border-gray-200 dark:border-gray-800 pb-4">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent uppercase">
                                Register New Room/Bed
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm font-medium">
                                Add new physical capacity to the hospital management system
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="hidden sm:flex items-center gap-2 rounded-xl border-gray-200 bg-white shadow-sm transition-all hover:bg-gray-50"
                                onClick={() => navigate({ to: '..' })}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                            <Button
                                type="submit"
                                form="create-bed-cabin-form"
                                disabled={createMutation.isPending}
                                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25 border-none px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] font-bold"
                            >
                                {createMutation.isPending ? (
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                    <CircleCheck className="h-4 w-4" />
                                )}
                                {createMutation.isPending ? "Registering..." : "Confirm & Register"}
                            </Button>
                        </div>
                    </div>

                    <Form {...form}>
                        <form id="create-bed-cabin-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <Card className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl shadow-sm overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg py-0 gap-0">
                                <CardHeader className="p-0 border-b-1 border-blue-100 dark:border-blue-900 gap-0">
                                    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 px-6 py-4 flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                                            <Bed className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                                Physical Configuration
                                            </CardTitle>
                                            <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                                Define the technical details for this room or bed
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 md:p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                                        {/* Code */}
                                        <FormField<BedCabinValues>
                                            control={form.control}
                                            name="code"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                        Bed/Cabin Code
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. C-101, B-205"
                                                            className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all shadow-sm"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-[10px] text-muted-foreground mt-0">
                                                        Unique identification code for this resource.
                                                    </FormDescription>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Type */}
                                        <FormField
                                            control={form.control}
                                            name="type"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Resource Type</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-full !h-auto h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm">
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                                            <SelectItem value="Bed">Bed</SelectItem>
                                                            <SelectItem value="Cabin">Cabin</SelectItem>
                                                            <SelectItem value="Special">Special (ICU/CCU)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription className="text-[10px] text-muted-foreground mt-0">
                                                        Classification of the resource.
                                                    </FormDescription>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Ward */}
                                        <FormField
                                            control={form.control}
                                            name="ward"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                        Ward / Department
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. VIP Ward, General Ward 2"
                                                            className="h-10 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all shadow-sm"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-[10px] text-muted-foreground mt-0">
                                                        The location within the hospital.
                                                    </FormDescription>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Price */}
                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2">
                                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Daily Charge (৳)</FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-600 transition-colors font-semibold">৳</span>
                                                            <Input
                                                                type="number"
                                                                placeholder="0.00"
                                                                className="h-10 pl-8 rounded-md border-gray-200 dark:border-gray-800 bg-transparent focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all shadow-sm"
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription className="text-[10px] text-muted-foreground mt-0">
                                                        The base daily billing amount.
                                                    </FormDescription>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Separator className="my-6" />

                                    <div className="flex justify-end gap-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="px-8 h-12 rounded-xl border-gray-200 font-semibold shadow-sm transition-all hover:bg-gray-50"
                                            onClick={() => navigate({ to: '..' })}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-xl shadow-blue-500/30 border-none px-10 h-12 rounded-xl transition-all font-bold"
                                        >
                                            <CircleCheck className="h-5 w-5 mr-2" />
                                            Confirm & Register
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </Form>
                </div>
            </Main>
        </div>
    )
}
