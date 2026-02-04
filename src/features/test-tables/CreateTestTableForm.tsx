"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Plus } from "lucide-react";
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

export function CreateTestTableForm({refetchTestTables}: {refetchTestTables: () => void}) {
    const [open, setOpen] = useState(false);
    const [selectOpen, setSelectOpen] = useState(false);
    const queryClient = useQueryClient();
    const token = getCookie('accessToken');

    // all db tables

    const { data: allDbTables } = useQuery({
        queryKey: ["db-tables"],
        queryFn: async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/test-tables/all-db-tables`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch all db tables");
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

    //console.log(allDbTables);

    const allDbTableNames = allDbTables?.data?.tables || [];

    //console.log('allDbTableNames', allDbTableNames);

    const form = useForm<z.infer<typeof testTableSchema>>({
        resolver: zodResolver(testTableSchema),
        defaultValues: {
            table_name: "",
            display_name: "",
            description: "",
        },
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (newTable: {
            table_name: string;
            display_name: string;
            description: string;
        }) => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/test-tables`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(newTable),
                }
            );
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.message || "Failed to create test table");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Test tables created successfully");
            queryClient.invalidateQueries({ queryKey: ["test-table"] });
            refetchTestTables();
            setOpen(false);
            form.reset();
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to create test table");
        },
    });

    const handleSubmit = (data: z.infer<typeof testTableSchema>) => {
        console.log('Form Data:', data);

        createMutation.mutate({ table_name: data.table_name, display_name: data.display_name, description: data.description });
    };

    const handleCancel = () => {
        setOpen(false);
        form.reset();
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            {/* Trigger Button */}
            <SheetTrigger asChild>
                <Button onClick={() => setOpen(true)}>
                    <Plus size={18} />
                    Add New
                </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-[400px] sm:w-[450px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Add New Test Table</SheetTitle>
                </SheetHeader>

                <div className="space-y-6 mt-6 p-4">
                    <Form {...form} >
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                            <div className="space-y-5">
                                <FormField
                                    control={form.control}
                                    name="table_name"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Table Name</FormLabel>

                                            <Popover open={selectOpen} onOpenChange={setSelectOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <button
                                                            type="button"
                                                            className={cn(
                                                                "w-full flex justify-between items-center px-3 py-1 border rounded-md h-9",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? field.value : "Select table"}

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
                                                                {allDbTableNames?.map((table: string) => (
                                                                    <CommandItem
                                                                        key={table}
                                                                        value={table}
                                                                        onSelect={() => {
                                                                            field.onChange(table);
                                                                            setSelectOpen(false);
                                                                        }}
                                                                        className="flex justify-between items-center cursor-pointer"
                                                                    >
                                                                        {table}
                                                                        <Check
                                                                            className={cn(
                                                                                "h-4 w-4",
                                                                                table === field.value ? "opacity-100" : "opacity-0"
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
                            </div>
                            <div className="flex justify-center gap-5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={createMutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                >
                                    {createMutation.isPending ? "Adding..." : "Add"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
