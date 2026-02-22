import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfileImageUploader } from '@/components/profile-image-uploader'
import { getCookie } from '@/lib/cookies'
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

const profileFormSchema = z.object({
  companyName: z
    .string()
    .min(2, 'Company name must be at least 2 characters.')
    .max(30, 'Company name must not be longer than 30 characters.'),
  currency: z
    .string()
    .min(3, 'Currency must be at least 3 characters.')
    .max(3, 'Currency must be exactly 3 characters.')
    .optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

type ProfileResponse = {
  id: number
  companyName: string
  email: string
  avatar: string | null
  bio?: string | null
  currency?: string | null
}

export function ProfileForm() {
  const [companyImage, setCompanyImage] = useState<File | null>(null)
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null)
  const token = getCookie('accessToken')

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      companyName: '',
      currency: 'BDT',
    },
    mode: 'onChange',
  })

  // Fetch current profile data
  const { data: profileData, isLoading: isLoadingProfile } = useQuery<ProfileResponse>({
    queryKey: ['user-profile'],
    queryFn: async (): Promise<ProfileResponse> => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to fetch profile' }))
        throw new Error(errorData.message || 'Failed to fetch profile')
      }

      const response = await res.json()
      return response.data
    },
    enabled: !!token,
    retry: 1,
  })

  // Populate form when data is loaded
  useEffect(() => {
    if (profileData) {
      form.reset({
        companyName: profileData.companyName || '',
        currency: profileData.currency || 'BDT',
      })
      setCurrentAvatar(profileData.avatar || null)
    }
  }, [profileData, form])

  // Mutation to update profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues & { companyImage?: File | null }) => {
      // Create FormData to handle file upload
      const formData = new FormData()
      formData.append('companyName', data.companyName)

      if (data.companyImage) {
        formData.append('avatar', data.companyImage)
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to update profile' }))
        throw new Error(errorData.message || 'Failed to update profile')
      }

      return res.json()
    },
    onSuccess: (response) => {
      toast.success(response.message || 'Profile updated successfully')

      // Update current avatar if changed
      if (response.data?.avatar) {
        setCurrentAvatar(response.data.avatar)
      }

      // Invalidate profile query to refetch updated data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile')
    },
  })

  const handleSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate({
      ...data,
      companyImage,
    })
  }

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className='space-y-6'
      >
        {/* Profile Image Uploader */}
        <div className="flex flex-col items-center pb-6 border-b border-gray-200 dark:border-gray-800">
          <ProfileImageUploader
            currentImage={currentAvatar || undefined}
            onImageChange={setCompanyImage}
          />
        </div>

        <FormField
          control={form.control}
          name='companyName'
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
          name='currency'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <FormControl>
                <Input placeholder='BDT' {...field} />
              </FormControl>
              <FormDescription>
                Enter your default currency code (e.g., USD, EUR, GBP, BDT).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' disabled={updateProfileMutation.isPending}>
          {updateProfileMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            'Update profile'
          )}
        </Button>
      </form>
    </Form>
  )
}
