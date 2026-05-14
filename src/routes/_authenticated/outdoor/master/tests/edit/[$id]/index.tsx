import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Main } from '@/components/layout/main';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCookie } from '@/lib/cookies'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, FlaskConical, ChevronDown, Check } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const Route = createFileRoute('/_authenticated/outdoor/master/tests/edit/$id/')({
    component: EditTest,
})

const testSchema = z.object({
    name: z.string().min(1, "Required"),
    category_id: z.number().min(1, "Required"),
    match_table_name: z.number().min(1, "Required"),
    status: z.string().min(1, "Required"),
    price: z
        .any()
        .transform((val) => Number(val))
        .refine((val) => !isNaN(val), {
            message: "Price must be a valid number",
        }),
    sample_normal_range: z.string().optional(),
})

type TestValues = z.infer<typeof testSchema>

function EditTest() {
    const [open, setOpen] = useState(false);
    const [catOpen, setCatOpen] = useState(false);
    const [page] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 10;
    const { id } = Route.useParams()
    const navigate = useNavigate()
    const token = getCookie('accessToken')
    const queryClient = useQueryClient()


    const form = useForm<TestValues>({
        resolver: zodResolver(testSchema),
        defaultValues: {
            name: "",
            category_id: 0,
            match_table_name: 0,
            status: "active",
            price: 0,
            sample_normal_range: "",
        },
    })

    // Fetch existing test data
    const { data: testData, isLoading, error } = useQuery({
        queryKey: ["test", id],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/tests/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch test");
            const result = await res.json();
            return result.data;
        },
        enabled: !!token && !!id,
    });

    // Fetch test categories
    const { data: categoriesData } = useQuery({
        queryKey: ["test-category"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/test-category`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch categories");
            const result = await res.json();
            return result.data?.rows || result.data || [];
        },
        enabled: !!token,
    })

    const { data: testTables } = useQuery({
        queryKey: ["test-tables", page, search],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/test-tables?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch tests");
            return res.json();
        },
        enabled: !!token,
        placeholderData: (prev) =>
            prev
                ? prev
                : {
                    data: {
                        items: [],
                        total: 0,
                    },
                },
    });

    // Populate form when data is loaded
    useEffect(() => {
        if (!testData) return;

        const categoryId = Number(
            categoriesData?.items?.find(
                (c: any) => c.name === testData?.category?.name
            )?.id
        );

        const tableId = Number(
            testTables?.data?.items?.find(
                (t: any) => t.table_name === testData.match_table_name
            )?.id
        );

        // Reset form values only if IDs are resolved or default to 0/empty
        form.reset({
            name: testData.name,
            category_id: categoryId || 0,
            match_table_name: tableId || 0,
            status: testData.status || "active",
            price: Number(testData.price),
            sample_normal_range: testData.sample_normal_range || "",
        });
    }, [testData, testTables, categoriesData, form]);

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (data: TestValues) => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/tests/${id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(data),
                }
            );
            if (!res.ok) throw new Error("Failed to update test");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tests"] });
            queryClient.invalidateQueries({ queryKey: ["test", id] });
            toast.success("Test updated successfully");
            navigate({ to: "/outdoor/master/tests", search: { page: 1, limit: 10, search: '' } });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update test");
        },
    })

    const onSubmit = (data: TestValues) => {
        // Find the selected table object by its id
        const selectedTable = testTables?.data?.items?.find(
            (table: any) => Number(table.id) === Number(data.match_table_name)
        );

        if (!selectedTable) {
            toast.error("Please select a valid table");
            return;
        }

        const payload = {
            name: data.name,
            category_id: Number(data.category_id),
            price: Number(data.price),
            match_table_name: selectedTable.table_name || selectedTable.display_name,
            status: data.status,
            sample_normal_range: data.sample_normal_range,
        };

        updateMutation.mutate(payload);
    };


    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] text-center">
                <p className="text-muted-foreground mb-4">Failed to load test data</p>
                <Button
                    variant="outline"
                    onClick={() => navigate({ to: "/outdoor/master/tests", search: { page: 1, limit: 10, search: '' } })}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Tests
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-background">
            <AppHeader fixed />

            <Main className="p-6 lg:p-8 w-full flex-1">
                <div className="space-y-6 max-w-3xl mx-auto">
                    {/* Page Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                                Edit Test
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Update test details and pricing
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            className="gap-2"
                            onClick={() => navigate({ to: '/outdoor/master/tests', search: { page: 1, limit: 10, search: '' } })}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </div>

                    <Form {...form}>
                        <form id="edit-test-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <Card className="border dark:border-gray-800 overflow-hidden pt-0">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b-1 dark:border-gray-800 py-2 gap-0">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-sm">
                                            <FlaskConical className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-semibold">Test Information</CardTitle>
                                            <CardDescription className="text-xs mt-0.5">
                                                Update the details for this diagnostic test
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 md:px-6">
                                    <div className="space-y-5">
                                        {/* Test Name */}
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Test Name</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. CBC, Lipid Profile"
                                                            className="h-10"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {/* Category */}
                                            <FormField
                                                control={form.control}
                                                name="category_id"
                                                render={({ field }) => {
                                                    const selectedCategory = categoriesData?.items?.find(
                                                        (cat: any) => Number(cat.id) === Number(field.value)
                                                    );
                                                    return (
                                                        <FormItem>
                                                            <FormLabel>Category</FormLabel>
                                                            <Popover open={catOpen} onOpenChange={setCatOpen}>
                                                                <PopoverTrigger asChild>
                                                                    <FormControl>
                                                                        <button
                                                                            type="button"
                                                                            className={cn(
                                                                                "w-full flex justify-between items-center px-3 py-2 border border-input rounded-md h-10 bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-sm",
                                                                                !field.value && "text-muted-foreground"
                                                                            )}
                                                                        >
                                                                            {selectedCategory?.name || "Select category"}
                                                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                                                        </button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                                    <Command>
                                                                        <CommandInput placeholder="Search..." className="h-10" />
                                                                        <CommandList className="max-h-[250px]">
                                                                            <CommandEmpty>No category found.</CommandEmpty>
                                                                            <CommandGroup>
                                                                                {categoriesData?.items?.map((category: any) => (
                                                                                    <CommandItem
                                                                                        key={category.id}
                                                                                        onSelect={() => {
                                                                                            field.onChange(Number(category.id));
                                                                                            setCatOpen(false);
                                                                                        }}
                                                                                    >
                                                                                        {category.name}
                                                                                        <Check
                                                                                            className={cn(
                                                                                                "h-4 w-4 ml-auto",
                                                                                                Number(category.id) === Number(field.value) ? "opacity-100" : "opacity-0"
                                                                                            )}
                                                                                        />
                                                                                    </CommandItem>
                                                                                ))}
                                                                            </CommandGroup>
                                                                        </CommandList>
                                                                    </Command>
                                                                </PopoverContent>
                                                            </Popover>
                                                            <FormMessage />
                                                        </FormItem>
                                                    );
                                                }}
                                            />

                                            {/* Status */}
                                            <FormField
                                                control={form.control}
                                                name="status"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Status</FormLabel>
                                                        <FormControl>
                                                            <Select value={field.value} onValueChange={field.onChange}>
                                                                <SelectTrigger className="h-10 w-full">
                                                                    <SelectValue placeholder="Select status" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="active">Active</SelectItem>
                                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {/* Template */}
                                            <FormField
                                                control={form.control}
                                                name="match_table_name"
                                                render={({ field }) => {
                                                    const selected = testTables?.data?.items?.find(
                                                        (table: any) => Number(table.id) === Number(field.value)
                                                    );
                                                    return (
                                                        <FormItem>
                                                            <FormLabel>Report Template</FormLabel>
                                                            <Popover open={open} onOpenChange={setOpen}>
                                                                <PopoverTrigger asChild>
                                                                    <FormControl>
                                                                        <button
                                                                            type="button"
                                                                            className={cn(
                                                                                "w-full flex justify-between items-center px-3 py-2 border border-input rounded-md h-10 bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-sm",
                                                                                !field.value && "text-muted-foreground"
                                                                            )}
                                                                        >
                                                                            {selected?.display_name || "Select template"}
                                                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                                                        </button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                                    <Command>
                                                                        <CommandInput placeholder="Search..." value={search} onValueChange={setSearch} className="h-10" />
                                                                        <CommandList className="max-h-[250px]">
                                                                            <CommandEmpty>No template found.</CommandEmpty>
                                                                            <CommandGroup>
                                                                                {testTables?.data?.items?.map((item: any) => (
                                                                                    <CommandItem
                                                                                        key={item.id}
                                                                                        onSelect={() => {
                                                                                            field.onChange(item.id);
                                                                                            setOpen(false);
                                                                                        }}
                                                                                    >
                                                                                        {item.display_name}
                                                                                        <Check
                                                                                            className={cn(
                                                                                                "h-4 w-4 ml-auto",
                                                                                                item.id === field.value ? "opacity-100" : "opacity-0"
                                                                                            )}
                                                                                        />
                                                                                    </CommandItem>
                                                                                ))}
                                                                            </CommandGroup>
                                                                        </CommandList>
                                                                    </Command>
                                                                </PopoverContent>
                                                            </Popover>
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
                                                        <FormLabel>Price (৳)</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">৳</span>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0.00"
                                                                    className="h-10 pl-7"
                                                                    {...field}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Sample Normal Range */}
                                        <FormField
                                            control={form.control}
                                            name="sample_normal_range"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Sample Normal Range</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="e.g. 4.5-11.0 x 10^9/L for WBC"
                                                            className="min-h-[80px] resize-y"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-xs">
                                                        Enter the reference or normal range for this test (optional)
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate({ to: '/outdoor/master/tests', search: { page: 1, limit: 10, search: '' } })}
                                    disabled={updateMutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={updateMutation.isPending}
                                >
                                    {updateMutation.isPending ? (
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                                    ) : null}
                                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </Main>
        </div>
    );
}

export default EditTest;
