import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { ArrowLeft, Save, Trash2, Plus, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAddBomMutation } from "@/store/features/admin/productionApiService";
import { useGetAllProductsQuery } from "@/store/features/admin/productsApiService";

// Zod Schema
const bomItemSchema = z.object({
    product_id: z.number().min(1, "Product is required"),
    quantity: z.number().min(0.0001, "Quantity must be greater than 0"),
    wastage_percent: z.number().min(0).optional(),
});

const bomSchema = z.object({
    product_id: z.number().min(1, "Product is required"),
    name: z.string().min(1, "Name is required"),
    items: z.array(bomItemSchema).min(1, "At least one item is required"),
});

type BomFormValues = z.infer<typeof bomSchema>;

// Product Select Component
function ProductSelectAndSearch({
    value,
    onChange,
    placeholder = "Select Product...",
}: {
    value?: number;
    onChange: (value: number) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const { data, isLoading } = useGetAllProductsQuery({
        page: 1,
        limit: 50,
        search: query,
    });

    const list = Array.isArray(data?.data) ? data.data : [];
    const selected = list.find((p) => Number(p.id) === Number(value));

    const handleSelect = (productId: number) => {
        onChange(Number(productId));
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                    {selected
                        ? `${selected.name} (SKU: ${selected.sku})`
                        : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput
                        placeholder="Search products..."
                        onValueChange={(val) => setQuery(val)}
                    />
                    <CommandList>
                        <CommandEmpty>No products found.</CommandEmpty>
                        <CommandGroup>
                            {isLoading && <div className="p-2 text-sm text-center text-muted-foreground">Loading...</div>}
                            {!isLoading &&
                                list.map((product) => (
                                    <CommandItem
                                        key={product.id}
                                        value={String(product.id)}
                                        onSelect={() => handleSelect(Number(product.id))}
                                    >
                                        {product.name} (SKU: {product.sku})
                                    </CommandItem>
                                ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}


const CreateBom = () => {
    const navigate = useNavigate();
    const [addBom, { isLoading }] = useAddBomMutation();

    const form = useForm<BomFormValues>({
        resolver: zodResolver(bomSchema),
        defaultValues: {
            product_id: 0,
            name: "",
            items: [{ product_id: 0, quantity: 1, wastage_percent: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const onSubmit = async (data: BomFormValues) => {
        try {
            console.log("Submitting BOM:", data);
            await addBom(data).unwrap();
            toast.success("BOM Created Successfully!");
            navigate("/dashboard/production/bom");
        } catch (error) {
            console.error("Failed to create BOM:", error);
            toast.error("Failed to create BOM. Please try again.");
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-4">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/dashboard/production/bom">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Create New Recipe (BOM)</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>BOM Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Product Selection */}
                                <FormField
                                    control={form.control}
                                    name="product_id"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Finished Product *</FormLabel>
                                            <FormControl>
                                                <ProductSelectAndSearch
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Select Finished Product"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* BOM Name */}
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>BOM Name/Reference *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Standard BOM v1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="border rounded-md p-4 bg-slate-50">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Raw Materials</h3>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => append({ product_id: 0, quantity: 1, wastage_percent: 0 })}
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Add Material
                                    </Button>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40%]">Raw Material</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Wastage %</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fields.map((field, index) => (
                                            <TableRow key={field.id}>
                                                <TableCell>
                                                    <FormField
                                                        control={form.control}
                                                        name={`items.${index}.product_id`}
                                                        render={({ field: itemField }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <ProductSelectAndSearch
                                                                        value={itemField.value}
                                                                        onChange={itemField.onChange}
                                                                        placeholder="Select Material"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <FormField
                                                        control={form.control}
                                                        name={`items.${index}.quantity`}
                                                        render={({ field: qtyField }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.0001"
                                                                        placeholder="Qty"
                                                                        {...qtyField}
                                                                        onChange={(e) => qtyField.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <FormField
                                                        control={form.control}
                                                        name={`items.${index}.wastage_percent`}
                                                        render={({ field: wasteField }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.1"
                                                                        placeholder="0%"
                                                                        {...wasteField}
                                                                        onChange={(e) => wasteField.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-700"
                                                        onClick={() => remove(index)}
                                                        disabled={fields.length === 1} // Prevent removing the last item if needed, or remove this logic
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {form.formState.errors.items && (
                                    <p className="text-sm font-medium text-destructive mt-2">
                                        {form.formState.errors.items.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-4 pt-4 border-t">
                                <Link to="/dashboard/production/bom">
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 min-w-[120px]">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save BOM
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateBom;
