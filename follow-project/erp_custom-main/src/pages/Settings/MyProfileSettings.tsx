import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
    useAuthUserQuery,
    useUpdateProfileMutation,
} from "@/store/features/auth/authApiService";
import { toast } from "sonner";
import { useEffect } from "react";
import ImageUploaderPro from "@/components/form/ImageUploaderPro";
import { Separator } from "@/components/ui/separator";

/* ------------------ ZOD SCHEMA ------------------ */
const profileSchema = z.object({
    name: z.string().min(1, "Required"),
    role: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().optional(),
    thumb_url: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

/* ------------------ PAGE ------------------ */
export default function EditProfilePage() {
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            role: "",
            email: "",
            phone: "",
            password: "",
            thumb_url: "",
        },
    });

    const { control, handleSubmit } = form;

    const { data: userInfo } = useAuthUserQuery();

    //console.log("currentUser", userInfo);

    const currentUser = userInfo?.data?.user;
    console.log("currentUser", currentUser);

    useEffect(() => {
        if (currentUser) {
            form.reset({
                name: currentUser?.name ?? "",
                role: currentUser?.role?.display_name ?? "",
                email: currentUser?.email ?? "",
                phone: currentUser?.phone ?? "",
                thumb_url: currentUser?.thumb_url ?? "",
            });
        }
    }, [currentUser, form]);


    const [updateProfile] = useUpdateProfileMutation();

    const onSubmit: SubmitHandler<ProfileFormValues> = async (values) => {
        console.log("Updated profile:", values);
        const payload = {
            name: values.name,
            email: values.email,
            phone: values.phone,
            password: values.password,
            thumb_url: values.thumb_url,
        };
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            //const { role, ...updateData } = values;
            const res = await updateProfile(payload).unwrap();
            console.log("Profile updated successfully:", res);
            if (res.status) {
                toast.success(res.message || "Profile updated successfully");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            const err = error as {
                data: {
                    message: string;
                };
            };
            toast.error(
                "Error updating profile:" +
                (err?.data?.message ?? "Something went wrong")
            );
        }
    };

    return (
        <div className=" py-6 px-4 space-y-6 max-w-[700px] w-full">
            <div className="space-y-0.5">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Settings
                </h1>
                <p className="text-muted-foreground">
                    Update your account details, preferences, and security settings.
                </p>
            </div>
            <Separator className="my-4 lg:my-6" />
            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-semibold">Personal Profile</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage your personal information and profile settings.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Logo Preview */}

                {/* {logo && <img src={logo} alt="Logo Preview" />} */}

                {/* LOGO */}
                <Controller
                    control={control}
                    name="thumb_url"
                    render={({ field, fieldState }) => (
                        <Field>
                            <FieldLabel>Profile Image</FieldLabel>
                            <ImageUploaderPro value={field.value} onChange={field.onChange} />
                            <FieldError>{fieldState.error?.message}</FieldError>
                        </Field>
                    )}
                />
                {/* USERNAME */}
                <Controller
                    control={control}
                    name="name"
                    render={({ field, fieldState }) => (
                        <Field>
                            <FieldLabel>Name</FieldLabel>
                            <Input
                                {...field}
                                placeholder="Enter your company name"
                                className="w-full"
                            />
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
                            <Input
                                {...field}
                                placeholder="Select a verified email to display"
                            />
                            <FieldError>{fieldState.error?.message}</FieldError>
                        </Field>
                    )}
                />

                {/* Phone */}
                <Controller
                    control={control}
                    name="phone"
                    render={({ field, fieldState }) => (
                        <Field>
                            <FieldLabel>Phone</FieldLabel>
                            <Input {...field} placeholder="i.e. +1 (555) 555-5555" />
                            <FieldError>{fieldState?.error?.message}</FieldError>
                        </Field>
                    )}
                />

                {/* Phone */}
                <Controller
                    control={control}
                    name="password"
                    render={({ field, fieldState }) => (
                        <Field>
                            <FieldLabel>Password</FieldLabel>
                            <Input type="password" {...field} placeholder="Enter your password" />
                            <FieldError>{fieldState?.error?.message}</FieldError>
                        </Field>
                    )}
                />

                <Controller
                    control={control}
                    name="role"
                    render={({ field, fieldState }) => (
                        <Field>
                            <FieldLabel>Role</FieldLabel>
                            <Input type="text" {...field} placeholder="Enter your role" disabled />
                            <FieldError>{fieldState?.error?.message}</FieldError>
                        </Field>
                    )}
                />

                {/* SUBMIT */}
                <div className="pt-4">
                    <Button type="submit">Update profile</Button>
                </div>
            </form>
        </div>
    );
}
