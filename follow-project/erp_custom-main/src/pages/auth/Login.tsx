import { LoginForm } from "@/components/auth/LoginForm";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Loader } from "lucide-react";
import { useGetSettingsInfoQuery } from "@/store/features/admin/settingsApiService";

export default function Login() {
  const navigate = useNavigate();
  const { data: companyProfileSettings } = useGetSettingsInfoQuery();
  console.log("companyProfileSettings", companyProfileSettings);
  const logo = companyProfileSettings?.data?.logo_url;
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 relative">
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <div className="flex w-full max-w-sm flex-col gap-4">
        <Link
          to="/"
          className="flex flex-col items-center gap-2 self-center font-medium text-xl"
        >
          <div className="flex items-center justify-center rounded-md">
            {logo ? (
              <img
                src={logo}
                alt={companyProfileSettings?.data?.company_name || "Logo"}
                className="w-20 h-20 object-contain rounded-full"
              />
            ) : (
              <div className="flex items-center justify-center">
                <Loader className="w-4 h-4 animate-spin" /> 
              </div>
            )}
          </div>
          {/* {companyProfileSettings?.data?.company_name || "Inleads IT"} */}
        </Link>
        <LoginForm />
      </div>
    </div>
  );
}
