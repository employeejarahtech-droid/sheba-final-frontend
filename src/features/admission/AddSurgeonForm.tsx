import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose,
} from '@/components/ui/sheet'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

const surgeonSchema = z.object({
    surgeon_id: z.number().positive('Surgeon is required'),
    operation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    fees: z.number().nonnegative('Fees must be non-negative'),
})

type SurgeonFormData = z.infer<typeof surgeonSchema>

interface AddSurgeonFormProps {
    open: boolean
    setOpen: (open: boolean) => void
    onAdd: (surgeon: {
        id?: number
        surgeon_id: number
        operation_date: string
        fees: number
        surgeon_name?: string
    }) => void
    doctors: any[]
    editSurgeon?: {
        id: number
        surgeon_id: number
        operation_date: string
        fees: number
    } | null
}

export function AddSurgeonForm({ open, setOpen, onAdd, doctors, editSurgeon }: AddSurgeonFormProps) {
    const [searchTerm, setSearchTerm] = useState('')

    // Filter doctors based on search term
    const filteredDoctors = doctors.filter((doctor: any) =>
        doctor.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.speciality?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const form = useForm<SurgeonFormData>({
        resolver: zodResolver(surgeonSchema),
        defaultValues: {
            surgeon_id: 0,
            operation_date: new Date().toISOString().split('T')[0],
            fees: 0,
        },
    })

    // Reset form when editSurgeon changes
    useEffect(() => {
        if (editSurgeon) {
            form.reset({
                surgeon_id: editSurgeon.surgeon_id,
                operation_date: editSurgeon.operation_date,
                fees: editSurgeon.fees,
            })
        } else {
            form.reset({
                surgeon_id: 0,
                operation_date: new Date().toISOString().split('T')[0],
                fees: 0,
            })
        }
        setSearchTerm('') // Reset search when opening or changing edit mode
    }, [editSurgeon, form])

    const handleAddSurgeon = (data: SurgeonFormData) => {
        const doctor = doctors.find((d: any) => d.id === data.surgeon_id)
        onAdd({
            id: editSurgeon?.id,
            ...data,
            surgeon_name: doctor?.doctor_name || 'Unknown',
        })
        form.reset()
        setOpen(false)
    }

    return (
        <>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="max-w-[450px] w-full">
                    <SheetHeader>
                        <SheetTitle>{editSurgeon ? 'Edit Surgeon' : 'Add Surgeon'}</SheetTitle>
                    </SheetHeader>

                    <div className="px-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleAddSurgeon)} className="space-y-4">
                                <div className="mt-6 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="surgeon_id"
                                        render={() => (
                                            <FormItem>
                                                <FormLabel>Surgeon *</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={(value) => form.setValue('surgeon_id', Number(value))}
                                                        value={form.getValues('surgeon_id')?.toString()}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select surgeon..." />
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
                                                                    {searchTerm ? 'No results found' : 'No doctors available'}
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
                                        name="operation_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Operation Date *</FormLabel>
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
                                                <FormLabel>Fees (৳) *</FormLabel>
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
                                            {editSurgeon ? 'Update Surgeon' : 'Add Surgeon'}
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
    )
}
