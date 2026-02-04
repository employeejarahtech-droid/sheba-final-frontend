import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  useGetSettingsInfoQuery,
  useUpdateSettingsInfoMutation,
} from "@/store/features/admin/settingsApiService";
import { toast } from "sonner";
import { useEffect } from "react";
import { setCurrency } from "@/store/currencySlice";
import { useAppDispatch } from "@/store/store";
import ImageUploaderPro from "@/components/form/ImageUploaderPro";

/* ------------------ ZOD SCHEMA ------------------ */
const profileSchema = z.object({
  company_name: z.string().min(1, "Required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  currency: z.string().optional(),
  logo_url: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

/* ------------------ PAGE ------------------ */
export default function EditProfilePage() {
  // const [logo, setLogo] = useState<string>('');

  const dispatch = useAppDispatch();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      company_name: "",
      email: "",
      phone: "",
      description: "",
      address: "",
      currency: "",
      logo_url: "",
    },
  });

  const { control, handleSubmit } = form;

  // const urls = watch("urls") || [];

  // const addUrl = () => setValue("urls", [...urls, ""]);
  // const removeUrl = (index: number) =>
  //   setValue(
  //     "urls",
  //     urls.filter((_, i) => i !== index)
  //   );

  const { data: companyProfileSettings } = useGetSettingsInfoQuery();

  console.log("companyProfileSettings", companyProfileSettings);

  const settings = companyProfileSettings?.data;

  useEffect(() => {
    if (settings) {
      form.reset({
        company_name: settings?.company_name,
        email: settings?.email,
        phone: settings?.phone,
        description: settings?.description,
        address: settings?.address,
        currency: settings?.currency,
        logo_url: settings?.logo_url,
      });
    }
  }, [settings, form]);


  const [updateCompanyProfile] = useUpdateSettingsInfoMutation();

  const onSubmit: SubmitHandler<ProfileFormValues> = async (values) => {
    console.log("Updated profile:", values);
    try {
      const res = await updateCompanyProfile(values).unwrap();
      console.log("Profile updated successfully:", res);
      if (res.status) {
        toast.success(res.message || "Profile updated successfully");
        dispatch(setCurrency(res.data.currency));
        // setLogo(res.data.logo_url);
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error?.data?.message || "Error updating profile");
    }
  };

  return (
    <div className=" py-6 px-4 space-y-6 max-w-[700px] w-full">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Company Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          This is how your company will be presented to others on the site. You
          can change this at any time.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Logo Preview */}

        {/* {logo && <img src={logo} alt="Logo Preview" />} */}

        {/* LOGO */}
        <Controller
          control={control}
          name="logo_url"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Company Logo</FieldLabel>
              <ImageUploaderPro value={field.value} onChange={field.onChange} />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />
        {/* USERNAME */}
        <Controller
          control={control}
          name="company_name"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Company Name</FieldLabel>
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
        {/* Address */}

        <Controller
          control={control}
          name="address"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Address</FieldLabel>
              <Textarea {...field} placeholder="Enter company address" />
              <FieldError>{fieldState?.error?.message}</FieldError>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea {...field} placeholder="Describe your company" />
              <FieldError>{fieldState?.error?.message}</FieldError>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="currency"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Currency</FieldLabel>
              <Input {...field} placeholder="i.e. USD" />
              <FieldError>{fieldState?.error?.message}</FieldError>
            </Field>
          )}
        />

        {/* URLs */}
        {/* <div>
          <h2 className="text-sm font-medium text-gray-700 mb-1">URLs</h2>
          <p className="text-xs text-gray-500 mb-2">
            Add links to your website, blog, or social media profiles.
          </p>
          {urls.map((_url, index) => (
            <Controller
              key={index}
              control={control}
              name={`urls.${index}`}
              render={({ field, fieldState }) => (
                <div className="flex gap-2 mb-2">
                  <Input {...field} placeholder="https://example.com" />
                  <Button type="button" variant="destructive" onClick={() => removeUrl(index)}>
                    Remove
                  </Button>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </div>
              )}
            />
          ))}
          <Button type="button" onClick={addUrl}>
            Add URL
          </Button>
        </div> */}

        {/* SUBMIT */}
        <div className="pt-4">
          <Button type="submit">Update profile</Button>
        </div>
      </form>
    </div>
  );
}
