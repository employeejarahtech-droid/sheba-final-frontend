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

const assistantSchema = z.object({
    assistant_id: z.number().positive('Assistant is required'),
    operation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    fees: z.number().nonnegative('Fees must be non-negative'),
})

type AssistantFormData = z.infer<typeof assistantSchema>

interface AddAssistantFormProps {
    open: boolean
    setOpen: (open: boolean) => void
    onAdd: (assistant: {
        id?: number
        assistant_id: number
        operation_date: string
        fees: number
        assistant_name?: string
    }) => void
    doctors: any[]
    editAssistant?: {
        id: number
        assistant_id: number
        operation_date: string
        fees: number
    } | null
}

export function AddAssistantForm({ open, setOpen, onAdd, doctors, editAssistant }: AddAssistantFormProps) {
    const [searchTerm, setSearchTerm] = useState('')

    // Filter doctors based on search term
    const filteredDoctors = doctors.filter((doctor: any) =>
        doctor.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.speciality?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const form = useForm<AssistantFormData>({
        resolver: zodResolver(assistantSchema),
        defaultValues: {
            assistant_id: 0,
            operation_date: new Date().toISOString().split('T')[0],
            fees: 0,
        },
    })

    // Reset form when editAssistant changes
    useEffect(() => {
        if (editAssistant) {
            form.reset({
                assistant_id: editAssistant.assistant_id,
                operation_date: editAssistant.operation_date,
                fees: editAssistant.fees,
            })
        } else {
            form.reset({
                assistant_id: 0,
                operation_date: new Date().toISOString().split('T')[0],
                fees: 0,
            })
        }
        setSearchTerm('') // Reset search when opening or changing edit mode
    }, [editAssistant, form])

    const onSubmit = (data: AssistantFormData) => {
        const doctor = doctors.find((d: any) => d.id === data.assistant_id)
        onAdd({
            id: editAssistant?.id,
            ...data,
            assistant_name: doctor?.doctor_name || 'Unknown',
        })
        form.reset()
        setOpen(false)
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="right" className="max-w-[450px] w-full">
                <SheetHeader>
                    <SheetTitle>{editAssistant ? 'Edit Assistant' : 'Add Assistant'}</SheetTitle>
                </SheetHeader>

                <div className="px-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="mt-6 space-y-4">
                                <FormField
                                    control={form.control}
                                    name="assistant_id"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>Assistant *</FormLabel>
                                            <FormControl>
                                                <Select
                                                    onValueChange={(value) => form.setValue('assistant_id', Number(value))}
                                                    value={form.getValues('assistant_id')?.toString()}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select assistant..." />
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
                                        {editAssistant ? 'Update Assistant' : 'Add Assistant'}
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
    )
}
