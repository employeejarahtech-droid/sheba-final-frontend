/**
 * CreateCompanyForm — Dialog-based form for creating a new company/tenant
 *
 * Uses React Hook Form + Zod validation. Fields: name, email, subdomain,
 * db_type (shared/dedicated), plan_id (fetched from useAdminPlans).
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useCreateCompany, useAdminPlans } from '@/hooks/usePlatformAdmin'
import { Loader2, Plus } from 'lucide-react'

// ── Zod Schema ─────────────────────────────────────────────────────────

const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address').or(z.literal('')).optional(),
  subdomain: z
    .string()
    .min(1, 'Subdomain is required')
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      'Subdomain must be lowercase alphanumeric with dashes (no leading/trailing dashes)'
    ),
  db_type: z.enum(['shared', 'dedicated']).default('shared'),
  plan_id: z.string().optional(),
})

type CreateCompanyFormValues = z.infer<typeof createCompanySchema>

// ── Component ──────────────────────────────────────────────────────────

export function CreateCompanyForm() {
  const [open, setOpen] = useState(false)
  const createCompany = useCreateCompany()
  const { data: plansData } = useAdminPlans({ status: 'active' })

  const plans = Array.isArray(plansData)
    ? plansData
    : plansData?.items ?? plansData?.data ?? []

  const form = useForm<CreateCompanyFormValues>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: '',
      email: '',
      subdomain: '',
      db_type: 'shared',
      plan_id: '',
    },
  })

  const onSubmit = (values: CreateCompanyFormValues) => {
    const payload: Record<string, unknown> = {
      name: values.name,
      subdomain: values.subdomain,
      db_type: values.db_type,
    }

    if (values.email) {
      payload.email = values.email
    }
    if (values.plan_id) {
      payload.plan_id = Number(values.plan_id)
    }

    createCompany.mutate(payload, {
      onSuccess: () => {
        setOpen(false)
        form.reset()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Company</DialogTitle>
          <DialogDescription>
            Add a new tenant company to the platform. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Company Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Company Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corporation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="admin@acme.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subdomain */}
            <FormField
              control={form.control}
              name="subdomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Subdomain <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="acme"
                      {...field}
                      onChange={(e) => {
                        // Auto-format to lowercase
                        field.onChange(e.target.value.toLowerCase())
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Database Type */}
            <FormField
              control={form.control}
              name="db_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select database type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="shared">Shared</SelectItem>
                      <SelectItem value="dedicated">Dedicated</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Plan */}
            <FormField
              control={form.control}
              name="plan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Plan</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plans.length === 0 ? (
                        <SelectItem value="_none" disabled>
                          No plans available
                        </SelectItem>
                      ) : (
                        plans.map((plan: Record<string, unknown>) => (
                          <SelectItem
                            key={String(plan.id)}
                            value={String(plan.id)}
                          >
                            {String(plan.name)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  form.reset()
                }}
                disabled={createCompany.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createCompany.isPending}>
                {createCompany.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Company'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
