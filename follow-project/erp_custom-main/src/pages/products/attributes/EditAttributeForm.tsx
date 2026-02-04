import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Form } from "@/components/ui/form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MultiTagSelect from "@/components/form/MultiTagSelect";


const attributeSchema = z.object({
  name: z.string().min(1, "Required"),
  values: z.array(z.string()).min(1, "Required"),
  variant: z.string(),
});
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditAttributeForm({ open, onOpenChange }: Props) {
  const form = useForm({
    resolver: zodResolver(attributeSchema),
    defaultValues: {
      name: "",
      values: [],
      variant: "yes",
    },
  });

  const onSubmit = (data: z.infer<typeof attributeSchema>) => {
    console.log("Form data", data);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Attribute</SheetTitle>
        </SheetHeader>

        <div className="px-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor="name">Attribute Name</FieldLabel>
                      <Input
                        placeholder="e.g., size, color, etc."
                        {...field}
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <Controller
                  name="values"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor="values">Values</FieldLabel>
                      <MultiTagSelect
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Add a value and press Enter"
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <Controller
                  name="variant"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor="variant">Variant</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError>{fieldState?.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <Button className="w-full">Update</Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
