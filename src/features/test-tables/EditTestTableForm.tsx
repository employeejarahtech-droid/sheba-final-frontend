"use client";

import { useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Loader } from "lucide-react";
import { getCookie } from "@/lib/cookies";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

const testTableSchema = z.object({
    table_name: z.string().min(1, { message: "Required" }),
    display_name: z.string().min(1, { message: "Required" }),
    description: z.string().min(1, { message: "Required" }),
});

export function EditTestTableForm({
    id,
    open,
    setOpen,
}: {
    id: number;
    open: boolean;
    setOpen: (open: boolean) => void;
}) {
    const token = getCookie("accessToken");
    const queryClient = useQueryClient();

    // ------------------------------------------------------------
    // 1. FORM SETUP (must come before effects)
    // ------------------------------------------------------------
    const form = useForm<z.infer<typeof testTableSchema>>({
        resolver: zodResolver(testTableSchema),
        defaultValues: {
            table_name: "",
            display_name: "",
            description: "",
        },
    });

    // ------------------------------------------------------------
    // 2. FETCH SINGLE TEST TABLE
    // ------------------------------------------------------------
    const { data: testTable } = useQuery({
        queryKey: ["test-table", id],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/test-tables/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch test table");
            return res.json();
        },
        enabled: !!token && !!id && open, // only load when drawer is open
        staleTime: 0,
        refetchOnWindowFocus: false,
    });

    const tableName = testTable?.data?.table_name ?? "";
    const displayName = testTable?.data?.display_name ?? "";
    const description = testTable?.data?.description ?? "";

    // ------------------------------------------------------------
    // 3. SAFELY RESET FORM (NO INFINITE LOOP)
    // ------------------------------------------------------------
    useEffect(() => {
        if (!open) return;    // run only when drawer opens
        if (!id) return;      // must have id
        if (!testTable) return; // wait for data

        const current = form.getValues();

        if (
            current.table_name !== tableName ||
            current.display_name !== displayName ||
            current.description !== description
        ) {
            form.reset({
                table_name: tableName,
                display_name: displayName,
                description: description,
            });
        }
    }, [open, id, tableName, displayName, description]); // stable dependencies

    // ------------------------------------------------------------
    // 4. FETCH ALL DB TABLES
    // ------------------------------------------------------------
    const { data: allDbTables } = useQuery({
        queryKey: ["db-tables"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/test-tables/all-db-tables`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch db tables");
            return res.json();
        },
        enabled: !!token && open, // only fetch when drawer open
    });

    const allDbTableNames = allDbTables?.data?.tables || [];

    // ------------------------------------------------------------
    // 5. UPDATE MUTATION
    // ------------------------------------------------------------
    const updateMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/test-tables/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.message || "Update failed");
            }

            return res.json();
        },

        onSuccess: () => {
            toast.success("Test table updated successfully");

            queryClient.invalidateQueries({
                queryKey: ["test-tables"],
            });

            queryClient.invalidateQueries({
                queryKey: ["test-table", id],
            });

            form.reset();
            setOpen(false);
        },
    });

    const handleSubmit = (values: z.infer<typeof testTableSchema>) => {
        updateMutation.mutate(values);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="right" className="w-[400px] sm:w-[450px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Update Test Table</SheetTitle>
                </SheetHeader>

                <div className="space-y-6 mt-6 p-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">

                            {/* table_name */}
                            <FormField
                                control={form.control}
                                name="table_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Table Name</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            "w-full flex justify-between items-center px-3 py-1 border rounded-md h-9",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value || "Select table"}
                                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                                    </button>
                                                </FormControl>
                                            </PopoverTrigger>

                                            <PopoverContent className="w-full p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search table..." />
                                                    <CommandList>
                                                        <CommandEmpty>No table found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {allDbTableNames.map((name: string) => (
                                                                <CommandItem
                                                                    key={name}
                                                                    onSelect={() => field.onChange(name)}
                                                                >
                                                                    {name}
                                                                    <Check
                                                                        className={cn(
                                                                            "h-4 w-4 ml-auto",
                                                                            name === field.value ? "opacity-100" : "opacity-0"
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
                                )}
                            />

                            {/* display_name */}
                            <FormField
                                control={form.control}
                                name="display_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Display Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Enter display name" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* description */}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} placeholder="Enter description" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-center gap-5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setOpen(false);
                                        form.reset();
                                    }}
                                    disabled={updateMutation.isPending}
                                >
                                    Cancel
                                </Button>

                                <Button type="submit" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? (
                                        <div className="flex items-center gap-2">
                                            <Loader className="h-4 w-4 animate-spin" />
                                            Updating...
                                        </div>
                                    ) : (
                                        "Update"
                                    )}
                                </Button>
                            </div>

                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    );
}

