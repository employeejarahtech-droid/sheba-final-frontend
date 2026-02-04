import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetSingleCreditHeadQuery,
  useUpdateCreditHeadMutation,
} from "@/store/features/accounting/accoutntingApiService";
import { useEffect } from "react";
import type { CreditHead } from "@/types/accounting.types";
import { useAppSelector } from "@/store/store";
import { AccountingPermission, SuperAdminPermission } from "@/config/permissions";


const statusOptions = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const creditHeadSchema = z.object({
  name: z.string().min(1, "Required"),
  code: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});
export default function EditCreditHeadForm({
  open,
  setOpen,
  creditHeadId,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  creditHeadId: number;
}) {


  const userPermissions = useAppSelector((state) => state.auth.user?.role.permissions || []);

// Credit Heads
const canEditCreditHeads = userPermissions.includes(AccountingPermission.EDIT_CREDIT_HEADS)|| userPermissions.includes(SuperAdminPermission.ACCESS_ALL);


  const form = useForm({
    resolver: zodResolver(creditHeadSchema),
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
    },
  });

  const { data: fetchedCreditHead } = useGetSingleCreditHeadQuery(
    creditHeadId,
    { skip: !creditHeadId }
  );

  console.log("fetchedCreditHead", fetchedCreditHead);

  const creditHead: CreditHead | undefined = fetchedCreditHead?.data;

  useEffect(() => {
    if (creditHead) {
      form.reset({
        name: creditHead.name,
        code: creditHead.code,
        description: creditHead.description,
        is_active: creditHead.is_active,
      });
    }
  }, [creditHead, form]);

  const [updateCreditHead, { isLoading }] = useUpdateCreditHeadMutation();

  const handleAddCreditHead = async (
    values: z.infer<typeof creditHeadSchema>
  ) => {
    console.log(values);
    const payload = {
      id: creditHeadId,
      body: {
        name: values.name,
        code: values.code,
        description: values.description,
        is_active: values.is_active,
      },
    };

    try {
      const res = await updateCreditHead(payload).unwrap();
      console.log("Credit Head updated successfully:", res);

      if (res.status) {
        toast.success(res.message || "Credit Head updated successfully");
        setOpen(false);
        form.reset();
      } else {
        toast.error("Failed to update Credit Head: " + res.message);
      }
    } catch (error) {
      toast.error("Error updating Credit Head");
      if (error instanceof Error) {
        toast.error("Error updating Credit Head: " + error.message);
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="max-w-[400px] w-full">
        <SheetHeader>
          <SheetTitle>Edit Credit Head</SheetTitle>
        </SheetHeader>
        <div className="px-4">
             {!canEditCreditHeads? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10">
                <ShieldAlert className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Access Denied
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You do not have permission to edit a credit head. <br />
                Please contact your administrator if you believe this is an error.
              </p>
              <Button
                variant="outline"
                onClick={() =>setOpen(false)}
                className="mt-4"
              >
                Close
              </Button>
            </div>
          ) :(<Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAddCreditHead)}
              className="space-y-5"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Head Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter credit head name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="i.e. CR001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
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
                    Updating...
                  </div>
                ) : (
                  "Update"
                )}
              </Button>
            </form>
          </Form>)}
        </div>
      </SheetContent>
    </Sheet>
  );
}
