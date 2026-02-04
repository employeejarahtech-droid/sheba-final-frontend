import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Header } from "@/components/layout/header"
import { TopNav } from "@/components/layout/top-nav"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { Search } from "@/components/search"
import { ThemeSwitch } from "@/components/theme-switch"
import { ConfigDrawer } from "@/components/config-drawer"
import { topNav } from "@/data/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from "@/components/ui/select"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { ChevronLeft, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
// import { toast } from "sonner" 
import { useGetAllPurchaseOrdersQuery, useAddPurchasePaymentMutation } from "@/features/purchase/api/purchaseQueries"

export const Route = createFileRoute('/_authenticated/purchase/payments/create/')({
    component: CreatePurchasePayment,
})

const paymentSchema = z.object({
    purchase_order_id: z.number().min(1, "Purchase Order is required"),
    amount: z.number().min(0.01, "Amount must be greater than 0"),
    payment_method: z.string().min(1, "Payment method is required"),
    reference: z.string().optional(),
    notes: z.string().optional(),
})

type PaymentFormValues = z.infer<typeof paymentSchema>

function CreatePurchasePayment() {
    const navigate = useNavigate()
    const currency = "MYR"

    // Hooks
    const { data: poResponse } = useGetAllPurchaseOrdersQuery({ limit: 100 }) // Fetching all/recent POs to select from
    const addPaymentMutation = useAddPurchasePaymentMutation()

    const purchaseOrders = poResponse?.data || []

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            purchase_order_id: 0,
            amount: 0,
            payment_method: "",
            reference: "",
            notes: "",
        },
    })

    const watchPO = form.watch("purchase_order_id")
    const watchAmount = form.watch("amount")
    const watchMethod = form.watch("payment_method")

    const purchaseOrderDetails = purchaseOrders.find((po: any) => po.id === watchPO)

    const subtotal = purchaseOrderDetails?.total_amount ?? 0
    const tax = purchaseOrderDetails?.tax_amount ?? 0
    const discount = purchaseOrderDetails?.discount_amount ?? 0
    // Fix: Ensure we fallback to 0 if unexpected type
    const total = (Number(subtotal) || 0) + (Number(tax) || 0) - (Number(discount) || 0)
    const paid = purchaseOrderDetails?.total_paid_amount || 0
    const balance = total - paid

    async function onSubmit(values: PaymentFormValues) {
        try {
            await addPaymentMutation.mutateAsync({
                ...values,
                amount: Number(values.amount)
            })
            // toast.success("Payment recorded successfully!")
            navigate({ to: '/purchase/payments' })
        } catch (error) {
            console.error("Failed to record payment", error)
            // toast.error("Failed to record payment")
        }
    }

    const [poOpen, setPoOpen] = useState(false)

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
                <div className="w-full max-w-7xl mx-auto">
                    {/* BACK BUTTON */}
                    <div className="flex items-center gap-2 mb-6">
                        <Link to="/purchase/payments">
                            <Button variant="outline" className="flex items-center gap-2">
                                <ChevronLeft size={16} /> Back to Payments
                            </Button>
                        </Link>
                    </div>

                    <h1 className="text-2xl font-bold mb-6">Record Purchase Payment</h1>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* FORM */}
                        <div className="lg:col-span-2 rounded-lg border p-6 bg-card text-card-foreground shadow-sm">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <h2 className="text-lg font-semibold mb-4">Payment Details</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* PURCHASE ORDER */}
                                        <FormField
                                            name="purchase_order_id"
                                            control={form.control}
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Purchase Order</FormLabel>
                                                    <Popover open={poOpen} onOpenChange={setPoOpen}>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className={cn(
                                                                        "w-full justify-between",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value
                                                                        ? purchaseOrders.find(
                                                                            (po: any) => po.id === field.value
                                                                        )?.po_number
                                                                        : "Select Purchase Order"}
                                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[300px] p-0">
                                                            <Command>
                                                                <CommandInput placeholder="Search Purchase Order..." />
                                                                <CommandList>
                                                                    <CommandEmpty>No PO found.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {purchaseOrders.map((po: any) => (
                                                                            <CommandItem
                                                                                value={po.po_number}
                                                                                key={po.id}
                                                                                onSelect={() => {
                                                                                    form.setValue("purchase_order_id", po.id)
                                                                                    setPoOpen(false)
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        po.id === field.value
                                                                                            ? "opacity-100"
                                                                                            : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                {po.po_number} ({currency} {po.total_amount ?? 0})
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

                                        {/* AMOUNT */}
                                        <FormField
                                            name="amount"
                                            control={form.control}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Amount ({currency})</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="Enter amount"
                                                            {...field}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value);
                                                                field.onChange(isNaN(val) ? 0 : val);
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* PAYMENT METHOD */}
                                        <FormField
                                            name="payment_method"
                                            control={form.control}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Payment Method</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select Method" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="cash">Cash</SelectItem>
                                                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                            <SelectItem value="credit_card">Credit Card</SelectItem>
                                                            <SelectItem value="cheque">Cheque</SelectItem>
                                                            <SelectItem value="online">Online</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* REFERENCE */}
                                        <FormField
                                            name="reference"
                                            control={form.control}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Reference</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Transaction ID or Cheque #" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* NOTES */}
                                        <FormField
                                            name="notes"
                                            control={form.control}
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel>Notes</FormLabel>
                                                    <FormControl>
                                                        <Textarea placeholder="Additional notes..." className="h-28" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <Button
                                            disabled={!watchPO || !watchAmount || (watchAmount > balance + 0.01) || addPaymentMutation.isPending}
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            {addPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => {
                                                form.reset();
                                                navigate({ to: '/purchase/payments' });
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </div>

                        {/* SUMMARY PANEL */}
                        <div className="h-fit rounded-xl border-2 border-primary/10 bg-card shadow-lg shadow-primary/5 overflow-hidden sticky top-6">
                            <div className="bg-primary/5 p-4 border-b border-primary/10">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    Payment Summary
                                </h2>
                            </div>

                            <div className="p-6 space-y-6">
                                {purchaseOrderDetails ? (
                                    <>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center pb-2 border-b">
                                                <span className="text-sm text-muted-foreground">PO Number</span>
                                                <span className="font-semibold">{purchaseOrderDetails.po_number}</span>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Subtotal</span>
                                                    <span className="font-medium">{currency} {Number(subtotal).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Tax</span>
                                                    <span className="font-medium">{currency} {Number(tax).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Discount</span>
                                                    <span className="font-medium text-red-500">- {currency} {Number(discount).toFixed(2)}</span>
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-semibold">Total Amount</span>
                                                    <span className="font-bold text-lg text-primary">{currency} {total.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-emerald-600 font-medium">Already Paid</span>
                                                    <span className="text-emerald-600 font-bold">{currency} {Number(paid).toFixed(2)}</span>
                                                </div>
                                            </div>

                                            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800/50">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold text-amber-900 dark:text-amber-100">Remaining Balance</span>
                                                    <span className="font-bold text-xl text-amber-600 dark:text-amber-400">{currency} {balance.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t">
                                            <h3 className="text-sm font-medium text-muted-foreground mb-3">Current Payment</h3>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm">Amount</span>
                                                <span className="font-bold">
                                                    {watchAmount ? `${currency} ${Number(watchAmount).toFixed(2)}` : "-"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">Method</span>
                                                <span className="font-medium capitalize">
                                                    {watchMethod ? watchMethod.replace(/_/g, " ") : "-"}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p>Select a Purchase Order to view details</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
