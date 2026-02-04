

import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { UserPlus, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { useGetAllRolesQuery } from "@/store/features/role/roleApiService";
import { useGetUserByIdQuery, useUpdateUserMutation } from "@/store/features/users/usersApiService";

import { toast } from "sonner";
import React, { useState } from "react";

// -------------------- ZOD SCHEMA --------------------
const editUserSchema = z.object({
  name: z.string().min(1, "Required"),
  email: z.email("Invalid email"),
  password: z.string().optional(),
  role_id: z.number().min(1, "Required"),
  status: z.string().optional(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

export default function EditUserPage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [page] = useState(1);
  const [search] = useState("");
  const limit = 10;

  const { data: rolesData } = useGetAllRolesQuery({
    page,
    limit,
    search,
  });
  const { data: userData, isLoading: isUserLoading } = useGetUserByIdQuery(userId as string);
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role_id: undefined,
      status: "active",
    },
  });

  const { control, handleSubmit, reset } = form;

  // ⬇ Load user data into form when API loads
  React.useEffect(() => {
    const user =
      Array.isArray(userData?.data) ? userData.data[0] : userData?.data;
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        password: user.password,
        role_id: user.role_id,
        status: user.status,
      });
    }
  }, [userData, reset]);

  const onSubmit: SubmitHandler<EditUserFormValues> = async (values) => {
    try {
      if (!userId) {
        toast.error("User ID not found");
        return;
      }
      const res = await updateUser({ id: userId as string, body: values }).unwrap();

      if (res.status) {
        toast.success("User updated successfully");
        navigate("/dashboard/users/list");
      } else {
        toast.error("Failed to update user");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error while updating user");
    }
  };

  if (isUserLoading) return <p>Loading user...</p>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Edit User
          </h1>
          <p className="text-muted-foreground mt-2">Update user account profile and role assignment</p>
        </div>
        <Link to="/dashboard/users/list">
          <button className="px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Users
          </button>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="overflow-hidden border-2 transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b-1 border-blue-100 dark:border-blue-900 py-3 gap-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">User Details</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Name, email, password, and role</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-2 pb-6">

            {/* NAME */}
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Name</FieldLabel>
                  <Input placeholder="Full Name" {...field} />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {/* EMAIL */}
            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input placeholder="Email" {...field} />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <Input placeholder="******" {...field} />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {/* ROLE */}
            <Controller
              control={control}
              name="role_id"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Role</FieldLabel>

                  <Select
                    key={field.value}
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(val) => field.onChange(Number(val))}
                    disabled={!rolesData}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>

                    <SelectContent>
                      {Array.isArray(rolesData?.data) &&
                        rolesData.data.map((role) => (
                          <SelectItem key={role.id} value={String(role.id)}>
                            {role?.display_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>


                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="status"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Status</FieldLabel>

                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="active">
                        Active
                      </SelectItem>
                      <SelectItem value="terminated">
                        Terminated
                      </SelectItem>
                      <SelectItem value="on_leave">
                        On Leave
                      </SelectItem>
                    </SelectContent>
                  </Select>


                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="submit"
            disabled={isUpdating}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-500/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/50 active:translate-y-0 active:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
          >
            {isUpdating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Update User</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
