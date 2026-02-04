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

      <Main className="p-6 lg:p-10 w-full flex-1">
        <div className="space-y-8 max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-8">
            <div>
              <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase">
                Register Diagnostic Test
              </h1>
              <p className="text-muted-foreground mt-1 text-sm font-medium">
                Configure new diagnostic parameters and base pricing
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="hidden sm:flex items-center gap-2 rounded-xl border-gray-200 bg-white hover:bg-gray-50"
                onClick={() => navigate({ to: '..' })}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                type="submit"
                form="create-test-form"
                disabled={createTestMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 border-none px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] font-bold"
              >
                {createTestMutation.isPending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <CircleCheck className="h-4 w-4 mr-2" />
                )}
                {createTestMutation.isPending ? "Creating..." : "Confirm & Register"}
              </Button>
            </div>
          </div>

          <Form {...form}>
            <form id="create-test-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card className="bg-card text-card-foreground flex flex-col gap-6 rounded-2xl shadow-sm overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
                <CardHeader className="p-0 border-b border-blue-100 dark:border-blue-900">
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 px-6 py-4 flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                      <PlusCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        Test Configuration
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        Define master data for the new diagnostic procedure
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    {/* Test Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <FlaskConical className="h-4 w-4 text-blue-500" />
                            Test Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. CBC, Lipid Profile, etc."
                              className="h-10 rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-900/50 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all shadow-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-[10px] text-muted-foreground mt-0">
                            The common name used for this diagnostic test.
                          </FormDescription>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    {/* Category */}
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => {
                        const selectedCategory = categories?.data?.items?.find(
                          (cat: Category) => Number(cat.id) === Number(field.value)
                        );

                        return (
                          <FormItem className="flex flex-col gap-2">
                            <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <Grip className="h-4 w-4 text-purple-500" />
                              Medical Category
                            </FormLabel>
                            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <button
                                    type="button"
                                    className={cn(
                                      "w-full flex justify-between items-center px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg h-10 bg-white dark:bg-zinc-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/70 transition-all shadow-sm text-sm",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {selectedCategory?.name || "Select Category"}
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                  </button>
                                </FormControl>
                              </PopoverTrigger>

                              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command className="border border-gray-100 dark:border-gray-800">
                                  <CommandInput placeholder="Search categories..." className="h-10" />
                                  <CommandList className="max-h-[300px]">
                                    <CommandEmpty>No category found.</CommandEmpty>
                                    <CommandGroup>
                                      {categories?.data?.items?.map((category: Category) => (
                                        <CommandItem
                                          key={category.id}
                                          className="py-2.5 px-4 cursor-pointer"
                                          onSelect={() => {
                                            field.onChange(Number(category.id));
                                            setCategoryOpen(false);
                                          }}
                                        >
                                          {category.name}
                                          <Check
                                            className={cn(
                                              "h-4 w-4 ml-auto text-blue-500",
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
                            <FormDescription className="text-[10px] text-muted-foreground mt-0">
                              Department or specialty this test belongs to.
                            </FormDescription>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        );
                      }}
                    />

                    {/* Table Template */}
                    <FormField
                      control={form.control}
                      name="match_table_name"
                      render={({ field }) => {
                        const selected = testTables?.data?.items?.find(
                          (table: any) => Number(table.id) === Number(field.value)
                        );

                        return (
                          <FormItem className="flex flex-col gap-2">
                            <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <LayoutTemplate className="h-4 w-4 text-orange-500" />
                              Report Layout Template
                            </FormLabel>
                            <Popover open={open} onOpenChange={setOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <button
                                    type="button"
                                    className={cn(
                                      "w-full flex justify-between items-center px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg h-10 bg-white dark:bg-zinc-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/70 transition-all shadow-sm text-sm",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {selected?.display_name || "Select Template"}
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                  </button>
                                </FormControl>
                              </PopoverTrigger>

                              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command className="border border-gray-100 dark:border-gray-800">
                                  <CommandInput placeholder="Search templates..." value={search} onValueChange={setSearch} className="h-10" />
                                  <CommandList className="max-h-[300px]">
                                    <CommandEmpty>No template found.</CommandEmpty>
                                    <CommandGroup>
                                      {testTables?.data?.items?.map((item: any) => (
                                        <CommandItem
                                          key={item.id}
                                          className="py-2.5 px-4 cursor-pointer"
                                          onSelect={() => {
                                            field.onChange(item.id);
                                            setOpen(false);
                                          }}
                                        >
                                          {item.display_name}
                                          <Check
                                            className={cn(
                                              "h-4 w-4 ml-auto text-blue-500",
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
                            <FormDescription className="text-[10px] text-muted-foreground mt-0">
                              Controls the visual layout of diagnostic results.
                            </FormDescription>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        );
                      }}
                    />

                    {/* Status */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-green-500" />
                            Default Status
                          </FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className='w-full h-10 rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-900/50 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm'>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription className="text-[10px] text-muted-foreground mt-0">
                            Initial state of newly registered tests.
                          </FormDescription>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    {/* Price */}
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                            Standard Price (৳)
                          </FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-600 transition-colors font-semibold">৳</span>
                              <Input
                                type="number"
                                placeholder="0.00"
                                className="h-10 pl-8 rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-900/50 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 transition-all shadow-sm"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-[10px] text-muted-foreground mt-0">
                            The base billing amount for this procedure.
                          </FormDescription>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-10" />

                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="px-8 h-12 rounded-xl border-gray-200 bg-white font-semibold hover:bg-gray-50"
                      onClick={() => navigate({ to: '..' })}
                      disabled={createTestMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createTestMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/30 border-none px-10 h-12 rounded-xl transition-all font-bold hover:scale-[1.02]"
                    >
                      {createTestMutation.isPending ? (
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      ) : (
                        <CircleCheck className="h-5 w-5 mr-2" />
                      )}
                      {createTestMutation.isPending ? "Creating..." : "Confirm & Register"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </Main>
    </div>
  )
}
