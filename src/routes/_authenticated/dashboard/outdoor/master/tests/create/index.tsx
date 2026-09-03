
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'



import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getCookie } from '@/lib/cookies'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { cn } from '@/lib/utils'
import { useCurrency } from '@/hooks/use-currency'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Check, ChevronDown, ArrowLeft, FlaskConical, MapPin } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

export const Route = createFileRoute('/_authenticated/dashboard/outdoor/master/tests/create/')({
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
    }),
  sample_normal_range: z.string().optional(),
  sample_result: z.string().optional(),
  sample_collection_room_id: z.number().optional().nullable(),
})

type TestValues = {
  name: string
  category_id: number
  match_table_name: number
  status: string
  price: number
  sample_normal_range?: string
  sample_result?: string
  sample_collection_room_id?: number | null
}


type Category = {
  id: string
  name: string
  department_id: number
  department_name: string
}

function CreateTest() {
  const { currencySymbol } = useCurrency()
  const [open, setOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  const [page] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const navigate = useNavigate();

  const token = getCookie('accessToken');

  const { data: categories } = useQuery({
    queryKey: ["test-category"],

    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/test-category?limit=100`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch categories");
      const result = await res.json();
      return result.data?.rows || result.data?.items || result.data || [];
    },

    enabled: !!token,
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

  const { data: sampleRooms } = useQuery({
    queryKey: ["sample-collection-rooms"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/sample-collection-rooms?limit=100`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch sample collection rooms");
      const result = await res.json();
      return result.data?.rows || result.data?.items || result.data || [];
    },
    enabled: !!token,
  });

  const form = useForm<TestValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      name: "",
      category_id: undefined,
      match_table_name: undefined,
      status: "active",
      price: 0,
      sample_normal_range: "",
      sample_result: "",
      sample_collection_room_id: undefined,
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
          sample_normal_range: payload.sample_normal_range,
          sample_result: payload.sample_result,
          sample_collection_room_id: payload.sample_collection_room_id || null,
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
      navigate({ to: '/dashboard/outdoor/master/tests', search: { page: 1, limit: 10, search: '' } });
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
      status: data.status,
      sample_normal_range: data.sample_normal_range || "",
      sample_result: data.sample_result || "",
      sample_collection_room_id: data.sample_collection_room_id || null,
    };

    createTestMutation.mutate(payload);
    showSubmittedData(data)
  }

  return (
    <>
      <AppHeader fixed />

      <Main className="flex flex-1 flex-col gap-6">
        <Form {...form}>
          <form
            id="create-test-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 w-full min-w-[650px] max-w-[750px] mx-auto px-4"
          >
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate({ to: '/dashboard/outdoor/master/tests' })}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Create New Test
                  </h1>
                  <p className="text-muted-foreground text-sm">Add a new diagnostic test to the system</p>
                </div>
              </div>
            </div>

            {/* Test Information */}
            <Card className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b py-1.5 px-4 gap-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                    <FlaskConical className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Test Information</CardTitle>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Name, category, template, and pricing</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Test Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. CBC, Lipid Profile" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category */}
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => {
                        const selectedCategory = categories?.find(
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
                                      "w-full flex justify-between items-center px-3 py-1 border rounded-md h-9 text-sm",
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
                                  <CommandInput placeholder="Search..." />
                                  <CommandList>
                                    <CommandEmpty>No category found.</CommandEmpty>
                                    <CommandGroup>
                                      {categories?.map((category: Category) => (
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
                              <SelectTrigger className="w-full">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                      "w-full flex justify-between items-center px-3 py-1 border rounded-md h-9 text-sm",
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
                                  <CommandInput placeholder="Search..." value={search} onValueChange={setSearch} />
                                  <CommandList>
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

                    {/* Sample Collection Room */}
                    <FormField
                      control={form.control}
                      name="sample_collection_room_id"
                      render={({ field }) => {
                        const selectedRoom = sampleRooms?.find(
                          (room: any) => Number(room.id) === Number(field.value)
                        );
                        return (
                          <FormItem>
                            <FormLabel>Sample Collection Room</FormLabel>
                            <Popover open={roomOpen} onOpenChange={setRoomOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <button
                                    type="button"
                                    className={cn(
                                      "w-full flex justify-between items-center px-3 py-1 border rounded-md h-9 text-sm",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {selectedRoom
                                      ? `${selectedRoom.name}${selectedRoom.location ? ` - ${selectedRoom.location}` : ''}`
                                      : "Select sample collection room"}
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                  </button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Search rooms..." />
                                  <CommandList>
                                    <CommandEmpty>No room found.</CommandEmpty>
                                    <CommandGroup>
                                      {sampleRooms?.map((room: any) => (
                                        <CommandItem
                                          key={room.id}
                                          onSelect={() => {
                                            field.onChange(Number(room.id));
                                            setRoomOpen(false);
                                          }}
                                        >
                                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                          <span>{room.name}</span>
                                          {room.location && (
                                            <span className="text-xs text-muted-foreground ml-1">({room.location})</span>
                                          )}
                                          <Check
                                            className={cn(
                                              "h-4 w-4 ml-auto",
                                              Number(room.id) === Number(field.value) ? "opacity-100" : "opacity-0"
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
                  </div>

                  {/* Price */}
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ({currencySymbol})</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span>
                            <Input
                              type="number"
                              placeholder="0.00"
                              style={{ paddingLeft: `${Math.max(1.75, 1 + 0.6 * currencySymbol.length)}rem` }}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Sample Normal Range */}
                  <FormField
                    control={form.control}
                    name="sample_normal_range"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sample Normal Range</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g. 4.5-11.0 x 10^9/L for WBC"
                            className="min-h-[80px] resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Enter the reference or normal range for this test (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Sample Result */}
                  <FormField
                    control={form.control}
                    name="sample_result"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sample Result</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g. Negative, Reactive, 5.5 mmol/L"
                            className="min-h-[80px] resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Enter the sample result for this test (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pb-10">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate({ to: '/dashboard/outdoor/master/tests' })}
                disabled={createTestMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={createTestMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[200px]"
              >
                {createTestMutation.isPending ? "Creating..." : "Create Test"}
              </Button>
            </div>
          </form>
        </Form>
      </Main>
    </>
  )
}
