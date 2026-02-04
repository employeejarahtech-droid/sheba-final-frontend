"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronDown, Package, Image as ImageIcon, Tag, DollarSign, Truck, Layers, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
import { Form } from "@/components/ui/form";
import ImageUploaderPro from "@/components/form/ImageUploaderPro";
import { cn } from "@/lib/utils";
import { useProduct, useUpdateProduct } from "../api/queries";
import { useCategories as useCategoriesQuery } from "@/features/products/api/categoryQueries";
import { useUnits as useUnitsQuery } from "@/features/products/api/unitQueries";
import type { Category, Unit } from "@/types/types";
import BackButton from "@/components/BackButton";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Header } from "@/components/layout/header";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { topNav } from "@/data/data";

/* ------------------ ZOD SCHEMA ------------------ */
const productSchema = z.object({
    sku: z.string().min(1, "Required"),
    name: z.string().min(1, "Required"),
    description: z.string().optional(),
    category: z.number().min(1, "Required"),
    unit: z.number().min(1, "Required"),
    price: z.number().min(0, "Price must be at least 0"),
    costPrice: z.number().min(0, "Cost Price must be at least 0"),
    initialStock: z.number(),
    minStock: z.number().min(0, "Required"),
    maxStock: z.number(),
    purchase_tax: z.number(),
    sales_tax: z.number(),
    weight: z.number(),
    width: z.number(),
    height: z.number(),
    length: z.number(),
    is_active: z.boolean().optional(),
    image: z.string().optional(),
    gallery_items: z.array(z.string()).optional(),
    attributes: z.array(z.object({
        name: z.string(),
        values: z.array(z.string())
    })).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface EditProductFormProps {
    productId: number;
}

export default function EditProductForm({ productId }: EditProductFormProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [unitSearch, setUnitSearch] = useState("");

    const navigate = useNavigate();
    // Simple currency constant - replace with your preferred currency
    const currency = "$";

    const { data: categoriesData } = useCategoriesQuery({ limit: 1000 });
    const { data: unitsData } = useUnitsQuery({ limit: 1000 });
    const { data: productData, isLoading: isProductLoading } = useProduct(productId);
    const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();

    const categories = categoriesData?.data || [];
    const units = unitsData?.data || [];
    const product = productData?.data;

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            sku: "",
            name: "",
            description: "",
            image: "",
            gallery_items: [],
            category: 0,
            unit: 0,
            price: 0,
            costPrice: 0,
            initialStock: 0,
            minStock: 0,
            maxStock: 0,
            purchase_tax: 0,
            sales_tax: 0,
            weight: 0,
            width: 0,
            height: 0,
            length: 0,
            is_active: true,
            attributes: [],
        },
    });

    const { control, handleSubmit, reset } = form;

    const { fields, append, remove } = useFieldArray({
        control,
        name: "attributes",
    });

    useEffect(() => {
        if (product) {
            reset({
                sku: product.sku,
                name: product.name,
                description: product.description,
                image: product.thumb_url,
                gallery_items: product.gallery_items,
                category: product.category_id,
                unit: product.unit_id,
                price: product.price,
                costPrice: product.cost,
                initialStock: product.initial_stock, // Note: stock_quantity is current stock, usually we don't edit initial stock on update but keeping logic consistent
                minStock: product.min_stock_level,
                maxStock: product.max_stock_level,
                purchase_tax: product.purchase_tax,
                sales_tax: product.sales_tax,
                weight: product.weight,
                width: product.width,
                height: product.height,
                length: product.length,
                is_active: product.is_active,
                // attributes: product.attributes // Assuming product type keeps attributes TODO check type
            });
        }
    }, [product, reset]);


    const onSubmit = async (values: ProductFormValues) => {
        const payload = {
            sku: values.sku,
            name: values.name,
            description: values.description,
            thumb_url: values.image,
            gallery_items: values.gallery_items,
            category_id: Number(values.category),
            unit_id: Number(values.unit),
            price: Number(values.price),
            cost: Number(values.costPrice),
            initial_stock: Number(values.initialStock),
            min_stock_level: Number(values.minStock),
            max_stock_level: Number(values.maxStock),
            purchase_tax: Number(values?.purchase_tax),
            sales_tax: Number(values.sales_tax),
            weight: Number(values.weight),
            width: Number(values.width),
            height: Number(values.height),
            length: Number(values.length),
            barcode: "9876543210987",
            is_active: values.is_active,
            attributes: values.attributes,
        };

        updateProduct({ id: productId, body: payload }, {
            onSuccess: () => {
                toast.success("Product updated successfully");
                navigate({ to: "/products" });
            },
            onError: (error: any) => {
                console.error("Error updating product:", error);
                const message = error?.data?.message || "Failed to update product";
                toast.error(message);
            }
        });
    };

    if (isProductLoading) return <div>Loading product...</div>;

    return (
        <>
            <Header fixed>
                <TopNav links={topNav} />
                <div className="ms-auto flex items-center space-x-4">
                    <Search />
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>
            <main className="p-6 lg:p-10 max-w-5xl w-full mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Edit Product</h2>
                        <p className="text-muted-foreground">Update product details and specifications</p>
                    </div>
                    <BackButton />
                </div>
                <div className="pb-6">
                    <Form {...form}>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* BASIC INFO */}
                            <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg py-0">
                                <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                                            <Package className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Basic Information</CardTitle>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Product name, SKU, and description</p>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="grid gap-4 md:grid-cols-2 pb-3">
                                    {/* SKU */}
                                    <Controller
                                        control={control}
                                        name="sku"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>SKU</FieldLabel>
                                                <Input placeholder="SKU123" {...field} />
                                                <FieldError>{fieldState?.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />

                                    {/* NAME */}
                                    <Controller
                                        control={control}
                                        name="name"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>Name</FieldLabel>
                                                <Input placeholder="Product name" {...field} />
                                                <FieldError>{fieldState?.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />

                                    {/* DESCRIPTION */}
                                    <div className="md:col-span-2">
                                        <Controller
                                            control={control}
                                            name="description"
                                            render={({ field, fieldState }) => (
                                                <Field>
                                                    <FieldLabel>Description</FieldLabel>
                                                    <Textarea
                                                        rows={4}
                                                        placeholder="Write description..."
                                                        {...field}
                                                    />
                                                    <FieldError>{fieldState?.error?.message}</FieldError>
                                                </Field>
                                            )}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Controller
                                            control={control}
                                            name="image"
                                            render={({ field, fieldState }) => (
                                                <Field>
                                                    <FieldLabel>Image</FieldLabel>
                                                    <ImageUploaderPro
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                    />
                                                    <FieldError>{fieldState?.error?.message}</FieldError>
                                                </Field>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg py-0">
                                <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                                            <ImageIcon className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Product Gallery</CardTitle>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Upload multiple product images</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-3">
                                    <Controller
                                        control={control}
                                        name="gallery_items"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>Product Gallery</FieldLabel>
                                                <ImageUploaderPro
                                                    value={field.value || []}
                                                    onChange={field.onChange}
                                                    multiple
                                                />
                                                <FieldError>{fieldState?.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* CLASSIFICATION */}
                            <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg py-0">
                                <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                                            <Tag className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Classification</CardTitle>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Category, unit, and status</p>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="grid gap-4 md:grid-cols-3 pb-6">
                                    {/* CATEGORY */}
                                    <Controller
                                        control={control}
                                        name="category"
                                        render={({ field, fieldState }) => {
                                            const selected = categories.find(
                                                (cat: Category) => cat.id === field.value
                                            );

                                            return (
                                                <Field>
                                                    <FieldLabel>Category</FieldLabel>

                                                    <Popover open={open} onOpenChange={setOpen}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={open}
                                                                className="w-full justify-between"
                                                            >
                                                                {selected ? selected.name : "Select category..."}
                                                                <ChevronDown className="opacity-50 h-4 w-4" />
                                                            </Button>
                                                        </PopoverTrigger>

                                                        <PopoverContent className="w-full p-0">
                                                            <Command>
                                                                {/* Search input */}
                                                                <CommandInput
                                                                    placeholder="Search category..."
                                                                    className="h-9"
                                                                    value={search}
                                                                    onValueChange={setSearch}
                                                                />

                                                                <CommandList>
                                                                    <CommandEmpty>No category found.</CommandEmpty>

                                                                    <CommandGroup>
                                                                        {categories.map((cat: Category) => (
                                                                            <CommandItem
                                                                                key={cat.id}
                                                                                value={`${cat.name}-${cat.id}`} // unique, string
                                                                                onSelect={() => {
                                                                                    field.onChange(cat.id); // convert back to number
                                                                                    setOpen(false);
                                                                                }}
                                                                            >
                                                                                {cat.name}
                                                                                <Check
                                                                                    className={cn(
                                                                                        "ml-auto h-4 w-4",
                                                                                        field.value === cat.id
                                                                                            ? "opacity-100"
                                                                                            : "opacity-0"
                                                                                    )}
                                                                                />
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>

                                                    {fieldState.error && (
                                                        <p className="text-red-500 text-sm mt-1">
                                                            {fieldState.error.message}
                                                        </p>
                                                    )}
                                                </Field>
                                            );
                                        }}
                                    />

                                    {/* UNIT */}
                                    <Controller
                                        control={control}
                                        name="unit"
                                        render={({ field, fieldState }) => {
                                            const selectedUnit = units.find(
                                                (u: Unit) => u.id === field.value
                                            );

                                            const selectedLabel = selectedUnit?.name ?? "Select a unit";

                                            return (
                                                <Field>
                                                    <FieldLabel>Unit</FieldLabel>

                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className="w-full justify-between"
                                                            >
                                                                {selectedLabel}
                                                                <ChevronDown className="opacity-50 h-4 w-4" />
                                                            </Button>
                                                        </PopoverTrigger>

                                                        <PopoverContent className="w-full p-0">
                                                            <Command>
                                                                {/* 🔍 Search input inside the popover */}
                                                                <CommandInput
                                                                    placeholder="Search units..."
                                                                    value={unitSearch}
                                                                    onValueChange={setUnitSearch}
                                                                />

                                                                <CommandList>
                                                                    <CommandEmpty>No units found.</CommandEmpty>

                                                                    <CommandGroup>
                                                                        {units.map((unit: Unit) => {
                                                                            // if (!unit.is_active) return // removed as explained
                                                                            return (
                                                                                <CommandItem
                                                                                    key={unit.id}
                                                                                    value={unit.name} // for built-in filtering
                                                                                    onSelect={() => {
                                                                                        field.onChange(unit.id);
                                                                                        setOpen(false);
                                                                                    }}
                                                                                >
                                                                                    <span>{unit.name}</span>

                                                                                    {field.value === unit.id && (
                                                                                        <Check className="ml-auto h-4 w-4" />
                                                                                    )}
                                                                                </CommandItem>
                                                                            )
                                                                        })}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>

                                                    {fieldState.error && (
                                                        <p className="text-red-500 text-sm mt-1">
                                                            {fieldState.error.message}
                                                        </p>
                                                    )}
                                                </Field>
                                            );
                                        }}
                                    />

                                    {/* STATUS */}
                                    <Controller
                                        control={control}
                                        name="is_active"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>Status</FieldLabel>
                                                <Select
                                                    value={String(field.value)}
                                                    onValueChange={(v) => field.onChange(v === "true")}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">Active</SelectItem>
                                                        <SelectItem value="false">Inactive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* PRICING & STOCK */}
                            <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg py-0">
                                <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-2 border-blue-100 dark:border-blue-900 py-3 gap-0">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                                            <DollarSign className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Pricing & Stock</CardTitle>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Prices, stock levels, and taxes</p>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="grid gap-4 md:grid-cols-3 pb-6">
                                    <Controller
                                        control={control}
                                        name="price"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>
                                                    Price {currency ? `(${currency})` : ""}{" "}
                                                </FieldLabel>
                                                <Input
                                                    type="number"
                                                    value={field.value ?? ""}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value === "" ? "" : Number(e.target.value)
                                                        )
                                                    }
                                                />
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        control={control}
                                        name="costPrice"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>
                                                    Cost Price {currency ? `(${currency})` : ""}{" "}
                                                </FieldLabel>
                                                <Input
                                                    type="number"
                                                    value={field.value ?? ""}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value === "" ? "" : Number(e.target.value)
                                                        )
                                                    }
                                                />
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        control={control}
                                        name="initialStock"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>Initial Stock</FieldLabel>
                                                <Input
                                                    type="number"
                                                    value={field.value ?? ""}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value === "" ? "" : Number(e.target.value)
                                                        )
                                                    }
                                                />
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        control={control}
                                        name="minStock"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>Min Stock</FieldLabel>
                                                <Input
                                                    type="number"
                                                    value={field.value ?? ""}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value === "" ? "" : Number(e.target.value)
                                                        )
                                                    }
                                                />
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        control={control}
                                        name="maxStock"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>Max Stock</FieldLabel>
                                                <Input
                                                    type="number"
                                                    value={field.value ?? ""}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value === "" ? "" : Number(e.target.value)
                                                        )
                                                    }
                                                />
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        control={control}
                                        name="purchase_tax"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>Purchase Tax (%)</FieldLabel>
                                                <Input
                                                    type="number"
                                                    value={field.value ?? ""}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value === "" ? "" : Number(e.target.value)
                                                        )
                                                    }
                                                />
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        control={control}
                                        name="sales_tax"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>Sales Tax (%)</FieldLabel>
                                                <Input
                                                    type="number"
                                                    value={field.value ?? ""}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value === "" ? "" : Number(e.target.value)
                                                        )
                                                    }
                                                />
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* LOGISTICS */}
                            <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg py-0">
                                <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-2 border-blue-100 dark:border-blue-900 py-3 gap-0">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                                            <Truck className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Logistics</CardTitle>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Weight and dimensions</p>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="grid gap-4 md:grid-cols-2 pb-6">
                                    {/* WEIGHT */}
                                    <Controller
                                        control={control}
                                        name="weight"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>Weight (kg)</FieldLabel>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                />
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />

                                    {/* Width */}
                                    <Controller
                                        control={control}
                                        name="width"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>Width(cm)</FieldLabel>
                                                <Input
                                                    type="number"
                                                    placeholder="e.g. 2 cm"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                />
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />

                                    {/* height */}
                                    <Controller
                                        control={control}
                                        name="height"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>Height(cm)</FieldLabel>
                                                <Input
                                                    type="number"
                                                    placeholder="e.g. 2 cm"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                />
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />
                                    {/* Width */}
                                    <Controller
                                        control={control}
                                        name="length"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>Length(cm)</FieldLabel>
                                                <Input
                                                    type="number"
                                                    placeholder="e.g. 2 cm"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                />
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg pt-0">
                                <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-2 border-blue-100 dark:border-blue-900 py-3 gap-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                                                <Layers className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Attributes & Variants</CardTitle>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Manage product attributes and options</p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => append({ name: "", values: [] })}
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> Add Attribute Group
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    {fields.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                            <p>No attribute groups added yet.</p>
                                            <Button
                                                variant="link"
                                                type="button"
                                                onClick={() => append({ name: "", values: [] })}
                                                className="text-blue-600"
                                            >
                                                + Add your first attribute group
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {fields.map((field, index: number) => (
                                                <div key={field.id} className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm relative group">
                                                    <button
                                                        type="button"
                                                        onClick={() => remove(index)}
                                                        className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>

                                                    <div className="grid md:grid-cols-2 gap-6 items-start">
                                                        <Controller
                                                            control={control}
                                                            name={`attributes.${index}.name`}
                                                            render={({ field }) => (
                                                                <Field>
                                                                    <FieldLabel>Attribute Name</FieldLabel>
                                                                    <Input
                                                                        placeholder="e.g., Color, Size"
                                                                        {...field}
                                                                    />
                                                                </Field>
                                                            )}
                                                        />
                                                        <Controller
                                                            control={control}
                                                            name={`attributes.${index}.values`}
                                                            render={({ field }) => (
                                                                <Field>
                                                                    <FieldLabel>Values (Press Enter to add)</FieldLabel>
                                                                    <Input
                                                                        placeholder="Type and press Enter..."
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === "Enter") {
                                                                                e.preventDefault();
                                                                                const val = e.currentTarget.value.trim();
                                                                                const currentValues = field.value || [];
                                                                                if (val && !currentValues.includes(val)) {
                                                                                    field.onChange([...currentValues, val]);
                                                                                    e.currentTarget.value = "";
                                                                                }
                                                                            }
                                                                        }}
                                                                    />
                                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                                        {(field.value || []).map((val: string, vIndex: number) => (
                                                                            <div
                                                                                key={vIndex}
                                                                                className="bg-primary/10 text-primary px-2 py-1 rounded text-sm flex items-center gap-1"
                                                                            >
                                                                                {val}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        field.onChange(
                                                                                            (field.value || []).filter((_: string, i: number) => i !== vIndex)
                                                                                        )
                                                                                    }
                                                                                    className="hover:text-red-500"
                                                                                >
                                                                                    &times;
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </Field>
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Button type="submit" className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/25 transition-all duration-300 transform active:scale-[0.98]" disabled={isUpdating}>
                                {isUpdating ? "Updating Product..." : "Update Product"}
                            </Button>
                        </form>
                    </Form>
                </div>
            </main>
        </>
    );
}
