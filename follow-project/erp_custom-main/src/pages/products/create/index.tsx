import { Controller, useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { Field, FieldLabel, FieldError } from "@/components/ui/field";

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
//import { ImageUploader } from "@/components/form/ImageUploader";
import { useNavigate } from "react-router";
import { Check, ChevronDown, Package, Image as ImageIcon, Tag, DollarSign, Truck, CheckCircle2, Layers, Plus, Trash2, X } from "lucide-react";
import {
  useAddProductMutation,
  useGetAllCategoriesQuery,
  useGetAllUnitsQuery,
} from "@/store/features/admin/productsApiService";
import { useState } from "react";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ImageUploaderPro from "@/components/form/ImageUploaderPro";
import { useAppSelector } from "@/store/store";
import { BackButton } from "@/components/BackButton";

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

/* ------------------ PAGE ------------------ */
export default function AddProductPage() {
  const [open, setOpen] = useState(false);
  const [page] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [unitSearch, setUnitSearch] = useState<string>("");
  const limit = 10;
  const navigate = useNavigate();
  const { data: fetchedCategories } = useGetAllCategoriesQuery({
    page,
    limit,
    search,
  });

  // console.log("Fetched Categories: ", fetchedCategories);

  //const categories: any[] = fetchedCategories?.data || [];

  const { data: fetchedUnits } = useGetAllUnitsQuery({
    search: unitSearch,
  });

  // console.log("Fetched Units: ", fetchedUnits);

  const currency = useAppSelector((state) => state.currency.value);

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

  const { control, handleSubmit } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "attributes",
  });

  const [addProduct, { isLoading }] = useAddProductMutation();

  const onSubmit = async (values: ProductFormValues) => {
    console.log(values);

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
      stock_quantity: Number(values.initialStock),
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

    try {
      const res = await addProduct(payload).unwrap();
      console.log("Product added successfully:", res);
      if (res.status) {
        toast.success("Product added successfully");
        // Navigate back to products list or reset form
        navigate("/dashboard/products");
        form.reset();
      }
    } catch (error) {
      console.error("Error adding product:", error);
      const err = error as { data: { message: string } };
      toast.error(err?.data?.message || "Failed to add product");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Add Product
          </h1>
          <p className="text-muted-foreground mt-2">Create a new product with details</p>
        </div>
        <BackButton />
      </div>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* BASIC INFO */}
          <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
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

            <CardContent className="pb-6">
              <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                {/* Left side: SKU and Name in a grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                {/* Right side: Image */}
                <div className="flex md:justify-end">
                  <div>
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
                </div>
              </div>
            </CardContent>
          </Card>


          <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
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
          <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
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
                  const selected = fetchedCategories?.data?.find(
                    (cat) => cat.id === field.value
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
                                {fetchedCategories?.data?.map((cat) => (
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
                  const selectedUnit = fetchedUnits?.data?.find(
                    (u) => u.id === field.value
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
                                {fetchedUnits?.data?.map((unit) => {
                                  if (!unit.is_active) return
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
                      <SelectTrigger>
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
          <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
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
          <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
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

          {/* ATTRIBUTES */}
          <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
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

            <CardContent className="space-y-6 pb-6">
              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  <p>No attribute groups added yet.</p>
                  <Button
                    variant="link"
                    onClick={() => append({ name: "", values: [] })}
                    className="text-blue-600"
                  >
                    + Add your first attribute group
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm relative group">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid md:grid-cols-2 gap-6">
                        <Controller
                          control={control}
                          name={`attributes.${index}.name`}
                          render={({ field }) => (
                            <Field>
                              <FieldLabel>Attribute Name</FieldLabel>
                              <Input
                                placeholder="e.g. Color, Size, Material"
                                {...field}
                              />
                              <FieldError>{form.formState.errors.attributes?.[index]?.name?.message}</FieldError>
                            </Field>
                          )}
                        />

                        <Controller
                          control={control}
                          name={`attributes.${index}.values`}
                          render={({ field }) => (
                            <Field>
                              <FieldLabel>Attribute Values</FieldLabel>
                              <div className="flex flex-wrap gap-2 p-2 min-h-[40px] rounded-md border border-input bg-background">
                                {field.value?.map((val, vIndex) => (
                                  <span key={vIndex} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {val}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newValues = [...(field.value || [])];
                                        newValues.splice(vIndex, 1);
                                        field.onChange(newValues);
                                      }}
                                      className="ml-1 hover:text-blue-900"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                                <input
                                  type="text"
                                  className="flex-1 bg-transparent border-none outline-none text-sm min-w-[100px]"
                                  placeholder="Type & press Enter..."
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const val = e.currentTarget.value.trim();
                                      if (val && !(field.value || []).includes(val)) {
                                        field.onChange([...(field.value || []), val]);
                                        e.currentTarget.value = '';
                                      }
                                    }
                                  }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Press Enter to add per value</p>
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

          {/* SUBMIT */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard/products')}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-500/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/50 active:translate-y-0 active:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Add Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Form>
    </div >
  );
}
