/**
 * Contact Page — Contact form
 *
 * Marketing page wrapped in the home LandingPageWrapper (header + footer) and
 * styled with the Sheba blue brand. Submits to POST /api/public/contact.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Mail, Phone, MapPin, Clock, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { LandingPageWrapper } from '@/components/layout/landing-layout'
import { submitContactForm } from '@/services/platform-public'

export const Route = createFileRoute('/(platform)/contact')({
  component: ContactPage,
})

const formSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().optional(),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  company: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type FormValues = z.infer<typeof formSchema>

const contactDetails = [
  {
    icon: Mail,
    title: 'Email',
    lines: ['support@hms.com'],
  },
  {
    icon: Phone,
    title: 'Phone',
    lines: ['+880 1XXX-XXXXXX'],
  },
  {
    icon: MapPin,
    title: 'Address',
    lines: ['Dhaka, Bangladesh'],
  },
  {
    icon: Clock,
    title: 'Business Hours',
    lines: ['Sun – Thu: 9:00 AM – 6:00 PM', 'Support available 24/7'],
  },
]

function ContactPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: '',
      subject: '',
      message: '',
    },
  })

  const contactMutation = useMutation({
    mutationFn: submitContactForm,
    onSuccess: () => {
      toast.success('Message sent successfully!')
      form.reset()
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to send message')
    },
  })

  const onSubmit = (data: FormValues) => {
    contactMutation.mutate(data)
  }

  return (
    <LandingPageWrapper>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-slate-50">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-blue-100 blur-3xl mix-blend-multiply" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-sky-100 blur-3xl mix-blend-multiply" />
        </div>
        <div className="relative container mx-auto px-4 py-16 text-center md:py-20">
          <Badge
            variant="secondary"
            className="mb-5 border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700"
          >
            <Sparkles className="mr-2 size-3.5 text-blue-500" />
            Contact us
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Get in <span className="text-blue-600">touch</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Have questions about HMS? We'd love to hear from you. Send us a
            message and our team will respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact details + form */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
            {/* Contact Info */}
            <div className="space-y-6">
              {contactDetails.map(({ icon: Icon, title, lines }) => (
                <Card key={title} className="border-slate-200">
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 ring-1 ring-blue-100">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{title}</h3>
                      {lines.map((line) => (
                        <p key={line} className="text-sm text-slate-500">
                          {line}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Contact Form */}
            <Card className="border-slate-200 lg:col-span-2">
              <CardHeader>
                <CardTitle>Send a Message</CardTitle>
                <CardDescription className='mb-5'>
                  Fill out the form below and we'll get back to you shortly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+880 1XXX-XXXXXX" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hospital / Company</FormLabel>
                          <FormControl>
                            <Input placeholder="City General Hospital" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="How can we help?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message *</FormLabel>
                          <FormControl>
                            <textarea
                              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Tell us more about your needs..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700"
                      disabled={contactMutation.isPending}
                    >
                      {contactMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </LandingPageWrapper>
  )
}
