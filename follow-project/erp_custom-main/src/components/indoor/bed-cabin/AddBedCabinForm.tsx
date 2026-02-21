import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { useAddBedCabinMutation } from "@/store/features/indoor/bedCabinApiService";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader, ShieldAlert } from "lucide-react";
import { z } from "zod";
import { useAppSelector } from "@/store/store";

const BedCabinSchema = z.object({
  code: z.string().min(1, "Code is required"),
  type: z.enum(["Bed", "Cabin", "Special"], {
    required_error: "Type is required",
  }),
  ward: z.string().min(1, "Ward is required"),
  price: z.string().min(1, "Price is required"),
  status: z.enum(["Available", "Occupied", "Maintenance"]).optional(),
});

export type BedCabinFormValues = z.infer<typeof BedCabinSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddBedCabinForm({ open, onOpenChange }: Props) {
  const form = useForm<BedCabinFormValues>({
    resolver: zodResolver(BedCabinSchema),
    defaultValues: {
      code: "",
      type: undefined,
      ward: "",
      price: "",
      status: "Available",
    },
  });

  const [addBedCabin, { isLoading }] = useAddBedCabinMutation();

  const onSubmit = async (values: BedCabinFormValues) => {
    const payload = {
      ...values,
      price: parseFloat(values.price),
    };

    try {
      const res = await addBedCabin(payload).unwrap();
      if (res.status) {
        toast.success("Bed/Cabin added successfully");
        onOpenChange(false);
        form.reset();
      }
    } catch (error) {
      console.error("Error adding bed/cabin:", error);
      toast.error("Failed to add bed/cabin");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Add Bed/Cabin</SheetTitle>
        </SheetHeader>

        <div className="px-4">
          <Form {...form}>
            <form
              className="space-y-4 mt-6"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., B-101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Bed">Bed</SelectItem>
                        <SelectItem value="Cabin">Cabin</SelectItem>
                        <SelectItem value="Special">Special</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ward</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., General Ward" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 800" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Occupied">Occupied</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving...
                  </div>
                ) : (
                  "Save"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
