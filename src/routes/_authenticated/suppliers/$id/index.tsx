import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ShoppingCart,
    Pencil,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Wallet,
    FileText,
    Globe,
    Calendar,
    Star,
    Hash,
    User,
    Monitor
} from "lucide-react";
import { useGetSupplierByIdQuery } from "@/features/suppliers/api/queries";
import { Header } from "@/components/layout/header";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ConfigDrawer } from "@/components/config-drawer";
import { topNav } from "@/data/data";
import { BackButton } from "@/components/BackButton";

export const Route = createFileRoute('/_authenticated/suppliers/$id/')({
    component: SupplierDetailsPage,
});

function SupplierDetailsPage() {
    const { id: supplierId } = Route.useParams();
    const navigate = useNavigate();
    const { data: supplierResponse, isLoading, error } = useGetSupplierByIdQuery(supplierId);
    const supplier = supplierResponse?.data;

    // Mock currency for now if not available in global state
    const currency = "MYR";

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p>Loading supplier details...</p>
                </div>
            </div>
        );
    }

    if (error || !supplier) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
                <div className="bg-destructive/10 p-4 rounded-full text-destructive">
                    <FileText size={48} />
                </div>
                <div>
                    <h3 className="text-xl font-bold">Supplier Not Found</h3>
                    <p className="text-muted-foreground">The supplier you are looking for does not exist or an error occurred.</p>
                </div>
                <BackButton to="/suppliers" />
            </div>
        );
    }

    const fullAddress = [
        supplier.address,
        supplier.city,
        supplier.state,
        supplier.postal_code,
        supplier.country
    ].filter(Boolean).join(", ");

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
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
                <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in-50 duration-500 pb-20">
                    {/* TOP NAVIGATION / HEADER */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <BackButton to="/suppliers" />
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">{supplier.name}</h1>
                                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                    <Badge variant="outline" className="text-xs font-normal">ID: {supplier.id}</Badge>
                                    <span className="text-xs">•</span>
                                    {supplier.code && (
                                        <span className="text-sm flex items-center gap-1">
                                            Code: {supplier.code}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button className="shadow-sm" onClick={() => navigate({ to: '/suppliers' })}>
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Create Purchase
                            </Button>

                            <Link to="/suppliers/$id/edit" params={{ id: supplierId }}>
                                <Button variant="outline" className="shadow-sm">
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT COLUMN: IDENTIFICATION & CONTACT */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* PROFILE CARD */}
                            <Card className="overflow-hidden shadow-md border-border/60 py-0">
                                <div className="h-24 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
                                <CardContent className="pt-0 relative px-6 pb-6">
                                    <div className="flex justify-between items-end -mt-10 mb-4">
                                        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                            <AvatarImage src={supplier.thumb_url} />
                                            <AvatarFallback className="text-xl font-bold bg-slate-100 text-slate-700">
                                                {getInitials(supplier.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <Badge
                                            className={`mb-2 px-3 py-1 ${supplier.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                            variant="secondary"
                                        >
                                            {supplier.is_active ? "Active Status" : "Inactive"}
                                        </Badge>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h2 className="text-xl font-bold">{supplier.name}</h2>
                                            {supplier.contact_person && (
                                                <p className="text-primary font-medium flex items-center gap-1 mt-1">
                                                    <User size={14} /> {supplier.contact_person}
                                                </p>
                                            )}
                                        </div>

                                        <Separator />

                                        <div className="space-y-3 text-sm">
                                            <div className="flex items-start gap-3 text-muted-foreground hover:text-foreground transition-colors group">
                                                <div className="bg-muted p-2 rounded-md group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                    <Mail size={16} />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs font-medium uppercase text-muted-foreground/70 mb-0.5">Email Address</p>
                                                    <p className="truncate font-medium">{supplier.email || "—"}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3 text-muted-foreground hover:text-foreground transition-colors group">
                                                <div className="bg-muted p-2 rounded-md group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                    <Phone size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium uppercase text-muted-foreground/70 mb-0.5">Phone Number</p>
                                                    <p className="font-medium">{supplier.phone || "—"}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3 text-muted-foreground hover:text-foreground transition-colors group">
                                                <div className="bg-muted p-2 rounded-md group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                    <MapPin size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium uppercase text-muted-foreground/70 mb-0.5">Address</p>
                                                    <p className="font-medium leading-relaxed max-w-[250px]">{fullAddress || "—"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* LOCATION / MAP PLACEHOLDER */}
                            {(supplier.latitude || supplier.longitude) && (
                                <Card className="shadow-sm border-border/60 pt-4 pb-6">
                                    <CardHeader className="gap-0">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Globe size={16} className="text-blue-500" /> Location
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-muted/50 rounded-lg p-4 text-center text-sm text-muted-foreground border border-dashed">
                                            <p>Map Preview Unavailable</p>
                                            <p className="text-xs mt-1 font-mono">{supplier.latitude || 0}, {supplier.longitude || 0}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* RIGHT COLUMN: FINANCIALS & DETAILS */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* FINANCIAL OVERVIEW */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="shadow-sm border-l-4 border-l-orange-500 border-t-0 border-b-0 border-r-0 ring-1 ring-border/60">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-1">Total Due Amount</p>
                                            <h3 className="text-2xl font-bold text-foreground">
                                                {currency} {Number(supplier.total_due_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </h3>
                                        </div>
                                        <div className="h-12 w-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
                                            <Wallet size={24} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm border-l-4 border-l-blue-500 border-t-0 border-b-0 border-r-0 ring-1 ring-border/60">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-1">Total Purchases</p>
                                            <h3 className="text-2xl font-bold text-foreground">
                                                {currency} {Number(supplier.total_purchase_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </h3>
                                        </div>
                                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                            <CreditCard size={24} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* ADDITIONAL DETAILS TABLE */}
                            <Card className="shadow-sm border-border/60 overflow-hidden">
                                <CardHeader className="border-b-1 bg-muted/20 py-4 gap-0">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-muted-foreground" />
                                        <CardTitle className="text-lg">Additional Information</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-6 pb-6">
                                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">

                                        <div className="space-y-1">
                                            <dt className="text-sm font-medium text-muted-foreground">Tax / VAT ID</dt>
                                            <dd className="text-base font-medium flex items-center gap-2">
                                                <Hash size={14} className="text-muted-foreground" />
                                                {supplier.tax_id || "Not Provided"}
                                            </dd>
                                        </div>

                                        <div className="space-y-1">
                                            <dt className="text-sm font-medium text-muted-foreground">Payment Terms</dt>
                                            <dd className="text-base font-medium flex items-center gap-2">
                                                <Calendar size={14} className="text-muted-foreground" />
                                                {supplier.payment_terms || "Not Provided"}
                                            </dd>
                                        </div>

                                        <div className="space-y-1">
                                            <dt className="text-sm font-medium text-muted-foreground">Website</dt>
                                            <dd className="text-base font-medium flex items-center gap-2">
                                                <Monitor size={14} className="text-muted-foreground" />
                                                {supplier.website ? (
                                                    <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                        {supplier.website}
                                                    </a>
                                                ) : "Not Provided"}
                                            </dd>
                                        </div>

                                        <div className="space-y-1">
                                            <dt className="text-sm font-medium text-muted-foreground">Supplier Since</dt>
                                            <dd className="text-base font-medium flex items-center gap-2">
                                                <Calendar size={14} className="text-muted-foreground" />
                                                {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : "Unknown"}
                                            </dd>
                                        </div>

                                    </dl>
                                </CardContent>
                            </Card>

                            {/* NOTES SECTION */}
                            {supplier.notes && (
                                <Card className="shadow-sm border-border/60 bg-amber-50/50 dark:bg-amber-900/10">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-500">
                                            <Star size={16} className="fill-amber-600 text-amber-600 dark:text-amber-500" />
                                            Important Notes
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {supplier.notes}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

export default SupplierDetailsPage;
