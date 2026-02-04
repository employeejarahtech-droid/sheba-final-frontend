/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Calculator, Save, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useAddProductMutation, useGetAllUnitsQuery, useGetAllProductsQuery } from "@/store/features/admin/productsApiService";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Zod Schema
const finishedGoodSchema = z.object({
    product_id: z.number().optional(),
    name: z.string().min(1, "Name is required"),
    sku: z.string().min(1, "SKU is required"),
    price: z.number().min(0, "Price must be positive"),
    cost: z.number().min(0, "Cost must be positive"),
    stock_quantity: z.number().min(0),
    unit_id: z.number().min(1, "Unit is required"),
});

type FinishedGoodFormValues = z.infer<typeof finishedGoodSchema>;

// Product Select Component (Reused from CreateBom)
function ProductSelectField({
    value,
    onChange,
    onSelectAttributes,
    placeholder = "Select Product...",
}: {
    value?: number;
    onChange: (value: number) => void;
    onSelectAttributes?: (product: any) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const { data: productsData, isLoading } = useGetAllProductsQuery({
        page: 1,
        limit: 50,
        search: query,
    });

    const list = Array.isArray(productsData?.data) ? productsData.data : [];
    const selected = list.find((p) => Number(p.id) === Number(value));

    const handleSelect = (product: any) => {
        onChange(Number(product.id));
        if (onSelectAttributes) {
            onSelectAttributes(product);
        }
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selected
                        ? `${selected.name} (SKU: ${selected.sku})`
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
                <Command>
                    <CommandInput
                        placeholder="Search products..."
                        onValueChange={(val) => setQuery(val)}
                    />
                    <CommandList>
                        <CommandEmpty>No products found.</CommandEmpty>
                        <CommandGroup>
                            {isLoading && (
                                <div className="p-2 text-sm text-center text-muted-foreground">
                                    Loading...
                                </div>
                            )}
                            {!isLoading &&
                                list.map((product) => (
                                    <CommandItem
                                        key={product.id}
                                        value={String(product.id)}
                                        onSelect={() => handleSelect(product)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                Number(value) === Number(product.id)
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
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

const AddFinishedGood = () => {
    const navigate = useNavigate();
    const [addProduct, { isLoading }] = useAddProductMutation();
    const { data: unitsData } = useGetAllUnitsQuery({ limit: 100 });

    // State for margin calculation - strictly UI only helper
    const [margin, setMargin] = useState<string>("30");

    const form = useForm<FinishedGoodFormValues>({
        resolver: zodResolver(finishedGoodSchema),
        defaultValues: {
            product_id: 0,
            name: "",
            sku: "",
            price: 0,
            cost: 0,
            stock_quantity: 0,
            unit_id: 0,
        },
    });

    const handleProductSelect = (product: any) => {
        form.setValue("name", product.name);
        form.setValue("sku", product.sku);
        form.setValue("price", Number(product.price));
        form.setValue("cost", Number(product.cost));
        form.setValue("unit_id", Number(product.unit_id));

        // Calculate margin for UI
        if (Number(product.cost) > 0) {
            const marginVal = ((Number(product.price) - Number(product.cost)) / Number(product.cost)) * 100;
            setMargin(marginVal.toFixed(2));
        }

        toast.success("Product details loaded!");
    };

    const calculatePriceFromMargin = () => {
        const cost = form.getValues("cost");
        const marginVal = parseFloat(margin);

        if (!isNaN(cost) && !isNaN(marginVal)) {
            const calculatedPrice = cost + (cost * (marginVal / 100));
            form.setValue("price", Number(calculatedPrice.toFixed(2)));
        } else {
            toast.error("Please enter a valid cost and margin %");
        }
    };

    const onSubmit = async (data: FinishedGoodFormValues) => {
        try {
            console.log("Submitting Finished Good:", data);
            await addProduct(data).unwrap();
            toast.success("Finished Good Product Created Successfully!");
            navigate("/dashboard/production/finished-goods");
        } catch (error) {
            console.error("Failed to create product:", error);
            toast.error("Failed to create finished good. Please try again.");
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/dashboard/production/finished-goods">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Add New Finished Good</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Product Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <FormField
                                    control={form.control}
                                    name="product_id"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Select Existing Product (Auto-fill)</FormLabel>
                                            <FormControl>
                                                <ProductSelectField
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    onSelectAttributes={handleProductSelect}
                                                    placeholder="Search for existing good to load details..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name */}
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Widget X" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* SKU */}
                                <FormField
                                    control={form.control}
                                    name="sku"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SKU *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., FG-WIDGET-X" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Unit */}
                                <FormField
                                    control={form.control}
                                    name="unit_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unit *</FormLabel>
                                            <Select
                                                onValueChange={(value) => field.onChange(Number(value))}
                                                value={field.value ? String(field.value) : undefined}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select Unit" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {unitsData?.data?.map((unit) => (
                                                        <SelectItem key={unit.id} value={String(unit.id)}>
                                                            {unit.name} ({unit.symbol})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="stock_quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Initial Stock Quantity</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    {...field}
                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />
                            <h3 className="font-semibold text-lg">Pricing Configuration</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                {/* Cost Price */}
                                <FormField
                                    control={form.control}
                                    name="cost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unit Cost Price *</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                                    <Input
                                                        type="number"
                                                        className="pl-7"
                                                        placeholder="0.00"
                                                        {...field}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Margin Helper */}
                                <div className="space-y-2">
                                    <Label>Margin (%)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            value={margin}
                                            onChange={(e) => setMargin(e.target.value)}
                                            placeholder="%"
                                        />
                                        <Button type="button" variant="secondary" onClick={calculatePriceFromMargin}>
                                            <Calculator className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Sales Price */}
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sales Price *</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                                    <Input
                                                        type="number"
                                                        className="pl-7 font-bold text-green-600"
                                                        placeholder="0.00"
                                                        {...field}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-4 border-t">
                                <Link to="/dashboard/production/finished-goods">
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
                                            Create Product
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

export default AddFinishedGood;
