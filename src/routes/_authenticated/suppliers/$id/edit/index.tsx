import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from "react";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormControl,
} from "@/components/ui/form";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Building2, MapPin, User, CheckCircle2, ImageIcon } from "lucide-react";
import {
    useGetSupplierByIdQuery,
    useUpdateSupplierMutation
} from "@/features/suppliers/api/queries";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { BackButton } from "@/components/BackButton";
import ImageUploaderPro from "@/components/form/ImageUploaderPro";
import { Header } from "@/components/layout/header"
import { TopNav } from "@/components/layout/top-nav"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { Search } from "@/components/search"
import { ThemeSwitch } from "@/components/theme-switch"
import { ConfigDrawer } from "@/components/config-drawer"
import { topNav } from "@/data/data"

export const Route = createFileRoute('/_authenticated/suppliers/$id/edit/')({
    component: EditSupplierPage,
})

/* ------------------ ZOD SCHEMA ------------------ */
const supplierSchema = z.object({
    name: z.string().min(1, "Required"),
    code: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    contactPerson: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    postal_code: z.string().optional(),
    country: z.string().min(1, "Required"),
    paymentTerms: z.string().optional(),
    status: z.enum(["Active", "Inactive"]),
    thumb_url: z.string().optional(),
    gallery_items: z.array(z.string()).optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

/* ------------------ PAGE ------------------ */
function EditSupplierPage() {
    const navigate = useNavigate();
    const { id: supplierId } = Route.useParams();
    const { data: supplierResponse, isLoading: isFetching } = useGetSupplierByIdQuery(supplierId);
    const { mutate: updateSupplier, isPending: isUpdating } = useUpdateSupplierMutation();

    const form = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            name: "",
            code: "",
            email: "",
            phone: "",
            contactPerson: "",
            address: "",
            city: "",
            state: "",
            postal_code: "",
            country: "Malaysia",
            paymentTerms: "",
            status: "Active",
            latitude: 0,
            longitude: 0,
            thumb_url: "",
            gallery_items: [],
        },
    });

    const { reset } = form;

    // Prefill form
    useEffect(() => {
        if (supplierResponse?.data) {
            const s = supplierResponse.data;
            reset({
                name: s.name || "",
                code: s.code || "",
                email: s.email || "",
                phone: s.phone || "",
                contactPerson: s.contact_person || "",
                address: s.address || "",
                city: s.city || "",
                state: s.state || "",
                postal_code: s.postal_code || "",
                country: s.country || "",
                paymentTerms: s.payment_terms || "",
                status: s.is_active ? "Active" : "Inactive",
                latitude: s.latitude || 0,
                longitude: s.longitude || 0,
                thumb_url: s.thumb_url || "",
                gallery_items: s.gallery_items || [],
            });
        }
    }, [supplierResponse, reset]);

    const onSubmit: SubmitHandler<SupplierFormValues> = (values) => {
        const payload = {
            name: values.name,
            code: values.code,
            contact_person: values.contactPerson,
            email: values.email,
            phone: values.phone,
            address: values.address,
            city: values.city,
            state: values.state,
            postal_code: values.postal_code,
            country: values.country,
            payment_terms: values.paymentTerms,
            latitude: values.latitude,
            longitude: values.longitude,
            is_active: values.status === "Active",
            thumb_url: values.thumb_url || "",
            gallery_items: values.gallery_items || [],
        };

        updateSupplier({ id: supplierId, body: payload }, {
            onSuccess: (res: any) => {
                if (res?.status) {
                    toast.success("Supplier updated successfully");
                    navigate({ to: "/suppliers" });
                }
            },
            onError: () => {
                toast.error("Failed to update supplier");
            }
        });
    };

    if (isFetching) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

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

            <main className="p-6 lg:p-10">
                <div className="space-y-6 max-w-5xl mx-auto pb-6">
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                Update Supplier
                            </h1>
                            <p className="text-muted-foreground mt-2">Update supplier profile and contact information</p>
                        </div>
                        <BackButton to="/suppliers" />
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* BASIC INFORMATION */}
                            <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg py-0">
                                <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                                            <Building2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Basic Information</CardTitle>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Essential supplier details and contact information</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-6">
                                    <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                                        {/* Left side: Form fields */}
                                        <div className="flex-1">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Name</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Supplier Name" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="code"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Supplier Code (optional)</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="e.g., SUP001" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="email"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Email</FormLabel>
                                                            <FormControl>
                                                                <Input type="email" placeholder="supplier@example.com" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="phone"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Phone</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="+60 123-456-7890" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="contactPerson"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Contact Person</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="John Doe" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="paymentTerms"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Payment Terms</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="e.g., Net 30" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        {/* Right side: Profile Image */}
                                        <div className="flex md:justify-end">
                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name="thumb_url"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Supplier Logo</FormLabel>
                                                            <ImageUploaderPro
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                            />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* SUPPLIER GALLERY */}
                            <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg py-0">
                                <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                                            <ImageIcon className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Supplier Gallery</CardTitle>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Upload images of products or premises</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-6">
                                    <FormField
                                        control={form.control}
                                        name="gallery_items"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Supplier Gallery</FormLabel>
                                                <ImageUploaderPro
                                                    value={field.value || []}
                                                    onChange={(file) => field.onChange(file)}
                                                    multiple
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* ADDRESS */}
                            <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg py-0">
                                <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                                            <MapPin className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Address Details</CardTitle>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Location and geographical information</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid gap-4 md:grid-cols-2 pb-6">
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>Address</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Full Address" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>State / Province</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="State" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="postal_code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Postal Code</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Postal code" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="City" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Country</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Country" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="latitude"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Latitude (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        placeholder="e.g. 40.7128"
                                                        value={field.value || ""}
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target.value ? Number(e.target.value) : undefined
                                                            )
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="longitude"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Longitude (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        placeholder="e.g. -74.0060"
                                                        value={field.value || ""}
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target.value ? Number(e.target.value) : undefined
                                                            )
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* STATUS */}
                            <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg py-0">
                                <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                                            <User className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Status</CardTitle>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Set supplier availability status</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-6">
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select Status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Active">Active</SelectItem>
                                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* SUBMIT */}
                            <div className="flex justify-end gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => navigate({ to: '/suppliers' })}
                                    className="px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-500/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/50 active:translate-y-0 active:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                                >
                                    {isUpdating ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Updating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span>Save Supplier</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </Form>
                </div>
            </main>
        </>
    );
}

export default EditSupplierPage;
