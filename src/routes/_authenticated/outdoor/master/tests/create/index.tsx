import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getCookie } from '@/lib/cookies'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Check, ChevronDown, ArrowLeft, CircleCheck, PlusCircle, FlaskConical, LayoutTemplate, Activity, DollarSign, Grip } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/_authenticated/outdoor/master/tests/create/')({
  component: CreateTest,
})



const testSchema = z.object({
  name: z.string().min(1, "Required"),
  category_id: z.number().min(1, "Required"),
  match_table_name: z.number().min(1, "Required"),
  status: z.string().min(1, "Required"),
  price: z
    .any()                           // accept anything (string, number, null, etc.)
    .transform((val) => Number(val))  // force convert using Number()
    .refine((val) => !isNaN(val), {
      message: "Price must be a valid number",
    })
})

type TestValues = {
  name: string
  category_id: number
  match_table_name: number
  status: string
  price: number
}


type Category = {
  id: string
  name: string
  department_id: number
  department_name: string
}

function CreateTest() {
  const [open, setOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [page] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const navigate = useNavigate();

  const token = getCookie('accessToken');

  const { data: categories } = useQuery({
    queryKey: ["category", page],

    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/test-category?page=${page}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },

    enabled: !!token,

    placeholderData: (prev) =>
      prev
        ? prev
        : {
          data: {
            items: [],
            meta: {
              page,
              limit,
              total: 0,
            },
          },
        },
  });


  const { data: testTables } = useQuery({
    queryKey: ["test-tables", page, search],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/test-tables?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch tests");
      return res.json();
    },
    enabled: !!token,
    placeholderData: (prev) =>
      prev
        ? prev
        : {
          data: {
            items: [],
            total: 0,
          },
        },
  });

  const form = useForm<TestValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      name: "",
      category_id: undefined,
      match_table_name: undefined,
      status: "active",
      price: 0,
    },
  })

  const createTestMutation = useMutation({
    mutationFn: async (payload: TestValues) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tests/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: payload.name,
          category_id: Number(payload.category_id),
          match_table_name: payload.match_table_name,
          status: payload.status,
          price: payload.price,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to create test");
      }

      return res.json();
    },

    onSuccess: (data) => {
      toast.success("Test created successfully!");
      console.log("API Response:", data);
      navigate({ to: "/outdoor/master/tests" });
    },

    onError: (error: any) => {
      toast.error(error.message || "Something went wrong");
    },
  });


  const onSubmit = (data: TestValues) => {
    console.log('Submitting form data', data);

    const selectedTable = testTables?.data?.items?.find(
      (table: any) => Number(table.id) === Number(data.match_table_name)
    );

    if (!selectedTable) {
      toast.error("Please select a valid table");
      return;
    }

    const payload = {
      name: data.name,
      category_id: Number(data.category_id),
      price: Number(data.price),
      match_table_name: selectedTable.table_name || selectedTable.display_name,
      status: data.status
    };

    createTestMutation.mutate(payload);
    showSubmittedData(data)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-background">
      <Header>
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="p-6 lg:p-8 w-full flex-1">
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                Create New Test
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Add a new diagnostic test to the system
              </p>
            </div>
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => navigate({ to: '..' })}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          <Form {...form}>
            <form id="create-test-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Card className="border dark:border-gray-800 overflow-hidden py-0">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b-1 dark:border-gray-800 py-2 gap-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-sm">
                      <FlaskConical className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">Test Information</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Enter the details for the new diagnostic test
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="space-y-5">
                    {/* Test Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. CBC, Lipid Profile"
                              className="h-10"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Category */}
                      <FormField
                        control={form.control}
                        name="category_id"
                        render={({ field }) => {
                          const selectedCategory = categories?.data?.items?.find(
                            (cat: Category) => Number(cat.id) === Number(field.value)
                          );
                          return (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <button
                                      type="button"
                                      className={cn(
                                        "w-full flex justify-between items-center px-3 py-2 border border-input rounded-md h-10 bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-sm",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {selectedCategory?.name || "Select category"}
                                      <ChevronDown className="h-4 w-4 opacity-50" />
                                    </button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                  <Command>
                                    <CommandInput placeholder="Search..." className="h-10" />
                                    <CommandList className="max-h-[250px]">
                                      <CommandEmpty>No category found.</CommandEmpty>
                                      <CommandGroup>
                                        {categories?.data?.items?.map((category: Category) => (
                                          <CommandItem
                                            key={category.id}
                                            onSelect={() => {
                                              field.onChange(Number(category.id));
                                              setCategoryOpen(false);
                                            }}
                                          >
                                            {category.name}
                                            <Check
                                              className={cn(
                                                "h-4 w-4 ml-auto",
                                                Number(category.id) === Number(field.value) ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      {/* Status */}
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className="h-10">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Template */}
                      <FormField
                        control={form.control}
                        name="match_table_name"
                        render={({ field }) => {
                          const selected = testTables?.data?.items?.find(
                            (table: any) => Number(table.id) === Number(field.value)
                          );
                          return (
                            <FormItem>
                              <FormLabel>Report Template</FormLabel>
                              <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <button
                                      type="button"
                                      className={cn(
                                        "w-full flex justify-between items-center px-3 py-2 border border-input rounded-md h-10 bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-sm",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {selected?.display_name || "Select template"}
                                      <ChevronDown className="h-4 w-4 opacity-50" />
                                    </button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                  <Command>
                                    <CommandInput placeholder="Search..." value={search} onValueChange={setSearch} className="h-10" />
                                    <CommandList className="max-h-[250px]">
                                      <CommandEmpty>No template found.</CommandEmpty>
                                      <CommandGroup>
                                        {testTables?.data?.items?.map((item: any) => (
                                          <CommandItem
                                            key={item.id}
                                            onSelect={() => {
                                              field.onChange(item.id);
                                              setOpen(false);
                                            }}
                                          >
                                            {item.display_name}
                                            <Check
                                              className={cn(
                                                "h-4 w-4 ml-auto",
                                                item.id === field.value ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      {/* Price */}
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (৳)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">৳</span>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  className="h-10 pl-7"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: '..' })}
                  disabled={createTestMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTestMutation.isPending}
                >
                  {createTestMutation.isPending ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  ) : null}
                  {createTestMutation.isPending ? "Creating..." : "Create Test"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </Main>
    </div>
  )
}
