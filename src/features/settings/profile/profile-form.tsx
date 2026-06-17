import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfileImageUploader } from '@/components/profile-image-uploader'
import api from '@/lib/axios'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CURRENCIES, getCurrencyByCode } from '@/lib/currencies'
import { useAppDispatch } from '@/store/store'
import { setCurrency } from '@/store/currencySlice'

// Available date formats. `value` is stored in company_settings.date_format.
const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', sample: '06/14/2026' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', sample: '14/06/2026' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', sample: '2026-06-14' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY', sample: '14-06-2026' },
  { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY', sample: '06-14-2026' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY', sample: '14 Jun 2026' },
  { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY', sample: 'Jun 14, 2026' },
] as const

const profileFormSchema = z.object({
  company_name: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  currency: z.string().optional(),
  date_format: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

type SettingsResponse = {
  id: number
  company_name: string | null
  company_logo: string | null
  address1?: string | null
  address2?: string | null
  currency?: string | null
  date_format?: string | null
}

export function ProfileForm() {
  const [companyImage, setCompanyImage] = useState<File | null>(null)
  const [logoRemoved, setLogoRemoved] = useState(false)
  const [currentLogo, setCurrentLogo] = useState<string | null>(null)
  const [openCurrency, setOpenCurrency] = useState(false)
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      company_name: '',
      address1: '',
      address2: '',
      currency: 'BDT',
      date_format: 'MM/DD/YYYY',
    },
    mode: 'onChange',
  })

  const { data: settingsData, isLoading } = useQuery<SettingsResponse>({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const res = await api.get('/company-settings')
      return res.data.data
    },
  })

  useEffect(() => {
    if (settingsData) {
      form.reset({
        company_name: settingsData.company_name || '',
        address1: settingsData.address1 || '',
        address2: settingsData.address2 || '',
        currency: settingsData.currency || 'BDT',
        date_format: settingsData.date_format || 'MM/DD/YYYY',
      })
      setLogoRemoved(false)

      if (settingsData.currency) {
        dispatch(setCurrency(settingsData.currency))
      }

      let logoUrl = settingsData.company_logo || null
      if (logoUrl && !logoUrl.startsWith('http') && !logoUrl.startsWith('data:')) {
        logoUrl = `${import.meta.env.VITE_API_URL}${logoUrl}`
      }
      setCurrentLogo(logoUrl)
    }
  }, [settingsData])

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormValues & { companyImage?: File | null; logoRemoved?: boolean }) => {
      const formData = new FormData()
      if (data.company_name?.trim()) formData.append('company_name', data.company_name)
      if (data.address1?.trim()) formData.append('address1', data.address1)
      if (data.address2?.trim()) formData.append('address2', data.address2)
      if (data.currency?.trim()) formData.append('currency', data.currency)
      if (data.date_format?.trim()) formData.append('date_format', data.date_format)

      if (data.companyImage) {
        formData.append('company_logo', data.companyImage)
      } else if (data.logoRemoved) {
        formData.append('company_logo', '')
      }

      const res = await api.put('/company-settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onSuccess: (response) => {
      toast.success(response.message || 'Company settings updated')
      setLogoRemoved(false)
      if (response.data?.currency) dispatch(setCurrency(response.data.currency))
      queryClient.invalidateQueries({ queryKey: ['company-settings'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update')
    },
  })

  const handleSubmit = (data: ProfileFormValues) => {
    updateMutation.mutate({ ...data, companyImage, logoRemoved })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
        <div className="flex flex-col items-center pb-6 border-b border-gray-200 dark:border-gray-800">
          <ProfileImageUploader
            currentImage={currentLogo || undefined}
            onImageChange={setCompanyImage}
            onImageRemove={() => {
              setLogoRemoved(true)
              setCurrentLogo(null)
            }}
          />
        </div>

        <FormField
          control={form.control}
          name='company_name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder='Company Name' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='address1'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 1</FormLabel>
              <FormControl>
                <Input placeholder='Street address, area, locality' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='address2'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 2</FormLabel>
              <FormControl>
                <Input placeholder='City, state, postal code' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='currency'
          render={({ field }) => {
            const selected = field.value ? getCurrencyByCode(field.value) : undefined
            return (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Popover open={openCurrency} onOpenChange={setOpenCurrency}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" role="combobox" aria-expanded={openCurrency} className="w-full justify-between font-normal">
                        {selected ? `${selected.code} — ${selected.name}` : 'Select currency'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search country or currency..." />
                      <CommandList>
                        <CommandEmpty>No currency found.</CommandEmpty>
                        <CommandGroup>
                          {CURRENCIES.map((c) => (
                            <CommandItem
                              key={`${c.country}-${c.code}`}
                              value={`${c.country} ${c.code} ${c.name}`.toLowerCase()}
                              onSelect={() => {
                                field.onChange(c.code)
                                setOpenCurrency(false)
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${field.value === c.code ? 'opacity-100' : 'opacity-0'}`}
                              />
                              <span className="flex-1">{c.country} — {c.name}</span>
                              <span className="ml-2 text-xs text-muted-foreground">{c.code}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Select your default currency. This is used across invoices and reports.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )
          }}
        />

        <FormField
          control={form.control}
          name='date_format'
          render={({ field }) => {
            const selected = DATE_FORMATS.find((f) => f.value === field.value)
            return (
              <FormItem>
                <FormLabel>Date Format</FormLabel>
                <Select
                  key={field.value}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DATE_FORMATS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label} — {f.sample}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose how dates are displayed across the app.
                  {selected ? ` Example: ${selected.sample}` : ''}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )
          }}
        />

        <Button type='submit' disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</>
          ) : 'Update profile'}
        </Button>
      </form>
    </Form>
  )
}
