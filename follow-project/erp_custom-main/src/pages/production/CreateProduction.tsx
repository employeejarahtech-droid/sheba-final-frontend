import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router";
import { useAddBatchMutation } from "@/store/features/admin/productionApiService";
import { useGetAllProductsQuery } from "@/store/features/admin/productsApiService";

// Zod schema based on the data format
const productionSchema = z.object({
    product_id: z.number().positive("Product ID must be positive"),
    quantity: z.number().positive("Quantity must be greater than 0"),
    bom_id: z.number().positive().optional(),
    start_date: z.string().optional(),
    notes: z.string().optional(),
});

type ProductionFormValues = z.infer<typeof productionSchema>;

const CreateProduction = () => {
    const navigate = useNavigate();
    const [addBatch, { isLoading }] = useAddBatchMutation();

    const form = useForm<ProductionFormValues>({
        resolver: zodResolver(productionSchema),
        mode: "onChange",
        defaultValues: {
            product_id: 0,
            quantity: 0,
            bom_id: undefined,
            start_date: "",
            notes: "",
        },
    });

    function ProductSelectField({
        field,
    }: {
        field: { value?: number; onChange: (v: number) => void };
    }) {
        const [open, setOpen] = useState(false);
        const [query, setQuery] = useState("");

        const { data, isLoading } = useGetAllProductsQuery({
            page: 1,
            limit: 50,
            search: query,
        });

        const list = Array.isArray(data?.data) ? data.data : [];

        const selected = list.find((p) => Number(p.id) === Number(field.value));

        const handleSelect = (productId: number) => {
            field.onChange(Number(productId));
            setOpen(false);
        };

        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                        {selected
                            ? `${selected.name} (SKU: ${selected.sku}) (${selected.unit?.name || "-"
                            })`
                            : "Select Product..."}
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[320px] p-0">
                    <Command>
                        <CommandInput
                            placeholder="Search products..."
                            onValueChange={(value) => setQuery(value)}
                        />

                        <CommandList>
                            <CommandEmpty>No products found.</CommandEmpty>

                            <CommandGroup>
                                {isLoading && (
                                    <div className="py-2 px-3 text-sm text-gray-500">
                                        Loading...
                                    </div>
                                )}

                                {!isLoading &&
                                    list.map((product) => (
                                        <CommandItem
                                            key={product.id}
                                            onSelect={() => handleSelect(Number(product.id))}
                                        >
                                            {product.name} (SKU: {product.sku}) (
                                            {product.unit?.name || "-"})
                                        </CommandItem>
                                    ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        );
    }

    const onSubmit = async (data: ProductionFormValues) => {
        try {
            console.log("Submitting production batch:", data);
            await addBatch(data).unwrap();
            toast.success("Production batch created successfully!");
            navigate("/dashboard/production/list");
        } catch (error) {
            console.error("Failed to create production batch:", error);
            toast.error("Failed to create production batch. Please try again.");
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <div className="flex justify-between items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold">Create New Production Batch</h1>
                <Link to="/dashboard/production/list">
                    <Button variant="outline" size="default">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Batches List</span>
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Batch Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Product ID - Required */}
                                <FormField
                                    control={form.control}
                                    name="product_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product ID *</FormLabel>
                                            <FormControl>
                                                <ProductSelectField
                                                    field={field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Quantity - Required */}
                                <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quantity *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="50"
                                                    value={field.value || ""}
                                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* BOM ID - Optional */}
                                <FormField
                                    control={form.control}
                                    name="bom_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>BOM ID (Optional)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Enter BOM ID"
                                                    value={field.value ?? ""}
                                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Start Date - Optional */}
                                <FormField
                                    control={form.control}
                                    name="start_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Date (Optional)</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Notes - Optional */}
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Urgent batch for client X"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-4 pt-4">
                                <Link to="/dashboard/production/list">
                                    <Button variant="outline" type="button" disabled={isLoading}>
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-500" disabled={isLoading}>
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    {isLoading ? "Creating..." : "Create Batch"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateProduction;
