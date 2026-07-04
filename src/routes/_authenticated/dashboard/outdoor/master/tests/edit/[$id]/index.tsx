
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { useCurrency } from '@/hooks/use-currency'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Check, ChevronDown, ArrowLeft, FlaskConical, MapPin, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

export const Route = createFileRoute('/_authenticated/dashboard/outdoor/master/tests/edit/$id/')({
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
    sample_collection_room_id: z.number().optional().nullable(),
})

type TestValues = z.infer<typeof testSchema>

function EditTest() {
    const { currencySymbol } = useCurrency()
    const [open, setOpen] = useState(false);
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [roomOpen, setRoomOpen] = useState(false);
    const [page] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 100;
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
            sample_collection_room_id: undefined,
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
    const { data: categories } = useQuery({
        queryKey: ["test-category"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/test-category?limit=100`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch categories");
            const result = await res.json();
            return result.data?.rows || result.data?.items || result.data || [];
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

    const { data: sampleRooms } = useQuery({
        queryKey: ["sample-collection-rooms"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/sample-collection-rooms?limit=100`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch sample collection rooms");
            const result = await res.json();
            return result.data?.rows || result.data?.items || result.data || [];
        },
        enabled: !!token,
    });

    // Populate form when data is loaded
    useEffect(() => {
        if (!testData) return;

        const tableId = Number(
            testTables?.data?.items?.find(
                (t: any) => t.table_name === testData.match_table_name
            )?.id
        );

        form.reset({
            name: testData.name,
            category_id: Number(testData.category_id) || 0,
            match_table_name: tableId || 0,
            status: testData.status || "active",
            price: Number(testData.price),
            sample_normal_range: testData.sample_normal_range || "",
            sample_collection_room_id: testData.sample_collection_room_id ? Number(testData.sample_collection_room_id) : undefined,
        });
    }, [testData, testTables, form]);

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
            queryClient.invalidateQueries({ queryKey: ["test", id] });
            // The list query ("tests") is inactive while we're on the edit
            // page, so invalidateQueries() won't fetch it — it only refetches
            // *active* queries, and the global default is refetchOnMount:false.
            // That left the list cache stale after a save, so going back via
            // window.history.back() showed the old row. Force-refetch every
            // cached "tests" query (active or not) so the list is fresh the
            // moment the user returns.
            queryClient.refetchQueries({ queryKey: ["tests"], type: "all" });
            toast.success("Test updated successfully");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update test");
        },
    })

    const onSubmit = (data: TestValues) => {
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
            sample_collection_room_id: data.sample_collection_room_id || null,
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
                    onClick={() => navigate({ to: '/dashboard/outdoor/master/tests', search: { page: 1, limit: 10, search: '' } })}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Tests
                </Button>
            </div>
        )
    }

    return (
        <>
            <AppHeader fixed />

            <Main className="flex flex-1 flex-col gap-6">
                <Form {...form}>
                    <form
                        id="edit-test-form"
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-5 w-full min-w-[650px] max-w-[750px] mx-auto px-4"
                    >
                        {/* Header */}
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => window.history.back()}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                        Edit Test
                                    </h1>
                                    <p className="text-muted-foreground text-sm">
                                        Update test details for <span className="font-medium text-foreground">{testData?.name}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Test Information */}
                        <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                        <FlaskConical className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Test Information</CardTitle>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Name, category, template, and pricing</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-4">
                                    {/* Test Name */}
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Test Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. CBC, Lipid Profile" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Category */}
                                        <FormField
                                            control={form.control}
                                            name="category_id"
                                            render={({ field }) => {
                                                const selectedCategory = categories?.find(
                                                    (cat: any) => Number(cat.id) === Number(field.value)
                                                ) || (testData?.category && Number(testData.category.id) === Number(field.value) ? testData.category : null);
                                                return (
                                                    <FormItem>
                                                        <FormLabel>Category</FormLabel>
                                                        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <button
                                                                        type="button"
                                                                        className={cn(
                                                                            "w-full flex justify-between items-center px-3 py-1 border rounded-md h-9 text-sm",
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
                                                                    <CommandInput placeholder="Search..." />
                                                                    <CommandList>
                                                                        <CommandEmpty>No category found.</CommandEmpty>
                                                                        <CommandGroup>
                                                                            {categories?.map((category: any) => (
                                                                                <CommandItem
                                                                                    key={category.id}
                                                                                    onSelect={() => {
                                                                                        field.onChange(Number(category.id));
                                                                                        setCategoryOpen(false);
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
                                                            <SelectTrigger className="w-full">
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                                            "w-full flex justify-between items-center px-3 py-1 border rounded-md h-9 text-sm",
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
                                                                    <CommandInput placeholder="Search..." value={search} onValueChange={setSearch} />
                                                                    <CommandList>
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

                                        {/* Sample Collection Room */}
                                        <FormField
                                            control={form.control}
                                            name="sample_collection_room_id"
                                            render={({ field }) => {
                                                const selectedRoom = sampleRooms?.find(
                                                    (room: any) => Number(room.id) === Number(field.value)
                                                );
                                                return (
                                                    <FormItem>
                                                        <FormLabel>Sample Collection Room</FormLabel>
                                                        <Popover open={roomOpen} onOpenChange={setRoomOpen}>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <button
                                                                        type="button"
                                                                        className={cn(
                                                                            "w-full flex justify-between items-center px-3 py-1 border rounded-md h-9 text-sm",
                                                                            !field.value && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {selectedRoom
                                                                            ? `${selectedRoom.name}${selectedRoom.location ? ` - ${selectedRoom.location}` : ''}`
                                                                            : "Select sample collection room"}
                                                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                                                    </button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                                <Command>
                                                                    <CommandInput placeholder="Search rooms..." />
                                                                    <CommandList>
                                                                        <CommandEmpty>No room found.</CommandEmpty>
                                                                        {field.value ? (
                                                                            <CommandGroup>
                                                                                <CommandItem
                                                                                    onSelect={() => {
                                                                                        field.onChange(undefined);
                                                                                        setRoomOpen(false);
                                                                                    }}
                                                                                    className="text-muted-foreground"
                                                                                >
                                                                                    <X className="h-4 w-4 mr-2" />
                                                                                    Clear selection
                                                                                </CommandItem>
                                                                            </CommandGroup>
                                                                        ) : null}
                                                                        <CommandGroup>
                                                                            {sampleRooms?.map((room: any) => (
                                                                                <CommandItem
                                                                                    key={room.id}
                                                                                    onSelect={() => {
                                                                                        field.onChange(Number(room.id));
                                                                                        setRoomOpen(false);
                                                                                    }}
                                                                                >
                                                                                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                                                                    <span>{room.name}</span>
                                                                                    {room.location && (
                                                                                        <span className="text-xs text-muted-foreground ml-1">({room.location})</span>
                                                                                    )}
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "h-4 w-4 ml-auto",
                                                                                            Number(room.id) === Number(field.value) ? "opacity-100" : "opacity-0"
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
                                    </div>

                                    {/* Price */}
                                    <FormField
                                        control={form.control}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Price ({currencySymbol})</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span>
                                                        <Input
                                                            type="number"
                                                            placeholder="0.00"
                                                            style={{ paddingLeft: `${Math.max(1.75, 1 + 0.6 * currencySymbol.length)}rem` }}
                                                            {...field}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

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
                        <div className="flex items-center justify-end gap-3 pb-10">
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                onClick={() => navigate({ to: '/dashboard/outdoor/master/tests', search: { page: 1, limit: 10, search: '' } })}
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
                                {updateMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </Main>
        </>
    );
}

export default EditTest;
