import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
    Controller,
    useForm,
    type SubmitHandler,
    type Resolver,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { User, CheckCircle2, Phone, MapPin, Image as ImageIcon } from "lucide-react";
import ImageUploaderPro from "@/components/form/ImageUploaderPro";
import { AddressAutocomplete, type AddressDetails } from "@/components/form/AddressAutocomplete";
import { useAddCustomerMutation } from "@/features/customers/api/queries";
import { Header } from "@/components/layout/header";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { topNav } from "@/data/data";

export const Route = createFileRoute('/_authenticated/customers/create/')({
    component: AddCustomerPage,
});

/* ------------------ ZOD SCHEMA ------------------ */
const customerSchema = z.object({
    name: z.string().min(1, "Required"),
    company: z.string().optional(),
    customer_type: z.enum(["individual", "business", "retail"]).default("individual"),
    tax_id: z.string().optional(),
    email: z.string().email("Invalid email").min(1, "Required"),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postal_code: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    credit_limit: z.number().min(0, "Credit limit must be 0 or more").default(0),
    notes: z.string().optional(),
    is_active: z.boolean().default(true),
    thumb_url: z.string().optional(),
    gallery_items: z.array(z.string()).max(10, "Maximum 10 images").optional(),
    salesRouteId: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

/* ------------------ PAGE ------------------ */
export default function AddCustomerPage() {
    const navigate = useNavigate();
    const { mutate: createCustomer, isPending: isLoading } = useAddCustomerMutation();

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema) as Resolver<CustomerFormValues>,
        defaultValues: {
            name: "",
            company: "",
            customer_type: "individual",
            tax_id: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            country: "",
            postal_code: "",
            thumb_url: "",
            gallery_items: [],
            credit_limit: 0,
            notes: "",
            is_active: true,
            salesRouteId: '',
        },
    });

    const { control, handleSubmit, setValue } = form;

    const onSubmit: SubmitHandler<CustomerFormValues> = async (values) => {
        try {
            const payload = {
                ...values,
                sales_route_id: values.salesRouteId ? Number(values.salesRouteId) : null,
            };
            // @ts-ignore - thumb_url and gallery_items are already in values
            delete payload.salesRouteId;

            createCustomer(payload, {
                onSuccess: () => {
                    toast.success("Customer created successfully");
                    navigate({ to: "/customers" });
                },
                onError: (error: any) => {
                    console.error("Failed to create customer:", error);
                    toast.error(error.message || "Failed to create customer");
                }
            });
        } catch (error: any) {
            console.error("Failed to create customer:", error);
            toast.error("An unexpected error occurred");
        }
    };

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
                                Add Customer
                            </h1>
                            <p className="text-muted-foreground mt-2">Create a new customer profile</p>
                        </div>
                        <BackButton />
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* BASIC INFORMATION */}
                        <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg py-0">
                            <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                                        <User className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Basic Information</CardTitle>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Customer name, type, and images</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-6">
                                <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                                    {/* Left side: Name, Company, Type, Tax ID in a grid */}
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Controller
                                            control={control}
                                            name="name"
                                            render={({ field, fieldState }) => (
                                                <Field>
                                                    <FieldLabel>Customer Name *</FieldLabel>
                                                    <Input placeholder="e.g. John Doe" {...field} />
                                                    <FieldError>{fieldState.error?.message}</FieldError>
                                                </Field>
                                            )}
                                        />

                                        <Controller
                                            control={control}
                                            name="company"
                                            render={({ field, fieldState }) => (
                                                <Field>
                                                    <FieldLabel>Company Name</FieldLabel>
                                                    <Input placeholder="e.g. Acme Corp" {...field} />
                                                    <FieldError>{fieldState.error?.message}</FieldError>
                                                </Field>
                                            )}
                                        />

                                        <Controller
                                            control={control}
                                            name="customer_type"
                                            render={({ field, fieldState }) => (
                                                <Field>
                                                    <FieldLabel>Customer Type</FieldLabel>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="individual">Individual</SelectItem>
                                                            <SelectItem value="business">Business</SelectItem>
                                                            <SelectItem value="retail">Retail</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FieldError>{fieldState.error?.message}</FieldError>
                                                </Field>
                                            )}
                                        />

                                        <Controller
                                            control={control}
                                            name="tax_id"
                                            render={({ field, fieldState }) => (
                                                <Field>
                                                    <FieldLabel>Tax ID / Registration Number</FieldLabel>
                                                    <Input placeholder="GST / VAT / Company Reg." {...field} />
                                                    <FieldError>{fieldState.error?.message}</FieldError>
                                                </Field>
                                            )}
                                        />
                                    </div>

                                    {/* Right side: Primary Image */}
                                    <div className="flex md:justify-end">
                                        <div>
                                            <Controller
                                                control={control}
                                                name="thumb_url"
                                                render={({ field, fieldState }) => (
                                                    <Field>
                                                        <FieldLabel>Primary Image</FieldLabel>
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

                        {/* CUSTOMER GALLERY */}
                        <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg py-0">
                            <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                                        <ImageIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Customer Gallery</CardTitle>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Upload additional customer images</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-6">
                                <Controller
                                    control={control}
                                    name="gallery_items"
                                    render={({ field, fieldState }) => (
                                        <Field>
                                            <FieldLabel>Gallery (max 10)</FieldLabel>
                                            <ImageUploaderPro
                                                multiple
                                                value={field.value || []}
                                                onChange={(v) => {
                                                    const arr = Array.isArray(v) ? v : v ? [v] : [];
                                                    if (arr.length > 10) {
                                                        toast.error("You can upload up to 10 images only");
                                                        arr.splice(10);
                                                    }
                                                    field.onChange(arr);
                                                }}
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Optional. Upload up to 10 additional images for the customer.
                                            </p>
                                            <FieldError>{fieldState?.error?.message}</FieldError>
                                        </Field>
                                    )}
                                />
                            </CardContent>
                        </Card>


                        {/* CONTACT DETAILS */}
                        <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg py-0">
                            <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                                        <Phone className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Contact Details</CardTitle>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Email and phone information</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-6">
                                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                                    <Controller
                                        control={control}
                                        name="email"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>Email *</FieldLabel>
                                                <Input type="email" placeholder="Enter email" {...field} />
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />

                                    <Controller
                                        control={control}
                                        name="phone"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>Phone</FieldLabel>
                                                <Input placeholder="Enter phone" {...field} />
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* ADDRESS DETAILS */}
                        <Card className="border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg py-0">
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
                            <CardContent className="pb-6">
                                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                                    <Controller
                                        control={control}
                                        name="address"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>Address</FieldLabel>
                                                <AddressAutocomplete
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Search address"
                                                    onAddressSelect={(details: AddressDetails) => {
                                                        field.onChange(details.address);
                                                        setValue("city", details.city);
                                                        setValue("state", details.state);
                                                        setValue("postal_code", details.postalCode);
                                                        setValue("country", details.country);
                                                        setValue("latitude", details.latitude);
                                                        setValue("longitude", details.longitude);
                                                    }}
                                                />
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />

                                    <Controller
                                        control={control}
                                        name="city"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>City</FieldLabel>
                                                <Input placeholder="City" {...field} />
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />

                                    <Controller
                                        control={control}
                                        name="state"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>State / Province</FieldLabel>
                                                <Input placeholder="State" {...field} />
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />

                                    <Controller
                                        control={control}
                                        name="postal_code"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>Postal Code</FieldLabel>
                                                <Input placeholder="Postal code" {...field} />
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />

                                    <Controller
                                        control={control}
                                        name="country"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>Country</FieldLabel>
                                                <Input placeholder="Country" {...field} />
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        control={control}
                                        name="latitude"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>Latitude (Optional)</FieldLabel>
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
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />

                                    <Controller
                                        control={control}
                                        name="longitude"
                                        render={({ field, fieldState }) => (
                                            <Field>
                                                <FieldLabel>Longitude (Optional)</FieldLabel>
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
                                                <FieldError>{fieldState.error?.message}</FieldError>
                                            </Field>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>



                        {/* SUBMIT */}
                        <div className="flex justify-end gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => navigate({ to: '/customers' })}
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
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span>Save Customer</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}
