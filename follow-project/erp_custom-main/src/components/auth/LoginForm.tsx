import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  //   FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthLoginMutation } from "@/store/features/auth/authApiService";
import { useNavigate } from "react-router";
import { useAppDispatch } from "@/store/store";
import { setCredentials } from "@/store/features/auth/authSlice";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useGetSettingsInfoQuery } from "@/store/features/admin/settingsApiService";
import { setCurrency } from "@/store/currencySlice";
import { sidebarItemLink } from "@/config/sidebarItemLInk";
import { getFirstAllowedRoute } from "@/utils/permissionUtils";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { data: companyProfileSettings } = useGetSettingsInfoQuery();

  const [authLogin] = useAuthLoginMutation();

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    console.log(data);
    const payload = {
      email: data.email,
      password: data.password,
    };
    try {
      const res = await authLogin(payload).unwrap();
      console.log("Login successful:", res);
      // Handle successful login (e.g., redirect, show message)
      if (res) {
        toast.success(res?.message || "Login successful!");
        dispatch(
          setCredentials({ user: res?.data?.user, token: res.data?.token })
        );

        dispatch(setCurrency(companyProfileSettings?.data?.currency || "RM"));

        const firstRoute = getFirstAllowedRoute(
          sidebarItemLink,
          res?.data?.user?.role?.permissions || []
        );

        navigate(firstRoute);
      }
    } catch (error) {
      const err = error as {
        data?: { message?: string };
      };

      toast.error(
        err?.data?.message || "Login failed. Please check your credentials."
      );
    }
  };
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="py-6">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Enter your email and password to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              {/* <Field>
                <Button variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Apple
                </Button>
                <Button variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Google
                </Button>
              </Field> */}
              {/* <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator> */}
              <Controller
                control={form.control}
                name="email"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Email</FieldLabel>
                    <Input
                      type="email"
                      placeholder="m@example.com"
                      {...field}
                    />
                    {form.formState.errors.email?.message && (
                      <p className="text-red-500 text-sm">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </Field>
                )}
              />
              {/* input password design make perfectly */}
              <Controller
                control={form.control}
                name="password"
                render={({ field }) => (
                  <Field>
                    <div className="flex items-center justify-between mb-2">
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <a
                        href="/forgot-password"
                        className="text-xs text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline transition-colors"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {form.formState.errors.password?.message && (
                      <p className="text-red-500 text-sm mt-1.5">
                        {form.formState.errors.password.message}
                      </p>
                    )}
                  </Field>
                )}
              />
              <Field>
                <Button type="submit">Sign In</Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
