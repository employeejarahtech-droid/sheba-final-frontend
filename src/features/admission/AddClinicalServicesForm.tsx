import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { LayoutGrid, Search } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";

const serviceSchema = z.object({
    service_id: z.number().positive('Service is required'),
    note: z.string().optional(),
    amount: z.number().nonnegative('Amount must be non-negative'),
})

type ServiceFormData = z.infer<typeof serviceSchema>

interface AddServiceFormProps {
    open: boolean
    setOpen: (open: boolean) => void
    onAdd: (service: {
        id?: number
        service_id: number
        note?: string
        amount: number
        service_name?: string
    }) => void
    services: any[]
    editService?: {
        id: number
        service_id: number
        note?: string
        amount: number
    } | null
}

export function AddClinicalServicesForm({ open, setOpen, onAdd, services, editService }: AddServiceFormProps) {
    const { currencySymbol } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('')

    // Filter services based on search term
    const filteredServices = services.filter((service: any) =>
        service.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const form = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            service_id: 0,
            note: '',
            amount: 0,
        },
    });

    // Reset form when editService changes
    useEffect(() => {
        if (editService) {
            form.reset({
                service_id: editService.service_id,
                note: editService.note,
                amount: editService.amount,
            })
        } else {
            form.reset({
                service_id: 0,
                note: '',
                amount: 0,
            })
        }
        setSearchTerm('') // Reset search when opening or changing edit mode
    }, [editService, form])

    const handleAddService = (data: ServiceFormData) => {
        onAdd({
            id: editService?.id,
            ...data,
        })
        form.reset()
        setOpen(false)
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="right" className="max-w-[450px] w-full">
                <SheetHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-3 px-4 gap-0">
                    <div className="flex items-center gap-2.5 pr-8">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md text-white">
                            <LayoutGrid className="h-4 w-4" />
                        </div>
                        <div>
                            <SheetTitle className="text-lg font-bold">{editService ? 'Edit Service' : 'Add Service'}</SheetTitle>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Hospital clinical services, test charges, and utility bills</p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="px-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleAddService)} className="space-y-4">
                            <div className="mt-6 space-y-4">
                                <FormField
                                    control={form.control}
                                    name="service_id"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>Service *</FormLabel>
                                            <FormControl>
                                                <Select
                                                    onValueChange={(value) => {
                                                        const serviceId = Number(value)
                                                        form.setValue('service_id', serviceId, { shouldValidate: true })
                                                        const selectedService = services.find((s: any) => s.id === serviceId)
                                                        if (selectedService && selectedService.price !== undefined && selectedService.price !== null) {
                                                            form.setValue('amount', Number(selectedService.price), { shouldValidate: true })
                                                        }
                                                    }}
                                                    value={form.getValues('service_id')?.toString() || ''}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select service..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {/* Search Input inside dropdown */}
                                                        <div className="p-2 sticky top-0 bg-white dark:bg-gray-950 z-10 border-b">
                                                            <div className="relative">
                                                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                                                <Input
                                                                    type="text"
                                                                    placeholder="Search services..."
                                                                    value={searchTerm}
                                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                                    className="pl-8 h-8 text-sm"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            </div>
                                                        </div>
                                                        {filteredServices.length > 0 ? (
                                                            filteredServices.map((service: any) => (
                                                                <SelectItem key={service.id} value={String(service.id)}>
                                                                    {service.name} {service.price !== undefined && service.price !== null ? `(${currencySymbol} ${Number(service.price).toFixed(2)})` : ''}
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <div className="px-2 py-1.5 text-sm text-gray-500">
                                                                {searchTerm ? 'No results found' : 'No services available'}
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="note"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Note</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter note..." {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount ({currencySymbol}) *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    {...field}
                                                    value={field.value || ''}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <SheetFooter>
                                    <Button type="submit">
                                        {editService ? 'Update Service' : 'Add Service'}
                                    </Button>
                                    <SheetClose asChild>
                                        <Button variant="secondary" type="button">Cancel</Button>
                                    </SheetClose>
                                </SheetFooter>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
