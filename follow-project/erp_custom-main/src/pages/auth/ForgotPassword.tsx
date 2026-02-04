import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPassword() {
  const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: z.infer<typeof ForgotPasswordSchema>) => {
    console.log("Reset link sent to:", data.email);
    // Perform your API call here...
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 self-center text-xl font-medium"
        >
          <div className="flex size-6 items-center justify-center rounded-md">
            <img
              src="https://inleadsit.com.my/wp-content/uploads/2023/07/favicon-2.png"
              alt="Logo"
              className="w-6 h-6"
            />
          </div>
          Inleads IT
        </Link>

        {/* Card */}
        <div className="rounded-xl bg-background p-6 shadow-md text-center">
          <h1 className="text-xl font-semibold mb-2">Forgot Password</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your email address, and we’ll send you a link to reset your password.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              
              {/* EMAIL FIELD */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="example@mail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SUBMIT BUTTON */}
              <Button type="submit" className="w-full">
                Send Reset Link
              </Button>
            </form>
          </Form>
        </div>

        {/* FOOTER LINKS */}
        <div className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
           Sign In here
          </Link>
        </div>

      </div>
    </div>
  );
}
