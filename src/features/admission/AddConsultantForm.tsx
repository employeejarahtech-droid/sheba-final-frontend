import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { Search } from "lucide-react";

const consultantSchema = z.object({
    consultant_id: z.number().positive('Consultant is required'),
    visit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    fees: z.number().nonnegative('Fees must be non-negative'),
})

type ConsultantFormData = z.infer<typeof consultantSchema>

interface AddConsultantFormProps {
    open: boolean
    setOpen: (open: boolean) => void
    onAdd: (consultant: {
        id?: number
        consultant_id: number
        visit_date: string
        fees: number
        consultant_name?: string
    }) => void
    doctors: any[]
    editConsultant?: {
        id: number
        consultant_id: number
        visit_date: string
        fees: number
    } | null
}

export function AddConsultantForm({ open, setOpen, onAdd, doctors, editConsultant }: AddConsultantFormProps) {

    const [searchTerm, setSearchTerm] = useState('');

    // Filter doctors based on search term
    const filteredDoctors = doctors.filter((doctor: any) =>
        doctor.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.speciality?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const form = useForm<ConsultantFormData>({
        resolver: zodResolver(consultantSchema),
        defaultValues: {
            consultant_id: 0,
            visit_date: new Date().toISOString().split('T')[0],
            fees: 0,
        },
    });

    // Reset form when editConsultant changes
    useEffect(() => {
        if (editConsultant) {
            form.reset({
                consultant_id: editConsultant.consultant_id,
                visit_date: editConsultant.visit_date,
                fees: editConsultant.fees,
            })
        } else {
            form.reset({
                consultant_id: 0,
                visit_date: new Date().toISOString().split('T')[0],
                fees: 0,
            })
        }
        setSearchTerm(''); // Reset search when opening or changing edit mode
    }, [editConsultant, form])

    const handleAddConsultant = (data: ConsultantFormData) => {
        const doctor = doctors.find((d: any) => d.id === data.consultant_id);
        onAdd({
            id: editConsultant?.id,
            consultant_id: data.consultant_id,
            visit_date: data.visit_date,
            fees: data.fees,
            consultant_name: doctor?.doctor_name || 'Unknown',
        });
        form.reset();
        setOpen(false);
    };

    return (
        <>
            {/* Drawer */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="max-w-[450px] w-full">
                    <SheetHeader>
                        <SheetTitle>{editConsultant ? 'Edit Consultant' : 'Add New Consultant'}</SheetTitle>
                    </SheetHeader>

                    <div className="px-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleAddConsultant)} className="space-y-4">
                                <div className="mt-6 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="consultant_id"
                                        render={() => (
                                            <FormItem>
                                                <FormLabel>Consultant *</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={(value) => form.setValue('consultant_id', Number(value))}
                                                        value={form.getValues('consultant_id')?.toString()}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select consultant..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {/* Search Input inside dropdown */}
                                                            <div className="p-2 sticky top-0 bg-white dark:bg-gray-950 z-10 border-b">
                                                                <div className="relative">
                                                                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                                                    <Input
                                                                        type="text"
                                                                        placeholder="Search doctors..."
                                                                        value={searchTerm}
                                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                                        className="pl-8 h-8 text-sm"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                </div>
                                                            </div>
                                                            {filteredDoctors.length > 0 ? (
                                                                filteredDoctors.map((doctor: any) => (
                                                                    <SelectItem key={doctor.id} value={String(doctor.id)}>
                                                                        {doctor.doctor_name} - {doctor.speciality || 'General'}
                                                                    </SelectItem>
                                                                ))
                                                            ) : (
                                                                <div className="px-2 py-1.5 text-sm text-gray-500">
                                                                    {searchTerm ? 'No results found' : 'No consultants available'}
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
                                        name="visit_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date *</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="fees"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Fee (৳) *</FormLabel>
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
                                            {editConsultant ? 'Update Consultant' : 'Add Consultant'}
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
        </>
    );
}
