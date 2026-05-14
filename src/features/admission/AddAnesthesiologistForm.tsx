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

const anesthesiologistSchema = z.object({
    anesthesiologist_id: z.number().positive('Anesthesiologist is required'),
    anesthesia_type: z.string().min(1, 'Anesthesia type is required'),
    operation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    fees: z.number().nonnegative('Fees must be non-negative'),
})

type AnesthesiologistFormData = z.infer<typeof anesthesiologistSchema>

interface AddAnesthesiologistFormProps {
    open: boolean
    setOpen: (open: boolean) => void
    onAdd: (anesthesiologist: {
        id?: number
        anesthesiologist_id: number
        anesthesia_type: string
        operation_date: string
        fees: number
        anesthesiologist_name?: string
    }) => void
    doctors: any[]
    anesthesiaTypes: string[]  // Now fetched from DB
    editAnesthesiologist?: {
        id: number
        anesthesiologist_id: number
        anesthesia_type: string
        operation_date: string
        fees: number
    } | null
}

export function AddAnesthesiologistForm({ open, setOpen, onAdd, doctors, anesthesiaTypes, editAnesthesiologist }: AddAnesthesiologistFormProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [anesthesiaSearchTerm, setAnesthesiaSearchTerm] = useState('')

    // Filter doctors based on search term
    const filteredDoctors = doctors.filter((doctor: any) =>
        doctor.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.speciality?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Filter anesthesia types based on search term
    const filteredAnesthesiaTypes = anesthesiaTypes.filter(type =>
        type.toLowerCase().includes(anesthesiaSearchTerm.toLowerCase())
    )

    const form = useForm<AnesthesiologistFormData>({
        resolver: zodResolver(anesthesiologistSchema),
        defaultValues: {
            anesthesiologist_id: 0,
            anesthesia_type: '',
            operation_date: new Date().toISOString().split('T')[0],
            fees: 0,
        },
    })

    // Reset form when editAnesthesiologist changes
    useEffect(() => {
        if (editAnesthesiologist) {
            form.reset({
                anesthesiologist_id: editAnesthesiologist.anesthesiologist_id,
                anesthesia_type: editAnesthesiologist.anesthesia_type,
                operation_date: editAnesthesiologist.operation_date,
                fees: editAnesthesiologist.fees,
            })
        } else {
            form.reset({
                anesthesiologist_id: 0,
                anesthesia_type: '',
                operation_date: new Date().toISOString().split('T')[0],
                fees: 0,
            })
        }
        setSearchTerm('') // Reset search when opening or changing edit mode
        setAnesthesiaSearchTerm('')
    }, [editAnesthesiologist, form])

    const handleAddAnesthesiologist = (data: AnesthesiologistFormData) => {
        const doctor = doctors.find((d: any) => d.id === data.anesthesiologist_id)
        onAdd({
            id: editAnesthesiologist?.id,
            ...data,
            anesthesiologist_name: doctor?.doctor_name || 'Unknown',
        })
        form.reset()
        setOpen(false)
    }

    return (
        <>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="max-w-[450px] w-full">
                    <SheetHeader>
                        <SheetTitle>{editAnesthesiologist ? 'Edit Anesthesiologist' : 'Add Anesthesiologist'}</SheetTitle>
                    </SheetHeader>

                    <div className="px-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleAddAnesthesiologist)} className="space-y-4">
                                <div className="mt-6 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="anesthesiologist_id"
                                        render={() => (
                                            <FormItem>
                                                <FormLabel>Anesthesiologist *</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={(value) => form.setValue('anesthesiologist_id', Number(value))}
                                                        value={form.getValues('anesthesiologist_id')?.toString()}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select anesthesiologist..." />
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
                                        name="anesthesia_type"
                                        render={() => (
                                            <FormItem>
                                                <FormLabel>Anesthesia Type *</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={(value) => form.setValue('anesthesia_type', value)}
                                                        value={form.getValues('anesthesia_type')}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select anesthesia type..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {/* Search Input inside dropdown */}
                                                            <div className="p-2 sticky top-0 bg-white dark:bg-gray-950 z-10 border-b">
                                                                <div className="relative">
                                                                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                                                    <Input
                                                                        type="text"
                                                                        placeholder="Search anesthesia type..."
                                                                        value={anesthesiaSearchTerm}
                                                                        onChange={(e) => setAnesthesiaSearchTerm(e.target.value)}
                                                                        className="pl-8 h-8 text-sm"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                </div>
                                                            </div>
                                                            {filteredAnesthesiaTypes.length > 0 ? (
                                                                filteredAnesthesiaTypes.map((type) => (
                                                                    <SelectItem key={type} value={type}>
                                                                        {type}
                                                                    </SelectItem>
                                                                ))
                                                            ) : (
                                                                <div className="px-2 py-1.5 text-sm text-gray-500">
                                                                    {anesthesiaSearchTerm ? 'No results found' : 'No types available'}
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
                                            {editAnesthesiologist ? 'Update Anesthesiologist' : 'Add Anesthesiologist'}
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
