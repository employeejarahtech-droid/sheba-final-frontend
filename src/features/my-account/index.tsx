import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, User, Lock, Save, Mail } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ProfileImageUploader } from '@/components/profile-image-uploader'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from './myAccountQueries'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  bio: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type ProfileFormValues = z.infer<typeof profileSchema>
type PasswordFormValues = z.infer<typeof passwordSchema>

export function MyAccountPage() {
  const { data: profile, isLoading } = useGetProfileQuery()
  const updateProfileMut = useUpdateProfileMutation()
  const changePasswordMut = useChangePasswordMutation()

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [currentAvatar, setCurrentAvatar] = useState<string | undefined>()
  const [avatarRemoved, setAvatarRemoved] = useState(false)

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '', bio: '' },
  })

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name || '',
        email: profile.email || '',
        bio: profile.bio || '',
      })
      setAvatarRemoved(false)
      if (profile.avatar) {
        const url = profile.avatar.startsWith('http') || profile.avatar.startsWith('data:')
          ? profile.avatar
          : `${import.meta.env.VITE_API_URL}${profile.avatar}`
        setCurrentAvatar(url)
      } else {
        setCurrentAvatar(undefined)
      }
    }
  }, [profile])

  const onProfileSubmit = (data: ProfileFormValues) => {
    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('email', data.email)
    if (data.bio) formData.append('bio', data.bio)
    if (avatarFile) {
      formData.append('avatar', avatarFile)
    } else if (avatarRemoved) {
      formData.append('avatar', '')
    }

    updateProfileMut.mutate(formData, {
      onSuccess: () => {
        setAvatarRemoved(false)
        toast.success('Profile updated successfully')
      },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update profile'),
    })
  }

  const onPasswordSubmit = (data: PasswordFormValues) => {
    changePasswordMut.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          toast.success('Password changed successfully')
          passwordForm.reset()
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to change password'),
      }
    )
  }

  if (isLoading) {
    return (
      <>
        <AppHeader fixed />
        <Main>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </Main>
      </>
    )
  }

  return (
    <>
      <AppHeader fixed />
      <Main className="p-6 lg:p-10 w-full flex-1 bg-gray-50/50 dark:bg-black/20">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              My Account
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your personal information and password
            </p>
          </div>

          {/* Profile Edit Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-blue-200 dark:border-blue-800">
                  <AvatarImage src={currentAvatar} alt={profile?.name || 'User'} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {(profile?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{profile?.name || 'User'}</CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Mail className="h-3.5 w-3.5" />
                    {profile?.email || ''}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="flex justify-center pb-4 border-b">
                    <ProfileImageUploader
                      currentImage={currentAvatar}
                      onImageChange={setAvatarFile}
                      onImageRemove={() => {
                        setAvatarRemoved(true)
                        setCurrentAvatar(undefined)
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Input placeholder="A short bio about yourself" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateProfileMut.isPending}>
                      {updateProfileMut.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                      ) : (
                        <><Save className="mr-2 h-4 w-4" />Save Changes</>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Separator />

          {/* Password Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-lg">Change Password</CardTitle>
              </div>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter current password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter new password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm new password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end pt-2">
                    <Button type="submit" variant="outline" disabled={changePasswordMut.isPending}>
                      {changePasswordMut.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Changing...</>
                      ) : (
                        'Change Password'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
