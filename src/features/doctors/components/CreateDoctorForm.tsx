"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import { useState } from "react";
import { getCookie } from "@/lib/cookies";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const doctorSchema = z.object({
  doctor_name: z.string().min(1, { message: "Required" }),
  title: z.string().min(1, { message: "Required" }),
  qualification: z.string().min(1, { message: "Required" }),
  speciality: z.string().min(1, { message: "Required" }),
  country: z.string().min(1, { message: "Required" }),
  city: z.string().min(1, { message: "Required" }),
  phone: z.string().min(1, { message: "Required" }),
  mobile: z.string().min(1, { message: "Required" }),
  email: z.string().email({ message: "Invalid email" }),
  score: z.number().min(0, { message: "Score must be at least 0" }),
});

export function CreateDoctorForm() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const token = getCookie('accessToken');

  const form = useForm<z.infer<typeof doctorSchema>>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      doctor_name: "",
      title: "",
      qualification: "",
      speciality: "",
      country: "",
      city: "",
      phone: "",
      mobile: "",
      email: "",
      score: 0,
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (newDoctor: z.infer<typeof doctorSchema>) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/doctor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newDoctor),
        }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.message || "Failed to create doctor");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Doctor created successfully");
      queryClient.invalidateQueries({ queryKey: ["doctor"] });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create doctor");
    },
  });

  function handleSubmit(data: z.infer<typeof doctorSchema>) {
    createMutation.mutate(data);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Doctor
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="max-w-[400px] sm:max-w-[450px] w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Doctor</SheetTitle>
        </SheetHeader>

        <div className="mt-4 p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

              {/* Doctor Name */}
              <FormField
                control={form.control}
                name="doctor_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Dr., Prof., etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Qualification */}
              <FormField
                control={form.control}
                name="qualification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qualification</FormLabel>
                    <FormControl>
                      <Input placeholder="MBBS, MD, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Speciality */}
              <FormField
                control={form.control}
                name="speciality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Speciality</FormLabel>
                    <FormControl>
                      <Input placeholder="Cardiology, Neurology, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Country */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* City */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Mobile */}
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile</FormLabel>
                    <FormControl>
                      <Input placeholder="Mobile" {...field} />
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
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Score */}
              <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Score</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0–100"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Add Doctor"}
              </Button>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
